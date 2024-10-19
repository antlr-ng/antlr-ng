/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import type { Token } from "antlr4ng";

import { AttributeResolver } from "../AttributeResolver.js";
import { GrammarAST } from "./GrammarAST.js";
import { GrammarASTVisitor } from "./GrammarASTVisitor.js";
import { GrammarASTWithOptions } from "./GrammarASTWithOptions.js";

export class ActionAST extends GrammarASTWithOptions {
    public resolver: AttributeResolver;
    public chunks: Token[];

    // Alt, rule, grammar space
    protected scope: GrammarAST | null = null; // useful for ANTLR IDE developers

    public constructor(node: ActionAST);
    public constructor(t: Token);
    public constructor(type: number, t?: Token);
    public constructor(...args: unknown[]) {
        if (args.length === 1) {
            if (typeof args[0] === "number") {
                super(args[0]);
            } else if (args[0] instanceof ActionAST) {
                const [node] = args as [ActionAST];

                super(node);
                this.resolver = node.resolver;
                this.chunks = node.chunks;

            } else {
                super(args[0] as Token);
            }
        } else {
            const [type, t] = args as [number, Token];

            super(type, t);
        }
    }

    public override dupNode(): ActionAST {
        return new ActionAST(this);
    }

    public override visit<T>(v: GrammarASTVisitor<T>): T {
        return v.visit(this);
    }

    public setScope(scope: GrammarAST): void {
        this.scope = scope;
    }

    public getScope(): GrammarAST | null {
        return this.scope;
    }

}
