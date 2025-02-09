/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { type IComparable } from "antlr4ng";

import { MurmurHash } from "../support/MurmurHash.js";
import type { IRule } from "../types.js";
import { Alternative } from "./Alternative.js";
import { AttributeDict } from "./AttributeDict.js";
import { Grammar } from "./Grammar.js";
import { IAttribute } from "./IAttribute.js";
import { IAttributeResolver } from "./IAttributeResolver.js";
import { LabelElementPair } from "./LabelElementPair.js";
import { LabelType } from "./LabelType.js";
import { ActionAST } from "./ast/ActionAST.js";
import { AltAST } from "./ast/AltAST.js";
import { GrammarAST } from "./ast/GrammarAST.js";
import { PredAST } from "./ast/PredAST.js";
import { RuleAST } from "./ast/RuleAST.js";

export class Rule implements IAttributeResolver, IComparable, IRule {
    public static readonly validLexerCommands = new Set<string>([
        "mode", "pushMode", "type", "channel", "popMode", "skip", "more"
    ]);

    public readonly name: string;
    public modifiers?: GrammarAST[];

    public ast: RuleAST;
    public args?: AttributeDict;
    public retvals?: AttributeDict;
    public locals?: AttributeDict;

    /** In which grammar does this rule live? */
    public readonly g: Grammar;

    /** If we're in a lexer grammar, we might be in a mode. */
    public readonly mode?: string;

    /** If null then use value from global option that is false by default. */
    public readonly caseInsensitive: boolean;

    /**
     * Map a name to an action for this rule like @init {...}. The code generator will use this to fill holes in the
     * rule template. I track the AST node for the action in case I need the line number for errors.
     */
    public namedActions = new Map<string, ActionAST>();

    /**
     * Track exception handlers; points at "catch" node of (catch exception action) don't track finally action.
     */
    public exceptions = new Array<GrammarAST>();

    /**
     * Track all executable actions other than named actions like @init and catch/finally (not in an alt). Also tracks
     * predicates, rewrite actions. We need to examine these actions before code generation so that we can detect
     * refs to $rule.attr etc...
     *
     * This tracks per rule. Alternative objs also track per alt.
     */
    public actions = new Array<ActionAST>();

    /** Set by SymbolCollector. */
    public finallyAction?: ActionAST;

    public readonly numberOfAlts: number;

    /** Nobody calls us. */
    public isStartRule = true;

    /** 1..n alts */
    public alt: Alternative[] = [];

    /** All rules have unique index 0..n - 1. */
    public index: number;

    /** If lexer; 0..n-1 for n actions in a rule. */
    public actionIndex = -1;

    public constructor(g: Grammar, name: string, ast: RuleAST, numberOfAlts: number, lexerMode?: string,
        caseInsensitive?: boolean) {
        caseInsensitive ??= false;

        this.g = g;
        this.name = name;
        this.ast = ast;
        this.numberOfAlts = numberOfAlts;

        this.alt = new Array<Alternative>(numberOfAlts + 1);
        for (let i = 1; i <= numberOfAlts; i++) {
            this.alt[i] = new Alternative(this, i);
        }

        this.mode = lexerMode;
        this.caseInsensitive = caseInsensitive;
    }

    public hashCode(): number {
        let hash = MurmurHash.initialize();
        hash = hash * 31 + MurmurHash.update(hash, this.name);
        hash = hash * 31 + this.numberOfAlts;

        return hash;
    }

    public defineActionInAlt(currentAlt: number, actionAST: ActionAST): void {
        this.actions.push(actionAST);
        this.alt[currentAlt].actions.push(actionAST);
        if (this.g.isLexer()) {
            this.defineLexerAction(actionAST);
        }
    }

    /**
     * Lexer actions are numbered across rules 0..n - 1.
     *
     * @param actionAST The action to define.
     */
    public defineLexerAction(actionAST: ActionAST): void {
        this.actionIndex = this.g.lexerActions.size;
        if (!this.g.lexerActions.has(actionAST)) {
            this.g.lexerActions.set(actionAST, this.actionIndex);
        }
    }

    public definePredicateInAlt(currentAlt: number, predAST: PredAST): void {
        this.actions.push(predAST);
        this.alt[currentAlt].actions.push(predAST);
        if (!this.g.sempreds.has(predAST)) {
            this.g.sempreds.set(predAST, this.g.sempreds.size);
        }
    }

    public resolveRetvalOrProperty(y: string): IAttribute | null {
        if (this.retvals) {
            const a = this.retvals.get(y);
            if (a) {
                return a;
            }
        }

        const d = this.getPredefinedScope(LabelType.RuleLabel);

        return d?.get(y) ?? null;
    }

    public getTokenRefs(): Set<string> {
        const refs = new Set<string>();
        for (let i = 1; i <= this.numberOfAlts; i++) {
            for (const key of this.alt[i].tokenRefs.keys()) {
                refs.add(key);
            }
        }

        return refs;
    }

    public getElementLabelNames(): Set<string> | null {
        const refs = new Set<string>();
        for (let i = 1; i <= this.numberOfAlts; i++) {
            for (const key of this.alt[i].labelDefs.keys()) {
                refs.add(key);
            }
        }

        if (refs.size === 0) {
            return null;
        }

        return refs;
    }

    public getElementLabelDefs(): Map<string, LabelElementPair[]> {
        const defs = new Map<string, LabelElementPair[]>();
        for (let i = 1; i <= this.numberOfAlts; i++) {
            for (const pairs of this.alt[i].labelDefs.values()) {
                for (const p of pairs) {
                    const text = p.label.getText();
                    let list = defs.get(text);
                    if (!list) {
                        list = [];
                        defs.set(text, list);
                    }
                    list.push(p);
                }
            }
        }

        return defs;
    }

