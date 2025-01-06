/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Option, program } from "commander";
import { createWriteStream } from "node:fs";
import { readFile } from "fs/promises";

import { CharStream, CommonToken, CommonTokenStream, DecisionInfo, ParseInfo } from "antlr4ng";

import type { ANTLRToolListener } from "../src/tool/ANTLRToolListener.js";
import { DefaultToolListener } from "../src/tool/DefaultToolListener.js";
import { Grammar } from "../src/tool/Grammar.js";
import type { GrammarParserInterpreter } from "../src/tool/GrammarParserInterpreter.js";
import { LexerGrammar } from "../src/tool/LexerGrammar.js";
import { encodings, parseBoolean } from "./cli-options.js";
import type { Tool } from "../src/Tool.js";

/** CLI parameters for the interpreter tool. */
export interface IInterpreterCliParameters {
    grammarFileName: string,
    lexerFileName?: string,
    lexer?: string,
    inputFile?: string,
    startRuleName: string,
    encoding: BufferEncoding,
    tokens?: boolean,
    tree?: boolean,
    trace?: boolean,
    profile?: string,
}

program
    .argument("[X.g4|XParser.g4 XLexer.g4]", "Parser and lexer file")
    .argument("startRuleName", "Name of the start rule")
    .option("[input-filename]", "Input file")
    .option<boolean>("--tokens [boolean]", "Print out the tokens for each input symbol", parseBoolean, false)
    .option<boolean>("--tree", "Print out the parse tree", parseBoolean, false)
    .addOption(new Option("--encoding", "The input file encoding")
        .choices(encodings).default("utf-8"))
    .option<boolean>("--trace", "Print out tracing information (rule enter/exit etc.).", parseBoolean, false)
    .option("--profile filename.csv", "Profile the parser and generate profiling information.", "filename.csv")
    .parse();

const interpreterOptions = program.opts<IInterpreterCliParameters>();

/** Interpret a lexer/parser, optionally printing tree string and dumping profile info */
export class Interpreter {
    public static readonly profilerColumnNames = [
        "Rule", "Invocations", "Time (ms)", "Total k", "Max k", "Ambiguities", "DFA cache miss",
    ];

    private static IgnoreTokenVocabGrammar = class IgnoreTokenVocabGrammar extends Grammar {
        public constructor(fileName: string, grammarText: string, tokenVocabSource: Grammar | undefined,
            listener: ANTLRToolListener) {
            super(fileName, grammarText, tokenVocabSource, listener);
        }

        public override importTokensFromTokensFile(): void {
            // don't try to import tokens files; must give me both grammars if split
        }
    };

    public constructor(private tool: Tool) {
    }

    public static getValue(decisionInfo: DecisionInfo, ruleNamesByDecision: string[], decision: number,
        col: number): number | string {
        switch (col) { // laborious but more efficient than reflection
            case 0: {
                return `${ruleNamesByDecision[decision]}:${decision}`;
            }

            case 1: {
                return decisionInfo.invocations;
            }

            case 2: {
                return decisionInfo.timeInPrediction / (1000.0 * 1000.0);
            }

            case 3: {
                return decisionInfo.llTotalLook + decisionInfo.sllTotalLook;
            }

            case 4: {
                return Math.max(decisionInfo.llMaxLook, decisionInfo.sllMaxLook);
            }

            case 5: {
                return decisionInfo.ambiguities.length;
            }

            case 6: {
                return decisionInfo.sllATNTransitions + decisionInfo.llATNTransitions;
            }

            default:

        }

        return "n/a";
    }

    public async interp(): Promise<ParseInfo | undefined> {
        if (!interpreterOptions.grammarFileName && !interpreterOptions.lexerFileName) {
            return undefined;
        }

        let g: Grammar;
        let lg = null;
        const listener = new DefaultToolListener(this.tool.errorManager);
        if (interpreterOptions.grammarFileName) {
            const grammarContent = await readFile(interpreterOptions.grammarFileName, "utf8");
            g = new Interpreter.IgnoreTokenVocabGrammar(interpreterOptions.grammarFileName, grammarContent, undefined,
                listener);
        } else {
            const lexerGrammarContent = await readFile(interpreterOptions.lexerFileName!, "utf8");
            lg = new LexerGrammar(lexerGrammarContent, listener);
            const parserGrammarContent = await readFile(interpreterOptions.grammarFileName, "utf8");
            g = new Interpreter.IgnoreTokenVocabGrammar(interpreterOptions.grammarFileName, parserGrammarContent, lg,
                listener);
        }

        const input = await readFile(interpreterOptions.inputFile!, interpreterOptions.encoding);
        const charStream = CharStream.fromString(input);
        const lexEngine = lg ? lg.createLexerInterpreter(charStream) : g.createLexerInterpreter(charStream);
        const tokens = new CommonTokenStream(lexEngine);

        tokens.fill();

        if (interpreterOptions.tokens) {
            for (const tok of tokens.getTokens()) {
                if (tok instanceof CommonToken) {
                    console.log(tok.toString(lexEngine));
                } else {

                    console.log(tok.toString());
                }
            }
        }

        const parser = g.createGrammarParserInterpreter(tokens);
        if (interpreterOptions.profile) {
            parser.setProfile(true);
        }
        parser.setTrace(interpreterOptions.trace ?? false);

        const r = g.rules.get(interpreterOptions.startRuleName);
        if (!r) {
            console.error("No such start rule: " + interpreterOptions.startRuleName);

            return undefined;
        }

        const t = parser.parse(r.index);
        const parseInfo = parser.getParseInfo();

        if (interpreterOptions.tree) {
            console.log(t.toStringTree(parser));
        }

        if (interpreterOptions.profile && parseInfo) {
            this.dumpProfilerCSV(parser, parseInfo);
        }

        return parseInfo ?? undefined;
    }

    private dumpProfilerCSV(parser: GrammarParserInterpreter, parseInfo: ParseInfo): void {
        const ruleNamesByDecision = new Array<string>(parser.atn.decisionToState.length);
        const ruleNames = parser.ruleNames;
        for (let i = 0; i < ruleNamesByDecision.length; i++) {
            ruleNamesByDecision[i] = ruleNames[parser.atn.getDecisionState(i)!.ruleIndex];
        }

        const decisionInfo = parseInfo.getDecisionInfo();
        const table: string[][] = [];

        for (let decision = 0; decision < decisionInfo.length; decision++) {
            for (let col = 0; col < Interpreter.profilerColumnNames.length; col++) {
                const colVal = Interpreter.getValue(decisionInfo[decision], ruleNamesByDecision, decision, col);
                table[decision][col] = colVal.toString();
            }
        }

        const writer = createWriteStream(interpreterOptions.profile!);

        for (let i = 0; i < Interpreter.profilerColumnNames.length; i++) {
            if (i > 0) {
                writer.write(",");
            }

            writer.write(Interpreter.profilerColumnNames[i]);
        }

        writer.write("\n");
        for (const row of table) {
            for (let i = 0; i < Interpreter.profilerColumnNames.length; i++) {
                if (i > 0) {
                    writer.write(",");
                }
                writer.write(row[i]);
            }
            writer.write("\n");
        }
        writer.close();
    }
}

// todo: const interpreter = new Interpreter();
// todo: await interpreter.interp();
