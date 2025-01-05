/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { GrammarAST } from "./GrammarAST.js";
import { GrammarASTVisitor } from "./GrammarASTVisitor.js";
import { QuantifierAST } from "./QuantifierAST.js";

export class PlusBlockAST extends GrammarAST implements QuantifierAST {
    private readonly greedy: boolean;

    public constructor(node: PlusBlockAST);
    public constructor(type: number, t: Token, greedy: boolean);
    public constructor(...args: unknown[]) {
        switch (args.length) {
            case 1: {
                const [node] = args as [PlusBlockAST];

                super(node);
                this.greedy = node.greedy;

                break;
            }

            case 3: {
                const [type, t, greedy] = args as [number, Token, boolean];

                super(type, t);
                this.greedy = greedy;

                break;
            }

            default: {
                throw new Error("Invalid number of arguments");
            }
        }
    }

    public isGreedy(): boolean {
        return this.greedy;
    }

    public override dupNode(): PlusBlockAST {
        return new PlusBlockAST(this);
    }

    public override visit<T>(v: GrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
