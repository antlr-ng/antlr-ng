/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import type { IAlternative } from "../types.js";
import type { IAttribute } from "./IAttribute.js";
import type { IAttributeResolver } from "./IAttributeResolver.js";
import type { LabelElementPair } from "./LabelElementPair.js";
import { LabelType } from "./LabelType.js";
import type { Rule } from "./Rule.js";
import type { ActionAST } from "./ast/ActionAST.js";
import type { AltAST } from "./ast/AltAST.js";
import type { GrammarAST } from "./ast/GrammarAST.js";
import type { TerminalAST } from "./ast/TerminalAST.js";

/** An outermost alternative for a rule.  We don't track inner alternatives. */
export class Alternative implements IAttributeResolver, IAlternative {
    public ast: AltAST;

    /** Token IDs, string literals in this alt. */
    public readonly tokenRefs = new Map<string, TerminalAST[]>();

    /** Does not include labels. */
    public readonly tokenRefsInActions = new Map<string, GrammarAST[]>();

    /** All rule refs in this alt. */
    public readonly ruleRefs = new Map<string, GrammarAST[]>();

    // does not include labels
    public readonly ruleRefsInActions = new Map<string, GrammarAST[]>();

    /** A list of all LabelElementPair attached to tokens like id=ID, ids+=ID */
    public readonly labelDefs = new Map<string, LabelElementPair[]>();

    /**
     * Track all executable actions other than named actions like `@init` and catch/finally (not in an alt).
     * Also tracks predicates, rewrite actions. We need to examine these actions before code generation so
     * that we can detect refs to $rule.attr etc...
     *
     * This tracks per alt.
     */
    public actions = new Array<ActionAST>();

    /** What alternative number is this outermost alt? Used in templates. */
    public altNum: number;

    private rule: Rule;

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
