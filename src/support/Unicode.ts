/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore ahex inpc insc

import { IntervalSet } from "antlr4ng";

import {
    propertyAliases, propertyCodePointRanges, shortToLongPropertyNameMap, shortToLongPropertyValueMap,
    binaryPropertyNames
} from "../generated/UnicodeData.js";

export interface ICodePointLookupResult {
    status: "ok" | "not found" | "multiple";
    codePoints?: IntervalSet;
    candidates?: string[];
}

/** Used in ambiguous cases (when an isolated property string (or value string) resolves to multiple entries). */
const defaultCategories = ["block", "general_category", "binary_property", "script"];

/**
 * Determines the Unicode codepoint range for a given Unicode attribute.
 *
 * @param propertyCodeOrAlias The code to look up. Two forms are supported:
 *
 * 1. A simple identifier, which is looked up in all available enumerations (general categories, binary properties,
 *   scripts, blocks). All property names can be specified in full or abbreviated form.
 * 2. A key/value pair (e.g. "General_Category=Uppercase_Letter", "Script=Latin", bidi_class=Arabic_letter etc.),
 *    which limits the search to the given enumeration.
 *
 * Unicode property names are not case sensitive and the letters "_" and "-" can be used interchangeably, but
 * don't add any whitespace around the "=" sign.
 *
 * @returns the lookup result with the Unicode code point ranges which have that property (if found).
 */
export const getPropertyCodePoints = (propertyCodeOrAlias: string): ICodePointLookupResult => {
    propertyCodeOrAlias = propertyCodeOrAlias.toLowerCase().replaceAll("-", "_");

    // Try first directly as a property specifier. This will find the full form (e.g. "line_break=alphabetic").
    let set = propertyCodePointRanges.get(propertyCodeOrAlias);
    if (set) {
        return { status: "ok", codePoints: set };
    }

    // Next try to find the property by alias. This will handle cases without property names
    // (e.g. "alphabetic" or "al").
    const parts = propertyCodeOrAlias.split("=");
    if (parts.length === 1) {
        let aliasList = propertyAliases.get(propertyCodeOrAlias) ?? [];
        if (aliasList.length > 0) {
            if (aliasList.length > 1) {
                // Ambiguous case. Try to find a default category.
                const entry = aliasList.find((value) => {
                    for (const category of defaultCategories) {
                        if (value.startsWith(`${category}=`)) {
                            return true;
                        }
                    }

                    return false;
                });

                if (entry) {
                    set = propertyCodePointRanges.get(entry);

                    return { status: set !== undefined ? "ok" : "not found", codePoints: set };
                }

                return { status: "multiple", candidates: aliasList };
            }

            set = propertyCodePointRanges.get(aliasList[0]);

            return { status: set !== undefined ? "ok" : "not found", codePoints: set };
        }

        // Try special block syntax.
        if (propertyCodeOrAlias.startsWith("in")) {
            aliasList = propertyAliases.get(propertyCodeOrAlias.substring(2)) ?? [];
            if (aliasList.length > 0) {
                if (aliasList.length > 1) {
                    // Here we know it must be a block property, so search the list for full form.
                    const entry = aliasList.find((value) => {
                        return value.startsWith("block=");
                    });

                    if (entry) {
                        set = propertyCodePointRanges.get(entry);

                        return { status: set !== undefined ? "ok" : "not found", codePoints: set };
                    }

                    return { status: "multiple", candidates: aliasList };
                }

                set = propertyCodePointRanges.get(aliasList[0]);

                return { status: set !== undefined ? "ok" : "not found", codePoints: set };
            }
        }

        const longValueList = shortToLongPropertyValueMap.get(propertyCodeOrAlias) ?? [];
        if (longValueList.length > 0) {
            if (longValueList.length > 1) {
                return { status: "multiple", candidates: longValueList };
            }

            set = propertyCodePointRanges.get(longValueList[0]);

            return { status: set !== undefined ? "ok" : "not found", codePoints: set };
        }

        // Last resort: try to find the property by name.
        const longName = shortToLongPropertyNameMap.get(propertyCodeOrAlias);
        if (longName) {
            aliasList = propertyAliases.get(longName) ?? [];
            if (aliasList.length > 0) {
                if (aliasList.length > 1) {
                    return { status: "multiple", candidates: aliasList };
                }

                set = propertyCodePointRanges.get(aliasList[0]);

                return { status: set !== undefined ? "ok" : "not found", codePoints: set };
            }
        }
    }

    if (parts.length === 2) {
        const propertyName = shortToLongPropertyNameMap.get(parts[0]) ?? parts[0];

        // Special handling for binary properties.
        if (binaryPropertyNames.has(propertyName)) {
            // Include the code points for this property, if the value is true/yes/t/y.
            // Otherwise return the full Unicode set, less the values of this binary property.
            const value = parts[1].toLowerCase();
            if (value === "true" || value === "yes" || value === "t" || value === "y") {
                set = propertyCodePointRanges.get(parts[0]);

                return { status: set !== undefined ? "ok" : "not found", codePoints: set };
            }

            const fullSet = IntervalSet.of(0, 0x10FFFF);
            set = propertyCodePointRanges.get(parts[0])!;
            set = fullSet.subtract(set);

            return { status: "ok", codePoints: set };
        }

        let propertyValueList = shortToLongPropertyValueMap.get(parts[1]);
        if (!propertyValueList) {
            // Try to find the property value by alias.
            propertyValueList = propertyAliases.get(parts[1]);

            if (!propertyValueList) {
                const longName = shortToLongPropertyNameMap.get(parts[1]);
                if (longName) {
                    propertyValueList = [`${propertyName}=${longName}`];
                }
            }
        }

        if (propertyValueList) {
            // Since we have a property name, we can now look up the property value, even if there are multiple
            // possibilities (instead of reporting back an ambiguity).
            const entry = propertyValueList.find((value) => {
                return value.startsWith(`${propertyName}=`);
            });

            if (entry) {
                set = propertyCodePointRanges.get(entry);

                return { status: set !== undefined ? "ok" : "not found", codePoints: set };
            }
        }
    }

    return { status: "not found" };
};
