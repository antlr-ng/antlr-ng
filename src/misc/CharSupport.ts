/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet } from "antlr4ng";

import { Character } from "../support/Character.js";
import type { IPosition } from "../support/helpers.js";
import { ErrorType } from "../tool/ErrorType.js";
import type { Grammar } from "../tool/Grammar.js";

export class CharSupport {
    /** When converting ANTLR char and string literals, here is the value set of escape chars. */
    public static readonly ANTLRLiteralEscapedCharValue = new Map<string, number>([
        ["n", "\n".codePointAt(0)!],
        ["r", "\r".codePointAt(0)!],
        ["t", "\t".codePointAt(0)!],
        ["b", "\b".codePointAt(0)!],
        ["f", "\f".codePointAt(0)!],
        ["\\", "\\".codePointAt(0)!],
    ]);

    /** Given a char, we need to be able to show as an ANTLR literal. */
    public static readonly ANTLRLiteralCharValueEscape = new Map<number, string>([
        ["\n".codePointAt(0)!, "\\n"],
        ["\r".codePointAt(0)!, "\\r"],
        ["\t".codePointAt(0)!, "\\t"],
        ["\b".codePointAt(0)!, "\\b"],
        ["\f".codePointAt(0)!, "\\f"],
        ["\\".codePointAt(0)!, "\\\\"],
    ]);

    private static readonly hexRegex = /^[0-9A-Fa-f]+$/;

    /**
     * @param c The code point to convert to an ANTLR char literal.
     *
     * @returns a string representing the escaped char for code c.  E.g., If c
     *  has value 0x100, you will get "\\u0100".  ASCII gets the usual
     *  char (non-hex) representation.  Non-ASCII characters are spit out
     *  as \\uXXXX or \\u{XXXXXX} escapes.
     */
    public static getANTLRCharLiteralForChar(c: number): string {
        let result: string;
        if (c < 0) {
            result = "<INVALID>";
        } else {
            const charValueEscape = this.ANTLRLiteralCharValueEscape.get(c);
            if (charValueEscape) {
                result = charValueEscape;
            } else {
                if (Character.UnicodeBlock.of(c) === Character.UnicodeBlock.BASIC_LATIN &&
                    !Character.isISOControl(c)) {
                    if (c === 0x5C) { // escape \ itself
                        result = "\\\\";
                    } else {
                        if (c === 0x27) { // escape single quote
                            result = "\\'";
                        } else {
                            result = String.fromCodePoint(c);
                        }
                    }
                } else {
                    if (c <= 0xFFFF) {
                        // Unicode escape sequence with 4 characters.
                        result = "\\u" + ("0000" + c.toString(16).toUpperCase()).slice(-4);
                    } else {
                        // Codepoint escape sequence with 6 characters.
                        result = "\\u{" + ("000000" + c.toString(16).toUpperCase()).slice(-6) + "}";
                    }
                }
            }
        }

        return "'" + result + "'";
    }

    /**
     * Given a literal like (the 3 char sequence with single quotes) 'a',
     * return the int value of 'a'. Convert escape sequences here also.
     *
     * @param literal The char literal to convert.
     *
     * @returns the code point value of the char literal or -1 if not a single char literal.
     */
    public static getCharValueFromGrammarCharLiteral(literal: string): number {
        if (literal.length < 3) {
            return -1;
        }

        return CharSupport.getCharValueFromCharInGrammarLiteral(literal.substring(1, literal.length - 1));
    }

