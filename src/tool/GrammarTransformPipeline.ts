/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CommonToken } from "antlr4ng";

import { CommonTreeNodeStream } from "../tree/CommonTreeNodeStream.js";
import { TreeVisitor } from "../tree/TreeVisitor.js";
import type { TreeVisitorAction } from "../tree/TreeVisitorAction.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { BlockSetTransformer } from "../tree/walkers/BlockSetTransformer.js";

import { Constants } from "../Constants.js";
import { Tool } from "../Tool.js";
import { GrammarASTAdaptor } from "../parse/GrammarASTAdaptor.js";
import { GrammarToken } from "../parse/GrammarToken.js";
import { GrammarType } from "../support/GrammarType.js";
import { dupTree, isTokenName } from "../support/helpers.js";
import type { CommonTree } from "../tree/CommonTree.js";
import { ErrorType } from "./ErrorType.js";
import { Grammar } from "./Grammar.js";
import { AltAST } from "./ast/AltAST.js";
import { BlockAST } from "./ast/BlockAST.js";
import { GrammarAST } from "./ast/GrammarAST.js";
import { GrammarASTWithOptions } from "./ast/GrammarASTWithOptions.js";
import { GrammarRootAST } from "./ast/GrammarRootAST.js";
import { RuleAST } from "./ast/RuleAST.js";
import { TerminalAST } from "./ast/TerminalAST.js";

/** Handle left-recursion and block-set transforms */
export class GrammarTransformPipeline {
    public g: Grammar;

    public constructor(g: Grammar, private tool: Tool) {
        this.g = g;
    }

    /** Utility visitor that sets grammar ptr in each node */
    public static setGrammarPtr(g: Grammar, tree: GrammarAST): void {
        // ensure each node has pointer to surrounding grammar
        const v = new TreeVisitor(new GrammarASTAdaptor());
        v.visit(tree, new class implements TreeVisitorAction<GrammarAST> {
            public pre(t: GrammarAST): GrammarAST {
                t.g = g;

                return t;
            }

            public post(t: GrammarAST): GrammarAST {
                return t;
            }
        }());
    }

