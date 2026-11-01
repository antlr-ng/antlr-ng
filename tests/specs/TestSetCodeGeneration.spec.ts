/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

await import("../../src/Tool.js"); // To kick off the loading of the tool

import { ParserATNFactory } from "../../src/automata/ParserATNFactory.js";
import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import type { ITargetGenerator } from "../../src/codegen/ITargetGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { CppTargetGenerator } from "../../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../../src/default-target-generators/CSharpTargetGenerator.js";
import { GoTargetGenerator } from "../../src/default-target-generators/GoTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../src/tool/index.js";

/**
 * Generates the parser code for a grammar with the given generator, without writing any files.
 *
 * @param generator The target generator to use.
 * @param grammarText The grammar to process.
 *
 * @returns The generated parser code.
 */
const generateParser = (generator: ITargetGenerator, grammarText: string): string => {
    generator.setUp();
    const config = defineConfig({
        grammarFiles: [],
        generators: [generator],
        generationOptions: {
            outputDirectory: "/tmp",
        }
    });

    const grammar = new Grammar(grammarText);
    grammar.tool.process(grammar, config, false);
    expect(grammar.ast.hasErrors).toBe(false);

    const factory = new ParserATNFactory(grammar);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, generator, config.generationOptions);

    return gen.generateParser(config.generationOptions);
};

describe("TestSetCodeGeneration", () => {
    // A set containing EOF (-1) gets a bitset with an offset of -1, which must be applied to the token type.
    // EOF is bit 0, B (2) is bit 3 and C (3) is bit 4, which gives a mask of 25.
    const grammar = "grammar T;\n" +
        "s : A (EOF | B | C) ;\n" +
        "A : 'a' ;\n" +
        "B : 'b' ;\n" +
        "C : 'c' ;\n";

    it.each([
        ["TypeScript", new TypeScriptTargetGenerator(false),
            "if (!(((((_la - -1)) & ~0x1F) === 0&& ((1 << (_la - -1)) & 25) !== 0))) {"],
        ["Go", new GoTargetGenerator(false),
            "if !(((int64((_la - -1)) & ^0x3f) == 0 && ((int64(1) << (_la - -1)) & 25) != 0)) {"],
        ["Cpp", new CppTargetGenerator(false), "((1ULL << (_la - -1)) & 25) != 0"],
        ["CSharp", new CSharpTargetGenerator(false),
            "if ( !(((((_la - -1)) & ~0x3f) == 0 && ((1L << (_la - -1)) & 25L) != 0)) ) {"],
    ])("Set containing EOF (%s)", (_name, generator, expected) => {
        const code = generateParser(generator, grammar);
        expect(code).toContain(expected);
    });
});