    /**
     * Scans the given literal for escape sequences and returns the string.
     *
     * @param literal The string literal to examine.
     * @param grammar The grammar with details for error reporting.
     * @param position The position of the literal in the input string (needed for error reporting).
     *
     * @returns the string value of the literal or null if the literal is invalid.
     */
    public static getStringFromGrammarStringLiteral(literal: string, grammar?: Grammar,
        position?: IPosition): string | null {

        let reported = false;

        const reportError = (invalid: string, offset: number) => {
            reported = true;
            if (grammar && position) {
                grammar.tool.errorManager.grammarError(ErrorType.INVALID_ESCAPE_SEQUENCE,
                    grammar.fileName, { line: position.line, column: position.column + offset },
                    invalid);
            }
        };

        let buffer = "";
        let i = 1; // skip first quote
        const n = literal.length - 1; // skip last quote

        let isInvalid = false;

        while (i < n) {
            reported = false;

            let end = i + 1;

            // Note: we can use charAt instead of codePointAt, because all characters in a valid escape sequence are
            //       ASCII (either hex numbers or certain letters).
            if (literal.charAt(i) === "\\") {
                end = i + 2;
                if (i + 1 < n && literal.charAt(i + 1) === "u") {
                    if (i + 2 < n && literal.charAt(i + 2) === "{") { // extended escape sequence
                        end = i + 3;
                        while (true) {
                            if (end + 1 > n) {
                                reportError(literal.substring(i, end), i);
                                isInvalid = true;
                                break;
                            }

                            // invalid escape sequence.
                            const charAt = literal.charAt(end++);
                            if (charAt === "}") {
                                break;
                            }

                            if (!Character.isDigit(charAt.codePointAt(0)!) && !(charAt >= "a" && charAt <= "f")
                                && !(charAt >= "A" && charAt <= "F")) {
                                reportError(literal.substring(i, end - 1), i);
                                isInvalid = true;
                                break;
                            }
                        }
                    } else {
                        for (end = i + 2; end < i + 6; end++) {
                            if (end > n) {
                                isInvalid = true;
                                break;
                            } else {
                                const charAt = literal.charAt(end);
                                if (!Character.isDigit(charAt.codePointAt(0)!) && !(charAt >= "a" && charAt <= "f")
                                    && !(charAt >= "A" && charAt <= "F")) {
                                    const actualEnd = end >= n ? n : end + 1;
                                    reportError(literal.substring(i, actualEnd), i);
                                    isInvalid = true;
                                }
                            }
                        }
                    }
                }
            }

            if (end > n) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!reported) {
                    reportError(literal.substring(i, end), i);
                }
                isInvalid = true;
            } else {
                const esc = literal.substring(i, end);
                const c = CharSupport.getCharValueFromCharInGrammarLiteral(esc);
                if (c === -1) {
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (!reported) {
                        reportError(literal.substring(i, end), i);
                    }
                    isInvalid = true;
                } else {
                    buffer += String.fromCodePoint(c);
                }
            }
            i = end;
        }

        if (isInvalid) {
            return null;
        }

        return buffer;
    }

    /**
     * Given char x or \\t or \\u1234 return the char value. Unnecessary escapes like '\{' yield -1.
     *
     * @param cstr The char to convert.
     *
     * @returns the code point value of the char or -1 if not a single char literal.
     */
    public static getCharValueFromCharInGrammarLiteral(cstr: string): number {
        switch (cstr.length) {
            case 1: { // 'x'
                // no escape char
                return cstr.codePointAt(0)!;
            }

            case 2: {
                if (!cstr.startsWith("\\")) {
                    return -1;
                }

                // '\x'  (antlr lexer will catch invalid char)
                const escapedChar = cstr[1];
                if (escapedChar === "'") {
                    return escapedChar.codePointAt(0)!;
                }

                // escape quote only in string literals.
                return this.ANTLRLiteralEscapedCharValue.get(escapedChar) ?? -1;
            }

            case 6: {
                // '\\u1234' or '\\u{12}'
                if (!cstr.startsWith("\\u")) {
                    return -1;
                }

                let startOff: number;
                let endOff: number;
                if (cstr.charAt(2) === "{") {
                    startOff = 3;
                    endOff = cstr.indexOf("}");
                } else {
                    startOff = 2;
                    endOff = cstr.length;
                }

                return CharSupport.parseHexValue(cstr, startOff, endOff);
            }

            default: {
                if (cstr.startsWith("\\u{")) {
                    return CharSupport.parseHexValue(cstr, 3, cstr.indexOf("}"));
                }

                return -1;
            }

        }
    }

    public static parseHexValue(cstr: string, startOff: number, endOff: number): number {
        if (startOff < 0 || endOff < 0) {
            return -1;
        }

        const hexString = cstr.substring(startOff, endOff);

        if (!CharSupport.hexRegex.test(hexString)) {
            return -1;
        }

        return parseInt(hexString, 16);
    }

    public static capitalize(s: string): string {
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    public static getIntervalSetEscapedString(intervalSet: IntervalSet): string {
        const parts: string[] = [];
        for (const interval of intervalSet) {
            parts.push(CharSupport.getRangeEscapedString(interval.start, interval.stop));
        }

        return parts.join(" | ");
    }

    public static getRangeEscapedString(codePointStart: number, codePointEnd: number): string {
        return codePointStart !== codePointEnd
            ? CharSupport.getANTLRCharLiteralForChar(codePointStart) + ".." +
            CharSupport.getANTLRCharLiteralForChar(codePointEnd)
            : CharSupport.getANTLRCharLiteralForChar(codePointStart);
    }
};
