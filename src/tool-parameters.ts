/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Command, Option } from "commander";

export interface IToolParameters {
    /** The grammar files. */
    args: string[];

    define?: Record<string, string>,

    outputDirectory?: string,
    lib?: string,
    atn?: boolean,
    encoding?: string,
    msgFormat?: string,
    longMessages?: boolean;
    generateListener?: boolean,
    generateVisitor?: boolean,
    package?: string,
    generateDependencies?: boolean,
    warningsAreErrors?: boolean,
    forceAtn?: boolean,
    log?: boolean,
    exactOutputDir?: boolean,
}

/**
 * Searches the package.json file in the same folder as this script or any parent folder (up to
 * a node_modules folder).
 *
 * @returns The version of the package.
 */
const getPackageVersion = async (): Promise<string> => {
    const findPackageJson = async (path: string): Promise<string> => {
        const packageFile = resolve(path, "package.json");

        try {
            await readFile(pathToFileURL(packageFile));

            return packageFile;
        } catch {
            const parent = dirname(path);

            if (parent.endsWith("node_modules")) {
                throw new Error("No package.json found.");
            }

            return findPackageJson(parent);
        }
    };

    const dirName = fileURLToPath(dirname(import.meta.url));
    const packageFile = await findPackageJson(dirName);
    const packageJson = JSON.parse(await readFile(pathToFileURL(packageFile), "utf-8")) as { version: string; };

    return packageJson.version;
};

export const antlrVersion = await getPackageVersion();

/**
 * Used to parse tool parameters given as string list. Usually, this is used for tests.
 *
 * @param args The list of arguments.
 *
 * @returns The parsed tool parameters.
 */
export const parseToolParameters = (args: string[]): IToolParameters => {
    const parseBoolean = (value: string | null): boolean => {
        if (value == null) {
            return false;
        }

        const lower = value.trim().toLowerCase();

        return lower === "true" || lower === "1" || lower === "on" || lower === "yes";
    };

    const defines: Record<string, string> = {};

    const parseKeyValuePair = (input: string): Record<string, string> => {
        const [key, value] = input.split("=");
        defines[key] = value;

        return defines;
    };

    const prepared = new Command()
        .option("-o, --output-directory <path>", "specify output directory where all output is generated")
        .option("--lib <path>", "specify location of grammars, tokens files")
        .option<boolean>("--atn [boolean]", "Generate rule augmented transition network diagrams.", parseBoolean, false)
        .option("-e, --encoding <string>", "Specify grammar file encoding; e.g., ucs-2.", "utf-8")
        .addOption(new Option("--message-format[string]", "Specify output style for messages in antlr, gnu, " +
            "vs2005.")
            .choices(["antlr", "gnu", "vs2005"]).default("antlr"))
        .option<boolean>("--long-messages [boolean]",
            "Show exception details when available for errors and warnings.", parseBoolean, false)
        .option<boolean>("-l, --generate-listener [boolean]", "Generate parse tree listener.", parseBoolean, true)
        .option<boolean>("-v, --generate-visitor [boolean]", "Generate parse tree visitor.", parseBoolean, false)
        .option("-p, --package <name>", "Specify a package/namespace for the generated code.")
        .option<boolean>("-d, --generate-dependencies [boolean]", "Generate file dependencies.", parseBoolean, false)
        .option("-D, --define <key=value...>", "Set/override a grammar-level option.", parseKeyValuePair)
        .option<boolean>("-w, --warnings-are-errors [boolean]", "Treat warnings as errors.", parseBoolean, false)
        .option<boolean>("-f, --force-atn [boolean]", "Use the ATN simulator for all predictions.", parseBoolean, false)
        .option<boolean>("--log [boolean]", "Dump lots of logging info to antlrng-timestamp.log.", parseBoolean, false)
        .option<boolean>("--exact-output-dir [boolean]", "All output goes into -o dir regardless of paths/package",
            parseBoolean, false)
        .argument("<grammar...>", "A list of grammar files.")
        .version(`ANTLRng ${antlrVersion}`);

    prepared.parse(args, { from: "user" });

    const result = prepared.opts<IToolParameters>();

    result.args = prepared.args;

    return result;
};
