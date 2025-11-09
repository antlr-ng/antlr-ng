/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ATNSerializer, Token } from "antlr4ng";

import { Constants } from "../Constants.js";
import { Grammar } from "../tool/Grammar.js";
import { IssueCode } from "../tool/Issues.js";
import { OutputModelController } from "./OutputModelController.js";
import { ParserFactory } from "./ParserFactory.js";

import type { IGenerationOptions } from "../config/config.js";
import { dirname } from "../support/fs-helpers.js";
import { convertArrayToString } from "../support/helpers.js";
import { fileSystem } from "../tool-parameters.js";
import { DOTGenerator } from "../tool/DOTGenerator.js";
import { LexerGrammar } from "../tool/LexerGrammar.js";
import type { ITargetGenerator } from "./ITargetGenerator.js";

export const targetLanguages = [
    "Cpp", "CSharp", "Dart", "Go", "JavaScript", "Java", "PHP", "Python3", "Swift", "TypeScript"
] as const;

export type SupportedLanguage = typeof targetLanguages[number];

/**  General controller for code gen. */
export class CodeGenerator {
    public readonly language: SupportedLanguage;

    public constructor(private g: Grammar, public readonly targetGenerator: ITargetGenerator,
        public readonly generationOptions: IGenerationOptions) {

        this.language = this.g.getLanguage();
    }

    public get forJava(): boolean {
        return this.targetGenerator.language === "Java";
    }

    public generateLexer(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController(options.atn).buildLexerOutputModel(declaration);

        return this.targetGenerator.renderLexerFile(model, declaration, options);
    }

    public generateParser(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildParserOutputModel(declaration, options);

        return this.targetGenerator.renderParserFile(model, declaration, options);
    }

    public generateListener(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildListenerOutputModel(declaration);

        return this.targetGenerator.renderListenerFile(model, declaration, options);
    }

    public generateBaseListener(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildBaseListenerOutputModel(declaration);

        return this.targetGenerator.renderBaseListenerFile(model, declaration, options);
    }

    public generateVisitor(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildVisitorOutputModel(declaration);

        return this.targetGenerator.renderVisitorFile(model, declaration, options);
    }

    public generateBaseVisitor(options: IGenerationOptions, declaration?: boolean): string {
        this.ensureAtnExists();
        declaration ??= false;

        const model = this.createController().buildBaseVisitorOutputModel(declaration);

        return this.targetGenerator.renderBaseVisitorFile(model, declaration, options);
    }

    public generateInterpreterData(g: Grammar): void {
        let content = "";

        content += "token literal names:\n";
        let names = g.getTokenLiteralNames();
        content += names.reduce((previousValue, currentValue) => {
            return previousValue + (currentValue ?? "null") + "\n";
        }, "") + "\n";

        content += "token symbolic names:\n";
        names = g.getTokenSymbolicNames();
        content += names.reduce((previousValue, currentValue) => {
            return previousValue + (currentValue ?? "null") + "\n";
        }, "") + "\n";

        content += "rule names:\n";
        names = g.getRuleNames();
        content += names.reduce((previousValue, currentValue) => {
            return previousValue + (currentValue ?? "null") + "\n";
        }, "") + "\n";

        if (g.isLexer()) {
            content += "channel names:\n";
            content += "DEFAULT_TOKEN_CHANNEL\n";
            content += "HIDDEN\n";
            content += g.channelValueToNameList.join("\n") + "\n";
            content += "mode names:\n";

            if (this.g instanceof LexerGrammar) {
                content += [...this.g.modes.keys()].join("\n") + "\n";
            }
        }
        content += "\n";

        const serializedATN = ATNSerializer.getSerialized(g.atn!);
        content += "atn:\n";
        content += convertArrayToString(serializedATN);

        try {
            const fileName = this.getOutputFile(g, g.name + ".interp");
            fileSystem.writeFileSync(fileName, content);
        } catch (ioe) {
            this.g.tool.errorManager.toolError(IssueCode.CannotWriteFile, ioe as Error);
        }
    }

