/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { supportsLanguage } from "../../src/codegen/TargetLanguage.js";
import { CppTargetGenerator } from "../../src/default-target-generators/CppTargetGenerator.js";
import { JavaTargetGenerator } from "../../src/default-target-generators/JavaTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { IssueCode } from "../../src/tool/Issues.js";
import { generate, type IGenerationResult } from "../support/GenerationHelper.js";

/**
 * Generates a combined grammar with the TypeScript and the C++ generator.
 *
 * @param language The value of the language option, or undefined for a grammar without it.
 *
 * @returns The generation result.
 */
const generateWithTsAndCpp = (language?: string): IGenerationResult => {
    const options = language === undefined ? "" : `options { language = ${language}; }\n`;

    return generate(`grammar T;\n${options}s : ID ;\nID : [a-z]+ ;\n`, {}, (config) => {
        config.generators = [new TypeScriptTargetGenerator(), new CppTargetGenerator()];
    });
};

/**
 * @param result The generation result.
 *
 * @returns The names of the generated files, without the grammar.
 */
const generatedFiles = (result: IGenerationResult): string[] => {
    return [...result.files.keys()].filter((name) => { return !name.endsWith(".g4"); }).sort();
};

/**
 * @param result The generation result.
 *
 * @returns The reported errors as text, without the folder of the grammar files.
 */
const errors = (result: IGenerationResult): string[] => {
    return result.queue.errors.map((error) => { return error.toString().replace(/ \S*\/(?=\w+\.g4:)/, " "); });
};

describe("The language option", () => {
    it("selects all configured generators if not set", () => {
        const result = generateWithTsAndCpp();
        expect(errors(result)).toEqual([]);
        expect(generatedFiles(result)).toEqual(["T.tokens", "TLexer.cpp", "TLexer.tokens", "TLexer.ts",
            "TParser.cpp", "TParser.ts"]);
    });

    it("selects the generators which support the language", () => {
        // The language name and the language specifiers of a generator match, without case. A specifier which is
        // no identifier is given as string.
        for (const language of ["Cpp", "'c++'", "CPP"]) {
            const result = generateWithTsAndCpp(language);
            expect(errors(result)).toEqual([]);
            expect(generatedFiles(result)).toEqual(["T.tokens", "TLexer.cpp", "TLexer.tokens", "TParser.cpp"]);
        }

        const result = generateWithTsAndCpp("ts");
        expect(errors(result)).toEqual([]);
        expect(generatedFiles(result)).toEqual(["T.tokens", "TLexer.tokens", "TLexer.ts", "TParser.ts"]);
    });

    it("reports a language without a configured generator", () => {
        // Java is a default target, but no Java generator is configured. Foo is no language at all.
        for (const language of ["Java", "Foo"]) {
            const result = generateWithTsAndCpp(language);
            expect(errors(result)).toEqual([
                `error(${IssueCode.CannotCreateTargetGenerator}): T.g4:2:21: no configured target generator ` +
                `supports the language ${language} (configured: TypeScript, Cpp)`,
            ]);
            expect(generatedFiles(result)).toEqual([]);
        }
    });

    it("generates the metadata once for the language None", () => {
        const result = generateWithTsAndCpp("None");
        expect(errors(result)).toEqual([]);
        expect(generatedFiles(result)).toEqual(["T.interp", "T.tokens", "TLexer.interp", "TLexer.tokens"]);
    });

    it("selects the generator for each grammar", () => {
        const result = generate([
            { name: "A.g4", content: "grammar A;\noptions { language = Java; }\na : 'a' ;\n" },
            { name: "B.g4", content: "grammar B;\nb : 'b' ;\n" },
        ], {}, (config) => {
            config.generators = [new TypeScriptTargetGenerator(), new JavaTargetGenerator()];
        });
        expect(errors(result)).toEqual([]);
        expect(generatedFiles(result).filter((name) => { return !name.endsWith(".tokens"); })).toEqual([
            "ALexer.java", "AParser.java", "BLexer.java", "BLexer.ts", "BParser.java", "BParser.ts",
        ]);
    });

    it("matches the language specifiers of custom generators", () => {
        const generator = { language: "Kotlin", languageSpecifiers: ["kt", "KTS"] };
        expect(supportsLanguage(generator, "kotlin")).toBe(true);
        expect(supportsLanguage(generator, "KT")).toBe(true);
        expect(supportsLanguage(generator, "kts")).toBe(true);
        expect(supportsLanguage(generator, "Java")).toBe(false);
    });
});
