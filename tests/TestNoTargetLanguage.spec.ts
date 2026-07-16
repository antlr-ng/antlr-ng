/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ToolTestUtils } from "./ToolTestUtils.js";

/**
 * Tests for the `None` pseudo target language, which runs the full grammar/ATN pipeline and writes the
 * language-agnostic artifacts (`.interp` and `.tokens`) while emitting no target language sources. The key contract is
 * that the metadata is byte-identical to what a real target produces.
 */
describe("TestNoTargetLanguage", () => {
    /** File extensions of target language sources that must never be written when the language is None. */
    const targetSourceExtensions = [
        ".java", ".ts", ".js", ".go", ".py", ".cpp", ".h", ".cs", ".dart", ".swift", ".php"
    ];

    /**
     * Reads all generated files in a directory into a name -> content map. The input grammar sources (`.g4`) that the
     * test helper writes into the same directory are excluded so only tool output is compared.
     *
     * @param dir The directory to read generated files from.
     *
     * @returns A map of generated file name to its UTF-8 content.
     */
    const readOutput = (dir: string): Map<string, string> => {
        const result = new Map<string, string>();
        for (const name of readdirSync(dir)) {
            if (name.endsWith(".g4")) {
                continue;
            }

            result.set(name, readFileSync(join(dir, name), { encoding: "utf-8" }));
        }

        return result;
    };

    /**
     * Generates the given grammar once with a real target (Java) and once with None, then asserts that None
     * reproduces the language-agnostic artifacts byte-for-byte and emits no target sources.
     *
     * @param grammarFileName The file name to write the grammar under.
     * @param grammarStr The grammar text.
     * @param expectedAgnosticFiles The language-agnostic files that must be produced (and be identical across both).
     */
    const expectMetadataOnly = (grammarFileName: string, grammarStr: string,
        expectedAgnosticFiles: string[]): void => {
        const javaDir = mkdtempSync(join(tmpdir(), "AntlrNoneJava"));
        const noneDir = mkdtempSync(join(tmpdir(), "AntlrNoneNone"));
        try {
            const javaQueue = ToolTestUtils.antlrOnString(javaDir, "Java", grammarFileName, grammarStr, false);
            expect(javaQueue.errors).toHaveLength(0);

            const noneQueue = ToolTestUtils.antlrOnString(noneDir, "None", grammarFileName, grammarStr, false);
            expect(noneQueue.errors).toHaveLength(0);

            const javaOutput = readOutput(javaDir);
            const noneOutput = readOutput(noneDir);

            // Every expected language-agnostic file is present in the None output and identical to the Java output.
            for (const file of expectedAgnosticFiles) {
                expect(noneOutput.has(file), `${file} should be produced for language=None`).toBe(true);
                expect(javaOutput.has(file), `${file} should be produced for language=Java`).toBe(true);
                expect(noneOutput.get(file), `${file} must be byte-identical to the Java output`)
                    .toBe(javaOutput.get(file));
            }

            // The None output contains exactly the language-agnostic files and nothing else.
            expect([...noneOutput.keys()].sort()).toEqual([...expectedAgnosticFiles].sort());

            // No target language sources leaked into the None output.
            for (const name of noneOutput.keys()) {
                const isTargetSource = targetSourceExtensions.some((ext) => {
                    return name.endsWith(ext);
                });
                expect(isTargetSource, `${name} is a target source and must not be generated for language=None`)
                    .toBe(false);
            }
        } finally {
            rmSync(javaDir, { recursive: true });
            rmSync(noneDir, { recursive: true });
        }
    };

    it("writes only .interp and .tokens for a combined grammar", () => {
        const grammar =
            "grammar JSON;\n" +
            "json : value EOF ;\n" +
            "obj : '{' pair (',' pair)* '}' | '{' '}' ;\n" +
            "pair : STRING ':' value ;\n" +
            "arr : '[' value (',' value)* ']' | '[' ']' ;\n" +
            "value : STRING | NUMBER | obj | arr | 'true' | 'false' | 'null' ;\n" +
            "STRING : '\"' (~[\"\\\\] | '\\\\' .)* '\"' ;\n" +
            "NUMBER : '-'? INT ('.' [0-9]+)? ;\n" +
            "fragment INT : '0' | [1-9] [0-9]* ;\n" +
            "WS : [ \\t\\n\\r]+ -> skip ;\n";

        expectMetadataOnly("JSON.g4", grammar,
            ["JSON.interp", "JSON.tokens", "JSONLexer.interp", "JSONLexer.tokens"]);
    });

    it("produces identical metadata for grammars with actions and semantic predicates", () => {
        // Embedded actions/predicates are stored as opaque ATN coordinates, so the .interp is target independent even
        // though the (skipped) generated sources would embed the target code verbatim.
        const grammar =
            "grammar Heavy;\n" +
            "@members { int count = 0; }\n" +
            "stat : {this.count > 0}? expr ';'\n" +
            "     | expr ';' {this.count++;}\n" +
            "     ;\n" +
            "expr : ID | NUMBER ;\n" +
            "ID : [a-zA-Z_] [a-zA-Z0-9_]* ;\n" +
            "NUMBER : [0-9]+ ;\n" +
            "GATED : '@' {this.count > 0}? [a-z]+ ;\n" +
            "WS : [ \\t\\r\\n]+ -> skip ;\n";

        expectMetadataOnly("Heavy.g4", grammar,
            ["Heavy.interp", "Heavy.tokens", "HeavyLexer.interp", "HeavyLexer.tokens"]);
    });

    it("produces identical metadata for left-recursive grammars", () => {
        // The left-recursive rule rewrite consults target templates; the resulting ATN is nonetheless identical
        // across targets, which this asserts against the Java baseline.
        const grammar =
            "grammar Expr;\n" +
            "prog : stat+ ;\n" +
            "stat : expr ';' ;\n" +
            "expr : expr '*' expr\n" +
            "     | expr '+' expr\n" +
            "     | expr '(' expr ')'\n" +
            "     | ID\n" +
            "     | INT\n" +
            "     ;\n" +
            "ID : [a-zA-Z]+ ;\n" +
            "INT : [0-9]+ ;\n" +
            "WS : [ \\t\\r\\n]+ -> skip ;\n";

        expectMetadataOnly("Expr.g4", grammar,
            ["Expr.interp", "Expr.tokens", "ExprLexer.interp", "ExprLexer.tokens"]);
    });

    it("honors the language=None option set inside the grammar", () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrNoneOption"));
        try {
            const grammar =
                "grammar OptNone;\n" +
                "options { language=None; }\n" +
                "r : ID ;\n" +
                "ID : [a-z]+ ;\n";

            // No -Dlanguage on the command line; the option comes from the grammar itself.
            const queue = ToolTestUtils.antlrOnString(tempDir, null, "OptNone.g4", grammar, false);
            expect(queue.errors).toHaveLength(0);

            const produced = readdirSync(tempDir).filter((name) => {
                return name !== "OptNone.g4";
            });
            expect(produced.sort())
                .toEqual(["OptNone.interp", "OptNone.tokens", "OptNoneLexer.interp", "OptNoneLexer.tokens"].sort());
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });
});