    /**
     * Generates .dot files for all rules in the grammar and its imports.
     *
     * @param g The grammar to generate the .dot files for.
     */
    public generateATNDotFiles(g: Grammar): void {
        const dotGenerator = new DOTGenerator(g);
        const grammars = new Array<Grammar>();
        grammars.push(g);
        const imported = g.getAllImportedGrammars();
        grammars.push(...imported);

        for (const ig of grammars) {
            for (const r of ig.rules.values()) {
                try {
                    const dot = dotGenerator.getDOTFromState(g.atn!.ruleToStartState[r.index]!, g.isLexer());
                    const name = r.g.name + "." + r.name;
                    const fileName = this.getOutputFile(g, name + ".dot");
                    fileSystem.writeFileSync(fileName, dot);
                } catch (ioe) {
                    this.g.tool.errorManager.toolError(IssueCode.CannotWriteFile, ioe as Error);
                    throw ioe;
                }
            }
        }
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
        const fileName = this.getVocabFileName();
        if (fileName) {
            const tokenVocabSerialization = this.getTokenVocabOutput();
            this.writeFile(tokenVocabSerialization, fileName);
        }
    }

    public writeFile(code: string, fileName: string): void {
        try {
            fileName = this.getOutputFile(this.g, fileName);
            fileSystem.writeFileSync(fileName, code, { encoding: "utf8" });
        } catch (cause) {
            if (cause instanceof Error) {
                this.g.tool.errorManager.toolError(IssueCode.CannotWriteFile, cause, fileName);
            } else {
                throw cause;
            }
        }
    }

    public getRecognizerFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getRecognizerFileName(declarationFile ?? false, this.g.getRecognizerName());
    }

    public getListenerFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getListenerFileName(declarationFile ?? false, this.g.name);
    }

    public getVisitorFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getVisitorFileName(declarationFile ?? false, this.g.name);
    }

    public getBaseListenerFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getBaseListenerFileName(declarationFile ?? false, this.g.name);
    }

    public getBaseVisitorFileName(declarationFile?: boolean): string {
        return this.targetGenerator.getBaseVisitorFileName(declarationFile ?? false, this.g.name);
    }

    /**
     * What is the name of the vocab file generated for this grammar?
     *
     * @returns undefined if no ".tokens" file should be generated.
     */
    public getVocabFileName(): string | undefined {
        return this.g.name + Constants.VocabFileExtension;
    }

    /**
     * @returns the location where antlr-ng will generate output files for a given grammar.
     * This is either the output directory specified in the configuration or the directory of the input file.
     *
     * @param fileNameWithPath path to input source.
     */
    public getOutputDirectory(fileNameWithPath: string): string {
        if (this.generationOptions.outputDirectory) {
            return this.generationOptions.outputDirectory;
        }

        return dirname(fileNameWithPath);
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
        for (const key of this.g.tokenNameToTypeMap.keys()) {
            if (key.length > longestNameLength) {
                longestNameLength = key.length;
            }
        }

        for (const key of this.g.stringLiteralToTypeMap.keys()) {
            if (key.length > longestNameLength) {
                longestNameLength = key.length;
            }
        }

        // Make constants for the token names.
        for (const [key, value] of this.g.tokenNameToTypeMap) {
            if (value >= Token.MIN_USER_TOKEN_TYPE) {
                lines.push(`${key.padEnd(longestNameLength, " ")} = ${value}`);
            }
        }

        // Ditto for the strings.
        for (const [key, value] of this.g.stringLiteralToTypeMap) {
            if (value >= Token.MIN_USER_TOKEN_TYPE) {
                lines.push(`${key.padEnd(longestNameLength, " ")} = ${value}`);
            }
        }

        return lines.join("\n");
    }

    /**
     * This method is used by all code generators that create output files. If the specified outputDir is not present
     * it will be created (recursively).
     *
     * If the output path is relative, it will be resolved relative to the current working directory.
     *
     * If no output dir is specified, then just write to the directory where the grammar file was found.
     *
     * @param g The grammar for which we are generating a file.
     * @param fileName The name of the file to generate.
     *
     * @returns The full path to the output file.
     */
    private getOutputFile(g: Grammar, fileName: string): string {
        const outputDir = this.getOutputDirectory(g.fileName);
        const outputFile = outputDir + "/" + fileName;

        if (!fileSystem.existsSync(outputDir)) {
            fileSystem.mkdirSync(outputDir, { recursive: true });
        }

        return outputFile;
    }

    private createController(forceAtn?: boolean): OutputModelController {
        const factory = new ParserFactory(this, this.g, forceAtn);
        const controller = new OutputModelController(factory, this.g.tool.errorManager, this.g);
        factory.controller = controller;

        return controller;
    }

    private ensureAtnExists(): void {
        if (this.g.atn === undefined) {
            throw new Error("ATN is undefined.");
        }
    }

}
