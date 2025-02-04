/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, type Token } from "antlr4ng";

import { ActionSplitter } from "../generated/ActionSplitter.js";

import type { IActionSplitterListener } from "../parse/IActionSplitterListener.js";
import { Alternative } from "../tool/Alternative.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { Grammar } from "../tool/Grammar.js";
import { Rule } from "../tool/Rule.js";

/** Find token and rule refs plus refs to them in actions; side-effect: update Alternatives. */
export class ActionSniffer implements IActionSplitterListener {
    public g: Grammar;
    public r: Rule;
    public alt: Alternative;
    public node: ActionAST;

    /** Token within action. */
    public actionToken: Token;

    public constructor(g: Grammar, r: Rule, alt: Alternative, node: ActionAST, actionToken: Token) {
        this.g = g;
        this.r = r;
        this.alt = alt;
        this.node = node;
        this.actionToken = actionToken;
    }

    public examineAction(): void {
        const input = CharStream.fromString(this.actionToken.text!);
        const splitter = new ActionSplitter(input);

        // Forces eval, triggers listener methods.
        this.node.chunks = splitter.getActionTokens(this, this.actionToken);
    }

    public processNested(actionToken: string): void {
        const input = CharStream.fromString(actionToken);
        const splitter = new ActionSplitter(input);

        // Forces eval, triggers listener methods.
        splitter.getActionTokens(this, this.actionToken);
    }

    public attr(expr: string, x: Token): void {
        this.trackRef(x.text!);
    }

    public qualifiedAttr(expr: string, x: Token, y: Token): void {
        this.trackRef(x.text!);
    }

    public setAttr(expr: string, x: Token, rhs: Token): void {
        this.trackRef(x.text!);
        this.processNested(rhs.text!);
    }

    public setNonLocalAttr(expr: string, x: Token, y: Token, rhs: string): void {
        this.processNested(rhs);
    }

    public nonLocalAttr(): void { /**/ }
    public text(): void { /**/ }

    public trackRef(x: string): void {
        const xRefs = this.alt.tokenRefs.get(x);
        if (xRefs) {
            const list = this.alt.tokenRefsInActions.get(x);
            if (!list) {
                this.alt.tokenRefsInActions.set(x, [this.node]);
            } else {
                list.push(this.node);
            }
        }

        const rRefs = this.alt.ruleRefs.get(x);
        if (rRefs) {
            const list = this.alt.ruleRefsInActions.get(x);
            if (!list) {
                this.alt.ruleRefsInActions.set(x, [this.node]);
            } else {
                list.push(this.node);
            }
        }
    }
}
