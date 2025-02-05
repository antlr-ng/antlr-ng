/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { GrammarAST } from "./GrammarAST.js";
import { IGrammarASTVisitor } from "./IGrammarASTVisitor.js";

export class NotAST extends GrammarAST {

    public constructor(typeOrNode: number | NotAST, t?: Token) {
        if (typeOrNode instanceof NotAST) {
            super(typeOrNode);
        } else {
            super(typeOrNode, t);
        }
    }

    public override dupNode(): NotAST {
        return new NotAST(this);
    }

    public override visit<T>(v: IGrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