    public static augmentTokensWithOriginalPosition(g: Grammar, tree: GrammarAST): void {
        const optionsSubTrees = tree.getNodesWithType(ANTLRv4Parser.ELEMENT_OPTIONS);
        for (const t of optionsSubTrees) {
            const elWithOpt = t.parent;
            if (elWithOpt instanceof GrammarASTWithOptions) {
                const options = elWithOpt.getOptions();
                if (options.has(Constants.TOKENINDEX_OPTION_NAME)) {
                    const newTok = new GrammarToken(g, elWithOpt.token!);
                    newTok.originalTokenIndex = parseInt(options.get(Constants.TOKENINDEX_OPTION_NAME)!.getText(), 10);
                    elWithOpt.token = newTok;

                    const originalNode = g.ast.getNodeWithTokenIndex(newTok.getTokenIndex());
                    if (originalNode) {
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
        const grammarRoot = this.g.ast;

        this.tool.logInfo({ component: "grammar", msg: `before: ${grammarRoot.toStringTree()}` });

        this.integrateImportedGrammars(this.g);
        this.reduceBlocksToSets(grammarRoot);

        this.tool.logInfo({ component: "grammar", msg: `after: ${grammarRoot.toStringTree()}` });
    }

    public reduceBlocksToSets(root: CommonTree): void {
        const nodes = new CommonTreeNodeStream(new GrammarASTAdaptor(), root);
        const transformer = new BlockSetTransformer(this.tool.errorManager, nodes, this.g);
        transformer.downUp(root);
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

        const root = rootGrammar.ast;
        const adaptor = new GrammarASTAdaptor();

        let channelsRoot = root.getFirstChildWithType(ANTLRv4Parser.CHANNELS) as GrammarAST | null;
        let tokensRoot = root.getFirstChildWithType(ANTLRv4Parser.TOKENS) as GrammarAST | null;
        const actionRoots = root.getNodesWithType(ANTLRv4Parser.AT);

        // Compute list of rules in root grammar and ensure we have a RULES node
        const rootRulesRoot = root.getFirstChildWithType(ANTLRv4Parser.RULES) as GrammarAST;
        const rootRuleNames = new Set<string>();

        // make list of rules we have in root grammar
        const rootRules = rootRulesRoot.getNodesWithType(ANTLRv4Parser.RULE);
        for (const r of rootRules) {
            rootRuleNames.add(r.children[0].getText());
        }

        // make list of modes we have in root grammar
        const rootModes = root.getNodesWithType(ANTLRv4Parser.MODE);
        const rootModeNames = new Set<string>();
        for (const m of rootModes) {
            rootModeNames.add(m.children[0].getText());
        }

        for (const imp of imports) {
            // COPY CHANNELS
            const importedChannelRoot = imp.ast.getFirstChildWithType(ANTLRv4Parser.CHANNELS) as GrammarAST | null;
            if (importedChannelRoot !== null) {
                rootGrammar.tool.logInfo({
                    component: "grammar",
                    msg: `imported channels: ${importedChannelRoot.children}`
                });

                if (channelsRoot === null) {
                    channelsRoot = dupTree(importedChannelRoot);
                    channelsRoot.g = rootGrammar;
                    root.insertChild(1, channelsRoot); // ^(GRAMMAR ID TOKENS...)
                } else {
                    for (const channel of importedChannelRoot.children) {
                        let channelIsInRootGrammar = false;
                        for (const rootChannel of channelsRoot.children) {
                            const rootChannelText = rootChannel.getText();
                            if (rootChannelText === channel.getText()) {
                                channelIsInRootGrammar = true;
                                break;
                            }
                        }
                        if (!channelIsInRootGrammar) {
                            channelsRoot.addChild(channel.dupNode());
                        }
                    }
                }
            }

            // COPY TOKENS
            const importedTokensRoot = imp.ast.getFirstChildWithType(ANTLRv4Parser.TOKENS) as GrammarAST | null;
            if (importedTokensRoot !== null) {
                rootGrammar.tool.logInfo({
                    component: "grammar",
                    msg: `imported tokens: ${importedTokensRoot.children}`
                });

                if (tokensRoot === null) {
                    tokensRoot = adaptor.create(ANTLRv4Parser.TOKENS, "TOKENS");
                    tokensRoot.g = rootGrammar;
                    root.insertChild(1, tokensRoot); // ^(GRAMMAR ID TOKENS...)
                }
                tokensRoot.addChildren(importedTokensRoot.children);
            }

            const allActionRoots = new Array<GrammarAST>();
            const importedActionRoots = imp.ast.getAllChildrenWithType(ANTLRv4Parser.AT);
            allActionRoots.push(...actionRoots);
            allActionRoots.push(...importedActionRoots);

            // COPY ACTIONS
            const namedActions = new Map<string, Map<string, GrammarAST>>();
            rootGrammar.tool.logInfo({
                component: "grammar",
                msg: `imported actions: ${importedActionRoots}`
            });

            for (const at of allActionRoots) {
                let scopeName = rootGrammar.getDefaultActionScope();
                let scope: GrammarAST;
                let name: GrammarAST;
                let action: GrammarAST;
                if (at.children.length > 2) { // must have a scope
                    scope = at.children[0] as GrammarAST;
                    scopeName = scope.getText();
                    name = at.children[1] as GrammarAST;
                    action = at.children[2] as GrammarAST;
                } else {
                    name = at.children[0] as GrammarAST;
                    action = at.children[1] as GrammarAST;
                }

                const prevAction = namedActions.get(scopeName!)?.get(name.getText());
                if (!prevAction) {
                    const mapping = namedActions.get(scopeName!) ?? new Map<string, GrammarAST>();
                    mapping.set(name.getText(), action);
                    namedActions.set(scopeName!, mapping);
                } else {
                    if (prevAction.g === at.g) {
                        this.tool.errorManager.grammarError(ErrorType.ACTION_REDEFINITION, at.g.fileName, name.token!,
                            name.getText());
                    } else {
                        let s1 = prevAction.getText();
                        s1 = s1.substring(1, s1.length - 1);
                        let s2 = action.getText();
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
                        root.insertChild(1, action.parent!);
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
            const modes = imp.ast.getNodesWithType(ANTLRv4Parser.MODE);
            for (const m of modes) {
                rootGrammar.tool.logInfo({ component: "grammar", msg: `imported mode: ${m.toStringTree()}` });
                const name = m.children[0].getText();
                const rootAlreadyHasMode = rootModeNames.has(name);
                let destinationAST = null;
                if (rootAlreadyHasMode) {
                    for (const m2 of rootModes) {
                        if (m2.children[0].getText() === name) {
                            destinationAST = m2;
                            break;
                        }
                    }
                } else {
                    destinationAST = m.dupNode();
                    destinationAST.addChild(m.children[0].dupNode());
                }

                let addedRules = 0;
                const modeRules = m.getAllChildrenWithType(ANTLRv4Parser.RULE);
                for (const r of modeRules) {
                    rootGrammar.tool.logInfo({ component: "grammar", msg: `imported rule: ${r.toStringTree()}` });
                    const ruleName = r.children[0].getText();
                    const rootAlreadyHasRule = rootRuleNames.has(ruleName);
                    if (!rootAlreadyHasRule) {
                        destinationAST?.addChild(r);
                        addedRules++;
                        rootRuleNames.add(ruleName);
                    }
                }

                if (!rootAlreadyHasMode && addedRules > 0 && destinationAST) {
                    rootGrammar.ast.addChild(destinationAST);
                    rootModeNames.add(name);
                    rootModes.push(destinationAST);
                }
            }

            // COPY RULES
            // Rules copied in the mode copy phase are not copied again.
            const rules = imp.ast.getNodesWithType(ANTLRv4Parser.RULE);
            for (const r of rules) {
                rootGrammar.tool.logInfo({ component: "grammar", msg: `imported rule: ${r.toStringTree()}` });
                const name = r.children[0].getText();
                const rootAlreadyHasRule = rootRuleNames.has(name);
                if (!rootAlreadyHasRule) {
                    rootRulesRoot.addChild(r); // merge in if not overridden
                    rootRuleNames.add(name);
                }
            }

            const optionsRoot = imp.ast.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
            if (optionsRoot !== null) {
                // suppress the warning if the options match the options specified
                // in the root grammar
                // https://github.com/antlr/antlr4/issues/707
                let hasNewOption = false;
                for (const [key] of imp.ast.getOptions()) {
                    const importOption = imp.ast.getOptionString(key);
                    if (!importOption) {
                        continue;
                    }

                    const rootOption = rootGrammar.ast.getOptionString(key);
                    if (importOption !== rootOption) {
                        hasNewOption = true;
                        break;
                    }
                }

                if (hasNewOption) {
                    this.tool.errorManager.grammarError(ErrorType.OPTIONS_IN_DELEGATE, optionsRoot.g.fileName,
                        optionsRoot.token!, imp.name);
                }
            }
        }
        rootGrammar.tool.logInfo({ component: "grammar", msg: `Grammar: ${rootGrammar.ast.toStringTree()}` });
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
    public extractImplicitLexer(combinedGrammar: Grammar): GrammarRootAST | undefined {
        const combinedContext = combinedGrammar.ast;
        const adaptor = new GrammarASTAdaptor();
        const elements = combinedContext.children;

        // MAKE A GRAMMAR ROOT and ID
        const lexerName = `${combinedContext.children[0].getText()}Lexer`;

        const lexerAST = new GrammarRootAST(CommonToken.fromType(ANTLRv4Parser.GRAMMAR, "LEXER_GRAMMAR"),
            combinedGrammar.ast.tokenStream);

        lexerAST.grammarType = GrammarType.Lexer;
        lexerAST.token!.inputStream = combinedContext.token!.inputStream;
        lexerAST.addChild(adaptor.create(ANTLRv4Parser.ID, lexerName));

        // COPY OPTIONS
        const optionsRoot = combinedContext.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (optionsRoot !== null && optionsRoot.children.length !== 0) {
            const lexerOptionsRoot = adaptor.dupNode(optionsRoot);
            lexerAST.addChild(lexerOptionsRoot);
            const options = optionsRoot.children;
            for (const o of options) {
                const optionName = o.children[0].getText();
                if (Grammar.lexerOptions.has(optionName) &&
                    !Grammar.doNotCopyOptionsToLexer.has(optionName)) {
                    const optionTree = dupTree(o) as GrammarAST;

                    lexerOptionsRoot.addChild(optionTree);
                    lexerAST.setOption(optionName, optionTree.children[1] as GrammarAST);
                }
            }
        }

        // COPY all named actions, but only move those with lexer:: scope
        const actionsWeMoved = new Array<GrammarAST>();
        for (const e of elements) {
            if (e.getType() === ANTLRv4Parser.AT) {
                lexerAST.addChild(dupTree(e));
                if (e.children[0].getText() === "lexer") {
                    actionsWeMoved.push(e as GrammarAST);
                }
            }
        }

        for (const r of actionsWeMoved) {
            combinedContext.deleteChild(r);
        }

        const combinedRulesRoot = combinedContext.getFirstChildWithType(ANTLRv4Parser.RULES) as GrammarAST | null;
        if (combinedRulesRoot === null) {
            return lexerAST;
        }

        // MOVE lexer rules

        const lexerRulesRoot = adaptor.create(ANTLRv4Parser.RULES, "RULES");
        lexerAST.addChild(lexerRulesRoot);
        const rulesWeMoved = new Array<GrammarAST>();
        let rules: GrammarASTWithOptions[];
        if (combinedRulesRoot.children.length > 0) {
            rules = combinedRulesRoot.children as GrammarASTWithOptions[];
        } else {
            rules = new Array<GrammarASTWithOptions>(0);
        }

        for (const r of rules) {
            const ruleName = r.children[0].getText();
            if (isTokenName(ruleName)) {
                lexerRulesRoot.addChild(dupTree(r));
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
            const litRule = new RuleAST(ANTLRv4Parser.RULE);
            const blk = new BlockAST(ANTLRv4Parser.BLOCK);
            const alt = new AltAST(ANTLRv4Parser.ALT);

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
        combinedContext.sanityCheckParentAndChildIndexes();

        combinedGrammar.tool.logInfo({
            component: "grammar",
            msg: `after extract implicit lexer =${combinedContext.toStringTree()}`
        });
        combinedGrammar.tool.logInfo({ component: "grammar", msg: `lexer =${lexerAST.toStringTree()}` });

        if (lexerRulesRoot.children.length === 0) {
            return undefined;
        }

        return lexerAST;
    }

}
