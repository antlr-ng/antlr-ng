/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { CommonToken, isToken, RecognitionException, type Token } from "antlr4ng";

import { Constants } from "../../Constants.js";
import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";
import { CharSupport } from "../../misc/CharSupport.js";
import { isTokenName } from "../../support/helpers.js";
import { AltAST } from "../../tool/ast/AltAST.js";
import { BlockAST } from "../../tool/ast/BlockAST.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { ErrorManager } from "../../tool/ErrorManager.js";
import { Grammar } from "../../tool/Grammar.js";
import { GrammarTransformPipeline } from "../../tool/GrammarTransformPipeline.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../exceptions/EarlyExitException.js";
import { FailedPredicateException } from "../exceptions/FailedPredicateException.js";
import { MismatchedSetException } from "../exceptions/MismatchedSetException.js";
import { NoViableAltException } from "../exceptions/NoViableAltException.js";
import { RewriteRuleNodeStream } from "../RewriteRuleNodeStream.js";
import { RewriteRuleSubtreeStream } from "../RewriteRuleSubtreeStream.js";
import { TreeRewriter } from "../TreeRewriter.js";
import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";

export class BlockSetTransformer extends TreeRewriter {
    private currentRuleName?: string;
    private g: Grammar;

    public constructor(errorManager: ErrorManager, input: CommonTreeNodeStream, grammar: Grammar) {
        super(errorManager, input);
        this.g = grammar;
    }

    /**
     * Transforms ^(nil x) to x and nil to null.
     *
     * @param root The root node to process.
     *
     * @returns The processed root node.
     */
    private static rulePostProcessing(root: GrammarAST): GrammarAST | null {
        let r: GrammarAST | null = root;
        if (r.isNil()) {
            if (r.children.length === 0) {
                r = null;
            } else if (r.children.length === 1) {
                r = r.children[0] as GrammarAST;

                // Whoever invokes rule will set parent and child index.
                r.parent = null;
                r.childIndex = -1;
            }
        }

        return r;
    }

    /**
     * If oldRoot is a nil root, just copy or move the children to newRoot. If not a nil root, make oldRoot a child
     * of newRoot.
     * ```
     * old=^(nil a b c), new=r yields ^(r a b c)
     * old=^(a b c), new=r yields ^(r ^(a b c))
     * ```
     * If newRoot is a nil-rooted single child tree, use the single child as the new root node.
     * ```
     * old=^(nil a b c), new=^(nil r) yields ^(r a b c)
     * old=^(a b c), new=^(nil r) yields ^(r ^(a b c))
     * ```
     * If oldRoot was null, it's ok, just return newRoot (even if isNil).
     * ```
     * old=null, new=r yields r
     * old=null, new=^(nil r) yields ^(nil r)
     * ```
     *
     * @param newRoot The new root node.
     * @param oldRoot The old root node.
     *
     * @returns newRoot. Throw an error if newRoot is not a simple node or nil root with a single child node. It must
     *          be a root node. If newRoot is ^(nil x) return x as newRoot.
     *
     * Be advised that it's ok for newRoot to point at oldRoot's children, i.e. you don't have to copy the list. We are
     * constructing these nodes so we should have this control for efficiency.
     */
    private static becomeRoot(newRoot: GrammarAST | Token, oldRoot: GrammarAST | null): GrammarAST {
        if (isToken(newRoot)) {
            newRoot = new GrammarAST(newRoot);
        }

        if (oldRoot === null) {
            return newRoot;
        }

        // Hhandle ^(nil real-node).
        if (newRoot.isNil()) {
            const nc = newRoot.children.length;
            if (nc === 1) {
                newRoot = newRoot.children[0] as GrammarAST;
            } else if (nc > 1) {
                throw new Error("more than one node as root (TODO: make exception hierarchy)");
            }
        }

        // Add oldRoot to newRoot. `addChild` takes care of case where oldRoot is a flat list (i.e. nil-rooted tree).
        // All children of oldRoot are added to newRoot.
        newRoot.addChild(oldRoot);

        return newRoot;
    }

