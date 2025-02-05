/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { Token } from "antlr4ng";

import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";

import type { CommonTree } from "../tree/CommonTree.js";

import { Constants } from "../Constants.js";
import { AltAST } from "../tool/ast/AltAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";
import { AttributeDict } from "../tool/AttributeDict.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { LabelElementPair } from "../tool/LabelElementPair.js";
import { LabelType } from "../tool/LabelType.js";
import { LeftRecursiveRule } from "../tool/LeftRecursiveRule.js";
import { LexerGrammar } from "../tool/LexerGrammar.js";
import { Rule } from "../tool/Rule.js";
import { SymbolCollector } from "./SymbolCollector.js";

/**
 * Check for symbol problems; no side-effects.  Inefficient to walk rules
 *  and such multiple times, but I like isolating all error checking outside
 *  of code that actually defines symbols etc...
 *
 *  Side-effect: strip away redef'd rules.
 */
export class SymbolChecks {

    protected g: Grammar;
    protected collector: SymbolCollector;
    protected nameToRuleMap = new Map<string, Rule>();
    protected tokenIDs = new Set<string>();
    protected actionScopeToActionNames = new Map<string, Set<string>>();

    protected readonly reservedNames = new Set<string>();

    public constructor(g: Grammar, collector: SymbolCollector) {
        this.g = g;
        this.collector = collector;

        for (const tokenId of collector.tokenIDRefs) {
            this.tokenIDs.add(tokenId.getText());
        }

        Constants.COMMON_CONSTANTS.forEach((value, key) => {
            this.reservedNames.add(key);
        });

    }

    public process(): void {
        // methods affect fields, but no side-effects outside this object
        // So, call order sensitive
        // First collect all rules for later use in checkForLabelConflict()
        for (const r of this.g.rules.values()) {
            this.nameToRuleMap.set(r.name, r);
        }

        this.checkReservedNames(Array.from(this.g.rules.values()));
        this.checkActionRedefinitions(this.collector.namedActions);
        this.checkForLabelConflicts(Array.from(this.g.rules.values()));
    }

    public checkActionRedefinitions(actions: GrammarAST[]): void {
        let scope = this.g.getDefaultActionScope()!;
        let name: string;
        let nameNode: GrammarAST;
        for (const ampersandAST of actions) {
            nameNode = ampersandAST.children[0] as GrammarAST;
            if (ampersandAST.children.length === 2) {
                name = nameNode.getText()!;
            } else {
                scope = nameNode.getText()!;
                name = ampersandAST.children[1].getText()!;
            }

            let scopeActions = this.actionScopeToActionNames.get(scope);
            if (!scopeActions) { // init scope
                scopeActions = new Set<string>();
                this.actionScopeToActionNames.set(scope, scopeActions);
            }

            if (!scopeActions.has(name)) {
                scopeActions.add(name);
            } else {
                this.g.tool.errorManager.grammarError(ErrorType.ACTION_REDEFINITION, this.g.fileName, nameNode.token!,
                    name);
            }
        }
    }

    /**
     * Make sure a label doesn't conflict with another symbol.
     * Labels must not conflict with: rules, tokens, scope names,
     * return values, parameters, and rule-scope dynamic attributes
     * defined in surrounding rule.  Also they must have same type
     * for repeated defs.
     */
    public checkForLabelConflicts(rules: Rule[]): void {
        for (const r of rules) {
            this.checkForAttributeConflicts(r);

            const labelNameSpace = new Map<string, LabelElementPair>();
            for (let i = 1; i <= r.numberOfAlts; i++) {
                const a = r.alt[i];
                for (const pairs of a.labelDefs.values()) {
                    if (r.hasAltSpecificContexts()) {
                        // Collect labelName-labeledRules map for rule with alternative labels.
                        const labelPairs = new Map<string, LabelElementPair[]>();
                        for (const p of pairs) {
                            const labelName = this.findAltLabelName(p.label);
                            if (labelName !== null) {
                                let list: LabelElementPair[];
                                if (labelPairs.has(labelName)) {
                                    list = labelPairs.get(labelName)!;
                                } else {
                                    list = [];
                                    labelPairs.set(labelName, list);
                                }
                                list.push(p);
                            }
                        }

                        for (const internalPairs of labelPairs.values()) {
                            labelNameSpace.clear();
                            this.checkLabelPairs(r, labelNameSpace, internalPairs);
                        }
                    } else {
                        this.checkLabelPairs(r, labelNameSpace, pairs);
                    }
                }
            }
        }
    }

