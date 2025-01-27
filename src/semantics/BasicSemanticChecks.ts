/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import type { Token } from "antlr4ng";

import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { GrammarTreeVisitor } from "../tree/walkers/GrammarTreeVisitor.js";

import { Constants } from "../Constants.js";
import { Utils } from "../misc/Utils.js";
import { Character } from "../support/Character.js";
import { GrammarType } from "../support/GrammarType.js";
import { isTokenName } from "../support/helpers.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { AltAST } from "../tool/ast/AltAST.js";
import { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import { GrammarRootAST } from "../tool/ast/GrammarRootAST.js";
import { RuleAST } from "../tool/ast/RuleAST.js";
import { RuleRefAST } from "../tool/ast/RuleRefAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";
import { RuleCollector } from "./RuleCollector.js";

/**
 * No side-effects except for setting options into the appropriate node.
 *  TODO:  make the side effects into a separate pass this
 *
 * Invokes check rules for these:
 *
 * FILE_AND_GRAMMAR_NAME_DIFFER
 * LEXER_RULES_NOT_ALLOWED
 * PARSER_RULES_NOT_ALLOWED
 * CANNOT_ALIAS_TOKENS
 * ARGS_ON_TOKEN_REF
 * ILLEGAL_OPTION
 * REWRITE_OR_OP_WITH_NO_OUTPUT_OPTION
 * NO_RULES
 * REWRITE_FOR_MULTI_ELEMENT_ALT
 * HETERO_ILLEGAL_IN_REWRITE_ALT
 * AST_OP_WITH_NON_AST_OUTPUT_OPTION
 * AST_OP_IN_ALT_WITH_REWRITE
 * CONFLICTING_OPTION_IN_TREE_FILTER
 * WILDCARD_AS_ROOT
 * INVALID_IMPORT
 * TOKEN_VOCAB_IN_DELEGATE
 * IMPORT_NAME_CLASH
 * REPEATED_PREQUEL
 * TOKEN_NAMES_MUST_START_UPPER
 */
export class BasicSemanticChecks extends GrammarTreeVisitor {
    /**
     * Set of valid imports.  Maps delegate to set of delegator grammar types.
     *  validDelegations.get(LEXER) gives list of the kinds of delegators
     *  that can import lexers.
     */
    public static readonly validImportTypes = new Map<number, number[]>([
        [GrammarType.Lexer, [GrammarType.Lexer, GrammarType.Combined]],
        [GrammarType.Parser, [GrammarType.Parser, GrammarType.Combined]],
        [GrammarType.Combined, [GrammarType.Combined]]
    ]);

    public g: Grammar;
    public ruleCollector: RuleCollector;

    /**
     * When this is {@code true}, the semantic checks will report
     * {@link ErrorType#UNRECOGNIZED_ASSOC_OPTION} where appropriate. This may
     * be set to {@code false} to disable this specific check.
     *
     * <p>The default value is {@code true}.</p>
     */
    public checkAssocElementOption = true;

    /**
     * This field is used for reporting the {@link ErrorType#MODE_WITHOUT_RULES}
     * error when necessary.
     */
    protected nonFragmentRuleCount: number;

    /**
     * This is {@code true} from the time {@link #discoverLexerRule} is called
     * for a lexer rule with the {@code fragment} modifier until
     * {@link #exitLexerRule} is called.
     */
    private inFragmentRule: boolean;

    /**
     * Value of caseInsensitive option (false if not defined)
     */
    private grammarCaseInsensitive = false;

    public constructor(g: Grammar, ruleCollector: RuleCollector) {
        super(g.tool.errorManager);

        this.g = g;
        this.ruleCollector = ruleCollector;
    }

    public process(): void {
        this.visitGrammar(this.g.ast);
    };

    // Routines to route visitor traffic to the checking routines

    public override discoverGrammar(root: GrammarRootAST, id: GrammarAST): void {
        this.checkGrammarName(id.token!);
    }

    public override finishPrequels(firstPrequel: GrammarAST | null): void {
        if (firstPrequel === null) {
            return;
        }

        const parent = firstPrequel.parent as GrammarAST;
        const options = parent.getAllChildrenWithType(ANTLRv4Parser.OPTIONS);
        const imports = parent.getAllChildrenWithType(ANTLRv4Parser.IMPORT);
        const tokens = parent.getAllChildrenWithType(ANTLRv4Parser.TOKENS); // TOKEN_SPEC originally.
        this.checkNumPrequels(options, imports, tokens);
    }

    public override importGrammar(label: GrammarAST, id: GrammarAST): void {
        this.checkImport(id.token!);
    }

    public override discoverRules(rules: GrammarAST): void {
        this.checkNumRules(rules);
    }

    public override modeDef(m: GrammarAST, id: GrammarAST): void {
        if (!this.g.isLexer()) {
            this.g.tool.errorManager.grammarError(ErrorType.MODE_NOT_IN_LEXER, this.g.fileName, id.token!,
                id.token!.text, this.g);
        }
    }

    public override discoverRule(rule: RuleAST, id: GrammarAST, modifiers: GrammarAST[], arg: ActionAST,
        returns: ActionAST, _throws: GrammarAST, options: GrammarAST, locals: ActionAST, actions: GrammarAST[],
        block: GrammarAST): void {
        // TODO: check that all or no alts have "# label"
        this.checkInvalidRuleDef(id.token!);
    }

    public override discoverLexerRule(rule: RuleAST, id: GrammarAST, modifiers: GrammarAST[], options: GrammarAST,
        block: GrammarAST): void {
        this.checkInvalidRuleDef(id.token!);

        for (const tree of modifiers) {
            if (tree.getType() === ANTLRv4Parser.FRAGMENT) {
                this.inFragmentRule = true;
            }
        }

        if (!this.inFragmentRule) {
            this.nonFragmentRuleCount++;
        }
    }

    public override ruleRef(ref: GrammarAST, arg: ActionAST): void {
        this.checkInvalidRuleRef(ref.token!);
    }

    public override grammarOption(id: GrammarAST, valueAST: GrammarAST): void {
        this.checkOptions(this.g.ast, id.token!, valueAST);
    }

    public override ruleOption(id: GrammarAST, valueAST: GrammarAST): void {
        this.checkOptions(id.getAncestor(ANTLRv4Parser.RULE) as GrammarAST, id.token!, valueAST);
    }

    public override blockOption(id: GrammarAST, valueAST: GrammarAST): void {
        this.checkOptions(id.getAncestor(ANTLRv4Parser.BLOCK) as GrammarAST, id.token!, valueAST);
    }

    public override defineToken(id: GrammarAST): void {
        this.checkTokenDefinition(id.token!);
    }

    public override defineChannel(id: GrammarAST): void {
        this.checkChannelDefinition(id.token!);
    }

    public override elementOption(t: GrammarASTWithOptions, id: GrammarAST, valueAST: GrammarAST): void {
        this.checkElementOptions(t, id, valueAST);
    }

    public override finishRule(rule: RuleAST, _id: GrammarAST, _block: GrammarAST): void {
        if (rule.isLexerRule()) {
            return;
        }

        const blk = rule.getFirstChildWithType(ANTLRv4Parser.BLOCK) as BlockAST;
        const altCount = blk.getChildCount();
        const idAST = rule.getChild(0) as GrammarAST;
        for (let i = 0; i < altCount; i++) {
            const altAST = blk.getChild(i) as AltAST;
            if (altAST.altLabel) {
                const altLabel = altAST.altLabel.getText();

                // first check that label doesn't conflict with a rule
                // label X or x can't be rule x.
                const r = this.ruleCollector.nameToRuleMap.get(Utils.decapitalize(altLabel));
                if (r) {
                    this.g.tool.errorManager.grammarError(ErrorType.ALT_LABEL_CONFLICTS_WITH_RULE, this.g.fileName,
                        altAST.altLabel.token!, altLabel, r.name);
                }

                // Now verify that label X or x doesn't conflict with label
                // in another rule. altLabelToRuleName has both X and x mapped.
                const prevRuleForLabel = this.ruleCollector.altLabelToRuleName.get(altLabel);
                if (prevRuleForLabel && prevRuleForLabel !== rule.getRuleName()) {
                    this.g.tool.errorManager.grammarError(ErrorType.ALT_LABEL_REDEF, this.g.fileName,
                        altAST.altLabel.token!, altLabel, rule.getRuleName(), prevRuleForLabel);
                }
            }
        }

        const altLabels = this.ruleCollector.ruleToAltLabels.get(rule.getRuleName()!);
        const numAltLabels = altLabels?.length ?? 0;

        if (numAltLabels > 0 && altCount !== numAltLabels) {
            this.g.tool.errorManager.grammarError(ErrorType.RULE_WITH_TOO_FEW_ALT_LABELS,
                this.g.fileName, idAST.token!, rule.getRuleName());
        }
    }

    public override actionInAlt(action: ActionAST): void {
        if (this.inFragmentRule) {
            const fileName = action.token!.inputStream!.getSourceName();
            const ruleName = this.currentRuleName;
            this.g.tool.errorManager.grammarError(ErrorType.FRAGMENT_ACTION_IGNORED, fileName, action.token!, ruleName);
        }
    }

    public override label(op: GrammarAST, id: GrammarAST, element: GrammarAST): void {
        switch (element.getType()) {
            case ANTLRv4Parser.TOKEN_REF:
            case ANTLRv4Parser.STRING_LITERAL:
            case ANTLRv4Parser.RANGE:
            case ANTLRv4Parser.SET:
            case ANTLRv4Parser.NOT:
            case ANTLRv4Parser.RULE_REF:
            case ANTLRv4Parser.STAR: {
                return;
            }

            default: {
                const fileName = id.token!.inputStream!.getSourceName();
                this.g.tool.errorManager.grammarError(ErrorType.LABEL_BLOCK_NOT_A_SET, fileName, id.token!,
                    id.getText());
                break;
            }

        }
    }

    protected override enterMode(tree: GrammarAST): void {
        this.nonFragmentRuleCount = 0;
    }

    protected override exitMode(tree: GrammarAST): void {
        if (this.nonFragmentRuleCount === 0) {
            let token = tree.token!;
            let name = "?";
            if (tree.getChildCount() > 0) {
                name = tree.getChild(0)?.getText() ?? "";
                if (!name) {
                    name = "?";
                }

                token = (tree.getChild(0) as GrammarAST).token!;
            }

            this.g.tool.errorManager.grammarError(ErrorType.MODE_WITHOUT_RULES, this.g.fileName, token, name, this.g);
        }
    }

    protected override exitLexerRule(tree: GrammarAST): void {
        this.inFragmentRule = false;
    }

    protected override enterChannelsSpec(tree: GrammarAST): void {
        const errorType = this.g.isParser()
            ? ErrorType.CHANNELS_BLOCK_IN_PARSER_GRAMMAR
            : this.g.isCombined()
                ? ErrorType.CHANNELS_BLOCK_IN_COMBINED_GRAMMAR
                : null;
        if (errorType !== null) {
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, tree.token!);
        }
    }

    // Routines to do the actual work of checking issues with a grammar.
    // They are triggered by the visitor methods above.

    protected checkGrammarName(nameToken: Token): void {
        const fullyQualifiedName = nameToken.inputStream?.getSourceName();
        if (!fullyQualifiedName) {
            // This wasn't read from a file.
            return;
        }

        if (this.g.originalGrammar) {
            return;
        }

        // Don't warn about diff if this is implicit lexer.
        const fileName = fullyQualifiedName.substring(0, fullyQualifiedName.lastIndexOf("."));
        if (fileName !== nameToken.text! &&
            fullyQualifiedName !== Constants.GRAMMAR_FROM_STRING_NAME) {
            this.g.tool.errorManager.grammarError(ErrorType.FILE_AND_GRAMMAR_NAME_DIFFER, fullyQualifiedName, nameToken,
                nameToken.text, fullyQualifiedName);
        }
    }

    protected checkNumRules(rulesNode: GrammarAST): void {
        if (rulesNode.getChildCount() === 0) {
            const root = rulesNode.parent as GrammarAST;
            const idNode = root.getChild(0) as GrammarAST;
            this.g.tool.errorManager.grammarError(ErrorType.NO_RULES, this.g.fileName,
                null, idNode.getText(), this.g);
        }
    }

    protected checkNumPrequels(options: GrammarAST[], imports: GrammarAST[], tokens: GrammarAST[]): void {
        const secondOptionTokens = new Array<Token>();
        if (options.length > 1) {
            secondOptionTokens.push(options[1].token!);
        }

        if (imports.length > 1) {
            secondOptionTokens.push(imports[1].token!);
        }

        if (tokens.length > 1) {
            secondOptionTokens.push(tokens[1].token!);
        }

        for (const t of secondOptionTokens) {
            const fileName = t.inputStream!.getSourceName();
            this.g.tool.errorManager.grammarError(ErrorType.REPEATED_PREQUEL, fileName, t);
        }
    }

    protected checkInvalidRuleDef(ruleID: Token): void {
        const fileName = ruleID.inputStream?.getSourceName() ?? "<none>";
        if (this.g.isLexer() && Character.isLowerCase(ruleID.text!.codePointAt(0)!)) {
            this.g.tool.errorManager.grammarError(ErrorType.PARSER_RULES_NOT_ALLOWED, fileName, ruleID, ruleID.text);
        }

        if (this.g.isParser() &&
            isTokenName(ruleID.text!)) {
            this.g.tool.errorManager.grammarError(ErrorType.LEXER_RULES_NOT_ALLOWED, fileName, ruleID, ruleID.text);
        }
    }

    protected checkInvalidRuleRef(ruleID: Token): void {
        const fileName = ruleID.inputStream?.getSourceName();
        if (this.g.isLexer() && Character.isLowerCase(ruleID.text!.codePointAt(0)!)) {
            this.g.tool.errorManager.grammarError(ErrorType.PARSER_RULE_REF_IN_LEXER_RULE, fileName ?? "<none>", ruleID,
                ruleID.text, this.currentRuleName);
        }
    }

    protected checkTokenDefinition(tokenID: Token): void {
        const fileName = tokenID.inputStream?.getSourceName();
        if (!isTokenName(tokenID.text!)) {
            this.g.tool.errorManager.grammarError(ErrorType.TOKEN_NAMES_MUST_START_UPPER, fileName ?? "<none>", tokenID,
                tokenID.text);
        }
    }

    protected checkChannelDefinition(tokenID: Token): void {
        // todo
    }

    protected override enterLexerElement(tree: GrammarAST): void {
        // todo
    }

    protected override enterLexerCommand(tree: GrammarAST): void {
        this.checkElementIsOuterMostInSingleAlt(tree);

        if (this.inFragmentRule) {
            const fileName = tree.token?.inputStream?.getSourceName();
            const ruleName = this.currentRuleName;
            this.g.tool.errorManager.grammarError(ErrorType.FRAGMENT_ACTION_IGNORED, fileName ?? "<none>", tree.token!,
                ruleName);
        }
    }

    /**
     Make sure that action is last element in outer alt; here action,
     a2, z, and zz are bad, but a3 is ok:
     (RULE A (BLOCK (ALT {action} 'a')))
     (RULE B (BLOCK (ALT (BLOCK (ALT {a2} 'x') (ALT 'y')) {a3})))
     (RULE C (BLOCK (ALT 'd' {z}) (ALT 'e' {zz})))
     */
    protected checkElementIsOuterMostInSingleAlt(tree: GrammarAST): void {
        const alt = tree.parent!;
        const blk = alt.parent!;
        const outerMostAlt = blk.parent!.getType() === ANTLRv4Parser.RULE;
        const rule = tree.getAncestor(ANTLRv4Parser.RULE)!;
        const fileName = tree.token?.inputStream?.getSourceName();
        if (!outerMostAlt || blk.getChildCount() > 1) {
            const e = ErrorType.LEXER_COMMAND_PLACEMENT_ISSUE;
            this.g.tool.errorManager.grammarError(e, fileName ?? "<none>", tree.token!, rule.getChild(0)!.getText());

        }
    }

    protected override enterTerminal(tree: GrammarAST): void {
        const text = tree.getText();
        if (text === "''") {
            this.g.tool.errorManager.grammarError(ErrorType.EMPTY_STRINGS_AND_SETS_NOT_ALLOWED, this.g.fileName,
                tree.token!, "''");
        }
    }

    /** Check option is appropriate for grammar, rule, subrule */
    protected checkOptions(parent: GrammarAST, optionID: Token, valueAST: GrammarAST): void {
        let optionsToCheck = null;
        const parentType = parent.getType();
        switch (parentType) {
            case ANTLRv4Parser.BLOCK: {
                optionsToCheck = this.g.isLexer() ? Grammar.lexerBlockOptions : Grammar.parserBlockOptions;
                break;
            }

            case ANTLRv4Parser.RULE: {
                optionsToCheck = this.g.isLexer() ? Grammar.lexerRuleOptions : Grammar.parseRuleOptions;
                break;
            }

            case ANTLRv4Parser.GRAMMAR: {
                optionsToCheck = this.g.type === GrammarType.Lexer
                    ? Grammar.lexerOptions
                    : Grammar.parserOptions;
                break;
            }

            default:

        }

        const optionName = optionID.text!;
        if (optionsToCheck !== null && !optionsToCheck.has(optionName)) {
            this.g.tool.errorManager.grammarError(ErrorType.ILLEGAL_OPTION, this.g.fileName, optionID, optionName);
        } else {
            this.checkCaseInsensitiveOption(optionID, valueAST, parentType);
        }
    }

    /** Check option is appropriate for elem; parent of ID is ELEMENT_OPTIONS */
    protected checkElementOptions(elem: GrammarASTWithOptions, id: GrammarAST, valueAST: GrammarAST | null): boolean {
        if (this.checkAssocElementOption && id.getText() === "assoc") {
            if (elem.getType() !== ANTLRv4Parser.ALT) {
                const optionID = id.token!;
                const fileName = optionID.inputStream?.getSourceName();
                this.g.tool.errorManager.grammarError(ErrorType.UNRECOGNIZED_ASSOC_OPTION, fileName ?? "<none>",
                    optionID, this.currentRuleName);
            }
        }

        if (elem instanceof RuleRefAST) {
            return this.checkRuleRefOptions(elem, id, valueAST);
        }

        if (elem instanceof TerminalAST) {
            return this.checkTokenOptions(elem, id, valueAST);
        }

        if (elem.getType() === ANTLRv4Parser.ACTION) {
            return false;
        }

        if (elem.getType() === ANTLRv4Parser.SEMPRED) {
            const optionID = id.token!;
            const fileName = optionID.inputStream?.getSourceName();
            if (valueAST !== null && !Grammar.semPredOptions.has(optionID.text!)) {
                this.g.tool.errorManager.grammarError(ErrorType.ILLEGAL_OPTION, fileName ?? "<none>", optionID,
                    optionID.text);

                return false;
            }
        }

        return false;
    }

    protected checkRuleRefOptions(elem: RuleRefAST, id: GrammarAST, valueAST: GrammarAST | null): boolean {
        const optionID = id.token!;
        const fileName = optionID.inputStream?.getSourceName();

        // Don't care about id<SimpleValue> options.
        if (valueAST !== null && !Grammar.ruleRefOptions.has(optionID.text!)) {
            this.g.tool.errorManager.grammarError(ErrorType.ILLEGAL_OPTION, fileName ?? "<none>", optionID,
                optionID.text);

            return false;
        }

        // TODO: extra checks depending on rule kind?
        return true;
    }

    protected checkTokenOptions(elem: TerminalAST, id: GrammarAST, valueAST: GrammarAST | null): boolean {
        const optionID = id.token!;
        const fileName = optionID.inputStream?.getSourceName();

        // Don't care about ID<ASTNodeName> options.
        if (valueAST !== null && !Grammar.tokenOptions.has(optionID.text!)) {
            this.g.tool.errorManager.grammarError(ErrorType.ILLEGAL_OPTION, fileName ?? "<none>", optionID,
                optionID.text);

            return false;
        }

        // TODO: extra checks depending on terminal kind?
        return true;
    }

    protected checkImport(importID: Token): void {
        const delegate = this.g.getImportedGrammar(importID.text!);
        if (delegate === null) {
            return;
        }

        const validDelegators = BasicSemanticChecks.validImportTypes.get(delegate.type);
        if (validDelegators && !validDelegators.includes(this.g.type)) {
            this.g.tool.errorManager.grammarError(ErrorType.INVALID_IMPORT, this.g.fileName, importID, this.g,
                delegate);
        }

        if (this.g.isCombined()
            && (delegate.name === this.g.name + Grammar.getGrammarTypeToFileNameSuffix(GrammarType.Lexer) ||
                delegate.name === this.g.name + Grammar.getGrammarTypeToFileNameSuffix(GrammarType.Parser))) {
            this.g.tool.errorManager.grammarError(ErrorType.IMPORT_NAME_CLASH, this.g.fileName, importID, this.g,
                delegate);
        }
    }

    private checkCaseInsensitiveOption(optionID: Token, valueAST: GrammarAST, parentType: number): void {
        const optionName = optionID.text!;
        if (optionName === Grammar.caseInsensitiveOptionName) {
            const valueText = valueAST.getText();
            if (valueText === "true" || valueText === "false") {
                const currentValue = valueText === "true";
                if (parentType === ANTLRv4Parser.GRAMMAR) {
                    this.grammarCaseInsensitive = currentValue;
                } else {
                    if (this.grammarCaseInsensitive === currentValue) {
                        this.g.tool.errorManager.grammarError(ErrorType.REDUNDANT_CASE_INSENSITIVE_LEXER_RULE_OPTION,
                            this.g.fileName, optionID, currentValue);
                    }
                }
            } else {
                this.g.tool.errorManager.grammarError(ErrorType.ILLEGAL_OPTION_VALUE, this.g.fileName, valueAST.token!,
                    optionName, valueText);
            }
        }
    }
}
