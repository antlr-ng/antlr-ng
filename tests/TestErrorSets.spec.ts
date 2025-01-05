/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, it } from "vitest";

import { ToolTestUtils } from "./ToolTestUtils.js";
import { ErrorType } from "../src/tool/ErrorType.js";

/** Test errors with the set stuff in lexer and parser */
describe("TestErrorSets", () => {
    it("testNotCharSetWithRuleRef", () => {
        // might be a useful feature to add someday
        const pair = [
            "grammar T;\n" +
            "a : A {System.out.println($A.text);} ;\n" +
            "A : ~('a'|B) ;\n" +
            "B : 'b' ;\n",
            "error(" + ErrorType.UNSUPPORTED_REFERENCE_IN_LEXER_SET.code +
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
            "error(" + ErrorType.INVALID_LITERAL_IN_LEXER_SET.code +
            "): T.g4:3:10: multi-character literals are not allowed in lexer sets: 'aa'\n"
        ];

        ToolTestUtils.testErrors(pair);
    });
});
