/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { createWriteStream, type WriteStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { IntervalSet } from "antlr4ng";

interface IUnicodeRange {
    begin: number;
    end: number;
    length: number;
}

interface IDataFileContent {
    default: IUnicodeRange[];
}

/**
 * This class loads the various data files and generates a UnicodeData.ts file from them.
 */
export class UnicodeGenerator {
    private readonly propertyAliases = new Map<string, string[]>();
    private readonly shortToLongPropertyNameMap = new Map<string, string>();
    private readonly shortToLongPropertyValueMap = new Map<string, string[]>();
    private readonly binaryPropertyNames = new Set<string>();

    private writer: WriteStream;

    public constructor(
        private sourcePath: string, // The path for the UCD data files.
        private dataPath: string,   // The path for the Unicode node package.
        private targetPath: URL  // The path for the target file.
    ) {
        this.writer = createWriteStream(this.targetPath);
    }

    /**
     * Loads the property aliases file and extracts all relevant parts.
     *
     * @returns A promise which resolves when loading is done.
     */
    public async loadPropertyAliases(): Promise<void> {
        const aliasesURL = pathToFileURL(join(this.sourcePath, "PropertyValueAliases.txt"));
        console.log(`\nLoading property aliases from ${aliasesURL}...`);
        let propertyAliasesContent = await readFile(aliasesURL, "utf8");

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
                this.shortToLongPropertyNameMap.set(shortName, longName);
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
                    let list = this.shortToLongPropertyValueMap.get(abbr) ?? [];
                    list.push(`"${longName}=${full}"`);
                    this.shortToLongPropertyValueMap.set(abbr, list);

                    list = this.propertyAliases.get(abbr) ?? [];
                    list.push(`"${longName}=${full}"`);
                    this.propertyAliases.set(abbr, list);
                }

                const list = this.propertyAliases.get(full) ?? [];
                list.push(`"${longName}=${full}"`);
                this.propertyAliases.set(full, list);
            }

            if (addBinaryPropertyEntry) {
                this.binaryPropertyNames.add(longName);

                const list = this.propertyAliases.get(longName) ?? [];
                list.push(`"binary_property=${longName}"`);
                this.propertyAliases.set(longName, list);
            }
        }
    };

    public writeHeading(): void {
        this.writer.write("// Data generated by build/generate-unicode-data.ts. Do not edit.\n\n");
        this.writer.write("/* eslint-disable */\n\n");
        this.writer.write("/* cspell: disable */\n\n");
        this.writer.write(`import { IntervalSet } from "antlr4ng";\n\n`);
        this.writer.write(`/** A mapping from a Unicode property type to a set of code points. */\n`);
        this.writer.write(`export const propertyCodePointRanges = new Map<string, IntervalSet>();\n\n`);
    }

    public async generateBlocksMap(): Promise<void> {
        const folderPath = join(this.dataPath, "Block");
        const folderURL = pathToFileURL(folderPath);
        const elements = await readdir(folderURL);

        const ranges = new Map<string, string>();
        const nameMap = new Map<string, string>();

        this.writer.write(`export class UnicodeBlockConstants {\n`);
        for (let i = 0; i < elements.length; ++i) {
            const element = elements[i];

            const target = pathToFileURL(join(folderPath, element));
            const s = await stat(target);
            if (!s.isDirectory() || element === "undefined") {
                continue;
            }

            this.writer.write(`    public static ${element.toUpperCase()} = ${i};\n`);

            // Block ranges always contain only one entry.
            const content = await import(`${target}/ranges.js`) as IDataFileContent;

            ranges.set(`UnicodeBlockConstants.${element.toUpperCase()}`,
                `[0x${this.numberToHex(content.default[0].begin)}, ` +
                `0x${this.numberToHex(content.default[0].end)}]`);
            nameMap.set(element, `UnicodeBlockConstants.${element.toUpperCase()}`);
        }

        // Write collected maps.
        this.writer.write(`\n    public static readonly ranges = new Map<number, [number, number]>([\n`);
        for (const [key, value] of ranges) {
            this.writer.write(`        [${key}, ${value}], \n`);
        }
        this.writer.write(`    ]); \n`);

        this.writer.write(`\n    public static readonly names = new Map<string, number>([\n`);
        for (const [key, value] of nameMap) {
            this.writer.write(`        ["${key.replace(/_/g, "").toLowerCase()}", ${value}], \n`);
        }

        this.writer.write("    ]);\n\n}\n\n");
    };

    public async writeValueMaps(): Promise<void> {
        console.log("\nGenerating value maps...\n");
        this.writer.write(`let set: IntervalSet; \n\n`);

        await this.generateMap("Bidi_Class");
        await this.generateMap("Binary_Property");
        await this.generateMap("Block");
        await this.generateMap("General_Category");
        await this.generateMap("Line_Break");
        await this.generateMap("Script");
        await this.generateMap("Script_Extensions");
        await this.generateMap("Word_Break");
    }

    /**
     * Loades the grapheme cluster break data from the Unicode database and writes it to the generated file.
     */
    public async writeGraphemeClusterBreaksData(): Promise<void> {
        const clusterDataURL = pathToFileURL(join(this.sourcePath, "GraphemeBreakProperty.txt"));
        console.log(`\nProcessing grapheme cluster breaks data from ${clusterDataURL}...`);

        const parts = await this.loadRangesFromFile(clusterDataURL);

        // Write the collected data to the generated file.
        for (const [key, value] of parts) {
            this.writer.write("set = new IntervalSet();\n");

            let counter = 0;
            for (const range of value) {
                this.writer.write(`set.addRange(${range}); `);
                ++counter;
                if (counter === 5) {
                    this.writer.write("\n");
                    counter = 0;
                }
            }

            if (counter > 0) {
                this.writer.write("\n");
            }

            this.writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=${key.toLowerCase()}", set);\n\n`);
        }

        // Some propertie values are listed in the PropertyValues.txt file, but not in the GraphemeBreakProperty.txt
        // file. These are added manually here, with empty sets.
        this.writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=e_base", new IntervalSet());\n`);
        this.writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=e_base_gaz", new IntervalSet());\n`);
        this.writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=e_modifier", new IntervalSet());\n`);
        this.writer.write(`propertyCodePointRanges.set("grapheme_cluster_break=glue_after_zwj", ` +
            `new IntervalSet());\n\n`);
    };

    /**
     * Writes the data for emoji presentation selectors derived from other properties.
     */
    public writeEmojiPresentationData(): void {
        this.writer.write(`const emojis = propertyCodePointRanges.get("binary_property=emoji")!;\n`);
        this.writer.write(`const emojiPresentation = propertyCodePointRanges.get("binary_property=` +
            `emoji_presentation")!;\n`);
        this.writer.write(`set = emojis.and(emojiPresentation);\n`);
        this.writer.write(`propertyCodePointRanges.set("emojipresentation=emojidefault", set);\n\n`);

        this.writer.write(`set = emojis.subtract(emojiPresentation);\n`);
        this.writer.write(`propertyCodePointRanges.set("emojipresentation=textdefault", set);\n\n`);

        this.writer.write(`const fullSet = IntervalSet.of(0, 0x10FFFF);\n`);
        this.writer.write(`set = fullSet.subtract(emojis);\n`);
        this.writer.write(`propertyCodePointRanges.set("emojipresentation=text", set);\n\n`);
    }

    /**
     * Loads the East Asian width data from the Unicode database and writes it to the generated file.
     */
    public async writeEastAsianWidthData(): Promise<void> {
        const eawDataURL = pathToFileURL(join(this.sourcePath, "EastAsianWidth.txt"));
        console.log(`\nProcessing east asian width data from ${eawDataURL}...`);

        const parts = await this.loadRangesFromFile(eawDataURL);

        // Write the collected data to the generated file.
        for (const [key, value] of parts) {
            this.writer.write("set = new IntervalSet();\n");

            let counter = 0;
            for (const range of value) {
                this.writer.write(`set.addRange(${range}); `);
                ++counter;
                if (counter === 5) {
                    this.writer.write("\n");
                    counter = 0;
                }
            }

            if (counter > 0) {
                this.writer.write("\n");
            }

            // The east asian width file uses the short property name form, so we need to map it to the long form.
            // There can be multiple entries for a short form. Pick the one for the east asian width.
            const longNames = this.shortToLongPropertyValueMap.get(key.toLowerCase())!;
            const longName = longNames.find((name) => {
                return name.startsWith("\"east_asian_width=");
            });

            this.writer.write(`propertyCodePointRanges.set(${longName}, set);\n\n`);
        }

    }

    /**
     * Loades the sentence break data from the Unicode database and writes it to the generated file.
     */
    public async writeSentenceBreaksData(): Promise<void> {
        const sentenceBreakDataURL = pathToFileURL(join(this.sourcePath, "SentenceBreakProperty.txt"));
        console.log(`\nProcessing sentence break data from ${sentenceBreakDataURL}...`);

        const parts = await this.loadRangesFromFile(sentenceBreakDataURL);

        // Write the collected data to the generated file.
        for (const [key, value] of parts) {
            this.writer.write("set = new IntervalSet();\n");

            let counter = 0;
            for (const range of value) {
                this.writer.write(`set.addRange(${range}); `);
                ++counter;
                if (counter === 5) {
                    this.writer.write("\n");
                    counter = 0;
                }
            }

            if (counter > 0) {
                this.writer.write("\n");
            }

            this.writer.write(`propertyCodePointRanges.set("sentence_break=${key.toLowerCase()}", set);\n\n`);
        }
    };

    public writeLookupTables(): void {
        this.writer.write(`export const binaryPropertyNames = new Set<string>([ \n`);
        this.binaryPropertyNames.forEach((value) => {
            this.writer.write(`    "${value}", \n`);
        });
        this.writer.write(`]); \n\n`);

        this.writer.write(`export const propertyAliases = new Map<string, string[]>([ \n`);
        this.propertyAliases.forEach((value, key) => {
            this.writer.write(`    ["${key}", [${value.join(", ")}]], \n`);
        });
        this.writer.write(`]); \n\n`);

        this.writer.write(`export const shortToLongPropertyNameMap = new Map<string, string>([ \n`);
        this.shortToLongPropertyNameMap.forEach((value, key) => {
            this.writer.write(`    ["${key}", "${value}"], \n`);
        });
        this.writer.write(`]); \n\n`);

        this.writer.write(`export const shortToLongPropertyValueMap = new Map<string, string[]>([ \n`);
        this.shortToLongPropertyValueMap.forEach((value, key) => {
            this.writer.write(`    ["${key}", [${value.join(", ")}]], \n`);
        });
        this.writer.write(`]); \n\n`);
    }

    public finish() {
        this.writer.close();
    }

    private async generateMap(basePath: string, alias?: string): Promise<void> {
        console.log(`Generating map for ${basePath}...`);

        const name = basePath.toLocaleLowerCase();
        const fullPropertyName = alias ?? name;

        // Enumerate all folders in the base path.
        const folderPath = join(this.dataPath, basePath);
        const elements = await readdir(pathToFileURL(folderPath));
        for (const element of elements) {
            // Is the element a folder?
            const target = pathToFileURL(join(folderPath, element));
            const s = await stat(target);
            if (!s.isDirectory()) {
                continue;
            }

            this.writer.write(`set = new IntervalSet();\n`);
            const set = await this.intervalSetFromImport(`${target}/ranges.js`);
            let counter = 0;
            for (const range of set) {
                this.writer.write(`set.addRange(0x${this.numberToHex(range.start)}, ` +
                    `0x${this.numberToHex(range.stop)}); `);
                ++counter;
                if (counter === 5) {
                    this.writer.write("\n");
                    counter = 0;
                }
            }

            if (counter > 0) {
                this.writer.write("\n");
            }

            const elementName = element.toLocaleLowerCase();
            this.writer.write(`propertyCodePointRanges.set("${fullPropertyName}=${elementName}", set);\n\n`);
        }
    };

    private numberToHex(value: number): string {
        return value.toString(16).toUpperCase();
    };

    /**
     * Imports the given unicode data file and creates an interval set from it, by collecting all contained ranges.
     *
     * @param file The file to import.
     *
     * @returns An interval set containing all ranges from the imported file.
     */
    private async intervalSetFromImport(file: string): Promise<IntervalSet> {
        const content = await import(file) as IDataFileContent;
        const set = new IntervalSet();
        for (const range of content.default) {
            set.addRange(range.begin, range.end - 1);
        }

        return set;
    };

    private async loadRangesFromFile(file: URL): Promise<Map<string, string[]>> {
        const fileData = await readFile(file, "utf8");
        const lines = fileData.split("\n").filter((line) => {
            return line.length > 0 && !line.startsWith("#");
        });

        const parts = new Map<string, string[]>();
        for (const line of lines) {
            const [interval, group] = line.split(";");

            // The interval can be a single hex value or a range (e.g. "1F1E6..1F1FF").
            // The group part may contain a comment, which we ignore.
            let key = group;
            const commentStart = group.indexOf("#");
            if (commentStart >= 0) {
                key = group.substring(0, commentStart).trim();
            }

            let list = parts.get(key);
            if (!list) {
                list = [];
                parts.set(key, list);
            }

            const range = interval.split("..");
            if (range.length === 1) {
                list.push(`0x${range[0].trim()}, 0x${range[0].trim()}`);
            } else {
                list.push(`0x${range[0].trim()}, 0x${range[1].trim()}`);
            }
        }

        return parts;
    }
}
