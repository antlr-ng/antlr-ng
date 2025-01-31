/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { DecisionState, IntervalSet } from "antlr4ng";

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { LL1Choice } from "./LL1Choice.js";

/** `(A | B | C)` */
export class LL1AltBlock extends LL1Choice {
    public constructor(factory: OutputModelFactory, blkAST: GrammarAST, alts: CodeBlockForAlt[]) {
        super(factory, blkAST, alts);
        this.decision = (blkAST.atnState as DecisionState).decision;

        // Lookahead for each alt 1..n.
        const altLookSets = factory.getGrammar()!.decisionLOOK[this.decision];
        this.altLook = this.getAltLookaheadAsStringLists(altLookSets);

        // Combine alt sets.
        const expecting = IntervalSet.or(altLookSets);
        this.error = this.getThrowNoViableAlt(factory, blkAST, expecting);
    }
}
