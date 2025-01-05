/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/** CLI parameters for the interpreter and testrig tools. */
export interface IInterpreterCliParameters {
    grammarFileName: string,
    lexerFileName?: string,
    lexer?: string,
    inputFile?: string,
    startRuleName: string,
    encoding: BufferEncoding,
    tokens?: boolean,
    tree?: boolean,
    trace?: boolean,
    profile?: string,
}

export const parseBoolean = (value: string | null): boolean => {
    if (value == null) {
        return false;
    }

    const lower = value.trim().toLowerCase();

    return lower === "true" || lower === "1" || lower === "on" || lower === "yes";
};

const bufferEncodings = [
    "ascii",
    "utf8",
    "utf-8",
    "utf16le",
    "utf-16le",
    "ucs2",
    "ucs-2",
    "base64",
    "base64url",
    "latin1",
    "binary",
    "hex"
] as const;

type BufferEncodingTuple = typeof bufferEncodings;
type BufferEncodingArray = Array<BufferEncodingTuple[number]>;

export const encodings: BufferEncodingArray = [...bufferEncodings];
