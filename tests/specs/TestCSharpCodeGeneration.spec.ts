/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

await import("../../src/Tool.js"); // To kick off the loading of the tool

import { ParserATNFactory } from "../../src/automata/ParserATNFactory.js";
import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { CSharpTargetGenerator } from "../../src/default-target-generators/CSharpTargetGenerator.js";
import { Grammar } from "../../src/tool/index.js";

const csGenerator = new CSharpTargetGenerator(false);
csGenerator.setUp();
const dummyParameters = defineConfig({
    grammarFiles: [],
    generators: [csGenerator],
    generationOptions: {
        outputDirectory: "/tmp"
    }
});

describe("TestCSharpCodeGeneration", () => {
    it("CSharpAccessLevelOption", (): void => {
        const grammarText =
            "grammar T;\n" +
            "options { language=CSharp; accessLevel=internal; }\n" +
            "a : 'a' ;\n";

        const grammar = new Grammar(grammarText);
        grammar.tool.process(grammar, dummyParameters, false);

        if (!grammar.ast.hasErrors) {
            const factory = new ParserATNFactory(grammar);
            grammar.atn = factory.createATN();

            const gen = new CodeGenerator(grammar, csGenerator, dummyParameters.generationOptions);
            const generatedCode = gen.generateParser(dummyParameters.generationOptions);

            // Verify internal accessibility is used instead of public
            expect(generatedCode).toContain("internal partial class");
            expect(generatedCode).not.toContain("public partial class");
        }
    });

    it("CSharpDefaultAccessLevel", (): void => {
        const grammarText =
            "grammar T;\n" +
            "options { language=CSharp; }\n" +
            "a : 'a' ;\n";

        const grammar = new Grammar(grammarText);
        grammar.tool.process(grammar, dummyParameters, false);

        if (!grammar.ast.hasErrors) {
            const factory = new ParserATNFactory(grammar);
            grammar.atn = factory.createATN();

            const gen = new CodeGenerator(grammar, csGenerator, dummyParameters.generationOptions);
            const generatedCode = gen.generateParser(dummyParameters.generationOptions);

            // Verify public accessibility is used by default
            expect(generatedCode).toContain("public partial class");
        }
    });
});
