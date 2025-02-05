/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { ActionAST } from "./ActionAST.js";
import { IGrammarASTVisitor } from "./IGrammarASTVisitor.js";

export class PredAST extends ActionAST {
    public override readonly astType: string = "PredAST";

    public constructor(node: PredAST);
    public constructor(t: Token);
    public constructor(type: number, t?: Token);
    public constructor(...args: unknown[]) {
        if (typeof args[0] === "number") {
            const [type, t] = args as [number, Token | undefined];

            super(type, t);
        } else {
            const [node] = args as [PredAST];

            super(node);
        }
    }

    public override dupNode(): PredAST {
        return new PredAST(this);
    }

    public override visit<T>(v: IGrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
