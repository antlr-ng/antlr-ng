/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

// cspell:ignore ruleref

import { CharStream, CommonToken, CommonTokenStream } from "antlr4ng";

import type { ITargetGenerator } from "src/codegen/ITargetGenerator.js";
import { Constants } from "../Constants.js";
import type { Tool } from "../Tool.js";
import type { SupportedLanguage } from "../codegen/CodeGenerator.js";
import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { DictType } from "../misc/types.js";
import { ScopeParser } from "../parse/ScopeParser.js";
import { ToolANTLRParser } from "../parse/ToolANTLRParser.js";
import { BasicSemanticChecks } from "../semantics/BasicSemanticChecks.js";
import { RuleCollector } from "../semantics/RuleCollector.js";
import { ParseTreeToASTConverter } from "../support/ParseTreeToASTConverter.js";
import { isTokenName } from "../support/helpers.js";
import type { Grammar } from "../tool/Grammar.js";
import { GrammarTransformPipeline } from "../tool/GrammarTransformPipeline.js";
import { IssueCode } from "../tool/Issues.js";
import { LabelElementPair } from "../tool/LabelElementPair.js";
import type { LeftRecursiveRule } from "../tool/LeftRecursiveRule.js";
import type { Rule } from "../tool/Rule.js";
import type { ActionAST } from "../tool/ast/ActionAST.js";
import type { AltAST } from "../tool/ast/AltAST.js";
import type { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { GrammarRootAST } from "../tool/ast/GrammarRootAST.js";
import type { RuleAST } from "../tool/ast/RuleAST.js";
import type { ILeftRecursiveRuleAltInfo } from "./ILeftRecursiveRuleAltInfo.js";
import { LeftRecursiveRuleAnalyzer } from "./LeftRecursiveRuleAnalyzer.js";

/**
 * Remove left-recursive rule refs, add precedence args to recursive rule refs.
 * Rewrite rule so we can create ATN.
 *
 * Modifies grammar AST in place.
 */
export class LeftRecursiveRuleTransformer {
    private tool: Tool;

    public constructor(private ast: GrammarRootAST, private rules: Rule[], private g: Grammar,
        private targetGenerator: ITargetGenerator) {
        this.tool = g.tool;
    }

    public translateLeftRecursiveRules(): void {
        const language = this.g.getLanguage();

        // Translate all recursive rules.
        const leftRecursiveRuleNames: string[] = [];
        for (const r of this.rules) {
            if (!isTokenName(r.name)) {
                if (LeftRecursiveRuleAnalyzer.hasImmediateRecursiveRuleRefs(r.ast, r.name)) {
                    const fitsPattern = this.translateLeftRecursiveRule(this.ast, r as LeftRecursiveRule, language);
                    if (fitsPattern) {
                        leftRecursiveRuleNames.push(r.name);
                    } else { // Better given an error that non-conforming left-recursion exists.
                        this.g.tool.errorManager.grammarError(IssueCode.NonconformingLrRule, this.g.fileName,
                            (r.ast.children[0] as GrammarAST).token!, r.name);
                    }
                }
            }
        }

        // Update all refs to recursive rules to have [0] argument.
        const ruleRefs = this.ast.getNodesWithType(ANTLRv4Parser.RULE_REF);
        for (const r of ruleRefs) {
            if (r.parent!.getType() === ANTLRv4Parser.RULE) { // must be rule def
                continue;
            }

            const rule = r as GrammarASTWithOptions;
            if (rule.getOptionString(Constants.PrecedenceOptionName)) {
                // Already has arg; must be in rewritten rule.
                continue;
            }

            if (leftRecursiveRuleNames.includes(rule.getText())) {
                // Found ref to recursive rule not already rewritten with arg.
                const token = CommonToken.fromType(ANTLRv4Parser.INT, "0");
                rule.setOption(Constants.PrecedenceOptionName, new GrammarAST(token));
            }
        }
    }

    /** @returns true if successful */
    public translateLeftRecursiveRule(context: GrammarRootAST, r: LeftRecursiveRule,
        language: SupportedLanguage): boolean {
        const prevRuleAST = r.ast;
        const ruleName = prevRuleAST.children[0].getText();
        const leftRecursiveRuleWalker = new LeftRecursiveRuleAnalyzer(prevRuleAST, this.tool, ruleName, language,
            this.targetGenerator);

        let isLeftRec: boolean;
        try {
            isLeftRec = leftRecursiveRuleWalker.recursiveRule();
        } catch {
            isLeftRec = false; // Didn't match.
        }

        if (!isLeftRec) {
            return false;
        }

        // Replace old rule's AST. First create text of altered rule.
        const rules = context.getFirstChildWithType(ANTLRv4Parser.RULES) as GrammarAST;
        const newRuleText = leftRecursiveRuleWalker.getArtificialOpPrecRule();

        // Now parse within the context of the grammar that originally created the AST we are transforming.
        // This could be an imported grammar so we cannot just reference `this.g` because the rule might come from
        // the imported grammar and not the root grammar (this.g).
        const t = this.parseArtificialRule(prevRuleAST.g, newRuleText);
        if (t === undefined) {
            return false;
        }

        // Reuse the name token from the original AST since it refers to the proper source location in the original
        // grammar.
        (t.children[0] as GrammarAST).token = (prevRuleAST.children[0] as GrammarAST).token;

        // Update grammar AST and set rule's AST.
        rules.setChild(prevRuleAST.childIndex, t);
        r.ast = t;

        // Reduce sets in newly created rule tree.
        const transform = new GrammarTransformPipeline(this.g, this.g.tool);
        transform.reduceBlocksToSets(r.ast);

        // Re-run semantic checks on the new rule.
        const ruleCollector = new RuleCollector(this.g);
        ruleCollector.visit(t, ANTLRv4Parser.RULE_ruleSpec);
        const basics = new BasicSemanticChecks(this.g, ruleCollector);

        // Disable the assoc element option checks because they are already handled for the pre-transformed rule.
        basics.checkAssocElementOption = false;

        basics.visit(t, ANTLRv4Parser.RULE_ruleSpec);

        // Track recursive alt info for code generation.
        r.recPrimaryAlts = new Array<ILeftRecursiveRuleAltInfo>();
        r.recPrimaryAlts.push(...leftRecursiveRuleWalker.prefixAndOtherAlts);
        if (r.recPrimaryAlts.length === 0) {
            this.g.tool.errorManager.grammarError(IssueCode.NoNonLrAlts, this.g.fileName,
                (r.ast.children[0] as GrammarAST).token!, r.name);
        }

        r.recOpAlts = new Map<number, ILeftRecursiveRuleAltInfo>();
        leftRecursiveRuleWalker.binaryAlts.forEach((value, key) => {
            r.recOpAlts.set(key, value);
        });

        leftRecursiveRuleWalker.ternaryAlts.forEach((value, key) => {
            r.recOpAlts.set(key, value);
        });

        leftRecursiveRuleWalker.suffixAlts.forEach((value, key) => {
            r.recOpAlts.set(key, value);
        });

        // Walk alt info records and set their altAST to point to appropriate ALT subtree from freshly created AST.s
        this.setAltASTPointers(r, t);

        // Update Rule to just one alt and add prec alt.
        const arg = r.ast.getFirstChildWithType(ANTLRv4Parser.ARG_ACTION) as ActionAST | null;
        if (arg !== null) {
            r.args = ScopeParser.parseTypedArgList(arg, arg.getText(), this.g);
            r.args.type = DictType.Argument;
            r.args.ast = arg;
            arg.resolver = r.alt[1];
        }

        // Define labels on recursive rule refs we delete. They don't point to nodes of course
        // these are so $label in action translation works.
        for (const [ast, _] of leftRecursiveRuleWalker.leftRecursiveRuleRefLabels) {
            const labelOpNode = ast.parent as GrammarAST;
            const elementNode = labelOpNode.children[1] as GrammarAST;
            const lp = new LabelElementPair(this.g, ast, elementNode, labelOpNode.getType());
            r.alt[1].labelDefs.set(ast.getText(), [lp]);
        }

        // Copy to rule from walker.
        r.leftRecursiveRuleRefLabels = leftRecursiveRuleWalker.leftRecursiveRuleRefLabels;

        this.tool.logInfo({ component: "grammar", msg: "added: " + t.toStringTree() });

        return true;
    }

    public parseArtificialRule(g: Grammar, ruleText: string): RuleAST | undefined {
        const stream = CharStream.fromString(ruleText);
        stream.name = g.fileName;
        const lexer = new ANTLRv4Lexer(stream);
        const tokens = new CommonTokenStream(lexer);
        const p = new ToolANTLRParser(tokens, this.tool);
        const ruleStart = null;

        try {
            const r = p.ruleSpec();
            const root = new GrammarAST();
            ParseTreeToASTConverter.convertRuleSpecToAST(r, root);
            const ruleAST = root.children[0] as RuleAST;

            GrammarTransformPipeline.setGrammarPtr(g, ruleAST);
            GrammarTransformPipeline.augmentTokensWithOriginalPosition(g, ruleAST);

            return ruleAST;
        } catch (e) {
            this.g.tool.errorManager.toolError(IssueCode.InternalError, e as Error, ruleStart,
                "error parsing rule created during left-recursion detection: " + ruleText);
        }

        return undefined;
    }

    public setAltASTPointers(r: LeftRecursiveRule, t: RuleAST): void {
        const ruleBlk = t.getFirstChildWithType(ANTLRv4Parser.BLOCK) as BlockAST;
        const mainAlt = ruleBlk.children[0] as AltAST;
        const primaryBlk = mainAlt.children[0] as BlockAST;
        const opsBlk = mainAlt.children[1].children[0] as BlockAST; // (* BLOCK ...)

        for (let i = 0; i < r.recPrimaryAlts.length; i++) {
            const altInfo = r.recPrimaryAlts[i];
            altInfo.altAST = primaryBlk.children[i] as AltAST;
            altInfo.altAST.leftRecursiveAltInfo = altInfo;
            altInfo.originalAltAST!.leftRecursiveAltInfo = altInfo;
        }

        const altInfos = Array.from(r.recOpAlts.values());
        for (let i = 0; i < altInfos.length; i++) {
            const altInfo = altInfos[i];
            altInfo.altAST = opsBlk.children[i] as AltAST;
            altInfo.altAST.leftRecursiveAltInfo = altInfo;
            altInfo.originalAltAST!.leftRecursiveAltInfo = altInfo;
        }
    }

}
