/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { BitSet } from "antlr4ng";

import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { Grammar } from "./Grammar.js";
import { LabelType } from "./LabelType.js";
import { GrammarAST } from "./ast/GrammarAST.js";

export class LabelElementPair {
    public static readonly tokenTypeForTokens = new BitSet();

    public label: GrammarAST;
    public element: GrammarAST;
    public type: LabelType;

    public constructor(g: Grammar, label: GrammarAST, element: GrammarAST, labelOp: number) {
        this.label = label;
        this.element = element;
        // compute general case for label type
        if (element.getFirstDescendantWithType(LabelElementPair.tokenTypeForTokens) !== null) {
            if (labelOp === ANTLRv4Parser.ASSIGN) {
                this.type = LabelType.TokenLabel;
            } else {
                this.type = LabelType.TokenListLabel;
            }
        } else {
            if (element.getFirstDescendantWithType(ANTLRv4Parser.RULE_REF) !== null) {
                if (labelOp === ANTLRv4Parser.ASSIGN) {
                    this.type = LabelType.RuleLabel;
                } else {
                    this.type = LabelType.RuleListLabel;
                }

            }
        }

        // now reset if lexer and string
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
