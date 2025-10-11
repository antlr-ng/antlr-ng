/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, it } from "vitest";
import { toTreeSync } from "memfs/lib/print/index.js";

import { defineConfig } from "../../../src/config/config.js";
import { Tool } from "../../../src/Tool.js";

import { TypeScriptTargetGenerator } from "../../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../../src/index.js";
import { fileSystem } from "../../../src/tool-parameters.js";

describe.skip("Test built-in generators", () => {

    it("test TypeScript", async () => {
        const configuration = defineConfig({
            grammarFiles: ["Psl.g4"],
            outputDirectory: "/out",
            generationOptions: {
                generateListener: true,
                generateVisitor: true,
                generateInterpreterData: true,
                //generateDependencies: true,
            },
            generators: [new TypeScriptTargetGenerator()],
        });

        const grammarPath = fileURLToPath(new URL("../../grammars/Psl.g4", import.meta.url));
        const grammarText = readFileSync(grammarPath, "utf8");
        const parserGrammar = new Grammar(grammarText);

        const tool = new Tool();
        parserGrammar.tool = tool;
        parserGrammar.name = "Psl";
        tool.process(parserGrammar, configuration, true);

        console.log(toTreeSync(fileSystem));

        const targetDir = "/Users/mike/Downloads/antlr/mysql/generated";

        let generated = fileSystem.readFileSync("/out/PslLexer.tokens", "utf-8");
        await writeFile(`${targetDir}/PslLexer.tokens`, generated);

        generated = fileSystem.readFileSync("/out/PslLexer.ts", "utf-8");
        await writeFile(`${targetDir}/PslLexer.ts`, generated);

        generated = fileSystem.readFileSync("/out/PslParser.ts", "utf-8");
        await writeFile(`${targetDir}/PslParser.ts`, generated);

        generated = fileSystem.readFileSync("/out/PslListener.ts", "utf-8");
        await writeFile(`${targetDir}/PslListener.ts`, generated);

        generated = fileSystem.readFileSync("/out/PslVisitor.ts", "utf-8");
        await writeFile(`${targetDir}/PslVisitor.ts`, generated);

        /*generated = fileSystem.readFileSync("/out/PslBaseListener.ts", "utf-8");
        await writeFile(`${targetDir}/PslParserBaseListener.ts`, generated);

        generated = fileSystem.readFileSync("/out/PslBaseVisitor.ts", "utf-8");
        await writeFile(`${targetDir}/PslParserBaseVisitor.ts`, generated);*/

        generated = fileSystem.readFileSync("/out/Psl.tokens", "utf-8");
        await writeFile(`${targetDir}/Psl.tokens`, generated);

        generated = fileSystem.readFileSync("/out/PslLexer.interp", "utf-8");
        await writeFile(`${targetDir}/PslLexer.interp`, generated);

        generated = fileSystem.readFileSync("/out/Psl.interp", "utf-8");
        await writeFile(`${targetDir}/Psl.interp`, generated);
    });
});
