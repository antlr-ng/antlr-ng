/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StarLoopEntryState } from "antlr4ng";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { Loop } from "./Loop.js";

export class StarBlock extends Loop {
    public loopLabel: string;

    public constructor(factory: OutputModelFactory,
        blkOrEbnfRootAST: GrammarAST,
        alts: CodeBlockForAlt[]) {
        super(factory, blkOrEbnfRootAST, alts);
        this.loopLabel = factory.getGenerator()!.getTarget().getLoopLabel(blkOrEbnfRootAST);
        const star = blkOrEbnfRootAST.atnState as StarLoopEntryState;
        this.loopBackStateNumber = star.loopBackState.stateNumber;
        this.decision = star.decision;
    }
}
