/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";

import { isTokenName } from "../../support/helpers.js";

import type { ActionAST } from "./ActionAST.js";
import type { GrammarAST } from "./GrammarAST.js";
import { GrammarASTWithOptions } from "./GrammarASTWithOptions.js";
import type { IGrammarASTVisitor } from "./IGrammarASTVisitor.js";

export class RuleAST extends GrammarASTWithOptions {
    public override readonly astType: string = "RuleAST";

    public constructor(nodeOrTokenOrType: RuleAST | Token | number) {
        if (typeof nodeOrTokenOrType === "number") {
            super(nodeOrTokenOrType);
        } else {
            super(nodeOrTokenOrType);
        }
    }

    public isLexerRule(): boolean {
        const name = this.getRuleName();

        return name !== null && isTokenName(name);
    }

    public getRuleName(): string | null {
        const nameNode = this.children[0] as GrammarAST | null;

        return nameNode?.getText() ?? null;
    }

    public override dupNode(): RuleAST {
        return new RuleAST(this);
    }

    public getLexerAction(): ActionAST | null {
        const blk = this.getFirstChildWithType(ANTLRv4Parser.LPAREN);
        if (blk?.children.length === 1) {
            const onlyAlt = blk.children[0];
            const lastChild = onlyAlt.children[onlyAlt.children.length - 1];
            if (lastChild.getType() === ANTLRv4Parser.RBRACE) {
                return lastChild as ActionAST;
            }
        }

        return null;
    }

    public override visit<T>(v: IGrammarASTVisitor<T>): T {
        return v.visit(this);
    }
}
