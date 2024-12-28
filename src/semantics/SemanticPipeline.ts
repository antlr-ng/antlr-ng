/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

// cspell: ignore RARROW

import { Token } from "antlr4ng";

import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";

import { LeftRecursiveRuleTransformer } from "../analysis/LeftRecursiveRuleTransformer.js";
import { LexerATNFactory } from "../automata/LexerATNFactory.js";
import { isTokenName } from "../support/helpers.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { LexerGrammar } from "../tool/LexerGrammar.js";
import { Rule } from "../tool/Rule.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { AttributeChecks } from "./AttributeChecks.js";
import { BasicSemanticChecks } from "./BasicSemanticChecks.js";
import { RuleCollector } from "./RuleCollector.js";
import { SymbolChecks } from "./SymbolChecks.js";
import { SymbolCollector } from "./SymbolCollector.js";
import { UseDefAnalyzer } from "./UseDefAnalyzer.js";

/**
 * Do as much semantic checking as we can and fill in grammar
 *  with rules, actions, and token definitions.
 *  The only side effects are in the grammar passed to process().
 *  We consume a bunch of memory here while we build up data structures
 *  to perform checking, but all of it goes away after this pipeline object
 *  gets garbage collected.
 *
 *  After this pipeline finishes, we can be sure that the grammar
 *  is syntactically correct and that it's semantically correct enough for us
 *  to attempt grammar analysis. We have assigned all token types.
 *  Note that imported grammars bring in token and rule definitions
 *  but only the root grammar and any implicitly created lexer grammar
 *  get their token definitions filled up. We are treating the
 *  imported grammars like includes.
 *
 *  The semantic pipeline works on root grammars (those that do the importing,
 *  if any). Upon entry to the semantic pipeline, all imported grammars
 *  should have been loaded into delegate grammar objects with their
 *  ASTs created.  The pipeline does the BasicSemanticChecks on the
 *  imported grammar before collecting symbols. We cannot perform the
 *  simple checks such as undefined rule until we have collected all
 *  tokens and rules from the imported grammars into a single collection.
 */
export class SemanticPipeline {
    public constructor(private g: Grammar) {
    }

    public process(): void {
        // COLLECT RULE OBJECTS
        const ruleCollector = new RuleCollector(this.g);
        ruleCollector.process(this.g.ast);

        // DO BASIC / EASY SEMANTIC CHECKS
        let prevErrors = this.g.tool.errorManager.errors;
        const basics = new BasicSemanticChecks(this.g, ruleCollector);
        basics.process();
        if (this.g.tool.errorManager.errors > prevErrors) {
            return;
        }

        // TRANSFORM LEFT-RECURSIVE RULES
        prevErrors = this.g.tool.errorManager.errors;
        const transformer = new LeftRecursiveRuleTransformer(this.g.ast,
            Array.from(ruleCollector.nameToRuleMap.values()), this.g);
        transformer.translateLeftRecursiveRules();

        // don't continue if we got errors during left-recursion elimination
        if (this.g.tool.errorManager.errors > prevErrors) {
            return;
        }

        // STORE RULES IN GRAMMAR
        for (const r of ruleCollector.nameToRuleMap.values()) {
            this.g.defineRule(r);
        }

        // COLLECT SYMBOLS: RULES, ACTIONS, TERMINALS, ...
        const collector = new SymbolCollector(this.g);
        collector.process(this.g.ast);

        // CHECK FOR SYMBOL COLLISIONS
        const symbolChecker = new SymbolChecks(this.g, collector);
        symbolChecker.process(); // side-effect: strip away redef'd rules.

        for (const a of collector.namedActions) {
            this.g.defineAction(a);
        }

        // LINK (outermost) ALT NODES WITH Alternatives
        for (const r of this.g.rules.values()) {
            for (let i = 1; i <= r.numberOfAlts; i++) {
                r.alt[i].ast.alt = r.alt[i];
            }
        }

        // ASSIGN TOKEN TYPES
        this.g.importTokensFromTokensFile();
        if (this.g.isLexer()) {
            this.assignLexerTokenTypes(this.g, collector.tokensDefs);
        } else {
            this.assignTokenTypes(this.g, collector.tokensDefs,
                collector.tokenIDRefs, collector.terminals);
        }

        symbolChecker.checkForModeConflicts(this.g);
        symbolChecker.checkForUnreachableTokens(this.g);

        this.assignChannelTypes(this.g, collector.channelDefs);

        // CHECK RULE REFS NOW (that we've defined rules in grammar)
        symbolChecker.checkRuleArgs(this.g, collector.ruleRefs);
        this.identifyStartRules(collector);
        symbolChecker.checkForQualifiedRuleIssues(this.g, collector.qualifiedRuleRefs);

        // don't continue if we got symbol errors
        if (this.g.tool.getNumErrors() > 0) {
            return;
        }

        // CHECK ATTRIBUTE EXPRESSIONS FOR SEMANTIC VALIDITY
        AttributeChecks.checkAllAttributeExpressions(this.g);

        UseDefAnalyzer.trackTokenRuleRefsInActions(this.g);
    }

    protected identifyStartRules(collector: SymbolCollector): void {
        for (const ref of collector.ruleRefs) {
            const ruleName = ref.getText();
            const r = this.g.getRule(ruleName);
            if (r !== null) {
                r.isStartRule = false;
            }

        }
    }

