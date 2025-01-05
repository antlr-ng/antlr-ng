/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { GrammarASTVisitor } from "./GrammarASTVisitor.js";
import { GrammarASTWithOptions } from "./GrammarASTWithOptions.js";

export class TerminalAST extends GrammarASTWithOptions {

    public constructor(node: TerminalAST);
    public constructor(t: Token);
    public constructor(type: number, t?: Token);
    public constructor(...args: unknown[]) {
        if (typeof args[0] === "number") {
            const [type, t] = args as [number, Token | undefined];

            super(type, t);
        } else {
            const [node] = args as [TerminalAST | Token];

            super(node);
        }
    }

    public override dupNode(): TerminalAST {
        return new TerminalAST(this);
    }

    public override visit<T>(v: GrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
