/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, type Token } from "antlr4ng";

import { ActionSplitter } from "../generated/ActionSplitter.js";

import { IActionSplitterListener } from "../parse/IActionSplitterListener.js";
import { Alternative } from "../tool/Alternative.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { IssueCode } from "../tool/Issues.js";
import { Grammar } from "../tool/Grammar.js";
import { LabelType } from "../tool/LabelType.js";
import { Rule } from "../tool/Rule.js";

/** Trigger checks for various kinds of attribute expressions. no side-effects. */
export class AttributeChecks implements IActionSplitterListener {
    public g: Grammar;

    /** `null` if action outside of rule */
    public r: Rule | null;

    /** `null` if action outside of alt; could be in rule. */
    public alt: Alternative | null;

    public node: ActionAST;
    public actionToken?: Token;

    public constructor(g: Grammar, r: Rule | null, alt: Alternative | null, node: ActionAST, actionToken?: Token) {
        this.g = g;
        this.r = r;
        this.alt = alt;
        this.node = node;
        this.actionToken = actionToken;
    }

    public static checkAllAttributeExpressions(g: Grammar): void {
        for (const act of g.namedActions.values()) {
            const checker = new AttributeChecks(g, null, null, act, act.token);
            checker.examineAction();
        }

        for (const r of g.rules.values()) {
            for (const a of r.namedActions.values()) {
                const checker = new AttributeChecks(g, r, null, a, a.token);
                checker.examineAction();
            }

            for (let i = 1; i <= r.numberOfAlts; i++) {
                const alt = r.alt[i];
                for (const a of alt.actions) {
                    const checker = new AttributeChecks(g, r, alt, a, a.token);
                    checker.examineAction();
                }
            }

            for (const e of r.exceptions) {
                const a = e.children[1] as ActionAST;
                const checker = new AttributeChecks(g, r, null, a, a.token);
                checker.examineAction();
            }

            if (r.finallyAction) {
                const checker = new AttributeChecks(g, r, null, r.finallyAction, r.finallyAction.token);
                checker.examineAction();
            }
        }
    }

    public examineAction(): void {
        const input = CharStream.fromString(this.actionToken!.text!);
        const splitter = new ActionSplitter(input);

        // Forces eval, triggers listener methods.
        this.node.chunks = splitter.getActionTokens(this, this.actionToken);
    }

    // `$x.y`
    public qualifiedAttr(expr: string, x: Token, y: Token): void {
        if (this.g.isLexer()) {
            this.g.tool.errorManager.grammarError(IssueCode.AttributeInLexerAction, this.g.fileName, x,
                x.text! + "." + y.text!, expr);

            return;
        }

        if (this.node.resolver.resolveToAttribute(x.text!, this.node) !== null) {
            // Must be a member access to a predefined attribute like `$ctx.foo`.
            this.attr(expr, x);

            return;
        }

        if (this.node.resolver.resolveToAttribute(x.text!, y.text!, this.node) === null) {
            const ruleRef = this.isolatedRuleRef(x.text!);
            if (ruleRef) {
                if (ruleRef.args?.get(y.text!) !== null) {
                    this.g.tool.errorManager.grammarError(IssueCode.InvalidRuleParameterRef, this.g.fileName, y,
                        y.text!, ruleRef.name, expr);
                } else {
                    this.g.tool.errorManager.grammarError(IssueCode.UnknownRuleAttribute, this.g.fileName, y, y.text!,
                        ruleRef.name, expr);
                }
            } else if (!this.node.resolver.resolvesToAttributeDict(x.text!, this.node)) {
                this.g.tool.errorManager.grammarError(IssueCode.UnknownSimpleAttribute, this.g.fileName, x, x.text!,
                    expr);
            } else {
                this.g.tool.errorManager.grammarError(IssueCode.UnknownAtrributeInScopoe, this.g.fileName, y, y.text!,
                    expr);
            }
        }
    }

