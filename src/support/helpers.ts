/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet, Token, type Vocabulary } from "antlr4ng";

import { CharSupport } from "../misc/CharSupport.js";
import type { CommonTree } from "../tree/CommonTree.js";
import type { ICodeBlockForOuterMostAlt } from "../types.js";
import { Character } from "./Character.js";

/** A generic constructor type. */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

/** Allows to access members of the given object using an index signature. */
export type IndexedObject<T extends object> = T & Record<string, unknown>;

/** A line/column pair. */
export interface IPosition { line: number, column: number; }

/**
 * Is id a valid token name? Does id start with an uppercase letter?
 *
 * @param id The string to check.
 *
 * @returns `true` if the string is a valid token name; otherwise, `false`.
 */
export const isTokenName = (id: string): boolean => {
    return Character.isUpperCase(id.charCodeAt(0));
};

/**
 * Does the given object implement the `ICodeBlockForOuterMostAlt` interface?
 *
 * @param obj The object to check.
 *
 * @returns `true` if the object implements the interface; otherwise, `false`.
 */
export const isCodeBlockForOuterMostAlt = (obj: object): obj is ICodeBlockForOuterMostAlt => {
    return ("codeBlockLevel" in obj) && ("treeLevel" in obj);
};

/**
 * Format a map like Java does it.
 *
 * @param map The map to convert.
 *
 * @returns The string representation of the map.
 */
export const convertMapToString = (map: Map<unknown, unknown>): string => {
    const entries: string[] = [];
    map.forEach((value, key) => {
        entries.push(`${key}=${value}`);
    });

    return `{${entries.join(", ")}}`;
};

/**
 * Format an array like Java does it.
 *
 * @param a The array to convert.
 * @param separator The separator to use between elements.
 *
 * @returns The string representation of the array.
 */
export const convertArrayToString = <T>(a: T[], separator = ", "): string => {
    return "[" + a.join(separator) + "]";
};

/**
 * Duplicates a tree.
 *
 * @param t The tree to duplicate.
 * @param parent The parent of the tree copy.
 *
 * @returns The duplicated tree.
 */
export const dupTree = <T extends CommonTree>(t: T, parent?: CommonTree): T => {
    const newTree = t.dupNode() as T;

    // Ensure new subtree root has parent/child index set. Same index in new tree.
    newTree.childIndex = t.childIndex;
    if (parent) {
        newTree.parent = parent;
    }

    const n = t.children.length;
    for (let i = 0; i < n; i++) {
        const child = t.children[i];
        const newSubTree = dupTree(child, t);
        newTree.addChild(newSubTree);
    }

    return newTree;
};

/**
 * Given a token type, get a meaningful name for it such as the ID or string literal.  If this is a lexer and the
 * ttype is in the char vocabulary, compute an ANTLR-valid (possibly escaped) char literal.
 *
 * @param ttype The type of the token to describe.
 * @param vocabulary A vocabulary object to use for the display name.
 * @param isLexer `true` if this is a lexer grammar; otherwise, `false`.
 *
 * @returns The display name for the token.
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

/**
 * @returns whether interval (lookahead) sets are disjoint; no lookahead ⇒ not disjoint
 *
 * @param altLook The interval sets to check.
 */
export const disjoint = (altLook: Array<IntervalSet | undefined>): boolean => {
    const combined = new IntervalSet();
    for (const look of altLook) {
        if (look === undefined) {
            return false; // lookahead must've computation failed
        }

        if (look.and(combined).length !== 0) {
            return false;
        }

        combined.addSet(look);
    }

    return true;
};
