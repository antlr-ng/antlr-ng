/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore blech

import { describe, it } from "vitest";

import { ST } from "stringtemplate4ts";

import { IssueCode } from "../src/tool/Issues.js";
import { ToolTestUtils } from "./ToolTestUtils.js";

describe("TestBasicSemanticErrors", () => {
    const grammarU = [
        // INPUT
        "parser grammar U;\n" +
        "options { foo=bar; k=3;}\n" +
        "tokens {\n" +
        "        ID,\n" +
        "        f,\n" +
        "        S\n" +
        "}\n" +
        "tokens { A }\n" +
        "options { x=y; }\n" +
        "\n" +
        "a\n" +
        "options { blech=bar; greedy=true; }\n" +
        "        :       ID\n" +
        "        ;\n" +
        "b : ( options { ick=bar; greedy=true; } : ID )+ ;\n" +
        "c : ID<blue> ID<x=y> ;",

        // YIELDS
        "warning(" + IssueCode.IllegalOption + "): U.g4:2:10: unsupported option foo\n" +
        "warning(" + IssueCode.IllegalOption + "): U.g4:2:19: unsupported option k\n" +
        "error(" + IssueCode.TokenNamesMustStartUpper + "): U.g4:5:8: token names must start with an " +
        "uppercase letter: f\n" +
        "warning(" + IssueCode.IllegalOption + "): U.g4:9:10: unsupported option x\n" +
        "error(" + IssueCode.RepeatedPrequel + "): U.g4:9:0: repeated grammar prequel spec (options, tokens," +
        " or import); please merge\n" +
        "error(" + IssueCode.RepeatedPrequel + "): U.g4:8:0: repeated grammar prequel spec (options, tokens, " +
        "or import); please merge\n" +
        "warning(" + IssueCode.IllegalOption + "): U.g4:12:10: unsupported option blech\n" +
        "warning(" + IssueCode.IllegalOption + "): U.g4:12:21: unsupported option greedy\n" +
        "warning(" + IssueCode.IllegalOption + "): U.g4:15:16: unsupported option ick\n" +
        "warning(" + IssueCode.IllegalOption + "): U.g4:15:25: unsupported option greedy\n" +
        "warning(" + IssueCode.IllegalOption + "): U.g4:16:16: unsupported option x\n",
    ];

    it("testU", (): void => {
        ToolTestUtils.testErrors(grammarU);
    });

    /**
     * Regression test for #25 "Don't allow labels on not token set subrules".
     * https://github.com/antlr/antlr4/issues/25
     */
    it("testIllegalNonSetLabel", (): void => {
        const grammar =
            "grammar T;\n" +
            "ss : op=('=' | '+=' | expr) EOF;\n" +
            "expr : '=' '=';\n" +
            "";

        const expected =
            "error(" + IssueCode.LabelBlockNotASet + "): T.g4:2:5: label op assigned to a block which " +
            "is not a set\n";

        ToolTestUtils.testErrors([grammar, expected]);
    });

    it("testArgumentRetvalLocalConflicts", (): void => {
        const grammarTemplate =
            "grammar T;\n" +
            "ss<if(args)>[<args>]<endif> <if(retvals)>returns [<retvals>]<endif>\n" +
            "<if(locals)>locals [<locals>]<endif>\n" +
            "  : <body> EOF;\n" +
            "expr : '=';\n";

        const expected =
            "error(" + IssueCode.ArgConflictsWithRule + "): T.g4:2:7: parameter expr conflicts with rule " +
            "with same name\n" +
            "error(" + IssueCode.RetvalConflictsWithRule + "): T.g4:2:26: return value expr conflicts with " +
            "rule with same name\n" +
            "error(" + IssueCode.LocalConflictsWithRule + "): T.g4:3:12: local expr conflicts with rule " +
            "with same name\n" +
            "error(" + IssueCode.RetValueConflictsWithArg + "): T.g4:2:26: return value expr conflicts with " +
            "parameter with same name\n" +
            "error(" + IssueCode.LocalConflictsWithArg + "): T.g4:3:12: local expr conflicts with parameter" +
            " with same name\n" +
            "error(" + IssueCode.LocalConflictsWithRetval + "): T.g4:3:12: local expr conflicts with return" +
            " value with same name\n" +
            "error(" + IssueCode.LabelConflictsWithRule + "): T.g4:4:4: label expr conflicts with rule with" +
            " same name\n" +
            "error(" + IssueCode.LabelConflictsWithArg + "): T.g4:4:4: label expr conflicts with parameter" +
            " with same name\n" +
            "error(" + IssueCode.LabelConflictsWithRetval + "): T.g4:4:4: label expr conflicts with return" +
            " value with same name\n" +
            "error(" + IssueCode.LabelConflictsWithLocal + "): T.g4:4:4: label expr conflicts with local" +
            " with same name\n";

        const grammarST = new ST(grammarTemplate);
        grammarST.add("args", "int expr");
        grammarST.add("retvals", "int expr");
        grammarST.add("locals", "int expr");
        grammarST.add("body", "expr=expr");
        ToolTestUtils.testErrors([grammarST.render(), expected]);
    });

});
