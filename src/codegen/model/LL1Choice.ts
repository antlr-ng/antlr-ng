/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Choice } from "./Choice.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { ThrowNoViableAlt } from "./ThrowNoViableAlt.js";
import { TokenInfo } from "./TokenInfo.js";

export abstract class LL1Choice extends Choice {

    /** Token names for each alt 0..n-1 */
    public altLook: TokenInfo[][];

    @ModelElement
    public error: ThrowNoViableAlt;

    public constructor(factory: OutputModelFactory, blkAST: GrammarAST,
        alts: CodeBlockForAlt[]) {
        super(factory, blkAST, alts);
    }
}
