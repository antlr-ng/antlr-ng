/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IGenerationOptions } from "../config/config.js";
import { Grammar } from "../tool/Grammar.js";
import { CodeGenerator } from "./CodeGenerator.js";

export class CodeGenPipeline {
    private readonly g: Grammar;
    private readonly codeGenerator: CodeGenerator;

    public constructor(g: Grammar, gen: CodeGenerator, private options: IGenerationOptions) {
        this.g = g;
        this.codeGenerator = gen;
    }

    public process(): void {
        // All templates are generated in memory to report the most complete error information possible, but actually
        // writing output files stops after the first error is reported.
        const errorCount = this.g.tool.errorManager.errors;

        if (this.g.isLexer()) {
            if (this.options.generateDeclarationFile) {
                const lexer = this.codeGenerator.generateLexer(this.options, true); // Header file if needed.
                if (this.g.tool.errorManager.errors === errorCount) {
                    this.writeRecognizer(lexer, this.codeGenerator, true);
                }
            }

            const lexer = this.codeGenerator.generateLexer(this.options, false);
            if (this.g.tool.errorManager.errors === errorCount) {
                this.writeRecognizer(lexer, this.codeGenerator, false);
            }
        } else {
            if (this.options.generateDeclarationFile) {
                const parser = this.codeGenerator.generateParser(this.options, true);
                if (this.g.tool.errorManager.errors === errorCount) {
                    this.writeRecognizer(parser, this.codeGenerator, true);
                }
            }

            const parser = this.codeGenerator.generateParser(this.options, false);
            if (this.g.tool.errorManager.errors === errorCount) {
                this.writeRecognizer(parser, this.codeGenerator, false);
            }

            if (this.options.generateListener) {
                if (this.options.generateDeclarationFile) {
                    const listener = this.codeGenerator.generateListener(this.options, true);
                    if (this.g.tool.errorManager.errors === errorCount) {
                        this.codeGenerator.writeListener(listener, true);
                    }
                }

                const listener = this.codeGenerator.generateListener(this.options, false);
                if (this.g.tool.errorManager.errors === errorCount) {
                    this.codeGenerator.writeListener(listener, false);
                }

                if (this.options.generateBaseListener) {
                    if (this.options.generateDeclarationFile) {
                        const baseListener = this.codeGenerator.generateBaseListener(this.options, true);
                        if (this.g.tool.errorManager.errors === errorCount) {
                            this.codeGenerator.writeBaseListener(baseListener, true);
                        }
                    }

                    const baseListener = this.codeGenerator.generateBaseListener(this.options, false);
                    if (this.g.tool.errorManager.errors === errorCount) {
                        this.codeGenerator.writeBaseListener(baseListener, false);
                    }
                }
            }

            if (this.options.generateVisitor) {
                if (this.options.generateDeclarationFile) {
                    const visitor = this.codeGenerator.generateVisitor(this.options, true);
                    if (this.g.tool.errorManager.errors === errorCount) {
                        this.codeGenerator.writeVisitor(visitor, true);
                    }
                }

                const visitor = this.codeGenerator.generateVisitor(this.options, false);
                if (this.g.tool.errorManager.errors === errorCount) {
                    this.codeGenerator.writeVisitor(visitor, false);
                }

                if (this.options.generateBaseVisitor) {
                    if (this.options.generateDeclarationFile) {
                        const baseVisitor = this.codeGenerator.generateBaseVisitor(this.options, true);
                        if (this.g.tool.errorManager.errors === errorCount) {
                            this.codeGenerator.writeBaseVisitor(baseVisitor, true);
                        }
                    }

                    const baseVisitor = this.codeGenerator.generateBaseVisitor(this.options, false);
                    if (this.g.tool.errorManager.errors === errorCount) {
                        this.codeGenerator.writeBaseVisitor(baseVisitor, false);
                    }
                }
            }
        }

        this.codeGenerator.writeVocabFile();
    }

    protected writeRecognizer(generatedText: string, gen: CodeGenerator, header: boolean): void {
        gen.writeRecognizer(generatedText, header);
    }
}
