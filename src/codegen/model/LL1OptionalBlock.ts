/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { LL1AltBlock } from "./LL1AltBlock.js";

/**
 * An optional block is just an alternative block where the last alternative
 *  is epsilon. The analysis takes care of adding to the empty alternative.
 *
 *  (A | B | C)?
 */
export class LL1OptionalBlock extends LL1AltBlock {
    public constructor(factory: OutputModelFactory, blkAST: GrammarAST, alts: CodeBlockForAlt[]) {
        super(factory, blkAST, alts);
    }
}
