/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharSupport } from "src/misc/CharSupport.js";
import { Character } from "src/support/Character.js";
import { Grammar } from "src/tool/Grammar.js";
import type { CodeGenerator } from "./CodeGenerator.js";

/** Represets a single code point in Unicode. */
export type CodePoint = number;

/**
 * Base class for all target generators. It provides some common functionality.
 * The actual code generation is done in the subclasses.
 */
export class GeneratorHelper {
    public static readonly defaultCharValueEscape = new Map<CodePoint, string>([
        ["\t".codePointAt(0)!, "\\t"],
        ["\b".codePointAt(0)!, "\\b"],
        ["\n".codePointAt(0)!, "\\n"],
        ["\r".codePointAt(0)!, "\\r"],
        ["\f".codePointAt(0)!, "\\f"],
        ["'".codePointAt(0)!, "\\'"],
        ['"'.codePointAt(0)!, '\\"'],
        ["\\".codePointAt(0)!, "\\\\"],
    ]);

    /**
     * For pure strings of Unicode char, how can we display it in the target language as a literal. Useful for dumping
     * predicates and such that may refer to chars that need to be escaped when represented as strings.
     *
     * @returns The default map with the most common escape sequences. Subclasses can override this method to provide
     *          additional or different escape sequences.
     */
    public static getTargetCharValueEscape(): Map<CodePoint, string> | undefined {
        return GeneratorHelper.defaultCharValueEscape;
    }

    public static escapeIfNeeded(identifier: string): string {
        return ""; //this.reservedWords.has(identifier) ? this.escapeWord(identifier) : identifier;
    }

    /**
     * Get a meaningful name for a token type useful during code generation. Literals without associated names
     * are converted to the string equivalent of their integer values. Used to generate x==ID and x==34 type
     * comparisons etc...  Essentially we are looking for the most obvious way to refer to a token type in the
     * generated code.
     *
     * @param g The grammar object.
     * @param ttype The token type to convert.
     *
     * @returns The token type as a string.
     */
    public static getTokenTypeAsTargetLabel(g: Grammar, ttype: number): string {
        const name = this.escapeIfNeeded(g.getTokenName(ttype)!);

        // If name is not valid, return the token type instead.
        if (Grammar.INVALID_TOKEN_NAME === name) {
            return String(ttype);
        }

        return name;
    }

    public static getTokenTypesAsTargetLabels(g: Grammar, tokenTypes: number[]): string[] {
        const labels = new Array<string>(tokenTypes.length);
        for (let i = 0; i < tokenTypes.length; i++) {
            labels[i] = this.getTokenTypeAsTargetLabel(g, tokenTypes[i]);
        }

        return labels;
    }

    /**
     * Given a random string of unicode chars, return a new string with optionally appropriate quote characters for
     * target language and possibly with some escaped characters. For example, if the incoming string has actual
     * newline characters, the output of this method would convert them to the two char sequence \n for Java, C,
     * C++, ... The new string has double-quotes around it as well. Example string in memory:
     *
     * ```
     * a"[newlineChar]b'c[carriageReturnChar]d[tab]e\f
     * ```
     * would be converted to the valid string:
     * ```
     * "a\"\nb'c\rd\te\\f"
     * ```
     * or
     * ```
     * a\"\nb'c\rd\te\\f
     * ```
     * depending on the quoted arg.
     *
     * @param s The string to convert.
     * @param quoted If true, the string is quoted. If false, it is not.
     *
     * @returns The converted string.
     */
    public static getTargetStringLiteralFromString(s: string, quoted?: boolean): string {
        quoted ??= true;

        let result = "";
        if (quoted) {
            result += '"';
        }

        for (let i = 0; i < s.length;) {
            const c = s.codePointAt(i)!;
            const escaped = (c <= Character.MAX_VALUE) ? this.getTargetCharValueEscape()?.get(Number(c)) : undefined;
            if (c !== 0x27 && escaped) { // Don't escape single quotes in strings for Java.
                result += escaped;
            } else if (this.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(c)) {
                result += this.createUnicodeEscapedCodePoint(i);
            } else {
                result += String.fromCodePoint(c);
            }

            i += Character.charCount(c);
        }

        if (quoted) {
            result += '"';
        }

        return result;
    }

