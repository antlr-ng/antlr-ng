/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Token } from "antlr4ng";

import { Constants } from "../Constants.js";
import { Tool } from "../Tool.js";
import { Grammar } from "../tool/Grammar.js";
import { IssueCode } from "../tool/Issues.js";
import { OutputModelController } from "./OutputModelController.js";
import { ParserFactory } from "./ParserFactory.js";

// Possible targets:
import type { IGenerationOptions } from "../config/config.js";
import { fileSystem } from "../tool-parameters.js";
import type { ITargetGenerator } from "./ITargetGenerator.js";

export const targetLanguages = [
    "Cpp", "CSharp", "Dart", "Go", "JavaScript", "Java", "PHP", "Python3", "Swift", "TypeScript"
] as const;

export type SupportedLanguage = typeof targetLanguages[number];

/**  General controller for code gen. Can instantiate sub generator(s). */
export class CodeGenerator {
    public readonly g?: Grammar;
    public readonly language: SupportedLanguage;

    private readonly tool?: Tool;

    public constructor(grammarOrLanguage: Grammar | SupportedLanguage,
        public readonly targetGenerator: ITargetGenerator) {
        this.g = grammarOrLanguage instanceof Grammar ? grammarOrLanguage : undefined;
        this.tool = this.g?.tool;

        this.language = (grammarOrLanguage instanceof Grammar) ? this.g!.getLanguage() : grammarOrLanguage;
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
        this.writeFile(generatedText, this.getRecognizerFileName(header));
    }

    public writeListener(generatedText: string, header: boolean): void {
        this.writeFile(generatedText, this.getListenerFileName(header));
    }

    public writeBaseListener(generatedText: string, header: boolean): void {
        this.writeFile(generatedText, this.getBaseListenerFileName(header));
    }

    public writeVisitor(generatedText: string, header: boolean): void {
        this.writeFile(generatedText, this.getVisitorFileName(header));
    }

    public writeBaseVisitor(generatedText: string, header: boolean): void {
        this.writeFile(generatedText, this.getBaseVisitorFileName(header));
    }

    /**
     * Writes out the vocab interchange file, used by antlr-ng.
     * Does not change per target.
     */
    public writeVocabFile(): void {
        const tokenVocabSerialization = this.getTokenVocabOutput();
        const fileName = this.getVocabFileName();
        if (fileName) {
            this.writeFile(tokenVocabSerialization, fileName);
        }
    }

    public writeFile(code: string, fileName: string): void {
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

    public getRecognizerFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getRecognizerFileName(declarationFile ?? false, this.g!.getRecognizerName());
    }

    public getListenerFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getListenerFileName(declarationFile ?? false, this.g!.name);
    }

    public getVisitorFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getVisitorFileName(declarationFile ?? false, this.g!.name);
    }

    public getBaseListenerFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getBaseListenerFileName(declarationFile ?? false, this.g!.name);
    }

    public getBaseVisitorFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getBaseVisitorFileName(declarationFile ?? false, this.g!.name);
    }

    /**
     * What is the name of the vocab file generated for this grammar?
     *
     * @returns undefined if no ".tokens" file should be generated.
     */
    public getVocabFileName(): string | undefined {
        return this.g!.name + Constants.VocabFileExtension;
    }

    /**
     * Generates a token vocab file with all the token names/types. For example:
     * ```
     *  ID=7
     *  FOR=8
     *  'for'=8
     * ```
     * This is independent of the target language and used by antlr-ng internally.
     *
     * @returns The token vocab file as a string template.
     */
    protected getTokenVocabOutput(): string {
        const lines: string[] = [];

        // Determine the longest token name length, so we can align the output.
        let longestNameLength = 0;
        for (const key of this.g!.tokenNameToTypeMap.keys()) {
            if (key.length > longestNameLength) {
                longestNameLength = key.length;
            }
        }

        for (const key of this.g!.stringLiteralToTypeMap.keys()) {
            if (key.length > longestNameLength) {
                longestNameLength = key.length;
            }
        }

        // Make constants for the token names.
        for (const [key, value] of this.g!.tokenNameToTypeMap) {
            if (value >= Token.MIN_USER_TOKEN_TYPE) {
                lines.push(`${key.padEnd(longestNameLength, " ")} = ${value}`);
            }
        }

        // Ditto for the strings.
        for (const [key, value] of this.g!.stringLiteralToTypeMap) {
            if (value >= Token.MIN_USER_TOKEN_TYPE) {
                lines.push(`${key.padEnd(longestNameLength, " ")} = ${value}`);
            }
        }

        return lines.join("\n");
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
}
