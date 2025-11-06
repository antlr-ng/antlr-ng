/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IQuantifierAST } from "../../tool/ast/IQuantifierAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Choice } from "./Choice.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { SrcOp } from "./SrcOp.js";

export class Loop extends Choice {
    public blockStartStateNumber: number;
    public loopBackStateNumber: number;
    public readonly exitAlt: number;

    public iteration: SrcOp[] = [];

    public constructor(factory: IOutputModelFactory, blkOrEbnfRootAST: IQuantifierAST, alts: CodeBlockForAlt[]) {
        super(factory, blkOrEbnfRootAST, alts);

        const nongreedy = ("isGreedy" in blkOrEbnfRootAST) && !(blkOrEbnfRootAST).isGreedy();
        this.exitAlt = nongreedy ? 1 : alts.length + 1;
    }

    public addIterationOp(op: SrcOp): void {
        this.iteration.push(op);
    }

}