    public setAttr(expr: string, x: Token, rhs: Token): void {
        if (this.g.isLexer()) {
            this.g.tool.errorManager.grammarError(IssueCode.AttributeInLexerAction, this.g.fileName, x, x.text!,
                expr);

            return;
        }

        if (this.node.resolver.resolveToAttribute(x.text!, this.node) === null) {
            let errorType = IssueCode.UnknownSimpleAttribute;
            if (this.node.resolver.resolvesToListLabel(x.text!, this.node)) {
                // $ids for ids+=ID etc...
                errorType = IssueCode.AssignmentToListLabel;
            }

            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, x, x.text, expr);
        }

        new AttributeChecks(this.g, this.r, this.alt, this.node, rhs).examineAction();
    }

    public attr(expr: string, x: Token): void {
        if (this.g.isLexer()) {
            this.g.tool.errorManager.grammarError(IssueCode.AttributeInLexerAction, this.g.fileName, x, x.text!,
                expr);

            return;
        }

        if (this.node.resolver.resolveToAttribute(x.text!, this.node) === null) {
            if (this.node.resolver.resolvesToToken(x.text!, this.node)) {
                // $ID for token ref or label of token.
                return;
            }

            if (this.node.resolver.resolvesToListLabel(x.text!, this.node)) {
                // $ids for ids+=ID etc...
                return;
            }

            if (this.isolatedRuleRef(x.text!) !== null) {
                this.g.tool.errorManager.grammarError(IssueCode.IsolatedRuleRef, this.g.fileName, x, x.text, expr);

                return;
            }
            this.g.tool.errorManager.grammarError(IssueCode.UnknownSimpleAttribute, this.g.fileName, x, x.text,
                expr);
        }
    }

    public nonLocalAttr(expr: string, x: Token, y: Token): void {
        const r = this.g.getRule(x.text!);
        if (r === null) {
            this.g.tool.errorManager.grammarError(IssueCode.UndefinedRuleInNonlocalRef, this.g.fileName, x, x.text!,
                y, expr);
        } else if (r.resolveToAttribute(y.text!, null) === null) {
            this.g.tool.errorManager.grammarError(IssueCode.UnknownRuleAttribute, this.g.fileName, y, y.text, x.text,
                expr);
        }
    }

    public setNonLocalAttr(expr: string, x: Token, y: Token, rhs: string): void {
        const r = this.g.getRule(x.text!);
        if (r === null) {
            this.g.tool.errorManager.grammarError(IssueCode.UndefinedRuleInNonlocalRef, this.g.fileName, x, x.text!,
                y.text, expr);
        } else if (r.resolveToAttribute(y.text!, null) === null) {
            this.g.tool.errorManager.grammarError(IssueCode.UnknownRuleAttribute, this.g.fileName, y, y.text, x.text,
                expr);
        }
    }

    public text(text: string): void { /**/ }
    public templateInstance(expr: string): void { /**/ }
    public indirectTemplateInstance(expr: string): void { /**/ }
    public setExprAttribute(expr: string): void { /**/ }
    public setSTAttribute(expr: string): void { /**/ }
    public templateExpr(expr: string): void { /**/ }

    private isolatedRuleRef(x: string): Rule | null {
        if (this.node.resolver instanceof Grammar) {
            return null;
        }

        if (x === this.r?.name) {
            return this.r;
        }

        let labels = null;
        if (this.node.resolver instanceof Rule) {
            labels = this.r!.getElementLabelDefs().get(x);
        } else if (this.node.resolver instanceof Alternative) {
            labels = (this.node.resolver).labelDefs.get(x);
        }

        if (labels) { // it's a label ref. is it a rule label?
            const anyLabelDef = labels[0];
            if (anyLabelDef.type === LabelType.RuleLabel) {
                return this.g.getRule(anyLabelDef.element.getText());
            }
        }

        if (this.node.resolver instanceof Alternative) {
            if (this.node.resolver.ruleRefs.get(x)) {
                return this.g.getRule(x);
            }
        }

        return null;
    }

}
