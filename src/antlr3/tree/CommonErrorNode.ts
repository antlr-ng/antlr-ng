/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: disable

import { Interval, Token, type RecognitionException, type TokenStream } from "antlr4ng";

import { CommonTree } from "../../tree/CommonTree.js";

/** A node representing erroneous token range in token stream */
export class CommonErrorNode extends CommonTree {
    public input: TokenStream;
    public start: Token;
    public stop: Token;
    public trappedException: RecognitionException;

    public constructor(input: TokenStream, start: Token, stop: Token | null, e: RecognitionException) {
        super();

        if (stop === null ||
            (stop.tokenIndex < start.tokenIndex && stop.type !== Token.EOF)) {
            // sometimes resync does not consume a token (when LT(1) is
            // in follow set.  So, stop will be 1 to left to start. adjust.
            // Also handle case where start is the first token and no token
            // is consumed during recovery; LT(-1) will return null.
            stop = start;
        }

        this.input = input;
        this.start = start;
        this.stop = stop;
        this.trappedException = e;
    }

    public override isNil(): boolean {
        return false;
    }

    public override getType(): number {
        return Token.INVALID_TYPE;
    }

    public override getText(): string {
        const i = this.start.tokenIndex;
        let j = this.stop.tokenIndex;
        if (this.stop.type === Token.EOF) {
            j = this.input.size;
        }

        return this.input.getTextFromInterval(Interval.of(i, j));
    }

    public override toString(): string {
        return this.trappedException.toString();

        /*if (this.trappedException instanceof MissingTokenException) {
            return "<missing type: " +
                (this.trappedException as MissingTokenException).getMissingType() +
                ">";
        } else {
            if (this.trappedException instanceof UnwantedTokenException) {
                return "<extraneous: " +
                    (this.trappedException as UnwantedTokenException).getUnexpectedToken() +
                    ", resync=" + this.getText() + ">";
            } else {
                if (this.trappedException instanceof MismatchedTokenException) {
                    return "<mismatched token: " + this.trappedException.token + ", resync=" + this.getText() + ">";
                } else {
                    if (this.trappedException instanceof NoViableAltException) {
                        return "<unexpected: " + this.trappedException.token +
                            ", resync=" + this.getText() + ">";
                    }
                }
            }
        }

        return "<error: " + this.getText() + ">";*/
    }
}
