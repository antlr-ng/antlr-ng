/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ATN, ATNDeserializer, ATNState, LexerActionType, Token } from "antlr4ng";

import { Character } from "../src/support/Character.js";

const serializationNamesATN: readonly string[] = Object.freeze([
    "INVALID",
    "BASIC",
    "RULE_START",
    "BLOCK_START",
    "PLUS_BLOCK_START",
    "STAR_BLOCK_START",
    "TOKEN_START",
    "RULE_STOP",
    "BLOCK_END",
    "STAR_LOOP_BACK",
    "STAR_LOOP_ENTRY",
    "PLUS_LOOP_BACK",
    "LOOP_END"
]);

const serializationNamesTransition: readonly string[] = Object.freeze([
    "INVALID",
    "EPSILON",
    "RANGE",
    "RULE",
    "PREDICATE",
    "ATOM",
    "ACTION",
    "SET",
    "NOT_SET",
    "WILDCARD",
    "PRECEDENCE"
]);

/**
 * Make human readable set of ints from serialized ATN like this (for debugging / testing):
 *
 * max type 1
 * 0:TOKEN_START -1
 * 1:RULE_START 0
 * 2:RULE_STOP 0
 * 3:BASIC 0
 * 4:BASIC 0
 * rule 0:1 1
 * mode 0:0
 * 0:'a'..128169
 * 0->1 EPSILON 0,0,0
 * 1->3 EPSILON 0,0,0
 * 3->4 SET 0,0,0
 * 4->2 EPSILON 0,0,0
 * 0:0
 */
export class ATNDescriber {
    public atn: ATN;
    private tokenNames: Array<string | null>;

    public constructor(atn: ATN, tokenNames: Array<string | null>) {
        this.atn = atn;
        this.tokenNames = tokenNames;
    }

    /**
     * For testing really; gives a human readable version of the ATN
     *
     * @param data The serialized ATN data.
     *
     * @returns A human readable version of the ATN.
     */
    public decode(data: number[]): string {
        let result = "";
        let p = 0;
        const version = data[p++];
        if (version !== ATNDeserializer.SERIALIZED_VERSION) {
            throw new Error(`Could not deserialize ATN with version ${version} (expected ` +
                `${ATNDeserializer.SERIALIZED_VERSION}).`);
        }

        p++; // skip grammarType
        const maxType = data[p++];
        result += "max type " + maxType + "\n";
        const nstates = data[p++];
        for (let i = 0; i < nstates; i++) {
            const stype = data[p++];
            if (stype === ATNState.INVALID_TYPE) {
                continue;
            }

            // ignore bad type of states
            let ruleIndex = data[p++];
            if (ruleIndex === Character.MAX_VALUE) {
                ruleIndex = -1;
            }

            let arg = "";
            if (stype === ATNState.LOOP_END) {
                const loopBackStateNumber = data[p++];
                arg = " " + loopBackStateNumber;
            } else {
                if (stype === ATNState.PLUS_BLOCK_START || stype === ATNState.STAR_BLOCK_START
                    || stype === ATNState.BLOCK_START) {
                    const endStateNumber = data[p++];
                    arg = " " + endStateNumber;
                }
            }

            result += i + ":" + serializationNamesATN[stype] + " " + ruleIndex + arg + "\n";
        }

        // this code is meant to model the form of ATNDeserializer.deserialize,
        // since both need to be updated together whenever a change is made to
        // the serialization format. The "dead" code is only used in debugging
        // and testing scenarios, so the form you see here was kept for
        // improved maintainability.
        const numNonGreedyStates = data[p++];
        for (let i = 0; i < numNonGreedyStates; i++) {
            const _stateNumber = data[p++];
        }

        const numPrecedenceStates = data[p++];
        for (let i = 0; i < numPrecedenceStates; i++) {
            const _stateNumber = data[p++];
        }

        const nrules = data[p++];
        for (let i = 0; i < nrules; i++) {
            const s = data[p++];
            if (this.atn.grammarType === ATN.LEXER) {
                const arg1 = data[p++];
                result += "rule " + i + ":" + s + " " + arg1 + "\n";
            } else {
                result += "rule " + i + ":" + s + "\n";
            }
        }

        const nmodes = data[p++];
        for (let i = 0; i < nmodes; i++) {
            const s = data[p++];
            result += "mode " + i + ":" + s + "\n";
        }

        const numBMPSets = data[p++];
        [p, result] = this.appendSets(result, data, p, numBMPSets);
        const nedges = data[p++];
        for (let i = 0; i < nedges; i++) {
            const src = data[p];
            const trg = data[p + 1];
            const ttype = data[p + 2];
            const arg1 = data[p + 3];
            const arg2 = data[p + 4];
            const arg3 = data[p + 5];
            result += src + "->" + trg + " " + serializationNamesTransition[ttype] + " " + arg1 + "," + arg2 +
                "," + arg3 + "\n";
            p += 6;
        }

        const ndecisions = data[p++];
        for (let i = 0; i < ndecisions; i++) {
            const s = data[p++];
            result += i + ":" + s + "\n";
        }

        if (this.atn.grammarType === ATN.LEXER) {
            // this code is meant to model the form of ATNDeserializer.deserialize,
            // since both need to be updated together whenever a change is made to
            // the serialization format. The "dead" code is only used in debugging
            // and testing scenarios, so the form you see here was kept for
            // improved maintainability.
            const lexerActionCount = data[p++];
            for (let i = 0; i < lexerActionCount; i++) {
                const _actionType = data[p++] as unknown as typeof LexerActionType;
                const _data1 = data[p++];
                const _data2 = data[p++];
            }
        }

        return result;
    }