    public checkForLabelConflict(r: Rule, labelID: GrammarAST): void {
        const name = labelID.getText();
        if (this.nameToRuleMap.has(name)) {
            const errorType = ErrorType.LABEL_CONFLICTS_WITH_RULE;
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, labelID.token!, name, r.name);
        }

        if (this.tokenIDs.has(name)) {
            const errorType = ErrorType.LABEL_CONFLICTS_WITH_TOKEN;
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, labelID.token!, name, r.name);
        }

        if (r.args?.get(name)) {
            const errorType = ErrorType.LABEL_CONFLICTS_WITH_ARG;
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, labelID.token!, name, r.name);
        }

        if (r.retvals?.get(name)) {
            const errorType = ErrorType.LABEL_CONFLICTS_WITH_RETVAL;
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, labelID.token!, name, r.name);
        }

        if (r.locals?.get(name)) {
            const errorType = ErrorType.LABEL_CONFLICTS_WITH_LOCAL;
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, labelID.token!, name, r.name);
        }
    }

    public checkForAttributeConflicts(r: Rule): void {
        this.checkDeclarationRuleConflicts(r, r.args, new Set(this.nameToRuleMap.keys()),
            ErrorType.ARG_CONFLICTS_WITH_RULE);
        this.checkDeclarationRuleConflicts(r, r.args, this.tokenIDs, ErrorType.ARG_CONFLICTS_WITH_TOKEN);

        this.checkDeclarationRuleConflicts(r, r.retvals, new Set(this.nameToRuleMap.keys()),
            ErrorType.RETVAL_CONFLICTS_WITH_RULE);
        this.checkDeclarationRuleConflicts(r, r.retvals, this.tokenIDs, ErrorType.RETVAL_CONFLICTS_WITH_TOKEN);

        this.checkDeclarationRuleConflicts(r, r.locals, new Set(this.nameToRuleMap.keys()),
            ErrorType.LOCAL_CONFLICTS_WITH_RULE);
        this.checkDeclarationRuleConflicts(r, r.locals, this.tokenIDs, ErrorType.LOCAL_CONFLICTS_WITH_TOKEN);

        this.checkLocalConflictingDeclarations(r, r.retvals, r.args, ErrorType.RETVAL_CONFLICTS_WITH_ARG);
        this.checkLocalConflictingDeclarations(r, r.locals, r.args, ErrorType.LOCAL_CONFLICTS_WITH_ARG);
        this.checkLocalConflictingDeclarations(r, r.locals, r.retvals, ErrorType.LOCAL_CONFLICTS_WITH_RETVAL);
    }

    public checkForModeConflicts(g: Grammar): void {
        if (g.isLexer()) {
            const lexerGrammar = g as LexerGrammar;
            for (const modeName of lexerGrammar.modes.keys()) {
                if (modeName !== "DEFAULT_MODE" && this.reservedNames.has(modeName)) {
                    const rule = lexerGrammar.modes.get(modeName)![0];
                    this.g.tool.errorManager.grammarError(ErrorType.MODE_CONFLICTS_WITH_COMMON_CONSTANTS, g.fileName,
                        rule.ast.parent!.token!, modeName);
                }

                if (g.getTokenType(modeName) !== Token.INVALID_TYPE) {
                    const rule = lexerGrammar.modes.get(modeName)![0];
                    this.g.tool.errorManager.grammarError(ErrorType.MODE_CONFLICTS_WITH_TOKEN, g.fileName,
                        rule.ast.parent!.token!, modeName);
                }
            }
        }
    }

    /**
     * Algorithm steps:
     * 1. Collect all simple string literals (i.e. 'asdf', 'as' 'df', but not [a-z]+, 'a'..'z')
     *    for all lexer rules in each mode except of autogenerated tokens ({@link getSingleTokenValues})
     * 2. Compare every string literal with each other ({@link checkForOverlap})
     *    and throw TOKEN_UNREACHABLE warning if the same string found.
     * Complexity: O(m * n^2 / 2), approximately equals to O(n^2)
     * where m - number of modes, n - average number of lexer rules per mode.
     * See also testUnreachableTokens unit test for details.
     */
    public checkForUnreachableTokens(g: Grammar): void {
        if (g.isLexer()) {
            const lexerGrammar = g as LexerGrammar;
            for (const rules of lexerGrammar.modes.values()) {
                // Collect string literal lexer rules for each mode
                const stringLiteralRules: Rule[] = [];
                const stringLiteralValues: string[][] = [];
                for (const rule of rules) {
                    const ruleStringAlts = this.getSingleTokenValues(rule);
                    if (ruleStringAlts.length > 0) {
                        stringLiteralRules.push(rule);
                        stringLiteralValues.push(ruleStringAlts);
                    }
                }

                // Check string sets intersection
                for (let i = 0; i < stringLiteralRules.length; i++) {
                    const firstTokenStringValues = stringLiteralValues[i];
                    const rule1 = stringLiteralRules[i];
                    this.checkForOverlap(g, rule1, rule1, firstTokenStringValues, stringLiteralValues[i]);

                    // Check fragment rules only with themselves.
                    if (!rule1.isFragment()) {
                        for (let j = i + 1; j < stringLiteralRules.length; j++) {
                            const rule2 = stringLiteralRules[j];
                            if (!rule2.isFragment()) {
                                this.checkForOverlap(g, rule1, rule2, firstTokenStringValues, stringLiteralValues[j]);
                            }
                        }
                    }
                }
            }
        }
    }

    // CAN ONLY CALL THE TWO NEXT METHODS AFTER GRAMMAR HAS RULE DEFS (see semantic pipeline)
    public checkRuleArgs(g: Grammar, ruleRefs: GrammarAST[]): void {
        for (const ref of ruleRefs) {
            const ruleName = ref.getText();
            const r = g.getRule(ruleName);
            const arg = ref.getFirstChildWithType(ANTLRv4Parser.ARG_ACTION) as GrammarAST | null;
            if (arg !== null && r?.args === undefined) {
                this.g.tool.errorManager.grammarError(ErrorType.RULE_HAS_NO_ARGS, g.fileName, ref.token!, ruleName);
            } else if (arg === null && r?.args !== undefined) {
                this.g.tool.errorManager.grammarError(ErrorType.MISSING_RULE_ARGS, g.fileName, ref.token!, ruleName);
            }
        }
    }

    public checkForQualifiedRuleIssues(g: Grammar, qualifiedRuleRefs: GrammarAST[]): void {
        for (const dot of qualifiedRuleRefs) {
            const grammar = dot.children[0] as GrammarAST;
            const rule = dot.children[1] as GrammarAST;
            g.tool.logInfo({ component: "semantics", msg: grammar.getText() + "." + rule.getText() });
            const delegate = g.getImportedGrammar(grammar.getText());
            if (delegate === null) {
                this.g.tool.errorManager.grammarError(ErrorType.NO_SUCH_GRAMMAR_SCOPE, g.fileName, grammar.token!,
                    grammar.getText(), rule.getText());
            } else if (g.getRule(grammar.getText(), rule.getText()) === null) {
                this.g.tool.errorManager.grammarError(ErrorType.NO_SUCH_RULE_IN_SCOPE, g.fileName, rule.token!,
                    grammar.getText(), rule.getText());
            }
        }
    }

    protected checkDeclarationRuleConflicts(r: Rule, attributes: AttributeDict | undefined, ruleNames: Set<string>,
        errorType: ErrorType): void {
        if (!attributes) {
            return;
        }

        for (const attribute of attributes.attributes.values()) {
            if (ruleNames.has(attribute.name)) {
                this.g.tool.errorManager.grammarError(errorType, this.g.fileName,
                    attribute.token ?? (r.ast.children[0] as GrammarAST).token!, attribute.name, r.name);
            }
        }
    }

    protected checkLocalConflictingDeclarations(r: Rule, attributes: AttributeDict | undefined,
        referenceAttributes: AttributeDict | undefined, errorType: ErrorType): void {
        if (!attributes || !referenceAttributes) {
            return;
        }

        const conflictingKeys = attributes.intersection(referenceAttributes);
        for (const key of conflictingKeys) {
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName,
                attributes.get(key)?.token ?? (r.ast.children[0] as GrammarAST).token!, key, r.name);
        }
    }

    protected checkReservedNames(rules: Rule[]): void {
        for (const rule of rules) {
            if (this.reservedNames.has(rule.name)) {
                this.g.tool.errorManager.grammarError(ErrorType.RESERVED_RULE_NAME, this.g.fileName,
                    (rule.ast.children[0] as GrammarAST).token!, rule.name);
            }
        }
    }

    private checkLabelPairs(r: Rule, labelNameSpace: Map<string, LabelElementPair>, pairs: LabelElementPair[]): void {
        for (const p of pairs) {
            this.checkForLabelConflict(r, p.label);
            const name = p.label.getText();
            const prev = labelNameSpace.get(name);
            if (!prev) {
                labelNameSpace.set(name, p);
            } else {
                this.checkForTypeMismatch(r, prev, p);
            }
        }
    }

    private findAltLabelName(label: CommonTree | null): string | null {
        if (label === null) {
            return null;
        } else if (label instanceof AltAST) {
            const altAST = label;
            if (altAST.altLabel) {
                return altAST.altLabel.toString();
            } else {
                if (altAST.leftRecursiveAltInfo) {
                    return altAST.leftRecursiveAltInfo.altLabel!.toString();
                } else {
                    return this.findAltLabelName(label.parent);
                }
            }
        } else {
            return this.findAltLabelName(label.parent);
        }
    }

    private checkForTypeMismatch(r: Rule, prevLabelPair: LabelElementPair, labelPair: LabelElementPair): void {
        // label already defined; if same type, no problem
        if (prevLabelPair.type !== labelPair.type) {
            // Current behavior: take a token of rule declaration in case of left-recursive rule
            // Desired behavior: take a token of proper label declaration in case of left-recursive rule
            // See https://github.com/antlr/antlr4/pull/1585
            // Such behavior is referring to the fact that the warning is typically reported on the actual label
            // redefinition, but for left-recursive rules the warning is reported on the enclosing rule.
            const token = r instanceof LeftRecursiveRule
                ? (r.ast.children[0] as GrammarAST).token!
                : labelPair.label.token;
            this.g.tool.errorManager.grammarError(ErrorType.LABEL_TYPE_CONFLICT, this.g.fileName, token!,
                labelPair.label.getText(), labelPair.type + "!=" + prevLabelPair.type);
        }

        if (prevLabelPair.element.getText() !== labelPair.element.getText() &&
            (prevLabelPair.type === LabelType.RuleLabel || prevLabelPair.type === LabelType.RuleListLabel) &&
            (labelPair.type === LabelType.RuleLabel || labelPair.type === LabelType.RuleListLabel)) {

            const token = r instanceof LeftRecursiveRule
                ? (r.ast.children[0] as GrammarAST).token!
                : labelPair.label.token;
            const prevLabelOp = prevLabelPair.type === LabelType.RuleListLabel ? "+=" : "=";
            const labelOp = labelPair.type === LabelType.RuleListLabel ? "+=" : "=";
            this.g.tool.errorManager.grammarError(ErrorType.LABEL_TYPE_CONFLICT, this.g.fileName, token!,
                labelPair.label.getText() + labelOp + labelPair.element.getText(),
                prevLabelPair.label.getText() + prevLabelOp + prevLabelPair.element.getText());
        }
    }

    /**
     * {@return} list of simple string literals for rule {@param rule}
     */
    private getSingleTokenValues(rule: Rule): string[] {
        const values: string[] = [];
        for (let i = 1; i < rule.alt.length; i++) { // Index 0 is not used.
            const alt = rule.alt[i];
            // select first alt if token has a command
            const rootNode = alt.ast.children.length === 2 &&
                alt.ast.children[0] instanceof AltAST && alt.ast.children[1] instanceof GrammarAST
                ? alt.ast.children[0]
                : alt.ast;

            if (rootNode.getTokenStartIndex() === -1) {
                continue; // ignore autogenerated tokens from combined grammars that start with T__
            }

            // Ignore alt if contains not only string literals (repetition, optional)
            let ignore = false;
            let currentValue = "";
            for (const child of rootNode.children) {
                if (!(child instanceof TerminalAST)) {
                    ignore = true;
                    break;
                }

                if (child.token!.type !== ANTLRv4Lexer.STRING_LITERAL) {
                    ignore = true;

                    break;
                } else {
                    const text = child.token!.text!;
                    currentValue += text.substring(1, text.length - 1);
                }
            }

            if (!ignore) {
                values.push(currentValue);
            }
        }

        return values;
    }

    /**
     * For same rule compare values from next index:
     * TOKEN_WITH_SAME_VALUES: 'asdf' | 'asdf';
     * For different rules compare from start value:
     * TOKEN1: 'asdf';
     * TOKEN2: 'asdf';
     */
    private checkForOverlap(g: Grammar, rule1: Rule, rule2: Rule, firstTokenStringValues: string[],
        secondTokenStringValues: string[]): void {
        for (let i = 0; i < firstTokenStringValues.length; i++) {
            const secondTokenInd = rule1 === rule2 ? i + 1 : 0;
            const str1 = firstTokenStringValues[i];
            for (let j = secondTokenInd; j < secondTokenStringValues.length; j++) {
                const str2 = secondTokenStringValues[j];
                if (str1 === str2) {
                    this.g.tool.errorManager.grammarError(ErrorType.TOKEN_UNREACHABLE, g.fileName,
                        (rule2.ast.children[0] as GrammarAST).token!, rule2.name, str2, rule1.name);
                }
            }
        }
    }
}
