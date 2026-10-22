/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { Token, Vocabulary } from "antlr4ng";

import { Character } from "../../src/support/Character.js";
import { getPropertyCodePoints } from "../../src/support/Unicode.js";
import {
    convertArrayToString, convertMapToString, format, getTokenDisplayName,
} from "../../src/support/helpers.js";

describe("Support helpers coverage", () => {
    it("formats strings like Java", () => {
        expect(format("%x %X %d %f %s %q", 255, 255, 3, 1.5, "a")).toBe("ff FF 3 1.500000 a %q");
        expect(format("no placeholders")).toBe("no placeholders");
    });

    it("converts maps and arrays to strings", () => {
        expect(convertMapToString(new Map<string, number>([["a", 1], ["b", 2]]))).toBe("{a=1, b=2}");
        expect(convertMapToString(new Map())).toBe("{}");
        expect(convertArrayToString([1, 2, 3])).toContain("1, 2, 3");
        expect(convertArrayToString(["x", "y"], ";")).toContain("x;y");
    });

    it("computes token display names", () => {
        const vocabulary = new Vocabulary([null, "'a'"], [null, "A", "B"]);
        expect(getTokenDisplayName(Token.EOF, vocabulary, false)).toBe("EOF");
        expect(getTokenDisplayName(Token.INVALID_TYPE, vocabulary, false)).toBe("<INVALID>");
        expect(getTokenDisplayName(1, vocabulary, false)).toBe("'a'");
        expect(getTokenDisplayName(2, vocabulary, false)).toBe("B");
        expect(getTokenDisplayName(3, vocabulary, false)).toBe("3");

        // In lexers the type is a code point.
        expect(getTokenDisplayName(0x61, vocabulary, true)).toBe("'a'");
        expect(getTokenDisplayName(0x0A, vocabulary, true)).toBe("'\\n'");
    });

    describe("Character", () => {
        it("identifier classification", () => {
            expect(Character.isJavaIdentifierStart(0x61)).toBe(true); // a
            expect(Character.isJavaIdentifierStart(0x5F)).toBe(true); // _
            expect(Character.isJavaIdentifierStart(0x24)).toBe(true); // $
            expect(Character.isJavaIdentifierStart(0x31)).toBe(false); // 1
            expect(Character.isJavaIdentifierStart(0x20)).toBe(false); // space

            expect(Character.isJavaIdentifierPart(0x31)).toBe(true); // 1
            expect(Character.isJavaIdentifierPart(0x5F)).toBe(true); // _
            expect(Character.isJavaIdentifierPart(0x200B)).toBe(true); // zero width space is ignorable

            expect(Character.isUnicodeIdentifierStart(0x41)).toBe(true); // A
            expect(Character.isUnicodeIdentifierStart(0x31)).toBe(false);
            expect(Character.isUnicodeIdentifierPart(0x41)).toBe(true);
            expect(Character.isUnicodeIdentifierPart(0x20)).toBe(false);

            expect(Character.isIdentifierIgnorable(0x01)).toBe(true);
            expect(Character.isIdentifierIgnorable(0x200B)).toBe(true);
        });

        it("surrogates and code points", () => {
            expect(Character.isHighSurrogate(0xD83D)).toBe(true);
            expect(Character.isHighSurrogate(0x41)).toBe(false);
            expect(Character.isLowSurrogate(0xDE00)).toBe(true);
            expect(Character.isLowSurrogate(0xD83D)).toBe(false);
            expect(Character.toCodePoint(0xD83D, 0xDE00)).toBe(0x1F600);
            expect(Character.highSurrogate(0x1F600)).toBe(0xD83D);
            expect(Character.lowSurrogate(0x1F600)).toBe(0xDE00);
            expect(Character.isSupplementaryCodePoint(0x1F600)).toBe(true);
            expect(Character.charCount(0x1F600)).toBe(2);
            expect(Character.charCount(0x41)).toBe(1);
        });
    });

    describe("Unicode properties", () => {
        it("resolves properties, aliases and negated binary properties", () => {
            expect(getPropertyCodePoints("L").status).toBe("ok");
            expect(getPropertyCodePoints("general_category=lu").codePoints!.contains(0x41)).toBe(true);
            expect(getPropertyCodePoints("Script=Latin").codePoints!.contains(0x41)).toBe(true);
            expect(getPropertyCodePoints("binary_property=emoji").codePoints!.contains(0x1F600)).toBe(true);
            expect(getPropertyCodePoints("Emoji").codePoints!.contains(0x1F600)).toBe(true);
            expect(getPropertyCodePoints("emoji=true").status).toBe("not found");

            expect(getPropertyCodePoints("no_such_property").status).toBe("not found");
            expect(getPropertyCodePoints("no_such_property=value").status).toBe("not found");
        });
    });
});
