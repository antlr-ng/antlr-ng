/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

export class TreePatternLexer {
    public static readonly EOF: number = -1;
    public static readonly BEGIN: number = 1;
    public static readonly END: number = 2;
    public static readonly ID: number = 3;
    public static readonly ARG: number = 4;
    public static readonly PERCENT: number = 5;
    public static readonly COLON: number = 6;
    public static readonly DOT: number = 7;

    /** Set when token type is ID or ARG. */
    public stringValue = "";

    /** Index into input string */
    private currentPosition = -1;

    /** Current char */
    private c: number;

    /** The input pattern as a sequence of code points. */
    private input: Uint16Array;

    public constructor(pattern: string) {
        // Convert the pattern string to a Uint16Array.
        this.input = new Uint16Array(pattern.length);
        for (let i = 0; i < pattern.length; ++i) {
            this.input[i] = pattern.charCodeAt(i);
        }

        this.consume();
    }

    public nextToken(): number {
        this.stringValue = "";
        while (this.currentPosition < this.input.length) {
            if (this.c === 0x20 || this.c === 0x0D || this.c === 0x0A || this.c === 0x09) {
                this.consume();
                continue;
            }

            if ((this.c >= 0x61 && this.c <= 0x7A) || (this.c >= 0x41 && this.c <= 0x5A) || this.c === 0x5F) {
                this.stringValue += String.fromCodePoint(this.c);
                this.consume();
                while ((this.c >= 0x61 && this.c <= 0x7A)
                    || (this.c >= 0x41 && this.c <= 0x5A)
                    || (this.c >= 0x30 && this.c <= 0x39)
                    || this.c === 0x5F) {
                    this.stringValue += String.fromCodePoint(this.c);
                    this.consume();
                }

                return TreePatternLexer.ID;
            }

            if (this.c === 0x28) {
                this.consume();

                return TreePatternLexer.BEGIN;
            }

            if (this.c === 0x29) {
                this.consume();

                return TreePatternLexer.END;
            }

            if (this.c === 0x25) {
                this.consume();

                return TreePatternLexer.PERCENT;
            }

            if (this.c === 0x3A) {
                this.consume();

                return TreePatternLexer.COLON;
            }

            if (this.c === 0x2E) {
                this.consume();

                return TreePatternLexer.DOT;
            }

            // Grab [x] as a string, returning x.
            if (this.c === (0x5B as number)) {
                this.consume();
                while (this.c !== 0x5D) {
                    if (this.c === 0x5C) {
                        this.consume();
                        this.stringValue += "\\";
                        this.stringValue += String.fromCodePoint(this.c);
                    } else {
                        this.stringValue += String.fromCodePoint(this.c);
                    }
                    this.consume();
                }
                this.consume();

                return TreePatternLexer.ARG;
            }

            this.consume();

            return TreePatternLexer.EOF;
        }

        return TreePatternLexer.EOF;
    }

    protected consume(): void {
        ++this.currentPosition;
        if (this.currentPosition >= this.input.length) {
            this.c = TreePatternLexer.EOF;
        } else {
            this.c = this.input[this.currentPosition];
        }
    }
}
