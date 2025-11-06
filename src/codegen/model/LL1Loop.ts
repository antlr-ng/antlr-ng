/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet } from "antlr4ng";

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { CaptureNextTokenType } from "./CaptureNextTokenType.js";
import { Choice } from "./Choice.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { SrcOp } from "./SrcOp.js";

export abstract class LL1Loop extends Choice {

    /** The state associated wih the (A|B|...) block not loopback, which is super.stateNumber */
    public blockStartStateNumber: number;
    public loopBackStateNumber: number;

    public loopExpr: SrcOp | null;

    public iteration: SrcOp[] = [];

    public constructor(factory: IOutputModelFactory,
        blkAST: GrammarAST,
        alts: CodeBlockForAlt[]) {
        super(factory, blkAST, alts);
    }

    public addIterationOp(op: SrcOp): void {
        this.iteration.push(op);
    }

    public addCodeForLoopLookaheadTempVar(look: IntervalSet): SrcOp | null {
        const expr = this.addCodeForLookaheadTempVar(look);
        if (expr) {
            const nextType = new CaptureNextTokenType(this.factory!, expr.varName);
            this.addIterationOp(nextType);
        }

        return expr;
    }

}
