/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

import { IntervalSet } from "antlr4ng";

import { Character } from "../support/Character.js";
import { CharSupport } from "./CharSupport.js";
import { getPropertyCodePoints } from "../support/Unicode.js";

export enum ResultType {
    Invalid,
    CodePoint,
    Property
};

export interface IEscapeParsingResult {
    type: ResultType;
    codePoint: number;
    propertyIntervalSet: IntervalSet;
    startOffset: number;
    parseLength: number;
}

/**
 * Utility class to parse escapes like:
 *   \\n
 *   \\uABCD
 *   \\u{10ABCD}
 *   \\p{Foo}
 *   \\P{Bar}
 *   \\p{Baz=Bez}
 *   \\P{Baz=Bez}
 */
export abstract class EscapeSequenceParsing {
    static #emptySet = IntervalSet.of(-1, -1);
    static #fullSet = IntervalSet.of(Character.MIN_CODE_POINT, Character.MAX_CODE_POINT);

    /**
     * Parses a single escape sequence starting at `startOff`.
     *
     * @returns a type of INVALID if no valid escape sequence was found, a Result otherwise.
     */
    public static parseEscape(s: string, startOff: number): IEscapeParsingResult {
        let offset = startOff;
        if (offset + 2 > s.length || s.codePointAt(offset) !== 0x5C) { // backslash
            return EscapeSequenceParsing.invalid(startOff, s.length - 1);
        }

        // Move past backslash.
        offset++;
        const escaped = s.codePointAt(offset)!;

        // Move past escaped code point.
        offset += Character.charCount(escaped);
        if (escaped === 0x75) { // 'u'
            // \\u{1} is the shortest we support
            if (offset + 3 > s.length) {
                return EscapeSequenceParsing.invalid(startOff, s.length - 1);
            }

            let hexStartOffset: number;
            let hexEndOffset: number; // appears to be exclusive
            if (s.codePointAt(offset) === 0x7B) { // '{'
                hexStartOffset = offset + 1;
                hexEndOffset = s.indexOf("}", hexStartOffset);
                if (hexEndOffset === -1) {
                    return EscapeSequenceParsing.invalid(startOff, s.length - 1);
                }

                offset = hexEndOffset + 1;
            } else {
                if (offset + 4 > s.length) {
                    return EscapeSequenceParsing.invalid(startOff, s.length - 1);
                }

                hexStartOffset = offset;
                hexEndOffset = offset + 4;
                offset = hexEndOffset;
            }

            const codePointValue = CharSupport.parseHexValue(s, hexStartOffset, hexEndOffset);
            if (codePointValue === -1 || codePointValue > Character.MAX_CODE_POINT) {
                return EscapeSequenceParsing.invalid(startOff, startOff + 6 - 1);
            }

            return {
                type: ResultType.CodePoint,
                codePoint: codePointValue,
                propertyIntervalSet: EscapeSequenceParsing.#emptySet,
                startOffset: startOff,
                parseLength: offset - startOff,
            };
        } else if (escaped === 0x70 || escaped === 0x50) { // 'p' or 'P'
            // \p{L} is the shortest we support.
            if (offset + 3 > s.length) {
                return EscapeSequenceParsing.invalid(startOff, s.length - 1);
            }

            if (s.codePointAt(offset) !== 0x7B) { // '{'
                return EscapeSequenceParsing.invalid(startOff, offset);
            }

            const openBraceOffset = offset;
            const closeBraceOffset = s.indexOf("}", openBraceOffset);
            if (closeBraceOffset === -1) {
                return EscapeSequenceParsing.invalid(startOff, s.length - 1);
            }

            const propertyName = s.substring(openBraceOffset + 1, closeBraceOffset);
            const lookupResult = getPropertyCodePoints(propertyName);
            if (lookupResult.status !== "ok" || lookupResult.codePoints === undefined
                || lookupResult.codePoints.length === 0) {
                return EscapeSequenceParsing.invalid(startOff, closeBraceOffset);
            }

            offset = closeBraceOffset + 1;
            let codePoints = lookupResult.codePoints;
            if (escaped === 0x50) { // 'P'
                codePoints = codePoints.complementWithVocabulary(EscapeSequenceParsing.#fullSet);
            }

            return {
                type: ResultType.Property,
                codePoint: -1,
                propertyIntervalSet: codePoints,
                startOffset: startOff,
                parseLength: offset - startOff,
            };
        } else {
            let codePoint = CharSupport.ANTLRLiteralEscapedCharValue.get(s[offset - 1]);
            if (codePoint === undefined) {
                if (escaped !== 0x5D && escaped !== 0x2D) { // escape ']' and '-' only in char sets.
                    return EscapeSequenceParsing.invalid(startOff, startOff + 1);
                } else {
                    codePoint = escaped;
                }
            }

            return {
                type: ResultType.CodePoint,
                codePoint,
                propertyIntervalSet: EscapeSequenceParsing.#emptySet,
                startOffset: startOff,
                parseLength: offset - startOff,
            };
        }
    }

    private static invalid(start: number, stop: number): IEscapeParsingResult { // start..stop is inclusive
        // TODO: include the list of possible candidates in the error message, if more than one exists.
        return {
            type: ResultType.Invalid,
            codePoint: 0,
            propertyIntervalSet: EscapeSequenceParsing.#emptySet,
            startOffset: start,
            parseLength: stop - start + 1,
        };
    }
}
