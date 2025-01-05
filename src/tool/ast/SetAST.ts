/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { GrammarAST } from "./GrammarAST.js";
import { GrammarASTVisitor } from "./GrammarASTVisitor.js";

export class SetAST extends GrammarAST {

    public constructor(node: SetAST);
    public constructor(type: number, t: Token, text: string);
    public constructor(...args: unknown[]) {
        if (typeof args[0] === "number") {
            const [type, t, text] = args as [number, Token, string];

            super(type, t, text);
        } else {
            const [node] = args as [SetAST];

            super(node);
        }
    }

    public override dupNode(): SetAST {
        return new SetAST(this);
    }

    public override visit<T>(v: GrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
