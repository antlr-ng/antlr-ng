/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { BitSet } from "antlr4ng";

import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { Grammar } from "./Grammar.js";
import { LabelType } from "./LabelType.js";
import { GrammarAST } from "./ast/GrammarAST.js";

export class LabelElementPair {
    public label: GrammarAST;
    public element: GrammarAST;
    public type: LabelType;

    private static readonly tokenTypeForTokens = new BitSet();

    public constructor(g: Grammar, label: GrammarAST, element: GrammarAST, labelOp: number) {
        this.label = label;
        this.element = element;

        // Compute general case for label type.
        if (element.getFirstDescendantWithType(LabelElementPair.tokenTypeForTokens) !== null) {
            if (labelOp === ANTLRv4Parser.ASSIGN) {
                this.type = LabelType.TokenLabel;
            } else {
                this.type = LabelType.TokenListLabel;
            }
        } else if (element.getFirstDescendantWithType(ANTLRv4Parser.RULE_REF) !== null) {
            if (labelOp === ANTLRv4Parser.ASSIGN) {
                this.type = LabelType.RuleLabel;
            } else {
                this.type = LabelType.RuleListLabel;
            }
        }

        // Now reset if lexer and string.
        if (g.isLexer()) {
            if (element.getFirstDescendantWithType(ANTLRv4Parser.STRING_LITERAL) !== null) {
                if (labelOp === ANTLRv4Parser.ASSIGN) {
                    this.type = LabelType.LexerStringLabel;
                }

            }
        }
    }

    public toString(): string {
        return this.label.getText() + " " + this.type + " " + this.element.toString();
    }

    static {
        LabelElementPair.tokenTypeForTokens.set(ANTLRv4Parser.TOKEN_REF);
        LabelElementPair.tokenTypeForTokens.set(ANTLRv4Parser.STRING_LITERAL);
        LabelElementPair.tokenTypeForTokens.set(ANTLRv4Parser.WILDCARD);
    }
}
