/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { AltBlock } from "./AltBlock.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";

export class OptionalBlock extends AltBlock {
    public constructor(factory: OutputModelFactory,
        questionAST: GrammarAST,
        alts: CodeBlockForAlt[]) {
        super(factory, questionAST, alts);
    }
}
