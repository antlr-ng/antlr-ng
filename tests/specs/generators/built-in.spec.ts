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
import { TypeScriptTargetGenerator } from "../../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../../src/index.js";
import { fileSystem } from "../../../src/tool-parameters.js";
import { LexerGrammar } from "../../../src/tool/LexerGrammar.js";
import { ToolTestUtils } from "../../ToolTestUtils.js";

describe("Test built-in generators", () => {
    const cppGenerator: ITargetGenerator = new CppTargetGenerator(false, { exportMacro: "ANTLR4CPP_PUBLIC", });
    cppGenerator.setUp();
    const tsGenerator: ITargetGenerator = new TypeScriptTargetGenerator(false);
    tsGenerator.setUp();

    const activeGenerator = tsGenerator;

    const targetDir = resolve(ToolTestUtils.expandTilde("~/antlr-ng-test-generation/mysql"), activeGenerator.language);

    const copyFile = async (name: string): Promise<void> => {
        const generated = fileSystem.readFileSync(`/out/${name}`, "utf-8");
        await writeFile(resolve(targetDir, name), generated);
    };

    const copyCodeFile = async (name: string) => {
        await copyFile(`${name}${activeGenerator.codeFileExtension}`);
        if (activeGenerator.needsDeclarationFile) {
            const headerExt = activeGenerator.declarationFileExtension;
            await copyFile(`${name}${headerExt}`);
        }
    };

    it("test current generator", async () => {
        await mkdir(targetDir, { recursive: true });

        const configuration = defineConfig({
            grammarFiles: ["MySQLLexer.g4", "MySQLParser.g4"],
            outputDirectory: "/out",
            generationOptions: {
                generateListener: true,
                generateVisitor: true,
                generateInterpreterData: true,
                generateDeclarationFile: true,
                generateBaseListener: true,
                generateBaseVisitor: true,
                package: "antlr4",
            },
            generators: [activeGenerator],
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

        await copyCodeFile("MySQLLexer");
        await copyCodeFile("MySQLParser");

        if (configuration.generationOptions.generateListener) {
            await copyCodeFile("MySQLParserListener");
            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseListener");
            }
        }

        if (configuration.generationOptions.generateVisitor) {
            await copyCodeFile("MySQLParserVisitor");

            if (configuration.generationOptions.generateBaseVisitor) {
                await copyCodeFile("MySQLParserBaseVisitor");
            }
        }

        if (configuration.generationOptions.generateInterpreterData) {
            await copyFile("MySQLLexer.interp");
            await copyFile("MySQLParser.interp");
        }

        // Tokens files.
        await copyFile("MySQLLexer.tokens");
        await copyFile("MySQLParser.tokens");
    });
});
