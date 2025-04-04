/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { TokenStream, TokenSource, Token, ParserRuleContext, IntStream, CommonToken, Interval } from "antlr4ng";

export class MockIntTokenStream implements TokenStream {

    public types: number[];

    protected p = 0;

    public constructor(types: number[]) {
        this.types = types;
    }

    public consume(): void {
        this.p++;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public LA(i: number): number {
        return this.LT(i).type;
    }

    public mark(): number {
        return this.index;
    }

    public get index(): number {
        return this.p;
    }

    public release(marker: number): void {
        this.seek(marker);
    }

    public seek(index: number): void {
        this.p = index;
    }

    public get size(): number {
        return this.types.length;
    }

    public getSourceName(): string {
        return IntStream.UNKNOWN_SOURCE_NAME;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public LT(i: number): Token {
        let t: CommonToken;
        const rawIndex = this.p + i - 1;
        if (rawIndex >= this.types.length) {
            t = CommonToken.fromType(Token.EOF);
        } else {
            t = CommonToken.fromType(this.types[rawIndex]);
        }

        t.setTokenIndex(rawIndex);

        return t;
    }

    public get(i: number): Token {
        return CommonToken.fromType(this.types[i]);
    }

    public get tokenSource(): TokenSource {
        throw new Error("can't give token source");
    }

    public getText(): string {
        throw new Error("can't give strings");
    }

    public getTextFromInterval(interval: Interval): string {
        throw new Error("can't give strings");
    }

    public getTextFromContext(ctx: ParserRuleContext): string {
        throw new Error("can't give strings");
    }

    public getTextFromRange(start: Token, stop: Token): string {
        throw new Error("can't give strings");
    }

    public setLine(line: number): void {
        throw new Error("can't set line");
    }

    public setColumn(line: number): void {
        throw new Error("can't set column");
    }
}
