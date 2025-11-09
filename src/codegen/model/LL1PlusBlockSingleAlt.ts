/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { PlusBlockStartState } from "antlr4ng";

import type { BlockAST } from "../../tool/ast/BlockAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { LL1Loop } from "./LL1Loop.js";

export class LL1PlusBlockSingleAlt extends LL1Loop {
    public constructor(factory: IOutputModelFactory, plusRoot: GrammarAST, alts: CodeBlockForAlt[]) {
        super(factory, plusRoot, alts);

        const blkAST = plusRoot.children[0] as BlockAST;
        const blkStart = blkAST.atnState as PlusBlockStartState;

        this.stateNumber = blkStart.loopBackState.stateNumber;
        this.blockStartStateNumber = blkStart.stateNumber;

        const plus = blkAST.atnState as PlusBlockStartState;
        this.decision = plus.loopBackState.decision;
        const altLookSets = factory.grammar.decisionLookahead[this.decision];

        const loopBackLook = altLookSets[0];
        this.loopExpr = this.addCodeForLoopLookaheadTempVar(loopBackLook);
    }
}
