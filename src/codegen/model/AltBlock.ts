/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { BlockStartState } from "antlr4ng";

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Choice } from "./Choice.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";

export class AltBlock extends Choice {
    public constructor(factory: OutputModelFactory,
        blkOrEbnfRootAST: GrammarAST,
        alts: CodeBlockForAlt[]) {
        super(factory, blkOrEbnfRootAST, alts);

        this.decision = (blkOrEbnfRootAST.atnState as BlockStartState).decision;
    }
}
