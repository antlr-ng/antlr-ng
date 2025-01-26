/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { RecognitionException } from "antlr4ng";

import { Constants } from "../../Constants.js";
import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";
import { CharSupport } from "../../misc/CharSupport.js";
import { GrammarASTAdaptor } from "../../parse/GrammarASTAdaptor.js";
import { isTokenName } from "../../support/helpers.js";
import { AltAST } from "../../tool/ast/AltAST.js";
import { BlockAST } from "../../tool/ast/BlockAST.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { ErrorManager } from "../../tool/ErrorManager.js";
import { Grammar } from "../../tool/Grammar.js";
import { GrammarTransformPipeline } from "../../tool/GrammarTransformPipeline.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../EarlyExitException.js";
import { FailedPredicateException } from "../FailedPredicateException.js";
import { MismatchedSetException } from "../MismatchedSetException.js";
import { NoViableAltException } from "../NoViableAltException.js";
import { RewriteRuleNodeStream } from "../RewriteRuleNodeStream.js";
import { RewriteRuleSubtreeStream } from "../RewriteRuleSubtreeStream.js";
import { TreeRewriter } from "../TreeRewriter.js";
import { createRecognizerSharedState } from "../misc/IRecognizerSharedState.js";

export class BlockSetTransformer extends TreeRewriter {
    // Needed for context in the inContext method.
    private static readonly tokenNames = [
        "<invalid>", "<EOR>", "<DOWN>", "<UP>", "ACTION", "ACTION_CHAR_LITERAL", "ACTION_ESC", "ACTION_STRING_LITERAL",
        "ARG_ACTION", "ARG_OR_CHARSET", "ASSIGN", "AT", "CATCH", "CHANNELS", "COLON", "COLONCOLON", "COMMA", "UNUSED",
        "DOC_COMMENT", "DOLLAR", "DOT", "ERRCHAR", "ESC_SEQ", "FINALLY", "FRAGMENT", "GRAMMAR", "GT", "HEX_DIGIT", "ID",
        "IMPORT", "INT", "LEXER", "LEXER_CHAR_SET", "LOCALS", "LPAREN", "LT", "MODE", "NESTED_ACTION", "NLCHARS",
        "NOT", "NameChar", "NameStartChar", "OPTIONS", "OR", "PARSER", "PLUS", "PLUS_ASSIGN", "POUND", "QUESTION",
        "RANGE", "RARROW", "RBRACE", "RETURNS", "RPAREN", "RULE_REF", "SEMI", "SEMPRED", "SRC", "STAR",
        "STRING_LITERAL", "THROWS", "TOKENS_SPEC", "TOKEN_REF", "UNICODE_ESC", "UNICODE_EXTENDED_ESC", "UnicodeBOM",
        "WS", "WSCHARS", "WSNLCHARS", "ALT", "BLOCK", "CLOSURE", "COMBINED", "ELEMENT_OPTIONS", "EPSILON",
        "LEXER_ACTION_CALL", "LEXER_ALT_ACTION", "OPTIONAL", "POSITIVE_CLOSURE", "RULE", "RULEMODIFIERS", "RULES",
        "SET", "WILDCARD", "BLOCK_COMMENT", "LINE_COMMENT", "UNTERMINATED_STRING_LITERAL", "BEGIN_ARGUMENT",
        "BEGIN_ACTION", "TOKENS", "LBRACE", "END_ARGUMENT", "UNTERMINATED_ARGUMENT", "ARGUMENT_CONTENT", "END_ACTION",
        "UNTERMINATED_ACTION", "ACTION_CONTENT", "UNTERMINATED_CHAR_SET", "PRIVATE", "PROTECTED", "PUBLIC",
        "PREDICATE_OPTIONS", "Argument", "TargetLanguageAction", "LexerCharSet",
    ];

    private currentRuleName?: string;
    private g: Grammar;

    private adaptor = new GrammarASTAdaptor();

    public constructor(errorManager: ErrorManager, input: CommonTreeNodeStream, grammar: Grammar) {
        super(errorManager, input, createRecognizerSharedState());
        this.g = grammar;
    }

    public override getTokenNames(): string[] {
        return BlockSetTransformer.tokenNames;
    }

