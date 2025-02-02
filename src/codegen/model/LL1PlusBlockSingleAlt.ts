/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { PlusBlockStartState } from "antlr4ng";

import { BlockAST } from "../../tool/ast/BlockAST.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { LL1Loop } from "./LL1Loop.js";

export class LL1PlusBlockSingleAlt extends LL1Loop {
    public constructor(factory: IOutputModelFactory, plusRoot: GrammarAST, alts: CodeBlockForAlt[]) {
        super(factory, plusRoot, alts);

        const blkAST = plusRoot.getChild(0) as BlockAST;
        const blkStart = blkAST.atnState as PlusBlockStartState;

        this.stateNumber = blkStart.loopBackState.stateNumber;
        this.blockStartStateNumber = blkStart.stateNumber;

        const plus = blkAST.atnState as PlusBlockStartState;
        this.decision = plus.loopBackState.decision;
        const altLookSets = factory.grammar.decisionLOOK[this.decision];

        const loopBackLook = altLookSets[0];
        this.loopExpr = this.addCodeForLoopLookaheadTempVar(loopBackLook);
    }
}
