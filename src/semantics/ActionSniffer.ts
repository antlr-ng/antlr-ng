/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, type Token } from "antlr4ng";

import { ActionSplitter } from "../generated/ActionSplitter.js";

import { Alternative } from "../tool/Alternative.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { Grammar } from "../tool/Grammar.js";
import { Rule } from "../tool/Rule.js";
import { BlankActionSplitterListener } from "./BlankActionSplitterListener.js";

/**
 * Find token and rule refs plus refs to them in actions; side-effect: update Alternatives
 */
export class ActionSniffer extends BlankActionSplitterListener {
    public g: Grammar;
    public r: Rule; // null if action outside of rule
    public alt: Alternative; // null if action outside of alt; could be in rule
    public node: ActionAST;
    public actionToken: Token; // token within action

    public constructor(g: Grammar, r: Rule, alt: Alternative, node: ActionAST, actionToken: Token) {
        super();

        this.g = g;
        this.r = r;
        this.alt = alt;
        this.node = node;
        this.actionToken = actionToken;
    }

    public examineAction(): void {
        const input = CharStream.fromString(this.actionToken.text!);
        //input.setLine(this.actionToken.line);
        //input.setCharPositionInLine(this.actionToken.getCharPositionInLine());
        const splitter = new ActionSplitter(input);

        // forces eval, triggers listener methods
        this.node.chunks = splitter.getActionTokens(this, this.actionToken);
    }

    public processNested(actionToken: string): void {
        const input = CharStream.fromString(actionToken);
        //input.setLine(actionToken.getLine());
        //input.setCharPositionInLine(actionToken.getCharPositionInLine());
        const splitter = new ActionSplitter(input);

        // forces eval, triggers listener methods
        splitter.getActionTokens(this, this.actionToken);
    }

    public override attr(expr: string, x: Token): void {
        this.trackRef(x.text!);
    }

    public override qualifiedAttr(expr: string, x: Token, y: Token): void {
        this.trackRef(x.text!);
    }

    public override setAttr(expr: string, x: Token, rhs: Token): void {
        this.trackRef(x.text!);
        this.processNested(rhs.text!);
    }

    public override setNonLocalAttr(expr: string, x: Token, y: Token, rhs: string): void {
        this.processNested(rhs);
    }

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
