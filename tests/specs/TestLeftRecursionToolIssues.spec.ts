/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore dval

import { describe, it } from "vitest";

import { IssueCode } from "../../src/tool/Issues.js";
import { ToolTestUtils } from "../ToolTestUtils.js";

describe("TestLeftRecursionToolIssues", () => {
    it("testCheckForNonLeftRecursiveRule", () => {
        const grammar =
            "grammar T;\n" +
            "s @after {System.out.println($ctx.toStringTree(this));} : a ;\n" +
            "a : a ID\n" +
            "  ;\n" +
            "ID : 'a'..'z'+ ;\n" +
            "WS : (' '|'\\n') -> skip ;\n";
        const expected = "error(" + IssueCode.NoNonLrAlts + "): T.g4:3:0: left recursive rule a must contain " +
            "an alternative which is not left recursive\n";
        ToolTestUtils.testErrors([grammar, expected], false);
    });

    it("testCheckForLeftRecursiveEmptyFollow", () => {
        const grammar =
            "grammar T;\n" +
            "s @after {System.out.println($ctx.toStringTree(this));} : a ;\n" +
            "a : a ID?\n" +
            "  | ID\n" +
            "  ;\n" +
            "ID : 'a'..'z'+ ;\n" +
            "WS : (' '|'\\n') -> skip ;\n";
        const expected = "error(" + IssueCode.EpsilonLrFollow + "): T.g4:3:0: left recursive rule a " +
            "contains a left recursive alternative which can be followed by the empty string\n";
        ToolTestUtils.testErrors([grammar, expected], false);
    });

    /** Reproduces https://github.com/antlr/antlr4/issues/855 */
    it("testLeftRecursiveRuleRefWithArg", () => {
        const grammar =
            "grammar T;\n" +
            "statement\n" +
            "locals[Scope scope]\n" +
            "    : expressionA[$scope] ';'\n" +
            "    ;\n" +
            "expressionA[Scope scope]\n" +
            "    : atom[$scope]\n" +
            "    | expressionA[$scope] '[' expressionA[$scope] ']'\n" +
            "    ;\n" +
            "atom[Scope scope]\n" +
            "    : 'dummy'\n" +
            "    ;\n";
        const expected = "error(" + IssueCode.NonconformingLrRule + "): T.g4:6:0: rule expressionA is left " +
            "recursive but doesn't conform to a pattern ANTLR can handle\n";
        ToolTestUtils.testErrors([grammar, expected], false);
    });

    /** Reproduces https://github.com/antlr/antlr4/issues/855 */
    it("testLeftRecursiveRuleRefWithArg2", () => {
        const grammar =
            "grammar T;\n" +
            "a[int i] : 'x'\n" +
            "  | a[3] 'y'\n" +
            "  ;";
        const expected = "error(" + IssueCode.NonconformingLrRule + "): T.g4:2:0: rule a is left recursive " +
            "but doesn't conform to a pattern ANTLR can handle\n";
        ToolTestUtils.testErrors([grammar, expected], false);
    });

    /** Reproduces https://github.com/antlr/antlr4/issues/855 */
    it("testLeftRecursiveRuleRefWithArg3", () => {
        const grammar =
            "grammar T;\n" +
            "a : 'x'\n" +
            "  | a[3] 'y'\n" +
            "  ;";
        const expected =
            "error(" + IssueCode.NonconformingLrRule + "): T.g4:2:0: rule a is left recursive but doesn't " +
            "conform to a pattern ANTLR can handle\n";
        ToolTestUtils.testErrors([grammar, expected], false);
    });

    /** Reproduces https://github.com/antlr/antlr4/issues/822 */
    it("testIsolatedLeftRecursiveRuleRef", () => {
        const grammar =
            "grammar T;\n" +
            "a : a | b ;\n" +
            "b : 'B' ;\n";
        const expected =
            "error(" + IssueCode.NonconformingLrRule + "): T.g4:2:0: rule a is left recursive but doesn't " +
            "conform to a pattern ANTLR can handle\n";
        ToolTestUtils.testErrors([grammar, expected], false);
    });

    /** Reproduces https://github.com/antlr/antlr4/issues/773 */
    it("testArgOnPrimaryRuleInLeftRecursiveRule", () => {
        const grammar =
            "grammar T;\n" +
            "val: dval[1]\n" +
            "   | val '*' val\n" +
            "   ;\n" +
            "dval[int  x]: '.';\n";
        const expected = ""; // dval[1] should not be error
        ToolTestUtils.testErrors([grammar, expected], false);
    });
});
