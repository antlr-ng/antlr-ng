/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ICodeBlockForOuterMostAlt } from "../types.js";
import { Character } from "./Character.js";

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
