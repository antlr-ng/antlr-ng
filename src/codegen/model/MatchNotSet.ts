/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { MatchSet } from "./MatchSet.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";

export class MatchNotSet extends MatchSet {
    public varName = "_la";
    public constructor(factory: OutputModelFactory, ast: GrammarAST) {
        super(factory, ast);
    }
}
