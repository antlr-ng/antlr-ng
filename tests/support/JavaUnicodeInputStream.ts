/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, Interval } from "antlr4ng";

export class JavaUnicodeInputStream implements CharStream {

    private readonly source: CharStream;
    private readonly escapeIndexes: number[] = [];
    private readonly escapeCharacters: number[] = [];
    private readonly escapeIndirectionLevels: number[] = [];

    private escapeListIndex: number;
    private range: number;
    private slashCount: number;

    private la1: number;

    public constructor(source: CharStream) {
        this.source = source;
        this.la1 = source.LA(1);
    }

    private static isHexDigit(c: number): boolean {
        return (c >= 0x30 && c <= 0x39) // '0' to '9'
            || (c >= 0x61 && c <= 0x66) // 'a' to 'f'
            || (c >= 0x41 && c <= 0x46); // 'A' to 'F'
    }

    private static hexValue(c: number): number {
        if (c >= 0x30 && c <= 0x39) {
            return c - 0x30;
        }

        if (c >= 0x61 && c <= 0x66) {
            return c - 0x61 + 10;
        }

        if (c >= 0x41 && c <= 0x46) {
            return c - 0x41 + 10;
        }

        throw new Error("Invalid hex number");
    }

    public get name(): string {
        return this.source.name;
    }

    public reset(): void {
        this.source.reset();
        this.la1 = this.source.LA(1);
        this.escapeIndexes.length = 0;
        this.escapeCharacters.length = 0;
        this.escapeIndirectionLevels.length = 0;
        this.escapeListIndex = 0;
        this.range = 0;
        this.slashCount = 0;
    }

    public get size(): number {
        return this.source.size;
    }

    public get index(): number {
        return this.source.index;
    }

    public getSourceName(): string {
        return this.source.getSourceName();
    }

    public getTextFromInterval(interval: Interval): string {
        return this.source.getTextFromInterval(interval);
    }

    public getTextFromRange(start: number, stop: number): string {
        return this.source.getTextFromRange(start, stop);
    }

    public consume(): void {
        if (this.la1 !== 0x5C) { // '\'
            this.source.consume();
            this.la1 = this.source.LA(1);
            this.range = Math.max(this.range, this.source.index);
            this.slashCount = 0;

            return;
        }

        // make sure the next character has been processed
        this.LA(1);

        if (this.escapeListIndex >= this.escapeIndexes.length
            || this.escapeIndexes[this.escapeListIndex] !== this.index) {
            this.source.consume();
            this.slashCount++;
        } else {
            const indirectionLevel = this.escapeIndirectionLevels[this.escapeListIndex];
            for (let i = 0; i < 6 + indirectionLevel; i++) {
                this.source.consume();
            }

            this.escapeListIndex++;
            this.slashCount = 0;
        }

        this.la1 = this.source.LA(1);
        /* assert range >= index(); */
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public LA(i: number): number {
        if (i === 1 && this.la1 !== 0x5C) { // '\'
            return this.la1;
        }

        if (i <= 0) {
            let desiredIndex = this.index + i;
            for (let j = this.escapeListIndex - 1; j >= 0; j--) {
                if (this.escapeIndexes[j] + 6 + this.escapeIndirectionLevels[j] > desiredIndex) {
                    desiredIndex -= 5 + this.escapeIndirectionLevels[j];
                }

                if (this.escapeIndexes[j] === desiredIndex) {
                    return this.escapeCharacters[j];
                }
            }

            return this.source.LA(desiredIndex - this.index);
        } else {
            let desiredIndex = this.index + i - 1;
            for (let j = this.escapeListIndex; j < this.escapeIndexes.length; j++) {
                if (this.escapeIndexes[j] === desiredIndex) {
                    return this.escapeCharacters[j];
                } else {
                    if (this.escapeIndexes[j] < desiredIndex) {
                        desiredIndex += 5 + this.escapeIndirectionLevels[j];
                    } else {
                        return this.source.LA(desiredIndex - this.index + 1);
                    }
                }

            }

            const currentIndex = [this.index];
            const slashCountPtr = [this.slashCount];
            const indirectionLevelPtr = [0];
            for (let j = 0; j < i; j++) {
                const previousIndex = currentIndex[0];
                const c = this.readCharAt(currentIndex, slashCountPtr, indirectionLevelPtr);
                if (currentIndex[0] > this.range) {
                    if (currentIndex[0] - previousIndex > 1) {
                        this.escapeIndexes.push(previousIndex);
                        this.escapeCharacters.push(c);
                        this.escapeIndirectionLevels.push(indirectionLevelPtr[0]);
                    }

                    this.range = currentIndex[0];
                }

                if (j === i - 1) {
                    return c;
                }
            }

            throw new Error("shouldn't be reachable");
        }
    }

    public mark(): number {
        return this.source.mark();
    }

    public release(marker: number): void {
        this.source.release(marker);
    }

    public seek(index: number): void {
        if (index > this.range) {
            throw new Error("UnsupportedOperationException");
        }

        this.source.seek(index);
        this.la1 = this.source.LA(1);

        this.slashCount = 0;
        while (this.source.LA(-this.slashCount - 1) === 0x5C) { // '\'
            this.slashCount++;
        }

        this.escapeListIndex = this.escapeIndexes.findIndex((value) => { // TODO: was binary search before
            return value === this.source.index;
        });

        if (this.escapeListIndex < 0) {
            // ml: binary search in Java returns a negative index of the insertion point minus 1, if a value
            // is not found. We might need to do the same here.
            this.escapeListIndex = -this.escapeListIndex - 1;
        }
    }

    private readCharAt(nextIndexPtr: number[], slashCountPtr: number[], indirectionLevelPtr: number[]): number {
        const blockUnicodeEscape = (slashCountPtr[0] % 2) !== 0;

        const c0 = this.source.LA(nextIndexPtr[0] - this.index + 1);
        if (c0 === 0x5C) { // '\'
            slashCountPtr[0]++;

            if (!blockUnicodeEscape) {
                const c1 = this.source.LA(nextIndexPtr[0] - this.index + 2);
                if (c1 === 0x75) { // 'u'
                    let c2 = this.source.LA(nextIndexPtr[0] - this.index + 3);
                    indirectionLevelPtr[0] = 0;
                    while (c2 === 0x75) { // 'u'
                        indirectionLevelPtr[0]++;
                        c2 = this.source.LA(nextIndexPtr[0] - this.index + 3 + indirectionLevelPtr[0]);
                    }

                    const c3 = this.source.LA(nextIndexPtr[0] - this.index + 4 + indirectionLevelPtr[0]);
                    const c4 = this.source.LA(nextIndexPtr[0] - this.index + 5 + indirectionLevelPtr[0]);
                    const c5 = this.source.LA(nextIndexPtr[0] - this.index + 6 + indirectionLevelPtr[0]);
                    if (JavaUnicodeInputStream.isHexDigit(c2) && JavaUnicodeInputStream.isHexDigit(c3)
                        && JavaUnicodeInputStream.isHexDigit(c4) && JavaUnicodeInputStream.isHexDigit(c5)) {
                        let value = JavaUnicodeInputStream.hexValue(c2);
                        value = (value << 4) + JavaUnicodeInputStream.hexValue(c3);
                        value = (value << 4) + JavaUnicodeInputStream.hexValue(c4);
                        value = (value << 4) + JavaUnicodeInputStream.hexValue(c5);

                        nextIndexPtr[0] += 6 + indirectionLevelPtr[0];
                        slashCountPtr[0] = 0;

                        return value;
                    }
                }
            }
        }

        nextIndexPtr[0]++;

        return c0;
    }
}
