/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, it } from "vitest";

import { defineConfig } from "../../../src/config/config.js";

import { toTreeSync } from "memfs/lib/print/index.js";
import type { ITargetGenerator } from "../../../src/codegen/ITargetGenerator.js";
import { CppTargetGenerator } from "../../../src/default-target-generators/CppTargetGenerator.js";
import { Grammar } from "../../../src/index.js";
import { fileSystem } from "../../../src/tool-parameters.js";
import { LexerGrammar } from "../../../src/tool/LexerGrammar.js";
import { TypeScriptTargetGenerator } from "../../../src/default-target-generators/TypeScriptTargetGenerator.js";

describe.skip("Test built-in generators", () => {
    const targetDir = "/Users/mike/Downloads/antlr/mysql/generated";

    const cppGenerator: ITargetGenerator = new CppTargetGenerator({ exportMacro: "ANTLR4CPP_PUBLIC", });
    const tsGenerator: ITargetGenerator = new TypeScriptTargetGenerator();

    const activeGenerator = cppGenerator;

    const copyFile = async (name: string): Promise<void> => {
        const generated = fileSystem.readFileSync(`/out/${name}`, "utf-8");
        await writeFile(`${targetDir}/${name}`, generated);
    };

    const copyCodeFile = async (name: string) => {
        await copyFile(`${name}${activeGenerator.codeFileExtension}`);
        if (activeGenerator.needsDeclarationFile) {
            const headerExt = activeGenerator.declarationFileExtension;
            await copyFile(`${name}${headerExt}`);
        }
    };

    it("test current generator", async () => {
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
        let grammarText = readFileSync(grammarPath, "utf8");
        const lg = new LexerGrammar(grammarText);
        lg.fileName = "MySQLLexer.g4";
        lg.tool.process(lg, configuration, true);

        grammarPath = fileURLToPath(new URL("../../grammars/MySQLParser.g4", import.meta.url));
        grammarText = readFileSync(grammarPath, "utf8");
        const g = new Grammar(grammarText);
        g.fileName = "MySQLParser.g4";
        g.tool.process(g, configuration, true);

        console.log(toTreeSync(fileSystem));

        await copyCodeFile("MySQLLexer");
        await copyCodeFile("MySQLParser");

        if (configuration.generationOptions.generateListener) {
            await copyCodeFile("MySQLParserListener");
            await copyCodeFile("MySQLParserBaseListener");
        }

        if (configuration.generationOptions.generateVisitor) {
            await copyCodeFile("MySQLParserVisitor");
            await copyCodeFile("MySQLParserBaseVisitor");
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