    public hasAltSpecificContexts(): boolean {
        return this.getAltLabels() !== null;
    }

    /**
     * Used for recursive rules (subclass), which have 1 alt, but many original alts.
     *
     * @returns The original alt number for this rule.
     */
    public getOriginalNumberOfAlts(): number {
        return this.numberOfAlts;
    }

    /**
     * Gets `#` labels. The keys of the map are the labels applied to outer alternatives of a lexer rule, and the
     * values are collections of pairs (alternative number and {@link AltAST}) identifying the alternatives with
     * this label. Unlabeled alternatives are not included in the result.
     *
     * @returns A map of `#` labels to their AST nodes they are applied to, or `null` if no such labels are present.
     */
    public getAltLabels(): Map<string, Array<[number, AltAST]>> | null {
        const labels = new Map<string, Array<[number, AltAST]>>();
        for (let i = 1; i <= this.numberOfAlts; i++) {
            const altLabel = this.alt[i].ast.altLabel;
            if (altLabel) {
                let list = labels.get(altLabel.getText());
                if (!list) {
                    list = [];
                    labels.set(altLabel.getText(), list);
                }

                list.push([i, this.alt[i].ast]);
            }
        }

        if (labels.size === 0) {
            return null;
        }

        return labels;
    }

    public getUnlabeledAltASTs(): AltAST[] | null {
        const alts = new Array<AltAST>();
        for (let i = 1; i <= this.numberOfAlts; i++) {
            const altLabel = this.alt[i].ast.altLabel;
            if (!altLabel) {
                alts.push(this.alt[i].ast);
            }
        }

        if (alts.length === 0) {
            return null;
        }

        return alts;
    }

    /** $x Attribute: rule arguments, return values, predefined rule prop. */
    public resolveToAttribute(x: string, node: ActionAST | null): IAttribute | null;
    /** $x.y Attribute: x is surrounding rule, label ref (in any alts). */
    public resolveToAttribute(x: string, y: string, node: ActionAST | null): IAttribute | null;
    public resolveToAttribute(...args: unknown[]): IAttribute | null {
        if (args.length === 3) {
            const [x, y, _node] = args as [string, string, ActionAST | null];

            const anyLabelDef = this.getAnyLabelDef(x);
            if (anyLabelDef !== null) {
                if (anyLabelDef.type === LabelType.RuleLabel) {
                    return this.g.getRule(anyLabelDef.element.getText())?.resolveRetvalOrProperty(y) ?? null;
                } else {
                    const scope = this.getPredefinedScope(anyLabelDef.type);
                    if (scope === null) {
                        return null;
                    }

                    return scope.get(y);
                }
            }

            return null;
        }

        const [x, _node] = args as [string, ActionAST | null];

        if (this.args) {
            const a = this.args.get(x);
            if (a) {
                return a;
            }

        }

        if (this.retvals) {
            const a = this.retvals.get(x);
            if (a) {
                return a;
            }

        }

        if (this.locals) {
            const a = this.locals.get(x);
            if (a) {
                return a;
            }
        }

        const properties = this.getPredefinedScope(LabelType.RuleLabel);

        return properties?.get(x) ?? null;
    }

    public resolvesToLabel(x: string, node: ActionAST): boolean {
        const anyLabelDef = this.getAnyLabelDef(x);

        return anyLabelDef !== null
            && (anyLabelDef.type === LabelType.RuleLabel || anyLabelDef.type === LabelType.TokenLabel);
    }

    public resolvesToListLabel(x: string, node: ActionAST): boolean {
        const anyLabelDef = this.getAnyLabelDef(x);

        return anyLabelDef !== null
            && (anyLabelDef.type === LabelType.RuleListLabel || anyLabelDef.type === LabelType.TokenListLabel);
    }

    public resolvesToToken(x: string, node: ActionAST): boolean {
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

        return false;
    }

    public resolveToRule(x: string): Rule | null {
        if (x === this.name) {
            return this;
        }

        const anyLabelDef = this.getAnyLabelDef(x);
        if (anyLabelDef !== null && anyLabelDef.type === LabelType.RuleLabel) {
            return this.g.getRule(anyLabelDef.element.getText()) ?? null;
        }

        return this.g.getRule(x);
    }

    public getAnyLabelDef(x: string): LabelElementPair | null {
        const labels = this.getElementLabelDefs().get(x);
        if (labels) {
            return labels[0] ?? null;
        }

        return null;
    }

    public getPredefinedScope(labelType: LabelType): AttributeDict | null {
        const grammarLabelKey = this.g.getTypeString() + ":" + labelType;

        return Grammar.grammarAndLabelRefTypeToScope.get(grammarLabelKey) ?? null;
    }

    public isFragment(): boolean {
        if (!this.modifiers) {
            return false;
        }

        for (const a of this.modifiers) {
            if (a.getText() === "fragment") {
                return true;
            }

        }

        return false;
    }

    public equals(obj: unknown): boolean {
        if (this === obj) {
            return true;
        }

        if (!(obj instanceof Rule)) {
            return false;
        }

        return this.name === obj.name;
    }

    public toString(): string {
        let buf = "Rule{name=" + this.name;
        if (this.args) {
            buf += ", args=" + JSON.stringify(this.args, null, 2);
        }

        if (this.retvals) {
            buf += ", retvals=" + JSON.stringify(this.retvals, null, 4);
        }

        return buf + "}";
    }
}