    /**
     * Converts from an antlr-ng string literal found in a grammar file to an equivalent string literal in the target
     * language.
     *
     * For Java, this is the translation `'a\n"'` -> `"a\n\""`. Expect single quotes around the incoming literal.
     * Just flip the quotes and replace double quotes with `\"`.
     *
     * Note that we have decided to allow people to use '\"' without penalty, so we must build the target string in
     * a loop as {@link String.replaceAll} cannot handle both `\"` and `"` without a lot of messing around.
     *
     * @param generator The code generator instance.
     * @param literal The string literal to convert.
     * @param addQuotes If true, the string is quoted. If false, it is not.
     * @param escapeSpecial If true, escape special characters.
     *
     * @returns The converted string.
     */
    public static getTargetStringLiteralFromANTLRStringLiteral(generator: CodeGenerator, literal: string,
        addQuotes: boolean, escapeSpecial?: boolean): string {
        escapeSpecial ??= false;

        let result = "";
        if (addQuotes) {
            result += '"';
        }

        for (let i = 1; i < literal.length - 1;) {
            const codePoint = literal.codePointAt(i)!;
            let toAdvance = Character.charCount(codePoint);
            if (codePoint === 0x5C) { // backslash
                // Anything escaped is what it is! We assume that people know how to escape characters correctly.
                // However we catch anything that does not need an escape in Java (which is what the default
                // implementation is dealing with and remove the escape. The C target does this for instance.
                const escapedChar = literal.charAt(i + toAdvance);
                toAdvance++;
                switch (escapedChar) {
                    // Pass through any escapes that Java also needs
                    case "n":
                    case "r":
                    case "t":
                    case "b":
                    case "f":
                    case "\\": {
                        // Pass the escape through.
                        if (escapeSpecial && escapedChar !== "\\") {
                            result += "\\";
                        }
                        result += "\\" + escapedChar;
                        break;
                    }

                    case "u": { // Either unnnn or u{nnnnnn}.
                        if (literal.charAt(i + toAdvance) === "{") {
                            while (literal.charAt(i + toAdvance) !== "}") {
                                ++toAdvance;
                            }
                            ++toAdvance;
                        } else {
                            toAdvance += 4;
                        }

                        if (i + toAdvance <= literal.length) { // We might have an invalid \\uAB or something.
                            const fullEscape = literal.substring(i, i + toAdvance);
                            result += this.createUnicodeEscapedCodePoint(
                                CharSupport.getCharValueFromCharInGrammarLiteral(fullEscape), escapeSpecial);
                        }

                        break;
                    }

                    default: {
                        const codePoint = literal.codePointAt(i + toAdvance)!;
                        if (this.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint)) {
                            result += this.createUnicodeEscapedCodePoint(codePoint, escapeSpecial);
                        } else {
                            result += escapedChar;
                        }

                        break;
                    }
                }
            } else {
                if (codePoint === 0x22) {
                    // antlr-ng doesn't escape " in literal strings, but every other language needs to do so.
                    result += "\\\"";
                } else if (this.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint)) {
                    result += this.createUnicodeEscapedCodePoint(codePoint, escapeSpecial);
                } else {
                    result += String.fromCodePoint(codePoint);
                }
            }

            i += toAdvance;
        }

        if (addQuotes) {
            result += '"';
        }

        return result;
    }

    /**
     * Generates a list of entries in a format that is suitable for TypeScript.
     * The list is split into multiple lines if it exceeds the specified wrap length.
     *
     * @param list The list of entries to be formatted. We are using string coercion here, so make sure any
     *             non-primitive type is rendered to a string, before calling this method.
     * @param wrap The maximum number of elements per line.
     *
     * @returns A string representation of the formatted list.
     */
    public static renderList(list: unknown[], wrap: number): string {
        const result = [];
        for (let i = 0; i < list.length; i++) {
            if (i % wrap === 0 && i > 0) {
                result.push("\n");
            }
            result.push(String(list[i]));
        }

        return result.join(", ");
    }

    /**
     * Takes a list of lines and formats them with the specified indentation. It filters out undefined
     * lines, and adds the specified indentation to each line.
     *
     * @param lines The lines to format.
     * @param indentation The number of spaces to use for indentation.
     *
     * @returns The formatted lines as a single string.
     */
    public static formatLines(lines: Array<string | undefined>, indentation: number) {
        // First filter all undefined lines.
        const filteredLines = lines.filter(line => {
            return line !== undefined;
        });

        // Then format the lines with the specified indentation.
        const formattedLines = filteredLines.map(line => {
            return " ".repeat(indentation) + line;
        });

        return formattedLines.join("\n");
    }

    public static toTitleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    protected static escapeWord(word: string): string {
        return word + "_";
    }

    protected static escapeCodePoint(codePoint: number): string {
        if (Character.isSupplementaryCodePoint(codePoint)) {
            return "\\u" + Number(Character.highSurrogate(codePoint)).toString(16).toUpperCase().padStart(4, "0") +
                "\\u" + Number(Character.lowSurrogate(codePoint)).toString(16).toUpperCase().padStart(4, "0");
        } else {
            return "\\u" + codePoint.toString(16).padStart(4, "0");
        }
    }

    protected static shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint: number): boolean {
        return codePoint < 0x20   // Control characters up to but not including space.
            || codePoint === 0x5C // backslash
            || codePoint >= 0x7F; // DEL and beyond (keeps source code 7-bit US-ASCII).
    }

    protected static escapeChar(v: number): string {
        return `\\u${v.toString(16).padStart(4, "0")}`;
    }

    /**
     * Escapes the Unicode code point appropriately for this language and append the escaped value to `sb`.
     * It exists for flexibility and backward compatibility with external targets, The static method
     * {@link UnicodeEscapes.appendEscapedCodePoint(StringBuilder, int, String)} can be used as well
     * if default escaping method (Java) is used or language is officially supported
     *
     * @param codePoint The code point to escape.
     * @param escape If true, the code point is escaped.
     *
     * @returns The escaped code point as a string.
     */
    private static createUnicodeEscapedCodePoint(codePoint: number, escape?: boolean): string {
        let result = this.escapeCodePoint(codePoint);

        if (escape) {
            result = "\\" + result;
        }

        return result;
    }

}