    public override topdown = (): GrammarAST | undefined => {
        let result: GrammarAST | undefined;

        try {
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.RULE: {
                    const rule = this.match(this.input, ANTLRv4Parser.RULE)!;
                    if (this.failed) {
                        return result;
                    }

                    let first;
                    if (this.state.backtracking === 1) {
                        first = rule;
                    }

                    this.match(this.input, Constants.DOWN);
                    if (this.failed) {
                        return result;
                    }

                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Parser.TOKEN_REF) {
                        const id = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            this.currentRuleName = id?.getText();
                            result = first;
                            if (result?.getParent()?.isNil()) {
                                result = result.getParent() as GrammarAST;
                            }
                        }
                    } else if (lookahead === ANTLRv4Parser.RULE_REF) {
                        const id = this.match(this.input, ANTLRv4Parser.RULE_REF)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            this.currentRuleName = id?.getText();
                            result = first;
                            if (result?.getParent()?.isNil()) {
                                result = result.getParent() as GrammarAST;
                            }
                        }
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new NoViableAltException(1, 0);
                    }

                    let matchCount = 0;
                    while (true) {
                        const lookahead = this.input.LA(1);
                        if (lookahead >= ANTLRv4Parser.ACTION && lookahead <= ANTLRv4Parser.WILDCARD) {
                            this.matchAny();
                            if (this.failed) {
                                return result;
                            }

                            if (this.state.backtracking === 1) {
                                result = first;
                                if (result?.getParent()?.isNil()) {
                                    result = result.getParent() as GrammarAST;
                                }
                            }
                        } else {
                            if (matchCount >= 1) {
                                break;
                            }

                            if (this.state.backtracking > 0) {
                                this.failed = true;

                                return result;
                            }

                            throw new EarlyExitException(2);
                        }

                        ++matchCount;
                    }

