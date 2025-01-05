/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonToken, type CharStream, type RecognitionException, type Token, type TokenStream } from "antlr4ng";

import { CommonTreeAdaptor } from "../antlr3/tree/CommonTreeAdaptor.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";

import { ClassFactory } from "../ClassFactory.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { GrammarASTErrorNode } from "../tool/ast/GrammarASTErrorNode.js";
import { RuleAST } from "../tool/ast/RuleAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";
import type { IGrammarASTAdaptor } from "../types.js";

export class GrammarASTAdaptor extends CommonTreeAdaptor implements IGrammarASTAdaptor {
    private inputStream?: CharStream;

    public constructor(inputStream?: CharStream) {
        super();

        this.inputStream = inputStream;
    }

    public override create(token: Token): GrammarAST;
    public override create(tokenType: number, text: string): GrammarAST;
    public override create(tokenType: number, fromToken: Token, text?: string): GrammarAST;
    public override create(...args: unknown[]): GrammarAST {
        if (args.length === 1) {
            const [token] = args as [Token | undefined];

            return new GrammarAST(token);
        }

        if (args.length === 2 && typeof args[1] === "string") {
            const [tokenType, text] = args as [number, string];

            let t: GrammarAST;
            if (tokenType === ANTLRv4Parser.RULE_REF) {
                // needed by TreeWizard to make RULE tree
                t = new RuleAST(CommonToken.fromType(tokenType, text));
            } else {
                if (tokenType === ANTLRv4Parser.STRING_LITERAL) {
                    // implicit lexer construction done with wizard; needs this node type
                    // whereas grammar ANTLRParser.g can use token option to spec node type
                    t = new TerminalAST(CommonToken.fromType(tokenType, text));
                } else {
                    t = super.create(tokenType, text) as GrammarAST;
                }
            }

            t.token!.inputStream = this.inputStream ?? null;

            return t;
        }

        return super.create.apply(this, args) as GrammarAST;
    }

    public override dupNode(t: GrammarAST): GrammarAST {
        return t.dupNode();
    }

    public override errorNode(input: TokenStream, start: Token, stop: Token,
        e: RecognitionException): GrammarASTErrorNode {
        return new GrammarASTErrorNode(input, start, stop, e);
    }

    static {
        ClassFactory.createGrammarASTAdaptor = (input?: CharStream) => {
            return new GrammarASTAdaptor(input);
        };
    }
}
