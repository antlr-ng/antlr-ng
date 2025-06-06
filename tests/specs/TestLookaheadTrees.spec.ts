/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore MULT

import { CharStream, CommonTokenStream } from "antlr4ng";
import { describe, expect, it } from "vitest";

import { defineConfig } from "../../src/config/config.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar, GrammarParserInterpreter, LexerGrammar } from "../../src/tool/index.js";
import { InterpreterTreeTextProvider } from "../support/InterpreterTreeTextProvider.js";
import { ToolTestUtils } from "../ToolTestUtils.js";

const tsGenerator = new TypeScriptTargetGenerator();
const testParameters = defineConfig({
    grammarFiles: [],
    outputDirectory: "",
    generators: [tsGenerator]
});

describe("TestLookaheadTrees", () => {
    const lexerText =
        "lexer grammar L;\n" +
        "DOT  : '.' ;\n" +
        "SEMI : ';' ;\n" +
        "BANG : '!' ;\n" +
        "PLUS : '+' ;\n" +
        "LPAREN : '(' ;\n" +
        "RPAREN : ')' ;\n" +
        "MULT : '*' ;\n" +
        "ID : [a-z]+ ;\n" +
        "INT : [0-9]+ ;\n" +
        "WS : [ \\r\\t\\n]+ ;\n";

    const testLookaheadTrees = (lg: LexerGrammar, g: Grammar, input: string, startRuleName: string, decision: number,
        expectedTrees: string[]): void => {
        const startRuleIndex = g.getRule(startRuleName)!.index;
        const nodeTextProvider = new InterpreterTreeTextProvider(g.getRuleNames());

        const lexEngine = lg.createLexerInterpreter(CharStream.fromString(input));
        const tokens = new CommonTokenStream(lexEngine);
        const parser = g.createGrammarParserInterpreter(tokens);
        parser.setProfile(true);
        parser.parse(startRuleIndex);

        const decisionInfo = parser.getParseInfo()!.getDecisionInfo()[decision];
        const lookaheadEventInfo = decisionInfo.sllMaxLookEvent;

        const lookaheadParseTrees = GrammarParserInterpreter.getLookaheadParseTrees(g, parser, tokens, startRuleIndex,
            lookaheadEventInfo.decision, lookaheadEventInfo.startIndex, lookaheadEventInfo.stopIndex);

        expect(lookaheadParseTrees.length).toBe(expectedTrees.length);
        for (let i = 0; i < lookaheadParseTrees.length; i++) {
            const lt = lookaheadParseTrees[i];
            expect(ToolTestUtils.toStringTree(lt, nodeTextProvider)).toBe(expectedTrees[i]);
        }
    };

    it("testAlts", () => {
        const lg = new LexerGrammar(lexerText);
        lg.tool.process(lg, testParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : e SEMI EOF ;\n" +
            "e : ID DOT ID\n" +
            "  | ID LPAREN RPAREN\n" +
            "  ;\n",
            lg);
        g.tool.process(g, testParameters, false);

        const startRuleName = "s";
        const decision = 0;

        testLookaheadTrees(lg, g, "a.b;", startRuleName, decision, ["(e:1 a . b)", "(e:2 a <error .>)"]);
    });

    it("testAlts2", () => {
        const lg = new LexerGrammar(lexerText);
        lg.tool.process(lg, testParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : e? SEMI EOF ;\n" +
            "e : ID\n" +
            "  | e BANG" +
            "  ;\n",
            lg);
        g.tool.process(g, testParameters, false);

        const startRuleName = "s";
        const decision = 1; // (...)* in e.

        testLookaheadTrees(lg, g, "a;", startRuleName, decision,
            ["(e:2 (e:1 a) <error ;>)", // Decision for alt 1 is error as no ! char, but alt 2 (exit) is good.
                "(s:1 (e:1 a) ; <EOF>)"]); // root s:1 is included to show ';' node
    });

    it("testIncludeEOF", () => {
        const lg = new LexerGrammar(lexerText);
        lg.tool.process(lg, testParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : e ;\n" +
            "e : ID DOT ID EOF\n" +
            "  | ID DOT ID EOF\n" +
            "  ;\n",
            lg);
        g.tool.process(g, testParameters, false);

        const decision = 0;
        testLookaheadTrees(lg, g, "a.b", "s", decision,
            ["(e:1 a . b <EOF>)", "(e:2 a . b <EOF>)"]);
    });

    it("testCallLeftRecursiveRule", () => {
        const lg = new LexerGrammar(lexerText);
        lg.tool.process(lg, testParameters, false);

        const g = new Grammar(
            "parser grammar T;\n" +
            "s : a BANG EOF;\n" +
            "a : e SEMI \n" +
            "  | ID SEMI \n" +
            "  ;" +
            "e : e MULT e\n" +
            "  | e PLUS e\n" +
            "  | e DOT e\n" +
            "  | ID\n" +
            "  | INT\n" +
            "  ;\n",
            lg);
        g.tool.process(g, testParameters, false);

        let decision = 0;
        testLookaheadTrees(lg, g, "x;!", "s", decision,
            ["(a:1 (e:4 x) ;)",
                "(a:2 x ;)"]); // shouldn't include BANG, EOF
        decision = 2; // (...)* in e
        testLookaheadTrees(lg, g, "x+1;!", "s", decision,
            ["(e:1 (e:4 x) <error +>)",
                "(e:2 (e:4 x) + (e:5 1))",
                "(e:3 (e:4 x) <error +>)"]);
    });

});
