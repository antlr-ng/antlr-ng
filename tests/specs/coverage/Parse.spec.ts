/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import type { CommonToken, CommonTokenStream } from "antlr4ng";

import { GrammarToken } from "../../../src/parse/GrammarToken.js";
import { ScopeParser } from "../../../src/parse/ScopeParser.js";
import { TokenVocabParser } from "../../../src/parse/TokenVocabParser.js";
import { generateRandomFilename } from "../../../src/support/fs-helpers.js";
import { fileSystem } from "../../../src/tool-parameters.js";
import { IssueCode } from "../../../src/tool/Issues.js";
import { Grammar } from "../../../src/tool/index.js";
import { ErrorQueue } from "../../support/ErrorQueue.js";
import { dummyConfiguration } from "./GenerationHelper.js";

describe("Parse coverage", () => {
    describe("ScopeParser", () => {
        const g = new Grammar("grammar T;\na : A ;");

        it("parses prefix declarations with types, init values and nested separators", () => {
            const dict = ScopeParser.parseTypedArgList(null,
                "int x, String y = \"a,b\", List<int> z = 3, Map<K,V> m, char *p[], int, _q", g);

            expect(dict.size()).toBe(7);
            expect(dict.get("x")).toMatchObject({ name: "x", type: "int" });
            expect(dict.get("y")).toMatchObject({ name: "y", type: "String", initValue: "\"a,b\"" });
            expect(dict.get("z")).toMatchObject({ name: "z", type: "List<int>", initValue: "3" });
            expect(dict.get("m")).toMatchObject({ name: "m", type: "Map<K,V>" });
            expect(dict.get("p")).toMatchObject({ name: "p", type: "char *[]" });
            expect(dict.get("int")).toMatchObject({ name: "int", type: undefined });
            expect(dict.get("_q")).toMatchObject({ name: "_q", type: undefined });
        });

        it("parses postfix declarations and bracket/brace nesting", () => {
            const dict = ScopeParser.parseTypedArgList(null,
                "x:int, y: Map<K, V> = {a, b}, arr : int[] = [1, 2], ns::Type q, c:'\\'' , d:\"\\\"\"", g);

            expect(dict.get("x")).toMatchObject({ name: "x", type: "int" });
            expect(dict.get("y")).toMatchObject({ name: "y", type: "Map<K, V>", initValue: "{a, b}" });
            expect(dict.get("arr")).toMatchObject({ name: "arr", type: "int[]", initValue: "[1, 2]" });
            expect(dict.get("q")).toMatchObject({ name: "q", type: "ns::Type" });
            expect(dict.get("c")).toMatchObject({ name: "c", type: "'\\''" });
            expect(dict.get("d")).toMatchObject({ name: "d", type: "\"\\\"\"" });
        });

        it("reports declarations without a name", () => {
            const grammar = new Grammar("grammar T2;\na : A ;");
            const queue = new ErrorQueue(grammar.tool.errorManager);
            grammar.tool.errorManager.addListener(queue);

            const dict = ScopeParser.parseTypedArgList(null, "*, :int, a < b", grammar);
            expect(dict.size()).toBeGreaterThanOrEqual(1);
            expect(queue.errors.map((e) => { return e.code; }))
                .toEqual([IssueCode.CannotFindAttributeNameInDecl, IssueCode.CannotFindAttributeNameInDecl]);
        });

        it("computes token positions for declarations in rule arguments", () => {
            const grammar = new Grammar(
                "grammar T3;\n" +
                "a[int x,\n" +
                "String y,\n" +
                "z:int] returns [int r] locals [int l = 3] : A ;\n");
            grammar.tool.process(grammar, dummyConfiguration(), false);

            const rule = grammar.getRule("a")!;
            expect(rule.args!.size()).toBe(3);

            const x = rule.args!.get("x")!;
            expect(x.token!.line).toBe(2);
            expect(x.token!.column).toBe(6);
            expect(x.token!.text).toBe("x");

            const y = rule.args!.get("y")!;
            expect(y.token!.line).toBe(3);
            expect(y.type).toBe("String");

            const z = rule.args!.get("z")!;
            expect(z.name).toBe("z");
            expect(z.type).toBe("int");

            expect(rule.retvals!.get("r")!.type).toBe("int");
            expect(rule.locals!.get("l")).toMatchObject({ type: "int", initValue: "3" });
        });
    });

    describe("TokenVocabParser", () => {
        const createGrammar = (name: string): Grammar => {
            const g = new Grammar(`parser grammar ${name};\noptions { tokenVocab = ${name}Vocab; }\na : A ;`);

            return g;
        };

        it("loads a tokens file from the lib directory", () => {
            const lib = generateRandomFilename("/tmp/vocab-");
            fileSystem.mkdirSync(lib, { recursive: true });
            try {
                fileSystem.writeFileSync(lib + "/PVocab.tokens", "A=1\n'a'=1\nB=2\n\nC=10\n");

                const g = createGrammar("P");
                const tokens = new TokenVocabParser(g, "/nonexistent", lib).load();
                expect([...tokens.entries()]).toEqual([["A", 1], ["'a'", 1], ["B", 2], ["C", 10]]);
            } finally {
                fileSystem.rmSync(lib, { recursive: true, force: true });
            }
        });

        it("falls back to the output directory and reports syntax errors", () => {
            const out = generateRandomFilename("/tmp/vocab-");
            fileSystem.mkdirSync(out, { recursive: true });
            try {
                fileSystem.writeFileSync(out + "/QVocab.tokens", "A=1\nthis is bad\nB=x\n");

                const g = createGrammar("Q");
                g.tool.errorManager.configure(dummyConfiguration().messageFormatOptions);
                const queue = new ErrorQueue(g.tool.errorManager);
                g.tool.errorManager.addListener(queue);

                const tokens = new TokenVocabParser(g, out, "/nonexistent").load();
                expect([...tokens.entries()]).toEqual([["A", 1], ["B", NaN]]);
                expect(queue.errors).toHaveLength(1);
                expect(queue.errors[0].code).toBe(IssueCode.TokensFileSyntaxError);
                expect(queue.errors[0].toString()).toContain("bad token def: this is bad");
            } finally {
                fileSystem.rmSync(out, { recursive: true, force: true });
            }
        });

        it("falls back to the grammar's directory", () => {
            const dir = generateRandomFilename("/tmp/vocab-");
            fileSystem.mkdirSync(dir, { recursive: true });
            try {
                fileSystem.writeFileSync(dir + "/RVocab.tokens", "X=5\n");

                const g = createGrammar("R");
                g.fileName = dir + "/R.g4";
                const tokens = new TokenVocabParser(g, "", "/nonexistent").load();
                expect(tokens.get("X")).toBe(5);
            } finally {
                fileSystem.rmSync(dir, { recursive: true, force: true });
            }
        });

        it("reports a missing tokens file referenced in the grammar", () => {
            const g = createGrammar("S");
            const queue = new ErrorQueue(g.tool.errorManager);
            g.tool.errorManager.addListener(queue);

            const parser = new TokenVocabParser(g, "/nonexistent", "/nonexistent");
            expect(parser.getImportedVocabFile()).toBe("");
            expect(parser.load().size).toBe(0);
            expect(queue.errors.map((e) => { return e.code; })).toEqual([
                IssueCode.CannotFindTokensFileRefdInGrammar, IssueCode.CannotFindTokensFileRefdInGrammar,
            ]);
        });

        it("returns an empty content without a tokenVocab option", () => {
            const g = new Grammar("grammar U;\na : A ;");
            expect(new TokenVocabParser(g, "/nonexistent").getImportedVocabFile()).toBe("");
        });
    });

    describe("GrammarToken", () => {
        const g = new Grammar("grammar W;\na : A ;\nA : 'x' ;");
        const stream = g.originalTokenStream as CommonTokenStream;
        stream.fill();

        it("renders tokens without an original token index", () => {
            // Token 4 is the line break after the grammar header.
            const token = new GrammarToken(g, stream.get(4));
            expect(token.getTokenIndex()).toBe(-1);
            expect(token.text).toBe("\n");
            expect(token.getLine()).toBe(1);
            expect(token.getCharPositionInLine()).toBe(10);
            expect(token.getStartIndex()).toBe(10);
            expect(token.getStopIndex()).toBe(10);
            expect(token.toString()).toBe(`[@-1,10:10='\\\\n',<${token.type}>,channel=2,1:10]`);
        });

        it("delegates to the original token stream when an original index is set", () => {
            // Token 2 is the "W" grammar name on line 1, token 5 the rule name "a" on line 2.
            const original = stream.get(5) as CommonToken;
            const token = new GrammarToken(g, stream.get(2));
            token.originalTokenIndex = 5;

            expect(token.getTokenIndex()).toBe(5);
            expect(token.getLine()).toBe(2);
            expect(token.getCharPositionInLine()).toBe(0);
            expect(token.getStartIndex()).toBe(original.start);
            expect(token.getStopIndex()).toBe(original.start);
            expect(token.toString()).toBe(`[@5,${original.start}:${original.start}='W',<${token.type}>,2:0]`);
        });
    });
});
