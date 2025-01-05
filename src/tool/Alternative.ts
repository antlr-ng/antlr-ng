/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import type { IAlternative } from "../types.js";
import type { IAttribute } from "./IAttribute.js";
import { AttributeResolver } from "./AttributeResolver.js";
import { LabelElementPair } from "./LabelElementPair.js";
import { LabelType } from "./LabelType.js";
import { Rule } from "./Rule.js";
import { ActionAST } from "./ast/ActionAST.js";
import { AltAST } from "./ast/AltAST.js";
import { GrammarAST } from "./ast/GrammarAST.js";
import { TerminalAST } from "./ast/TerminalAST.js";

/** An outermost alternative for a rule.  We don't track inner alternatives. */
export class Alternative implements AttributeResolver, IAlternative {
    public rule: Rule;

    public ast: AltAST;

    /** What alternative number is this outermost alt? 1..n */
    public altNum: number;

    // token IDs, string literals in this alt
    public tokenRefs = new Map<string, TerminalAST[]>();

    // does not include labels
    public tokenRefsInActions = new Map<string, GrammarAST[]>();

    // all rule refs in this alt
    public ruleRefs = new Map<string, GrammarAST[]>();

    // does not include labels
    public ruleRefsInActions = new Map<string, GrammarAST[]>();

    /** A list of all LabelElementPair attached to tokens like id=ID, ids+=ID */
    public labelDefs = new Map<string, LabelElementPair[]>();

    // track all token, rule, label refs in rewrite (right of ->)
    //public List<GrammarAST> rewriteElements = new ArrayList<GrammarAST>();

    /**
     * Track all executable actions other than named actions like @init
     *  and catch/finally (not in an alt). Also tracks predicates, rewrite actions.
     *  We need to examine these actions before code generation so
     *  that we can detect refs to $rule.attr etc...
     *
     *  This tracks per alt
     */
    public actions = new Array<ActionAST>();

    public constructor(r: Rule, altNum: number) {
        this.rule = r;
        this.altNum = altNum;
    }

    public resolvesToToken(x: string, node: ActionAST): boolean {
        if (this.tokenRefs.has(x)) {
            return true;
        }

        const anyLabelDef = this.getAnyLabelDef(x);
        if (anyLabelDef !== null && anyLabelDef.type === LabelType.TokenLabel) {
            return true;
        }

        return false;
    }

    public resolvesToAttributeDict(x: string, node: ActionAST): boolean {
        if (this.resolvesToToken(x, node)) {
            return true;
        }

        if (this.ruleRefs.has(x)) {
            return true;
        }
        // rule ref in this alt?
        const anyLabelDef = this.getAnyLabelDef(x);
        if (anyLabelDef !== null && anyLabelDef.type === LabelType.RuleLabel) {
            return true;
        }

        return false;
    }

    /**
       $x Attribute: rule arguments, return values, predefined rule prop.
     */
    public resolveToAttribute(x: string, node: ActionAST): IAttribute | null;
    /**
     * $x.y, x can be surrounding rule, token/rule/label ref. y is visible
     *  attr in that dictionary.  Can't see args on rule refs.
     */
    public resolveToAttribute(x: string, y: string, node: ActionAST): IAttribute | null;
    public resolveToAttribute(...args: unknown[]): IAttribute | null {
        if (args.length === 2) {
            const [x, node] = args as [string, ActionAST];

            return this.rule.resolveToAttribute(x, node); // reuse that code
        }

        const [x, y, _node] = args as [string, string, ActionAST];

        if (this.tokenRefs.get(x)) { // token ref in this alt?
            return this.rule.getPredefinedScope(LabelType.TokenLabel)?.get(y) ?? null;
        }

        if (this.ruleRefs.get(x)) { // rule ref in this alt?
            // look up rule, ask it to resolve y (must be retval or predefined)
            return this.rule.g.getRule(x)!.resolveRetvalOrProperty(y);
        }

        const anyLabelDef = this.getAnyLabelDef(x);
        if (anyLabelDef !== null && anyLabelDef.type === LabelType.RuleLabel) {
            return this.rule.g.getRule(anyLabelDef.element.getText())!.resolveRetvalOrProperty(y);
        } else {
            if (anyLabelDef !== null) {
                const scope = this.rule.getPredefinedScope(anyLabelDef.type);
                if (scope === null) {
                    return null;
                }

                return scope.get(y);
            }
        }

        return null;
    }

    public resolvesToLabel(x: string, node: ActionAST): boolean {
        const anyLabelDef = this.getAnyLabelDef(x);

        return anyLabelDef !== null &&
            (anyLabelDef.type === LabelType.TokenLabel ||
                anyLabelDef.type === LabelType.RuleLabel);
    }

    public resolvesToListLabel(x: string, node: ActionAST): boolean {
        const anyLabelDef = this.getAnyLabelDef(x);

        return anyLabelDef !== null &&
            (anyLabelDef.type === LabelType.RuleListLabel ||
                anyLabelDef.type === LabelType.TokenListLabel);
    }

    public getAnyLabelDef(x: string): LabelElementPair | null {
        const labels = this.labelDefs.get(x);
        if (labels) {
            return labels[0];
        }

        return null;
    }

    /** x can be rule ref or rule label. */
    public resolveToRule(x: string): Rule | null {
        if (this.ruleRefs.get(x)) {
            return this.rule.g.getRule(x);
        }

        const anyLabelDef = this.getAnyLabelDef(x);
        if (anyLabelDef && anyLabelDef.type === LabelType.RuleLabel) {
            return this.rule.g.getRule(anyLabelDef.element.getText());
        }

        return null;
    }
}
