/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it } from "vitest";

import { defineConfig } from "../../../src/config/config.js";

import { toTreeSync } from "memfs/lib/print/index.js";
import type { ITargetGenerator } from "../../../src/codegen/ITargetGenerator.js";
import { CppTargetGenerator } from "../../../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../../../src/default-target-generators/CSharpTargetGenerator.js";
import { DartTargetGenerator } from "../../../src/default-target-generators/DartTargetGenerator.js";
import { GoTargetGenerator } from "../../../src/default-target-generators/GoTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../../src/index.js";
import { fileSystem } from "../../../src/tool-parameters.js";
import { LexerGrammar } from "../../../src/tool/LexerGrammar.js";
import { ToolTestUtils } from "../../ToolTestUtils.js";

describe("Test built-in generators", () => {
    const copyFile = async (name: string, targetDir: string): Promise<void> => {
        const generated = fileSystem.readFileSync(`/out/${name}`, "utf-8");
        await writeFile(resolve(targetDir, name), generated);
    };

    const copyCodeFile = async (name: string, generator: ITargetGenerator, targetDir: string) => {
        await copyFile(`${name}${generator.codeFileExtension}`, targetDir);
        if (generator.needsDeclarationFile) {
            const headerExt = generator.declarationFileExtension;
            await copyFile(`${name}${headerExt}`, targetDir);
        }
    };

    it("test TypeScript generator", async () => {
        const tsGenerator = new TypeScriptTargetGenerator(false);
        tsGenerator.setUp();

        const targetDir = resolve(ToolTestUtils.expandTilde("~/antlr-ng-test-generation/mysql"), tsGenerator.language);

        await mkdir(targetDir, { recursive: true });

        const configuration = defineConfig({
            grammarFiles: ["MySQLLexer.g4", "MySQLParser.g4"],
            generationOptions: {
                outputDirectory: "/out",
                generateListener: true,
                generateVisitor: true,
                generateInterpreterData: true,
                generateDeclarationFile: false,
                generateBaseListener: false,
                generateBaseVisitor: false,
                package: "antlr4",
            },
            generators: [tsGenerator],
        });

        let grammarPath = fileURLToPath(new URL("../../grammars/MySQLLexer.g4", import.meta.url));
        let grammarText = await readFile(grammarPath, "utf8");
        const lg = new LexerGrammar(grammarText);
        lg.fileName = "MySQLLexer.g4";
        lg.tool.process(lg, configuration, true);

        grammarPath = fileURLToPath(new URL("../../grammars/MySQLParser.g4", import.meta.url));
        grammarText = await readFile(grammarPath, "utf8");
        const g = new Grammar(grammarText);
        g.fileName = "MySQLParser.g4";
        g.tool.process(g, configuration, true);

        console.log(toTreeSync(fileSystem));

        await copyCodeFile("MySQLLexer", tsGenerator, targetDir);
        await copyCodeFile("MySQLParser", tsGenerator, targetDir);

        if (configuration.generationOptions.generateListener) {
            await copyCodeFile("MySQLParserListener", tsGenerator, targetDir);
            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseListener", tsGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateVisitor) {
            await copyCodeFile("MySQLParserVisitor", tsGenerator, targetDir);

            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseVisitor", tsGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateInterpreterData) {
            await copyFile("MySQLLexer.interp", targetDir);
            await copyFile("MySQLParser.interp", targetDir);
        }

        // Tokens files.
        await copyFile("MySQLLexer.tokens", targetDir);
        await copyFile("MySQLParser.tokens", targetDir);
    }, 60000); // The MySQL parser is large, which can exceed the default timeout when tests run concurrently.

    it("test C++ generator", async () => {
        const cppGenerator: ITargetGenerator = new CppTargetGenerator(false, { exportMacro: "ANTLR4CPP_PUBLIC", });
        cppGenerator.setUp();

        const targetDir = resolve(ToolTestUtils.expandTilde("~/antlr-ng-test-generation/mysql"), cppGenerator.language);

        await mkdir(targetDir, { recursive: true });

        const configuration = defineConfig({
            grammarFiles: ["MySQLLexer.g4", "MySQLParser.g4"],
            generationOptions: {
                outputDirectory: "/out",
                generateListener: true,
                generateVisitor: true,
                generateInterpreterData: true,
                generateDeclarationFile: true,
                generateBaseListener: true,
                generateBaseVisitor: true,
                package: "antlr4",
            },
            generators: [cppGenerator],
        });

        let grammarPath = fileURLToPath(new URL("../../grammars/MySQLLexer.g4", import.meta.url));
        let grammarText = await readFile(grammarPath, "utf8");
        const lg = new LexerGrammar(grammarText);
        lg.fileName = "MySQLLexer.g4";
        lg.tool.process(lg, configuration, true);

        grammarPath = fileURLToPath(new URL("../../grammars/MySQLParser.g4", import.meta.url));
        grammarText = await readFile(grammarPath, "utf8");
        const g = new Grammar(grammarText);
        g.fileName = "MySQLParser.g4";
        g.tool.process(g, configuration, true);

        console.log(toTreeSync(fileSystem));

        await copyCodeFile("MySQLLexer", cppGenerator, targetDir);
        await copyCodeFile("MySQLParser", cppGenerator, targetDir);

        if (configuration.generationOptions.generateListener) {
            await copyCodeFile("MySQLParserListener", cppGenerator, targetDir);
            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseListener", cppGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateVisitor) {
            await copyCodeFile("MySQLParserVisitor", cppGenerator, targetDir);

            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseVisitor", cppGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateInterpreterData) {
            await copyFile("MySQLLexer.interp", targetDir);
            await copyFile("MySQLParser.interp", targetDir);
        }

        // Tokens files.
        await copyFile("MySQLLexer.tokens", targetDir);
        await copyFile("MySQLParser.tokens", targetDir);
    }, 60000); // The MySQL parser is large, which can exceed the default timeout when tests run concurrently.

    it("test C# generator", async () => {
        const csharpGenerator: ITargetGenerator = new CSharpTargetGenerator(false);
        csharpGenerator.setUp();

        const targetDir = resolve(ToolTestUtils.expandTilde("~/antlr-ng-test-generation/mysql"),
            csharpGenerator.language);

        await mkdir(targetDir, { recursive: true });

        const configuration = defineConfig({
            grammarFiles: ["MySQLLexer.g4", "MySQLParser.g4"],
            generationOptions: {
                outputDirectory: "/out",
                generateListener: true,
                generateVisitor: true,
                generateInterpreterData: true,
                generateDeclarationFile: true,
                generateBaseListener: true,
                generateBaseVisitor: true,
                package: "antlr4",
            },
            generators: [csharpGenerator],
        });

        let grammarPath = fileURLToPath(new URL("../../grammars/MySQLLexer.g4", import.meta.url));
        let grammarText = await readFile(grammarPath, "utf8");
        const lg = new LexerGrammar(grammarText);
        lg.fileName = "MySQLLexer.g4";
        lg.tool.process(lg, configuration, true);

        grammarPath = fileURLToPath(new URL("../../grammars/MySQLParser.g4", import.meta.url));
        grammarText = await readFile(grammarPath, "utf8");
        const g = new Grammar(grammarText);
        g.fileName = "MySQLParser.g4";
        g.tool.process(g, configuration, true);

        console.log(toTreeSync(fileSystem));

        await copyCodeFile("MySQLLexer", csharpGenerator, targetDir);
        await copyCodeFile("MySQLParser", csharpGenerator, targetDir);

        if (configuration.generationOptions.generateListener) {
            await copyCodeFile("MySQLParserListener", csharpGenerator, targetDir);
            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseListener", csharpGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateVisitor) {
            await copyCodeFile("MySQLParserVisitor", csharpGenerator, targetDir);

            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseVisitor", csharpGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateInterpreterData) {
            await copyFile("MySQLLexer.interp", targetDir);
            await copyFile("MySQLParser.interp", targetDir);
        }

        // Tokens files.
        await copyFile("MySQLLexer.tokens", targetDir);
        await copyFile("MySQLParser.tokens", targetDir);
    }, 60000); // The MySQL parser is large, which can exceed the default timeout when tests run concurrently.

    it("test Go generator", async () => {
        const goGenerator: ITargetGenerator = new GoTargetGenerator(false);
        goGenerator.setUp();

        const targetDir = resolve(ToolTestUtils.expandTilde("~/antlr-ng-test-generation/mysql"), goGenerator.language);

        await mkdir(targetDir, { recursive: true });

        const configuration = defineConfig({
            grammarFiles: ["MySQLLexer.g4", "MySQLParser.g4"],
            generationOptions: {
                outputDirectory: "/out",
                generateListener: true,
                generateVisitor: true,
                generateInterpreterData: true,
                generateDeclarationFile: false,
                generateBaseListener: true,
                generateBaseVisitor: true,
                package: "parser",
            },
            generators: [goGenerator],
        });

        let grammarPath = fileURLToPath(new URL("../../grammars/MySQLLexer.g4", import.meta.url));
        let grammarText = await readFile(grammarPath, "utf8");
        const lg = new LexerGrammar(grammarText);
        lg.fileName = "MySQLLexer.g4";
        lg.tool.process(lg, configuration, true);

        grammarPath = fileURLToPath(new URL("../../grammars/MySQLParser.g4", import.meta.url));
        grammarText = await readFile(grammarPath, "utf8");
        const g = new Grammar(grammarText);
        g.fileName = "MySQLParser.g4";
        g.tool.process(g, configuration, true);

        console.log(toTreeSync(fileSystem));

        // Go uses its own file naming scheme (e.g. mysql_lexer.go), so we ask the generator for the names.
        await copyFile(goGenerator.getRecognizerFileName(false, "MySQLLexer"), targetDir);
        await copyFile(goGenerator.getRecognizerFileName(false, "MySQLParser"), targetDir);

        if (configuration.generationOptions.generateListener) {
            await copyFile(goGenerator.getListenerFileName(false, "MySQLParser"), targetDir);
            if (configuration.generationOptions.generateBaseListener) {
                await copyFile(goGenerator.getBaseListenerFileName(false, "MySQLParser"), targetDir);
            }
        }

        if (configuration.generationOptions.generateVisitor) {
            await copyFile(goGenerator.getVisitorFileName(false, "MySQLParser"), targetDir);

            if (configuration.generationOptions.generateBaseVisitor) {
                await copyFile(goGenerator.getBaseVisitorFileName(false, "MySQLParser"), targetDir);
            }
        }

        if (configuration.generationOptions.generateInterpreterData) {
            await copyFile("MySQLLexer.interp", targetDir);
            await copyFile("MySQLParser.interp", targetDir);
        }

        // Tokens files.
        await copyFile("MySQLLexer.tokens", targetDir);
        await copyFile("MySQLParser.tokens", targetDir);
    }, 60000); // The MySQL parser is large, which can exceed the default timeout when tests run concurrently.

    it("test Dart generator", async () => {
        const dartGenerator: ITargetGenerator = new DartTargetGenerator(false);
        dartGenerator.setUp();

        const targetDir = resolve(ToolTestUtils.expandTilde("~/antlr-ng-test-generation/mysql"),
            dartGenerator.language);

        await mkdir(targetDir, { recursive: true });

        const configuration = defineConfig({
            grammarFiles: ["MySQLLexer.g4", "MySQLParser.g4"],
            generationOptions: {
                outputDirectory: "/out",
                generateListener: true,
                generateVisitor: true,
                generateInterpreterData: true,
                generateDeclarationFile: false,
                generateBaseListener: true,
                generateBaseVisitor: true,
                package: "mysql",
            },
            generators: [dartGenerator],
        });

        let grammarPath = fileURLToPath(new URL("../../grammars/MySQLLexer.g4", import.meta.url));
        let grammarText = await readFile(grammarPath, "utf8");
        const lg = new LexerGrammar(grammarText);
        lg.fileName = "MySQLLexer.g4";
        lg.tool.process(lg, configuration, true);

        grammarPath = fileURLToPath(new URL("../../grammars/MySQLParser.g4", import.meta.url));
        grammarText = await readFile(grammarPath, "utf8");
        const g = new Grammar(grammarText);
        g.fileName = "MySQLParser.g4";
        g.tool.process(g, configuration, true);

        console.log(toTreeSync(fileSystem));

        await copyCodeFile("MySQLLexer", dartGenerator, targetDir);
        await copyCodeFile("MySQLParser", dartGenerator, targetDir);

        if (configuration.generationOptions.generateListener) {
            await copyCodeFile("MySQLParserListener", dartGenerator, targetDir);
            if (configuration.generationOptions.generateBaseListener) {
                await copyCodeFile("MySQLParserBaseListener", dartGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateVisitor) {
            await copyCodeFile("MySQLParserVisitor", dartGenerator, targetDir);

            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseVisitor", dartGenerator, targetDir);
            }
        }

        if (configuration.generationOptions.generateInterpreterData) {
            await copyFile("MySQLLexer.interp", targetDir);
            await copyFile("MySQLParser.interp", targetDir);
        }

        // Tokens files.
        await copyFile("MySQLLexer.tokens", targetDir);
        await copyFile("MySQLParser.tokens", targetDir);
    }, 60000); // The MySQL parser is large, which can exceed the default timeout when tests run concurrently.
});
