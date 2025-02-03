/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

// cspell:ignore ruleref

import { CharStream, CommonTokenStream } from "antlr4ng";

import { Constants } from "../Constants.js";
import { Tool } from "../Tool.js";
import type { SupportedLanguage } from "../codegen/CodeGenerator.js";
import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { OrderedHashMap } from "../misc/OrderedHashMap.js";
import { GrammarASTAdaptor } from "../parse/GrammarASTAdaptor.js";
import { ScopeParser } from "../parse/ScopeParser.js";
import { ToolANTLRParser } from "../parse/ToolANTLRParser.js";
import { BasicSemanticChecks } from "../semantics/BasicSemanticChecks.js";
import { RuleCollector } from "../semantics/RuleCollector.js";
import { ParseTreeToASTConverter } from "../support/ParseTreeToASTConverter.js";
import { isTokenName } from "../support/helpers.js";
import { DictType } from "../tool/DictType.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { GrammarTransformPipeline } from "../tool/GrammarTransformPipeline.js";
import { LabelElementPair } from "../tool/LabelElementPair.js";
import { LeftRecursiveRule } from "../tool/LeftRecursiveRule.js";
import { Rule } from "../tool/Rule.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { AltAST } from "../tool/ast/AltAST.js";
import { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import { GrammarRootAST } from "../tool/ast/GrammarRootAST.js";
import { RuleAST } from "../tool/ast/RuleAST.js";
import { ILeftRecursiveRuleAltInfo } from "./ILeftRecursiveRuleAltInfo.js";
import { LeftRecursiveRuleAnalyzer } from "./LeftRecursiveRuleAnalyzer.js";

/**
 * Remove left-recursive rule refs, add precedence args to recursive rule refs.
 *  Rewrite rule so we can create ATN.
 *
 *  MODIFIES grammar AST in place.
 */
export class LeftRecursiveRuleTransformer {
    public ast: GrammarRootAST;
    public rules: Rule[];
    public g: Grammar;
    public tool: Tool;

    public constructor(ast: GrammarRootAST, rules: Rule[], g: Grammar) {
        this.ast = ast;
        this.rules = rules;
        this.g = g;
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
                        this.g.tool.errorManager.grammarError(ErrorType.NONCONFORMING_LR_RULE, this.g.fileName,
                            (r.ast.getChild(0) as GrammarAST).token!, r.name);
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
            if (rule.getOptionString(Constants.PRECEDENCE_OPTION_NAME)) {
                // Already has arg; must be in rewritten rule.
                continue;
            }

            if (leftRecursiveRuleNames.includes(rule.getText())) {
                // Found ref to recursive rule not already rewritten with arg.
                rule.setOption(Constants.PRECEDENCE_OPTION_NAME,
                    new GrammarASTAdaptor().create(ANTLRv4Parser.INT, "0"));
            }
        }
    }

    /** @returns true if successful */
    public translateLeftRecursiveRule(context: GrammarRootAST, r: LeftRecursiveRule,
        language: SupportedLanguage): boolean {
        const prevRuleAST = r.ast;
        const ruleName = prevRuleAST.getChild(0)!.getText();
        const leftRecursiveRuleWalker = new LeftRecursiveRuleAnalyzer(prevRuleAST, this.tool, ruleName, language);

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
        // This could be an imported grammar so we cannot just reference `this.g` because the role might come from
        // the imported grammar and not the root grammar (this.g)
        const t = this.parseArtificialRule(prevRuleAST.g, newRuleText);
        if (t === undefined) {
            return false;
        }

        // Reuse the name token from the original AST since it refers to the proper source location in the original
        // grammar.
        (t.getChild(0) as GrammarAST).token = (prevRuleAST.getChild(0) as GrammarAST).token;

        // Update grammar AST and set rule's AST.
        rules.setChild(prevRuleAST.getChildIndex(), t);
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
            this.g.tool.errorManager.grammarError(ErrorType.NO_NON_LR_ALTS, this.g.fileName,
                (r.ast.getChild(0) as GrammarAST).token!, r.name);
        }

        r.recOpAlts = new OrderedHashMap<number, ILeftRecursiveRuleAltInfo>();
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
            const elementNode = labelOpNode.getChild(1) as GrammarAST;
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
            const ruleAST = root.getChild(0) as RuleAST;

            GrammarTransformPipeline.setGrammarPtr(g, ruleAST);
            GrammarTransformPipeline.augmentTokensWithOriginalPosition(g, ruleAST);

            return ruleAST;
        } catch (e) {
            this.g.tool.errorManager.toolError(ErrorType.INTERNAL_ERROR, e, ruleStart,
                "error parsing rule created during left-recursion detection: " + ruleText);
        }

        return undefined;
    }

    public setAltASTPointers(r: LeftRecursiveRule, t: RuleAST): void {
        const ruleBlk = t.getFirstChildWithType(ANTLRv4Parser.BLOCK) as BlockAST;
        const mainAlt = ruleBlk.getChild(0) as AltAST;
        const primaryBlk = mainAlt.getChild(0) as BlockAST;
        const opsBlk = mainAlt.getChild(1)!.getChild(0) as BlockAST; // (* BLOCK ...)

        for (let i = 0; i < r.recPrimaryAlts.length; i++) {
            const altInfo = r.recPrimaryAlts[i];
            altInfo.altAST = primaryBlk.getChild(i) as AltAST;
            altInfo.altAST.leftRecursiveAltInfo = altInfo;
            altInfo.originalAltAST!.leftRecursiveAltInfo = altInfo;
        }

        for (let i = 0; i < r.recOpAlts.size; i++) {
            const altInfo = r.recOpAlts.getElement(i)!;
            altInfo.altAST = opsBlk.getChild(i) as AltAST;
            altInfo.altAST.leftRecursiveAltInfo = altInfo;
            altInfo.originalAltAST!.leftRecursiveAltInfo = altInfo;
        }
    }

}
