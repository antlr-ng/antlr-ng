/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, Token } from "antlr4ng";
import { describe, expect, it } from "vitest";

import { ActionSplitter } from "../src/generated/ActionSplitter.js";

describe("TestActionSplitter", () => {
    // Have to disable two tests that rely on ANTLR3-only features.
    // The splitter's getActionTokens() method takes care for the normal case (which we don't test here).
    const exprs = [
        { input: "foo", expected: `'foo'<${ActionSplitter.TEXT}>` },
        { input: "$x", expected: `'$x'<${ActionSplitter.ATTR}>` },
        { input: "\\$x", expected: `'\\$x'<${ActionSplitter.TEXT}>` },
        { input: "$x.y", expected: `'$x.y'<${ActionSplitter.QUALIFIED_ATTR}>` },
        { input: "$ID.text", expected: `'$ID.text'<${ActionSplitter.QUALIFIED_ATTR}>` },
        { input: "$ID", expected: `'$ID'<${ActionSplitter.ATTR}>` },
        //{ input: "$ID.getText()", expected: `'$ID'<${ActionSplitter.ATTR}>, '.getText()'<${ActionSplitter.TEXT}>` },
        {
            input: "$ID.text = \"test\";",
            expected: `'$ID.text'<${ActionSplitter.QUALIFIED_ATTR}>, ' = "test";'<${ActionSplitter.TEXT}>`
        },
        {
            input: "$a.line == $b.line",
            expected: `'$a.line'<${ActionSplitter.QUALIFIED_ATTR}>, ' == '<${ActionSplitter.TEXT}>, ` +
                `'$b.line'<${ActionSplitter.QUALIFIED_ATTR}>`
        },
        { input: "$r.tree", expected: `'$r.tree'<${ActionSplitter.QUALIFIED_ATTR}>` },
        {
            input: "foo $a::n bar",
            expected: `'foo '<${ActionSplitter.TEXT}>, '$a::n'<${ActionSplitter.NONLOCAL_ATTR}>, ` +
                `' bar'<${ActionSplitter.TEXT}>`
        },
        { input: "$rule::x;", expected: `'$rule::x'<${ActionSplitter.NONLOCAL_ATTR}>, ';'<${ActionSplitter.TEXT}>` },
        { input: "$field::x = $field.st;", expected: `'$field::x = $field.st;'<${ActionSplitter.SET_NONLOCAL_ATTR}>` },
        /*{
            input: "$foo.get(\"ick\");",
            expected: `'$foo'<${ActionSplitter.ATTR}>, '.get("ick");'<${ActionSplitter.TEXT}>`
        },*/
    ];

    const getActionChunks = (a: string): string[] => {
        const chunks: string[] = [];
        const splitter = new ActionSplitter(CharStream.fromString(a));

        let t = splitter.nextToken();
        while (t.type !== Token.EOF) {
            chunks.push("'" + t.text + "'<" + t.type + ">");
            t = splitter.nextToken();
        }

        return chunks;
    };

    it.each(exprs)("input: $input", ({ input, expected }) => {
        const chunks = getActionChunks(input);
        expect(chunks.join(", ")).toBe(expected);
    });

});