    protected assignLexerTokenTypes(g: Grammar, tokensDefs: GrammarAST[]): void {
        const grammar = g.getOutermostGrammar(); // put in root, even if imported
        for (const def of tokensDefs) {
            // tokens { id (',' id)* } so must check IDs not TOKEN_REF
            if (isTokenName(def.getText())) {
                grammar.defineTokenName(def.getText());
            }
        }

        /* Define token types for non-fragment rules which do not include a 'type(...)'
         * or 'more' lexer command.
         */
        for (const r of g.rules.values()) {
            if (!r.isFragment() && !this.hasTypeOrMoreCommand(r)) {
                grammar.defineTokenName(r.name);
            }
        }

        // FOR ALL X : 'xxx'; RULES, DEFINE 'xxx' AS TYPE X
        const litAliases = Grammar.getStringLiteralAliasesFromLexerRules(g.ast);
        const conflictingLiterals = new Set<string>();
        if (litAliases !== null) {
            for (const [nameAST, litAST] of litAliases) {
                if (!grammar.stringLiteralToTypeMap.has(litAST.getText())) {
                    grammar.defineTokenAlias(nameAST.getText(), litAST.getText());
                } else {
                    // oops two literal defs in two rules (within or across modes).
                    conflictingLiterals.add(litAST.getText());
                }
            }

            for (const lit of conflictingLiterals) {
                // Remove literal if repeated across rules so it's not
                // found by parser grammar.
                const value = grammar.stringLiteralToTypeMap.get(lit);
                grammar.stringLiteralToTypeMap.delete(lit);
                if (value !== undefined && value > 0 && value < grammar.typeToStringLiteralList.length
                    && lit === grammar.typeToStringLiteralList[value]) {
                    grammar.typeToStringLiteralList[value] = null;
                }
            }
        }
    }

    protected hasTypeOrMoreCommand(r: Rule): boolean {
        const ast = r.ast;

        const altActionAst = ast.getFirstDescendantWithType(ANTLRv4Parser.LEXER_ALT_ACTION) as GrammarAST | null;
        if (altActionAst === null) {
            // the rule isn't followed by any commands
            return false;
        }

        // first child is the alt itself, subsequent are the actions
        for (let i = 1; i < altActionAst.getChildCount(); i++) {
            const node = altActionAst.getChild(i) as GrammarAST;
            if (node.getType() === ANTLRv4Parser.LEXER_ACTION_CALL) {
                if (node.getChild(0)!.getText() === "type") {
                    return true;
                }
            } else if (node.getText() === "more") {
                return true;
            }
        }

        return false;
    }

    protected assignTokenTypes(g: Grammar, tokensDefs: GrammarAST[],
        tokenIDs: GrammarAST[], terminals: GrammarAST[]): void {
        //Grammar G = g.getOutermostGrammar(); // put in root, even if imported

        // create token types for tokens { A, B, C } ALIASES
        for (const alias of tokensDefs) {
            if (g.getTokenType(alias.getText()) !== Token.INVALID_TYPE) {
                this.g.tool.errorManager.grammarError(ErrorType.TOKEN_NAME_REASSIGNMENT, g.fileName, alias.token!,
                    alias.getText());
            }

            g.defineTokenName(alias.getText());
        }

        // DEFINE TOKEN TYPES FOR TOKEN REFS LIKE ID, INT
        for (const idAST of tokenIDs) {
            if (g.getTokenType(idAST.getText()) === Token.INVALID_TYPE) {
                this.g.tool.errorManager.grammarError(ErrorType.IMPLICIT_TOKEN_DEFINITION, g.fileName, idAST.token!,
                    idAST.getText());
            }

            g.defineTokenName(idAST.getText());
        }

        // VERIFY TOKEN TYPES FOR STRING LITERAL REFS LIKE 'while', ';'
        for (const termAST of terminals) {
            if (termAST.getType() !== ANTLRv4Parser.STRING_LITERAL) {
                continue;
            }

            if (g.getTokenType(termAST.getText()) === Token.INVALID_TYPE) {
                this.g.tool.errorManager.grammarError(ErrorType.IMPLICIT_STRING_DEFINITION, g.fileName, termAST.token!,
                    termAST.getText());
            }
        }

        g.tool.logInfo({ component: "semantics", msg: "tokens=" + JSON.stringify(g.tokenNameToTypeMap.keys()) });
        g.tool.logInfo({ component: "semantics", msg: "strings=" + JSON.stringify(g.stringLiteralToTypeMap.keys()) });
    }

    /**
     * Assign constant values to custom channels defined in a grammar.
     *
     * @param g The grammar.
     * @param channelDefs A collection of AST nodes defining individual channels
     * within a {@code channels{}} block in the grammar.
     */
    protected assignChannelTypes(g: Grammar, channelDefs: GrammarAST[]): void {
        const outermost = g.getOutermostGrammar();
        for (const channel of channelDefs) {
            const channelName = channel.getText();

            // Channel names can't alias tokens or modes, because constant
            // values are also assigned to them and the ->channel(NAME) lexer
            // command does not distinguish between the various ways a constant
            // can be declared. This method does not verify that channels do not
            // alias rules, because rule names are not associated with constant
            // values in ANTLR grammar semantics.

            if (g.getTokenType(channelName) !== Token.INVALID_TYPE) {
                this.g.tool.errorManager.grammarError(ErrorType.CHANNEL_CONFLICTS_WITH_TOKEN, g.fileName,
                    channel.token!, channelName);
            }

            if (LexerATNFactory.COMMON_CONSTANTS.has(channelName)) {
                this.g.tool.errorManager.grammarError(ErrorType.CHANNEL_CONFLICTS_WITH_COMMON_CONSTANTS, g.fileName,
                    channel.token!, channelName);
            }

            if (outermost instanceof LexerGrammar) {
                const lexerGrammar = outermost;
                if (lexerGrammar.modes.has(channelName)) {
                    this.g.tool.errorManager.grammarError(ErrorType.CHANNEL_CONFLICTS_WITH_MODE, g.fileName,
                        channel.token!, channelName);
                }
            }

            outermost.defineChannelName(channel.getText());
        }
    }
}
