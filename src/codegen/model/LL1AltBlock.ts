/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { DecisionState } from "antlr4ng";

import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { LL1Choice } from "./LL1Choice.js";

/** `(A | B | C)` */
export class LL1AltBlock extends LL1Choice {
    public constructor(factory: IOutputModelFactory, blkAST: GrammarAST, alts: CodeBlockForAlt[]) {
        super(factory, blkAST, alts);
        this.decision = (blkAST.atnState as DecisionState).decision;

        // Lookahead for each alt 1..n.
        const altLookSets = factory.grammar.decisionLookahead[this.decision];
        this.altLook = this.getAltLookaheadAsStringLists(altLookSets, factory.grammar);
    }
}
