/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns */

import { writeFileSync } from "node:fs";

import { Token } from "antlr4ng";
import { AutoIndentWriter, ST, StringWriter, type IST, type STGroup } from "stringtemplate4ts";

import { Constants } from "../Constants.js";
import { Tool } from "../Tool.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { OutputModelObject } from "./model/OutputModelObject.js";
import { OutputModelController } from "./OutputModelController.js";
import { OutputModelWalker } from "./OutputModelWalker.js";
import { ParserFactory } from "./ParserFactory.js";
import { Target } from "./Target.js";

// Possible targets:
import type { IToolParameters } from "../tool-parameters.js";
import { CppTarget } from "./target/CppTarget.js";
import { CSharpTarget } from "./target/CSharpTarget.js";
import { GoTarget } from "./target/GoTarget.js";
import { JavaScriptTarget } from "./target/JavaScriptTarget.js";
import { JavaTarget } from "./target/JavaTarget.js";
import { PHPTarget } from "./target/PHPTarget.js";
import { Python3Target } from "./target/Python3Target.js";
import { SwiftTarget } from "./target/SwiftTarget.js";
import { TypeScriptTarget } from "./target/TypeScriptTarget.js";

export const targetLanguages = [
    "Cpp", "CSharp", "Go", "JavaScript", "Java", "PHP", "Python3", "Swift", "TypeScript"
] as const;

export type SupportedLanguage = typeof targetLanguages[number];

/**  General controller for code gen.  Can instantiate sub generator(s). */
export class CodeGenerator {
    public readonly g?: Grammar;

    public readonly tool: Tool;

    public readonly language: SupportedLanguage;

    public lineWidth = 72;

    private target: Target;

    static readonly #vocabFilePattern =
        "<tokens.keys:{t | <t>=<tokens.(t)>\n}>" +
        "<literals.keys:{t | <t>=<literals.(t)>\n}>";

