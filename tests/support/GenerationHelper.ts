/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { join } from "node:path";

import { ATNPrinter } from "../../src/automata/ATNPrinter.js";
import { LexerATNFactory } from "../../src/automata/LexerATNFactory.js";
import { defineConfig, type IGenerationOptions, type IToolConfiguration } from "../../src/config/config.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { generateRandomFilename } from "../../src/support/fs-helpers.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar, Tool } from "../../src/tool/index.js";
import { ErrorQueue } from "./ErrorQueue.js";

/** The outcome of a full tool run on one or more grammars. */
export interface IGenerationResult {
    /** All issues reported during the run. */
    queue: ErrorQueue;

    /** All generated files, keyed by their base name (e.g. "TParser.ts"). */
    files: Map<string, string>;

    /** The number of errors. */
    errorCount: number;

    /** The return value of `Tool.generate`. */
    success: boolean;
}

/** A single grammar to process, given as file name and content. */
export interface IGrammarSource {
    name: string;
    content: string;
}

export const tsGenerator = new TypeScriptTargetGenerator(false);
tsGenerator.setUp();

/**
 * Creates a tool configuration which does not generate anything (used for ATN construction tests).
 *
 * @returns A configuration with the TypeScript generator.
 */
export const dummyConfiguration = (): IToolConfiguration => {
    return defineConfig({
        grammarFiles: [],
        generators: [tsGenerator],
        generationOptions: { outputDirectory: "/tmp" },
    });
};

/**
 * Determines the file name for a grammar from its header line.
 *
 * @param grammar The grammar text.
 *
 * @returns The file name (grammar name + .g4).
 */
export const nameFromGrammar = (grammar: string): string => {
    const match = /^\s*(?:lexer\s+|parser\s+)?grammar\s+(\w+)\s*;/m.exec(grammar);

    return (match?.[1] ?? "A") + ".g4";
};

/**
 * Runs the complete tool pipeline (parse, transform, semantics, ATN, analysis, code generation) on the given
 * grammars using the TypeScript target. Everything happens in a unique directory of the virtual file system.
 *
 * @param grammars The grammars to process (in the order they should be processed).
 * @param options Optional generation options (output directory and generators are always set by this helper).
 * @param configure Optional callback to further tweak the configuration.
 *
 * @returns The collected issues and all generated files.
 */
export const generate = (grammars: IGrammarSource[] | string, options?: Partial<IGenerationOptions>,
    configure?: (config: IToolConfiguration) => void): IGenerationResult => {
    const sources = typeof grammars === "string" ? [{ name: nameFromGrammar(grammars), content: grammars }] : grammars;

    const workDir = generateRandomFilename("/tmp/coverage-");
    fileSystem.mkdirSync(workDir, { recursive: true });

    try {
        const grammarFiles: string[] = [];
        for (const source of sources) {
            const path = join(workDir, source.name);
            fileSystem.writeFileSync(path, source.content);
            grammarFiles.push(path);
        }

        const config = defineConfig({
            grammarFiles,
            lib: workDir,
            generationOptions: {
                ...options,
                outputDirectory: workDir,
            },
            generators: [tsGenerator],
        });
        configure?.(config);

        const tool = new Tool();
        const queue = new ErrorQueue(tool.errorManager);
        tool.errorManager.addListener(queue);
        const success = tool.generate(config);

        const files = new Map<string, string>();
        const entries = fileSystem.readdirSync(workDir, "utf-8") as string[];
        for (const entry of entries) {
            const fullPath = join(workDir, entry);
            if (fileSystem.statSync(fullPath).isFile()) {
                files.set(entry, fileSystem.readFileSync(fullPath, "utf8") as string);
            }
        }

        return { queue, files, errorCount: tool.errorManager.errors, success };
    } finally {
        fileSystem.rmSync(workDir, { recursive: true, force: true });
    }
};

/**
 * Returns the generated parser file content for a combined/parser grammar.
 *
 * @param result The generation result.
 * @param grammarName The name of the grammar.
 *
 * @returns The content of the parser file.
 */
export const parserOf = (result: IGenerationResult, grammarName: string): string => {
    const content = result.files.get(`${grammarName}Parser.ts`) ?? result.files.get(`${grammarName}.ts`);
    if (content === undefined) {
        throw new Error(`No parser generated for ${grammarName}. Files: ${[...result.files.keys()].join(", ")}; ` +
            `issues: ${result.queue.toString(true)}`);
    }

    return content;
};

/**
 * Returns the generated lexer file content for a combined/lexer grammar.
 *
 * @param result The generation result.
 * @param grammarName The name of the grammar.
 *
 * @returns The content of the lexer file.
 */
export const lexerOf = (result: IGenerationResult, grammarName: string): string => {
    const content = result.files.get(`${grammarName}Lexer.ts`) ?? result.files.get(`${grammarName}.ts`);
    if (content === undefined) {
        throw new Error(`No lexer generated for ${grammarName}. Files: ${[...result.files.keys()].join(", ")}; ` +
            `issues: ${result.queue.toString(true)}`);
    }

    return content;
};

/**
 * Processes a parser grammar (without code generation) and renders the ATN of one rule.
 *
 * @param text The grammar text.
 * @param ruleName The rule whose ATN should be rendered.
 *
 * @returns The ATN in the format of the ATNPrinter.
 */
export const parserRuleATN = (text: string, ruleName: string): string => {
    const g = new Grammar(text);
    g.tool.process(g, dummyConfiguration(), false);

    const rule = g.getRule(ruleName);
    if (!rule) {
        throw new Error(`No rule ${ruleName} in grammar ${g.name}`);
    }

    const startState = g.getATN().ruleToStartState[rule.index]!;

    return new ATNPrinter(g, startState).asString();
};

/**
 * Processes a lexer grammar and renders the ATN of one lexer mode.
 *
 * @param text The grammar text.
 * @param modeName The mode to render.
 *
 * @returns The ATN in the format of the ATNPrinter and the issues reported during processing.
 */
export const lexerModeATN = (text: string, modeName = "DEFAULT_MODE"): { atn: string, queue: ErrorQueue; } => {
    const g = new LexerGrammar(text);
    const queue = new ErrorQueue(g.tool.errorManager);
    g.tool.errorManager.addListener(queue);
    g.tool.process(g, dummyConfiguration(), false);

    const factory = new LexerATNFactory(g, tsGenerator);
    const atn = factory.createATN();
    const startState = atn.modeNameToStartState.get(modeName);
    if (!startState) {
        throw new Error(`No mode ${modeName} in grammar ${g.name}`);
    }

    return { atn: new ATNPrinter(g, startState).asString(), queue };
};
