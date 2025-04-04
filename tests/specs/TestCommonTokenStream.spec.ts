/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import {
    CharStream, CommonToken, CommonTokenStream, IntStream, Lexer, Token, TokenFactory, TokenSource
} from "antlr4ng";

describe("TestCommonTokenStream", () => {

    it("testOffChannel", (): void => {
        // simulate input " x =34  ;\n"
        const lexer = new class implements TokenSource {
            public readonly line = 0;

            public readonly column = 0;
            public readonly inputStream: CharStream | null = null;

            public sourceName = "test";

            private i = 0;

            private tokens = [
                CommonToken.fromType(1, " "), // off channel
                CommonToken.fromType(1, "x"),
                CommonToken.fromType(1, " "), // off channel
                CommonToken.fromType(1, "="),
                CommonToken.fromType(1, "34"),
                CommonToken.fromType(1, " "), // off channel
                CommonToken.fromType(1, " "), // off channel
                CommonToken.fromType(1, ";"),
                CommonToken.fromType(1, "\n"), // off channel
                CommonToken.fromType(Token.EOF, "")
            ];

            public constructor() {
                this.tokens[0].channel = Lexer.HIDDEN;
                this.tokens[2].channel = Lexer.HIDDEN;
                this.tokens[5].channel = Lexer.HIDDEN;
                this.tokens[6].channel = Lexer.HIDDEN;
                this.tokens[8].channel = Lexer.HIDDEN;
            }

            public set tokenFactory(factory: TokenFactory<Token>) {
                throw new Error("Method not implemented.");
            }

            public get tokenFactory(): TokenFactory<Token> {
                throw new Error("Method not implemented.");
            }

            public nextToken(): Token {
                return this.tokens[this.i++];
            }

            public getSourceName(): string {
                return "test";
            }

            public getCharPositionInLine(): number {
                return 0;
            }

            public getLine(): number {
                return 0;
            }

            public getInputStream(): CharStream | null {
                return null;
            }

            public setTokenFactory(factory: TokenFactory<Token>): void {
                // not used
            }

            public getTokenFactory(): TokenFactory<Token> | null {
                return null;
            }
        }();

        const tokens = new CommonTokenStream(lexer);

        expect(tokens.LT(1)!.text).toBe("x"); // must skip first off channel token
        tokens.consume();
        expect(tokens.LT(1)!.text).toBe("=");
        expect(tokens.LT(-1)!.text).toBe("x");

        tokens.consume();
        expect(tokens.LT(1)!.text).toBe("34");
        expect(tokens.LT(-1)!.text).toBe("=");

        tokens.consume();
        expect(tokens.LT(1)!.text).toBe(";");
        expect(tokens.LT(-1)!.text).toBe("34");

        tokens.consume();
        expect(tokens.LA(1)).toBe(Token.EOF);
        expect(tokens.LT(-1)!.text).toBe(";");

        expect(tokens.LT(-2)!.text).toBe("34");
        expect(tokens.LT(-3)!.text).toBe("=");
        expect(tokens.LT(-4)!.text).toBe("x");
    });

    it("testFetchOffChannel", (): void => {
        const lexer = // simulate input " x =34  ; \n"
            // token indexes   01234 56789
            new class implements TokenSource {
                public readonly line = 0;

                public readonly column = 0;
                public readonly inputStream: CharStream | null = null;

                public sourceName = "test";

                public set tokenFactory(factory: TokenFactory<Token>) {
                    throw new Error("Method not implemented.");
                }
                public get tokenFactory(): TokenFactory<Token> {
                    throw new Error("Method not implemented.");
                }

                protected i = 0;

                protected tokens = [
                    CommonToken.fromType(1, " "), // off channel
                    CommonToken.fromType(1, "x"), // 1
                    CommonToken.fromType(1, " "), // off channel
                    CommonToken.fromType(1, "="), // 3
                    CommonToken.fromType(1, "34"), // 4
                    CommonToken.fromType(1, " "), // off channel
                    CommonToken.fromType(1, " "), // off channel
                    CommonToken.fromType(1, ";"), // 7
                    CommonToken.fromType(1, " "), // off channel
                    CommonToken.fromType(1, "\n"), // off channel
                    CommonToken.fromType(Token.EOF, "") // 10
                ];

                public constructor() {
                    this.tokens[0].channel = Lexer.HIDDEN;
                    this.tokens[2].channel = Lexer.HIDDEN;
                    this.tokens[5].channel = Lexer.HIDDEN;
                    this.tokens[6].channel = Lexer.HIDDEN;
                    this.tokens[8].channel = Lexer.HIDDEN;
                    this.tokens[9].channel = Lexer.HIDDEN;
                }

                public nextToken(): Token {
                    return this.tokens[this.i++];
                }

                public getSourceName(): string {
                    return "test";
                }

                public getCharPositionInLine(): number {
                    return 0;
                }

                public getLine(): number {
                    return 0;
                }

                public getInputStream(): CharStream | null {
                    return null;
                }

                public setTokenFactory(factory: TokenFactory<Token>): void {
                    // not used
                }

                public getTokenFactory(): TokenFactory<Token> | null {
                    return null;
                }
            }();

        const tokens = new CommonTokenStream(lexer);
        tokens.fill();
        expect(tokens.getHiddenTokensToLeft(0, -1)).toBeUndefined();
        expect(tokens.getHiddenTokensToRight(0, -1));

        expect(tokens.getHiddenTokensToLeft(1, -1)!.join(", ")).toBe("[@0,0:0=' ',<1>,channel=1,0:-1]");
        expect(tokens.getHiddenTokensToRight(1, -1)!.join(", ")).toBe("[@2,0:0=' ',<1>,channel=1,0:-1]");

        expect(tokens.getHiddenTokensToLeft(2, -1)).toBeUndefined();
        expect(tokens.getHiddenTokensToRight(2, -1)).toBeUndefined();

        expect(tokens.getHiddenTokensToLeft(3, -1)!.join(", ")).toBe("[@2,0:0=' ',<1>,channel=1,0:-1]");
        expect(tokens.getHiddenTokensToRight(3, -1)).toBeUndefined();

        expect(tokens.getHiddenTokensToLeft(4, -1)).toBeUndefined();
        expect(tokens.getHiddenTokensToRight(4, -1)!.join(", ")).toBe(
            "[@5,0:0=' ',<1>,channel=1,0:-1], [@6,0:0=' ',<1>,channel=1,0:-1]");

        expect(tokens.getHiddenTokensToLeft(5, -1)).toBeUndefined();
        expect(tokens.getHiddenTokensToRight(5, -1)!.join(", ")).toBe("[@6,0:0=' ',<1>,channel=1,0:-1]");

        expect(tokens.getHiddenTokensToLeft(6, -1)!.join(", ")).toBe("[@5,0:0=' ',<1>,channel=1,0:-1]");
        expect(tokens.getHiddenTokensToRight(6, -1)).toBeUndefined();

        expect(tokens.getHiddenTokensToLeft(7, -1)!.join(", ")).toBe(
            "[@5,0:0=' ',<1>,channel=1,0:-1], [@6,0:0=' ',<1>,channel=1,0:-1]");
        expect(tokens.getHiddenTokensToRight(7, -1)!.join(", ")).toBe(
            "[@8,0:0=' ',<1>,channel=1,0:-1], [@9,0:0='\\n',<1>,channel=1,0:-1]",);

        expect(tokens.getHiddenTokensToLeft(8, -1)).toBeUndefined();
        expect(tokens.getHiddenTokensToRight(8, -1)!.join(", ")).toBe("[@9,0:0='\\n',<1>,channel=1,0:-1]");

        expect(tokens.getHiddenTokensToLeft(9, -1)!.join(", ")).toBe("[@8,0:0=' ',<1>,channel=1,0:-1]");
        expect(tokens.getHiddenTokensToRight(9, -1)).toBeUndefined();
    });

    it("testSingleEOF", (): void => {
        const lexer = new class implements TokenSource {
            public readonly line = 0;
            public readonly column = 0;
            public readonly inputStream: CharStream | null = null;

            public sourceName = "test";

            public set tokenFactory(factory: TokenFactory<Token>) {
                throw new Error("Method not implemented.");
            }

            public get tokenFactory(): TokenFactory<Token> {
                throw new Error("Method not implemented.");
            }

            public nextToken(): Token {
                return CommonToken.fromType(Token.EOF);
            }

            public getLine(): number {
                return 0;
            }

            public getCharPositionInLine(): number {
                return 0;
            }

            public getInputStream(): CharStream | null {
                return null;
            }

            public getSourceName(): string {
                return IntStream.UNKNOWN_SOURCE_NAME;
            }

            public getTokenFactory(): TokenFactory<Token> | null {
                return null;
            }

            public setTokenFactory(factory: TokenFactory<Token>): void {
                // not used
            }
        }();

        const tokens = new CommonTokenStream(lexer);
        tokens.fill();

        expect(tokens.LA(1)).toBe(Token.EOF);
        expect(tokens.index).toBe(0);
        expect(tokens.size).toBe(1);
    });

    it("testCannotConsumeEOF", (): void => {
        const lexer = new class implements TokenSource {
            public readonly line = 0;
            public readonly column = 0;
            public readonly inputStream: CharStream | null = null;

            public sourceName = "test";

            public set tokenFactory(factory: TokenFactory<Token>) {
                throw new Error("Method not implemented.");
            }

            public get tokenFactory(): TokenFactory<Token> {
                throw new Error("Method not implemented.");
            }

            public nextToken(): Token {
                return CommonToken.fromType(Token.EOF);
            }

            public getLine(): number {
                return 0;
            }

            public getCharPositionInLine(): number {
                return 0;
            }

            public getInputStream(): CharStream | null {
                return null;
            }

            public getSourceName(): string {
                return IntStream.UNKNOWN_SOURCE_NAME;
            }

            public getTokenFactory(): TokenFactory<Token> | null {
                return null;
            }

            public setTokenFactory(factory: TokenFactory<Token>): void {
                // not used
            }
        }();

        const tokens = new CommonTokenStream(lexer);
        tokens.fill();

        expect(tokens.LA(1)).toBe(Token.EOF);
        expect(tokens.index).toBe(0);
        expect(tokens.size).toBe(1);
    });
});
