/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { RecognitionException, Token, TokenStream } from "antlr4ng";

import { CommonErrorNode } from "../../antlr3/tree/CommonErrorNode.js";
import { GrammarAST } from "./GrammarAST.js";

/** A node representing erroneous token range in token stream */
export class GrammarASTErrorNode extends GrammarAST {
    protected delegate: CommonErrorNode;
    public constructor(input: TokenStream, start: Token, stop: Token,
        e: RecognitionException) {
        super();

        this.delegate = new CommonErrorNode(input, start, stop, e);
    }

    public override isNil(): boolean {
        return this.delegate.isNil();

    }

    public override getType(): number {
        return this.delegate.getType();

    }

    public override getText(): string {
        return this.delegate.getText();

    }

    public override toString(): string {
        return this.delegate.toString();

    }
}
