/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// cspell: ignore alnum Zyyy Hani VISARGA

import { describe, expect, it } from "vitest";

import { getPropertyCodePoints } from "../src/support/Unicode.js";

describe("TestUnicodeData", () => {
    const checkValue = (property: string, value: number, expected = true) => {
        const lookupResult = getPropertyCodePoints(property);
        expect(lookupResult.status).toBe("ok");
        expect(lookupResult.codePoints).toBeDefined();

        expect(lookupResult.codePoints!.contains(value)).toBe(expected);
    };

    it("testUnicodeGeneralCategoriesLatin", () => {
        checkValue("Lu", 0x58);
        checkValue("Lu", 0x78, false);
        checkValue("Ll", 0x78);
        checkValue("Ll", 0x58, false);

        // The shortcut "L" is used in multiple categories, which would fail this test.
        // Instead we use an explicit category, to make it work.
        checkValue("L", 0x58);
        checkValue("L", 0x78);
        checkValue("N", 0x30);
        checkValue("Z", 0x20);
    });

    it("testUnicodeGeneralCategoriesBMP", () => {
        checkValue("Lu", 0x1E3A);
        checkValue("Lu", 0x1E96, false);
        checkValue("Ll", 0x1E3B);
        checkValue("Ll", 0x1E00, false);
        checkValue("L", 0x1E3A);
        checkValue("L", 0x1E3B);
        checkValue("N", 0x1BB0);
        checkValue("N", 0x1E3A, false);
        checkValue("Z", 0x2028);
        checkValue("Z", 0x1E3A, false);
    });

    it("testUnicodeGeneralCategoriesSMP", () => {
        checkValue("Lu", 0x1D5D4);
        checkValue("Lu", 0x1D770, false);
        checkValue("Ll", 0x1D770);
        checkValue("Ll", 0x1D5D5, false);
        checkValue("L", 0x1D5D4);
        checkValue("L", 0x1D770);
        checkValue("N", 0x11C50);
        checkValue("N", 0x1D5D4, false);
    });

    it("testUnicodeCategoryAliases", () => {
        checkValue("Lowercase_Letter", 0x78);
        checkValue("Lowercase_Letter", 0x58, false);
        checkValue("Letter", 0x78);
        checkValue("Letter", 0x30, false);
        checkValue("Enclosing_Mark", 0x20E2);
        checkValue("Enclosing_Mark", 0x78, false);
    });

    it("testUnicodeBinaryProperties", () => {
        checkValue("Emoji", 0x1F4A9);
        checkValue("Emoji", 0x78, false);
        checkValue("Dash", 0x2D);
        checkValue("Hex", 0x44);
        checkValue("Hex", 0x51, false);
    });

    it("testUnicodeBinaryPropertyAliases", () => {
        checkValue("binary-property=Ideo", 0x611B);
        checkValue("Binary-Property=Ideo", 0x78, false);
        checkValue("Soft_Dotted", 0x0456);
        checkValue("Soft_Dotted", 0x78, false);
        checkValue("Noncharacter_Code_Point", 0xFFFF);
        checkValue("Noncharacter_Code_Point", 0x78, false);
    });

    it("testUnicodeScripts", () => {
        checkValue("Zyyy", 0x30);
        checkValue("Latn", 0x78);
        checkValue("Hani", 0x4E04);
        checkValue("Cyrl", 0x0404);
    });

    it("testUnicodeScriptEquals", () => {
        checkValue("Script=Zyyy", 0x30);
        checkValue("Script=Latn", 0x78);
        checkValue("Script=Hani", 0x4E04);
        checkValue("Script=Cyrl", 0x0404);
    });

    it("testUnicodeScriptAliases", () => {
        checkValue("Common", 0x30);
        checkValue("Latin", 0x78);
        checkValue("Han", 0x4E04);
        checkValue("Script=Cyrillic", 0x0404);
    });

    it("testUnicodeBlocks", () => {
        checkValue("InASCII", 0x30);
        checkValue("InCJK", 0x4E04);
        checkValue("InCyrillic", 0x0404);
        checkValue("InMisc_Pictographs", 0x1F4A9);
    });

    it("testUnicodeBlockEquals", () => {
        checkValue("Block=ASCII", 0x30);
        checkValue("Block=CJK", 0x4E04);
        checkValue("Block=Cyrillic", 0x0404);
        checkValue("Block=Misc_Pictographs", 0x1F4A9);
    });

    it("testUnicodeBlockAliases", () => {
        checkValue("InBasic_Latin", 0x30);
        checkValue("InMiscellaneous_Mathematical_Symbols_B", 0x29BE);
    });

    it("extendedPictographic", () => {
        checkValue("Extended_Pictographic", 0x1F588);
        checkValue("Extended_Pictographic", 0x30, false);
    });

    it("testPropertyCaseInsensitivity", () => {
        checkValue("l", 0x78);
        checkValue("l", 0x30, false);
        checkValue("common", 0x30);
    });

    it("testPropertyDashSameAsUnderscore", () => {
        checkValue("InLatin-1-supplement", 0x00F0);
    });
});
