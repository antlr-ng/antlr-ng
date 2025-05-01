/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { HashSet, OrderedHashSet, Token } from "antlr4ng";
import { ST, type STGroup } from "stringtemplate4ts";

import { Constants } from "../Constants.js";
import { Tool } from "../Tool.js";
import { Grammar } from "../tool/Grammar.js";
import { IssueCode } from "../tool/Issues.js";
import { OutputModelObject } from "./model/OutputModelObject.js";
import { OutputModelController } from "./OutputModelController.js";
import { ParserFactory } from "./ParserFactory.js";
import { Target } from "./Target.js";

// Possible targets:
import type { IndexedObject } from "src/support/helpers.js";
import type { IGenerationOptions } from "../config/config.js";
import { fileSystem } from "../tool-parameters.js";
import type { IGenerationVariables, ITargetGenerator, ITargetGeneratorCallables } from "./ITargetGenerator.js";
import { CppTarget } from "./target/CppTarget.js";
import { CSharpTarget } from "./target/CSharpTarget.js";
import { DartTarget } from "./target/DartTarget.js";
import { GoTarget } from "./target/GoTarget.js";
import { JavaScriptTarget } from "./target/JavaScriptTarget.js";
import { JavaTarget } from "./target/JavaTarget.js";
import { PHPTarget } from "./target/PHPTarget.js";
import { Python3Target } from "./target/Python3Target.js";
import { SwiftTarget } from "./target/SwiftTarget.js";
import { TypeScriptTarget } from "./target/TypeScriptTarget.js";

export const targetLanguages = [
    "Cpp", "CSharp", "Dart", "Go", "JavaScript", "Java", "PHP", "Python3", "Swift", "TypeScript"
] as const;

export type SupportedLanguage = typeof targetLanguages[number];

/**  General controller for code gen.  Can instantiate sub generator(s). */
export class CodeGenerator {
    private static readonly vocabFilePattern =
        "<tokens.keys:{t | <t>=<tokens.(t)>\n}>" +
        "<literals.keys:{t | <t>=<literals.(t)>\n}>";

    private static languageMap = new Map<SupportedLanguage, new (generator: CodeGenerator) => Target>([
        ["Cpp", CppTarget],
        ["CSharp", CSharpTarget],
        ["Dart", DartTarget],
        ["Go", GoTarget],
        ["JavaScript", JavaScriptTarget],
        ["Java", JavaTarget],
        ["PHP", PHPTarget],
        ["Python3", Python3Target],
        ["Swift", SwiftTarget],
        ["TypeScript", TypeScriptTarget],
    ]);

    public target: Target;
    public readonly g?: Grammar;
    public readonly language: SupportedLanguage;

    private readonly tool?: Tool;

    public constructor(grammarOrLanguage: Grammar | SupportedLanguage,
        public readonly targetGenerator: ITargetGenerator) {
        this.g = grammarOrLanguage instanceof Grammar ? grammarOrLanguage : undefined;
        this.tool = this.g?.tool;

        this.language = (grammarOrLanguage instanceof Grammar) ? this.g!.getLanguage() : grammarOrLanguage;
        this.target = new (CodeGenerator.languageMap.get(this.language)!)(this);
    }

    public get templates(): STGroup {
        return this.target.templates;
    }

    public get forJava(): boolean {
        return this.targetGenerator.language === "Java";
    }

    public generateLexer(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController(options.atn).buildLexerOutputModel(declaration, options);

        return this.targetGenerator.renderLexerFile(model, declaration);
    }

    public generateParser(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildParserOutputModel(declaration, options);

        return this.targetGenerator.renderParserFile(model, declaration);
    }

    public generateListener(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildListenerOutputModel(declaration, options);

        return this.targetGenerator.renderListenerFile(model, declaration);
    }

    public generateBaseListener(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildBaseListenerOutputModel(declaration, options.package);

        return this.targetGenerator.renderBaseListenerFile(model, declaration);
    }

    public generateVisitor(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildVisitorOutputModel(declaration, options);

        return this.targetGenerator.renderVisitorFile(model, declaration);
    }

    public generateBaseVisitor(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildBaseVisitorOutputModel(declaration, options);

        return this.targetGenerator.renderBaseVisitorFile(model, declaration);
    }

    public writeRecognizer(generatedText: string, header: boolean): void {
        this.target.genFile(this.g, generatedText, this.getRecognizerFileName(header));
    }

    public writeListener(generatedText: string, header: boolean): void {
        this.target.genFile(this.g, generatedText, this.getListenerFileName(header));
    }

    public writeBaseListener(generatedText: string, header: boolean): void {
        this.target.genFile(this.g, generatedText, this.getBaseListenerFileName(header));
    }

    public writeVisitor(generatedText: string, header: boolean): void {
        this.target.genFile(this.g, generatedText, this.getVisitorFileName(header));
    }

    public writeBaseVisitor(generatedText: string, header: boolean): void {
        this.target.genFile(this.g, generatedText, this.getBaseVisitorFileName(header));
    }

