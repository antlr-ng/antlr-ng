/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet } from "antlr4ng";

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { SrcOp } from "./SrcOp.js";
import { ITokenInfo } from "./ITokenInfo.js";

export class Bitset {
    public readonly shift: bigint;
    public readonly tokens: ITokenInfo[] = [];

    private bits = 0n;

    public constructor(shift: number) {
        this.shift = BigInt(shift);
    }

    public addToken(type: number, name: string): void {
        this.tokens.push({ type, name });
        this.bits |= 1n << (BigInt(type) - this.shift);
    }

    public getTokens(): ITokenInfo[] {
        return this.tokens;
    }

    public get calculated(): string {
        return BigInt.asIntN(64, this.bits).toString();
    }
};

export class TestSetInline extends SrcOp {

    public readonly bitsetWordSize: number;
    public readonly varName: string;
    public readonly bitsets: Bitset[];

    public constructor(factory: IOutputModelFactory, ast: GrammarAST | undefined, set: IntervalSet, wordSize: number) {
        super(factory, ast);

        this.bitsetWordSize = wordSize;
        const withZeroOffset = TestSetInline.createBitsets(factory, set, wordSize, true);
        const withoutZeroOffset = TestSetInline.createBitsets(factory, set, wordSize, false);
        this.bitsets = withZeroOffset.length <= withoutZeroOffset.length ? withZeroOffset : withoutZeroOffset;

        this.varName = "_la";
    }

    private static createBitsets(factory: IOutputModelFactory, set: IntervalSet, wordSize: number,
        useZeroOffset: boolean): Bitset[] {
        const bitsetList: Bitset[] = [];
        const target = factory.getGenerator()!.target;

        const wSize = BigInt(wordSize);
        let current: Bitset | undefined;
        for (const ttype of set.toArray()) {
            const type = BigInt(ttype);
            if (!current || type > (current.shift + wSize - 1n)) {
                let shift: number;
                if (useZeroOffset && type >= 0n && type < wSize - 1n) {
                    shift = 0;
                } else {
                    shift = ttype;
                }
                current = new Bitset(shift);
                bitsetList.push(current);
            }

            current.addToken(ttype, target.getTokenTypeAsTargetLabel(factory.g, ttype));
        }

        return bitsetList;
    }
}
