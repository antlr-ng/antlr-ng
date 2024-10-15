/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CommonToken } from "antlr4ng";

import { CommonTreeNodeStream } from "../antlr3/tree/CommonTreeNodeStream.js";
import { TreeVisitor } from "../antlr3/tree/TreeVisitor.js";
import type { TreeVisitorAction } from "../antlr3/tree/TreeVisitorAction.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { BlockSetTransformer } from "../tree-walkers/BlockSetTransformer.js";

import { Tool } from "../Tool.js";
import { LeftRecursiveRuleTransformer } from "../analysis/LeftRecursiveRuleTransformer.js";
import { GrammarASTAdaptor } from "../parse/GrammarASTAdaptor.js";
import { GrammarToken } from "../parse/GrammarToken.js";
import { ErrorType } from "./ErrorType.js";
import { Grammar } from "./Grammar.js";
import { AltAST } from "./ast/AltAST.js";
import { BlockAST } from "./ast/BlockAST.js";
import { GrammarAST } from "./ast/GrammarAST.js";
import { GrammarASTWithOptions } from "./ast/GrammarASTWithOptions.js";
import { GrammarRootAST } from "./ast/GrammarRootAST.js";
import { RuleAST } from "./ast/RuleAST.js";
import { TerminalAST } from "./ast/TerminalAST.js";
import { GrammarType } from "../support/GrammarType.js";

/** Handle left-recursion and block-set transforms */
export class GrammarTransformPipeline {
    public g: Grammar;
    public tool: Tool;

    public constructor(g: Grammar, tool: Tool) {
        this.g = g;
        this.tool = tool;
    }

    /** Utility visitor that sets grammar ptr in each node */
    public static setGrammarPtr(g: Grammar, tree: GrammarAST | null): void {
        // ensure each node has pointer to surrounding grammar
        const v = new TreeVisitor(new GrammarASTAdaptor());
        v.visit(tree, new class implements TreeVisitorAction<GrammarAST> {
            public pre(t: GrammarAST): GrammarAST {
                t.g = g;

                return t;
            }

            public post(t: GrammarAST): GrammarAST { return t; }
        }());
    }

    public static augmentTokensWithOriginalPosition(g: Grammar, tree: GrammarAST): void {
        const optionsSubTrees = tree.getNodesWithType(ANTLRv4Parser.OPTIONS);
        for (const t of optionsSubTrees) {
            const elWithOpt = t.parent;
            if (elWithOpt instanceof GrammarASTWithOptions) {
                const options = elWithOpt.getOptions();
                if (options.has(LeftRecursiveRuleTransformer.TOKENINDEX_OPTION_NAME)) {
                    const newTok = new GrammarToken(g, elWithOpt.getToken()!);
                    newTok.originalTokenIndex = parseInt(
                        options.get(LeftRecursiveRuleTransformer.TOKENINDEX_OPTION_NAME)!.getText()!, 10);
                    elWithOpt.token = newTok;

                    const originalNode = g.ast!.getNodeWithTokenIndex(newTok.getTokenIndex());
                    if (originalNode !== null) {
                        // update the AST node start/stop index to match the values
                        // of the corresponding node in the original parse tree.
                        elWithOpt.setTokenStartIndex(originalNode.getTokenStartIndex());
                        elWithOpt.setTokenStopIndex(originalNode.getTokenStopIndex());
                    } else {
                        // the original AST node could not be located by index;
                        // make sure to assign valid values for the start/stop
                        // index so toTokenString will not throw exceptions.
                        elWithOpt.setTokenStartIndex(newTok.getTokenIndex());
                        elWithOpt.setTokenStopIndex(newTok.getTokenIndex());
                    }
                }
            }
        }
    }

    public process(): void {
        const root = this.g.ast;
        if (root === null) {
            return;
        }

        this.tool.logInfo({ component: "grammar", msg: `before: ${root.toStringTree()}` });

        this.integrateImportedGrammars(this.g);
        this.reduceBlocksToSets(root);
        this.expandParameterizedLoops(root);

        this.tool.logInfo({ component: "grammar", msg: `after: ${root.toStringTree()}` });
    }

    public reduceBlocksToSets(root: GrammarAST): void {
        const nodes = new CommonTreeNodeStream(new GrammarASTAdaptor(), root);
        const adaptor = new GrammarASTAdaptor();
        const transformer = new BlockSetTransformer(nodes, this.g);
        transformer.setTreeAdaptor(adaptor);
        transformer.downUp(root);
    }

