#!/usr/bin/env node

/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import * as nodeFs from "fs";
import { createFsFromVolume, Volume } from "memfs";

import { resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Tool } from "../src/Tool.js";
import {
    copyFolderFromMemFs, copyFolderToMemFs, copyImportedGrammarsToMemFs, dirname
} from "../src/support/fs-helpers.js";
import { parseToolParameters, useFileSystem } from "../src/tool-parameters.js";
import { defineConfig, type IToolConfiguration } from "../src/config/config.js";

// Start with a fresh virtual file system.
const volume = new Volume();
const fs = createFsFromVolume(volume);
useFileSystem(fs);

/** Load arguments and perpare the tool configuration. */
const parameters = parseToolParameters(process.argv.slice(2));
let configuration: IToolConfiguration;

if (parameters.config) {
    // import() takes a URL and resolves a relative specifier against this module, not the working directory.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { default: config } = await import(pathToFileURL(resolve(parameters.config)).href);
    configuration = config as IToolConfiguration;
} else {
    configuration = defineConfig({
        grammarFiles: parameters.grammarFiles,
        lib: parameters.lib,
        generationOptions: {
            atn: parameters.atn,
            outputDirectory: parameters.outputDirectory,
            generateListener: parameters.generateListener,
            generateVisitor: parameters.generateVisitor,
            package: parameters.package,
            generateDependencies: parameters.generateDependencies,
        },
        messageFormatOptions: {
            longMessages: parameters.longMessages,
            warningsAreErrors: parameters.warningsAreErrors,
        },

        forceAtn: parameters.forceAtn,
        log: parameters.log,
    });
}

// Provide the templates in the virtual file system.
fs.mkdirSync("/templates", { recursive: true });
copyFolderToMemFs(fs, fileURLToPath(dirname(import.meta.url) + "/../templates"), "/templates", true);

// Copy all files to the memfs file system. We use the same files for all files. It doesn't matter for memfs.
if (configuration.lib) {
    fs.mkdirSync(configuration.lib, { recursive: true });
    copyFolderToMemFs(fs, configuration.lib, configuration.lib, false);
}

// Also copy the grammar and token files.
for (const grammarFile of configuration.grammarFiles) {
    const parentDir = dirname(grammarFile);

    fs.mkdirSync(parentDir, { recursive: true });
    copyFolderToMemFs(fs, parentDir, parentDir, false, /\.g4/);
    copyFolderToMemFs(fs, parentDir, parentDir, false, /\.tokens/);

    // Grammars imported by path can be anywhere.
    copyImportedGrammarsToMemFs(fs, grammarFile);
}

// The log file is written to the current directory of the virtual file system.
if (configuration.log) {
    fs.mkdirSync(".", { recursive: true });
}

const tool = new Tool();
const success = tool.generate(configuration);

if (configuration.log) {
    copyFolderFromMemFs(fs, ".", ".", false, /^antlr-ng-\d+\.log$/);
}

if (!success) {
    process.exit(1);
}

// Copy the generated files to the physical output directory.
nodeFs.mkdirSync(configuration.generationOptions.outputDirectory, { recursive: true });
copyFolderFromMemFs(fs, configuration.generationOptions.outputDirectory,
    configuration.generationOptions.outputDirectory, false);

process.exit(0);
