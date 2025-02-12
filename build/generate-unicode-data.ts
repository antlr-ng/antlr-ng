/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore inpc, insc

/**
 * This script extracts necessary Unicode data from the Unicode database and generates a TypeScript file
 * with that data. The file is then used by the antlr-ng tool to support Unicode properties and categories.
 */

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { UnicodeGenerator } from "./UnicodeGenerator.js";

const packageName = "@unicode/unicode-16.0.0";

console.log("\x1b[1m\x1b[34mGenerating Unicode data...\x1b[0m\n");

const sourcePath = fileURLToPath(dirname(import.meta.url));
console.log("Source path: " + sourcePath);

const dataPath = join(sourcePath, `../node_modules/${packageName}/`);
console.log("Data path: " + dataPath + "\n");
const targetPath = pathToFileURL(join(sourcePath, "../src/generated/UnicodeData.ts"));

console.log(`Writing Unicode data to ${targetPath}...\n`);

const generator = new UnicodeGenerator(sourcePath, dataPath, targetPath);
generator.writeHeading();
await generator.loadPropertyAliases();
await generator.generateBlocksMap();
await generator.writeValueMaps();
await generator.writeGraphemeClusterBreaksData();
generator.writeEmojiPresentationData();
await generator.writeEastAsianWidthData();
await generator.writeSentenceBreaksData();
generator.writeLookupTables();
generator.finish();

console.log("\nUnicode data generation completed.\n");