    /**
     * Find and replace
     *      ID*[','] with ID (',' ID)*
     *      ID+[','] with ID (',' ID)+
     *      (x {action} y)+[','] with x {action} y (',' x {action} y)+
     *
     *  Parameter must be a token.
     *  todo: do we want?
     */
    public expandParameterizedLoops(root: GrammarAST): void {
        const v = new TreeVisitor(new GrammarASTAdaptor());
        v.visit(root, new class implements TreeVisitorAction<GrammarAST> {
            public constructor(private readonly $outer: GrammarTransformPipeline) { }
            public pre(t: GrammarAST): GrammarAST {
                if ((t).getType() === 3) {
                    return this.$outer.expandParameterizedLoop(t);
                }

                return t;
            }

            public post(t: GrammarAST): GrammarAST { return t; }
        }(this));
    }

    public expandParameterizedLoop(t: GrammarAST): GrammarAST {
        // todo: update grammar, alter AST
        return t;
    }

    /**
     * Merge all the rules, token definitions, and named actions from
     * imported grammars into the root grammar tree.  Perform:
     *
     *  (tokens { X (= Y 'y')) + (tokens { Z )	->	(tokens { X (= Y 'y') Z)
     *  (@ members {foo}) + (@ members {bar})	->	(@ members {foobar})
     *  (RULES (RULE x y)) + (RULES (RULE z))	->	(RULES (RULE x y z))
     * Rules in root prevent same rule from being appended to RULES node.
     *
     * The goal is a complete combined grammar so we can ignore subordinate grammars.
     */
    public integrateImportedGrammars(rootGrammar: Grammar): void {
        const imports = rootGrammar.getAllImportedGrammars();
        if (imports.length === 0) {
            return;
        }

        const root = rootGrammar.ast!;
        const id = root.getChild(0) as GrammarAST;
        const adaptor = new GrammarASTAdaptor(id.token!.inputStream!);

        let channelsRoot = root.getFirstChildWithType(ANTLRv4Parser.CHANNELS) as GrammarAST | null;
        let tokensRoot = root.getFirstChildWithType(ANTLRv4Parser.TOKENS) as GrammarAST | null;
        const actionRoots = root.getNodesWithType(ANTLRv4Parser.AT);

        // Compute list of rules in root grammar and ensure we have a RULES node
        const RULES = root.getFirstChildWithType(ANTLRv4Parser.RULE_REF) as GrammarAST;
        const rootRuleNames = new Set<string>();

        // make list of rules we have in root grammar
        const rootRules = RULES.getNodesWithType(ANTLRv4Parser.RULE_REF);
        for (const r of rootRules) {
            rootRuleNames.add(r.getChild(0)!.getText()!);
        }

        // make list of modes we have in root grammar
        const rootModes = root.getNodesWithType(ANTLRv4Parser.MODE);
        const rootModeNames = new Set<string>();
        for (const m of rootModes) {
            rootModeNames.add(m.getChild(0)!.getText()!);
        }

        for (const imp of imports) {
            // COPY CHANNELS
            const imp_channelRoot = imp.ast!.getFirstChildWithType(ANTLRv4Parser.CHANNELS) as GrammarAST | null;
            if (imp_channelRoot !== null) {
                rootGrammar.tool.logInfo({
                    component: "grammar",
                    msg: `imported channels: ${imp_channelRoot.getChildren()}`
                });

                if (channelsRoot === null) {
                    channelsRoot = imp_channelRoot.dupTree();
                    channelsRoot.g = rootGrammar;
                    root.insertChild(1, channelsRoot); // ^(GRAMMAR ID TOKENS...)
                } else {
                    for (let c = 0; c < imp_channelRoot.getChildCount(); ++c) {
                        const channel = imp_channelRoot.getChild(c)!.getText();
                        let channelIsInRootGrammar = false;
                        for (let rc = 0; rc < channelsRoot.getChildCount(); ++rc) {
                            const rootChannel = channelsRoot.getChild(rc)!.getText();
                            if (rootChannel === channel) {
                                channelIsInRootGrammar = true;
                                break;
                            }
                        }
                        if (!channelIsInRootGrammar) {
                            channelsRoot.addChild(imp_channelRoot.getChild(c)!.dupNode());
                        }
                    }
                }
            }

            // COPY TOKENS
            const imp_tokensRoot = imp.ast!.getFirstChildWithType(ANTLRv4Parser.TOKENS) as GrammarAST | null;
            if (imp_tokensRoot !== null) {
                rootGrammar.tool.logInfo({
                    component: "grammar",
                    msg: `imported tokens: ${imp_tokensRoot.getChildren()}`
                });

                if (tokensRoot === null) {
                    tokensRoot = adaptor.create(ANTLRv4Parser.TOKENS, "TOKENS");
                    tokensRoot.g = rootGrammar;
                    root.insertChild(1, tokensRoot); // ^(GRAMMAR ID TOKENS...)
                }
                tokensRoot.addChildren(imp_tokensRoot.getChildren());
            }

            const all_actionRoots = new Array<GrammarAST>();
            const imp_actionRoots = imp.ast!.getAllChildrenWithType(ANTLRv4Parser.AT);
            all_actionRoots.push(...actionRoots);
            all_actionRoots.push(...imp_actionRoots);

            // COPY ACTIONS
            const namedActions = new Map<string, Map<string, GrammarAST>>();
            rootGrammar.tool.logInfo({
                component: "grammar",
                msg: `imported actions: ${imp_actionRoots}`
            });

            for (const at of all_actionRoots) {
                let scopeName = rootGrammar.getDefaultActionScope();
                let scope: GrammarAST;
                let name: GrammarAST;
                let action: GrammarAST;
                if (at.getChildCount() > 2) { // must have a scope
                    scope = at.getChild(0) as GrammarAST;
                    scopeName = scope.getText();
                    name = at.getChild(1) as GrammarAST;
                    action = at.getChild(2) as GrammarAST;
                } else {
                    name = at.getChild(0) as GrammarAST;
                    action = at.getChild(1) as GrammarAST;
                }

                const prevAction = namedActions.get(scopeName!)?.get(name.getText()!);
                if (!prevAction) {
                    const mapping = namedActions.get(scopeName!) ?? new Map<string, GrammarAST>();
                    mapping.set(name.getText()!, action);
                    namedActions.set(scopeName!, mapping);
                } else {
                    if (prevAction.g === at.g) {
                        rootGrammar.tool.errMgr.grammarError(ErrorType.ACTION_REDEFINITION,
                            at.g.fileName, name.token, name.getText());
                    } else {
                        let s1 = prevAction.getText()!;
                        s1 = s1.substring(1, s1.length - 1);
                        let s2 = action.getText()!;
                        s2 = s2.substring(1, s2.length - 1);
                        const combinedAction = "{" + s1 + "\n" + s2 + "}";
                        prevAction.token!.text = combinedAction;
                    }
                }
            }

            // at this point, we have complete list of combined actions,
            // some of which are already living in root grammar.
            // Merge in any actions not in root grammar into root's tree.
            for (const [scopeName, mapping] of namedActions) {
                for (const [name, action] of mapping) {
                    rootGrammar.tool.logInfo({
                        component: "grammar",
                        msg: `${action.g.name} ${scopeName}:${name}=${action.getText()}`
                    });
                    if (action.g !== rootGrammar) {
                        root.insertChild(1, action.getParent()!);
                    }
                }
            }

            // COPY MODES
            // The strategy is to copy all the mode sections rules across to any
            // mode section in the new grammar with the same name or a new
            // mode section if no matching mode is resolved. Rules which are
            // already in the new grammar are ignored for copy. If the mode
            // section being added ends up empty it is not added to the merged
            // grammar.
            const modes = imp.ast!.getNodesWithType(ANTLRv4Parser.MODE);
            for (const m of modes) {
                rootGrammar.tool.logInfo({ component: "grammar", msg: `imported mode: ${m.toStringTree()}` });
                const name = m.getChild(0)!.getText()!;
                const rootAlreadyHasMode = rootModeNames.has(name);
                let destinationAST = null;
                if (rootAlreadyHasMode) {
                    for (const m2 of rootModes) {
                        if (m2.getChild(0)!.getText() === name) {
                            destinationAST = m2;
                            break;
                        }
                    }
                } else {
                    destinationAST = m.dupNode();
                    destinationAST.addChild(m.getChild(0)!.dupNode());
                }

                let addedRules = 0;
                const modeRules = m.getAllChildrenWithType(ANTLRv4Parser.RULE_REF);
                for (const r of modeRules) {
                    rootGrammar.tool.logInfo({ component: "grammar", msg: `imported rule: ${r.toStringTree()}` });
                    const ruleName = r.getChild(0)!.getText()!;
                    const rootAlreadyHasRule = rootRuleNames.has(ruleName);
                    if (!rootAlreadyHasRule) {
                        destinationAST?.addChild(r);
                        addedRules++;
                        rootRuleNames.add(ruleName);
                    }
                }

                if (!rootAlreadyHasMode && addedRules > 0 && destinationAST) {
                    rootGrammar.ast!.addChild(destinationAST);
                    rootModeNames.add(name);
                    rootModes.push(destinationAST);
                }
            }

            // COPY RULES
            // Rules copied in the mode copy phase are not copied again.
            const rules = imp.ast!.getNodesWithType(ANTLRv4Parser.RULE_REF);
            for (const r of rules) {
                rootGrammar.tool.logInfo({ component: "grammar", msg: `imported rule: ${r.toStringTree()}` });
                const name = r.getChild(0)!.getText()!;
                const rootAlreadyHasRule = rootRuleNames.has(name);
                if (!rootAlreadyHasRule) {
                    RULES.addChild(r); // merge in if not overridden
                    rootRuleNames.add(name);
                }
            }

            const optionsRoot = imp.ast!.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
            if (optionsRoot !== null) {
                // suppress the warning if the options match the options specified
                // in the root grammar
                // https://github.com/antlr/antlr4/issues/707
                let hasNewOption = false;
                for (const [key] of imp.ast!.getOptions()) {
                    const importOption = imp.ast!.getOptionString(key);
                    if (!importOption) {
                        continue;
                    }

                    const rootOption = rootGrammar.ast!.getOptionString(key);
                    if (importOption !== rootOption) {
                        hasNewOption = true;
                        break;
                    }
                }

                if (hasNewOption) {
                    rootGrammar.tool.errMgr.grammarError(ErrorType.OPTIONS_IN_DELEGATE, optionsRoot.g.fileName,
                        optionsRoot.token, imp.name);
                }
            }
        }
        rootGrammar.tool.logInfo({ component: "grammar", msg: `Grammar: ${rootGrammar.ast!.toStringTree()}` });
    }

