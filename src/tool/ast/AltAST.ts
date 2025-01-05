/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Token } from "antlr4ng";

import { type LeftRecursiveRuleAltInfo } from "../../analysis/LeftRecursiveRuleAltInfo.js";
import { type Alternative } from "../Alternative.js";
import { type GrammarAST } from "./GrammarAST.js";
import { type GrammarASTVisitor } from "./GrammarASTVisitor.js";
import { GrammarASTWithOptions } from "./GrammarASTWithOptions.js";

/** Any ALT (which can be child of ALT_REWRITE node) */
export class AltAST extends GrammarASTWithOptions {
    public override readonly astType: string = "AltAST";

    public alt: Alternative;

    /** If we transformed this alt from a left-recursive one, need info on it */
    public leftRecursiveAltInfo?: LeftRecursiveRuleAltInfo;

    /**
     * If someone specified an outermost alternative label with #foo. Token type will be ID.
     */
    public altLabel?: GrammarAST;

    public constructor(node: AltAST | Token);
    public constructor(type: number, t?: Token, text?: string);
    public constructor(...args: unknown[]) {
        if (args.length === 1) {
            const [param] = args as [AltAST | Token | number];

            if (typeof param === "number") {
                super(param);
            } else if (param instanceof AltAST) {
                super(param);
                this.alt = param.alt;
                this.altLabel = param.altLabel;
                this.leftRecursiveAltInfo = param.leftRecursiveAltInfo;
            } else {
                super(param);
            }
        } else {
            const [type, t, text] = args as [number, Token, string | undefined];
            if (text !== undefined) {
                super(type, t, text);
            } else {
                super(type, t);
            }
        }
    }

    public override dupNode(): AltAST {
        return new AltAST(this);
    }

    public override visit<T>(v: GrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
