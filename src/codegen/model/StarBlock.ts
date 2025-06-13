/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StarLoopEntryState } from "antlr4ng";

import type { IQuantifierAST } from "../../tool/ast/IQuantifierAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { Loop } from "./Loop.js";

export class StarBlock extends Loop {
    public readonly loopLabel: string;

    public constructor(factory: IOutputModelFactory, blkOrEbnfRootAST: IQuantifierAST, alts: CodeBlockForAlt[]) {
        super(factory, blkOrEbnfRootAST, alts);

        this.loopLabel = factory.getGenerator()!.targetGenerator.getLoopLabel(blkOrEbnfRootAST);

        const star = blkOrEbnfRootAST.atnState as StarLoopEntryState;
        this.loopBackStateNumber = star.loopBackState.stateNumber;
        this.decision = star.decision;
    }
}
