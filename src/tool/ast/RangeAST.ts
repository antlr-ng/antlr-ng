/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { GrammarAST } from "./GrammarAST.js";
import { GrammarASTVisitor } from "./GrammarASTVisitor.js";

export class RangeAST extends GrammarAST {

    public constructor(nodeOrToken: RangeAST | Token) {
        super(nodeOrToken);
    }

    public override dupNode(): RangeAST {
        return new RangeAST(this);
    }

    public override visit<T>(v: GrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
