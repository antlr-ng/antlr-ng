/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ITargetGenerator } from "src/codegen/ITargetGenerator.js";

/** Options which control the output of code and support files. */
export interface IGenerationOptions {
    /** Generate augmented transition network diagrams. (default: false) */
    atn?: boolean,

    /** Generate a parse tree listener (default: false). */
    generateListener?: boolean,

    /** Generate a parse tree visitor (default: false). */
    generateVisitor?: boolean,

    /** Generate an interpreter data file (*.interp, default: false). */
    generateInterpreterData?: boolean;

    /** Set this to true to generate a declaration file (header file etc.). */
    generateDeclarationFile?: boolean,

    generateBaseListener?: boolean,
    generateBaseVisitor?: boolean,

    /** Specify a package/namespace for the generated code. */
    package?: string,

    /** Generate a diagram of grammar dependencies. (default: false). */
    generateDependencies?: boolean,
}

/** A configuration for the antlr-ng tool. */
export interface IToolConfiguration {
    /**
     * A list of grammar files as input for the tool. Only list files that belong together (e.g. a lexer and
     * a parser grammar. Relative paths are resolved to the current working directory.
     */
    grammarFiles: string[];

    /** The output directory for the generated files. Relative paths are resolved to the current working directory. */
    outputDirectory: string,

    /**
     * @deprecated This will be removed when grammar imports can take paths.
     *
     * Specify location of grammars, tokens files. Relative paths are resolved to the current working directory.
     */
    lib: string,

    /** Show exception details when available for errors and warnings. (default: false) */
    longMessages: boolean;

    /** Treat warnings as errors. (default: false) */
    warningsAreErrors: boolean,

    /** Use the ATN simulator for all predictions. (default: false) */
    forceAtn: boolean,

    /** Dump lots of logging info to antlrng-{timestamp}.log. (default: false) */
    log: boolean,

    /** This field defines the configuration of output generators. */
    generators: ITargetGenerator[],

    generationOptions: IGenerationOptions;
}

/**
 * Used to defined a user configuration for antlr-ng. Input values are evaluated and completed with default values.
 *
 * @param config The user configuration.
 *
 * @returns The final configuration.
 */
export const defineConfig = (config: Partial<IToolConfiguration>): IToolConfiguration => {
    const options = config.generationOptions ?? {};
    options.atn ??= false;
    options.generateListener ??= false;
    options.generateVisitor ??= false;
    options.generateInterpreterData ??= false;
    options.package ??= "";
    options.generateDependencies ??= false;
    options.generateDeclarationFile ??= false;
    options.generateBaseListener ??= false;
    options.generateBaseVisitor ??= false;

    return {
        grammarFiles: config.grammarFiles ?? [],
        outputDirectory: config.outputDirectory ?? ".",
        lib: config.lib ?? ".",
        longMessages: config.longMessages ?? false,
        warningsAreErrors: config.warningsAreErrors ?? false,
        forceAtn: config.forceAtn ?? false,
        log: config.log ?? false,
        generators: config.generators ?? [],
        generationOptions: options,
    };
};
