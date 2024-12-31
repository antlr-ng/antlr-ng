/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
*/

// cspell: ignore inpc, insc

/**
 * This class extracts necessary Unicode data from the Unicode database and generates a TypeScript file
 * with that data. The file is then used by the ANTLR tool to support Unicode properties and categories.
 */

import { createWriteStream } from "fs";
import { readdir, readFile, stat } from "fs/promises";
import { dirname, join } from "path";

import { IntervalSet } from "antlr4ng";

interface IUnicodeRange {
    begin: number;
    end: number;
    length: number;
}

interface IDataFileContent {
    default: IUnicodeRange[];
}

const packageName = "@unicode/unicode-16.0.0";
const sourceURL = join(dirname(import.meta.url), `../node_modules/${packageName}`).substring("file:".length);

const propertyAliases = new Map<string, string[]>();
const shortToLongPropertyNameMap = new Map<string, string>();
const shortToLongPropertyValueMap = new Map<string, string[]>();

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
    let propertyAliasesContent = await readFile(join(dirname(import.meta.url)
        .substring("file:".length), "PropertyValueAliases.txt"), "utf8");

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

            if (parts[0].trim() !== "gc") {
                // Ignore binary properties, which can only be switched on or off (indicated by true/false and their
                // aliases). But add a lookup entry for them.
                if (parts[1].trim().toLowerCase() === "n" || parts[1].trim().toLowerCase() === "y") {
                    addBinaryPropertyEntry = true;
                    continue;
                }
            }

            // Canonical_Combining_Class is a special cases. It has an additional field in the second position,
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
            const list = propertyAliases.get(longName) ?? [];
            list.push(`"binary_property=${longName}"`);
            propertyAliases.set(longName, list);
        }
    }
};

// Generate the Unicode data file.
const targetPath = join(dirname(import.meta.url), "../src/generated/UnicodeData.ts").substring("file:".length);
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
    const folderURL = join(sourceURL, basePath);
    const elements = await readdir(folderURL);
    for (const element of elements) {
        // Is the element a folder?
        const target = join(folderURL, element);
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

    const folderURL = join(sourceURL, "Block");
    const elements = await readdir(folderURL);

    const ranges = new Map<string, string>();
    const nameMap = new Map<string, string>();

    writer.write(`export class UnicodeBlockConstants {\n`);
    for (let i = 0; i < elements.length; ++i) {
        const element = elements[i];

        const target = join(folderURL, element);
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

// Finally add the aliases.
writer.write(`export const propertyAliases = new Map<string, string[]>([ \n`);
await loadPropertyAliases();
propertyAliases.forEach((value, key) => {
    writer.write(`    ["${key}", [${value.join(", ")}]], \n`);
});
writer.write(`]); \n`);

writer.write(`export const shortToLongPropertyNameMap = new Map<string, string>([ \n`);
shortToLongPropertyNameMap.forEach((value, key) => {
    writer.write(`    ["${key}", "${value}"], \n`);
});
writer.write(`]); \n`);

writer.write(`export const shortToLongPropertyValueMap = new Map<string, string[]>([ \n`);
shortToLongPropertyValueMap.forEach((value, key) => {
    writer.write(`    ["${key}", [${value.join(", ")}]], \n`);
});
writer.write(`]); \n`);

writer.close();

console.log("\nUnicode data generation completed.\n");
