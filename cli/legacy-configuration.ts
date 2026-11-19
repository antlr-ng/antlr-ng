/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ITargetGenerator } from "../src/codegen/ITargetGenerator.js";
import { noTargetLanguage } from "../src/codegen/TargetLanguage.js";
import { defineConfig, type IToolConfiguration } from "../src/config/config.js";
import { CppTargetGenerator } from "../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../src/default-target-generators/CSharpTargetGenerator.js";
import { DartTargetGenerator } from "../src/default-target-generators/DartTargetGenerator.js";
import { GoTargetGenerator } from "../src/default-target-generators/GoTargetGenerator.js";
import { JavaTargetGenerator } from "../src/default-target-generators/JavaTargetGenerator.js";
import { PHPTargetGenerator } from "../src/default-target-generators/PHPTargetGenerator.js";
import { Python3TargetGenerator } from "../src/default-target-generators/Python3TargetGenerator.js";
import { SwiftTargetGenerator } from "../src/default-target-generators/SwiftTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../src/default-target-generators/TypeScriptTargetGenerator.js";
import type { IToolParameters } from "../src/tool-parameters.js";

/**
 * Creates the default generators, which the legacy command line can select with `-Dlanguage`.
 *
 * @returns One instance of each default generator.
 */
const defaultGenerators = (): ITargetGenerator[] => {
    return [
        new CppTargetGenerator(), new CSharpTargetGenerator(), new DartTargetGenerator(), new GoTargetGenerator(),
        new JavaTargetGenerator(), new PHPTargetGenerator(), new Python3TargetGenerator(), new SwiftTargetGenerator(),
        new TypeScriptTargetGenerator(),
    ];
};

/**
 * Selects the default generator for a language given with `-Dlanguage`.
 *
 * @param language The language name, or undefined if not given.
 *
 * @returns The generator for the language.
 */
const selectGenerator = (language: string | undefined): ITargetGenerator => {
    const generators = defaultGenerators();

    // Without a language the TypeScript generator is used, as for grammars without a language option. For `None` a
    // generator is still needed to build the ATN, even though it generates no code.
    if (language === undefined || language === noTargetLanguage) {
        return generators.find((generator) => { return generator instanceof TypeScriptTargetGenerator; })!;
    }

    const name = language.toLowerCase();
    const generator = generators.find((generator) => {
        return generator.language.toLowerCase() === name || generator.languageSpecifiers.includes(name);
    });

    if (!generator) {
        const available = generators.map((generator) => { return generator.language; }).join(", ");

        throw new Error(`Unknown target language "${language}". Available languages: ${available}, ` +
            `${noTargetLanguage}. Use a config file for other generators.`);
    }

    return generator;
};

/**
 * @deprecated Use config files instead.
 *
 * Converts the legacy command line parameters to a tool configuration. The target generator is selected with
 * `-Dlanguage` (default: TypeScript) and all `-D` values override the grammar options.
 *
 * @param parameters The parsed command line parameters.
 *
 * @returns The tool configuration.
 *
 * @throws Error if a parameter is not supported.
 */
export const createLegacyConfiguration = (parameters: IToolParameters): IToolConfiguration => {
    // Grammar files are always read as UTF-8.
    const encoding = parameters.encoding?.toLowerCase();
    if (encoding !== undefined && encoding !== "utf-8" && encoding !== "utf8") {
        throw new Error(`Grammar files are always read as UTF-8. The encoding "${parameters.encoding}" is not ` +
            "supported.");
    }

    if (parameters.exactOutputDir !== undefined) {
        console.warn("--exact-output-dir is ignored. All generated files are written to the output directory.");
    }

    const generator = selectGenerator(parameters.define?.language);

    return defineConfig({
        grammarFiles: parameters.grammarFiles,
        lib: parameters.lib,
        generationOptions: {
            atn: parameters.atn,
            outputDirectory: parameters.outputDirectory,
            generateListener: parameters.generateListener,
            generateVisitor: parameters.generateVisitor,
            package: parameters.package,
            generateDependencies: parameters.generateDependencies,

            // Declaration files (e.g. C++ headers) were always generated for targets which use them.
            generateDeclarationFile: generator.needsDeclarationFile === true,
        },
        messageFormatOptions: {
            longMessages: parameters.longMessages,
            warningsAreErrors: parameters.warningsAreErrors,
        },

        forceAtn: parameters.forceAtn,
        log: parameters.log,
        generators: [generator],
        grammarOptions: parameters.define,
    });
};