    /**
     * Writes out the vocab interchange file, used by antlr-ng.
     * Does not change per target.
     */
    public writeVocabFile(): void {
        const tokenVocabSerialization = this.getTokenVocabOutput();
        const fileName = this.getVocabFileName();
        if (fileName) {
            this.target.genFile(this.g, tokenVocabSerialization.render(), fileName);
        }
    }

    public write(code: string, fileName: string): void {
        if (this.tool === undefined) {
            return;
        }

        try {
            fileName = this.tool.getOutputFile(this.g!, fileName);
            fileSystem.writeFileSync(fileName, code, { encoding: "utf8" });
        } catch (cause) {
            if (cause instanceof Error) {
                this.g!.tool.errorManager.toolError(IssueCode.CannotWriteFile, cause, fileName);
            } else {
                throw cause;
            }
        }
    }

    public getRecognizerFileName(header?: boolean): string {
        header ??= false;

        return this.target.getRecognizerFileName(this.targetGenerator, header);
    }

    public getListenerFileName(header?: boolean): string {
        header ??= false;

        return this.target.getListenerFileName(this.targetGenerator, header);
    }

    public getVisitorFileName(header?: boolean): string {
        header ??= false;

        return this.target.getVisitorFileName(this.targetGenerator, header);
    }

    public getBaseListenerFileName(header?: boolean): string {
        header ??= false;

        return this.target.getBaseListenerFileName(this.targetGenerator, header);
    }

    public getBaseVisitorFileName(header?: boolean): string {
        header ??= false;

        return this.target.getBaseVisitorFileName(this.targetGenerator, header);
    }

    /**
     * What is the name of the vocab file generated for this grammar?
     *
     * @returns undefined if no ".tokens" file should be generated.
     */
    public getVocabFileName(): string | undefined {
        return this.g!.name + Constants.VocabFileExtension;
    }

    public getHeaderFileName(): string | undefined {
        const extST = this.templates.getInstanceOf("headerFileExtension");
        if (extST === null) {
            return undefined;
        }

        const recognizerName = this.g!.getRecognizerName();

        return recognizerName + extST.render();
    }

    /**
     * Generates a token vocab file with all the token names/types. For example:
     * ```
     *  ID=7
     *  FOR=8
     *  'for'=8
     * ```
     * This is independent of the target language and used by antlr internally.
     *
     * @returns The token vocab file as a string template.
     */
    protected getTokenVocabOutput(): ST {
        const vocabFileST = new ST(CodeGenerator.vocabFilePattern);
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

    private createController(forceAtn?: boolean): OutputModelController {
        const factory = new ParserFactory(this, forceAtn);
        const controller = new OutputModelController(factory);
        factory.controller = controller;

        return controller;
    }

    private ensureAtnExists(): void {
        if (this.g === undefined) {
            throw new Error("Grammar is undefined.");
        }

        if (this.g.atn === undefined) {
            throw new Error("ATN is undefined.");
        }
    }

    private walk(model: OutputModelObject, variables: IGenerationVariables): string {
        const omo = model as IndexedObject<OutputModelObject>;
        const generateMethod = "render" + omo.constructor.name;
        const parameterFields = omo.parameterFields;

        // Walk over all parameter fields of the model object and render sub elements.
        const parameters: Array<string | Map<string, string> | string[] | undefined> = [];
        for (const fieldName of parameterFields) {
            const o = omo[fieldName];
            if (o === undefined) {
                parameters.push(undefined);
            } else if (o instanceof OutputModelObject) { // Single model object?
                const renderedOMO = this.walk(o, { ...variables });
                parameters.push(renderedOMO);
            } else if (o instanceof Set || o instanceof HashSet || o instanceof OrderedHashSet || Array.isArray(o)) {
                // All set and array elements are model objects.
                const list: string[] = [];
                for (const nestedOmo of o) {
                    if (!nestedOmo) {
                        continue;
                    }

                    const renderedElement = this.walk(nestedOmo as OutputModelObject, variables);
                    list.push(renderedElement);
                }

                parameters.push(list);
            } else if (o instanceof Map) {
                const nestedOmoMap = o as Map<string, OutputModelObject>;
                const renderedRecord = new Map<string, string>();
                for (const [key, value] of nestedOmoMap) {
                    const renderedElement = this.walk(value, variables);
                    renderedRecord.set(key, renderedElement);
                }
                parameters.push(renderedRecord);
            }
        }

        return this.callGeneratorMethod(generateMethod as keyof ITargetGeneratorCallables, omo, variables,
            ...parameters);
    }

    private callGeneratorMethod<K extends keyof ITargetGeneratorCallables>(methodName: K,
        ...args: unknown[]): string {

        const method = this.targetGenerator[methodName] as ((...args: unknown[]) => string) | undefined;

        if (method === undefined) {
            throw new Error(`Method ${methodName} is not defined on this target generator.`);
        }

        return method.apply(this.targetGenerator, args) as string;
    }
}