    /**
     * Build lexer grammar from combined grammar that looks like:
     *
     *  (COMBINED_GRAMMAR A
     *      (tokens { X (= Y 'y'))
     *      (OPTIONS (= x 'y'))
     *      (@ members {foo})
     *      (@ lexer header {package jj;})
     *      (RULES (RULE .+)))
     *
     *  Move rules and actions to new tree, don't dup. Split AST apart.
     *  We'll have this Grammar share token symbols later; don't generate
     *  tokenVocab or tokens{} section.  Copy over named actions.
     *
     *  Side-effects: it removes children from GRAMMAR &amp; RULES nodes
     *                in combined AST.  Anything cut out is dup'd before
     *                adding to lexer to avoid "who's ur daddy" issues
     */
    public extractImplicitLexer(combinedGrammar: Grammar): GrammarRootAST | null {
        const combinedAST = combinedGrammar.ast!;
        const adaptor = new GrammarASTAdaptor(combinedAST.token!.inputStream!);
        const elements = combinedAST.getChildren();

        // MAKE A GRAMMAR ROOT and ID
        const lexerName = `${combinedAST.getChild(0)!.getText()}Lexer`;
        const lexerAST = new GrammarRootAST(CommonToken.fromType(ANTLRv4Parser.GRAMMAR, "LEXER_GRAMMAR"),
            combinedGrammar.ast!.tokenStream);
        lexerAST.grammarType = GrammarType.Lexer;
        lexerAST.token!.inputStream = combinedAST.token!.inputStream;
        lexerAST.addChild(adaptor.create(ANTLRv4Parser.ID, lexerName));

        // COPY OPTIONS
        const optionsRoot = combinedAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (optionsRoot !== null && optionsRoot.getChildCount() !== 0) {
            const lexerOptionsRoot = adaptor.dupNode(optionsRoot);
            lexerAST.addChild(lexerOptionsRoot);
            const options = optionsRoot.getChildren();
            for (const o of options) {
                const optionName = o.getChild(0)!.getText()!;
                if (Grammar.lexerOptions.has(optionName) &&
                    !Grammar.doNotCopyOptionsToLexer.has(optionName)) {
                    const optionTree = adaptor.dupTree(o) as GrammarAST;
                    lexerOptionsRoot.addChild(optionTree);
                    lexerAST.setOption(optionName, optionTree.getChild(1) as GrammarAST);
                }
            }
        }

        // COPY all named actions, but only move those with lexer:: scope
        const actionsWeMoved = new Array<GrammarAST>();
        for (const e of elements) {
            if (e.getType() === ANTLRv4Parser.AT) {
                lexerAST.addChild(adaptor.dupTree(e));
                if (e.getChild(0)!.getText() === "lexer") {
                    actionsWeMoved.push(e as GrammarAST);
                }
            }
        }

        for (const r of actionsWeMoved) {
            combinedAST.deleteChild(r);
        }

        const combinedRulesRoot = combinedAST.getFirstChildWithType(ANTLRv4Parser.RULE_REF) as GrammarAST | null;
        if (combinedRulesRoot === null) {
            return lexerAST;
        }

        // MOVE lexer rules

        const lexerRulesRoot = adaptor.create(ANTLRv4Parser.RULE_REF, "RULES");
        lexerAST.addChild(lexerRulesRoot);
        const rulesWeMoved = new Array<GrammarAST>();
        let rules: GrammarASTWithOptions[];
        if (combinedRulesRoot.getChildCount() > 0) {
            rules = combinedRulesRoot.getChildren() as GrammarASTWithOptions[];
        } else {
            rules = new Array<GrammarASTWithOptions>(0);
        }

        for (const r of rules) {
            const ruleName = r.getChild(0)!.getText()!;
            if (Grammar.isTokenName(ruleName)) {
                lexerRulesRoot.addChild(adaptor.dupTree(r));
                rulesWeMoved.push(r);
            }
        }

        for (const r of rulesWeMoved) {
            combinedRulesRoot.deleteChild(r);
        }

        // Will track 'if' from IF : 'if' ; rules to avoid defining new token for 'if'
        const litAliases = Grammar.getStringLiteralAliasesFromLexerRules(lexerAST);

        const stringLiterals = combinedGrammar.getStringLiterals();
        // add strings from combined grammar (and imported grammars) into lexer
        // put them first as they are keywords; must resolve ambigs to these rules
        //		tool.log("grammar", "strings from parser: "+stringLiterals);
        let insertIndex = 0;
        nextLit:
        for (const lit of stringLiterals) {
            // if lexer already has a rule for literal, continue
            if (litAliases !== null) {
                for (const pair of litAliases) {
                    const litAST = pair[1];
                    if (lit === litAST.getText()) {
                        continue nextLit;
                    }

                }
            }

            // create for each literal: (RULE <unique-name> (BLOCK (ALT <lit>))
            const ruleName = combinedGrammar.getStringLiteralLexerRuleName(lit);

            // can't use wizard; need special node types
            const litRule = new RuleAST(ANTLRv4Parser.RULE_REF);
            const blk = new BlockAST(ANTLRv4Parser.LPAREN);
            const alt = new AltAST(ANTLRv4Parser.OR);

            const slit = new TerminalAST(CommonToken.fromType(ANTLRv4Parser.STRING_LITERAL, lit));
            alt.addChild(slit);
            blk.addChild(alt);

            const idToken = CommonToken.fromType(ANTLRv4Parser.TOKEN_REF, ruleName);
            litRule.addChild(new TerminalAST(idToken));
            litRule.addChild(blk);
            lexerRulesRoot.insertChild(insertIndex, litRule);

            lexerRulesRoot.freshenParentAndChildIndexes(); // reset indexes and set litRule parent

            // next literal will be added after the one just added
            insertIndex++;
        }

        // TODO: take out after stable if slow
        lexerAST.sanityCheckParentAndChildIndexes();
        combinedAST.sanityCheckParentAndChildIndexes();

        combinedGrammar.tool.logInfo({
            component: "grammar",
            msg: `after extract implicit lexer =${combinedAST.toStringTree()}`
        });
        combinedGrammar.tool.logInfo({ component: "grammar", msg: `lexer =${lexerAST.toStringTree()}` });

        if (lexerRulesRoot.getChildCount() === 0) {
            return null;
        }

        return lexerAST;
    }

}
