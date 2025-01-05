/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StarLoopEntryState } from "antlr4ng";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { LL1Loop } from "./LL1Loop.js";

export class LL1StarBlockSingleAlt extends LL1Loop {
    public constructor(factory: OutputModelFactory, starRoot: GrammarAST, alts: CodeBlockForAlt[]) {
        super(factory, starRoot, alts);

        const star = starRoot.atnState as StarLoopEntryState;
        this.loopBackStateNumber = star.loopBackState.stateNumber;
        this.decision = star.decision;
        const altLookSets = factory.getGrammar()!.decisionLOOK[this.decision];

        const enterLook = altLookSets[0];
        this.loopExpr = this.addCodeForLoopLookaheadTempVar(enterLook);
    }
}
