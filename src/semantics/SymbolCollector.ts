/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

import { GrammarTreeVisitor } from "../tree-walkers/GrammarTreeVisitor.js";

import { ActionAST } from "../tool/ast/ActionAST.js";
import { AltAST } from "../tool/ast/AltAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { GrammarRootAST } from "../tool/ast/GrammarRootAST.js";
import { PredAST } from "../tool/ast/PredAST.js";
import { RuleAST } from "../tool/ast/RuleAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";
import { Grammar } from "../tool/Grammar.js";
import { LabelElementPair } from "../tool/LabelElementPair.js";
import { Rule } from "../tool/Rule.js";

/**
 * Collects (create) rules, terminals, strings, actions, scopes etc... from AST side-effects: sets resolver field
 * of asts for actions and defines predicates via definePredicateInAlt(), collects actions and stores in alts.
 * TODO: remove side-effects!
 */
export class SymbolCollector extends GrammarTreeVisitor {
    /** which grammar are we checking */
    public g: Grammar;

    // stuff to collect
    public ruleRefs = new Array<GrammarAST>();
    public qualifiedRuleRefs = new Array<GrammarAST>();
    public terminals = new Array<GrammarAST>();
    public tokenIDRefs = new Array<GrammarAST>();
    public strings = new Set<string>();
    public tokensDefs = new Array<GrammarAST>();
    public channelDefs = new Array<GrammarAST>();

    // context
    public currentRule: Rule | null = null;

    /** Track action name node in @parser::members {...} or @members {...} */
    public readonly namedActions = new Array<GrammarAST>();

    public constructor(g: Grammar) {
        super();

        this.g = g;
    }

    public process(ast: GrammarAST): void {
        this.visitGrammar(ast as GrammarRootAST);
    }

    public override globalNamedAction(scope: GrammarAST, id: GrammarAST, action: ActionAST): void {
        action.setScope(scope);
        this.namedActions.push(id.getParent() as GrammarAST);
        action.resolver = this.g;
    }

    public override defineToken(id: GrammarAST): void {
        this.terminals.push(id);
        this.tokenIDRefs.push(id);
        this.tokensDefs.push(id);
    }

    public override defineChannel(id: GrammarAST): void {
        this.channelDefs.push(id);
    }

    public override discoverRule(rule: RuleAST, id: GrammarAST, modifiers: GrammarAST[], arg: ActionAST,
        returns: ActionAST, throws: GrammarAST, options: GrammarAST, locals: ActionAST, actions: GrammarAST[],
        block: GrammarAST): void {
        this.currentRule = this.g.getRule(id.getText());
    }

    public override discoverLexerRule(rule: RuleAST, id: GrammarAST, modifiers: GrammarAST[], options: GrammarAST,
        block: GrammarAST): void {
        this.currentRule = this.g.getRule(id.getText());
    }

    public override discoverOuterAlt(alt: AltAST): void {
        this.currentRule!.alt[this.currentOuterAltNumber].ast = alt;
    }

    public override actionInAlt(action: ActionAST): void {
        this.currentRule!.defineActionInAlt(this.currentOuterAltNumber, action);
        action.resolver = this.currentRule!.alt[this.currentOuterAltNumber];
    }

    public override sempredInAlt(pred: PredAST): void {
        this.currentRule!.definePredicateInAlt(this.currentOuterAltNumber, pred);
        pred.resolver = this.currentRule!.alt[this.currentOuterAltNumber];
    }

    public override ruleCatch(arg: GrammarAST, action: ActionAST): void {
        const catchMe = action.getParent() as GrammarAST;
        this.currentRule!.exceptions.push(catchMe);
        action.resolver = this.currentRule!;
    }

    public override finallyAction(action: ActionAST): void {
        this.currentRule!.finallyAction = action;
        action.resolver = this.currentRule!;
    }

    public override label(op: GrammarAST, id: GrammarAST, element: GrammarAST): void {
        const lp = new LabelElementPair(this.g, id, element, op.getType());

        const list = this.currentRule!.alt[this.currentOuterAltNumber].labelDefs.get(id.getText());
        if (list) {
            list.push(lp);
        } else {
            this.currentRule!.alt[this.currentOuterAltNumber].labelDefs.set(id.getText(), [lp]);
        }
    }

    public override stringRef(ref: TerminalAST): void {
        this.terminals.push(ref);
        this.strings.add(ref.getText());
        if (this.currentRule) {
            const list = this.currentRule.alt[this.currentOuterAltNumber].tokenRefs.get(ref.getText());
            if (list) {
                list.push(ref);
            } else {
                this.currentRule.alt[this.currentOuterAltNumber].tokenRefs.set(ref.getText(), [ref]);
            }
        }
    }

    public override tokenRef(ref: TerminalAST): void {
        this.terminals.push(ref);
        this.tokenIDRefs.push(ref);
        if (this.currentRule) {
            const list = this.currentRule.alt[this.currentOuterAltNumber].tokenRefs.get(ref.getText());
            if (list) {
                list.push(ref);
            } else {
                this.currentRule.alt[this.currentOuterAltNumber].tokenRefs.set(ref.getText(), [ref]);
            }
        }
    }

    public override ruleRef(ref: GrammarAST, arg: ActionAST): void {
        this.ruleRefs.push(ref);
        if (this.currentRule !== null) {
            const list = this.currentRule.alt[this.currentOuterAltNumber].ruleRefs.get(ref.getText(),);
            if (list) {
                list.push(ref);
            } else {
                this.currentRule.alt[this.currentOuterAltNumber].ruleRefs.set(ref.getText(), [ref]);
            }
        }
    }

    public override grammarOption(_id: GrammarAST, valueAST: GrammarAST): void {
        this.setActionResolver(valueAST);
    }

    public override ruleOption(_id: GrammarAST, valueAST: GrammarAST): void {
        this.setActionResolver(valueAST);
    }

    public override blockOption(_id: GrammarAST, valueAST: GrammarAST): void {
        this.setActionResolver(valueAST);
    }

    public override elementOption(t: GrammarASTWithOptions): GrammarTreeVisitor.elementOption_return;
    public override elementOption(t: GrammarASTWithOptions, id: GrammarAST, valueAST: GrammarAST): void;
    public override elementOption(...args: unknown[]): GrammarTreeVisitor.elementOption_return | void {
        if (args.length === 3) {
            this.setActionResolver(args[2] as GrammarAST);
        } else {
            return super.elementOption(args[0] as GrammarASTWithOptions);
        }
    }

    /** In case of option id={...}, set resolve in case they use $foo */
    private setActionResolver(valueAST: GrammarAST): void {
        if (valueAST instanceof ActionAST) {
            (valueAST).resolver = this.currentRule!.alt[this.currentOuterAltNumber];
        }
    }
}
