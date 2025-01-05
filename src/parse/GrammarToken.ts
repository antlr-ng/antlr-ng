/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonToken, type CharStream, type Token, type TokenSource } from "antlr4ng";
import { Grammar } from "../tool/Grammar.js";

/**
 * A CommonToken that can also track it's original location,
 * derived from options on the element ref like BEGIN<line=34,..>.
 */
export class GrammarToken extends CommonToken {
    public g: Grammar;
    public originalTokenIndex = -1;

    public constructor(g: Grammar, oldToken: Token) {
        const source: [TokenSource | null, CharStream | null] = [oldToken.tokenSource, oldToken.inputStream];

        super({ ...oldToken, source });
        this.g = g;
    }

    public getCharPositionInLine(): number {
        if (this.originalTokenIndex >= 0) {
            return this.g.originalTokenStream.get(this.originalTokenIndex).column;
        }

        return this.column;
    }

    public getLine(): number {
        if (this.originalTokenIndex >= 0) {
            return this.g.originalTokenStream.get(this.originalTokenIndex).line;
        }

        return this.line;
    }

    public getTokenIndex(): number {
        return this.originalTokenIndex;
    }

    public getStartIndex(): number {
        if (this.originalTokenIndex >= 0) {
            return (this.g.originalTokenStream.get(this.originalTokenIndex) as CommonToken).start;
        }

        return this.start;
    }

    public getStopIndex(): number {
        const n = this.stop - this.start + 1;

        return this.getStartIndex() + n - 1;
    }

    public override toString(): string {
        let channelStr = "";
        if (this.channel > 0) {
            channelStr = ",channel=" + this.channel;
        }

        let txt = this.text;
        if (txt != null) {
            txt = txt.replaceAll("\n", "\\\\n");
            txt = txt.replaceAll("\r", "\\\\r");
            txt = txt.replaceAll("\t", "\\\\t");
        } else {
            txt = "<no text>";
        }

        return "[@" + this.getTokenIndex() + "," + this.getStartIndex() + ":" + this.getStopIndex() +
            "='" + txt + "',<" + this.type + ">" + channelStr + "," + this.getLine() + ":"
            + this.getCharPositionInLine() + "]";
    }
}
