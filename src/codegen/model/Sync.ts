/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { SrcOp } from "./SrcOp.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { IntervalSet } from "antlr4ng";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";

export class Sync extends SrcOp {
    public decision: number;

    public constructor(factory: OutputModelFactory,
        blkOrEbnfRootAST: GrammarAST,
        expecting: IntervalSet,
        decision: number,
        position: string) {
        super(factory, blkOrEbnfRootAST);
        this.decision = decision;
    }
}
