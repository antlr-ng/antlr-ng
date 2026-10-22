/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { ATNState } from "antlr4ng";

import { ATNPrinter } from "../../src/automata/ATNPrinter.js";
import { LexerATNFactory } from "../../src/automata/LexerATNFactory.js";
import { defineConfig } from "../../src/config/config.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { ANTLRv4Parser } from "../../src/generated/ANTLRv4Parser.js";
import { convertMapToString } from "../../src/support/helpers.js";
import { LexerGrammar } from "../../src/tool/LexerGrammar.js";
import type { GrammarAST } from "../../src/tool/ast/GrammarAST.js";
import type { RuleAST } from "../../src/tool/ast/RuleAST.js";
import { IssueCode } from "../../src/tool/Issues.js";
import { Grammar, Tool } from "../../src/tool/index.js";
import { lexerModeATN, parserRuleATN } from "../support/GenerationHelper.js";
import { ErrorQueue } from "../support/ErrorQueue.js";

const tsGenerator = new TypeScriptTargetGenerator();
const dummyParameters = defineConfig({
    grammarFiles: [],
    outputDirectory: "",
    generators: [tsGenerator]
});

describe("TestATNConstruction", () => {
    const checkRuleATN = (g: Grammar, ruleName: string, expecting: string): void => {
        g.tool.process(g, dummyParameters, false);

        const r = g.getRule(ruleName)!;
        const startState = g.getATN().ruleToStartState[r.index];
        const serializer = new ATNPrinter(g, startState!);
        const result = serializer.asString();

        expect(result).toBe(expecting);
    };

    const checkTokensRule = (g: LexerGrammar, modeName: string, expecting: string): void => {
        g.tool.process(g, dummyParameters, false);

        if (!modeName) {
            modeName = "DEFAULT_MODE";
        }

        if (!g.modes.get(modeName)) {
            console.error("no such mode " + modeName);

            return;
        }

        const f = new LexerATNFactory(g, tsGenerator);
        const nfa = f.createATN();
        const startState = nfa.modeNameToStartState.get(modeName);
        const serializer = new ATNPrinter(g, startState!);
        const result = serializer.asString();

        expect(result).toBe(expecting);
    };

    it("testA", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A;");

        const expecting =
            "RuleStart_a_0->s2\n" +
            "s2-A->s3\n" +
            "s3->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s4\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAB", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A B ;");

        const expecting =
            "RuleStart_a_0->s2\n" +
            "s2-A->s3\n" +
            "s3-B->s4\n" +
            "s4->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s5\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAorB", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A | B {;} ;");

        const expecting =
            "RuleStart_a_0->BlockStart_5\n" +
            "BlockStart_5->s2\n" +
            "BlockStart_5->s3\n" +
            "s2-A->BlockEnd_6\n" +
            "s3-B->s4\n" +
            "BlockEnd_6->RuleStop_a_1\n" +
            "s4-action_0:-1->BlockEnd_6\n" +
            "RuleStop_a_1-EOF->s7\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testSetAorB", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A | B ;");

        const expecting =
            "RuleStart_a_0->s2\n" +
            "s2-{A, B}->s3\n" +
            "s3->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s4\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testLexerIsNotSetMultiCharString", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : ('0x' | '0X') ;");

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->BlockStart_7\n" +
            "BlockStart_7->s3\n" +
            "BlockStart_7->s5\n" +
            "s3-'0'->s4\n" +
            "s5-'0'->s6\n" +
            "s4-'x'->BlockEnd_8\n" +
            "s6-'X'->BlockEnd_8\n" +
            "BlockEnd_8->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testRange", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : 'a'..'c' ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-'a'..'c'->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSet", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [abc] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{97..99}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetRange", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [a-c] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{97..99}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodeBMPEscape", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [\\uABCD] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-43981->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodeBMPEscapeRange", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [a-c\\uABCD-\\uABFF] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{97..99, 43981..44031}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodeSMPEscape", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [\\u{10ABCD}] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-1092557->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodeSMPEscapeRange", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [a-c\\u{10ABCD}-\\u{10ABFF}] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{97..99, 1092557..1092607}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodePropertyEscape", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [\\p{Gothic}] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{66352..66383}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodePropertyInvertEscape", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [\\P{Gothic}] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{0..66351, 66384..1114111}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodeMultiplePropertyEscape", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [\\p{Gothic}\\p{Mahajani}] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{66352..66383, 69968..70015}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testCharSetUnicodePropertyOverlap", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : [\\p{ASCII_Hex_Digit}\\p{Hex_Digit}] ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->s3\n" +
            "s3-{48..57, 65..70, 97..102, 65296..65305, 65313..65318, 65345..65350}->s4\n" +
            "s4->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testRangeOrRange", (): void => {
        const g = new LexerGrammar(
            "lexer grammar P;\n" +
            "A : ('a'..'c' 'h' | 'q' 'j'..'l') ;"
        );

        const expecting =
            "s0->RuleStart_A_1\n" +
            "RuleStart_A_1->BlockStart_7\n" +
            "BlockStart_7->s3\n" +
            "BlockStart_7->s5\n" +
            "s3-'a'..'c'->s4\n" +
            "s5-'q'->s6\n" +
            "s4-'h'->BlockEnd_8\n" +
            "s6-'j'..'l'->BlockEnd_8\n" +
            "BlockEnd_8->RuleStop_A_2\n";
        checkTokensRule(g, "", expecting);
    });

    it("testStringLiteralInParser", (): void => {
        const g = new Grammar(
            "grammar P;\n" +
            "a : A|'b' ;"
        );

        const expecting =
            "RuleStart_a_0->s2\n" +
            "s2-{'b', A}->s3\n" +
            "s3->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s4\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testABorCD", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A B | C D;");

        const expecting =
            "RuleStart_a_0->BlockStart_6\n" +
            "BlockStart_6->s2\n" +
            "BlockStart_6->s4\n" +
            "s2-A->s3\n" +
            "s4-C->s5\n" +
            "s3-B->BlockEnd_7\n" +
            "s5-D->BlockEnd_7\n" +
            "BlockEnd_7->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s8\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testBA", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : b A ;\n" +
            "b : B ;");
        let expecting =
            "RuleStart_a_0->s4\n" +
            "s4-b->RuleStart_b_2\n" +
            "s5-A->s6\n" +
            "s6->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s9\n";
        checkRuleATN(g, "a", expecting);
        expecting =
            "RuleStart_b_2->s7\n" +
            "s7-B->s8\n" +
            "s8->RuleStop_b_3\n" +
            "RuleStop_b_3->s5\n";
        checkRuleATN(g, "b", expecting);
    });

    it("testFollow", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : b A ;\n" +
            "b : B ;\n" +
            "c : b C;");

        const expecting =
            "RuleStart_b_2->s9\n" +
            "s9-B->s10\n" +
            "s10->RuleStop_b_3\n" +
            "RuleStop_b_3->s7\n" +
            "RuleStop_b_3->s12\n";
        checkRuleATN(g, "b", expecting);
    });

    it("testAorEpsilon", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A | ;");

        const expecting =
            "RuleStart_a_0->BlockStart_4\n" +
            "BlockStart_4->s2\n" +
            "BlockStart_4->s3\n" +
            "s2-A->BlockEnd_5\n" +
            "s3->BlockEnd_5\n" +
            "BlockEnd_5->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s6\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAOptional", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A?;");

        const expecting =
            "RuleStart_a_0->BlockStart_3\n" +
            "BlockStart_3->s2\n" +
            "BlockStart_3->BlockEnd_4\n" +
            "s2-A->BlockEnd_4\n" +
            "BlockEnd_4->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s5\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAorBOptional", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : (A{;}|B)?;");

        const expecting =
            "RuleStart_a_0->BlockStart_5\n" +
            "BlockStart_5->s2\n" +
            "BlockStart_5->s4\n" +
            "BlockStart_5->BlockEnd_6\n" +
            "s2-A->s3\n" +
            "s4-B->BlockEnd_6\n" +
            "BlockEnd_6->RuleStop_a_1\n" +
            "s3-action_0:-1->BlockEnd_6\n" +
            "RuleStop_a_1-EOF->s7\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testSetAorBOptional", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : (A|B)?;");

        const expecting =
            "RuleStart_a_0->BlockStart_3\n" +
            "BlockStart_3->s2\n" +
            "BlockStart_3->BlockEnd_4\n" +
            "s2-{A, B}->BlockEnd_4\n" +
            "BlockEnd_4->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s5\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAorBThenC", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : (A | B) C;");

        const expecting =
            "RuleStart_a_0->s2\n" +
            "s2-{A, B}->s3\n" +
            "s3-C->s4\n" +
            "s4->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s5\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAplus", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A+;");

        const expecting =
            "RuleStart_a_0->PlusBlockStart_3\n" +
            "PlusBlockStart_3->s2\n" +
            "s2-A->BlockEnd_4\n" +
            "BlockEnd_4->PlusLoopBack_5\n" +
            "PlusLoopBack_5->PlusBlockStart_3\n" +
            "PlusLoopBack_5->s6\n" +
            "s6->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s7\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAplusSingleAltHasPlusASTPointingAtLoopBackState", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "s : a B ;\n" + // (RULE a (BLOCK (ALT (+ (BLOCK (ALT A))))))
            "a : A+;");

        const expecting =
            "RuleStart_a_2->PlusBlockStart_8\n" +
            "PlusBlockStart_8->s7\n" +
            "s7-A->BlockEnd_9\n" +
            "BlockEnd_9->PlusLoopBack_10\n" +
            "PlusLoopBack_10->PlusBlockStart_8\n" +
            "PlusLoopBack_10->s11\n" +
            "s11->RuleStop_a_3\n" +
            "RuleStop_a_3->s5\n";
        checkRuleATN(g, "a", expecting);

        // Get all AST -> ATNState relationships. Make sure loopback is covered when no loop entry decision
        const ruleNodes = g.ast.getNodesWithType(ANTLRv4Parser.RULE);
        const a = ruleNodes[1] as RuleAST;
        const nodesInRule = a.getNodesWithType(null);
        const covered = new Map<GrammarAST, ATNState>();
        for (const node of nodesInRule) {
            if (node.atnState) {
                covered.set(node, node.atnState);
            }
        }

        expect(convertMapToString(covered)).toBe("{RULE=2, BLOCK=8, +=10, BLOCK=8, A=7}");
    });

    it("testAorBPlus", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : (A|B{;})+;");

        const expecting =
            "RuleStart_a_0->PlusBlockStart_5\n" +
            "PlusBlockStart_5->s2\n" +
            "PlusBlockStart_5->s3\n" +
            "s2-A->BlockEnd_6\n" +
            "s3-B->s4\n" +
            "BlockEnd_6->PlusLoopBack_7\n" +
            "s4-action_0:-1->BlockEnd_6\n" +
            "PlusLoopBack_7->PlusBlockStart_5\n" +
            "PlusLoopBack_7->s8\n" +
            "s8->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s9\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAorBorEmptyPlus", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : (A | B | )+ ;");

        const expecting =
            "RuleStart_a_0->PlusBlockStart_5\n" +
            "PlusBlockStart_5->s2\n" +
            "PlusBlockStart_5->s3\n" +
            "PlusBlockStart_5->s4\n" +
            "s2-A->BlockEnd_6\n" +
            "s3-B->BlockEnd_6\n" +
            "s4->BlockEnd_6\n" +
            "BlockEnd_6->PlusLoopBack_7\n" +
            "PlusLoopBack_7->PlusBlockStart_5\n" +
            "PlusLoopBack_7->s8\n" +
            "s8->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s9\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testEmptyOrEmpty", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : | ;");

        const expecting =
            "RuleStart_a_0->BlockStart_4\n" +
            "BlockStart_4->s2\n" +
            "BlockStart_4->s3\n" +
            "s2->BlockEnd_5\n" +
            "s3->BlockEnd_5\n" +
            "BlockEnd_5->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s6\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAStar", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : A*;");

        const expecting =
            "RuleStart_a_0->StarLoopEntry_5\n" +
            "StarLoopEntry_5->StarBlockStart_3\n" +
            "StarLoopEntry_5->s6\n" +
            "StarBlockStart_3->s2\n" +
            "s6->RuleStop_a_1\n" +
            "s2-A->BlockEnd_4\n" +
            "RuleStop_a_1-EOF->s8\n" +
            "BlockEnd_4->StarLoopBack_7\n" +
            "StarLoopBack_7->StarLoopEntry_5\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testNestedAStar", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : (COMMA ID*)*;");

        const expecting =
            "RuleStart_a_0->StarLoopEntry_11\n" +
            "StarLoopEntry_11->StarBlockStart_9\n" +
            "StarLoopEntry_11->s12\n" +
            "StarBlockStart_9->s2\n" +
            "s12->RuleStop_a_1\n" +
            "s2-COMMA->StarLoopEntry_6\n" +
            "RuleStop_a_1-EOF->s14\n" +
            "StarLoopEntry_6->StarBlockStart_4\n" +
            "StarLoopEntry_6->s7\n" +
            "StarBlockStart_4->s3\n" +
            "s7->BlockEnd_10\n" +
            "s3-ID->BlockEnd_5\n" +
            "BlockEnd_10->StarLoopBack_13\n" +
            "BlockEnd_5->StarLoopBack_8\n" +
            "StarLoopBack_13->StarLoopEntry_11\n" +
            "StarLoopBack_8->StarLoopEntry_6\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testAorBStar", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : (A | B{;})* ;");

        const expecting =
            "RuleStart_a_0->StarLoopEntry_7\n" +
            "StarLoopEntry_7->StarBlockStart_5\n" +
            "StarLoopEntry_7->s8\n" +
            "StarBlockStart_5->s2\n" +
            "StarBlockStart_5->s3\n" +
            "s8->RuleStop_a_1\n" +
            "s2-A->BlockEnd_6\n" +
            "s3-B->s4\n" +
            "RuleStop_a_1-EOF->s10\n" +
            "BlockEnd_6->StarLoopBack_9\n" +
            "s4-action_0:-1->BlockEnd_6\n" +
            "StarLoopBack_9->StarLoopEntry_7\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testPredicatedAorB", (): void => {
        const g = new Grammar(
            "parser grammar P;\n" +
            "a : {p1}? A | {p2}? B ;");

        const expecting =
            "RuleStart_a_0->BlockStart_6\n" +
            "BlockStart_6->s2\n" +
            "BlockStart_6->s4\n" +
            "s2-pred_0:0->s3\n" +
            "s4-pred_0:1->s5\n" +
            "s3-A->BlockEnd_7\n" +
            "s5-B->BlockEnd_7\n" +
            "BlockEnd_7->RuleStop_a_1\n" +
            "RuleStop_a_1-EOF->s8\n";
        checkRuleATN(g, "a", expecting);
    });

    it("testParserRuleRefInLexerRule", (): void => {
        const grammarString =
            "grammar U;\n" +
            "a : A;\n" +
            "A : a;\n"; // Error: parser rule referenced in lexer rule.

        const tool = new Tool();
        tool.errorManager.configure(dummyParameters.messageFormatOptions);

        const errorQueue = new ErrorQueue(tool.errorManager);
        tool.errorManager.removeListeners();
        tool.errorManager.addListener(errorQueue);

        const t = tool.parseGrammarFromString(grammarString);

        expect(t).toBeUndefined();
        expect(errorQueue.size()).toBe(1);
        expect(errorQueue.errors[0].toString()).toContain("no viable alternative at input 'a'");

    });

    /**
     * Test for https://github.com/antlr/antlr4/issues/1369
     * Repeated edges:
     * ```
     * RuleStop_e_3->BlockEnd_26
     * RuleStop_e_3->BlockEnd_26
     * RuleStop_e_3->BlockEnd_26
     * ```
     */
    it("testForRepeatedTransitionsToStopState", (): void => {
        // This is a left recursive rule which is rewritten to use precedence predicates, hence the pred entries.
        const grammarString =
            "grammar T;\n" +
            "\t s : e EOF;\n" +
            "\t e :<assoc=right> e '*' e\n" +
            "\t   |<assoc=right> e '+' e\n" +
            "\t   |<assoc=right> e '?' e ':' e\n" +
            "\t   |<assoc=right> e '=' e\n" +
            "\t   | ID\n" +
            "\t   ;\n" +
            "\t ID : 'a'..'z'+ ;\n" +
            "\t WS : (' '|'\\n') -> skip ;";
        const g = new Grammar(grammarString);
        g.tool.process(g, dummyParameters, false);

        const expecting =
            "RuleStart_e_2->s7\n" +
            "s7-action_1:-1->s8\n" +
            "s8-ID->s9\n" +
            "s9->StarLoopEntry_27\n" +
            "StarLoopEntry_27->StarBlockStart_25\n" +
            "StarLoopEntry_27->s28\n" +
            "StarBlockStart_25->s10\n" +
            "StarBlockStart_25->s13\n" +
            "StarBlockStart_25->s16\n" +
            "StarBlockStart_25->s22\n" +
            "s28->RuleStop_e_3\n" +
            "s10-5 >= _p->s11\n" +
            "s13-4 >= _p->s14\n" +
            "s16-3 >= _p->s17\n" +
            "s22-2 >= _p->s23\n" +
            "RuleStop_e_3->s5\n" +
            "RuleStop_e_3->BlockEnd_26\n" +
            "RuleStop_e_3->s19\n" +
            "RuleStop_e_3->s21\n" +
            "s11-'*'->s12\n" +
            "s14-'+'->s15\n" +
            "s17-'?'->s18\n" +
            "s23-'='->s24\n" +
            "s12-e->RuleStart_e_2\n" +
            "s15-e->RuleStart_e_2\n" +
            "s18-e->RuleStart_e_2\n" +
            "s24-e->RuleStart_e_2\n" +
            "BlockEnd_26->StarLoopBack_29\n" +
            "s19-':'->s20\n" +
            "StarLoopBack_29->StarLoopEntry_27\n" +
            "s20-e->RuleStart_e_2\n" +
            "s21->BlockEnd_26\n";
        checkRuleATN(g, "e", expecting);
    });

    it("testDefaultMode", (): void => {
        const g = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "X : 'x' ;\n" +
            "mode FOO;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");

        const expecting =
            "s0->RuleStart_A_2\n" +
            "s0->RuleStart_X_4\n" +
            "RuleStart_A_2->s10\n" +
            "RuleStart_X_4->s12\n" +
            "s10-'a'->s11\n" +
            "s12-'x'->s13\n" +
            "s11->RuleStop_A_3\n" +
            "s13->RuleStop_X_5\n";
        checkTokensRule(g, "DEFAULT_MODE", expecting);
    });

    it("testMode", (): void => {
        const g = new LexerGrammar(
            "lexer grammar L;\n" +
            "A : 'a' ;\n" +
            "X : 'x' ;\n" +
            "mode FOO;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");

        const expecting =
            "s1->RuleStart_B_6\n" +
            "s1->RuleStart_C_8\n" +
            "RuleStart_B_6->s14\n" +
            "RuleStart_C_8->s16\n" +
            "s14-'b'->s15\n" +
            "s16-'c'->s17\n" +
            "s15->RuleStop_B_7\n" +
            "s17->RuleStop_C_9\n";
        checkTokensRule(g, "FOO", expecting);
    });
});

