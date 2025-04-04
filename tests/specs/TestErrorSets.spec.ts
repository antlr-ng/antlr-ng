/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, it } from "vitest";

import { ToolTestUtils } from "../ToolTestUtils.js";
import { IssueCode } from "../../src/tool/Issues.js";

/** Test errors with the set stuff in lexer and parser */
describe("TestErrorSets", () => {
    it("testNotCharSetWithRuleRef", () => {
        // might be a useful feature to add someday
        const pair = [
            "grammar T;\n" +
            "a : A {System.out.println($A.text);} ;\n" +
            "A : ~('a'|B) ;\n" +
            "B : 'b' ;\n",
            "error(" + IssueCode.UnsupportedReferenceInLexerSet +
            "): T.g4:3:10: rule reference B is not currently supported in a set\n"
        ];
        ToolTestUtils.testErrors(pair);
    });

    it("testNotCharSetWithString", () => {
        // might be a useful feature to add someday
        const pair = [
            "grammar T;\n" +
            "a : A {System.out.println($A.text);} ;\n" +
            "A : ~('a'|'aa') ;\n" +
            "B : 'b' ;\n",
            "error(" + IssueCode.InvalidLiteralInLexerSet +
            "): T.g4:3:10: multi-character literals are not allowed in lexer sets: 'aa'\n"
        ];

        ToolTestUtils.testErrors(pair);
    });
});
