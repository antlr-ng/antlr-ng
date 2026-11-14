/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ITargetGenerator } from "../codegen/ITargetGenerator.js";
import type { IGenerationOptions } from "../config/config.js";
import { Constants } from "../Constants.js";
import { Tool } from "../Tool.js";
import { CodeGenerator } from "../codegen/CodeGenerator.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { dirname } from "../support/fs-helpers.js";
import { GrammarType } from "../support/GrammarType.js";
import { isTokenName } from "../support/helpers.js";
import { fileSystem } from "../tool-parameters.js";
import { GrammarTreeVisitor } from "../tree/walkers/GrammarTreeVisitor.js";
import type { GrammarAST } from "./ast/GrammarAST.js";
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
 * If the grammar uses option tokenVocab=A or imports other grammars, the first line lists them. The vocabulary file is
 * searched like the tool searches it (lib directory, output directory, grammar directory). If it does not exist yet,
 * it is expected in the output directory, where it is generated:
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
        const recognizers = [{ name: this.g.getRecognizerName(), isLexer: this.g.isLexer() }];
        if (this.g.isCombined() && this.hasImplicitLexer()) {
            recognizers.push({
                name: this.g.name + Grammar.getGrammarTypeToFileNameSuffix(GrammarType.Lexer),
                isLexer: true,
            });
        }

        for (const recognizer of recognizers) {
            // The vocabulary file is named after the grammar, e.g. T.tokens for the parser of T.g4.
            const baseName = recognizer.name === this.g.getRecognizerName() ? this.g.name : recognizer.name;

            if (!this.g.isCodeGenerationDisabled()) {
                addCodeFile((declaration) => {
                    return targetGenerator.getRecognizerFileName(declaration, recognizer.name, recognizer.isLexer);
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

                if (this.options.generateBaseListener && targetGenerator.wantsBaseListener) {
                    addCodeFile((declaration) => {
                        return this.generator.getBaseListenerFileName(declaration);
                    });
                }
            }

            if (this.options.generateVisitor) {
                addCodeFile((declaration) => {
                    return this.generator.getVisitorFileName(declaration);
                });

                if (this.options.generateBaseVisitor && targetGenerator.wantsBaseVisitor) {
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

        // Handle imported grammars. Their file name is the path they were loaded from (see
        // `Tool.findImportedGrammarFile`), so the lib directory must not be added again.
        for (const g of this.g.getAllImportedGrammars()) {
            files.push(BuildDependencyGenerator.escapeSpaces(g.fileName));
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
            files.push(this.groomQualifiedFileName(this.getVocabDirectory(tokenVocab),
                tokenVocab + Constants.VocabFileExtension));
        }

        return files;
    }

    public getDependencies(): string {
        const inputFiles = this.getDependenciesFileList();
        const result: string[] = [];

        // Make separates targets and prerequisites with spaces, so spaces in the grammar's path are escaped too.
        const grammarFile = BuildDependencyGenerator.escapeSpaces(this.g.fileName);

        // Make syntax: the grammar depends on these files.
        if (inputFiles.length > 0) {
            result.push(`${grammarFile}: ${inputFiles.join(" ")}`);
        }

        const outputFiles = this.getGeneratedFileList();
        outputFiles.forEach((file) => {
            result.push(`${file} : ${grammarFile}`);
        });

        return result.join("\n");
    }

    public getGenerator(): CodeGenerator {
        return this.generator;
    }

    /**
     * Escapes spaces in a file name for make, which separates targets and prerequisites with spaces.
     *
     * @param fileName The file name to escape.
     *
     * @returns The file name with each space preceded by a backslash.
     */
    private static escapeSpaces(fileName: string): string {
        return fileName.replaceAll(" ", "\\ ");
    }

    /**
     * Determines the folder of a token vocabulary file. The folders are searched in the order of
     * `TokenVocabParser.getImportedVocabFile`: the lib directory (or the current directory without one), the output
     * directory and the grammar's folder. A vocabulary that does not exist yet is generated in this build, so it is
     * expected in the output directory.
     *
     * @param vocabName The value of the tokenVocab option.
     *
     * @returns The folder that contains (or will contain) the vocabulary file.
     */
    private getVocabDirectory(vocabName: string): string {
        const fileName = vocabName + Constants.VocabFileExtension;
        const candidates = [this.libDir ?? "."];
        if (this.options.outputDirectory) {
            candidates.push(this.options.outputDirectory);
        }

        const grammarDir = dirname(this.g.fileName);
        if (grammarDir) {
            candidates.push(grammarDir);
        }

        const found = candidates.find((dir) => {
            return fileSystem.existsSync(dir + "/" + fileName);
        });

        return found ?? this.generator.getOutputDirectory(this.g.fileName);
    }

    /**
     * Determines whether a combined grammar gets an implicit lexer, without transforming it. This is the condition
     * of `GrammarTransformPipeline.extractImplicitLexer`: the lexer exists if there is a lexer rule or a string
     * literal (which becomes a lexer rule) in the rules of the merged grammar.
     *
     * @returns True if code generation writes a lexer for the grammar.
     */
    private hasImplicitLexer(): boolean {
        // Merge the rules like `GrammarTransformPipeline.integrateImportedGrammars`: a rule of an imported grammar is
        // only used if neither the root grammar nor a grammar imported before it has a rule with the same name.
        const rules = new Map<string, GrammarAST>();
        for (const g of [this.g, ...this.g.getAllImportedGrammars()]) {
            for (const rule of g.ast.getNodesWithType(ANTLRv4Parser.RULE)) {
                const name = rule.children[0].getText();
                if (!rules.has(name)) {
                    rules.set(name, rule);
                }
            }
        }

        if ([...rules.keys()].some((name) => { return isTokenName(name); })) {
            return true;
        }

        // All remaining rules are parser rules. Look for string literals in them.
        const collector = new class extends GrammarTreeVisitor {
            public hasLiterals = false;

            public override stringRef(): void {
                this.hasLiterals = true;
            }
        }(this.g.tool.errorManager);

        for (const rule of rules.values()) {
            collector.visit(rule, ANTLRv4Parser.RULE_ruleSpec);
            if (collector.hasLiterals) {
                return true;
            }
        }

        return false;
    }

    private groomQualifiedFileName(outputDir: string, fileName: string): string {
        outputDir = outputDir.replace(/(?<=.)\/+$/, "");
        if (outputDir === ".") {
            return fileName;
        }

        return BuildDependencyGenerator.escapeSpaces(outputDir) + "/" + fileName;
    }
}