/**
 * These tests drive the ATNBuilder tree walker (and the ATN factories) with all EBNF forms, sets, wildcards,
 * labels, predicates, actions, lexer commands and character classes.
 */
describe("TestATNConstruction (EBNF forms, sets, labels, lexer commands)", () => {
    describe("parser rules", () => {
        it("optional, star and plus loops on single tokens", () => {
            const expected =
                "RuleStart_a_0->BlockStart_3\n" +
                "BlockStart_3->s2\n" +
                "BlockStart_3->BlockEnd_4\n" +
                "s2-A->BlockEnd_4\n" +
                "BlockEnd_4->StarLoopEntry_8\n" +
                "StarLoopEntry_8->StarBlockStart_6\n" +
                "StarLoopEntry_8->s9\n" +
                "StarBlockStart_6->s5\n" +
                "s9->PlusBlockStart_12\n" +
                "s5-B->BlockEnd_7\n" +
                "PlusBlockStart_12->s11\n" +
                "BlockEnd_7->StarLoopBack_10\n" +
                "s11-C->BlockEnd_13\n" +
                "StarLoopBack_10->StarLoopEntry_8\n" +
                "BlockEnd_13->PlusLoopBack_14\n" +
                "PlusLoopBack_14->PlusBlockStart_12\n" +
                "PlusLoopBack_14->s15\n" +
                "s15->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s16\n";
            expect(parserRuleATN("parser grammar P;\na : A? B* C+ ;", "a")).toBe(expected);
        });

        it("non-greedy star loop of a set", () => {
            // The exit branch is listed first for non-greedy loops.
            const expected =
                "RuleStart_a_0->StarLoopEntry_5\n" +
                "StarLoopEntry_5->s6\n" +
                "StarLoopEntry_5->StarBlockStart_3\n" +
                "s6->s8\n" +
                "StarBlockStart_3->s2\n" +
                "s8-C->s9\n" +
                "s2-{A, B}->BlockEnd_4\n" +
                "s9->RuleStop_a_1\n" +
                "BlockEnd_4->StarLoopBack_7\n" +
                "RuleStop_a_1-EOF->s10\n" +
                "StarLoopBack_7->StarLoopEntry_5\n";
            expect(parserRuleATN("parser grammar P;\na : (A | B)*? C ;", "a")).toBe(expected);
        });

        it("non-greedy plus loop", () => {
            const expected =
                "RuleStart_a_0->PlusBlockStart_3\n" +
                "PlusBlockStart_3->s2\n" +
                "s2-A->BlockEnd_4\n" +
                "BlockEnd_4->PlusLoopBack_5\n" +
                "PlusLoopBack_5->s6\n" +
                "PlusLoopBack_5->PlusBlockStart_3\n" +
                "s6->s7\n" +
                "s7-B->s8\n" +
                "s8->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s9\n";
            expect(parserRuleATN("parser grammar P;\na : (A)+? B ;", "a")).toBe(expected);
        });

        it("non-greedy optional", () => {
            const expected =
                "RuleStart_a_0->BlockStart_3\n" +
                "BlockStart_3->BlockEnd_4\n" +
                "BlockStart_3->s2\n" +
                "BlockEnd_4->s5\n" +
                "s2-A->BlockEnd_4\n" +
                "s5-B->s6\n" +
                "s6->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s7\n";
            expect(parserRuleATN("parser grammar P;\na : A?? B ;", "a")).toBe(expected);
        });

        it("non-greedy optional with a multi-alternative block", () => {
            const expected =
                "RuleStart_a_0->s2\n" +
                "s2-A->BlockStart_6\n" +
                "BlockStart_6->BlockEnd_7\n" +
                "BlockStart_6->s3\n" +
                "BlockStart_6->s5\n" +
                "BlockEnd_7->s8\n" +
                "s3-B->s4\n" +
                "s5-D->BlockEnd_7\n" +
                "s8-E->s9\n" +
                "s4-C->BlockEnd_7\n" +
                "s9->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s10\n";
            expect(parserRuleATN("parser grammar P;\na : A (B C | D)?? E ;", "a")).toBe(expected);
        });

        it("non-greedy plus loop with a multi-alternative block", () => {
            const expected =
                "RuleStart_a_0->PlusBlockStart_5\n" +
                "PlusBlockStart_5->s2\n" +
                "PlusBlockStart_5->s3\n" +
                "s2-A->BlockEnd_6\n" +
                "s3-B->s4\n" +
                "BlockEnd_6->PlusLoopBack_7\n" +
                "s4-C->BlockEnd_6\n" +
                "PlusLoopBack_7->s8\n" +
                "PlusLoopBack_7->PlusBlockStart_5\n" +
                "s8->s9\n" +
                "s9-D->s10\n" +
                "s10->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s11\n";
            expect(parserRuleATN("parser grammar P;\na : (A | B C)+? D ;", "a")).toBe(expected);
        });

        it("not-sets and not-tokens", () => {
            const expected =
                "RuleStart_a_0->s2\n" +
                "s2-~{A, B}->s3\n" +
                "s3-C->s4\n" +
                "s4-~D->s5\n" +
                "s5->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s6\n";
            expect(parserRuleATN("parser grammar P;\na : ~(A|B) C ~D ;", "a")).toBe(expected);
        });

        it("wildcard", () => {
            const expected =
                "RuleStart_a_0->s2\n" +
                "s2-.->s3\n" +
                "s3-A->s4\n" +
                "s4->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s5\n";
            expect(parserRuleATN("parser grammar P;\na : . A ;", "a")).toBe(expected);
        });

        it("labeled tokens, labeled sets and list labels do not change the ATN", () => {
            const expected =
                "RuleStart_a_0->s2\n" +
                "s2-A->s3\n" +
                "s3-{B, C}->s4\n" +
                "s4-D->s5\n" +
                "s5->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s6\n";
            expect(parserRuleATN("parser grammar P;\na : x=A y=(B|C) zs+=D ;", "a")).toBe(expected);
        });

        it("epsilon alternative at the rule level", () => {
            const expected =
                "RuleStart_a_0->BlockStart_4\n" +
                "BlockStart_4->s2\n" +
                "BlockStart_4->s3\n" +
                "s2-A->BlockEnd_5\n" +
                "s3->BlockEnd_5\n" +
                "BlockEnd_5->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s6\n";
            expect(parserRuleATN("parser grammar P;\na : A | ;", "a")).toBe(expected);
        });

        it("epsilon alternative inside a sub block", () => {
            const expected =
                "RuleStart_a_0->BlockStart_4\n" +
                "BlockStart_4->s2\n" +
                "BlockStart_4->s3\n" +
                "s2-A->BlockEnd_5\n" +
                "s3->BlockEnd_5\n" +
                "BlockEnd_5->s6\n" +
                "s6-B->s7\n" +
                "s7->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s8\n";
            expect(parserRuleATN("parser grammar P;\na : (A | ) B ;", "a")).toBe(expected);
        });

        it("semantic predicate and action transitions", () => {
            const expected =
                "RuleStart_a_0->s2\n" +
                "s2-pred_0:0->s3\n" +
                "s3-A->s4\n" +
                "s4-action_0:-1->s5\n" +
                "s5->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s6\n";
            expect(parserRuleATN("parser grammar P;\na : {true}? A {console.log();} ;", "a")).toBe(expected);
        });

        it("predicates with fail options in a block", () => {
            const expected =
                "RuleStart_a_0->BlockStart_6\n" +
                "BlockStart_6->s2\n" +
                "BlockStart_6->s4\n" +
                "s2-pred_0:0->s3\n" +
                "s4-pred_0:1->s5\n" +
                "s3-A->BlockEnd_7\n" +
                "s5-B->BlockEnd_7\n" +
                "BlockEnd_7->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s8\n";
            expect(parserRuleATN("parser grammar P;\na : {true}?<fail='boom'> A | {false}?<fail={msg()}> B ;", "a"))
                .toBe(expected);
        });

        it("predicate inside a sub block", () => {
            const expected =
                "RuleStart_a_0->BlockStart_5\n" +
                "BlockStart_5->s2\n" +
                "BlockStart_5->s4\n" +
                "s2-pred_0:0->s3\n" +
                "s4-B->BlockEnd_6\n" +
                "s3-A->BlockEnd_6\n" +
                "BlockEnd_6->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s7\n";
            expect(parserRuleATN("parser grammar P;\na : ( {true}? A | B ) ;", "a")).toBe(expected);
        });

        it("sub block with options", () => {
            const expected =
                "RuleStart_a_0->s2\n" +
                "s2-A->BlockStart_5\n" +
                "BlockStart_5->s3\n" +
                "BlockStart_5->s4\n" +
                "s3-B->BlockEnd_6\n" +
                "s4-C->BlockEnd_6\n" +
                "BlockEnd_6->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s7\n";
            expect(parserRuleATN("parser grammar P;\na : A (options{foo=bar;}: B | C) ;", "a")).toBe(expected);
        });

        it("rule references with arguments and element options", () => {
            const expected =
                "RuleStart_a_0->s4\n" +
                "s4-m->RuleStart_m_2\n" +
                "s5->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s8\n";
            expect(parserRuleATN("parser grammar P;\na : m[3] ;\nm[int x] : A ;", "a")).toBe(expected);

            const withOptions =
                "RuleStart_a_0->s2\n" +
                "s2-A->s3\n" +
                "s3-B->s4\n" +
                "s4->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s5\n";
            expect(parserRuleATN("parser grammar P;\na : A<tokenIndex=5> B ;", "a")).toBe(withOptions);
        });

        it("explicit EOF reference", () => {
            const expected =
                "RuleStart_a_0->s2\n" +
                "s2-A->s3\n" +
                "s3-EOF->s4\n" +
                "s4->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s5\n";
            expect(parserRuleATN("parser grammar P;\na : A EOF ;", "a")).toBe(expected);
        });

        it("plus loop over a set and a multi-alternative block", () => {
            const setLoop =
                "RuleStart_a_0->PlusBlockStart_3\n" +
                "PlusBlockStart_3->s2\n" +
                "s2-{A, B, C}->BlockEnd_4\n" +
                "BlockEnd_4->PlusLoopBack_5\n" +
                "PlusLoopBack_5->PlusBlockStart_3\n" +
                "PlusLoopBack_5->s6\n" +
                "s6->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s7\n";
            expect(parserRuleATN("parser grammar P;\na : (A | B | C)+ ;", "a")).toBe(setLoop);

            const block =
                "RuleStart_a_0->BlockStart_5\n" +
                "BlockStart_5->s2\n" +
                "BlockStart_5->s4\n" +
                "s2-A->s3\n" +
                "s4-C->BlockEnd_6\n" +
                "s3-B->BlockEnd_6\n" +
                "BlockEnd_6->RuleStop_a_1\n" +
                "RuleStop_a_1-EOF->s7\n";
            expect(parserRuleATN("parser grammar P;\na : (A B | C) ;", "a")).toBe(block);
        });
    });

    describe("lexer rules", () => {
        it("string literals and character ranges", () => {
            const expected =
                "s0->RuleStart_A_1\n" +
                "s0->RuleStart_B_3\n" +
                "RuleStart_A_1->s5\n" +
                "RuleStart_B_3->s7\n" +
                "s5-'a'->s6\n" +
                "s7-'b'..'z'->s8\n" +
                "s6->RuleStop_A_2\n" +
                "s8->RuleStop_B_4\n";
            expect(lexerModeATN("lexer grammar L;\nA : 'a' ;\nB : 'b'..'z' ;").atn).toBe(expected);
        });

        it("character sets and negated character sets", () => {
            const expected =
                "s0->RuleStart_C_1\n" +
                "s0->RuleStart_D_3\n" +
                "RuleStart_C_1->s5\n" +
                "RuleStart_D_3->s7\n" +
                "s5-{48..57, 97..102}->s6\n" +
                "s7-~~{10, 13}->s8\n" +
                "s6->RuleStop_C_2\n" +
                "s8->RuleStop_D_4\n";
            expect(lexerModeATN("lexer grammar L;\nC : [0-9a-f] ;\nD : ~[\\r\\n] ;").atn).toBe(expected);
        });

        it("alternatives of multi-char strings and the wildcard", () => {
            const expected =
                "s0->RuleStart_E_1\n" +
                "s0->RuleStart_F_3\n" +
                "RuleStart_E_1->BlockStart_9\n" +
                "RuleStart_F_3->s11\n" +
                "BlockStart_9->s5\n" +
                "BlockStart_9->s7\n" +
                "s11-.->s12\n" +
                "s5-'a'->s6\n" +
                "s7-'c'->s8\n" +
                "s12->RuleStop_F_4\n" +
                "s6-'b'->BlockEnd_10\n" +
                "s8-'d'->BlockEnd_10\n" +
                "BlockEnd_10->RuleStop_E_2\n";
            expect(lexerModeATN("lexer grammar L;\nE : 'ab' | 'cd' ;\nF : . ;").atn).toBe(expected);
        });

        it("skip, channel, type and numeric channel commands become actions", () => {
            const expected =
                "s0->RuleStart_G_1\n" +
                "s0->RuleStart_H_3\n" +
                "s0->RuleStart_I_5\n" +
                "s0->RuleStart_V_7\n" +
                "RuleStart_G_1->s9\n" +
                "RuleStart_H_3->s13\n" +
                "RuleStart_I_5->s17\n" +
                "RuleStart_V_7->s21\n" +
                "s9-'x'->s10\n" +
                "s13-'y'->s14\n" +
                "s17-'z'->s18\n" +
                "s21-'v'->s22\n" +
                "s10->s11\n" +
                "s14->s15\n" +
                "s18->s19\n" +
                "s22->s23\n" +
                "s11-action_0:0->s12\n" +
                "s15-action_1:1->s16\n" +
                "s19-action_2:2->s20\n" +
                "s23-action_3:3->s24\n" +
                "s12->RuleStop_G_2\n" +
                "s16->RuleStop_H_4\n" +
                "s20->RuleStop_I_6\n" +
                "s24->RuleStop_V_8\n";
            const grammar =
                "lexer grammar L;\n" +
                "G : 'x' -> skip ;\n" +
                "H : 'y' -> channel(HIDDEN) ;\n" +
                "I : 'z' -> type(G) ;\n" +
                "V : 'v' -> channel(2) ;";
            expect(lexerModeATN(grammar).atn).toBe(expected);
        });

        it("mode commands and a second mode", () => {
            const grammar =
                "lexer grammar L;\n" +
                "J : 'q' -> more, mode(M) ;\n" +
                "K : 'w' -> pushMode(M) ;\n" +
                "mode M;\n" +
                "W : 'w' -> popMode ;\n" +
                "X : ~'w' ;";

            const defaultMode =
                "s0->RuleStart_J_2\n" +
                "s0->RuleStart_K_4\n" +
                "RuleStart_J_2->s10\n" +
                "RuleStart_K_4->s15\n" +
                "s10-'q'->s11\n" +
                "s15-'w'->s16\n" +
                "s11->s12\n" +
                "s16->s17\n" +
                "s12-action_0:0->s13\n" +
                "s17-action_1:2->s18\n" +
                "s13-action_0:1->s14\n" +
                "s18->RuleStop_K_5\n" +
                "s14->RuleStop_J_3\n";
            expect(lexerModeATN(grammar).atn).toBe(defaultMode);

            const modeM =
                "s1->RuleStart_W_6\n" +
                "s1->RuleStart_X_8\n" +
                "RuleStart_W_6->s19\n" +
                "RuleStart_X_8->s23\n" +
                "s19-'w'->s20\n" +
                "s23-~~119->s24\n" +
                "s20->s21\n" +
                "s24->RuleStop_X_9\n" +
                "s21-action_2:3->s22\n" +
                "s22->RuleStop_W_7\n";
            expect(lexerModeATN(grammar, "M").atn).toBe(modeM);
        });

        it("custom lexer actions and predicates", () => {
            const expected =
                "s0->RuleStart_M1_1\n" +
                "s0->RuleStart_R_3\n" +
                "RuleStart_M1_1->s5\n" +
                "RuleStart_R_3->s8\n" +
                "s5-'m'->s6\n" +
                "s8-'a'->s9\n" +
                "s6-action_0:0->s7\n" +
                "s9-pred_1:0->s10\n" +
                "s7->RuleStop_M1_2\n" +
                "s10->RuleStop_R_4\n";
            expect(lexerModeATN("lexer grammar L;\nM1 : 'm' {console.log();} ;\nR : 'a' {true}? ;").atn)
                .toBe(expected);
        });

        it("fragment rules are referenced but not reachable from the mode start", () => {
            const expected =
                "s0->RuleStart_N_3\n" +
                "RuleStart_N_3->PlusBlockStart_8\n" +
                "PlusBlockStart_8->s7\n" +
                "s7-FR->RuleStart_FR_1\n" +
                "BlockEnd_9->PlusLoopBack_10\n" +
                "PlusLoopBack_10->PlusBlockStart_8\n" +
                "PlusLoopBack_10->s11\n" +
                "s11->RuleStop_N_4\n";
            expect(lexerModeATN("lexer grammar L;\nfragment FR : 'f' ;\nN : FR+ ;").atn).toBe(expected);
        });

        it("unicode escapes, negated sets and range alternatives", () => {
            const expected =
                "s0->RuleStart_O_1\n" +
                "s0->RuleStart_S_3\n" +
                "s0->RuleStart_T_5\n" +
                "RuleStart_O_1->s7\n" +
                "RuleStart_S_3->s10\n" +
                "RuleStart_T_5->s12\n" +
                "s7-'\\u00E9'->s8\n" +
                "s10-~~{97..98}->s11\n" +
                "s12-{65..90, 97..122}->s13\n" +
                "s8-'\\u00E9'->s9\n" +
                "s11->RuleStop_S_4\n" +
                "s13->RuleStop_T_6\n" +
                "s9->RuleStop_O_2\n";
            const grammar =
                "lexer grammar L;\n" +
                "O : '\\u00E9' 'é' ;\n" +
                "S : ~('a'|'b') ;\n" +
                "T : 'a'..'z' | 'A'..'Z' ;";
            expect(lexerModeATN(grammar).atn).toBe(expected);
        });

        it("greedy star loop over a set and non-greedy plus loop", () => {
            const expected =
                "s0->RuleStart_Q_1\n" +
                "s0->RuleStart_U_3\n" +
                "RuleStart_Q_1->StarLoopEntry_8\n" +
                "RuleStart_U_3->PlusBlockStart_14\n" +
                "StarLoopEntry_8->StarBlockStart_6\n" +
                "StarLoopEntry_8->s9\n" +
                "PlusBlockStart_14->s13\n" +
                "StarBlockStart_6->s5\n" +
                "s9->s11\n" +
                "s13-{97..122}->BlockEnd_15\n" +
                "s5-'a'..'b'->BlockEnd_7\n" +
                "s11-'c'->s12\n" +
                "BlockEnd_15->PlusLoopBack_16\n" +
                "BlockEnd_7->StarLoopBack_10\n" +
                "s12->RuleStop_Q_2\n" +
                "PlusLoopBack_16->s17\n" +
                "PlusLoopBack_16->PlusBlockStart_14\n" +
                "StarLoopBack_10->StarLoopEntry_8\n" +
                "s17->s18\n" +
                "s18-'x'->s19\n" +
                "s19->RuleStop_U_4\n";
            expect(lexerModeATN("lexer grammar L;\nQ : ('a' | 'b')* 'c' ;\nU : [a-z]+? 'x' ;").atn).toBe(expected);
        });

        it("non-greedy star loop and non-greedy optional block", () => {
            const expected =
                "s0->RuleStart_X1_1\n" +
                "s0->RuleStart_Z2_3\n" +
                "RuleStart_X1_1->s5\n" +
                "RuleStart_Z2_3->BlockStart_14\n" +
                "s5-{97..122}->StarLoopEntry_9\n" +
                "BlockStart_14->BlockEnd_15\n" +
                "BlockStart_14->s12\n" +
                "StarLoopEntry_9->s10\n" +
                "StarLoopEntry_9->StarBlockStart_7\n" +
                "BlockEnd_15->s16\n" +
                "s12-'a'->s13\n" +
                "s10->RuleStop_X1_2\n" +
                "StarBlockStart_7->s6\n" +
                "s16-'c'->s17\n" +
                "s13-'b'->BlockEnd_15\n" +
                "s6-{97..122}->BlockEnd_8\n" +
                "s17->RuleStop_Z2_4\n" +
                "BlockEnd_8->StarLoopBack_11\n" +
                "StarLoopBack_11->StarLoopEntry_9\n";
            expect(lexerModeATN("lexer grammar L;\nX1 : [a-z] [a-z]*? ;\nZ2 : ('a' 'b')?? 'c' ;").atn)
                .toBe(expected);
        });

        it("EOF inside a lexer alternative", () => {
            const expected =
                "s0->RuleStart_Z3_1\n" +
                "RuleStart_Z3_1->BlockStart_11\n" +
                "BlockStart_11->s3\n" +
                "BlockStart_11->s10\n" +
                "s3-'a'->s4\n" +
                "s10-EOF->BlockEnd_12\n" +
                "s4-'b'->s5\n" +
                "BlockEnd_12->RuleStop_Z3_2\n" +
                "s5-'c'->s6\n" +
                "s6->s7\n" +
                "s7-'d'->s8\n" +
                "s8-'e'->s9\n" +
                "s9-'f'->BlockEnd_12\n";
            expect(lexerModeATN("lexer grammar L;\nZ3 : 'abc' 'def' | EOF ;").atn).toBe(expected);
        });

        it("unicode property classes expand to large sets", () => {
            const { atn } = lexerModeATN("lexer grammar L;\nP : [\\p{Lu}] ;");
            expect(atn).toMatch(/^s0->RuleStart_P_1\nRuleStart_P_1->s3\ns3-\{65\.\.90, 192\.\.214, 216\.\.222, /);
            expect(atn).toContain("->s4\ns4->RuleStop_P_2\n");
        });

        it("case insensitive grammars produce sets with both cases", () => {
            const expected =
                "s0->RuleStart_CI_1\n" +
                "RuleStart_CI_1->s3\n" +
                "s3-{65, 97}->s4\n" +
                "s4-{66, 98}->s5\n" +
                "s5->s6\n" +
                "s6-{67..68, 99..100}->s7\n" +
                "s7->RuleStop_CI_2\n";
            expect(lexerModeATN("lexer grammar L;\noptions { caseInsensitive = true; }\nCI : 'ab' [c-d] ;").atn)
                .toBe(expected);
        });

        it("multiple commands on one rule produce multiple actions", () => {
            const expected =
                "s0->RuleStart_A_1\n" +
                "s0->RuleStart_B_3\n" +
                "RuleStart_A_1->s5\n" +
                "RuleStart_B_3->s10\n" +
                "s5-'a'->s6\n" +
                "s10-'b'->s11\n" +
                "s6->s7\n" +
                "s11->RuleStop_B_4\n" +
                "s7-action_0:0->s8\n" +
                "s8-action_0:1->s9\n" +
                "s9->RuleStop_A_2\n";
            expect(lexerModeATN("lexer grammar L;\nA : 'a' -> type(B), channel(HIDDEN) ;\nB : 'b' ;").atn)
                .toBe(expected);
        });

        it("all EBNF operators in one lexer rule", () => {
            const expected =
                "s0->RuleStart_A_1\n" +
                "RuleStart_A_1->s3\n" +
                "s3-'a'->BlockStart_5\n" +
                "BlockStart_5->s4\n" +
                "BlockStart_5->BlockEnd_6\n" +
                "s4-'b'->BlockEnd_6\n" +
                "BlockEnd_6->StarLoopEntry_10\n" +
                "StarLoopEntry_10->StarBlockStart_8\n" +
                "StarLoopEntry_10->s11\n" +
                "StarBlockStart_8->s7\n" +
                "s11->PlusBlockStart_14\n" +
                "s7-'c'->BlockEnd_9\n" +
                "PlusBlockStart_14->s13\n" +
                "BlockEnd_9->StarLoopBack_12\n" +
                "s13-'d'->BlockEnd_15\n" +
                "StarLoopBack_12->StarLoopEntry_10\n" +
                "BlockEnd_15->PlusLoopBack_16\n" +
                "PlusLoopBack_16->PlusBlockStart_14\n" +
                "PlusLoopBack_16->s17\n" +
                "s17->RuleStop_A_2\n";
            expect(lexerModeATN("lexer grammar L;\nA : 'a' 'b'? 'c'* 'd'+ ;").atn).toBe(expected);
        });

        it("plus loop over a block with a multi-element alternative", () => {
            const expected =
                "s0->RuleStart_A_1\n" +
                "RuleStart_A_1->PlusBlockStart_6\n" +
                "PlusBlockStart_6->s3\n" +
                "PlusBlockStart_6->s4\n" +
                "s3-'a'->BlockEnd_7\n" +
                "s4-'b'->s5\n" +
                "BlockEnd_7->PlusLoopBack_8\n" +
                "s5-'c'->BlockEnd_7\n" +
                "PlusLoopBack_8->PlusBlockStart_6\n" +
                "PlusLoopBack_8->s9\n" +
                "s9->RuleStop_A_2\n";
            expect(lexerModeATN("lexer grammar L;\nA : ('a' | 'b' 'c')+ ;").atn).toBe(expected);
        });

        it("more and mode(DEFAULT_MODE) commands", () => {
            const expected =
                "s0->RuleStart_A_1\n" +
                "s0->RuleStart_B_3\n" +
                "RuleStart_A_1->s5\n" +
                "RuleStart_B_3->s9\n" +
                "s5-{97..122}->s6\n" +
                "s9-'x'->s10\n" +
                "s6->s7\n" +
                "s10->s11\n" +
                "s7-action_0:0->s8\n" +
                "s11-action_1:1->s12\n" +
                "s8->RuleStop_A_2\n" +
                "s12->RuleStop_B_4\n";
            expect(lexerModeATN("lexer grammar L;\nA : [a-z] -> more ;\nB : 'x' -> mode(DEFAULT_MODE) ;").atn)
                .toBe(expected);
        });

        it("reports lexer rules which can match the empty string", () => {
            const { queue } = lexerModeATN("lexer grammar L;\nZ1 : 'z'? 'q'* ;");
            expect(queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.EpsilonToken);
        });
    });
});
