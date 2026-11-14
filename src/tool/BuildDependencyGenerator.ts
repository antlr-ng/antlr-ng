/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ITargetGenerator } from "src/codegen/ITargetGenerator.js";
import type { IGenerationOptions } from "src/config/config.js";
import { Constants } from "../Constants.js";
import { Tool } from "../Tool.js";
import { CodeGenerator } from "../codegen/CodeGenerator.js";
import { GrammarType } from "../support/GrammarType.js";
import { Grammar } from "./Grammar.js";

/**
 * Given a grammar file, lists the files it depends on and the files antlr-ng generates for it, in a simple make
 * compatible format. For example, combined grammar T.g4 (no token import) with the TypeScript target generates:
 *
 *    TParser.ts : T.g4
 *    T.tokens : T.g4
 *    TLexer.ts : T.g4
 *    TLexer.tokens : T.g4
 *
 * The listener, visitor, base listener and base visitor files, declaration files (e.g. C++ headers) and interpreter
 * data files are added when the generation options ask for them, just like the code generation does.
 *
 * If the grammar uses option tokenVocab=A or imports other grammars, the first line lists them, with the lib
 * directory when one is configured:
 *
 *    T.g4: libDir/A.tokens
 *
 * Generated files are in the output directory:
 *
 *    output-dir/TParser.ts : T.g4
 *
 * Operate on one grammar file at a time. The grammars may depend on each other, but the order doesn't matter. Build
 * tools, reading in this output, will know how to organize it.
 */
export class BuildDependencyGenerator {
    protected generator: CodeGenerator;

    public constructor(private tool: Tool, private g: Grammar, private options: IGenerationOptions,
        targetGenerator: ITargetGenerator,
        private libDir?: string) {
        this.generator = new CodeGenerator(g, targetGenerator, options);
    }

    /**
     * @returns the names of the files antlr-ng writes for the grammar, as the code generation pipeline writes them.
     */
    public getGeneratedFileList(): string[] {
        const files: string[] = [];
        const targetGenerator = this.generator.targetGenerator;

        // Declaration files are only separate files for targets which use them (e.g. C++ header files).
        const declarations = this.options.generateDeclarationFile && targetGenerator.needsDeclarationFile === true;
        const addCodeFile = (getFileName: (declaration: boolean) => string): void => {
            if (declarations) {
                files.push(this.getOutputFile(getFileName(true)));
            }
            files.push(this.getOutputFile(getFileName(false)));
        };

        // A combined grammar generates the files of its implicit lexer too, e.g. TLexer.ts and TLexer.tokens.
        const recognizerNames = [this.g.getRecognizerName()];
        if (this.g.isCombined()) {
            recognizerNames.push(this.g.name + Grammar.getGrammarTypeToFileNameSuffix(GrammarType.Lexer));
        }

        for (const recognizerName of recognizerNames) {
            // The vocabulary file is named after the grammar, e.g. T.tokens for the parser of T.g4.
            const baseName = recognizerName === this.g.getRecognizerName() ? this.g.name : recognizerName;

            if (!this.g.isCodeGenerationDisabled()) {
                addCodeFile((declaration) => {
                    return targetGenerator.getRecognizerFileName(declaration, recognizerName);
                });
            }

            files.push(this.getOutputFile(baseName + Constants.VocabFileExtension));

            if (this.options.generateInterpreterData || this.g.isCodeGenerationDisabled()) {
                files.push(this.getOutputFile(baseName + ".interp"));
            }
        }

        // Only parsers have listeners and visitors.
        if (!this.g.isLexer() && !this.g.isCodeGenerationDisabled()) {
            if (this.options.generateListener) {
                addCodeFile((declaration) => {
                    return this.generator.getListenerFileName(declaration);
                });

                if (this.options.generateBaseListener) {
                    addCodeFile((declaration) => {
                        return this.generator.getBaseListenerFileName(declaration);
                    });
                }
            }

            if (this.options.generateVisitor) {
                addCodeFile((declaration) => {
                    return this.generator.getVisitorFileName(declaration);
                });

                if (this.options.generateBaseVisitor) {
                    addCodeFile((declaration) => {
                        return this.generator.getBaseVisitorFileName(declaration);
                    });
                }
            }
        }

        return files;
    }

    /**
     * @param fileName The name of a generated file.
     *
     * @returns The path of the file in the output directory, with spaces escaped for make.
     */
    public getOutputFile(fileName: string): string {
        return this.groomQualifiedFileName(this.generator.getOutputDirectory(this.g.fileName), fileName);
    }

    /**
     * @returns a list of urls that name files antlr-ng will read to process T.g. This can be .tokens files if the
     * grammar uses the tokenVocab option as well as any imported grammar files.
     */
    public getDependenciesFileList(): string[] {
        // Find all the things other than imported grammars.
        const files = this.getNonImportDependenciesFileList();

        // Handle imported grammars.
        const imports = this.g.getAllImportedGrammars();
        const libDirectory = this.libDir ?? ".";
        for (const g of imports) {
            const fileName = this.groomQualifiedFileName(libDirectory, g.fileName);
            files.push(fileName);
        }

        return files;
    }

    /**
     * Return a list of File objects that name files antlr-ng will read to process T.g; This can only be .tokens files
     * and only if they use the tokenVocab option.
     *
     * @returns List of dependencies other than imported grammars
     */
    public getNonImportDependenciesFileList(): string[] {
        const files: string[] = [];

        // Handle token vocabulary loads.
        const tokenVocab = this.g.getOptionString("tokenVocab");
        if (tokenVocab !== undefined) {
            const fileName = tokenVocab + Constants.VocabFileExtension;
            const libDirectory = this.libDir ?? ".";
            if (libDirectory === ".") {
                files.push(fileName);
            } else {
                files.push(libDirectory + "/" + fileName);
            }
        }

        return files;
    }

    public getDependencies(): string {
        const inputFiles = this.getDependenciesFileList();
        const result: string[] = [];

        // Make syntax: the grammar depends on these files.
        if (inputFiles.length > 0) {
            result.push(`${this.g.fileName}: ${inputFiles.join(", ")}`);
        }

        const outputFiles = this.getGeneratedFileList();
        outputFiles.forEach((file) => {
            result.push(`${file} : ${this.g.fileName}`);
        });

        return result.join("\n");
    }

    public getGenerator(): CodeGenerator {
        return this.generator;
    }

    private groomQualifiedFileName(outputDir: string, fileName: string): string {
        outputDir = outputDir.replace(/(?<=.)\/+$/, "");
        if (outputDir === ".") {
            return fileName;
        } else if (outputDir.includes(" ")) { // Has spaces?
            const escSpaces = outputDir.replaceAll(" ", "\\ ");

            return escSpaces + "/" + fileName;
        } else {
            return outputDir + "/" + fileName;
        }
    }
}
