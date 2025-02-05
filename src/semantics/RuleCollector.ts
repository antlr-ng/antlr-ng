/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GrammarTreeVisitor } from "../tree/walkers/GrammarTreeVisitor.js";

import { MultiMap } from "stringtemplate4ts";
import { LeftRecursiveRuleAnalyzer } from "../analysis/LeftRecursiveRuleAnalyzer.js";
import { DictType } from "../misc/types.js";
import { Utils } from "../misc/Utils.js";
import { ScopeParser } from "../parse/ScopeParser.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { AltAST } from "../tool/ast/AltAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { GrammarRootAST } from "../tool/ast/GrammarRootAST.js";
import { RuleAST } from "../tool/ast/RuleAST.js";
import { Grammar } from "../tool/Grammar.js";
import { LeftRecursiveRule } from "../tool/LeftRecursiveRule.js";
import { Rule } from "../tool/Rule.js";

export class RuleCollector extends GrammarTreeVisitor {

    /** Which grammar are we checking? */
    public g: Grammar;

    public nameToRuleMap = new Map<string, Rule>();
    public ruleToAltLabels = new MultiMap<string, GrammarAST>();
    public altLabelToRuleName = new Map<string, string>();
    private grammarCaseInsensitive = false;

    public constructor(g: Grammar) {
        super(g.tool.errorManager);

        this.g = g;
    }

    public process(ast: GrammarRootAST): void {
        this.visitGrammar(ast);
    }

    public override discoverRule(rule: RuleAST, id: GrammarAST, modifiers: GrammarAST[], arg: ActionAST | undefined,
        returns: ActionAST | undefined, thrws: GrammarAST, options: GrammarAST, locals: ActionAST | undefined,
        actions: GrammarAST[], block: GrammarAST): void {
        const numAlts = block.getChildCount();
        let r: Rule;
        if (LeftRecursiveRuleAnalyzer.hasImmediateRecursiveRuleRefs(rule, id.getText())) {
            r = new LeftRecursiveRule(this.g, id.getText(), rule);
        } else {
            r = new Rule(this.g, id.getText(), rule, numAlts);
        }

        this.nameToRuleMap.set(r.name, r);

        if (arg !== undefined) {
            r.args = ScopeParser.parseTypedArgList(arg, arg.getText(), this.g);
            r.args.type = DictType.Argument;
            r.args.ast = arg;
            arg.resolver = r.alt[this.currentOuterAltNumber];
        }

        if (returns !== undefined) {
            r.retvals = ScopeParser.parseTypedArgList(returns, returns.getText(), this.g);
            r.retvals.type = DictType.Return;
            r.retvals.ast = returns;
        }

        if (locals !== undefined) {
            r.locals = ScopeParser.parseTypedArgList(locals, locals.getText(), this.g);
            r.locals.type = DictType.Local;
            r.locals.ast = locals;
        }

        for (const a of actions) {
            // a = ^(AT ID ACTION)
            const action = a.getChild(1) as ActionAST;
            r.namedActions.set(a.getChild(0)!.getText(), action);
            action.resolver = r;
        }
    }

    public override discoverOuterAlt(alt: AltAST): void {
        if (alt.altLabel && this.currentRuleName) {
            this.ruleToAltLabels.map(this.currentRuleName, alt.altLabel);
            const altLabel = alt.altLabel.getText();
            this.altLabelToRuleName.set(Utils.capitalize(altLabel), this.currentRuleName);
            this.altLabelToRuleName.set(Utils.decapitalize(altLabel), this.currentRuleName);
        }
    }

    public override grammarOption(id: GrammarAST, valueAST: GrammarAST): void {
        const caseInsensitive = this.getCaseInsensitiveValue(id, valueAST);
        if (caseInsensitive !== null) {
            this.grammarCaseInsensitive = caseInsensitive;
        }
    }

    public override discoverLexerRule(rule: RuleAST, id: GrammarAST, modifiers: GrammarAST[],
        options: GrammarAST | null, block: GrammarAST): void {
        let currentCaseInsensitive = this.grammarCaseInsensitive;
        if (options !== null) {
            for (const child of options.getChildren()) {
                const childAST = child as GrammarAST;
                const caseInsensitive = this.getCaseInsensitiveValue(childAST.getChild(0) as GrammarAST,
                    childAST.getChild(1) as GrammarAST);
                if (caseInsensitive !== null) {
                    currentCaseInsensitive = caseInsensitive;
                }
            }
        }

        const numAlts = block.getChildCount();
        const r = new Rule(this.g, id.getText(), rule, numAlts, this.currentModeName, currentCaseInsensitive);
        if (modifiers.length != 0) {
            r.modifiers = modifiers;
        }

        this.nameToRuleMap.set(r.name, r);
    }

    private getCaseInsensitiveValue(optionID: GrammarAST, valueAST: GrammarAST): boolean | null {
        const optionName = optionID.getText();
        if (optionName === Grammar.caseInsensitiveOptionName) {
            const valueText = valueAST.getText();
            if (valueText === "true") {
                return true;
            }

            if (valueText === "false") {
                return false;
            }
        }

        return null;
    }
}
