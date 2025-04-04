/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable max-len */

// cspell: ignore blort

import { describe, it } from "vitest";
import { ErrorBuffer, ST, STGroup } from "stringtemplate4ts";

import { IssueCode } from "../../src/tool/Issues.js";
import { ToolTestUtils } from "../ToolTestUtils.js";

describe("TestAttributeChecks", () => {
    const attributeTemplate = "parser grammar A;\n" +
        "@members {<members>}\n" +
        "tokens{ID}\n" +
        "a[int x] returns [int y]\n" +
        "@init {<init>}\n" +
        "    :   id=ID ids+=ID lab=b[34] labs+=b[34] {\n" +
        "		 <inline>\n" +
        "		 }\n" +
        "		 c\n" +
        "    ;\n" +
        "    finally {<finally>}\n" +
        "b[int d] returns [int e]\n" +
        "    :   {<inline2>}\n" +
        "    ;\n" +
        "c   :   ;\n";

    const membersChecks = [
        ["$a", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:2:10: unknown attribute reference a in $a\n"],
        ["$a.y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:2:10: unknown attribute reference a in $a.y\n"],
    ];

    const initChecks = [
        ["$text", ""],
        ["$start", ""],
        ["$x = $y", ""],
        ["$y = $x", ""],
        ["$lab.e", ""],
        ["$ids", ""],
        ["$labs", ""],

        ["$c", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:5:7: unknown attribute reference c in $c\n"],
        ["$a.q", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:5:9: unknown attribute q for rule a in $a.q\n"],
    ];

    const inlineChecks = [
        ["$text", ""],
        ["$start", ""],
        ["$x = $y", ""],
        ["$y = $x", ""],
        ["$y.b = 3;", ""],
        ["$ctx.x = $ctx.y", ""],
        ["$lab.e", ""],
        ["$lab.text", ""],
        ["$b.e", ""],
        ["$c.text", ""],
        ["$ID", ""],
        ["$ID.text", ""],
        ["$id", ""],
        ["$id.text", ""],
        ["$ids", ""],
        ["$labs", ""],
    ];

    const badInlineChecks = [
        ["$lab", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:7:4: missing attribute access on rule reference lab in $lab\n"],
        ["$q", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference q in $q\n"],
        ["$q.y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference q in $q.y\n"],
        ["$q = 3", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference q in $q\n"],
        ["$q = 3;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference q in $q = 3;\n"],
        ["$q.y = 3;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference q in $q.y\n"],
        ["$q = $blort;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference q in $q = $blort;\n" +
            "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:9: unknown attribute reference blort in $blort\n"],
        ["$a.ick", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:7:6: unknown attribute ick for rule a in $a.ick\n"],
        ["$a.ick = 3;", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:7:6: unknown attribute ick for rule a in $a.ick\n"],
        ["$b.d", "error(" + IssueCode.InvalidRuleParameterRef + "): A.g4:7:6: parameter d of rule b is not accessible in this scope: $b.d\n"], // cant see rule refs arg
        ["$d.text", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference d in $d.text\n"], // valid rule, but no ref
        ["$lab.d", "error(" + IssueCode.InvalidRuleParameterRef + "): A.g4:7:8: parameter d of rule b is not accessible in this scope: $lab.d\n"],
        ["$ids = null;", "error(" + IssueCode.AssignmentToListLabel + "): A.g4:7:4: cannot assign a value to list label ids\n"],
        ["$labs = null;", "error(" + IssueCode.AssignmentToListLabel + "): A.g4:7:4: cannot assign a value to list label labs\n"],
    ];

    const finallyChecks = [
        ["$text", ""],
        ["$start", ""],
        ["$x = $y", ""],
        ["$y = $x", ""],
        ["$lab.e", ""],
        ["$lab.text", ""],
        ["$id", ""],
        ["$id.text", ""],
        ["$ids", ""],
        ["$labs", ""],

        ["$lab", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:10:13: missing attribute access on rule reference lab in $lab\n"],
        ["$q", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference q in $q\n"],
        ["$q.y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference q in $q.y\n"],
        ["$q = 3", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference q in $q\n"],
        ["$q = 3;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference q in $q = 3;\n"],
        ["$q.y = 3;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference q in $q.y\n"],
        ["$q = $blort;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference q in $q = $blort;\n" +
            "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:18: unknown attribute reference blort in $blort\n"],
        ["$a.ick", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:10:15: unknown attribute ick for rule a in $a.ick\n"],
        ["$a.ick = 3;", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:10:15: unknown attribute ick for rule a in $a.ick\n"],
        ["$b.e", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference b in $b.e\n"], // cant see rule refs outside alts
        ["$b.d", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference b in $b.d\n"],
        ["$c.text", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference c in $c.text\n"],
        ["$lab.d", "error(" + IssueCode.InvalidRuleParameterRef + "): A.g4:10:17: parameter d of rule b is not accessible in this scope: $lab.d\n"],
    ];

    const dynMembersChecks = [
        ["$S", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:2:10: unknown attribute reference S in $S\n"],
        ["$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:2:10: reference to undefined rule S in non-local ref $S::i\n"],
        ["$S::i=$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:2:10: reference to undefined rule S in non-local ref $S::i\n" +
            "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:2:16: reference to undefined rule S in non-local ref $S::i\n"],
        ["$b::f", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:2:13: unknown attribute f for rule b in $b::f\n"],
        ["$S::j", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:2:10: reference to undefined rule S in non-local ref $S::j\n"],
        ["$S::j = 3;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:2:10: reference to undefined rule S in non-local ref $S::j = 3;\n"],
        ["$S::j = $S::k;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:2:10: reference to undefined rule S in non-local ref $S::j = $S::k;\n"],
    ];

    const dynInitChecks = [
        ["$a", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:5:7: missing attribute access on rule reference a in $a\n"],
        ["$b", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:5:7: unknown attribute reference b in $b\n"],
        ["$lab", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:5:7: missing attribute access on rule reference lab in $lab\n"],
        ["$b::f", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:5:10: unknown attribute f for rule b in $b::f\n"],
        ["$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:5:7: reference to undefined rule S in non-local ref $S::i\n"],
        ["$S::i=$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:5:7: reference to undefined rule S in non-local ref $S::i\n" +
            "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:5:13: reference to undefined rule S in non-local ref $S::i\n"],
        ["$a::z", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:5:10: unknown attribute z for rule a in $a::z\n"],
        ["$S", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:5:7: unknown attribute reference S in $S\n"],

        ["$S::j", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:5:7: reference to undefined rule S in non-local ref $S::j\n"],
        ["$S::j = 3;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:5:7: reference to undefined rule S in non-local ref $S::j = 3;\n"],
        ["$S::j = $S::k;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:5:7: reference to undefined rule S in non-local ref $S::j = $S::k;\n"],
    ];

    const dynInlineChecks = [
        ["$a", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:7:4: missing attribute access on rule reference a in $a\n"],
        ["$b", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:7:4: missing attribute access on rule reference b in $b\n"],
        ["$lab", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:7:4: missing attribute access on rule reference lab in $lab\n"],
        ["$b::f", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:7:7: unknown attribute f for rule b in $b::f\n"],
        ["$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:7:4: reference to undefined rule S in non-local ref $S::i\n"],
        ["$S::i=$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:7:4: reference to undefined rule S in non-local ref $S::i\n" +
            "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:7:10: reference to undefined rule S in non-local ref $S::i\n"],
        ["$a::z", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:7:7: unknown attribute z for rule a in $a::z\n"],

        ["$S::j", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:7:4: reference to undefined rule S in non-local ref $S::j\n"],
        ["$S::j = 3;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:7:4: reference to undefined rule S in non-local ref $S::j = 3;\n"],
        ["$S::j = $S::k;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:7:4: reference to undefined rule S in non-local ref $S::j = $S::k;\n"],
        ["$Q[-1]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$Q[-i]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$Q[i]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$Q[0]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$Q[-1]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$Q[-i]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$Q[i]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$Q[0]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference Q in $Q\n"],
        ["$S[-1]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[-i]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[i]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[0]::y", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[-1]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[-i]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[i]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[0]::y = 23;", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n"],
        ["$S[$S::y]::i", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:7:4: unknown attribute reference S in $S\n" +
            "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:7:7: reference to undefined rule S in non-local ref $S::y\n"]
    ];

    const dynFinallyChecks = [
        ["$a", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:10:13: missing attribute access on rule reference a in $a\n"],
        ["$b", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference b in $b\n"],
        ["$lab", "error(" + IssueCode.IsolatedRuleRef + "): A.g4:10:13: missing attribute access on rule reference lab in $lab\n"],
        ["$b::f", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:10:16: unknown attribute f for rule b in $b::f\n"],
        ["$S", "error(" + IssueCode.UnknownSimpleAttribute + "): A.g4:10:13: unknown attribute reference S in $S\n"],
        ["$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:10:13: reference to undefined rule S in non-local ref $S::i\n"],
        ["$S::i=$S::i", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:10:13: reference to undefined rule S in non-local ref $S::i\n" +
            "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:10:19: reference to undefined rule S in non-local ref $S::i\n"],
        ["$a::z", "error(" + IssueCode.UnknownRuleAttribute + "): A.g4:10:16: unknown attribute z for rule a in $a::z\n"],

        ["$S::j", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:10:13: reference to undefined rule S in non-local ref $S::j\n"],
        ["$S::j = 3;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:10:13: reference to undefined rule S in non-local ref $S::j = 3;\n"],
        ["$S::j = $S::k;", "error(" + IssueCode.UndefinedRuleInNonlocalRef + "): A.g4:10:13: reference to undefined rule S in non-local ref $S::j = $S::k;\n"],
    ];

    const testAction = (location: string, action: string, expected: string, template: string): void => {
        const g = new STGroup("<", ">");
        g.setListener(new ErrorBuffer()); // hush warnings
        const st = new ST(g, template);
        st.add(location, action);
        const grammar = st.render();
        ToolTestUtils.testErrors([grammar, expected], true);
    };

    it.each(membersChecks)("testMembersActions: %s", (action, expected) => {
        testAction("members", action, expected, attributeTemplate);
    });

    it.each(dynMembersChecks)("testDynamicMembersActions: %s", (action, expected): void => {
        testAction("members", action, expected, attributeTemplate);
    });

    it.each(initChecks)("testInitActions: %s", (action, expected): void => {
        testAction("init", action, expected, attributeTemplate);
    });

    it.each(dynInitChecks)("testDynamicInitActions: %s", (action, expected): void => {
        testAction("init", action, expected, attributeTemplate);
    });

    it.each(inlineChecks)("testInlineActions", (action, expected): void => {
        testAction("inline", action, expected, attributeTemplate);
    });

    it.each(dynInlineChecks)("testDynamicInlineActions", (action, expected): void => {
        testAction("inline", action, expected, attributeTemplate);
    });

    it.each(badInlineChecks)("testBadInlineActions", (action, expected): void => {
        testAction("inline", action, expected, attributeTemplate);
    });

    it.each(finallyChecks)("testFinallyActions", (action, expected): void => {
        testAction("finally", action, expected, attributeTemplate);
    });

    it.each(dynFinallyChecks)("testDynamicFinallyActions", (action, expected): void => {
        testAction("finally", action, expected, attributeTemplate);
    });

    it("testTokenRef", (): void => {
        const grammar =
            "parser grammar S;\n" +
            "tokens{ID}\n" +
            "a : x=ID {Token t = $x; t = $ID;} ;\n";
        const expected =
            "";
        ToolTestUtils.testErrors([grammar, expected]);
    });
});
