/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it, vi } from "vitest";

import { createLegacyConfiguration } from "../../cli/legacy-configuration.js";
import { parseToolParameters } from "../../src/tool-parameters.js";
import { generate } from "../support/GenerationHelper.js";

/**
 * Parses the legacy command line arguments (without the deprecation warning) and converts them to a configuration.
 *
 * @param args The command line arguments.
 *
 * @returns The tool configuration.
 */
const configure = (...args: string[]): ReturnType<typeof createLegacyConfiguration> => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => { /**/ });
    try {
        return createLegacyConfiguration(parseToolParameters(args));
    } finally {
        warn.mockRestore();
    }
};

describe("Legacy command line configuration", () => {
    it("uses the TypeScript generator without a language", () => {
        const config = configure("-o", "out", "T.g4");
        expect(config.generators.map((generator) => { return generator.language; })).toEqual(["TypeScript"]);
        expect(config.grammarFiles).toEqual(["T.g4"]);
        expect(config.generationOptions.outputDirectory).toBe("out");
        expect(config.generationOptions.generateDeclarationFile).toBe(false);
    });

    it("selects the generator with -Dlanguage", () => {
        // Names and specifiers are matched without case.
        for (const [language, expected] of [["Cpp", "Cpp"], ["c++", "Cpp"], ["CSharp", "CSharp"], ["ts", "TypeScript"],
            ["python3", "Python3"], ["GO", "Go"]]) {
            const config = configure("-D", `language=${language}`, "T.g4");
            expect(config.generators.map((generator) => { return generator.language; })).toEqual([expected]);
        }

        // Header files were always generated for C++.
        expect(configure("-Dlanguage=Cpp", "T.g4").generationOptions.generateDeclarationFile).toBe(true);
    });

    it("needs a generator for language None, but generates no code with it", () => {
        const config = configure("-Dlanguage=None", "T.g4");
        expect(config.generators).toHaveLength(1);
        expect(config.grammarOptions).toEqual({ language: "None" });
    });

    it("passes all -D values on as grammar options", () => {
        const config = configure("-D", "superClass=MyBase", "-D", "language=Java", "T.g4");
        expect(config.grammarOptions).toEqual({ superClass: "MyBase", language: "Java" });
    });

    it("rejects unknown languages", () => {
        expect(() => {
            configure("-Dlanguage=Foo", "T.g4");
        }).toThrow('Unknown target language "Foo". Available languages: Cpp, CSharp, Dart, Go, Java, PHP, Python3, ' +
            "Swift, TypeScript, None. Use a config file for other generators.");
    });

    it("rejects encodings other than UTF-8 and warns about --exact-output-dir", () => {
        expect(() => {
            configure("-e", "latin1", "T.g4");
        }).toThrow('Grammar files are always read as UTF-8. The encoding "latin1" is not supported.');
        expect(configure("-e", "UTF-8", "T.g4").grammarFiles).toEqual(["T.g4"]);

        const warn = vi.spyOn(console, "warn").mockImplementation(() => { /**/ });
        try {
            createLegacyConfiguration(parseToolParameters(["--exact-output-dir", "true", "T.g4"]));
            expect(warn).toHaveBeenCalledWith(
                "--exact-output-dir is ignored. All generated files are written to the output directory.");
        } finally {
            warn.mockRestore();
        }
    });
});

describe("Grammar options in the configuration", () => {
    const grammar = "grammar Opt;\ns : ID ;\nID : [a-z]+ ;\n";

    it("override the options of the grammar", () => {
        const result = generate(grammar.replace("grammar Opt;", "grammar Opt;\noptions { superClass = Base; }"), {},
            (config) => {
                config.grammarOptions = { superClass: "MyBase" };
            });
        expect(result.queue.errors).toHaveLength(0);
        expect(result.files.get("OptParser.ts")).toContain("export class OptParser extends MyBase {");
    });

    it("can disable code generation with language None", () => {
        const result = generate(grammar, {}, (config) => {
            config.grammarOptions = { language: "None" };
        });
        expect(result.queue.errors).toHaveLength(0);
        expect([...result.files.keys()].sort()).toEqual([
            "Opt.g4", "Opt.interp", "Opt.tokens", "OptLexer.interp", "OptLexer.tokens",
        ]);
    });
});
