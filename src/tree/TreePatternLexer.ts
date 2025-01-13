/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: disable

export class TreePatternLexer {
    public static readonly EOF: number = -1;
    public static readonly BEGIN: number = 1;
    public static readonly END: number = 2;
    public static readonly ID: number = 3;
    public static readonly ARG: number = 4;
    public static readonly PERCENT: number = 5;
    public static readonly COLON: number = 6;
    public static readonly DOT: number = 7;

    /** Set when token type is ID or ARG (name mimics Java's StreamTokenizer) */
    public sval = "";

    public error = false;

    /** The tree pattern to lex like "(A B C)" */
    protected pattern: string;

    /** Index into input string */
    protected p = -1;

    /** Current char */
    protected c: number;

    /** How long is the pattern in char? */
    protected n: number;

    public constructor(pattern: string) {
        this.pattern = pattern;
        this.n = pattern.length;
        this.consume();
    }

    public nextToken(): number {
        this.sval = "";
        while (this.c !== TreePatternLexer.EOF) {
            if (this.c === 0x20 || this.c === 0xD || this.c === 0xA || this.c === 0x9) {
                this.consume();
                continue;
            }

            if ((this.c >= 0x61 && this.c <= 0x7A) || (this.c >= 0x41 && this.c <= 0x5A) || this.c === 0x5F) {
                this.sval += String.fromCodePoint(this.c);
                this.consume();
                while ((this.c >= 0x61 && this.c <= 0x7A) || (this.c >= 0x41 && this.c <= 0x5A) ||
                    (this.c >= 0x30 && this.c <= 0x39) || this.c === 0x5F) {
                    this.sval += String.fromCodePoint(this.c);
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

            if (this.c === (0x5B as number)) { // grab [x] as a string, returning x
                this.consume();
                while (this.c !== 0x5D) {
                    if (this.c === (0x5C as number)) {
                        this.consume();
                        if (this.c !== 0x5D) {
                            this.sval += "\\";
                        }
                        this.sval += String.fromCodePoint(this.c);
                    } else {
                        this.sval += String.fromCodePoint(this.c);
                    }
                    this.consume();
                }
                this.consume();

                return TreePatternLexer.ARG;
            }

            this.consume();
            this.error = true;

            return TreePatternLexer.EOF;
        }

        return TreePatternLexer.EOF;
    }

    protected consume(): void {
        this.p++;
        if (this.p >= this.n) {
            this.c = TreePatternLexer.EOF;
        } else {
            this.c = this.pattern.codePointAt(this.p)!;
        }
    }
}
