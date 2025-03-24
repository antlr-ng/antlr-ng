/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore MULT aaaaaab abaaabc babac

import { describe, expect, it } from "vitest";

import { CharStream, CommonTokenStream, ParseTree } from "antlr4ng";

import type { IToolParameters } from "../src/tool-parameters.js";
import { Grammar, LexerGrammar } from "../src/tool/index.js";

describe("TestParserInterpreter", () => {
    const testInterp = (lg: LexerGrammar, g: Grammar, startRule: string, input: string,
        expectedParseTree: string): ParseTree => {
        const lexEngine = lg.createLexerInterpreter(CharStream.fromString(input));
        const tokens = new CommonTokenStream(lexEngine);
        const parser = g.createParserInterpreter(tokens);
        const t = parser.parse(g.rules.get(startRule)!.index);

        expect(t.toStringTree(parser), expectedParseTree);

        return t;
    };

    it("testEmptyStartRule", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s :  ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "", "s");
        testInterp(lg, g, "s", "a", "s");
    });

    it("testA", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : A ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "a", "(s a)");
        expect(t.getSourceInterval().toString()).toBe("0..0");
    });

    it("testEOF", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : A EOF ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "a", "(s a <EOF>)");
        expect(t.getSourceInterval().toString()).toBe("0..1");
    });

    it("testEOFInChild", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : x ;\n" +
            "x : A EOF ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "a", "(s (x a <EOF>))");
        expect(t.getSourceInterval().toString()).toBe("0..1");
        expect(t.getChild(0)!.getSourceInterval().toString()).toBe("0..1");
    });

    it("testEmptyRuleAfterEOFInChild", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : x y;\n" +
            "x : A EOF ;\n" +
            "y : ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "a", "(s (x a <EOF>) y)");
        expect(t.getSourceInterval().toString()).toBe("0..1"); // s
        expect(t.getChild(0)!.getSourceInterval().toString()).toBe("0..1"); // x
    });

    it("testEmptyRuleAfterJustEOFInChild", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : x y;\n" +
            "x : EOF ;\n" +
            "y : ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "", "(s (x <EOF>) y)");
        expect(t.getSourceInterval().toString()).toBe("0..0"); // s
        expect(t.getChild(0)!.getSourceInterval().toString()).toBe("0..0"); // x
    });

    it("testEmptyInput", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : x EOF ;\n" +
            "x : ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "", "(s x <EOF>)");
        expect(t.getSourceInterval().toString()).toBe("0..0"); // s
        expect(t.getChild(0)!.getSourceInterval().toString()).toBe("0..-1"); // x
    });

    it("testEmptyInputWithCallsAfter", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : x y ;\n" +
            "x : EOF ;\n" +
            "y : z ;\n" +
            "z : ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "", "(s (x <EOF>) (y z))");
        expect(t.getSourceInterval().toString()).toBe("0..0"); // s
        expect(t.getChild(0)!.getSourceInterval().toString()).toBe("0..0"); // x
    });

    it("testEmptyFirstRule", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : x A ;\n" +
            "x : ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        const t = testInterp(lg, g, "s", "a", "(s x a)");
        expect(t.getSourceInterval().toString()).toBe("0..0"); // s

        // This gets an empty interval because the stop token is null for x
        expect(t.getChild(0)!.getSourceInterval().toString()).toBe("0..-1"); // x
    });

    it("testAorB", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : A{;} | B ;",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "a", "(s a)");
        testInterp(lg, g, "s", "b", "(s b)");
    });

    it("testCall", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : t C ;\n" +
            "t : A{;} | B ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "ac", "(s (t a) c)");
        testInterp(lg, g, "s", "bc", "(s (t b) c)");
    });

    it("testCall2", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : t C ;\n" +
            "t : u ;\n" +
            "u : A{;} | B ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "ac", "(s (t (u a)) c)");
        testInterp(lg, g, "s", "bc", "(s (t (u b)) c)");
    });

    it("testOptionalA", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : A? B ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "b", "(s b)");
        testInterp(lg, g, "s", "ab", "(s a b)");
    });

    it("testOptionalAorB", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : (A{;}|B)? C ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "c", "(s c)");
        testInterp(lg, g, "s", "ac", "(s a c)");
        testInterp(lg, g, "s", "bc", "(s b c)");
    });

    it("testStarA", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : A* B ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "b", "(s b)");
        testInterp(lg, g, "s", "ab", "(s a b)");
        testInterp(lg, g, "s", "aaaaaab", "(s a a a a a a b)");
    });

    it("testStarAorB", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : (A{;}|B)* C ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "c", "(s c)");
        testInterp(lg, g, "s", "ac", "(s a c)");
        testInterp(lg, g, "s", "bc", "(s b c)");
        testInterp(lg, g, "s", "abaaabc", "(s a b a a a b c)");
        testInterp(lg, g, "s", "babac", "(s b a b a c)");
    });

    it("testLeftRecursion", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n" +
            "PLUS : '+' ;\n" +
            "MULT : '*' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : e ;\n" +
            "e : e MULT e\n" +
            "  | e PLUS e\n" +
            "  | A\n" +
            "  ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "s", "a", "(s (e a))");
        testInterp(lg, g, "s", "a+a", "(s (e (e a) + (e a)))");
        testInterp(lg, g, "s", "a*a", "(s (e (e a) * (e a)))");
        testInterp(lg, g, "s", "a+a+a", "(s (e (e (e a) + (e a)) + (e a)))");
        testInterp(lg, g, "s", "a*a+a", "(s (e (e (e a) * (e a)) + (e a)))");
        testInterp(lg, g, "s", "a+a*a", "(s (e (e a) + (e (e a) * (e a))))");
    });

    /**
     * This is a regression test for antlr/antlr4#461.
     * https://github.com/antlr/antlr4/issues/461
     */
    it("testLeftRecursiveStartRule", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n" +
            "PLUS : '+' ;\n" +
            "MULT : '*' ;\n");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : e ;\n" +
            "e : e MULT e\n" +
            "  | e PLUS e\n" +
            "  | A\n" +
            "  ;\n",
            lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "e", "a", "(e a)");
        testInterp(lg, g, "e", "a+a", "(e (e a) + (e a))");
        testInterp(lg, g, "e", "a*a", "(e (e a) * (e a))");
        testInterp(lg, g, "e", "a+a+a", "(e (e (e a) + (e a)) + (e a))");
        testInterp(lg, g, "e", "a*a+a", "(e (e (e a) * (e a)) + (e a))");
        testInterp(lg, g, "e", "a+a*a", "(e (e a) + (e (e a) * (e a)))");
    });

    it("testCaseInsensitiveTokensInParser", () => {
        const lg = new LexerGrammar(
            "lexer grammar L;\n" +
            "options { caseInsensitive = true; }\n" +
            "NOT: 'not';\n" +
            "AND: 'and';\n" +
            "NEW: 'new';\n" +
            "LB:  '(';\n" +
            "RB:  ')';\n" +
            "ID: [a-z_][a-z_0-9]*;\n" +
            "WS: [ \\t\\n\\r]+ -> skip;");
        lg.tool.process(lg, {} as IToolParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "options { caseInsensitive = true; }\n" +
            "e\n" +
            "    : ID\n" +
            "    | 'not' e\n" +
            "    | e 'and' e\n" +
            "    | 'new' ID '(' e ')'\n" +
            "    ;", lg);
        g.tool.process(g, {} as IToolParameters, false);

        testInterp(lg, g, "e", "NEW Abc (Not a AND not B)", "(e NEW Abc ( (e (e Not (e a)) AND (e not (e B))) ))");
    });

});