    public getTokenName(t: number): string {
        if (t === -1) {
            return "EOF";
        }

        if (this.atn.grammarType === ATN.LEXER &&
            t >= Character.MIN_VALUE && t <= Character.MAX_VALUE) {
            switch (t) {
                case 0x0A: { // '\n'
                    return "'\\n'";
                }

                case 0x0D: { // '\r'
                    return "'\\r'";
                }

                case 0x09: { // '\t'
                    return "'\\t'";
                }

                case 0x08: { // '\b'
                    return "'\\b'";
                }

                case 0x0C: { // '\f'
                    return "'\\f'";
                }

                case 0x5C: { // '\\'
                    return "'\\\\'";
                }

                case 0x27: { // '\''
                    return "'\\''";
                }

                default: {
                    if (Character.UnicodeBlock.of(Number(t)) === Character.UnicodeBlock.BASIC_LATIN &&
                        !Character.isISOControl(Number(t))) {
                        return "'" + Character.toString(Number(t)) + "'";
                    }
                    // turn on the bit above max "\uFFFF" value so that we pad with zeros
                    // then only take last 4 digits
                    const hex = Number(t | 0x10000).toString(16).toUpperCase().substring(1, 5);
                    const unicodeStr = "'\\u" + hex + "'";

                    return unicodeStr;
                }

            }
        }

        if (t >= 0 && t < this.tokenNames.length) {
            return this.tokenNames[t]!;
        }

        return t.toString();
    }

    private appendSets(input: string, data: number[], p: number, nsets: number): [number, string] {
        let result = input;

        for (let i = 0; i < nsets; i++) {
            const nintervals = data[p++];
            result += `${i}:`;
            const containsEof = data[p++] !== 0;
            if (containsEof) {
                result += this.getTokenName(Token.EOF);
            }

            for (let j = 0; j < nintervals; j++) {
                if (containsEof || j > 0) {
                    result += ", ";
                }

                const a = data[p++];
                const b = data[p++];
                result += `${this.getTokenName(a)}..${this.getTokenName(b)}`;
            }
            result += "\n";
        }

        return [p, result];
    }

}
