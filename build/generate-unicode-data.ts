/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore inpc, insc

/**
 * This class extracts necessary Unicode data from the Unicode database and generates a TypeScript file
 * with that data. The file is then used by the ANTLR tool to support Unicode properties and categories.
 */

import { createWriteStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

import { IntervalSet } from "antlr4ng";
import { fileURLToPath } from "node:url";

interface IUnicodeRange {
    begin: number;
    end: number;
    length: number;
}

interface IDataFileContent {
    default: IUnicodeRange[];
}

const packageName = "@unicode/unicode-16.0.0";
const sourcePath = dirname(fileURLToPath(import.meta.url));
const dataPath = join(sourcePath, `../node_modules/${packageName}`);

const propertyAliases = new Map<string, string[]>();
const shortToLongPropertyNameMap = new Map<string, string>();
const shortToLongPropertyValueMap = new Map<string, string[]>();
const binaryPropertyNames = new Set<string>();

const numberToHex = (value: number): string => {
    return value.toString(16).toUpperCase();
};

/**
 * Imports the given unicode data file and creates an interval set from it, by collecting all contained ranges.
 *
 * @param file The file to import.
 *
 * @returns An interval set containing all ranges from the imported file.
 */
const intervalSetFromImport = async (file: string): Promise<IntervalSet> => {
    const content = await import(file) as IDataFileContent;
    const set = new IntervalSet();
    for (const range of content.default) {
        set.addRange(range.begin, range.end - 1);
    }

    return set;
};

/**
 * Loads the property aliases from the Unicode database and extracts all relevant parts.
 *
 * @returns A map with all aliases.
 */
const loadPropertyAliases = async (): Promise<void> => {
    let propertyAliasesContent = await readFile(join(sourcePath, "PropertyValueAliases.txt"), "utf8");

    // Remove copyright header.
    let end = propertyAliasesContent.indexOf("# ====");
    end = propertyAliasesContent.indexOf("\n", end) + 1;
    propertyAliasesContent = propertyAliasesContent.substring(end);

    // Split into sections. A section begins with a line like "# General_Category" and ends with the next "#".
    const sections: string[][] = [];
    const lines = propertyAliasesContent.split("\n");
    let currentSection: string[] = [];
    for (const line of lines) {
        if (line.length === 0) {
            continue;
        }

        if (line.startsWith("#")) {
            if (currentSection.length > 0) {
                sections.push(currentSection);
            }

            currentSection = [];
        }

        currentSection.push(line);
    }

    for (const section of sections) {
        // The first line is the section header and consists of "# " followed by the long property name and
        // its abbreviation in parenthesis).
        const line = section.shift()!;
        const heading = line.toLowerCase().substring(2).trim();
        const parts = heading.split(" ");
        if (parts.length < 2) {
            continue;
        }

        const longName = parts[0];
        if (longName === "age") { // Not really a property.
            continue;
        }

        const shortName = parts[1].substring(1, parts[1].length - 1).toLowerCase();
        if (shortName !== longName) {
            shortToLongPropertyNameMap.set(shortName, longName);
        }

        let addBinaryPropertyEntry = false;
        for (let line of section) {
            const commentStart = line.indexOf("#");
            if (commentStart >= 0) {
                line = line.substring(0, commentStart);
            }
            const parts = line.split(";");

            // Each data line is of the form: property abbreviation; value abbreviation; value full; ...
            if (parts.length < 3) {
                continue;
            }

            if (parts.length >= 5 && (parts[4].trim() === "True" || parts[4].trim() === "False")) {
                // We have a binary property here. Add a lookup entry for it and add it to the list
                // of binary properties.
                addBinaryPropertyEntry = true;
                continue;
            }

            // Canonical_Combining_Class is a special case. It has an additional field in the second position,
            // which we ignore here.
            if (longName === "canonical_combining_class" && parts.length > 3) {
                parts.splice(1, 1);
            }

            const abbr = parts[1].trim().toLowerCase();
            const full = parts[2].trim().toLowerCase();

            if (abbr !== full) {
                let list = shortToLongPropertyValueMap.get(abbr) ?? [];
                list.push(`"${longName}=${full}"`);
                shortToLongPropertyValueMap.set(abbr, list);

                list = propertyAliases.get(abbr) ?? [];
                list.push(`"${longName}=${full}"`);
                propertyAliases.set(abbr, list);
            }

            const list = propertyAliases.get(full) ?? [];
            list.push(`"${longName}=${full}"`);
            propertyAliases.set(full, list);
        }

        if (addBinaryPropertyEntry) {
            binaryPropertyNames.add(longName);

            const list = propertyAliases.get(longName) ?? [];
            list.push(`"binary_property=${longName}"`);
            propertyAliases.set(longName, list);
        }
    }
};

// Generate the Unicode data file.
const targetPath = join(sourcePath, "../src/generated/UnicodeData.ts");
const writer = createWriteStream(targetPath);

writer.write("// Data generated by build/generate-unicode-data.ts. Do not edit.\n\n");
writer.write("/* eslint-disable */\n\n");
writer.write("/* cspell: disable */\n\n");
writer.write(`import { IntervalSet } from "antlr4ng";\n\n`);
writer.write(`/** A mapping from a Unicode property type to a set of code points. */\n`);
writer.write(`export const propertyCodePointRanges = new Map<string, IntervalSet>();\n\n`);

const generateMap = async (basePath: string, alias?: string): Promise<void> => {
    console.log(`Generating map for ${basePath}...`);

    const name = basePath.toLocaleLowerCase();
    const fullPropertyName = alias ?? name;

    // Enumerate all folders in the base path.
    const folderPath = join(dataPath, basePath);
    const elements = await readdir(folderPath);
    for (const element of elements) {
        // Is the element a folder?
        const target = join(folderPath, element);
        const s = await stat(target);
        if (!s.isDirectory()) {
            continue;
        }

        writer.write(`set = new IntervalSet();\n`);
        const set = await intervalSetFromImport(`${target}/ranges.js`);
        let counter = 0;
        for (const range of set) {
            writer.write(`set.addRange(0x${numberToHex(range.start)}, ` + `0x${numberToHex(range.stop)}); `);
            ++counter;
            if (counter === 5) {
                writer.write("\n");
                counter = 0;
            }
        }

        if (counter > 0) {
            writer.write("\n");
        }

        const elementName = element.toLocaleLowerCase();
        writer.write(`propertyCodePointRanges.set("${fullPropertyName}=${elementName}", set);\n\n`);
    }
};

const generateBlocksMap = async (): Promise<void> => {
    console.log(`Collecting Unicode blocks data...`);

    const folderPath = join(dataPath, "Block");
    const elements = await readdir(folderPath);

    const ranges = new Map<string, string>();
    const nameMap = new Map<string, string>();

    writer.write(`export class UnicodeBlockConstants {\n`);
    for (let i = 0; i < elements.length; ++i) {
        const element = elements[i];

        const target = join(folderPath, element);
        const s = await stat(target);
        if (!s.isDirectory() || element === "undefined") {
            continue;
        }

        writer.write(`    public static ${element.toUpperCase()} = ${i};\n`);

        // Block ranges always contain only one entry.
        const content = await import(`${target}/ranges.js`) as IDataFileContent;

        ranges.set(`UnicodeBlockConstants.${element.toUpperCase()}`,
            `[0x${numberToHex(content.default[0].begin)}, ` +
            `0x${numberToHex(content.default[0].end)}]`);
        nameMap.set(element, `UnicodeBlockConstants.${element.toUpperCase()}`);
    }

    // Write collected maps.
    writer.write(`\n    public static readonly ranges = new Map<number, [number, number]>([\n`);
    for (const [key, value] of ranges) {
        writer.write(`        [${key}, ${value}], \n`);
    }
    writer.write(`    ]); \n`);

    writer.write(`\n    public static readonly names = new Map<string, number>([\n`);
    for (const [key, value] of nameMap) {
        writer.write(`        ["${key.replace(/_/g, "").toLowerCase()}", ${value}], \n`);
    }

    writer.write("    ]);\n\n}\n\n");
};

await generateBlocksMap();

writer.write(`let set: IntervalSet; \n\n`);

await generateMap("Bidi_Class");
await generateMap("Binary_Property");
await generateMap("Block");
await generateMap("General_Category");
await generateMap("Line_Break");
await generateMap("Script");
await generateMap("Script_Extensions");
await generateMap("Word_Break");

// Manually add a number of values which are not listed in the Unicode package.

// 1. Grapheme cluster break values (from ICU). Not sure why they are here, since they are not code points.
//    So what's written here are fake values to conform to the old ANTLR tool tests.
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=other", IntervalSet.of(0, 0));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=control", IntervalSet.of(1, 1));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=cr", IntervalSet.of(2, 2));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=extend", IntervalSet.of(3, 3));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=l", IntervalSet.of(4, 4));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=lf", IntervalSet.of(5, 5));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=lv", IntervalSet.of(6, 6));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=lvt", IntervalSet.of(7, 7));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=t", IntervalSet.of(8, 8));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=v", IntervalSet.of(9, 9));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=spacingmark", IntervalSet.of(10, 10));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=prepend", IntervalSet.of(11, 11));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=regional_indicator", IntervalSet.of(12, 12));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=e_base", IntervalSet.of(13, 13));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=e_base_gaz", IntervalSet.of(14, 14));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=e_modifier", IntervalSet.of(15, 15));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=glue_after_zwj", IntervalSet.of(16, 16));\n`);
writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=zwj", IntervalSet.of(17, 17));\n\n`);

