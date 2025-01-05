/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore Deseret

import { describe, expect, it } from "vitest";

import { IntervalSet } from "antlr4ng";

import { EscapeSequenceParsing, ResultType, type IEscapeParsingResult } from "../src/misc/EscapeSequenceParsing.js";
import { Character } from "../src/support/Character.js";

const emptySet = IntervalSet.of(-1, -1);

describe("TestEscapeSequenceParsing", () => {
    const createResult = (type: ResultType, codePoint: number | string, propertyIntervalSet: IntervalSet,
        startOffset: number, parseLength: number): IEscapeParsingResult => {

        const cp = typeof codePoint === "string" ? codePoint.codePointAt(0)! : codePoint;

        return {
            type, codePoint: cp, propertyIntervalSet, startOffset, parseLength
        };
    };

    it("testParseEmpty", () => {
        expect(EscapeSequenceParsing.parseEscape("", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseJustBackslash", () => {
        expect(EscapeSequenceParsing.parseEscape("\\", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseInvalidEscape", () => {
        expect(EscapeSequenceParsing.parseEscape("\\z", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseNewline", () => {
        expect(EscapeSequenceParsing.parseEscape("\\n", 0)).toEqual(createResult(ResultType.CodePoint, "\n", emptySet,
            0, 2));
    });

    it("testParseTab", () => {
        expect(EscapeSequenceParsing.parseEscape("\\t", 0)).toEqual(createResult(ResultType.CodePoint, "\t",
            emptySet, 0, 2));
    });

    it("testParseUnicodeTooShort", () => {
        expect(EscapeSequenceParsing.parseEscape("\\uABC", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodeBMP", () => {
        expect(EscapeSequenceParsing.parseEscape("\\uABCD", 0)).toEqual(createResult(ResultType.CodePoint, 0xABCD,
            emptySet, 0, 6));
    });

    it("testParseUnicodeSMPTooShort", () => {
        expect(EscapeSequenceParsing.parseEscape("\\u{}", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodeSMPMissingCloseBrace", () => {
        expect(EscapeSequenceParsing.parseEscape("\\u{12345", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodeTooBig", () => {
        expect(EscapeSequenceParsing.parseEscape("\\u{110000}", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodeSMP", () => {
        expect(EscapeSequenceParsing.parseEscape("\\u{10ABCD}", 0)).toEqual(
            expect.objectContaining(createResult(ResultType.CodePoint, 0x10ABCD, emptySet, 0, 10)));
    });

    it("testParseUnicodePropertyTooShort", () => {
        expect(EscapeSequenceParsing.parseEscape("\\p{}", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodePropertyMissingCloseBrace", () => {
        expect(EscapeSequenceParsing.parseEscape("\\p{1234", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodeProperty", () => {
        expect(EscapeSequenceParsing.parseEscape("\\p{Deseret}", 0)).toEqual(
            expect.objectContaining(createResult(ResultType.Property, -1, IntervalSet.of(66560, 66639), 0, 11)));
    });

    it("testParseUnicodePropertyInvertedTooShort", () => {
        expect(EscapeSequenceParsing.parseEscape("\\P{}", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodePropertyInvertedMissingCloseBrace", () => {
        expect(EscapeSequenceParsing.parseEscape("\\P{Deseret", 0).type).toEqual(ResultType.Invalid);
    });

    it("testParseUnicodePropertyInverted", () => {
        const expected = IntervalSet.of(0, 66559);
        expected.addRange(66640, Character.MAX_CODE_POINT);
        expect(EscapeSequenceParsing.parseEscape("\\P{Deseret}", 0)).toEqual(
            expect.objectContaining(createResult(ResultType.Property, -1, expected, 0, 11)));
    });
});
