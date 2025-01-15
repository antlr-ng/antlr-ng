/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

import { Constants } from "../../Constants.js";
import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";
import { CharSupport } from "../../misc/CharSupport.js";
import { GrammarASTAdaptor } from "../../parse/GrammarASTAdaptor.js";
import { isTokenName } from "../../support/helpers.js";
import { AltAST } from "../../tool/ast/AltAST.js";
import { BlockAST } from "../../tool/ast/BlockAST.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { Grammar } from "../../tool/Grammar.js";
import { GrammarTransformPipeline } from "../../tool/GrammarTransformPipeline.js";
import type { ITreeRuleReturnScope } from "../../types.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../EarlyExitException.js";
import { FailedPredicateException } from "../FailedPredicateException.js";
import { MismatchedSetException } from "../MismatchedSetException.js";
import { NoViableAltException } from "../NoViableAltException.js";
import { RewriteRuleNodeStream } from "../RewriteRuleNodeStream.js";
import { RewriteRuleSubtreeStream } from "../RewriteRuleSubtreeStream.js";
import { TreeRewriter } from "../TreeRewriter.js";

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

    public constructor(input: CommonTreeNodeStream, grammar: Grammar) {
        super(input);
        this.g = grammar;
    }

    public override getTokenNames(): string[] {
        return BlockSetTransformer.tokenNames;
    }

    public override topdown = (): GrammarAST | undefined => {
        let result: GrammarAST | undefined;

        try {
            let alt3 = 4;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.RULE: {
                    alt3 = 1;

                    break;
                }

                case ANTLRv4Parser.ALT: {
                    alt3 = 2;

                    break;
                }

                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    alt3 = 3;

                    break;
                }

                case ANTLRv4Parser.BLOCK: {
                    alt3 = 4;

                    break;
                }

                default: {
                    if (this.state.backtracking > 0) {
                        this.state.failed = true;

                        return result;
                    }

                    throw new NoViableAltException(3, 0);
                }

            }
            switch (alt3) {
                case 1: {
                    let _last = this.input.LT(1) as GrammarAST;

                    const _save_last_1 = _last;
                    let _first_1 = null;
                    _last = this.input.LT(1) as GrammarAST;
                    const rule = this.match(this.input, ANTLRv4Parser.RULE)!;
                    if (this.state.failed) {
                        return result;
                    }

                    let _first_0 = null;
                    if (this.state.backtracking === 1) {
                        _first_0 = rule;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return result;
                    }

                    let alt1 = 2;
                    const lookahead = this.input.LA(1);
                    if ((lookahead === ANTLRv4Parser.TOKEN_REF)) {
                        alt1 = 1;
                    } else {
                        if ((lookahead === ANTLRv4Parser.RULE_REF)) {
                            alt1 = 2;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return result;
                            }

                            throw new NoViableAltException(1, 0);
                        }
                    }

                    let id;
                    switch (alt1) {
                        case 1: {
                            _last = this.input.LT(1) as GrammarAST;
                            id = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;

                            if (this.state.failed as boolean) {
                                return result;
                            }

                            if (this.state.backtracking === 1) {
                                _first_1 = id;
                            }

                            if (this.state.backtracking === 1) {
                                result = _first_0 ?? undefined;
                                if (result?.getParent()?.isNil()) {
                                    result = result.getParent() as GrammarAST;
                                }

                            }

                            break;
                        }

                        case 2: {
                            _last = this.input.LT(1) as GrammarAST;
                            id = this.match(this.input, ANTLRv4Parser.RULE_REF)!;
                            if (this.state.failed as boolean) {
                                return result;
                            }

                            if (this.state.backtracking === 1) {
                                _first_1 = id;
                            }

                            if (this.state.backtracking === 1) {
                                result = _first_0 ?? undefined;
                                if (result?.getParent()?.isNil()) {
                                    result = result.getParent() as GrammarAST;
                                }
                            }

                            break;
                        }

                        default:

                    }

                    if (this.state.backtracking === 1) {
                        this.currentRuleName = id?.getText() ?? undefined;
                    }

                    let cnt2 = 0;
                    loop2:
                    while (true) {
                        let alt2 = 2;
                        const lookahead = this.input.LA(1);
                        if (((lookahead >= ANTLRv4Parser.ACTION && lookahead <= ANTLRv4Parser.WILDCARD))) {
                            alt2 = 1;
                        } else if ((lookahead === Constants.UP)) {
                            alt2 = 2;
                        }

                        switch (alt2) {
                            case 1: {
                                _last = this.input.LT(1) as GrammarAST;
                                const wildcard2 = this.input.LT(1) as GrammarAST;
                                this.matchAny();

                                if (this.state.failed as boolean) {
                                    return result;
                                }

                                if (this.state.backtracking === 1) {
                                    if (_first_1 === null) {
                                        _first_1 = wildcard2;
                                    }
                                }

                                if (this.state.backtracking === 1) {
                                    result = _first_0 ?? undefined;
                                    if (result?.getParent()?.isNil()) {
                                        result = result.getParent() as GrammarAST;
                                    }
                                }

                                break;
                            }

                            default: {
                                if (cnt2 >= 1) {
                                    break loop2;
                                }

                                if (this.state.backtracking > 0) {
                                    this.state.failed = true;

                                    return result;
                                }

                                throw new EarlyExitException(2);
                            }
                        }
                        cnt2++;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return result;
                    }

                    _last = _save_last_1;

                    if (this.state.backtracking === 1) {
                        result = _first_0 ?? undefined;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 2: {
                    const _last = this.input.LT(1) as GrammarAST;
                    const setAlt3 = this.setAlt();
                    if (this.state.failed) {
                        return result;
                    }

                    let _first_0;
                    if (this.state.backtracking === 1) {
                        _first_0 = setAlt3.tree!;
                    }

                    if (this.state.backtracking === 1) {
                        result = _first_0;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 3: {
                    const _last = this.input.LT(1) as GrammarAST;
                    const ebnfBlockSet4 = this.ebnfBlockSet();
                    if (this.state.failed) {
                        return result;
                    }

                    let _first_0;
                    if (this.state.backtracking === 1) {
                        _first_0 = ebnfBlockSet4;
                    }

                    if (this.state.backtracking === 1) {
                        result = _first_0?.tree ?? undefined;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 4: {
                    const _last = this.input.LT(1) as GrammarAST;
                    const blockSet5 = this.blockSet();
                    if (this.state.failed) {
                        return result;
                    }

                    let _first_0;
                    if (this.state.backtracking === 1) {
                        _first_0 = blockSet5;
                    }

                    if (this.state.backtracking === 1) {
                        result = _first_0?.tree;
                        if (result?.getParent()?.isNil()) {
                            result = result.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                default:
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

    public setAlt(): ITreeRuleReturnScope<GrammarAST> {
        const retval: ITreeRuleReturnScope<GrammarAST> = {};
        retval.start = this.input.LT(1) ?? undefined;

        try {
            if (!((this.inContext("RULE BLOCK")))) {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return retval;
                }
                throw new FailedPredicateException("setAlt", "inContext(\"RULE BLOCK\")");
            }
            const _last = this.input.LT(1) as GrammarAST;
            const alt = this.match(this.input, ANTLRv4Parser.ALT)!;

            if (this.state.failed) {
                return retval;
            }

            let _first_0;
            if (this.state.backtracking === 1) {
                _first_0 = alt;
            }

            if (this.state.backtracking === 1) {
                retval.tree = _first_0;
                if (retval.tree?.getParent()?.isNil()) {

                    retval.tree = retval.tree.getParent() as GrammarAST;
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ebnfBlockSet(): ITreeRuleReturnScope<GrammarAST> {
        const retval: ITreeRuleReturnScope<GrammarAST> = {};
        retval.start = this.input.LT(1) ?? undefined;

        const blockSetStream = new RewriteRuleSubtreeStream(this.adaptor, "rule blockSet");
        const ebnfSuffixStream = new RewriteRuleSubtreeStream(this.adaptor, "rule ebnfSuffix");

        try {
            const _save_last_1 = this.input.LT(1) as GrammarAST;
            const ebnfSuffix7 = this.ebnfSuffix();

            if (this.state.failed) {
                return retval;
            }

            if (this.state.backtracking === 1) {
                ebnfSuffixStream.add(ebnfSuffix7.tree ?? null);
            }

            let _first_0;
            if (this.state.backtracking === 1) {
                _first_0 = ebnfSuffix7.tree;
            }

            this.match(this.input, Constants.DOWN);

            if (this.state.failed as boolean) {
                return retval;
            }

            let _last = this.input.LT(1) as GrammarAST;
            const blockSet8 = this.blockSet();

            if (this.state.failed as boolean) {
                return retval;
            }

            if (this.state.backtracking === 1) {
                blockSetStream.add(blockSet8.tree ?? null);
            }

            this.match(this.input, Constants.UP);

            if (this.state.failed as boolean) {
                return retval;
            }

            _last = _save_last_1;

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

                retval.tree = this.adaptor.rulePostProcessing(root0) as GrammarAST;
                this.input.replaceChildren(retval.start!.getParent()!, retval.start!.getChildIndex(),
                    _last.getChildIndex(), retval.tree);
            }

            if (this.state.backtracking === 1) {
                GrammarTransformPipeline.setGrammarPtr(this.g, retval.tree!);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ebnfSuffix(): ITreeRuleReturnScope<GrammarAST> {
        const retval: ITreeRuleReturnScope<GrammarAST> = {};
        retval.start = this.input.LT(1) ?? undefined;

        try {
            if (this.input.LA(1) === ANTLRv4Parser.CLOSURE
                || (this.input.LA(1) >= ANTLRv4Parser.OPTIONAL && this.input.LA(1) <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                this.input.consume();
                this.state.errorRecovery = false;
                this.state.failed = false;
            } else {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return retval;
                }
                const mse = new MismatchedSetException(null, this.input);
                throw mse;
            }

            if (this.state.backtracking === 1) {
                if (retval.tree?.getParent()?.isNil()) {
                    retval.tree = retval.tree.getParent() as GrammarAST;
                }
            }

            if (this.state.backtracking === 1) {
                retval.tree = this.adaptor.dupNode((retval.start as GrammarAST));
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public blockSet(): ITreeRuleReturnScope<GrammarAST> {
        const retval: ITreeRuleReturnScope<GrammarAST> = {};
        retval.start = this.input.LT(1) ?? undefined;

        const blockStream = new RewriteRuleNodeStream(this.adaptor, "token BLOCK");
        const altStream = new RewriteRuleNodeStream(this.adaptor, "token ALT");
        const elementOptionsStream = new RewriteRuleSubtreeStream(this.adaptor, "rule elementOptions");
        const setElementStream = new RewriteRuleSubtreeStream(this.adaptor, "rule setElement");

        const inLexer = isTokenName(this.currentRuleName!);

        try {
            let _first_0 = null;

            if (this.inContext("RULE")) {
                let _last = this.input.LT(1) as GrammarAST;
                const _save_last_1 = _last;
                let _first_1 = null;
                _last = this.input.LT(1) as GrammarAST;
                const block = this.match(this.input, ANTLRv4Parser.BLOCK)!;
                if (this.state.failed) {
                    return retval;
                }

                if (this.state.backtracking === 1) {
                    blockStream.add(block);
                }

                if (this.state.backtracking === 1) {
                    _first_0 = block;
                }

                this.match(this.input, Constants.DOWN);

                if (this.state.failed as boolean) {
                    return retval;
                }

                _last = this.input.LT(1) as GrammarAST;
                {
                    const _save_last_2 = _last;
                    const _first_2 = null;
                    _last = this.input.LT(1) as GrammarAST;
                    const alt = this.match(this.input, ANTLRv4Parser.ALT)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        altStream.add(alt);
                    }

                    if (this.state.backtracking === 1) {
                        _first_1 = alt;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    let alt4 = 2;
                    const lookahead = this.input.LA(1);
                    if ((lookahead === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                        alt4 = 1;
                    }

                    switch (alt4) {
                        case 1: {
                            _last = this.input.LT(1) as GrammarAST;
                            const elementOptions11 = this.elementOptions();

                            if (this.state.failed as boolean) {
                                return retval;
                            }

                            if (this.state.backtracking === 1) {
                                elementOptionsStream.add(elementOptions11.tree ?? null);
                            }

                            if (this.state.backtracking === 1) {
                                retval.tree = _first_0 ?? undefined;
                                if (retval.tree?.getParent()?.isNil()) {
                                    retval.tree = retval.tree.getParent() as GrammarAST;
                                }
                            }

                            break;
                        }

                        default:
                    }

                    if ((alt as AltAST).altLabel) {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }
                        throw new FailedPredicateException("blockSet", "((AltAST)$alt).altLabel==null");
                    }
                    _last = this.input.LT(1) as GrammarAST;
                    const setElement12 = this.setElement(inLexer);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        setElementStream.add(setElement12.tree ?? null);
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    _last = _save_last_2;
                }

                let cnt6 = 0;
                loop6:
                while (true) {
                    let alt6 = 2;
                    const lookahead = this.input.LA(1);
                    if ((lookahead === ANTLRv4Parser.ALT)) {
                        alt6 = 1;
                    }

                    switch (alt6) {
                        case 1: {
                            _last = this.input.LT(1) as GrammarAST;
                            const _save_last_2 = _last;
                            const _first_2 = null;
                            _last = this.input.LT(1) as GrammarAST;
                            const alt = this.match(this.input, ANTLRv4Parser.ALT)!;

                            if (this.state.failed as boolean) {
                                return retval;
                            }

                            if (this.state.backtracking === 1) {
                                altStream.add(alt);
                            }

                            if (this.state.backtracking === 1) {
                                if (_first_1 === null) {
                                    _first_1 = alt;
                                }
                            }

                            this.match(this.input, Constants.DOWN);

                            if (this.state.failed as boolean) {
                                return retval;
                            }

                            // org/antlr/v4/parse/BlockSetTransformer.g:98:99: ( elementOptions )?
                            let alt5 = 2;
                            const lookahead = this.input.LA(1);
                            if ((lookahead === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                                alt5 = 1;
                            }
                            switch (alt5) {
                                case 1: {
                                    // org/antlr/v4/parse/BlockSetTransformer.g:98:99: elementOptions
                                    {
                                        _last = this.input.LT(1) as GrammarAST;
                                        const elementOptions14 = this.elementOptions();

                                        if (this.state.failed as boolean) {
                                            return retval;
                                        }

                                        if (this.state.backtracking === 1) {
                                            elementOptionsStream.add(elementOptions14.tree ?? null);
                                        }

                                        if (this.state.backtracking === 1) {
                                            retval.tree = _first_0 ?? undefined;
                                            if (retval.tree?.getParent()?.isNil()) {

                                                retval.tree = retval.tree.getParent() as GrammarAST;
                                            }

                                        }

                                    }
                                    break;
                                }

                                default:

                            }

                            _last = this.input.LT(1) as GrammarAST;
                            const setElement15 = this.setElement(inLexer);

                            if (this.state.failed as boolean) {
                                return retval;
                            }

                            if (this.state.backtracking === 1) {
                                setElementStream.add(setElement15.tree ?? null);
                            }

                            this.match(this.input, Constants.UP);

                            if (this.state.failed as boolean) {
                                return retval;
                            }

                            _last = _save_last_2;

                            if (this.state.backtracking === 1) {
                                retval.tree = _first_0 ?? undefined;
                                if (retval.tree?.getParent()?.isNil()) {
                                    retval.tree = retval.tree.getParent() as GrammarAST;
                                }
                            }

                            break;
                        }

                        default: {
                            if (cnt6 >= 1) {
                                break loop6;
                            }

                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return retval;
                            }
                            const eee = new EarlyExitException(6);
                            throw eee;
                        }

                    }
                    cnt6++;
                }

                this.match(this.input, Constants.UP);

                if (this.state.failed as boolean) {
                    return retval;
                }

                _last = _save_last_1;

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
                    retval.tree = this.adaptor.rulePostProcessing(root0) as GrammarAST;
                    this.input.replaceChildren(retval.start!.getParent()!, retval.start!.getChildIndex(),
                        _last.getChildIndex(), retval.tree);
                }
            } else {
                let _last = this.input.LT(1) as GrammarAST;
                const _save_last_1 = _last;
                let _first_1 = null;
                _last = this.input.LT(1) as GrammarAST;
                const block = this.match(this.input, ANTLRv4Parser.BLOCK)!;
                if (this.state.failed) {
                    return retval;
                }

                if (this.state.backtracking === 1) {
                    blockStream.add(block);
                }

                if (this.state.backtracking === 1) {
                    _first_0 = block;
                }

                this.match(this.input, Constants.DOWN);

                if (this.state.failed as boolean) {
                    return retval;
                }

                _last = this.input.LT(1) as GrammarAST;
                const _save_last_2 = _last;
                _last = this.input.LT(1) as GrammarAST;
                const alt = this.match(this.input, ANTLRv4Parser.ALT)!;

                if (this.state.failed as boolean) {
                    return retval;
                }

                if (this.state.backtracking === 1) {
                    altStream.add(alt);
                }

                if (this.state.backtracking === 1) {
                    _first_1 = alt;
                }

                this.match(this.input, Constants.DOWN);

                if (this.state.failed as boolean) {
                    return retval;
                }

                let alt7 = 2;
                const lookahead = this.input.LA(1);
                if ((lookahead === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                    alt7 = 1;
                }

                switch (alt7) {
                    case 1: {
                        _last = this.input.LT(1) as GrammarAST;
                        const elementOptions18 = this.elementOptions();

                        if (this.state.failed as boolean) {
                            return retval;
                        }

                        if (this.state.backtracking === 1) {
                            elementOptionsStream.add(elementOptions18.tree ?? null);
                        }

                        if (this.state.backtracking === 1) {
                            retval.tree = _first_0 ?? undefined;
                            if (retval.tree?.getParent()?.isNil()) {
                                retval.tree = retval.tree.getParent() as GrammarAST;
                            }
                        }

                        break;
                    }

                    default:
                }

                _last = this.input.LT(1) as GrammarAST;
                const setElement19 = this.setElement(inLexer);

                if (this.state.failed as boolean) {
                    return retval;
                }

                if (this.state.backtracking === 1) {
                    setElementStream.add(setElement19.tree ?? null);
                }

                this.match(this.input, Constants.UP);

                if (this.state.failed as boolean) {
                    return retval;
                }

                _last = _save_last_2;

                let cnt9 = 0;
                loop9:
                while (true) {
                    let alt9 = 2;
                    const lookahead = this.input.LA(1);
                    if ((lookahead === ANTLRv4Parser.ALT)) {
                        alt9 = 1;
                    }

                    switch (alt9) {
                        case 1: {
                            _last = this.input.LT(1) as GrammarAST;
                            {
                                const _save_last_2 = _last;
                                const _first_2 = null;
                                _last = this.input.LT(1) as GrammarAST;
                                const alt = this.match(this.input, ANTLRv4Parser.ALT)!;

                                if (this.state.failed as boolean) {
                                    return retval;
                                }

                                if (this.state.backtracking === 1) {
                                    altStream.add(alt);
                                }

                                if (this.state.backtracking === 1) {

                                    if (_first_1 === null) {
                                        _first_1 = alt;
                                    }
                                }

                                this.match(this.input, Constants.DOWN);

                                if (this.state.failed as boolean) {
                                    return retval;
                                }

                                let alt8 = 2;
                                const lookahead = this.input.LA(1);
                                if ((lookahead === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                                    alt8 = 1;
                                }

                                switch (alt8) {
                                    case 1: {
                                        _last = this.input.LT(1) as GrammarAST;
                                        const elementOptions21 = this.elementOptions();

                                        if (this.state.failed as boolean) {
                                            return retval;
                                        }

                                        if (this.state.backtracking === 1) {
                                            elementOptionsStream.add(elementOptions21.tree ?? null);
                                        }

                                        if (this.state.backtracking === 1) {
                                            retval.tree = _first_0 ?? undefined;
                                            if (retval.tree?.getParent()?.isNil()) {
                                                retval.tree = retval.tree.getParent() as GrammarAST;
                                            }
                                        }

                                        break;
                                    }

                                    default:

                                }

                                _last = this.input.LT(1) as GrammarAST;
                                const setElement22 = this.setElement(inLexer);

                                if (this.state.failed as boolean) {
                                    return retval;
                                }

                                if (this.state.backtracking === 1) {
                                    setElementStream.add(setElement22.tree ?? null);
                                }

                                this.match(this.input, Constants.UP);

                                if (this.state.failed as boolean) {
                                    return retval;
                                }

                                _last = _save_last_2;
                            }

                            if (this.state.backtracking === 1) {
                                retval.tree = _first_0 ?? undefined;
                                if (retval.tree?.getParent()?.isNil()) {
                                    retval.tree = retval.tree.getParent() as GrammarAST;
                                }
                            }

                            break;
                        }

                        default: {
                            if (cnt9 >= 1) {
                                break loop9;
                            }

                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return retval;
                            }
                            const eee = new EarlyExitException(9);
                            throw eee;
                        }

                    }
                    cnt9++;
                }

                this.match(this.input, Constants.UP);

                if (this.state.failed as boolean) {
                    return retval;
                }

                _last = _save_last_1;

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

                    retval.tree = this.adaptor.rulePostProcessing(root0) as GrammarAST;
                    this.input.replaceChildren(retval.start!.getParent()!,
                        retval.start!.getChildIndex(),
                        _last.getChildIndex(),
                        retval.tree);
                }
            }

            if (this.state.backtracking === 1) {
                GrammarTransformPipeline.setGrammarPtr(this.g, retval.tree!);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public setElement(inLexer: boolean): ITreeRuleReturnScope<GrammarAST> {
        const retval: ITreeRuleReturnScope<GrammarAST> = {};
        retval.start = this.input.LT(1) ?? undefined;

        try {
            let alt11 = 5;
            const lookahead = this.input.LA(1);
            if ((lookahead === ANTLRv4Parser.STRING_LITERAL)) {
                const lookahead2 = this.input.LA(2);
                if ((lookahead2 === Constants.DOWN)) {
                    alt11 = 1;
                } else if ((lookahead2 === Constants.UP)) {
                    alt11 = 2;
                } else {
                    if (this.state.backtracking > 0) {
                        this.state.failed = true;

                        return retval;
                    }

                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;
                    try {
                        this.input.consume();
                        const nvae = new NoViableAltException(11, 1);
                        throw nvae;
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }
            } else {
                if ((lookahead === ANTLRv4Parser.TOKEN_REF) && !inLexer) {
                    const lookahead2 = this.input.LA(2);
                    if ((lookahead2 === Constants.DOWN)) {
                        alt11 = 3;
                    } else {
                        if ((lookahead2 === Constants.UP)) {
                            alt11 = 4;
                        }
                    }
                } else {
                    if ((lookahead === ANTLRv4Parser.RANGE) && inLexer) {
                        alt11 = 5;
                    }
                }

            }

            let _first_0;
            switch (alt11) {
                case 1: {
                    const _save_last_1 = this.input.LT(1) as GrammarAST;
                    let _first_1 = null;
                    let _last = this.input.LT(1) as GrammarAST;
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = a;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    _last = this.input.LT(1) as GrammarAST;
                    const elementOptions23 = this.elementOptions();

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_1 = elementOptions23.tree!;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    _last = _save_last_1;

                    if (!((!inLexer || CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1))) {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }
                        throw new FailedPredicateException("setElement",
                            "!inLexer || CharSupport.getCharValueFromGrammarCharLiteral($a.getText())!=-1");
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {

                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 2: {
                    const _last = this.input.LT(1) as GrammarAST;
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = a;
                    }

                    if (!((!inLexer || CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1))) {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }

                        throw new FailedPredicateException("setElement",
                            "!inLexer || CharSupport.getCharValueFromGrammarCharLiteral($a.getText())!=-1");
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {

                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 3: {
                    if (inLexer) {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }
                        throw new FailedPredicateException("setElement", "!inLexer");
                    }

                    const _save_last_1 = this.input.LT(1) as GrammarAST;
                    let _first_1 = null;
                    let _last = this.input.LT(1) as GrammarAST;
                    const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = tokenRef;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    _last = this.input.LT(1) as GrammarAST;
                    const elementOptions25 = this.elementOptions();

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_1 = elementOptions25.tree!;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    _last = _save_last_1;

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 4: {
                    if (inLexer) {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }
                        throw new FailedPredicateException("setElement", "!inLexer");
                    }

                    const _last = this.input.LT(1) as GrammarAST;
                    const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = tokenRef;
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 5: {
                    if (!inLexer) {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }
                        throw new FailedPredicateException("setElement", "inLexer");
                    }

                    const _save_last_1 = this.input.LT(1) as GrammarAST;
                    let _first_1 = null;
                    let _last = this.input.LT(1) as GrammarAST;
                    const range = this.match(this.input, ANTLRv4Parser.RANGE)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = range;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    _last = this.input.LT(1) as GrammarAST;
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_1 = a;
                    }

                    _last = this.input.LT(1) as GrammarAST;
                    const b = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        if (_first_1 === null) {
                            _first_1 = b;
                        }
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    _last = _save_last_1;

                    if (!((CharSupport.getCharValueFromGrammarCharLiteral(a.getText()) !== -1 &&
                        CharSupport.getCharValueFromGrammarCharLiteral(b.getText()) !== -1))) {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }
                        throw new FailedPredicateException("setElement", "CharSupport.getCharValueFromGrammarChar" +
                            "Literal($a.getText())!=-1 &&\n\t\t\t CharSupport.getCharValueFromGrammarCharLiteral" +
                            "($b.getText())!=-1");
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                default:
            }

            if (this.state.backtracking === 1) {
                retval.tree = _first_0 ?? undefined;
                if (retval.tree?.getParent()?.isNil()) {
                    retval.tree = retval.tree.getParent() as GrammarAST;
                }
            }

            if (this.state.backtracking === 1) {
                GrammarTransformPipeline.setGrammarPtr(this.g, retval.tree!);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public elementOptions(): ITreeRuleReturnScope<GrammarAST> {
        const retval: ITreeRuleReturnScope<GrammarAST> = {};
        retval.start = this.input.LT(1) ?? undefined;

        try {
            let _last = this.input.LT(1) as GrammarAST;
            const _save_last_1 = _last;
            let _first_1 = null;
            _last = this.input.LT(1) as GrammarAST;
            const elementOptions = this.match(this.input, ANTLRv4Parser.ELEMENT_OPTIONS)!;

            if (this.state.failed) {
                return retval;
            }

            let _first_0;
            if (this.state.backtracking === 1) {
                _first_0 = elementOptions;
            }

            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);
                if (this.state.failed as boolean) {
                    return retval;
                }

                loop12:
                while (true) {
                    let alt12 = 2;
                    const lookahead = this.input.LA(1);
                    if ((lookahead === ANTLRv4Parser.ASSIGN || lookahead === ANTLRv4Parser.ID)) {
                        alt12 = 1;
                    }

                    switch (alt12) {
                        case 1: {
                            _last = this.input.LT(1) as GrammarAST;
                            const elementOption29 = this.elementOption();

                            if (this.state.failed as boolean) {
                                return retval;
                            }

                            if (this.state.backtracking === 1) {
                                if (_first_1 === null) {
                                    _first_1 = elementOption29.tree;
                                }
                            }

                            if (this.state.backtracking === 1) {
                                retval.tree = _first_0 ?? undefined;
                                if (retval.tree?.getParent()?.isNil()) {
                                    retval.tree = retval.tree.getParent() as GrammarAST;
                                }
                            }

                            break;
                        }

                        default: {
                            break loop12;
                        }

                    }
                }

                this.match(this.input, Constants.UP);

                if (this.state.failed as boolean) {
                    return retval;
                }
            }
            _last = _save_last_1;

            if (this.state.backtracking === 1) {
                retval.tree = _first_0 ?? undefined;
                if (retval.tree?.getParent()?.isNil()) {
                    retval.tree = retval.tree.getParent() as GrammarAST;
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public elementOption(): ITreeRuleReturnScope<GrammarAST> {
        const retval: ITreeRuleReturnScope<GrammarAST> = {};
        retval.start = this.input.LT(1) ?? undefined;

        try {
            let alt13 = 5;
            const lookahead = this.input.LA(1);
            if ((lookahead === ANTLRv4Parser.ID)) {
                alt13 = 1;
            } else if ((lookahead === ANTLRv4Parser.ASSIGN)) {
                const lookahead2 = this.input.LA(2);
                if ((lookahead2 === Constants.DOWN)) {
                    const lookahead3 = this.input.LA(3);
                    if ((lookahead3 === ANTLRv4Parser.ID)) {
                        switch (this.input.LA(4)) {
                            case ANTLRv4Parser.ID: {
                                alt13 = 2;

                                break;
                            }

                            case ANTLRv4Parser.STRING_LITERAL: {
                                alt13 = 3;

                                break;
                            }

                            case ANTLRv4Parser.ACTION: {
                                alt13 = 4;

                                break;
                            }

                            case ANTLRv4Parser.INT: {
                                alt13 = 5;

                                break;
                            }

                            default: {
                                if (this.state.backtracking > 0) {
                                    this.state.failed = true;

                                    return retval;
                                }

                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }

                                    const nvae = new NoViableAltException(13, 4);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }
                    } else {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }

                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                this.input.consume();
                            }

                            const nvae = new NoViableAltException(13, 3);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                } else {
                    if (this.state.backtracking > 0) {
                        this.state.failed = true;

                        return retval;
                    }

                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        const nvae = new NoViableAltException(13, 2);
                        throw nvae;
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }
            } else {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return retval;
                }

                const nvae = new NoViableAltException(13, 0);
                throw nvae;
            }

            switch (alt13) {
                case 1: {
                    const id = this.match(this.input, ANTLRv4Parser.ID)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    let _first_0;
                    if (this.state.backtracking === 1) {
                        _first_0 = id;
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 2: {
                    const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    let _first_0;
                    if (this.state.backtracking === 1) {
                        _first_0 = assign;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    let id = this.match(this.input, ANTLRv4Parser.ID)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    let _first_1;
                    if (this.state.backtracking === 1) {
                        _first_1 = id;
                    }

                    id = this.match(this.input, ANTLRv4Parser.ID)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        if (_first_1 === undefined) {
                            _first_1 = id;
                        }
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 3: {
                    let _first_0 = null;
                    let _first_1 = null;
                    const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = assign;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    const id = this.match(this.input, ANTLRv4Parser.ID)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_1 = id;
                    }

                    const literal = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        if (_first_1 === null) {
                            _first_1 = literal;
                        }
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 4: {
                    let _first_0 = null;
                    const _save_last_1 = this.input.LT(1) as GrammarAST;
                    let _first_1 = null;
                    const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = assign;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    const id = this.match(this.input, ANTLRv4Parser.ID)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_1 = id;
                    }

                    const action = this.match(this.input, ANTLRv4Parser.ACTION)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        if (_first_1 === null) {
                            _first_1 = action;
                        }
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                case 5: {
                    let _first_0 = null;
                    const _save_last_1 = this.input.LT(1) as GrammarAST;
                    let _first_1 = null;
                    const assign = this.match(this.input, ANTLRv4Parser.ASSIGN)!;

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_0 = assign;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    const id = this.match(this.input, ANTLRv4Parser.ID)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        _first_1 = id;
                    }

                    const int = this.match(this.input, ANTLRv4Parser.INT)!;

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        if (_first_1 === null) {
                            _first_1 = int;
                        }
                    }

                    this.match(this.input, Constants.UP);

                    if (this.state.failed as boolean) {
                        return retval;
                    }

                    if (this.state.backtracking === 1) {
                        retval.tree = _first_0 ?? undefined;
                        if (retval.tree?.getParent()?.isNil()) {
                            retval.tree = retval.tree.getParent() as GrammarAST;
                        }
                    }

                    break;
                }

                default:
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }
}
