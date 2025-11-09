/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { PlusBlockStartState } from "antlr4ng";

import { BlockAST } from "../../tool/ast/BlockAST.js";
import type { IQuantifierAST } from "../../tool/ast/IQuantifierAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { Loop } from "./Loop.js";

export class PlusBlock extends Loop {
    public constructor(factory: IOutputModelFactory, plusRoot: IQuantifierAST, alts: CodeBlockForAlt[]) {
        super(factory, plusRoot, alts);

        const blkAST = plusRoot.children[0] as BlockAST;
        const blkStart = blkAST.atnState as PlusBlockStartState;
        const loop = blkStart.loopBackState;

        this.stateNumber = blkStart.loopBackState.stateNumber;
        this.blockStartStateNumber = blkStart.stateNumber;
        this.loopBackStateNumber = loop.stateNumber;
        this.decision = loop.decision;
    }

}
