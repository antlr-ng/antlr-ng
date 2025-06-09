/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ITargetGenerator } from "src/codegen/ITargetGenerator.js";

/** Options which control the output of code and support files. */
export interface IGenerationOptions {
    /** Generate augmented transition network diagrams. (default: false) */
    atn: boolean,

    /** Generate a parse tree listener (default: false). */
    generateListener: boolean,

    /** Generate a parse tree visitor (default: false). */
    generateVisitor: boolean,

    /** Generate an interpreter data file (*.interp, default: false). */
    generateInterpreterData: boolean;

    /** Set this to true to generate a declaration file (header file etc.). */
    generateDeclarationFile: boolean,

    /** Generate a base listener class (default: false). */
    generateBaseListener: boolean,

    /** Generate a base visitor class (default: false). */
    generateBaseVisitor: boolean,

    /** Specify a package/namespace for the generated code. */
    package: string,

    /** Generate a diagram of grammar dependencies. (default: false). */
    generateDependencies: boolean,
}

/** Settings which determine the format of tool messages and related aspects. */
export interface IToolMessageOptions {
    /** Treat warnings as errors. (default: false) */
    warningsAreErrors: boolean,

    /** Show exception details when available for errors and warnings. (default: false) */
    longMessages: boolean;

    /**
     * How to format code location information. Placeholders in angles are replace with the corresponding values.
     * Default: "<file>:<line>:<column>:".
     */
    locationFormat: string,

    /**
     * How to format the message. Placeholders in angles are replaced with the corresponding values.
     * Default: "<severity>(<issueCode>): <location> <message>".
     */
    messageFormat: string,

    /** Print the entire message on a single line, if true (default: true). */
    singleLine: boolean,
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

    /** Configuration for tool messages. */
    messageFormatOptions: IToolMessageOptions,

    /** Use the ATN simulator for all predictions. (default: false) */
    forceAtn: boolean,

    /** Dump lots of logging info to antlrng-{timestamp}.log. (default: false) */
    log: boolean,

    /** This field defines the configuration of output generators. */
    generators: ITargetGenerator[],

    generationOptions: IGenerationOptions;
}

/**
 * Used to define a full tool configuration for antlr-ng. Input values are evaluated and completed with default values.
 *
 * @param config The configuration to check and complete.
 *
 * @returns The final configuration.
 */
export const defineConfig = (config: DeepPartial<IToolConfiguration>): IToolConfiguration => {
    const generationOptions: Partial<IGenerationOptions> = config.generationOptions ?? {};
    generationOptions.atn ??= false;
    generationOptions.generateListener ??= false;
    generationOptions.generateVisitor ??= false;
    generationOptions.generateInterpreterData ??= false;
    generationOptions.package ??= "";
    generationOptions.generateDependencies ??= false;
    generationOptions.generateDeclarationFile ??= false;
    generationOptions.generateBaseListener ??= false;
    generationOptions.generateBaseVisitor ??= false;

    const messageFormatOptions: Partial<IToolMessageOptions> = config.messageFormatOptions ?? {};
    messageFormatOptions.longMessages ??= false;
    messageFormatOptions.warningsAreErrors ??= false;
    messageFormatOptions.locationFormat ??= "<file>:<line>:<column>:";
    messageFormatOptions.messageFormat ??= "<severity>(<issueCode>): <location> <message>";
    messageFormatOptions.singleLine ??= true;

    return {
        grammarFiles: config.grammarFiles ?? [],
        outputDirectory: config.outputDirectory ?? ".",
        lib: config.lib ?? ".",
        messageFormatOptions: messageFormatOptions as IToolMessageOptions,
        forceAtn: config.forceAtn ?? false,
        log: config.log ?? false,
        generators: (config.generators ?? []) as ITargetGenerator[],
        generationOptions: generationOptions as IGenerationOptions,
    };
};

/** Make all entries and their children (recursively) in type T partial (except array members). */
export type DeepPartial<T> = T extends Array<infer U>
    ? Array<U extends object ? DeepPartial<U> : U>
    : T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
