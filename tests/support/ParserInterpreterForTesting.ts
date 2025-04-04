/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import {
    ATN, ATNState, DecisionState, DFA, Parser, ParserATNSimulator, ParserRuleContext, PredictionContextCache,
    TokenStream, type Vocabulary,
} from "antlr4ng";

import type { Grammar } from "../src/tool/Grammar.js";

class DummyParser extends Parser {
    public readonly decisionToDFA: DFA[]; // not shared for interp
    public readonly sharedContextCache = new PredictionContextCache();
    public g: Grammar;

    readonly #atn: ATN;

    public constructor(g: Grammar, atn: ATN, input: TokenStream | null) {
        super(input!);
        this.g = g;
        this.#atn = atn;

        this.decisionToDFA = atn.decisionToState.map((ds: DecisionState, index: number) => {
            return new DFA(ds, index);
        });
    }

    public override get grammarFileName(): string {
        throw new Error("not implemented");
    }

    public override get ruleNames(): string[] {
        return Array.from(this.g.rules.keys());
    }

    public get vocabulary(): Vocabulary {
        throw new Error("Method not implemented.");
    }

    public get tokenNames(): Array<string | null> {
        return this.g.getTokenNames();
    }

    public get atn(): ATN {
        return this.#atn;
    }
};

export class ParserInterpreterForTesting {
    public parser: DummyParser;

    protected g: Grammar;
    protected atnSimulator: ParserATNSimulator;
    protected input: TokenStream;

    public constructor(g: Grammar, input?: TokenStream | null) {
        if (input === undefined) {
            this.g = g;
        } else {
            this.parser = new DummyParser(g, g.atn!, input);
            this.atnSimulator = new ParserATNSimulator(this.parser, g.atn!, this.parser.decisionToDFA,
                this.parser.sharedContextCache);
        }
    }

    public adaptivePredict(input: TokenStream, decision: number, outerContext: ParserRuleContext | null): number {
        return this.atnSimulator.adaptivePredict(input, decision, outerContext);
    }

    public matchATN(input: TokenStream, startState: ATNState): number {
        if (startState.transitions.length === 1) {
            return 1;
        } else {
            if (startState instanceof DecisionState) {
                return this.atnSimulator.adaptivePredict(input, (startState).decision, null);
            } else {
                if (startState.transitions.length > 0) {
                    return 1;
                } else {
                    return -1;
                }
            }
        }
    }

    public getATNSimulator(): ParserATNSimulator {
        return this.atnSimulator;
    }
}