    public override topdown = (): GrammarAST | undefined => {
        let result: GrammarAST | undefined;

        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Parser.RULE: {
                    const rule = this.match(this.input, ANTLRv4Parser.RULE)!;
                    if (this.failed) {
                        return result;
                    }

                    let first;
                    if (this.backtracking === 1) {
                        first = rule;
                    }

                    this.match(this.input, Constants.Down);
                    if (this.failed) {
                        return result;
                    }

                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.TOKEN_REF) {
                        const id = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            this.currentRuleName = id?.getText();
                            result = first;
                            if (result?.parent?.isNil()) {
                                result = result.parent as GrammarAST;
                            }
                        }
                    } else if (lookahead === ANTLRv4Parser.RULE_REF) {
                        const id = this.match(this.input, ANTLRv4Parser.RULE_REF)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            this.currentRuleName = id?.getText();
                            result = first;
                            if (result?.parent?.isNil()) {
                                result = result.parent as GrammarAST;
                            }
                        }
                    } else {
                        if (this.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new NoViableAltException(1, 0);
                    }

                    let matchCount = 0;
                    while (true) {
                        const lookahead = this.input.lookahead(1);
                        if (lookahead >= ANTLRv4Parser.ACTION && lookahead <= ANTLRv4Parser.WILDCARD) {
                            this.matchAny();
                            if (this.failed) {
                                return result;
                            }

                            if (this.backtracking === 1) {
                                result = first;
                                if (result?.parent?.isNil()) {
                                    result = result.parent as GrammarAST;
                                }
                            }
                        } else {
                            if (matchCount >= 1) {
                                break;
                            }

                            if (this.backtracking > 0) {
                                this.failed = true;

                                return result;
                            }

                            throw new EarlyExitException(2);
                        }

                        ++matchCount;
                    }

                    this.match(this.input, Constants.Up);
                    if (this.failed) {
                        return result;
                    }

                    if (this.backtracking === 1) {
                        result = first;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.ALT: {
                    const setAlt = this.setAlt();
                    if (this.failed) {
                        return result;
                    }

                    let first;
                    if (this.backtracking === 1) {
                        first = setAlt!;
                    }

                    if (this.backtracking === 1) {
                        result = first;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    const ebnfBlockSet = this.ebnfBlockSet();
                    if (this.failed) {
                        return result;
                    }

                    if (this.backtracking === 1) {
                        result = ebnfBlockSet;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.BLOCK: {
                    const blockSet = this.blockSet();
                    if (this.failed) {
                        return result;
                    }

                    if (this.backtracking === 1) {
                        result = blockSet;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }

                    break;
                }

                default: {
                    if (this.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }

                    throw new NoViableAltException(3, 0);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    };

    private setAlt(): GrammarAST | undefined {
        try {
            if (!(this.inContext([ANTLRv4Lexer.RULE, ANTLRv4Lexer.BLOCK]))) {
                if (this.backtracking > 0) {
                    this.failed = true;

                    return undefined;
                }

                throw new FailedPredicateException("setAlt");
            }

            const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
            if (this.failed) {
                return undefined;
            }

            if (this.backtracking === 1) {
                if (alt.parent?.isNil()) {
                    return alt.parent as GrammarAST;
                }

                return alt;
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return undefined;
    }

    private ebnfBlockSet(): GrammarAST | undefined {
        let result: GrammarAST | undefined;
        const start = this.input.lookaheadType(1) as GrammarAST;

        const blockSetStream = new RewriteRuleSubtreeStream("rule blockSet");
        const ebnfSuffixStream = new RewriteRuleSubtreeStream("rule ebnfSuffix");

        try {
            const ebnfSuffix = this.ebnfSuffix();
            if (this.failed) {
                return undefined;
            }

            if (this.backtracking === 1) {
                ebnfSuffixStream.add(ebnfSuffix ?? null);
            }

            this.match(this.input, Constants.Down);
            if (this.failed) {
                return undefined;
            }

            let last = this.input.lookaheadType(1) as GrammarAST;
            const blockSet = this.blockSet();
            if (this.failed) {
                return undefined;
            }

            if (this.backtracking === 1) {
                blockSetStream.add(blockSet ?? null);
            }

            this.match(this.input, Constants.Up);
            if (this.failed) {
                return undefined;
            }

            last = start;

            // AST REWRITE
            // elements:
            // token labels:
            // rule labels: retval
            // token list labels:
            // rule list labels:
            // wildcard labels:
            if (this.backtracking === 1) {
                const root0 = new GrammarAST();
                const root1 = BlockSetTransformer.becomeRoot(ebnfSuffixStream.nextNode(), new GrammarAST());
                const root2 = BlockSetTransformer.becomeRoot(new BlockAST(ANTLRv4Parser.BLOCK), new GrammarAST());
                const root3 = BlockSetTransformer.becomeRoot(new AltAST(ANTLRv4Parser.ALT), new GrammarAST());
                root3.addChild(blockSetStream.nextTree());
                root2.addChild(root3);
                root1.addChild(root2);
                root0.addChild(root1);

                result = BlockSetTransformer.rulePostProcessing(root0)!;
                start.parent?.replaceChildren(start.childIndex, last.childIndex, result);

                GrammarTransformPipeline.setGrammarPtr(this.g, result);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }

    private ebnfSuffix(): GrammarAST | undefined {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.CLOSURE
                || (lookahead >= ANTLRv4Parser.OPTIONAL && lookahead <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                this.input.consume();
                this.errorRecovery = false;
                this.failed = false;
            } else {
                if (this.backtracking > 0) {
                    this.failed = true;

                    return undefined;
                }

                throw new MismatchedSetException();
            }

            if (this.backtracking === 1) {
                return start.dupNode();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return undefined;
    }

    private blockSet(): GrammarAST | undefined {
        const start = this.input.lookaheadType(1) ?? undefined;
        let result: GrammarAST | undefined;

        const blockStream = new RewriteRuleNodeStream("token BLOCK");
        const altStream = new RewriteRuleNodeStream("token ALT");
        const elementOptionsStream = new RewriteRuleSubtreeStream("rule elementOptions");
        const setElementStream = new RewriteRuleSubtreeStream("rule setElement");

        const inLexer = isTokenName(this.currentRuleName!);

        try {
            let first;

            if (this.inContext([ANTLRv4Lexer.RULE])) {
                let first2;
                const block = this.match(this.input, ANTLRv4Parser.BLOCK)!;
                if (this.failed) {
                    return undefined;
                }

                if (this.backtracking === 1) {
                    blockStream.add(block);
                    first = block;
                }

                this.match(this.input, Constants.Down);
                if (this.failed) {
                    return undefined;
                }

                const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
                if (this.failed) {
                    return undefined;
                }

                if (this.backtracking === 1) {
                    altStream.add(alt);
                    first2 = alt;
                }

                this.match(this.input, Constants.Down);
                if (this.failed) {
                    return undefined;
                }

                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                    const elementOptions = this.elementOptions();
                    if (this.failed) {
                        return undefined;
                    }

                    if (this.backtracking === 1) {
                        elementOptionsStream.add(elementOptions ?? null);
                        result = first;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }
                }

                if ((alt as AltAST).altLabel) {
                    if (this.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }

                    throw new FailedPredicateException("blockSet");
                }

                const setElement = this.setElement(inLexer);
                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    setElementStream.add(setElement ?? null);
                }

                this.match(this.input, Constants.Up);
                if (this.failed) {
                    return result;
                }

                let optionCount = 0;
                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.ALT) {
                        const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            altStream.add(alt);
                            if (first2 === undefined) {
                                first2 = alt;
                            }
                        }

                        this.match(this.input, Constants.Down);
                        if (this.failed) {
                            return result;
                        }

                        const lookahead = this.input.lookahead(1);
                        if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                            const elementOptions = this.elementOptions();
                            if (this.failed) {
                                return result;
                            }

                            if (this.backtracking === 1) {
                                elementOptionsStream.add(elementOptions ?? null);

                                result = first;
                                if (result?.parent?.isNil()) {
                                    result = result.parent as GrammarAST;
                                }
                            }
                        }

                        const setElement = this.setElement(inLexer);
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            setElementStream.add(setElement ?? null);
                        }

                        this.match(this.input, Constants.Up);
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            result = first;
                            if (result?.parent?.isNil()) {
                                result = result.parent as GrammarAST;
                            }
                        }
                    } else {
                        if (optionCount >= 1) {
                            break;
                        }

                        if (this.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new EarlyExitException(6);
                    }

                    ++optionCount;
                }

                this.match(this.input, Constants.Up);
                if (this.failed) {
                    return result;
                }

                // AST REWRITE
                // elements:
                // token labels:
                // rule labels: retval
                // token list labels:
                // rule list labels:
                // wildcard labels:
                if (this.backtracking === 1) {
                    const root0 = new GrammarAST();
                    const root1 = BlockSetTransformer.becomeRoot(new BlockAST(ANTLRv4Parser.BLOCK,
                        block.token), new GrammarAST());
                    const root2 = BlockSetTransformer.becomeRoot(new AltAST(ANTLRv4Parser.ALT, block.token, "ALT"),
                        new GrammarAST());

                    let ast: GrammarAST;
                    if (!block.token) {
                        const token = CommonToken.fromType(ANTLRv4Parser.SET, "SET");

                        ast = new GrammarAST(token);
                    } else {
                        const temp = CommonToken.fromToken(block.token);
                        temp.type = ANTLRv4Parser.SET;
                        temp.text = "SET";

                        ast = new GrammarAST(temp);
                    }

                    const root3 = BlockSetTransformer.becomeRoot(ast, new GrammarAST());

                    if (!(setElementStream.hasNext())) {
                        throw new Error("RewriteEarlyExitException");
                    }

                    while (setElementStream.hasNext()) {
                        root3.addChild(setElementStream.nextTree());
                    }

                    setElementStream.reset();
                    root2.addChild(root3);
                    root1.addChild(root2);

                    root0.addChild(root1);
                    result = BlockSetTransformer.rulePostProcessing(root0)!;
                    result.parent?.replaceChildren(start!.childIndex, start!.childIndex, result);
                }
            } else {
                let first;

                const block = this.match(this.input, ANTLRv4Parser.BLOCK)!;
                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    blockStream.add(block);
                    first = block;
                }

                this.match(this.input, Constants.Down);
                if (this.failed) {
                    return result;
                }

                const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    altStream.add(alt);
                    first = alt;
                }

                this.match(this.input, Constants.Down);
                if (this.failed) {
                    return result;
                }

                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                    const elementOptions = this.elementOptions();

                    if (this.failed) {
                        return result;
                    }

                    if (this.backtracking === 1) {
                        elementOptionsStream.add(elementOptions ?? null);

                        result = first;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }
                }

                const setElement = this.setElement(inLexer);
                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    setElementStream.add(setElement ?? null);
                }

                this.match(this.input, Constants.Up);
                if (this.failed) {
                    return result;
                }

                let optionsCount = 0;
                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.ALT) {
                        const alt = this.match(this.input, ANTLRv4Parser.ALT)!;

                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            altStream.add(alt);

                            if (first === null) {
                                first = alt;
                            }
                        }

                        this.match(this.input, Constants.Down);
                        if (this.failed) {
                            return result;
                        }

                        const lookahead = this.input.lookahead(1);
                        if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                            const elementOptions = this.elementOptions();

                            if (this.failed) {
                                return result;
                            }

                            if (this.backtracking === 1) {
                                elementOptionsStream.add(elementOptions ?? null);

                                result = first;
                                if (result?.parent?.isNil()) {
                                    result = result.parent as GrammarAST;
                                }
                            }
                        }

                        const setElement = this.setElement(inLexer);
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            setElementStream.add(setElement ?? null);
                        }

                        this.match(this.input, Constants.Up);
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            result = first;
                            if (result?.parent?.isNil()) {
                                result = result.parent as GrammarAST;
                            }
                        }
                    } else {
                        if (optionsCount >= 1) {
                            break;
                        }

                        if (this.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new EarlyExitException(9);
                    }

                    ++optionsCount;
                }

                this.match(this.input, Constants.Up);
                if (this.failed) {
                    return result;
                }

                // AST REWRITE
                // elements:
                // token labels:
                // rule labels: retval
                // token list labels:
                // rule list labels:
                // wildcard labels:
                if (this.backtracking === 1) {
                    const root0 = new GrammarAST();
                    let ast: GrammarAST;
                    if (!block.token) {
                        const token = CommonToken.fromType(ANTLRv4Parser.SET, "SET");

                        ast = new GrammarAST(token);
                    } else {
                        const temp = CommonToken.fromToken(block.token);
                        temp.type = ANTLRv4Parser.SET;
                        temp.text = "SET";

                        ast = new GrammarAST(temp);
                    }

                    const root1 = BlockSetTransformer.becomeRoot(ast, new GrammarAST());
                    if (!(setElementStream.hasNext())) {
                        throw new Error("RewriteEarlyExitException");
                    }

                    while (setElementStream.hasNext()) {
                        root1.addChild(setElementStream.nextTree());
                    }

                    setElementStream.reset();
                    root0.addChild(root1);
                    result = BlockSetTransformer.rulePostProcessing(root0)!;
                    result.parent?.replaceChildren(start!.childIndex, start!.childIndex, result);
                }
            }

            if (this.backtracking === 1) {
                GrammarTransformPipeline.setGrammarPtr(this.g, result!);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }

    private setElement(inLexer: boolean): GrammarAST | undefined {
        let result: GrammarAST | undefined;

        try {
            let first;
            let doDefault = true;

            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.STRING_LITERAL) {
                const lookahead2 = this.input.lookahead(2);
                if (lookahead2 === Constants.Down) {
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;

                    if (this.failed) {
                        return result;
                    }

                    if (this.backtracking === 1) {
                        first = a;
                    }

                    this.match(this.input, Constants.Down);
                    if (this.failed) {
                        return result;
                    }

                    this.elementOptions();
                    if (this.failed) {
                        return result;
                    }

                    this.match(this.input, Constants.Up);
                    if (this.failed) {
                        return result;
                    }

                    if (!((!inLexer || CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1))) {
                        if (this.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }
                        throw new FailedPredicateException("setElement");
                    }

                    if (this.backtracking === 1) {
                        result = first ?? undefined;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }

                    doDefault = false;
                } else if (lookahead2 === Constants.Up) {
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    if (this.failed) {
                        return result;
                    }

                    if (this.backtracking === 1) {
                        first = a;
                    }

                    if (!((!inLexer || CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1))) {
                        if (this.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new FailedPredicateException("setElement");
                    }

                    if (this.backtracking === 1) {
                        result = first;
                        if (result?.parent?.isNil()) {
                            result = result.parent as GrammarAST;
                        }
                    }

                    doDefault = false;
                } else {
                    if (this.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }

                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;
                    try {
                        this.input.consume();

                        throw new NoViableAltException(11, 1);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }
            } else {
                if ((lookahead === ANTLRv4Parser.TOKEN_REF) && !inLexer) {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            first = tokenRef;
                        }

                        this.match(this.input, Constants.Down);
                        if (this.failed) {
                            return result;
                        }

                        this.elementOptions();
                        if (this.failed) {
                            return result;
                        }

                        this.match(this.input, Constants.Up);
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            result = first ?? undefined;
                            if (result?.parent?.isNil()) {
                                result = result.parent as GrammarAST;
                            }
                        }

                        doDefault = false;
                    } else {
                        if (lookahead2 === Constants.Up) {
                            const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                            if (this.failed) {
                                return result;
                            }

                            if (this.backtracking === 1) {
                                first = tokenRef;
                            }

                            if (this.backtracking === 1) {
                                result = first ?? undefined;
                                if (result?.parent?.isNil()) {
                                    result = result.parent as GrammarAST;
                                }
                            }

                            doDefault = false;
                        }
                    }
                }
            }

            if (doDefault) {
                if (!inLexer) {
                    if (this.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }
                    throw new FailedPredicateException("setElement");
                }

                const range = this.match(this.input, ANTLRv4Parser.RANGE)!;
                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    first = range;
                }

                this.match(this.input, Constants.Down);
                if (this.failed) {
                    return result;
                }

                const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                if (this.failed) {
                    return result;
                }

                const b = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                if (this.failed) {
                    return result;
                }

                this.match(this.input, Constants.Up);
                if (this.failed) {
                    return result;
                }

                if (!((CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1 &&
                    CharSupport.getCharValueFromGrammarCharLiteral(b.getText()) !== -1))) {
                    if (this.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }

                    throw new FailedPredicateException("setElement");
                }

                if (this.backtracking === 1) {
                    result = first;
                    if (result?.parent?.isNil()) {
                        result = result.parent as GrammarAST;
                    }
                }
            }

            if (this.backtracking === 1) {
                result = first;
                if (result?.parent?.isNil()) {
                    result = result.parent as GrammarAST;
                }

                GrammarTransformPipeline.setGrammarPtr(this.g, result!);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }

    private elementOptions(): GrammarAST | undefined {
        let result: GrammarAST | undefined;

        try {
            const elementOptions = this.match(this.input, ANTLRv4Parser.ELEMENT_OPTIONS)!;

            if (this.failed) {
                return result;
            }

            let first;
            if (this.backtracking === 1) {
                first = elementOptions;
            }

            if (this.input.lookahead(1) === Constants.Down) {
                this.match(this.input, Constants.Down);
                if (this.failed) {
                    return result;
                }

                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.ASSIGN || lookahead === ANTLRv4Parser.ID) {
                        this.elementOption();
                        if (this.failed) {
                            return result;
                        }

                        if (this.backtracking === 1) {
                            result = first;
                            if (result?.parent?.isNil()) {
                                result = result.parent as GrammarAST;
                            }
                        }
                    } else {
                        break;
                    }
                }

                this.match(this.input, Constants.Up);
                if (this.failed) {
                    return result;
                }
            }

            if (this.backtracking === 1) {
                result = first;
                if (result?.parent?.isNil()) {
                    result = result.parent as GrammarAST;
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }

    private elementOption(): GrammarAST | undefined {
        let result: GrammarAST | undefined;

        try {
            let doDefault = true;

            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.ID) {
                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    result = id;
                    if (result.parent?.isNil()) {
                        result = result.parent as GrammarAST;
                    }
                }

                doDefault = false;
            } else if (lookahead === ANTLRv4Parser.ASSIGN) {
                const lookahead2 = this.input.lookahead(2);
                if (lookahead2 === Constants.Down) {
                    const lookahead3 = this.input.lookahead(3);
                    if (lookahead3 === ANTLRv4Parser.ID) {
                        doDefault = false;

                        switch (this.input.lookahead(4)) {
                            case ANTLRv4Parser.ID: {
                                const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, Constants.Down);
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, ANTLRv4Parser.ID)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, ANTLRv4Parser.ID)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, Constants.Up);
                                if (this.failed) {
                                    return result;
                                }

                                if (this.backtracking === 1) {
                                    result = assign;
                                    if (result.parent?.isNil()) {
                                        result = result.parent as GrammarAST;
                                    }
                                }

                                break;
                            }

                            case ANTLRv4Parser.STRING_LITERAL: {
                                let first;
                                const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;

                                if (this.failed) {
                                    return result;
                                }

                                if (this.backtracking === 1) {
                                    first = assign;
                                }

                                this.match(this.input, Constants.Down);
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, ANTLRv4Parser.ID)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, Constants.Up);
                                if (this.failed) {
                                    return result;
                                }

                                if (this.backtracking === 1) {
                                    result = first;
                                    if (result?.parent?.isNil()) {
                                        result = result.parent as GrammarAST;
                                    }
                                }

                                break;
                            }

                            case ANTLRv4Parser.ACTION: {
                                let first;
                                const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;

                                if (this.failed) {
                                    return result;
                                }

                                if (this.backtracking === 1) {
                                    first = assign;
                                }

                                this.match(this.input, Constants.Down);
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, ANTLRv4Parser.ID)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, ANTLRv4Parser.ACTION)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, Constants.Up);
                                if (this.failed) {
                                    return result;
                                }

                                if (this.backtracking === 1) {
                                    result = first;
                                    if (result?.parent?.isNil()) {
                                        result = result.parent as GrammarAST;
                                    }
                                }

                                break;
                            }

                            case ANTLRv4Parser.INT: {
                                doDefault = true;

                                break;
                            }

                            default: {
                                if (this.backtracking > 0) {
                                    this.failed = true;

                                    return result;
                                }

                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    this.input.consume();
                                    this.input.consume();

                                    throw new NoViableAltException(13, 4);
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }
                    } else {
                        if (this.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            this.input.consume();

                            throw new NoViableAltException(13, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                } else {
                    if (this.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }

                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        throw new NoViableAltException(13, 2);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }
            } else {
                if (this.backtracking > 0) {
                    this.failed = true;

                    return result;
                }

                throw new NoViableAltException(13, 0);
            }

            if (doDefault) {
                let first;
                let _first_1;
                const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;

                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    first = assign;
                }

                this.match(this.input, Constants.Down);

                if (this.failed) {
                    return result;
                }

                this.match(this.input, ANTLRv4Parser.ID)!;
                if (this.failed) {
                    return result;
                }

                this.match(this.input, ANTLRv4Parser.INT)!;
                if (this.failed) {
                    return result;
                }

                this.match(this.input, Constants.Up);

                if (this.failed) {
                    return result;
                }

                if (this.backtracking === 1) {
                    result = first;
                    if (result?.parent?.isNil()) {
                        result = result.parent as GrammarAST;
                    }
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }
}
