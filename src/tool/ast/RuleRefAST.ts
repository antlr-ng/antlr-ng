/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonToken, type Token } from "antlr4ng";

import { IGrammarASTVisitor } from "./IGrammarASTVisitor.js";
import { GrammarASTWithOptions } from "./GrammarASTWithOptions.js";

export class RuleRefAST extends GrammarASTWithOptions {
    public constructor(node: RuleRefAST);
    public constructor(t: Token);
    public constructor(type: number, t?: Token);
    public constructor(...args: unknown[]) {
        if (typeof args[0] === "number") {
            const [type, t] = args as [number, Token | undefined];

            super(type, t);
        } else {
            const [node] = args as [RuleRefAST | Token];

            super(node);
        }
    }

    /**
     * Duplicates token too since we overwrite during LR rule transform.
     *
     * @returns A new RuleRefAST node with the same token and type.
     */
    public override dupNode(): RuleRefAST {
        const r = new RuleRefAST(this);
        // In LR transform, we alter original token stream to make e -> e[n]. Since we will be altering the dup,
        // we need dup to have the original token.  We can set this tree (the original) to have a new token.
        r.token = this.token;
        this.token = CommonToken.fromToken(r.token!);

        return r;
    }

    public override visit<T>(v: IGrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
