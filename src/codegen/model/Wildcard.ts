/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { MatchToken } from "./MatchToken.js";

export class Wildcard extends MatchToken {
    public constructor(factory: OutputModelFactory, ast: GrammarAST) {
        super(factory, ast);
    }
}