    static #languageMap = new Map<SupportedLanguage, new (generator: CodeGenerator) => Target>([
        ["Cpp", CppTarget],
        ["CSharp", CSharpTarget],
        ["Go", GoTarget],
        ["JavaScript", JavaScriptTarget],
        ["Java", JavaTarget],
        ["PHP", PHPTarget],
        ["Python3", Python3Target],
        ["Swift", SwiftTarget],
        ["TypeScript", TypeScriptTarget],
    ]);

    public constructor(g: Grammar);
    public constructor(tool: Tool, g: Grammar | undefined, language: SupportedLanguage);
    public constructor(toolOrGrammar: Tool | Grammar, g?: Grammar, language?: SupportedLanguage) {
        if (toolOrGrammar instanceof Grammar) {
            this.g = toolOrGrammar;
            this.tool = this.g.tool;
            this.language = toolOrGrammar.getLanguage() ?? "Java";
        } else {
            this.g = g;
            this.tool = toolOrGrammar;
            this.language = language!;
        }

        this.target = new (CodeGenerator.#languageMap.get(this.language)!)(this);
    }

    public getTarget(): Target {
        return this.target;
    }

    public getTemplates(): STGroup {
        return this.target.getTemplates();
    }

    public generateLexer(toolParameters: IToolParameters, header?: boolean): IST {
        header ??= false;

        return this.walk(this.createController(toolParameters.forceAtn)
            .buildLexerOutputModel(header, toolParameters), header);

    }

    public generateParser(toolParameters: IToolParameters, header?: boolean): IST {
        header ??= false;

        return this.walk(this.createController().buildParserOutputModel(header, toolParameters), header);
    }

    public generateListener(header?: boolean): IST {
        header ??= false;

        return this.walk(this.createController().buildListenerOutputModel(header), header);

    }

    public generateBaseListener(header?: boolean): IST {
        header ??= false;

        return this.walk(this.createController().buildBaseListenerOutputModel(header), header);
    }

    public generateVisitor(header?: boolean): IST {
        header ??= false;

        return this.walk(this.createController().buildVisitorOutputModel(header), header);
    }

    public generateBaseVisitor(header?: boolean): IST {
        header ??= false;

        return this.walk(this.createController().buildBaseVisitorOutputModel(header), header);
    }

    public writeRecognizer(outputFileST: IST, header: boolean): void {
        this.target.genFile(this.g, outputFileST, this.getRecognizerFileName(header));
    }

    public writeListener(outputFileST: IST, header: boolean): void {
        this.target.genFile(this.g, outputFileST, this.getListenerFileName(header));
    }

    public writeBaseListener(outputFileST: IST, header: boolean): void {
        this.target.genFile(this.g, outputFileST, this.getBaseListenerFileName(header));
    }

    public writeVisitor(outputFileST: IST, header: boolean): void {
        this.target.genFile(this.g, outputFileST, this.getVisitorFileName(header));
    }

    public writeBaseVisitor(outputFileST: IST, header: boolean): void {
        this.target.genFile(this.g, outputFileST, this.getBaseVisitorFileName(header));
    }

    public writeVocabFile(): void {
        // write out the vocab interchange file; used by antlr,
        // does not change per target
        const tokenVocabSerialization = this.getTokenVocabOutput();
        const fileName = this.getVocabFileName();
        if (fileName !== undefined) {
            this.target.genFile(this.g, tokenVocabSerialization, fileName);
        }
    }

    public write(code: IST, fileName: string): void {
        try {
            fileName = this.tool.getOutputFile(this.g!, fileName);
            const w = new StringWriter();
            const wr = new AutoIndentWriter(w);
            wr.setLineWidth(this.lineWidth);
            code.write(wr);

            writeFileSync(fileName, w.toString(), "utf8");
        } catch (cause) {
            if (cause instanceof Error) {
                this.g!.tool.errorManager.toolError(ErrorType.CANNOT_WRITE_FILE, cause, fileName);
            } else {
                throw cause;
            }
        }
    }

    public getRecognizerFileName(header?: boolean): string {
        header ??= false;

        return this.target.getRecognizerFileName(header);
    }

    public getListenerFileName(header?: boolean): string {
        header ??= false;

        return this.target.getListenerFileName(header);
    }

    public getVisitorFileName(header?: boolean): string {
        header ??= false;

        return this.target.getVisitorFileName(header);
    }

    public getBaseListenerFileName(header?: boolean): string {
        header ??= false;

        return this.target.getBaseListenerFileName(header);
    }

    public getBaseVisitorFileName(header?: boolean): string {
        header ??= false;

        return this.target.getBaseVisitorFileName(header);
    }

    /**
     * What is the name of the vocab file generated for this grammar?
     * Returns undefined if no ".tokens" file should be generated.
     */
    public getVocabFileName(): string | undefined {
        return this.g!.name + Constants.VOCAB_FILE_EXTENSION;
    }

    public getHeaderFileName(): string | undefined {
        const extST = this.getTemplates().getInstanceOf("headerFileExtension");
        if (extST === null) {
            return undefined;
        }

        const recognizerName = this.g!.getRecognizerName();

        return recognizerName + extST.render();
    }

    /**
     * Generate a token vocab file with all the token names/types. For example:
     *  ID=7
     *  FOR=8
     *  'for'=8
     *
     *  This is independent of the target language and used by antlr internally.
     */
    protected getTokenVocabOutput(): ST {
        const vocabFileST = new ST(CodeGenerator.#vocabFilePattern);
        const tokens = new Map<string, number>();

        // Make constants for the token names.
        for (const [key, value] of this.g!.tokenNameToTypeMap) {
            if (value >= Token.MIN_USER_TOKEN_TYPE) {
                tokens.set(key, value);
            }
        }
        vocabFileST.add("tokens", tokens);

        // Now dump the strings.
        const literals = new Map<string, number>();
        for (const [key, value] of this.g!.stringLiteralToTypeMap) {
            if (value >= Token.MIN_USER_TOKEN_TYPE) {
                literals.set(key, value);
            }
        }
        vocabFileST.add("literals", literals);

        return vocabFileST;
    }

    // CREATE TEMPLATES BY WALKING MODEL

    private createController(forceAtn?: boolean): OutputModelController {
        const factory = new ParserFactory(this, forceAtn);
        const controller = new OutputModelController(factory);
        factory.setController(controller);

        return controller;
    }

    private walk(outputModel: OutputModelObject, header: boolean): IST {
        const walker = new OutputModelWalker(this.tool, this.getTemplates());

        return walker.walk(outputModel, header);
    }

}
