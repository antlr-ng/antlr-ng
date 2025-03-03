#!/usr/bin/env node

/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/*
   eslint-disable @typescript-eslint/no-unsafe-function-type,
   @typescript-eslint/no-unsafe-return
 */

import { program } from "commander";

import {
    CharStream, CommonToken, CommonTokenStream, DiagnosticErrorListener, Lexer, Parser, ParserRuleContext,
    PredictionMode, type ATNSimulator, type Recognizer
} from "antlr4ng";

import { readFile } from "fs/promises";
import { resolve } from "path";

import { parseBoolean } from "./cli-options.js";

type Constructor<T extends Recognizer<ATNSimulator>> = abstract new (...args: unknown[]) => T;

interface ModuleType<T extends Recognizer<ATNSimulator>> {
    [key: string]: unknown;
    Parser: Constructor<T>;
}

/** Allows to test for instance members (like rule methods). */
type IndexableParser = Parser & Record<string, unknown>;

/** The common form of a rule method in a parser. */
type RuleMethod = () => ParserRuleContext;

/** CLI parameters for the interpreter tool. */
interface ITestRigCliParameters {
    grammar: string,
    startRuleName: string,
    inputFiles?: string[],
    tokens?: boolean,
    tree?: boolean,
    trace?: boolean,
    diagnostics?: boolean,
    sll?: boolean,
}

program
    .argument("<grammar>", "The path of the grammar with no extension")
    .argument("<startRuleName>", "Name of the start rule")
    .option<boolean>("--tree", "Print out the parse tree", parseBoolean, false)
    .option<boolean>("--tokens", "Print out the tokens for each input symbol", parseBoolean, false)
    .option<boolean>("--trace", "Print out tracing information (rule enter/exit etc.).", parseBoolean, false)
    .option<boolean>("--diagnostics", "Print out diagnostic information", parseBoolean, false)
    .option<boolean>("--sll", "Use SLL prediction mode (instead of LL)", parseBoolean, false)
    .argument("[inputFiles...]", "Input files")
    .action((grammar, startRuleName, inputFiles, options) => {
        console.log("\nGrammar:", grammar);
        console.log("Start Rule:", startRuleName);
        console.log("Input Files:", inputFiles);
        console.log("Options: ", options);
        console.log();
    })
    .parse();

const testRigOptions = program.opts<ITestRigCliParameters>();
testRigOptions.grammar = program.args[0];
testRigOptions.startRuleName = program.args[1];
testRigOptions.inputFiles = program.args.slice(2);

/**
 * Run a lexer/parser combo, optionally printing tree string. Optionally taking input file.
 *
 *  $ java org.antlr.v4.runtime.misc.TestRig GrammarName startRuleName
 *        [-tree]
 *        [-tokens] [-gui] [-ps file.ps]
 *        [-trace]
 *        [-diagnostics]
 *        [-SLL]
 *        [input-filename(s)]
 */
export class TestRig {
    public static readonly LEXER_START_RULE_NAME = "tokens";

    public async run(): Promise<void> {
        // Try to load the lexer and parser classes.
        const lexerName = resolve(testRigOptions.grammar + "Lexer");
        const lexer = await this.loadClass(Lexer, lexerName + ".ts");

        let parser: IndexableParser | undefined;
        if (testRigOptions.startRuleName !== TestRig.LEXER_START_RULE_NAME) {
            const parserName = resolve(testRigOptions.grammar + "Parser");
            parser = await this.loadClass(Parser, parserName + ".ts");
        }

        const files = testRigOptions.inputFiles ?? [];
        for (const inputFile of files) {
            const content = await readFile(resolve(inputFile), { encoding: "utf-8" });
            const charStream = CharStream.fromString(content);
            if (files.length > 1) {
                console.log(inputFile);
            }
            this.process(charStream, lexer, parser);
        }
    }

    protected process(input: CharStream, lexer: Lexer, parser?: IndexableParser): void {
        lexer.inputStream = input;
        const tokens = new CommonTokenStream(lexer);

        tokens.fill();

        if (testRigOptions.tokens) {
            for (const tok of tokens.getTokens()) {
                if (tok instanceof CommonToken) {
                    console.log(tok.toString(lexer));
                } else {
                    console.log(tok.toString());
                }
            }
        }

        if (testRigOptions.startRuleName === TestRig.LEXER_START_RULE_NAME) {
            return;
        }

        if (!parser) {
            throw new Error("Parser is required for non-lexer start rule");
        }

        if (testRigOptions.diagnostics) {
            parser.addErrorListener(new DiagnosticErrorListener());
            parser.interpreter.predictionMode = PredictionMode.LL_EXACT_AMBIG_DETECTION;
        }

        if (testRigOptions.tree) {
            parser.buildParseTrees = true;
        }

        if (testRigOptions.sll) { // overrides diagnostics
            parser.interpreter.predictionMode = PredictionMode.SLL;
        }

        parser.tokenStream = tokens;
        parser.setTrace(testRigOptions.trace ?? false);

        let tree: ParserRuleContext | undefined;
        if (typeof parser[testRigOptions.startRuleName] === "function") {
            tree = (parser[testRigOptions.startRuleName] as RuleMethod)();
        } else {
            console.error(`Method ${testRigOptions.startRuleName} not found in the class or is not a function`);
        }

        if (testRigOptions.tree && tree) {
            console.log(tree.toStringTree(parser));
        }
    }

    private async loadClass<T extends Recognizer<ATNSimulator>>(t: Constructor<T>,
        fileName: string): Promise<T & Record<string, unknown>> {
        try {
            const module = await import(fileName) as ModuleType<T>;

            // Helper function to check if a class extends another class (directly or indirectly).
            const extendsClass = (child: Function, parent: Function): boolean => {
                let proto = child.prototype as unknown;
                while (proto) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if (proto.constructor.name === parent.prototype.constructor.name) {
                        return true;
                    }
                    proto = Object.getPrototypeOf(proto);
                }

                return false;
            };

            // Find the first class that extends the base class (directly or indirectly)
            const targetClass = Object.values(module).find((candidate): candidate is Constructor<T> => {
                return typeof candidate === "function" &&
                    candidate.prototype instanceof Object &&
                    candidate !== t &&
                    extendsClass(candidate, t);
            });

            if (!targetClass) {
                throw new Error("Could not find a recognizer class in " + fileName);
            }

            // @ts-expect-error - We know that TargetClass is a non-abstract constructor
            return new targetClass();
        } catch (e) {
            throw new Error(`Could not load class ${t.name} from ${fileName}: ${e}`);
        }
    }
}

const testRig = new TestRig();
await testRig.run();
