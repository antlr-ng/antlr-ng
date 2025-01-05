/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet } from "antlr4ng";

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { SrcOp } from "./SrcOp.js";
import { TokenInfo } from "./TokenInfo.js";

class Bitset {
    public readonly shift: bigint;
    private readonly tokens: TokenInfo[] = [];
    private bits = 0n;

    public constructor(shift: number) {
        this.shift = BigInt(shift);
    }

    public addToken(type: number, name: string): void {
        this.tokens.push(new TokenInfo(type, name));
        this.bits |= 1n << (BigInt(type) - this.shift);
    }

    public getTokens(): TokenInfo[] {
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

    public constructor(factory: OutputModelFactory, ast: GrammarAST | undefined, set: IntervalSet, wordSize: number) {
        super(factory, ast);
        this.bitsetWordSize = wordSize;
        const withZeroOffset = TestSetInline.createBitsets(factory, set, wordSize, true);
        const withoutZeroOffset = TestSetInline.createBitsets(factory, set, wordSize, false);
        this.bitsets = withZeroOffset.length <= withoutZeroOffset.length ? withZeroOffset : withoutZeroOffset;
        this.varName = "_la";
    }

    private static createBitsets(factory: OutputModelFactory, set: IntervalSet, wordSize: number,
        useZeroOffset: boolean): Bitset[] {
        const bitsetList: Bitset[] = [];
        const target = factory.getGenerator()!.getTarget();

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

            current.addToken(ttype, target.getTokenTypeAsTargetLabel(factory.getGrammar()!, ttype));
        }

        return bitsetList;
    }
}
