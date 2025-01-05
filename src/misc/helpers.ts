/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { Token, Vocabulary } from "antlr4ng";
import { CharSupport } from "./CharSupport.js";

/** A generic constructor type. */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

/** A line/column pair. */
export interface IPosition { line: number, column: number; }

/**
 * Given a token type, get a meaningful name for it such as the ID
 * or string literal.  If this is a lexer and the ttype is in the
 * char vocabulary, compute an ANTLR-valid (possibly escaped) char literal.
 */
export const getTokenDisplayName = (ttype: number, vocabulary: Vocabulary, isLexer: boolean): string => {
    // Inside any target's char range and is lexer grammar?
    // TODO: the char range is now dynamically configurable and we need access to a lexer instance here.
    if (isLexer /*&& ttype >= Lexer.MIN_CHAR_VALUE && ttype <= Lexer.MAX_CHAR_VALUE*/) {
        return CharSupport.getANTLRCharLiteralForChar(ttype);
    }

    if (ttype === Token.EOF) {
        return "EOF";
    }

    if (ttype === Token.INVALID_TYPE) {
        return "<INVALID>";
    }

    const result = vocabulary.getDisplayName(ttype);
    if (result !== null) {
        return result;
    }

    return String(ttype);
};

/**
 * Formats a string using the provided arguments. This is a partial implementation of the `String.format`
 * method in Java.
 *
 * @param formatString The format string.
 * @param args The arguments to use for formatting.
 *
 * @returns The formatted string.
 */
export const format = (formatString: string, ...args: unknown[]): string => {
    // cspell: ignore Xdfs
    return formatString.replace(/%([xXdfs])/g, (match, format) => {
        const value = args.shift()!;
        switch (format) {
            case "x": {
                return Number(value).toString(16);
            }

            case "X": {
                return Number(value).toString(16).toUpperCase();
            }

            case "f": {
                return Number(value).toFixed(6);
            }

            case "s":
            case "d": {
                return String(value);
            }

            default: {
                return match;
            }
        }
    });
};