                    this.match(this.input, Constants.UP);
                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 1) {
                        result = first;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
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
                    if (this.state.backtracking === 1) {
                        first = setAlt!;
                    }

                    if (this.state.backtracking === 1) {
                        result = first;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
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

                    if (this.state.backtracking === 1) {
                        result = ebnfBlockSet;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.BLOCK: {
                    const blockSet = this.blockSet();
                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 1) {
                        result = blockSet;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                default: {
                    if (this.state.backtracking > 0) {
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
            if (!(this.inContext("RULE BLOCK"))) {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return undefined;
                }

                throw new FailedPredicateException("setAlt", "inContext(\"RULE BLOCK\")");
            }

            const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
            if (this.failed) {
                return undefined;
            }

            if (this.state.backtracking === 1) {
                if (alt.getParent()?.isNil()) {
                    return alt.getParent() as GrammarAST;
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
        const start = this.input.LT(1) as GrammarAST;

        const blockSetStream = new RewriteRuleSubtreeStream(this.adaptor, "rule blockSet");
        const ebnfSuffixStream = new RewriteRuleSubtreeStream(this.adaptor, "rule ebnfSuffix");

        try {
            const ebnfSuffix = this.ebnfSuffix();
            if (this.failed) {
                return undefined;
            }

            if (this.state.backtracking === 1) {
                ebnfSuffixStream.add(ebnfSuffix ?? null);
            }

            this.match(this.input, Constants.DOWN);
            if (this.failed) {
                return undefined;
            }

            let last = this.input.LT(1) as GrammarAST;
            const blockSet = this.blockSet();
            if (this.failed) {
                return undefined;
            }

            if (this.state.backtracking === 1) {
                blockSetStream.add(blockSet ?? null);
            }

            this.match(this.input, Constants.UP);
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
            if (this.state.backtracking === 1) {
                const root0 = new GrammarAST();
                const root1 = this.adaptor.becomeRoot(ebnfSuffixStream.nextNode(), new GrammarAST()) as GrammarAST;
                const root2 = this.adaptor.becomeRoot(new BlockAST(ANTLRv4Parser.BLOCK), new GrammarAST());
                const root3 = this.adaptor.becomeRoot(new AltAST(ANTLRv4Parser.ALT), new GrammarAST()) as GrammarAST;
                root3.addChild(blockSetStream.nextTree());
                root2.addChild(root3);
                root1.addChild(root2);
                root0.addChild(root1);

                result = this.adaptor.rulePostProcessing(root0) as GrammarAST;
                this.input.replaceChildren(start.getParent()!, start.getChildIndex(), last.getChildIndex(), result);

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
        const start = this.input.LT(1) ?? undefined;

        try {
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Parser.CLOSURE
                || (lookahead >= ANTLRv4Parser.OPTIONAL && lookahead <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                this.input.consume();
                this.state.errorRecovery = false;
                this.failed = false;
            } else {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return undefined;
                }

                throw new MismatchedSetException(null, this.input);
            }

            if (this.state.backtracking === 1) {
                return this.adaptor.dupNode((start as GrammarAST));
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
        const start = this.input.LT(1) ?? undefined;
        let result: GrammarAST | undefined;

        const blockStream = new RewriteRuleNodeStream(this.adaptor, "token BLOCK");
        const altStream = new RewriteRuleNodeStream(this.adaptor, "token ALT");
        const elementOptionsStream = new RewriteRuleSubtreeStream(this.adaptor, "rule elementOptions");
        const setElementStream = new RewriteRuleSubtreeStream(this.adaptor, "rule setElement");

        const inLexer = isTokenName(this.currentRuleName!);

        try {
            let first;

            if (this.inContext("RULE")) {
                let first2;
                const block = this.match(this.input, ANTLRv4Parser.BLOCK)!;
                if (this.failed) {
                    return undefined;
                }

                if (this.state.backtracking === 1) {
                    blockStream.add(block);
                    first = block;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return undefined;
                }

                const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
                if (this.failed) {
                    return undefined;
                }

                if (this.state.backtracking === 1) {
                    altStream.add(alt);
                    first2 = alt;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return undefined;
                }

                const lookahead = this.input.LA(1);
                if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                    const elementOptions = this.elementOptions();
                    if (this.failed) {
                        return undefined;
                    }

                    if (this.state.backtracking === 1) {
                        elementOptionsStream.add(elementOptions ?? null);
                        result = first;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }
                }

                if ((alt as AltAST).altLabel) {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }

                    throw new FailedPredicateException("blockSet", "");
                }

                const setElement = this.setElement(inLexer);
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 1) {
                    setElementStream.add(setElement ?? null);
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return result;
                }

                let optionCount = 0;
                while (true) {
                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Parser.ALT) {
                        const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            altStream.add(alt);
                            if (first2 === undefined) {
                                first2 = alt;
                            }
                        }

                        this.match(this.input, Constants.DOWN);
                        if (this.failed) {
                            return result;
                        }

                        const lookahead = this.input.LA(1);
                        if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                            const elementOptions = this.elementOptions();
                            if (this.failed) {
                                return result;
                            }

                            if (this.state.backtracking === 1) {
                                elementOptionsStream.add(elementOptions ?? null);

                                result = first;
                                if (result?.getParent()?.isNil()) {
                                    result = result.getParent() as GrammarAST;
                                }
                            }
                        }

                        const setElement = this.setElement(inLexer);
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            setElementStream.add(setElement ?? null);
                        }

                        this.match(this.input, Constants.UP);
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            result = first;
                            if (result?.getParent()?.isNil()) {
                                result = result.getParent() as GrammarAST;
                            }
                        }
                    } else {
                        if (optionCount >= 1) {
                            break;
                        }

                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new EarlyExitException(6);
                    }

                    ++optionCount;
                }

                this.match(this.input, Constants.UP);
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
                if (this.state.backtracking === 1) {
                    const root0 = new GrammarAST();
                    const root1 = this.adaptor.becomeRoot(new BlockAST(ANTLRv4Parser.BLOCK,
                        block.token), new GrammarAST()) as GrammarAST;
                    const root2 = this.adaptor.becomeRoot(new AltAST(ANTLRv4Parser.ALT, block.token, "ALT"),
                        new GrammarAST());
                    const root3 = this.adaptor.becomeRoot(this.adaptor.create(ANTLRv4Parser.SET, block.token!, "SET"),
                        new GrammarAST());

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
                    result = this.adaptor.rulePostProcessing(root0) as GrammarAST;
                    this.input.replaceChildren(result.getParent()!, start!.getChildIndex(), start!.getChildIndex(),
                        result);
                }
            } else {
                let first;

                const block = this.match(this.input, ANTLRv4Parser.BLOCK)!;
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 1) {
                    blockStream.add(block);
                    first = block;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return result;
                }

                const alt = this.match(this.input, ANTLRv4Parser.ALT)!;
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 1) {
                    altStream.add(alt);
                    first = alt;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return result;
                }

                const lookahead = this.input.LA(1);
                if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                    const elementOptions = this.elementOptions();

                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 1) {
                        elementOptionsStream.add(elementOptions ?? null);

                        result = first;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }
                }

                const setElement = this.setElement(inLexer);
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 1) {
                    setElementStream.add(setElement ?? null);
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return result;
                }

                let optionsCount = 0;
                while (true) {
                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Parser.ALT) {
                        const alt = this.match(this.input, ANTLRv4Parser.ALT)!;

                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            altStream.add(alt);

                            if (first === null) {
                                first = alt;
                            }
                        }

                        this.match(this.input, Constants.DOWN);
                        if (this.failed) {
                            return result;
                        }

                        const lookahead = this.input.LA(1);
                        if (lookahead === ANTLRv4Parser.ELEMENT_OPTIONS) {
                            const elementOptions = this.elementOptions();

                            if (this.failed) {
                                return result;
                            }

                            if (this.state.backtracking === 1) {
                                elementOptionsStream.add(elementOptions ?? null);

                                result = first;
                                if (result?.getParent()?.isNil()) {
                                    result = result.getParent() as GrammarAST;
                                }
                            }
                        }

                        const setElement = this.setElement(inLexer);
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            setElementStream.add(setElement ?? null);
                        }

                        this.match(this.input, Constants.UP);
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            result = first;
                            if (result?.getParent()?.isNil()) {
                                result = result.getParent() as GrammarAST;
                            }
                        }
                    } else {
                        if (optionsCount >= 1) {
                            break;
                        }

                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new EarlyExitException(9);
                    }

                    ++optionsCount;
                }

                this.match(this.input, Constants.UP);
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
                if (this.state.backtracking === 1) {
                    const root0 = new GrammarAST();
                    const root1 = this.adaptor.becomeRoot(this.adaptor.create(ANTLRv4Parser.SET, block.token!,
                        "SET"), new GrammarAST());
                    if (!(setElementStream.hasNext())) {
                        throw new Error("RewriteEarlyExitException");
                    }

                    while (setElementStream.hasNext()) {
                        root1.addChild(setElementStream.nextTree());
                    }

                    setElementStream.reset();
                    root0.addChild(root1);
                    result = this.adaptor.rulePostProcessing(root0) as GrammarAST;
                    this.input.replaceChildren(result.getParent()!, start!.getChildIndex(), start!.getChildIndex(),
                        result);
                }
            }

            if (this.state.backtracking === 1) {
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

            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Parser.STRING_LITERAL) {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;

                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 1) {
                        first = a;
                    }

                    this.match(this.input, Constants.DOWN);
                    if (this.failed) {
                        return result;
                    }

                    this.elementOptions();
                    if (this.failed) {
                        return result;
                    }

                    this.match(this.input, Constants.UP);
                    if (this.failed) {
                        return result;
                    }

                    if (!((!inLexer || CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1))) {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }
                        throw new FailedPredicateException("setElement", "");
                    }

                    if (this.state.backtracking === 1) {
                        result = first ?? undefined;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    doDefault = false;
                } else if (lookahead2 === Constants.UP) {
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 1) {
                        first = a;
                    }

                    if (!((!inLexer || CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1))) {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return result;
                        }

                        throw new FailedPredicateException("setElement", "");
                    }

                    if (this.state.backtracking === 1) {
                        result = first;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    doDefault = false;
                } else {
                    if (this.state.backtracking > 0) {
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
                    const lookahead2 = this.input.LA(2);
                    if (lookahead2 === Constants.DOWN) {
                        const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            first = tokenRef;
                        }

                        this.match(this.input, Constants.DOWN);
                        if (this.failed) {
                            return result;
                        }

                        this.elementOptions();
                        if (this.failed) {
                            return result;
                        }

                        this.match(this.input, Constants.UP);
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            result = first ?? undefined;
                            if (result?.getParent()?.isNil()) {
                                result = result.getParent() as GrammarAST;
                            }
                        }

                        doDefault = false;
                    } else {
                        if (lookahead2 === Constants.UP) {
                            const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                            if (this.failed) {
                                return result;
                            }

                            if (this.state.backtracking === 1) {
                                first = tokenRef;
                            }

                            if (this.state.backtracking === 1) {
                                result = first ?? undefined;
                                if (result?.getParent()?.isNil()) {
                                    result = result.getParent() as GrammarAST;
                                }
                            }

                            doDefault = false;
                        }
                    }
                }
            }

            if (doDefault) {
                if (!inLexer) {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }
                    throw new FailedPredicateException("setElement", "inLexer");
                }

                const range = this.match(this.input, ANTLRv4Parser.RANGE)!;
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 1) {
                    first = range;
                }

                this.match(this.input, Constants.DOWN);
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

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return result;
                }

                if (!((CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1 &&
                    CharSupport.getCharValueFromGrammarCharLiteral(b.getText()) !== -1))) {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return result;
                    }

                    throw new FailedPredicateException("setElement", "");
                }

                if (this.state.backtracking === 1) {
                    result = first;
                    if (result?.getParent()?.isNil()) {
                        result = result.getParent() as GrammarAST;
                    }
                }
            }

            if (this.state.backtracking === 1) {
                result = first;
                if (result?.getParent()?.isNil()) {
                    result = result.getParent() as GrammarAST;
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
            if (this.state.backtracking === 1) {
                first = elementOptions;
            }

            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return result;
                }

                while (true) {
                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Parser.ASSIGN || lookahead === ANTLRv4Parser.ID) {
                        this.elementOption();
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 1) {
                            result = first;
                            if (result?.getParent()?.isNil()) {
                                result = result.getParent() as GrammarAST;
                            }
                        }
                    } else {
                        break;
                    }
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return result;
                }
            }

            if (this.state.backtracking === 1) {
                result = first;
                if (result?.getParent()?.isNil()) {
                    result = result.getParent() as GrammarAST;
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

            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Parser.ID) {
                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 1) {
                    result = id;
                    if (result.getParent()?.isNil()) {
                        result = result.getParent() as GrammarAST;
                    }
                }

                doDefault = false;
            } else if (lookahead === ANTLRv4Parser.ASSIGN) {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    const lookahead3 = this.input.LA(3);
                    if (lookahead3 === ANTLRv4Parser.ID) {
                        doDefault = false;

                        switch (this.input.LA(4)) {
                            case ANTLRv4Parser.ID: {
                                const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;
                                if (this.failed) {
                                    return result;
                                }

                                this.match(this.input, Constants.DOWN);
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

                                this.match(this.input, Constants.UP);
                                if (this.failed) {
                                    return result;
                                }

                                if (this.state.backtracking === 1) {
                                    result = assign;
                                    if (result.getParent()?.isNil()) {
                                        result = result.getParent() as GrammarAST;
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

                                if (this.state.backtracking === 1) {
                                    first = assign;
                                }

                                this.match(this.input, Constants.DOWN);
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

                                this.match(this.input, Constants.UP);
                                if (this.failed) {
                                    return result;
                                }

                                if (this.state.backtracking === 1) {
                                    result = first;
                                    if (result?.getParent()?.isNil()) {
                                        result = result.getParent() as GrammarAST;
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

                                if (this.state.backtracking === 1) {
                                    first = assign;
                                }

                                this.match(this.input, Constants.DOWN);
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

                                this.match(this.input, Constants.UP);
                                if (this.failed) {
                                    return result;
                                }

                                if (this.state.backtracking === 1) {
                                    result = first;
                                    if (result?.getParent()?.isNil()) {
                                        result = result.getParent() as GrammarAST;
                                    }
                                }

                                break;
                            }

                            case ANTLRv4Parser.INT: {
                                doDefault = true;

                                break;
                            }

                            default: {
                                if (this.state.backtracking > 0) {
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
                        if (this.state.backtracking > 0) {
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
                    if (this.state.backtracking > 0) {
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
                if (this.state.backtracking > 0) {
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

                if (this.state.backtracking === 1) {
                    first = assign;
                }

                this.match(this.input, Constants.DOWN);

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

                this.match(this.input, Constants.UP);

                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 1) {
                    result = first;
                    if (result?.getParent()?.isNil()) {
                        result = result.getParent() as GrammarAST;
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
