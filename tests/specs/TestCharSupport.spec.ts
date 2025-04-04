/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { IntervalSet } from "antlr4ng";
import { CharSupport } from "../../src/misc/CharSupport.js";

describe("TestCharSupport", () => {
    it("testGetANTLRCharLiteralForChar", (): void => {
        expect(CharSupport.getANTLRCharLiteralForChar(-1)).toBe("'<INVALID>'");
        expect(CharSupport.getANTLRCharLiteralForChar("\n".codePointAt(0)!)).toBe("'\\n'");
        expect(CharSupport.getANTLRCharLiteralForChar("\\".codePointAt(0)!)).toBe("'\\\\'");
        expect(CharSupport.getANTLRCharLiteralForChar("'".codePointAt(0)!)).toBe("'\\''");
        expect(CharSupport.getANTLRCharLiteralForChar("b".codePointAt(0)!)).toBe("'b'");
        expect(CharSupport.getANTLRCharLiteralForChar(0xFFFF)).toBe("'\\uFFFF'");
        expect(CharSupport.getANTLRCharLiteralForChar(0x10FFFF)).toBe("'\\u{10FFFF}'");
    });

    it("testGetCharValueFromGrammarCharLiteral", (): void => {
        expect(CharSupport.getCharValueFromGrammarCharLiteral("")).toBe(- 1);
        expect(CharSupport.getCharValueFromGrammarCharLiteral("")).toBe(-1);
        expect(CharSupport.getCharValueFromGrammarCharLiteral("b")).toBe(-1);
        expect(CharSupport.getCharValueFromGrammarCharLiteral("foo")).toBe(111);
    });

    it("testGetStringFromGrammarStringLiteral", (): void => {
        expect(CharSupport.getStringFromGrammarStringLiteral("foo\\u{bbb")).toBe(null);
        expect(CharSupport.getStringFromGrammarStringLiteral("foo\\u{[]bb")).toBe(null);
        expect(CharSupport.getStringFromGrammarStringLiteral("foo\\u[]bb")).toBe(null);
        expect(CharSupport.getStringFromGrammarStringLiteral("foo\\ubb")).toBe(null);

        expect(CharSupport.getStringFromGrammarStringLiteral("foo\\u{bb}bb")).toBe("oo»b");
    });

    it("testGetCharValueFromCharInGrammarLiteral", (): void => {
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("f")).toBe(102);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("' ")).toBe(- 1);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("\\ ")).toBe(-1);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("\\'")).toBe(39);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("\\n")).toBe(10);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("foobar")).toBe(-1);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("\\u1234")).toBe(4660);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("\\u{12}")).toBe(18);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("\\u{")).toBe(-1);
        expect(CharSupport.getCharValueFromCharInGrammarLiteral("foo")).toBe(-1);
    });

    it("testParseHexValue", (): void => {
        expect(CharSupport.parseHexValue("foobar", -1, 3)).toBe(- 1);
        expect(CharSupport.parseHexValue("foobar", 1, -1)).toBe(-1);
        expect(CharSupport.parseHexValue("foobar", 1, 3)).toBe(-1);
        expect(CharSupport.parseHexValue("123456", 1, 3)).toBe(35);
    });

    it("testCapitalize", (): void => {
        expect(CharSupport.capitalize("foo")).toBe("Foo");
    });

    it("testGetIntervalSetEscapedString", (): void => {
        expect(CharSupport.getIntervalSetEscapedString(new IntervalSet())).toBe("");
        expect(CharSupport.getIntervalSetEscapedString(IntervalSet.of(0, 0))).toBe("'\\u0000'");

        expect(CharSupport.getIntervalSetEscapedString(new IntervalSet([3, 1, 2]))).toBe("'\\u0001'..'\\u0003'");
    });

    it("testGetRangeEscapedString", (): void => {
        expect(CharSupport.getRangeEscapedString(2, 4)).toBe("'\\u0002'..'\\u0004'");
        expect(CharSupport.getRangeEscapedString(2, 2)).toBe("'\\u0002'");
    });
});