// 2. Emoji presentation code points.
writer.write(`const emojis = propertyCodePointRanges.get("binary_property=emoji")!;\n`);
writer.write(`const emojiPresentation = propertyCodePointRanges.get("binary_property=emoji_presentation")!;\n`);
writer.write(`set = emojis.and(emojiPresentation);\n`);
writer.write(`propertyCodePointRanges.set("emojipresentation=emojidefault", set);\n\n`);

writer.write(`set = emojis.subtract(emojiPresentation);\n`);
writer.write(`propertyCodePointRanges.set("emojipresentation=textdefault", set);\n\n`);

writer.write(`const fullSet = IntervalSet.of(0, 0x10FFFF);\n`);
writer.write(`set = fullSet.subtract(emojis);\n`);
writer.write(`propertyCodePointRanges.set("emojipresentation=text", set);\n\n`);

// Write the collected values.
await loadPropertyAliases();

writer.write(`export const binaryPropertyNames = new Set<string>([ \n`);
binaryPropertyNames.forEach((value) => {
    writer.write(`    "${value}", \n`);
});
writer.write(`]); \n\n`);

writer.write(`export const propertyAliases = new Map<string, string[]>([ \n`);
propertyAliases.forEach((value, key) => {
    writer.write(`    ["${key}", [${value.join(", ")}]], \n`);
});
writer.write(`]); \n\n`);

writer.write(`export const shortToLongPropertyNameMap = new Map<string, string>([ \n`);
shortToLongPropertyNameMap.forEach((value, key) => {
    writer.write(`    ["${key}", "${value}"], \n`);
});
writer.write(`]); \n\n`);

writer.write(`export const shortToLongPropertyValueMap = new Map<string, string[]>([ \n`);
shortToLongPropertyValueMap.forEach((value, key) => {
    writer.write(`    ["${key}", [${value.join(", ")}]], \n`);
});
writer.write(`]); \n\n`);

writer.close();

console.log("\nUnicode data generation completed.\n");
