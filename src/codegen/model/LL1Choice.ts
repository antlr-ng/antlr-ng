/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Choice } from "./Choice.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import type { ITokenInfo } from "./ITokenInfo.js";
import { ThrowNoViableAlt } from "./ThrowNoViableAlt.js";

export abstract class LL1Choice extends Choice {
    /** Token names for each alt 0..n-1 */
    public altLook: ITokenInfo[][];

    @ModelElement
    public error: ThrowNoViableAlt;

    public constructor(factory: IOutputModelFactory, blkAST: GrammarAST,
        alts: CodeBlockForAlt[]) {
        super(factory, blkAST, alts);
    }
}
