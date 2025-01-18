/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable max-len, @typescript-eslint/naming-convention */
// cspell: disable

import { RecognitionException } from "antlr4ng";

import { EarlyExitException } from "../EarlyExitException.js";
import { createRecognizerSharedState, IRecognizerSharedState } from "../misc/IRecognizerSharedState.js";
import { MismatchedSetException } from "../MismatchedSetException.js";
import { NoViableAltException } from "../NoViableAltException.js";
import { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { TreeParser } from "../TreeParser.js";
import { TreeRuleReturnScope } from "../../antlr3/tree/TreeRuleReturnScope.js";

import { ClassFactory } from "../../ClassFactory.js";
import { Constants } from "../../Constants.js";
import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";
import type { ActionAST } from "../../tool/ast/ActionAST.js";
import type { AltAST } from "../../tool/ast/AltAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { GrammarASTWithOptions } from "../../tool/ast/GrammarASTWithOptions.js";
import type { GrammarRootAST } from "../../tool/ast/GrammarRootAST.js";
import type { PredAST } from "../../tool/ast/PredAST.js";
import type { RuleAST } from "../../tool/ast/RuleAST.js";
import type { TerminalAST } from "../../tool/ast/TerminalAST.js";

/**
 * The definitive ANTLR v3 tree grammar to walk/visit ANTLR v4 grammars.
 *  Parses trees created by ANTLRParser.g.
 *
 *  Rather than have multiple tree grammars, one for each visit, I'm
 *  creating this generic visitor that knows about context. All of the
 *  boilerplate pattern recognition is done here. Then, subclasses can
 *  override the methods they care about. This prevents a lot of the same
 *  context tracking stuff like "set current alternative for current
 *  rule node" that is repeated in lots of tree filters.
 */
export class GrammarTreeVisitor extends TreeParser {
    public static readonly tokenNames = [
        "<invalid>", "<EOR>", "<DOWN>", "<UP>", "ACTION", "ACTION_CHAR_LITERAL",
        "ACTION_ESC", "ACTION_STRING_LITERAL", "ARG_ACTION", "ARG_OR_CHARSET",
        "ASSIGN", "AT", "CATCH", "CHANNELS", "COLON", "COLONCOLON", "COMMA", "COMMENT",
        "DOC_COMMENT", "DOLLAR", "DOT", "ERRCHAR", "ESC_SEQ", "FINALLY", "FRAGMENT",
        "GRAMMAR", "GT", "HEX_DIGIT", "ID", "IMPORT", "INT", "LEXER", "LEXER_CHAR_SET",
        "LOCALS", "LPAREN", "LT", "MODE", "NESTED_ACTION", "NLCHARS", "NOT", "NameChar",
        "NameStartChar", "OPTIONS", "OR", "PARSER", "PLUS", "PLUS_ASSIGN", "POUND",
        "QUESTION", "RANGE", "RARROW", "RBRACE", "RETURNS", "RPAREN", "RULE_REF",
        "SEMI", "SEMPRED", "SRC", "STAR", "STRING_LITERAL", "THROWS", "TOKENS",
        "TOKEN_REF", "UNICODE_ESC", "UNICODE_EXTENDED_ESC", "UnicodeBOM", "WS",
        "WSCHARS", "WSNLCHARS", "ALT", "BLOCK", "CLOSURE", "COMBINED", "ELEMENT_OPTIONS",
        "EPSILON", "LEXER_ACTION_CALL", "LEXER_ALT_ACTION", "OPTIONAL", "POSITIVE_CLOSURE",
        "RULE", "RULEMODIFIERS", "RULES", "SET", "WILDCARD", "PRIVATE", "PROTECTED",
        "PUBLIC",
    ];

    public static grammarSpec_return = class grammarSpec_return extends TreeRuleReturnScope {
    };

    public static prequelConstructs_return = class prequelConstructs_return extends TreeRuleReturnScope {
        public firstOne: GrammarAST | null = null;
    };

    public static prequelConstruct_return = class prequelConstruct_return extends TreeRuleReturnScope {
    };

    public static optionsSpec_return = class optionsSpec_return extends TreeRuleReturnScope {
    };

    public static option_return = class option_return extends TreeRuleReturnScope {
    };

    public static optionValue_return = class optionValue_return extends TreeRuleReturnScope {
        public v: string;
    };

    public static delegateGrammars_return = class delegateGrammars_return extends TreeRuleReturnScope {
    };

    public static delegateGrammar_return = class delegateGrammar_return extends TreeRuleReturnScope {
    };

    public static tokensSpec_return = class tokensSpec_return extends TreeRuleReturnScope {
    };

    public static tokenSpec_return = class tokenSpec_return extends TreeRuleReturnScope {
    };

    public static channelsSpec_return = class channelsSpec_return extends TreeRuleReturnScope {
    };

    public static channelSpec_return = class channelSpec_return extends TreeRuleReturnScope {
    };

    public static action_return = class action_return extends TreeRuleReturnScope {
    };

    public static rules_return = class rules_return extends TreeRuleReturnScope {
    };

    public static mode_return = class mode_return extends TreeRuleReturnScope {
    };

    public static lexerRule_return = class lexerRule_return extends TreeRuleReturnScope {
    };

    public static rule_return = class rule_return extends TreeRuleReturnScope {
    };

    public static exceptionGroup_return = class exceptionGroup_return extends TreeRuleReturnScope {
    };

    public static exceptionHandler_return = class exceptionHandler_return extends TreeRuleReturnScope {
    };

    public static finallyClause_return = class finallyClause_return extends TreeRuleReturnScope {
    };

    public static locals_return = class locals_return extends TreeRuleReturnScope {
    };

    public static ruleReturns_return = class ruleReturns_return extends TreeRuleReturnScope {
    };

    public static throwsSpec_return = class throwsSpec_return extends TreeRuleReturnScope {
    };

    public static ruleAction_return = class ruleAction_return extends TreeRuleReturnScope {
    };

    public static ruleModifier_return = class ruleModifier_return extends TreeRuleReturnScope {
    };

    public static lexerRuleBlock_return = class lexerRuleBlock_return extends TreeRuleReturnScope {
    };

    public static ruleBlock_return = class ruleBlock_return extends TreeRuleReturnScope {
    };

    public static lexerOuterAlternative_return = class lexerOuterAlternative_return extends TreeRuleReturnScope {
    };

    public static outerAlternative_return = class outerAlternative_return extends TreeRuleReturnScope {
    };

    public static lexerAlternative_return = class lexerAlternative_return extends TreeRuleReturnScope {
    };

    public static lexerElements_return = class lexerElements_return extends TreeRuleReturnScope {
    };

    public static lexerElement_return = class lexerElement_return extends TreeRuleReturnScope {
    };

    public static lexerBlock_return = class lexerBlock_return extends TreeRuleReturnScope {
    };

    public static lexerAtom_return = class lexerAtom_return extends TreeRuleReturnScope {
    };

    public static actionElement_return = class actionElement_return extends TreeRuleReturnScope {
    };

    public static alternative_return = class alternative_return extends TreeRuleReturnScope {
    };

    public static lexerCommand_return = class lexerCommand_return extends TreeRuleReturnScope {
    };

    public static lexerCommandExpr_return = class lexerCommandExpr_return extends TreeRuleReturnScope {
    };

    public static element_return = class element_return extends TreeRuleReturnScope {
    };

    public static astOperand_return = class astOperand_return extends TreeRuleReturnScope {
    };

    public static labeledElement_return = class labeledElement_return extends TreeRuleReturnScope {
    };

    public static subrule_return = class subrule_return extends TreeRuleReturnScope {
    };

    public static lexerSubrule_return = class lexerSubrule_return extends TreeRuleReturnScope {
    };

    public static blockSuffix_return = class blockSuffix_return extends TreeRuleReturnScope {
    };

    public static ebnfSuffix_return = class ebnfSuffix_return extends TreeRuleReturnScope {
    };

    public static atom_return = class atom_return extends TreeRuleReturnScope {
    };

    public static blockSet_return = class blockSet_return extends TreeRuleReturnScope {
    };

    public static setElement_return = class setElement_return extends TreeRuleReturnScope {
    };

    public static block_return = class block_return extends TreeRuleReturnScope {
    };

    public static ruleRef_return = class ruleRef_return extends TreeRuleReturnScope {
    };

    public static range_return = class range_return extends TreeRuleReturnScope {
    };

    public static terminal_return = class terminal_return extends TreeRuleReturnScope {
    };

    public static elementOptions_return = class elementOptions_return extends TreeRuleReturnScope {
    };

    public static elementOption_return = class elementOption_return extends TreeRuleReturnScope {
    };

    public grammarName: string | null = null;
    public currentRuleAST: GrammarAST | null = null;
    public currentModeName: string | null = Constants.DEFAULT_MODE_NAME;
    public currentRuleName: string | null = null;
    public currentOuterAltRoot: GrammarAST;
    public currentOuterAltNumber = 1; // 1..n
    public rewriteEBNFLevel = 0;

    public constructor(input?: CommonTreeNodeStream, state?: IRecognizerSharedState) {
        super(input, state ?? createRecognizerSharedState());
    }

    public getDelegates(): TreeParser[] {
        return [];
    }

    public override getTokenNames(): string[] {
        return GrammarTreeVisitor.tokenNames;
    }

    public visitGrammar(t: GrammarRootAST): void {
        this.visit(t, ANTLRv4Parser.RULE_grammarSpec);
    }

    public visit(t: GrammarAST, ruleIndex: number): void {
        const input = t.token!.inputStream!;
        const nodes = new CommonTreeNodeStream(ClassFactory.createGrammarASTAdaptor(input), t);
        this.input = nodes;
        switch (ruleIndex) {
            case ANTLRv4Parser.RULE_grammarSpec: {
                this.grammarSpec();

                break;
            }

            case ANTLRv4Parser.RULE_ruleSpec: {
                this.ruleSpec();

                break;
            }

            default: {
                throw new Error("No rule with the index " + ruleIndex);
            }
        }
    }

    public discoverGrammar(root: GrammarRootAST, ID: GrammarAST | null): void { /**/ }
    public finishPrequels(firstPrequel: GrammarAST | null): void { /**/ }
    public finishGrammar(root: GrammarRootAST, ID: GrammarAST | null): void { /**/ }

    public grammarOption(ID: GrammarAST | null, valueAST: GrammarAST | null): void { /**/ }
    public ruleOption(ID: GrammarAST | null, valueAST: GrammarAST | null): void { /**/ }
    public blockOption(ID: GrammarAST | null, valueAST: GrammarAST | null): void { /**/ }
    public defineToken(ID: GrammarAST): void { /**/ }
    public defineChannel(ID: GrammarAST): void { /**/ }
    public globalNamedAction(scope: GrammarAST | null, ID: GrammarAST, action: ActionAST): void { /**/ }
    public importGrammar(label: GrammarAST | null, ID: GrammarAST): void { /**/ }

    public modeDef(m: GrammarAST | null, ID: GrammarAST | null): void { /**/ }

    public discoverRules(rules: GrammarAST): void { /**/ }
    public finishRules(rule: GrammarAST): void { /**/ }
    public discoverRule(rule: RuleAST | null, ID: GrammarAST | null, modifiers: Array<GrammarAST | null>,
        arg: ActionAST | null, returns: ActionAST | null, throws: GrammarAST | null,
        options: GrammarAST | null, locals: ActionAST | null,
        actions: Array<GrammarAST | null>,
        block: GrammarAST | null): void { /**/ }
    public finishRule(rule: RuleAST | null, ID: GrammarAST | null, block: GrammarAST | null): void { /**/ }
    public discoverLexerRule(rule: RuleAST | null, ID: GrammarAST | null, modifiers: GrammarAST[],
        options: GrammarAST | null, block: GrammarAST): void { /**/ }
    public finishLexerRule(rule: RuleAST | null, ID: GrammarAST | null, block: GrammarAST | null): void { /**/ }
    public ruleCatch(arg: GrammarAST, action: ActionAST): void { /**/ }
    public finallyAction(action: ActionAST): void { /**/ }
    public discoverOuterAlt(alt: AltAST): void { /**/ }
    public finishOuterAlt(alt: AltAST): void { /**/ }
    public discoverAlt(alt: AltAST): void { /**/ }
    public finishAlt(alt: AltAST): void { /**/ }

    public ruleRef(ref: GrammarAST, arg: ActionAST): void { /**/ }
    public tokenRef(ref: TerminalAST): void { /**/ }

    public elementOption(t: GrammarASTWithOptions): GrammarTreeVisitor.elementOption_return;
    public elementOption(t: GrammarASTWithOptions, ID: GrammarAST, valueAST: GrammarAST | null): void;
    public elementOption(...args: unknown[]): GrammarTreeVisitor.elementOption_return | void {
        switch (args.length) {
            case 1: {
                const [t] = args as [GrammarASTWithOptions];

                const retval = new GrammarTreeVisitor.elementOption_return();
                retval.start = this.input.LT(1);

                let id = null;
                let v = null;
                let ID45 = null;
                let ID46 = null;
                let ID47 = null;
                let ID48 = null;

                try {
                    let alt55 = 5;
                    const LA55_0 = this.input.LA(1);
                    if ((LA55_0 === ANTLRv4Parser.ID)) {
                        alt55 = 1;
                    } else {
                        if ((LA55_0 === ANTLRv4Parser.ASSIGN)) {
                            const LA55_2 = this.input.LA(2);
                            if ((LA55_2 === Constants.DOWN)) {
                                const LA55_3 = this.input.LA(3);
                                if ((LA55_3 === ANTLRv4Parser.ID)) {
                                    switch (this.input.LA(4)) {
                                        case ANTLRv4Parser.ID: {
                                            {
                                                alt55 = 2;
                                            }
                                            break;
                                        }

                                        case ANTLRv4Parser.STRING_LITERAL: {
                                            {
                                                alt55 = 3;
                                            }
                                            break;
                                        }

                                        case ANTLRv4Parser.ACTION: {
                                            {
                                                alt55 = 4;
                                            }
                                            break;
                                        }

                                        case ANTLRv4Parser.INT: {
                                            {
                                                alt55 = 5;
                                            }
                                            break;
                                        }

                                        default: {
                                            const nvaeMark = this.input.mark();
                                            try {
                                                for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                                    this.input.consume();
                                                }

                                                throw new NoViableAltException(55, 4);
                                            } finally {
                                                this.input.release(nvaeMark);
                                            }
                                        }

                                    }
                                } else {
                                    const nvaeMark = this.input.mark();
                                    try {
                                        for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                            this.input.consume();
                                        }

                                        throw new NoViableAltException(55, 3);
                                    } finally {
                                        this.input.release(nvaeMark);
                                    }
                                }
                            } else {
                                const nvaeMark = this.input.mark();
                                try {
                                    this.input.consume();

                                    throw new NoViableAltException(55, 2);
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        } else {

                            throw new NoViableAltException(55, 0);
                        }
                    }

                    switch (alt55) {
                        case 1: {
                            ID45 = this.match(this.input, ANTLRv4Parser.ID)!;
                            this.elementOption(t, ID45, null);

                            break;
                        }

                        case 2: {
                            this.match(this.input, ANTLRv4Parser.ASSIGN);
                            this.match(this.input, Constants.DOWN);
                            id = this.match(this.input, ANTLRv4Parser.ID)!;
                            v = this.match(this.input, ANTLRv4Parser.ID)!;
                            this.match(this.input, Constants.UP);

                            this.elementOption(t, id, v);

                            break;
                        }

                        case 3: {
                            this.match(this.input, ANTLRv4Parser.ASSIGN);
                            this.match(this.input, Constants.DOWN);
                            ID46 = this.match(this.input, ANTLRv4Parser.ID)!;
                            v = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                            this.match(this.input, Constants.UP);

                            this.elementOption(t, ID46, v);

                            break;
                        }

                        case 4: {
                            this.match(this.input, ANTLRv4Parser.ASSIGN);
                            this.match(this.input, Constants.DOWN);
                            ID47 = this.match(this.input, ANTLRv4Parser.ID)!;
                            v = this.match(this.input, ANTLRv4Parser.ACTION)!;
                            this.match(this.input, Constants.UP);

                            this.elementOption(t, ID47, v);

                            break;
                        }

                        case 5: {
                            this.match(this.input, ANTLRv4Parser.ASSIGN);
                            this.match(this.input, Constants.DOWN);
                            ID48 = this.match(this.input, ANTLRv4Parser.ID)!;
                            v = this.match(this.input, ANTLRv4Parser.INT)!;
                            this.match(this.input, Constants.UP);

                            this.elementOption(t, ID48, v);

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

                break;
            }

            case 3: {
                //const [t, ID, valueAST] = args as [GrammarASTWithOptions, GrammarAST, GrammarAST | null];
                // ignored

                break;
            }

            default: {
                throw new Error("Invalid number of arguments");
            }
        }
    }

    public stringRef(ref: TerminalAST): void { /**/ }
    public wildcardRef(ref: GrammarAST): void { /**/ }
    public actionInAlt(action: ActionAST): void { /**/ }
    public sempredInAlt(pred: PredAST): void { /**/ }
    public label(op: GrammarAST | null, ID: GrammarAST | null, element: GrammarAST | null): void { /**/ }
    public lexerCallCommand(outerAltNumber: number, ID: GrammarAST, arg: GrammarAST | null): void { /**/ }

    public lexerCommand(): GrammarTreeVisitor.lexerCommand_return;
    public lexerCommand(outerAltNumber: number, ID: GrammarAST): void;
    public lexerCommand(...args: unknown[]): GrammarTreeVisitor.lexerCommand_return | void {
        switch (args.length) {
            case 0: {

                const retval = new GrammarTreeVisitor.lexerCommand_return();
                retval.start = this.input.LT(1);

                let ID25 = null;
                let ID27 = null;
                let lexerCommandExpr26 = null;

                this.enterLexerCommand((retval.start as GrammarAST));

                try {
                    let alt39 = 2;
                    const LA39_0 = this.input.LA(1);
                    if ((LA39_0 === ANTLRv4Parser.LEXER_ACTION_CALL)) {
                        alt39 = 1;
                    } else {
                        if ((LA39_0 === ANTLRv4Parser.ID)) {
                            alt39 = 2;
                        } else {

                            throw new NoViableAltException(39, 0);
                        }
                    }

                    switch (alt39) {
                        case 1: {
                            this.match(this.input, ANTLRv4Parser.LEXER_ACTION_CALL);
                            this.match(this.input, Constants.DOWN);
                            ID25 = this.match(this.input, ANTLRv4Parser.ID)!;
                            lexerCommandExpr26 = this.lexerCommandExpr();

                            this.match(this.input, Constants.UP);

                            this.lexerCallCommand(this.currentOuterAltNumber, ID25,
                                lexerCommandExpr26.start as GrammarAST);

                            break;
                        }

                        case 2: {
                            ID27 = this.match(this.input, ANTLRv4Parser.ID)!;
                            this.lexerCommand(this.currentOuterAltNumber, ID27);

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

                break;
            }

            case 2: {
                //const [outerAltNumber, ID] = args as [number, GrammarAST];

                break;
            }

            default: {
                throw new Error("Invalid number of arguments");
            }
        }
    }

    public grammarSpec(): GrammarTreeVisitor.grammarSpec_return {
        const retval = new GrammarTreeVisitor.grammarSpec_return();
        retval.start = this.input.LT(1);

        let ID1 = null;
        let GRAMMAR2 = null;
        let prequelConstructs3 = null;

        try {
            GRAMMAR2 = this.match(this.input, ANTLRv4Parser.GRAMMAR);
            this.match(this.input, Constants.DOWN);
            ID1 = this.match(this.input, ANTLRv4Parser.ID);
            this.grammarName = ID1?.getText() ?? null;
            this.discoverGrammar(GRAMMAR2 as GrammarRootAST, ID1);
            prequelConstructs3 = this.prequelConstructs();

            this.finishPrequels(prequelConstructs3.firstOne);
            this.rules();

            loop1:
            while (true) {
                let alt1 = 2;
                const LA1_0 = this.input.LA(1);
                if ((LA1_0 === ANTLRv4Parser.MODE)) {
                    alt1 = 1;
                }

                switch (alt1) {
                    case 1: {
                        this.mode();

                        break;
                    }

                    default: {
                        break loop1;
                    }

                }
            }

            this.finishGrammar(GRAMMAR2 as GrammarRootAST, ID1);
            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public prequelConstructs(): GrammarTreeVisitor.prequelConstructs_return {
        const retval = new GrammarTreeVisitor.prequelConstructs_return();
        retval.start = this.input.LT(1);

        try {
            let alt3 = 2;
            const LA3_0 = this.input.LA(1);
            if ((LA3_0 === ANTLRv4Parser.AT || LA3_0 === ANTLRv4Parser.CHANNELS || LA3_0 === ANTLRv4Parser.IMPORT || LA3_0 === ANTLRv4Parser.OPTIONS || LA3_0 === ANTLRv4Parser.TOKENS)) {
                alt3 = 1;
            } else {
                if ((LA3_0 === ANTLRv4Parser.RULES)) {
                    alt3 = 2;
                } else {

                    throw new NoViableAltException(3, 0);
                }
            }

            switch (alt3) {
                case 1: {
                    retval.firstOne = (retval.start as GrammarAST);
                    let cnt2 = 0;
                    loop2:
                    while (true) {
                        let alt2 = 2;
                        const LA2_0 = this.input.LA(1);
                        if ((LA2_0 === ANTLRv4Parser.AT || LA2_0 === ANTLRv4Parser.CHANNELS || LA2_0 === ANTLRv4Parser.IMPORT || LA2_0 === ANTLRv4Parser.OPTIONS || LA2_0 === ANTLRv4Parser.TOKENS)) {
                            alt2 = 1;
                        }

                        switch (alt2) {
                            case 1: {
                                this.prequelConstruct();

                                break;
                            }

                            default: {
                                if (cnt2 >= 1) {
                                    break loop2;
                                }

                                const eee = new EarlyExitException(2);
                                throw eee;
                            }

                        }
                        cnt2++;
                    }

                    break;
                }

                case 2: {
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

    public prequelConstruct(): GrammarTreeVisitor.prequelConstruct_return {
        const retval = new GrammarTreeVisitor.prequelConstruct_return();
        retval.start = this.input.LT(1);

        try {
            let alt4 = 5;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.OPTIONS: {
                    alt4 = 1;

                    break;
                }

                case ANTLRv4Parser.IMPORT: {
                    alt4 = 2;

                    break;
                }

                case ANTLRv4Parser.TOKENS: {
                    alt4 = 3;

                    break;
                }

                case ANTLRv4Parser.CHANNELS: {
                    alt4 = 4;

                    break;
                }

                case ANTLRv4Parser.AT: {
                    alt4 = 5;

                    break;
                }

                default: {

                    throw new NoViableAltException(4, 0);
                }

            }
            switch (alt4) {
                case 1: {
                    this.optionsSpec();

                    break;
                }

                case 2: {
                    this.delegateGrammars();

                    break;
                }

                case 3: {
                    this.tokensSpec();

                    break;
                }

                case 4: {
                    this.channelsSpec();

                    break;
                }

                case 5: {
                    this.action();

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

    public optionsSpec(): GrammarTreeVisitor.optionsSpec_return {
        const retval = new GrammarTreeVisitor.optionsSpec_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.OPTIONS);
            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);

                loop5:
                while (true) {
                    let alt5 = 2;
                    const LA5_0 = this.input.LA(1);
                    if ((LA5_0 === ANTLRv4Parser.ASSIGN)) {
                        alt5 = 1;
                    }

                    switch (alt5) {
                        case 1: {
                            this.option();

                            break;
                        }

                        default: {
                            break loop5;
                        }

                    }
                }

                this.match(this.input, Constants.UP);
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

    public option(): GrammarTreeVisitor.option_return {
        const retval = new GrammarTreeVisitor.option_return();
        retval.start = this.input.LT(1);

        let ID4 = null;
        let v = null;

        const rule = this.inContext("RULE ...");
        const block = this.inContext("BLOCK ...");

        try {
            this.match(this.input, ANTLRv4Parser.ASSIGN);
            this.match(this.input, Constants.DOWN);
            ID4 = this.match(this.input, ANTLRv4Parser.ID);
            v = this.optionValue();

            this.match(this.input, Constants.UP);

            if (block) {
                this.blockOption(ID4, v.start as GrammarAST | null ?? null);
            } else {
                // most specific first
                if (rule) {
                    this.ruleOption(ID4, v.start as GrammarAST | null ?? null);
                } else {
                    this.grammarOption(ID4, v.start as GrammarAST | null ?? null);
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

    public optionValue(): GrammarTreeVisitor.optionValue_return {
        const retval = new GrammarTreeVisitor.optionValue_return();
        retval.start = this.input.LT(1);

        retval.v = (retval.start as GrammarAST).token?.text ?? "";

        try {
            if (this.input.LA(1) === ANTLRv4Parser.ID || this.input.LA(1) === ANTLRv4Parser.INT
                || this.input.LA(1) === ANTLRv4Parser.STRING_LITERAL) {
                this.input.consume();
                this.state.errorRecovery = false;
            } else {
                const mse = new MismatchedSetException(null);
                throw mse;
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

    public delegateGrammars(): GrammarTreeVisitor.delegateGrammars_return {
        const retval = new GrammarTreeVisitor.delegateGrammars_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.IMPORT);
            this.match(this.input, Constants.DOWN);
            let cnt6 = 0;
            loop6:
            while (true) {
                let alt6 = 2;
                const LA6_0 = this.input.LA(1);
                if ((LA6_0 === ANTLRv4Parser.ASSIGN || LA6_0 === ANTLRv4Parser.ID)) {
                    alt6 = 1;
                }

                switch (alt6) {
                    case 1: {
                        this.delegateGrammar();

                        break;
                    }

                    default: {
                        if (cnt6 >= 1) {
                            break loop6;
                        }

                        const eee = new EarlyExitException(6);
                        throw eee;
                    }

                }
                cnt6++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public delegateGrammar(): GrammarTreeVisitor.delegateGrammar_return {
        const retval = new GrammarTreeVisitor.delegateGrammar_return();
        retval.start = this.input.LT(1);

        let label = null;
        let id = null;

        try {
            let alt7 = 2;
            const LA7_0 = this.input.LA(1);
            if ((LA7_0 === ANTLRv4Parser.ASSIGN)) {
                alt7 = 1;
            } else {
                if ((LA7_0 === ANTLRv4Parser.ID)) {
                    alt7 = 2;
                } else {

                    throw new NoViableAltException(7, 0);
                }
            }

            switch (alt7) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.ASSIGN);
                    this.match(this.input, Constants.DOWN);
                    label = this.match(this.input, ANTLRv4Parser.ID)!;
                    id = this.match(this.input, ANTLRv4Parser.ID)!;
                    this.match(this.input, Constants.UP);

                    this.importGrammar(label, id);

                    break;
                }

                case 2: {
                    id = this.match(this.input, ANTLRv4Parser.ID)!;
                    this.importGrammar(null, id);

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

    public tokensSpec(): GrammarTreeVisitor.tokensSpec_return {
        const retval = new GrammarTreeVisitor.tokensSpec_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.TOKENS);
            this.match(this.input, Constants.DOWN);

            let cnt8 = 0;
            loop8:
            while (true) {
                let alt8 = 2;
                const LA8_0 = this.input.LA(1);
                if ((LA8_0 === ANTLRv4Parser.ID)) {
                    alt8 = 1;
                }

                switch (alt8) {
                    case 1: {
                        this.tokenSpec();

                        break;
                    }

                    default: {
                        if (cnt8 >= 1) {
                            break loop8;
                        }

                        const eee = new EarlyExitException(8);
                        throw eee;
                    }

                }
                cnt8++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public tokenSpec(): GrammarTreeVisitor.tokenSpec_return {
        const retval = new GrammarTreeVisitor.tokenSpec_return();
        retval.start = this.input.LT(1);

        let ID5 = null;

        try {
            ID5 = this.match(this.input, ANTLRv4Parser.ID)!;
            this.defineToken(ID5);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public channelsSpec(): GrammarTreeVisitor.channelsSpec_return {
        const retval = new GrammarTreeVisitor.channelsSpec_return();
        retval.start = this.input.LT(1);

        this.enterChannelsSpec((retval.start as GrammarAST));

        try {
            this.match(this.input, ANTLRv4Parser.CHANNELS);
            this.match(this.input, Constants.DOWN);

            let cnt9 = 0;
            loop9:
            while (true) {
                let alt9 = 2;
                const LA9_0 = this.input.LA(1);
                if ((LA9_0 === ANTLRv4Parser.ID)) {
                    alt9 = 1;
                }

                switch (alt9) {
                    case 1: {
                        this.channelSpec();

                        break;
                    }

                    default: {
                        if (cnt9 >= 1) {
                            break loop9;
                        }

                        const eee = new EarlyExitException(9);
                        throw eee;
                    }

                }
                cnt9++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public channelSpec(): GrammarTreeVisitor.channelSpec_return {
        const retval = new GrammarTreeVisitor.channelSpec_return();
        retval.start = this.input.LT(1);

        let ID6 = null;

        try {
            ID6 = this.match(this.input, ANTLRv4Parser.ID)!;
            this.defineChannel(ID6);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public action(): GrammarTreeVisitor.action_return {
        const retval = new GrammarTreeVisitor.action_return();
        retval.start = this.input.LT(1);

        let sc = null;
        let name = null;
        let ACTION7 = null;

        try {
            this.match(this.input, ANTLRv4Parser.AT);
            this.match(this.input, Constants.DOWN);

            let alt10 = 2;
            const LA10_0 = this.input.LA(1);
            if ((LA10_0 === ANTLRv4Parser.ID)) {
                const LA10_1 = this.input.LA(2);
                if ((LA10_1 === ANTLRv4Parser.ID)) {
                    alt10 = 1;
                }
            }
            switch (alt10) {
                case 1: {
                    sc = this.match(this.input, ANTLRv4Parser.ID)!;

                    break;
                }

                default:

            }

            name = this.match(this.input, ANTLRv4Parser.ID)!;
            ACTION7 = this.match(this.input, ANTLRv4Parser.ACTION)!;
            this.match(this.input, Constants.UP);

            this.globalNamedAction(sc, name, ACTION7 as ActionAST);

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public rules(): GrammarTreeVisitor.rules_return {
        const retval = new GrammarTreeVisitor.rules_return();
        retval.start = this.input.LT(1);

        let RULES8 = null;

        try {
            RULES8 = this.match(this.input, ANTLRv4Parser.RULES)!;
            this.discoverRules(RULES8);
            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);

                loop11:
                while (true) {
                    let alt11 = 3;
                    const LA11_0 = this.input.LA(1);
                    if ((LA11_0 === ANTLRv4Parser.RULE)) {
                        const LA11_2 = this.input.LA(2);
                        if ((LA11_2 === Constants.DOWN)) {
                            const LA11_3 = this.input.LA(3);
                            if ((LA11_3 === ANTLRv4Parser.RULE_REF)) {
                                alt11 = 1;
                            } else {
                                if ((LA11_3 === ANTLRv4Parser.TOKEN_REF)) {
                                    alt11 = 2;
                                }
                            }
                        }
                    }

                    switch (alt11) {
                        case 1: {
                            this.ruleSpec();

                            break;
                        }

                        case 2: {
                            this.lexerRule();

                            break;
                        }

                        default: {
                            break loop11;
                        }
                    }
                }

                this.finishRules(RULES8);
                this.match(this.input, Constants.UP);
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

    public mode(): GrammarTreeVisitor.mode_return {
        const retval = new GrammarTreeVisitor.mode_return();
        retval.start = this.input.LT(1);

        let ID9 = null;
        let MODE10 = null;

        this.enterMode((retval.start as GrammarAST));

        try {
            MODE10 = this.match(this.input, ANTLRv4Parser.MODE);
            this.match(this.input, Constants.DOWN);
            ID9 = this.match(this.input, ANTLRv4Parser.ID);
            this.currentModeName = (ID9 !== null ? ID9.getText() : null);
            this.modeDef(MODE10, ID9);

            loop12:
            while (true) {
                let alt12 = 2;
                const LA12_0 = this.input.LA(1);
                if ((LA12_0 === ANTLRv4Parser.RULE)) {
                    alt12 = 1;
                }

                switch (alt12) {
                    case 1: {
                        this.lexerRule();

                        break;
                    }

                    default: {
                        break loop12;
                    }

                }
            }

            this.match(this.input, Constants.UP);
            this.exitMode((retval.start as GrammarAST));
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerRule(): GrammarTreeVisitor.lexerRule_return {
        const retval = new GrammarTreeVisitor.lexerRule_return();
        retval.start = this.input.LT(1);

        let m = null;
        let TOKEN_REF11 = null;
        let RULE12 = null;
        let opts = null;
        let lexerRuleBlock13 = null;

        this.enterLexerRule((retval.start as GrammarAST));
        const mods = new Array<GrammarAST>();
        this.currentOuterAltNumber = 0;

        try {
            RULE12 = this.match(this.input, ANTLRv4Parser.RULE);
            this.match(this.input, Constants.DOWN);
            TOKEN_REF11 = this.match(this.input, ANTLRv4Parser.TOKEN_REF);
            this.currentRuleName = TOKEN_REF11?.getText() ?? null;
            this.currentRuleAST = RULE12;

            let alt13 = 2;
            const LA13_0 = this.input.LA(1);
            if ((LA13_0 === ANTLRv4Parser.RULEMODIFIERS)) {
                alt13 = 1;
            }

            switch (alt13) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.RULEMODIFIERS);
                    this.match(this.input, Constants.DOWN);
                    m = this.match(this.input, ANTLRv4Parser.FRAGMENT)!;
                    mods.push(m);
                    this.match(this.input, Constants.UP);

                    break;
                }

                default:

            }

            loop14:
            while (true) {
                let alt14 = 2;
                const LA14_0 = this.input.LA(1);
                if ((LA14_0 === ANTLRv4Parser.OPTIONS)) {
                    alt14 = 1;
                }

                switch (alt14) {
                    case 1: {
                        opts = this.optionsSpec();

                        break;
                    }

                    default: {
                        break loop14;
                    }

                }
            }

            this.discoverLexerRule(RULE12 as RuleAST, TOKEN_REF11, mods, opts?.start as GrammarAST | null ?? null,
                this.input.LT(1) as GrammarAST);
            lexerRuleBlock13 = this.lexerRuleBlock();

            this.finishLexerRule(RULE12 as RuleAST, TOKEN_REF11,
                lexerRuleBlock13.start as GrammarAST | null ?? null);
            this.currentRuleName = null; this.currentRuleAST = null;

            this.match(this.input, Constants.UP);
            this.exitLexerRule((retval.start as GrammarAST));
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ruleSpec(): GrammarTreeVisitor.rule_return {
        const retval = new GrammarTreeVisitor.rule_return();
        retval.start = this.input.LT(1);

        let RULE_REF14 = null;
        let RULE15 = null;
        let ARG_ACTION16 = null;
        let m = null;
        let ret = null;
        let thr = null;
        let loc = null;
        let opts = null;
        let a = null;
        let ruleBlock17 = null;

        const mods = new Array<GrammarAST | null>();
        const actions = new Array<GrammarAST | null>(); // track roots
        this.currentOuterAltNumber = 0;

        try {
            RULE15 = this.match(this.input, ANTLRv4Parser.RULE);
            this.match(this.input, Constants.DOWN);
            RULE_REF14 = this.match(this.input, ANTLRv4Parser.RULE_REF);
            this.currentRuleName = (RULE_REF14 !== null ? RULE_REF14.getText() : null); this.currentRuleAST = RULE15;

            let alt16 = 2;
            const LA16_0 = this.input.LA(1);
            if ((LA16_0 === ANTLRv4Parser.RULEMODIFIERS)) {
                alt16 = 1;
            }
            switch (alt16) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.RULEMODIFIERS);
                    this.match(this.input, Constants.DOWN);

                    let cnt15 = 0;
                    loop15:
                    while (true) {
                        let alt15 = 2;
                        const LA15_0 = this.input.LA(1);
                        if ((LA15_0 === ANTLRv4Parser.FRAGMENT || (LA15_0 >= ANTLRv4Parser.PRIVATE && LA15_0 <= ANTLRv4Parser.PUBLIC))) {
                            alt15 = 1;
                        }

                        switch (alt15) {
                            case 1: {
                                m = this.ruleModifier();

                                mods.push(m.start as GrammarAST | null);
                                break;
                            }

                            default: {
                                if (cnt15 >= 1) {
                                    break loop15;
                                }

                                const eee = new EarlyExitException(15);
                                throw eee;
                            }
                        }
                        cnt15++;
                    }

                    this.match(this.input, Constants.UP);

                    break;
                }

                default:
            }

            let alt17 = 2;
            const LA17_0 = this.input.LA(1);
            if ((LA17_0 === ANTLRv4Parser.ARG_ACTION)) {
                alt17 = 1;
            }

            switch (alt17) {
                case 1: {
                    ARG_ACTION16 = this.match(this.input, ANTLRv4Parser.ARG_ACTION)!;

                    break;
                }

                default:

            }

            let alt18 = 2;
            const LA18_0 = this.input.LA(1);
            if ((LA18_0 === ANTLRv4Parser.RETURNS)) {
                alt18 = 1;
            }

            switch (alt18) {
                case 1: {
                    ret = this.ruleReturns();

                    break;
                }

                default:

            }

            let alt19 = 2;
            const LA19_0 = this.input.LA(1);
            if ((LA19_0 === ANTLRv4Parser.THROWS)) {
                alt19 = 1;
            }

            switch (alt19) {
                case 1: {
                    thr = this.throwsSpec();

                    break;
                }

                default:

            }

            let alt20 = 2;
            const LA20_0 = this.input.LA(1);
            if ((LA20_0 === ANTLRv4Parser.LOCALS)) {
                alt20 = 1;
            }

            switch (alt20) {
                case 1: {
                    loc = this.locals();

                    break;
                }

                default:

            }

            loop21:
            while (true) {
                let alt21 = 3;
                const LA21_0 = this.input.LA(1);
                if ((LA21_0 === ANTLRv4Parser.OPTIONS)) {
                    alt21 = 1;
                } else {
                    if ((LA21_0 === ANTLRv4Parser.AT)) {
                        alt21 = 2;
                    }
                }

                switch (alt21) {
                    case 1: {
                        opts = this.optionsSpec();

                        break;
                    }

                    case 2: {
                        a = this.ruleAction();

                        actions.push(a.start as GrammarAST | null);

                        break;
                    }

                    default: {
                        break loop21;
                    }

                }
            }

            const retStart = ret?.start as GrammarAST | null ?? null;
            const thrStart = thr?.start as GrammarAST | null ?? null;
            const locStart = loc?.start as GrammarAST | null ?? null;
            this.discoverRule(RULE15 as RuleAST | null, RULE_REF14, mods, ARG_ACTION16 as ActionAST,
                retStart?.getChild(0) as ActionAST | null ?? null, thrStart,
                opts?.start as GrammarAST | null ?? null,
                locStart?.getChild(0) as ActionAST | null ?? null,
                actions, this.input.LT(1) as GrammarAST);
            ruleBlock17 = this.ruleBlock();

            this.exceptionGroup();

            this.finishRule(RULE15 as RuleAST | null, RULE_REF14, ruleBlock17.start as GrammarAST);
            this.currentRuleName = null;
            this.currentRuleAST = null;
            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public exceptionGroup(): GrammarTreeVisitor.exceptionGroup_return {
        const retval = new GrammarTreeVisitor.exceptionGroup_return();
        retval.start = this.input.LT(1);

        try {
            loop22:
            while (true) {
                let alt22 = 2;
                const LA22_0 = this.input.LA(1);
                if ((LA22_0 === ANTLRv4Parser.CATCH)) {
                    alt22 = 1;
                }

                switch (alt22) {
                    case 1: {
                        this.exceptionHandler();

                        break;
                    }

                    default: {
                        break loop22;
                    }

                }
            }

            let alt23 = 2;
            const LA23_0 = this.input.LA(1);
            if ((LA23_0 === ANTLRv4Parser.FINALLY)) {
                alt23 = 1;
            }

            switch (alt23) {
                case 1: {
                    this.finallyClause();

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

    public exceptionHandler(): GrammarTreeVisitor.exceptionHandler_return {
        const retval = new GrammarTreeVisitor.exceptionHandler_return();
        retval.start = this.input.LT(1);

        let ARG_ACTION18 = null;
        let ACTION19 = null;

        try {
            this.match(this.input, ANTLRv4Parser.CATCH);
            this.match(this.input, Constants.DOWN);
            ARG_ACTION18 = this.match(this.input, ANTLRv4Parser.ARG_ACTION)!;
            ACTION19 = this.match(this.input, ANTLRv4Parser.ACTION)!;
            this.match(this.input, Constants.UP);

            this.ruleCatch(ARG_ACTION18, ACTION19 as ActionAST);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public finallyClause(): GrammarTreeVisitor.finallyClause_return {
        const retval = new GrammarTreeVisitor.finallyClause_return();
        retval.start = this.input.LT(1);

        let ACTION20 = null;
        try {
            this.match(this.input, ANTLRv4Parser.FINALLY);
            this.match(this.input, Constants.DOWN);
            ACTION20 = this.match(this.input, ANTLRv4Parser.ACTION)!;
            this.match(this.input, Constants.UP);

            this.finallyAction(ACTION20 as ActionAST);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public locals(): GrammarTreeVisitor.locals_return {
        const retval = new GrammarTreeVisitor.locals_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.LOCALS);
            this.match(this.input, Constants.DOWN);
            this.match(this.input, ANTLRv4Parser.ARG_ACTION);
            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ruleReturns(): GrammarTreeVisitor.ruleReturns_return {
        const retval = new GrammarTreeVisitor.ruleReturns_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.RETURNS);
            this.match(this.input, Constants.DOWN);
            this.match(this.input, ANTLRv4Parser.ARG_ACTION);
            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public throwsSpec(): GrammarTreeVisitor.throwsSpec_return {
        const retval = new GrammarTreeVisitor.throwsSpec_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.THROWS);
            this.match(this.input, Constants.DOWN);
            // org/antlr/v4/parse/GrammarTreeVisitor.g:621:16: ( ID )+
            let cnt24 = 0;
            loop24:
            while (true) {
                let alt24 = 2;
                const LA24_0 = this.input.LA(1);
                if ((LA24_0 === ANTLRv4Parser.ID)) {
                    alt24 = 1;
                }

                switch (alt24) {
                    case 1: {
                        this.match(this.input, ANTLRv4Parser.ID);

                        break;
                    }

                    default: {
                        if (cnt24 >= 1) {
                            break loop24;
                        }

                        const eee = new EarlyExitException(24);
                        throw eee;
                    }

                }
                cnt24++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ruleAction(): GrammarTreeVisitor.ruleAction_return {
        const retval = new GrammarTreeVisitor.ruleAction_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.AT);
            this.match(this.input, Constants.DOWN);
            this.match(this.input, ANTLRv4Parser.ID);
            this.match(this.input, ANTLRv4Parser.ACTION);
            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ruleModifier(): GrammarTreeVisitor.ruleModifier_return {
        const retval = new GrammarTreeVisitor.ruleModifier_return();
        retval.start = this.input.LT(1);

        try {
            if (this.input.LA(1) === ANTLRv4Parser.FRAGMENT || (this.input.LA(1) >= ANTLRv4Parser.PRIVATE && this.input.LA(1) <= ANTLRv4Parser.PUBLIC)) {
                this.input.consume();
                this.state.errorRecovery = false;
            } else {
                const mse = new MismatchedSetException(null);
                throw mse;
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

    public lexerRuleBlock(): GrammarTreeVisitor.lexerRuleBlock_return {
        const retval = new GrammarTreeVisitor.lexerRuleBlock_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.DOWN);

            let cnt25 = 0;
            loop25:
            while (true) {
                let alt25 = 2;
                const LA25_0 = this.input.LA(1);
                if ((LA25_0 === ANTLRv4Parser.ALT || LA25_0 === ANTLRv4Parser.LEXER_ALT_ACTION)) {
                    alt25 = 1;
                }

                switch (alt25) {
                    case 1: {
                        this.currentOuterAltRoot = this.input.LT(1) as GrammarAST;
                        this.currentOuterAltNumber++;

                        this.lexerOuterAlternative();

                        break;
                    }

                    default: {
                        if (cnt25 >= 1) {
                            break loop25;
                        }

                        const eee = new EarlyExitException(25);
                        throw eee;
                    }

                }
                cnt25++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ruleBlock(): GrammarTreeVisitor.ruleBlock_return {
        const retval = new GrammarTreeVisitor.ruleBlock_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.DOWN);

            let cnt26 = 0;
            loop26:
            while (true) {
                let alt26 = 2;
                const LA26_0 = this.input.LA(1);
                if ((LA26_0 === ANTLRv4Parser.ALT)) {
                    alt26 = 1;
                }

                switch (alt26) {
                    case 1: {
                        this.currentOuterAltRoot = this.input.LT(1) as GrammarAST;
                        this.currentOuterAltNumber++;

                        this.outerAlternative();

                        break;
                    }

                    default: {
                        if (cnt26 >= 1) {
                            break loop26;
                        }

                        const eee = new EarlyExitException(26);
                        throw eee;
                    }

                }
                cnt26++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerOuterAlternative(): GrammarTreeVisitor.lexerOuterAlternative_return {
        const retval = new GrammarTreeVisitor.lexerOuterAlternative_return();
        retval.start = this.input.LT(1);

        this.discoverOuterAlt((retval.start as GrammarAST) as AltAST);

        try {
            this.lexerAlternative();

            this.finishOuterAlt((retval.start as GrammarAST) as AltAST);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public outerAlternative(): GrammarTreeVisitor.outerAlternative_return {
        const retval = new GrammarTreeVisitor.outerAlternative_return();
        retval.start = this.input.LT(1);

        this.discoverOuterAlt((retval.start as GrammarAST) as AltAST);

        try {
            this.alternative();

            this.finishOuterAlt((retval.start as GrammarAST) as AltAST);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerAlternative(): GrammarTreeVisitor.lexerAlternative_return {
        const retval = new GrammarTreeVisitor.lexerAlternative_return();
        retval.start = this.input.LT(1);

        this.enterLexerAlternative((retval.start as GrammarAST));

        try {
            let alt28 = 2;
            const LA28_0 = this.input.LA(1);
            if ((LA28_0 === ANTLRv4Parser.LEXER_ALT_ACTION)) {
                alt28 = 1;
            } else {
                if ((LA28_0 === ANTLRv4Parser.ALT)) {
                    alt28 = 2;
                } else {

                    throw new NoViableAltException(28, 0);
                }
            }

            switch (alt28) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.LEXER_ALT_ACTION);
                    this.match(this.input, Constants.DOWN);
                    this.lexerElements();

                    // org/antlr/v4/parse/GrammarTreeVisitor.g:713:37: ( lexerCommand )+
                    let cnt27 = 0;
                    loop27:
                    while (true) {
                        let alt27 = 2;
                        const LA27_0 = this.input.LA(1);
                        if ((LA27_0 === ANTLRv4Parser.ID || LA27_0 === ANTLRv4Parser.LEXER_ACTION_CALL)) {
                            alt27 = 1;
                        }

                        switch (alt27) {
                            case 1: {
                                this.lexerCommand();

                                break;
                            }

                            default: {
                                if (cnt27 >= 1) {
                                    break loop27;
                                }

                                const eee = new EarlyExitException(27);
                                throw eee;
                            }

                        }
                        cnt27++;
                    }

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 2: {
                    this.lexerElements();

                    break;
                }

                default:

            }

            this.exitLexerAlternative((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerElements(): GrammarTreeVisitor.lexerElements_return {
        const retval = new GrammarTreeVisitor.lexerElements_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.ALT);
            this.match(this.input, Constants.DOWN);

            let cnt29 = 0;
            loop29:
            while (true) {
                let alt29 = 2;
                const LA29_0 = this.input.LA(1);
                if ((LA29_0 === ANTLRv4Parser.ACTION || LA29_0 === ANTLRv4Parser.LEXER_CHAR_SET || LA29_0 === ANTLRv4Parser.NOT || LA29_0 === ANTLRv4Parser.RANGE || LA29_0 === ANTLRv4Parser.RULE_REF || LA29_0 === ANTLRv4Parser.SEMPRED || LA29_0 === ANTLRv4Parser.STRING_LITERAL || LA29_0 === ANTLRv4Parser.TOKEN_REF || (LA29_0 >= ANTLRv4Parser.BLOCK && LA29_0 <= ANTLRv4Parser.CLOSURE) || LA29_0 === ANTLRv4Parser.EPSILON || (LA29_0 >= ANTLRv4Parser.OPTIONAL && LA29_0 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA29_0 >= ANTLRv4Parser.SET && LA29_0 <= ANTLRv4Parser.WILDCARD))) {
                    alt29 = 1;
                }

                switch (alt29) {
                    case 1: {
                        this.lexerElement();

                        break;
                    }

                    default: {
                        if (cnt29 >= 1) {
                            break loop29;
                        }

                        const eee = new EarlyExitException(29);
                        throw eee;
                    }

                }
                cnt29++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerElement(): GrammarTreeVisitor.lexerElement_return {
        const retval = new GrammarTreeVisitor.lexerElement_return();
        retval.start = this.input.LT(1);

        let ACTION21 = null;
        let SEMPRED22 = null;
        let ACTION23 = null;
        let SEMPRED24 = null;

        this.enterLexerElement((retval.start as GrammarAST));

        try {
            let alt30 = 7;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.LEXER_CHAR_SET:
                case ANTLRv4Parser.NOT:
                case ANTLRv4Parser.RANGE:
                case ANTLRv4Parser.RULE_REF:
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF:
                case ANTLRv4Parser.SET:
                case ANTLRv4Parser.WILDCARD: {
                    alt30 = 1;

                    break;
                }

                case ANTLRv4Parser.BLOCK:
                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    alt30 = 2;

                    break;
                }

                case ANTLRv4Parser.ACTION: {
                    {
                        const LA30_3 = this.input.LA(2);
                        if ((LA30_3 === Constants.DOWN)) {
                            alt30 = 5;
                        } else {
                            if (((LA30_3 >= Constants.UP && LA30_3 <= ANTLRv4Parser.ACTION) || LA30_3 === ANTLRv4Parser.LEXER_CHAR_SET || LA30_3 === ANTLRv4Parser.NOT || LA30_3 === ANTLRv4Parser.RANGE || LA30_3 === ANTLRv4Parser.RULE_REF || LA30_3 === ANTLRv4Parser.SEMPRED || LA30_3 === ANTLRv4Parser.STRING_LITERAL || LA30_3 === ANTLRv4Parser.TOKEN_REF || (LA30_3 >= ANTLRv4Parser.BLOCK && LA30_3 <= ANTLRv4Parser.CLOSURE) || LA30_3 === ANTLRv4Parser.EPSILON || (LA30_3 >= ANTLRv4Parser.OPTIONAL && LA30_3 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA30_3 >= ANTLRv4Parser.SET && LA30_3 <= ANTLRv4Parser.WILDCARD))) {
                                alt30 = 3;
                            } else {
                                const nvaeMark = this.input.mark();
                                try {
                                    this.input.consume();

                                    throw new NoViableAltException(30, 3);
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.SEMPRED: {
                    const LA30_4 = this.input.LA(2);
                    if ((LA30_4 === Constants.DOWN)) {
                        alt30 = 6;
                    } else {
                        if (((LA30_4 >= Constants.UP && LA30_4 <= ANTLRv4Parser.ACTION) || LA30_4 === ANTLRv4Parser.LEXER_CHAR_SET || LA30_4 === ANTLRv4Parser.NOT || LA30_4 === ANTLRv4Parser.RANGE || LA30_4 === ANTLRv4Parser.RULE_REF || LA30_4 === ANTLRv4Parser.SEMPRED || LA30_4 === ANTLRv4Parser.STRING_LITERAL || LA30_4 === ANTLRv4Parser.TOKEN_REF || (LA30_4 >= ANTLRv4Parser.BLOCK && LA30_4 <= ANTLRv4Parser.CLOSURE) || LA30_4 === ANTLRv4Parser.EPSILON || (LA30_4 >= ANTLRv4Parser.OPTIONAL && LA30_4 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA30_4 >= ANTLRv4Parser.SET && LA30_4 <= ANTLRv4Parser.WILDCARD))) {
                            alt30 = 4;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(30, 4);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.EPSILON: {
                    alt30 = 7;

                    break;
                }

                default: {

                    throw new NoViableAltException(30, 0);
                }

            }

            switch (alt30) {
                case 1: {
                    this.lexerAtom();

                    break;
                }

                case 2: {
                    this.lexerSubrule();

                    break;
                }

                case 3: {
                    ACTION21 = this.match(this.input, ANTLRv4Parser.ACTION)!;
                    this.actionInAlt(ACTION21 as ActionAST);

                    break;
                }

                case 4: {
                    SEMPRED22 = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                    this.sempredInAlt(SEMPRED22 as PredAST);

                    break;
                }

                case 5: {
                    ACTION23 = this.match(this.input, ANTLRv4Parser.ACTION)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.actionInAlt(ACTION23 as ActionAST);

                    break;
                }

                case 6: {
                    SEMPRED24 = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.sempredInAlt(SEMPRED24 as PredAST);

                    break;
                }

                case 7: {
                    this.match(this.input, ANTLRv4Parser.EPSILON);

                    break;
                }

                default:

            }

            this.exitLexerElement((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerBlock(): GrammarTreeVisitor.lexerBlock_return {
        const retval = new GrammarTreeVisitor.lexerBlock_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.DOWN);

            let alt31 = 2;
            const LA31_0 = this.input.LA(1);
            if ((LA31_0 === ANTLRv4Parser.OPTIONS)) {
                alt31 = 1;
            }

            switch (alt31) {
                case 1: {
                    this.optionsSpec();

                    break;
                }

                default:

            }

            let cnt32 = 0;
            loop32:
            while (true) {
                let alt32 = 2;
                const LA32_0 = this.input.LA(1);
                if ((LA32_0 === ANTLRv4Parser.ALT || LA32_0 === ANTLRv4Parser.LEXER_ALT_ACTION)) {
                    alt32 = 1;
                }

                switch (alt32) {
                    case 1: {
                        this.lexerAlternative();

                        break;
                    }

                    default: {
                        if (cnt32 >= 1) {
                            break loop32;
                        }

                        const eee = new EarlyExitException(32);
                        throw eee;
                    }

                }
                cnt32++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerAtom(): GrammarTreeVisitor.lexerAtom_return {
        const retval = new GrammarTreeVisitor.lexerAtom_return();
        retval.start = this.input.LT(1);

        try {
            let alt33 = 8;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF: {
                    alt33 = 1;

                    break;
                }

                case ANTLRv4Parser.NOT: {
                    alt33 = 2;

                    break;
                }

                case ANTLRv4Parser.SET: {
                    alt33 = 3;

                    break;
                }

                case ANTLRv4Parser.WILDCARD: {
                    const LA33_4 = this.input.LA(2);
                    if ((LA33_4 === Constants.DOWN)) {
                        alt33 = 4;
                    } else {
                        if (((LA33_4 >= Constants.UP && LA33_4 <= ANTLRv4Parser.ACTION) || LA33_4 === ANTLRv4Parser.LEXER_CHAR_SET || LA33_4 === ANTLRv4Parser.NOT || LA33_4 === ANTLRv4Parser.RANGE || LA33_4 === ANTLRv4Parser.RULE_REF || LA33_4 === ANTLRv4Parser.SEMPRED || LA33_4 === ANTLRv4Parser.STRING_LITERAL || LA33_4 === ANTLRv4Parser.TOKEN_REF || (LA33_4 >= ANTLRv4Parser.BLOCK && LA33_4 <= ANTLRv4Parser.CLOSURE) || LA33_4 === ANTLRv4Parser.EPSILON || (LA33_4 >= ANTLRv4Parser.OPTIONAL && LA33_4 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA33_4 >= ANTLRv4Parser.SET && LA33_4 <= ANTLRv4Parser.WILDCARD))) {
                            alt33 = 5;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(33, 4);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.LEXER_CHAR_SET: {
                    alt33 = 6;

                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    alt33 = 7;

                    break;
                }

                case ANTLRv4Parser.RULE_REF: {
                    alt33 = 8;

                    break;
                }

                default: {

                    throw new NoViableAltException(33, 0);
                }

            }
            switch (alt33) {
                case 1: {
                    this.terminal();

                    break;
                }

                case 2: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.DOWN);
                    this.blockSet();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 3: {
                    this.blockSet();

                    break;
                }

                case 4: {
                    this.match(this.input, ANTLRv4Parser.WILDCARD);
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 5: {
                    this.match(this.input, ANTLRv4Parser.WILDCARD);

                    break;
                }

                case 6: {
                    this.match(this.input, ANTLRv4Parser.LEXER_CHAR_SET);

                    break;
                }

                case 7: {
                    this.range();

                    break;
                }

                case 8: {
                    this.ruleref();

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

    public actionElement(): GrammarTreeVisitor.actionElement_return {
        const retval = new GrammarTreeVisitor.actionElement_return();
        retval.start = this.input.LT(1);

        try {
            let alt34 = 4;
            const LA34_0 = this.input.LA(1);
            if ((LA34_0 === ANTLRv4Parser.ACTION)) {
                const LA34_1 = this.input.LA(2);
                if ((LA34_1 === Constants.DOWN)) {
                    alt34 = 2;
                } else {
                    if ((LA34_1 === ANTLRv4Parser.EOF)) {
                        alt34 = 1;
                    } else {
                        const nvaeMark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(34, 1);
                        } finally {
                            this.input.release(nvaeMark);
                        }
                    }
                }
            } else {
                if ((LA34_0 === ANTLRv4Parser.SEMPRED)) {
                    const LA34_2 = this.input.LA(2);
                    if ((LA34_2 === Constants.DOWN)) {
                        alt34 = 4;
                    } else {
                        if ((LA34_2 === ANTLRv4Parser.EOF)) {
                            alt34 = 3;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(34, 2);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                } else {

                    throw new NoViableAltException(34, 0);
                }
            }

            switch (alt34) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.ACTION);

                    break;
                }

                case 2: {
                    this.match(this.input, ANTLRv4Parser.ACTION);
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 3: {
                    this.match(this.input, ANTLRv4Parser.SEMPRED);

                    break;
                }

                case 4: {
                    this.match(this.input, ANTLRv4Parser.SEMPRED);
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

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

    public alternative(): GrammarTreeVisitor.alternative_return {
        const retval = new GrammarTreeVisitor.alternative_return();
        retval.start = this.input.LT(1);

        this.enterAlternative((retval.start as GrammarAST) as AltAST);
        this.discoverAlt((retval.start as GrammarAST) as AltAST);

        try {
            let alt38 = 1;
            if (retval.start?.getChild(0)?.getType() === ANTLRv4Parser.EPSILON) { // Empty alternative.
                alt38 = 2;
            }

            switch (alt38) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.ALT);
                    this.match(this.input, Constants.DOWN);

                    let alt35 = 2;
                    const LA35_0 = this.input.LA(1);
                    if ((LA35_0 === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                        alt35 = 1;
                    }

                    switch (alt35) {
                        case 1: {
                            this.elementOptions();

                            break;
                        }

                        default:

                    }

                    let cnt36 = 0;
                    loop36:
                    while (true) {
                        let alt36 = 2;
                        const LA36_0 = this.input.LA(1);
                        if ((LA36_0 === ANTLRv4Parser.ACTION || LA36_0 === ANTLRv4Parser.ASSIGN || LA36_0 === ANTLRv4Parser.DOT || LA36_0 === ANTLRv4Parser.NOT || LA36_0 === ANTLRv4Parser.PLUS_ASSIGN || LA36_0 === ANTLRv4Parser.RANGE || LA36_0 === ANTLRv4Parser.RULE_REF || LA36_0 === ANTLRv4Parser.SEMPRED || LA36_0 === ANTLRv4Parser.STRING_LITERAL || LA36_0 === ANTLRv4Parser.TOKEN_REF || (LA36_0 >= ANTLRv4Parser.BLOCK && LA36_0 <= ANTLRv4Parser.CLOSURE) || (LA36_0 >= ANTLRv4Parser.OPTIONAL && LA36_0 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA36_0 >= ANTLRv4Parser.SET && LA36_0 <= ANTLRv4Parser.WILDCARD))) {
                            alt36 = 1;
                        }

                        switch (alt36) {
                            case 1: {
                                this.element();

                                break;
                            }

                            default: {
                                if (cnt36 >= 1) {
                                    break loop36;
                                }

                                const eee = new EarlyExitException(36);
                                throw eee;
                            }

                        }
                        cnt36++;
                    }

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 2: {
                    this.match(this.input, ANTLRv4Parser.ALT);
                    this.match(this.input, Constants.DOWN);

                    let alt37 = 2;
                    const LA37_0 = this.input.LA(1);
                    if ((LA37_0 === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                        alt37 = 1;
                    }

                    switch (alt37) {
                        case 1: {
                            this.elementOptions();

                            break;
                        }

                        default:

                    }

                    this.match(this.input, ANTLRv4Parser.EPSILON);
                    this.match(this.input, Constants.UP);

                    break;
                }

                default:

            }

            this.finishAlt((retval.start as GrammarAST) as AltAST);
            this.exitAlternative((retval.start as GrammarAST) as AltAST);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerCommandExpr(): GrammarTreeVisitor.lexerCommandExpr_return {
        const retval = new GrammarTreeVisitor.lexerCommandExpr_return();
        retval.start = this.input.LT(1);

        try {
            if (this.input.LA(1) === ANTLRv4Parser.ID || this.input.LA(1) === ANTLRv4Parser.INT) {
                this.input.consume();
                this.state.errorRecovery = false;
            } else {
                const mse = new MismatchedSetException(null);
                throw mse;
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

    public element(): GrammarTreeVisitor.element_return {
        const retval = new GrammarTreeVisitor.element_return();
        retval.start = this.input.LT(1);

        let ACTION28 = null;
        let SEMPRED29 = null;
        let ACTION30 = null;
        let SEMPRED31 = null;

        this.enterElement((retval.start as GrammarAST));

        try {
            let alt40 = 10;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.ASSIGN:
                case ANTLRv4Parser.PLUS_ASSIGN: {
                    alt40 = 1;

                    break;
                }

                case ANTLRv4Parser.DOT:
                case ANTLRv4Parser.RULE_REF:
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF:
                case ANTLRv4Parser.SET:
                case ANTLRv4Parser.WILDCARD: {
                    alt40 = 2;

                    break;
                }

                case ANTLRv4Parser.BLOCK:
                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    alt40 = 3;

                    break;
                }

                case ANTLRv4Parser.ACTION: {
                    const LA40_4 = this.input.LA(2);
                    if ((LA40_4 === Constants.DOWN)) {
                        alt40 = 6;
                    } else {
                        if (((LA40_4 >= Constants.UP && LA40_4 <= ANTLRv4Parser.ACTION) || LA40_4 === ANTLRv4Parser.ASSIGN || LA40_4 === ANTLRv4Parser.DOT || LA40_4 === ANTLRv4Parser.NOT || LA40_4 === ANTLRv4Parser.PLUS_ASSIGN || LA40_4 === ANTLRv4Parser.RANGE || LA40_4 === ANTLRv4Parser.RULE_REF || LA40_4 === ANTLRv4Parser.SEMPRED || LA40_4 === ANTLRv4Parser.STRING_LITERAL || LA40_4 === ANTLRv4Parser.TOKEN_REF || (LA40_4 >= ANTLRv4Parser.BLOCK && LA40_4 <= ANTLRv4Parser.CLOSURE) || (LA40_4 >= ANTLRv4Parser.OPTIONAL && LA40_4 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA40_4 >= ANTLRv4Parser.SET && LA40_4 <= ANTLRv4Parser.WILDCARD))) {
                            alt40 = 4;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(40, 4);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.SEMPRED: {
                    const LA40_5 = this.input.LA(2);
                    if ((LA40_5 === Constants.DOWN)) {
                        alt40 = 7;
                    } else {
                        if (((LA40_5 >= Constants.UP && LA40_5 <= ANTLRv4Parser.ACTION) || LA40_5 === ANTLRv4Parser.ASSIGN || LA40_5 === ANTLRv4Parser.DOT || LA40_5 === ANTLRv4Parser.NOT || LA40_5 === ANTLRv4Parser.PLUS_ASSIGN || LA40_5 === ANTLRv4Parser.RANGE || LA40_5 === ANTLRv4Parser.RULE_REF || LA40_5 === ANTLRv4Parser.SEMPRED || LA40_5 === ANTLRv4Parser.STRING_LITERAL || LA40_5 === ANTLRv4Parser.TOKEN_REF || (LA40_5 >= ANTLRv4Parser.BLOCK && LA40_5 <= ANTLRv4Parser.CLOSURE) || (LA40_5 >= ANTLRv4Parser.OPTIONAL && LA40_5 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA40_5 >= ANTLRv4Parser.SET && LA40_5 <= ANTLRv4Parser.WILDCARD))) {
                            alt40 = 5;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(40, 5);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    alt40 = 8;

                    break;
                }

                case ANTLRv4Parser.NOT: {
                    const LA40_7 = this.input.LA(2);
                    if ((LA40_7 === Constants.DOWN)) {
                        const LA40_12 = this.input.LA(3);
                        if ((LA40_12 === ANTLRv4Parser.SET)) {
                            alt40 = 9;
                        } else {
                            if ((LA40_12 === ANTLRv4Parser.BLOCK)) {
                                alt40 = 10;
                            } else {
                                const nvaeMark = this.input.mark();
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }

                                    throw new NoViableAltException(40, 12);
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    } else {
                        const nvaeMark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(40, 7);
                        } finally {
                            this.input.release(nvaeMark);
                        }
                    }

                    break;
                }

                default: {
                    throw new NoViableAltException(40, 0);
                }
            }

            switch (alt40) {
                case 1: {
                    this.labeledElement();

                    break;
                }

                case 2: {
                    this.atom();

                    break;
                }

                case 3: {
                    this.subrule();

                    break;
                }

                case 4: {
                    ACTION28 = this.match(this.input, ANTLRv4Parser.ACTION)!;
                    this.actionInAlt(ACTION28 as ActionAST);

                    break;
                }

                case 5: {
                    SEMPRED29 = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                    this.sempredInAlt(SEMPRED29 as PredAST);

                    break;
                }

                case 6: {
                    ACTION30 = this.match(this.input, ANTLRv4Parser.ACTION)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.actionInAlt(ACTION30 as ActionAST);

                    break;
                }

                case 7: {
                    SEMPRED31 = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.sempredInAlt(SEMPRED31 as PredAST);

                    break;
                }

                case 8: {
                    this.range();

                    break;
                }

                case 9: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.DOWN);
                    this.blockSet();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 10: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.DOWN);
                    this.block();

                    this.match(this.input, Constants.UP);

                    break;
                }

                default:
            }

            this.exitElement((retval.start as GrammarAST));
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public astOperand(): GrammarTreeVisitor.astOperand_return {
        const retval = new GrammarTreeVisitor.astOperand_return();
        retval.start = this.input.LT(1);

        try {
            let alt41 = 3;
            const LA41_0 = this.input.LA(1);
            if ((LA41_0 === ANTLRv4Parser.DOT || LA41_0 === ANTLRv4Parser.RULE_REF || LA41_0 === ANTLRv4Parser.STRING_LITERAL || LA41_0 === ANTLRv4Parser.TOKEN_REF || (LA41_0 >= ANTLRv4Parser.SET && LA41_0 <= ANTLRv4Parser.WILDCARD))) {
                alt41 = 1;
            } else {
                if ((LA41_0 === ANTLRv4Parser.NOT)) {
                    const LA41_2 = this.input.LA(2);
                    if ((LA41_2 === Constants.DOWN)) {
                        const LA41_3 = this.input.LA(3);
                        if ((LA41_3 === ANTLRv4Parser.SET)) {
                            alt41 = 2;
                        } else {
                            if ((LA41_3 === ANTLRv4Parser.BLOCK)) {
                                alt41 = 3;
                            } else {
                                const nvaeMark = this.input.mark();
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }

                                    throw new NoViableAltException(41, 3);
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    } else {
                        const nvaeMark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(41, 2);
                        } finally {
                            this.input.release(nvaeMark);
                        }
                    }

                } else {
                    throw new NoViableAltException(41, 0);
                }
            }

            switch (alt41) {
                case 1: {
                    this.atom();

                    break;
                }

                case 2: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.DOWN);
                    this.blockSet();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 3: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.DOWN);
                    this.block();

                    this.match(this.input, Constants.UP);

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

    public labeledElement(): GrammarTreeVisitor.labeledElement_return {
        const retval = new GrammarTreeVisitor.labeledElement_return();
        retval.start = this.input.LT(1);

        let ID32 = null;

        try {
            if (this.input.LA(1) === ANTLRv4Parser.ASSIGN || this.input.LA(1) === ANTLRv4Parser.PLUS_ASSIGN) {
                this.input.consume();
                this.state.errorRecovery = false;
            } else {
                const mse = new MismatchedSetException(null);
                throw mse;
            }

            this.match(this.input, Constants.DOWN);
            ID32 = this.match(this.input, ANTLRv4Parser.ID)!;

            const element33 = this.element();
            this.match(this.input, Constants.UP);
            this.label((retval.start as GrammarAST | null), ID32, element33.start as GrammarAST | null);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public subrule(): GrammarTreeVisitor.subrule_return {
        const retval = new GrammarTreeVisitor.subrule_return();
        retval.start = this.input.LT(1);

        try {
            let alt42 = 2;
            const LA42_0 = this.input.LA(1);
            if ((LA42_0 === ANTLRv4Parser.CLOSURE || (LA42_0 >= ANTLRv4Parser.OPTIONAL && LA42_0 <= ANTLRv4Parser.POSITIVE_CLOSURE))) {
                alt42 = 1;
            } else {
                if ((LA42_0 === ANTLRv4Parser.BLOCK)) {
                    alt42 = 2;
                } else {

                    throw new NoViableAltException(42, 0);
                }
            }

            switch (alt42) {
                case 1: {
                    this.blockSuffix();

                    this.match(this.input, Constants.DOWN);
                    this.block();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 2: {
                    this.block();

                    break;
                }

                default:
            }

            this.exitSubrule((retval.start as GrammarAST));
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public lexerSubrule(): GrammarTreeVisitor.lexerSubrule_return {
        const retval = new GrammarTreeVisitor.lexerSubrule_return();
        retval.start = this.input.LT(1);

        try {
            let alt43 = 2;
            const LA43_0 = this.input.LA(1);
            if ((LA43_0 === ANTLRv4Parser.CLOSURE || (LA43_0 >= ANTLRv4Parser.OPTIONAL && LA43_0 <= ANTLRv4Parser.POSITIVE_CLOSURE))) {
                alt43 = 1;
            } else {
                if ((LA43_0 === ANTLRv4Parser.BLOCK)) {
                    alt43 = 2;
                } else {
                    throw new NoViableAltException(43, 0);
                }
            }

            switch (alt43) {
                case 1: {
                    this.blockSuffix();

                    this.match(this.input, Constants.DOWN);
                    this.lexerBlock();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 2: {
                    this.lexerBlock();

                    break;
                }

                default:
            }

            this.exitLexerSubrule((retval.start as GrammarAST));
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public blockSuffix(): GrammarTreeVisitor.blockSuffix_return {
        const retval = new GrammarTreeVisitor.blockSuffix_return();
        retval.start = this.input.LT(1);

        try {
            this.ebnfSuffix();
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ebnfSuffix(): GrammarTreeVisitor.ebnfSuffix_return {
        const retval = new GrammarTreeVisitor.ebnfSuffix_return();
        retval.start = this.input.LT(1);

        try {
            if (this.input.LA(1) === ANTLRv4Parser.CLOSURE || (this.input.LA(1) >= ANTLRv4Parser.OPTIONAL && this.input.LA(1) <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                this.input.consume();
                this.state.errorRecovery = false;
            } else {
                const mse = new MismatchedSetException(null);
                throw mse;
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

    public atom(): GrammarTreeVisitor.atom_return {
        const retval = new GrammarTreeVisitor.atom_return();
        retval.start = this.input.LT(1);

        let WILDCARD34 = null;
        let WILDCARD35 = null;

        try {
            let alt44 = 7;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.DOT: {
                    const LA44_1 = this.input.LA(2);
                    if ((LA44_1 === Constants.DOWN)) {
                        const LA44_6 = this.input.LA(3);
                        if ((LA44_6 === ANTLRv4Parser.ID)) {
                            const LA44_9 = this.input.LA(4);
                            if ((LA44_9 === ANTLRv4Parser.STRING_LITERAL || LA44_9 === ANTLRv4Parser.TOKEN_REF)) {
                                alt44 = 1;
                            } else {
                                if ((LA44_9 === ANTLRv4Parser.RULE_REF)) {
                                    alt44 = 2;
                                } else {
                                    const nvaeMark = this.input.mark();
                                    try {
                                        for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                            this.input.consume();
                                        }

                                        throw new NoViableAltException(44, 9);
                                    } finally {
                                        this.input.release(nvaeMark);
                                    }
                                }
                            }
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                    this.input.consume();
                                }

                                throw new NoViableAltException(44, 6);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    } else {
                        const nvaeMark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(44, 1);
                        } finally {
                            this.input.release(nvaeMark);
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.WILDCARD: {
                    const LA44_2 = this.input.LA(2);
                    if ((LA44_2 === Constants.DOWN)) {
                        alt44 = 3;
                    } else {
                        if ((LA44_2 === ANTLRv4Parser.EOF || (LA44_2 >= Constants.UP && LA44_2 <= ANTLRv4Parser.ACTION) || LA44_2 === ANTLRv4Parser.ASSIGN || LA44_2 === ANTLRv4Parser.DOT || LA44_2 === ANTLRv4Parser.NOT || LA44_2 === ANTLRv4Parser.PLUS_ASSIGN || LA44_2 === ANTLRv4Parser.RANGE || LA44_2 === ANTLRv4Parser.RULE_REF || LA44_2 === ANTLRv4Parser.SEMPRED || LA44_2 === ANTLRv4Parser.STRING_LITERAL || LA44_2 === ANTLRv4Parser.TOKEN_REF || (LA44_2 >= ANTLRv4Parser.BLOCK && LA44_2 <= ANTLRv4Parser.CLOSURE) || (LA44_2 >= ANTLRv4Parser.OPTIONAL && LA44_2 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA44_2 >= ANTLRv4Parser.SET && LA44_2 <= ANTLRv4Parser.WILDCARD))) {
                            alt44 = 4;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(44, 2);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF: {
                    alt44 = 5;

                    break;
                }

                case ANTLRv4Parser.SET: {
                    alt44 = 6;

                    break;
                }

                case ANTLRv4Parser.RULE_REF: {
                    alt44 = 7;

                    break;
                }

                default: {
                    throw new NoViableAltException(44, 0);
                }

            }
            switch (alt44) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.DOT);
                    this.match(this.input, Constants.DOWN);
                    this.match(this.input, ANTLRv4Parser.ID);
                    this.terminal();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 2: {
                    this.match(this.input, ANTLRv4Parser.DOT);
                    this.match(this.input, Constants.DOWN);
                    this.match(this.input, ANTLRv4Parser.ID);
                    this.ruleref();

                    this.match(this.input, Constants.UP);

                    break;
                }

                case 3: {
                    WILDCARD34 = this.match(this.input, ANTLRv4Parser.WILDCARD)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.wildcardRef(WILDCARD34);

                    break;
                }

                case 4: {
                    WILDCARD35 = this.match(this.input, ANTLRv4Parser.WILDCARD)!;
                    this.wildcardRef(WILDCARD35);

                    break;
                }

                case 5: {
                    this.terminal();

                    break;
                }

                case 6: {
                    this.blockSet();

                    break;
                }

                case 7: {
                    this.ruleref();

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

    public blockSet(): GrammarTreeVisitor.blockSet_return {
        const retval = new GrammarTreeVisitor.blockSet_return();
        retval.start = this.input.LT(1);

        this.enterBlockSet((retval.start as GrammarAST));

        try {
            this.match(this.input, ANTLRv4Parser.SET);
            this.match(this.input, Constants.DOWN);

            let cnt45 = 0;
            loop45:
            while (true) {
                let alt45 = 2;
                const LA45_0 = this.input.LA(1);
                if ((LA45_0 === ANTLRv4Parser.LEXER_CHAR_SET || LA45_0 === ANTLRv4Parser.RANGE || LA45_0 === ANTLRv4Parser.STRING_LITERAL || LA45_0 === ANTLRv4Parser.TOKEN_REF)) {
                    alt45 = 1;
                }

                switch (alt45) {
                    case 1: {
                        this.setElement();

                        break;
                    }

                    default: {
                        if (cnt45 >= 1) {
                            break loop45;
                        }

                        const eee = new EarlyExitException(45);
                        throw eee;
                    }

                }
                cnt45++;
            }

            this.match(this.input, Constants.UP);
            this.exitBlockSet((retval.start as GrammarAST));
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public setElement(): GrammarTreeVisitor.setElement_return {
        const retval = new GrammarTreeVisitor.setElement_return();
        retval.start = this.input.LT(1);

        let a = null;
        let b = null;
        let STRING_LITERAL36 = null;
        let TOKEN_REF37 = null;
        let STRING_LITERAL38 = null;
        let TOKEN_REF39 = null;

        try {
            let alt46 = 6;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.STRING_LITERAL: {
                    const LA46_1 = this.input.LA(2);
                    if ((LA46_1 === Constants.DOWN)) {
                        alt46 = 1;
                    } else {
                        if ((LA46_1 === Constants.UP || LA46_1 === ANTLRv4Parser.LEXER_CHAR_SET || LA46_1 === ANTLRv4Parser.RANGE || LA46_1 === ANTLRv4Parser.STRING_LITERAL || LA46_1 === ANTLRv4Parser.TOKEN_REF)) {
                            alt46 = 3;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(46, 1);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.TOKEN_REF: {
                    const LA46_2 = this.input.LA(2);
                    if ((LA46_2 === Constants.DOWN)) {
                        alt46 = 2;
                    } else {
                        if ((LA46_2 === Constants.UP || LA46_2 === ANTLRv4Parser.LEXER_CHAR_SET || LA46_2 === ANTLRv4Parser.RANGE || LA46_2 === ANTLRv4Parser.STRING_LITERAL || LA46_2 === ANTLRv4Parser.TOKEN_REF)) {
                            alt46 = 4;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(46, 2);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    alt46 = 5;

                    break;
                }

                case ANTLRv4Parser.LEXER_CHAR_SET: {
                    alt46 = 6;

                    break;
                }

                default: {
                    throw new NoViableAltException(46, 0);
                }

            }
            switch (alt46) {
                case 1: {
                    STRING_LITERAL36 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.stringRef(STRING_LITERAL36 as TerminalAST);

                    break;
                }

                case 2: {
                    TOKEN_REF37 = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.tokenRef(TOKEN_REF37 as TerminalAST);

                    break;
                }

                case 3: {
                    STRING_LITERAL38 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.stringRef(STRING_LITERAL38 as TerminalAST);

                    break;
                }

                case 4: {
                    TOKEN_REF39 = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                    this.tokenRef(TOKEN_REF39 as TerminalAST);

                    break;
                }

                case 5: {
                    this.match(this.input, ANTLRv4Parser.RANGE);
                    this.match(this.input, Constants.DOWN);
                    a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    b = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.match(this.input, Constants.UP);

                    this.stringRef(a as TerminalAST);
                    this.stringRef(b as TerminalAST);

                    break;
                }

                case 6: {
                    this.match(this.input, ANTLRv4Parser.LEXER_CHAR_SET);

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

    public block(): GrammarTreeVisitor.block_return {
        const retval = new GrammarTreeVisitor.block_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.DOWN);

            let alt47 = 2;
            const LA47_0 = this.input.LA(1);
            if ((LA47_0 === ANTLRv4Parser.OPTIONS)) {
                alt47 = 1;
            }
            switch (alt47) {
                case 1: {
                    this.optionsSpec();

                    break;
                }

                default:
            }

            loop48:
            while (true) {
                let alt48 = 2;
                const LA48_0 = this.input.LA(1);
                if ((LA48_0 === ANTLRv4Parser.AT)) {
                    alt48 = 1;
                }

                switch (alt48) {
                    case 1: {
                        this.ruleAction();

                        break;
                    }

                    default: {
                        break loop48;
                    }

                }
            }

            let alt49 = 2;
            const LA49_0 = this.input.LA(1);
            if ((LA49_0 === ANTLRv4Parser.ACTION)) {
                alt49 = 1;
            }

            switch (alt49) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.ACTION);

                    break;
                }

                default:
            }

            let cnt50 = 0;
            loop50:
            while (true) {
                let alt50 = 2;
                const LA50_0 = this.input.LA(1);
                if ((LA50_0 === ANTLRv4Parser.ALT)) {
                    alt50 = 1;
                }

                switch (alt50) {
                    case 1: {
                        this.alternative();

                        break;
                    }

                    default: {
                        if (cnt50 >= 1) {
                            break loop50;
                        }

                        const eee = new EarlyExitException(50);
                        throw eee;
                    }

                }
                cnt50++;
            }

            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public ruleref(): GrammarTreeVisitor.ruleref_return {
        const retval = new GrammarTreeVisitor.ruleRef_return();
        retval.start = this.input.LT(1);

        let arg = null;
        let RULE_REF40 = null;

        try {
            RULE_REF40 = this.match(this.input, ANTLRv4Parser.RULE_REF)!;
            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);

                let alt51 = 2;
                const LA51_0 = this.input.LA(1);
                if ((LA51_0 === ANTLRv4Parser.ARG_ACTION)) {
                    alt51 = 1;
                }
                switch (alt51) {
                    case 1: {
                        arg = this.match(this.input, ANTLRv4Parser.ARG_ACTION)!;

                        break;
                    }

                    default:

                }

                let alt52 = 2;
                const LA52_0 = this.input.LA(1);
                if ((LA52_0 === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                    alt52 = 1;
                }

                switch (alt52) {
                    case 1: {
                        this.elementOptions();

                        break;
                    }

                    default:

                }

                this.match(this.input, Constants.UP);
            }

            this.ruleRef(RULE_REF40, arg as ActionAST);
            if (arg !== null) {
                this.actionInAlt(arg as ActionAST);
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

    public range(): GrammarTreeVisitor.range_return {
        const retval = new GrammarTreeVisitor.range_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.RANGE);
            this.match(this.input, Constants.DOWN);
            this.match(this.input, ANTLRv4Parser.STRING_LITERAL);
            this.match(this.input, ANTLRv4Parser.STRING_LITERAL);
            this.match(this.input, Constants.UP);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    public terminal(): GrammarTreeVisitor.terminal_return {
        const retval = new GrammarTreeVisitor.terminal_return();
        retval.start = this.input.LT(1);

        let STRING_LITERAL41 = null;
        let STRING_LITERAL42 = null;
        let TOKEN_REF43 = null;
        let TOKEN_REF44 = null;

        this.enterTerminal((retval.start as GrammarAST));

        try {
            let alt53 = 4;
            const LA53_0 = this.input.LA(1);
            if ((LA53_0 === ANTLRv4Parser.STRING_LITERAL)) {
                const LA53_1 = this.input.LA(2);
                if ((LA53_1 === Constants.DOWN)) {
                    alt53 = 1;
                } else {
                    if ((LA53_1 === ANTLRv4Parser.EOF || (LA53_1 >= Constants.UP && LA53_1 <= ANTLRv4Parser.ACTION) || LA53_1 === ANTLRv4Parser.ASSIGN || LA53_1 === ANTLRv4Parser.DOT || LA53_1 === ANTLRv4Parser.LEXER_CHAR_SET || LA53_1 === ANTLRv4Parser.NOT || LA53_1 === ANTLRv4Parser.PLUS_ASSIGN || LA53_1 === ANTLRv4Parser.RANGE || LA53_1 === ANTLRv4Parser.RULE_REF || LA53_1 === ANTLRv4Parser.SEMPRED || LA53_1 === ANTLRv4Parser.STRING_LITERAL || LA53_1 === ANTLRv4Parser.TOKEN_REF || (LA53_1 >= ANTLRv4Parser.BLOCK && LA53_1 <= ANTLRv4Parser.CLOSURE) || LA53_1 === ANTLRv4Parser.EPSILON || (LA53_1 >= ANTLRv4Parser.OPTIONAL && LA53_1 <= ANTLRv4Parser.POSITIVE_CLOSURE) || (LA53_1 >= ANTLRv4Parser.SET && LA53_1 <= ANTLRv4Parser.WILDCARD))) {
                        alt53 = 2;
                    } else {
                        const nvaeMark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(53, 1);
                        } finally {
                            this.input.release(nvaeMark);
                        }
                    }
                }
            } else {
                if ((LA53_0 === ANTLRv4Parser.TOKEN_REF)) {
                    const LA53_2 = this.input.LA(2);
                    if ((LA53_2 === Constants.DOWN)) {
                        alt53 = 3;
                    } else {
                        if ((LA53_2 === ANTLRv4Parser.EOF
                            || (LA53_2 >= Constants.UP && LA53_2 <= ANTLRv4Parser.ACTION)
                            || LA53_2 === ANTLRv4Parser.ASSIGN
                            || LA53_2 === ANTLRv4Parser.DOT
                            || LA53_2 === ANTLRv4Parser.LEXER_CHAR_SET
                            || LA53_2 === ANTLRv4Parser.NOT
                            || LA53_2 === ANTLRv4Parser.PLUS_ASSIGN
                            || LA53_2 === ANTLRv4Parser.RANGE
                            || LA53_2 === ANTLRv4Parser.RULE_REF
                            || LA53_2 === ANTLRv4Parser.SEMPRED
                            || LA53_2 === ANTLRv4Parser.STRING_LITERAL
                            || LA53_2 === ANTLRv4Parser.TOKEN_REF
                            || (LA53_2 >= ANTLRv4Parser.BLOCK && LA53_2 <= ANTLRv4Parser.CLOSURE)
                            || LA53_2 === ANTLRv4Parser.EPSILON
                            || (LA53_2 >= ANTLRv4Parser.OPTIONAL && LA53_2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                            || (LA53_2 >= ANTLRv4Parser.SET && LA53_2 <= ANTLRv4Parser.WILDCARD))) {
                            alt53 = 4;
                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(53, 2);
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                } else {
                    throw new NoViableAltException(53, 0);
                }
            }

            switch (alt53) {
                case 1: {
                    STRING_LITERAL41 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();

                    this.match(this.input, Constants.UP);

                    this.stringRef(STRING_LITERAL41 as TerminalAST);

                    break;
                }

                case 2: {
                    STRING_LITERAL42 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.stringRef(STRING_LITERAL42 as TerminalAST);

                    break;
                }

                case 3: {
                    TOKEN_REF43 = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                    this.match(this.input, Constants.DOWN);
                    this.elementOptions();
                    this.match(this.input, Constants.UP);
                    this.tokenRef(TOKEN_REF43 as TerminalAST);

                    break;
                }

                case 4: {
                    TOKEN_REF44 = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                    this.tokenRef(TOKEN_REF44 as TerminalAST);

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

    public elementOptions(): GrammarTreeVisitor.elementOptions_return {
        const retval = new GrammarTreeVisitor.elementOptions_return();
        retval.start = this.input.LT(1);

        try {
            this.match(this.input, ANTLRv4Parser.ELEMENT_OPTIONS);
            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);

                loop54:
                while (true) {
                    let alt54 = 2;
                    const LA54_0 = this.input.LA(1);
                    if ((LA54_0 === ANTLRv4Parser.ASSIGN || LA54_0 === ANTLRv4Parser.ID)) {
                        alt54 = 1;
                    }

                    switch (alt54) {
                        case 1: {
                            this.elementOption((retval.start as GrammarAST).getParent() as GrammarASTWithOptions);

                            break;
                        }

                        default: {
                            break loop54;
                        }

                    }
                }

                this.match(this.input, Constants.UP);
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

    protected enterChannelsSpec(tree: GrammarAST): void { /**/ }

    protected enterMode(tree: GrammarAST): void { /**/ }
    protected exitMode(tree: GrammarAST): void { /**/ }

    protected enterLexerRule(tree: GrammarAST): void { /**/ }
    protected exitLexerRule(tree: GrammarAST): void { /**/ }

    protected enterLexerAlternative(tree: GrammarAST): void { /**/ }
    protected exitLexerAlternative(tree: GrammarAST): void { /**/ }

    protected enterLexerElement(tree: GrammarAST): void { /**/ }
    protected exitLexerElement(tree: GrammarAST): void { /**/ }

    protected enterAlternative(tree: AltAST): void { /**/ }
    protected exitAlternative(tree: AltAST): void { /**/ }

    protected enterLexerCommand(tree: GrammarAST): void { /**/ }

    protected enterElement(tree: GrammarAST): void { /**/ }
    protected exitElement(tree: GrammarAST): void { /**/ }

    protected exitSubrule(tree: GrammarAST): void { /**/ }

    protected exitLexerSubrule(tree: GrammarAST): void { /**/ }

    protected enterBlockSet(tree: GrammarAST): void { /**/ }
    protected exitBlockSet(tree: GrammarAST): void { /**/ }

    protected enterTerminal(tree: GrammarAST): void { /**/ }
}

export namespace GrammarTreeVisitor {
    export type grammarSpec_return = InstanceType<typeof GrammarTreeVisitor.grammarSpec_return>;
    export type prequelConstructs_return = InstanceType<typeof GrammarTreeVisitor.prequelConstructs_return>;
    export type prequelConstruct_return = InstanceType<typeof GrammarTreeVisitor.prequelConstruct_return>;
    export type optionsSpec_return = InstanceType<typeof GrammarTreeVisitor.optionsSpec_return>;
    export type option_return = InstanceType<typeof GrammarTreeVisitor.option_return>;
    export type optionValue_return = InstanceType<typeof GrammarTreeVisitor.optionValue_return>;
    export type delegateGrammars_return = InstanceType<typeof GrammarTreeVisitor.delegateGrammars_return>;
    export type delegateGrammar_return = InstanceType<typeof GrammarTreeVisitor.delegateGrammar_return>;
    export type tokensSpec_return = InstanceType<typeof GrammarTreeVisitor.tokensSpec_return>;
    export type tokenSpec_return = InstanceType<typeof GrammarTreeVisitor.tokenSpec_return>;
    export type channelsSpec_return = InstanceType<typeof GrammarTreeVisitor.channelsSpec_return>;
    export type channelSpec_return = InstanceType<typeof GrammarTreeVisitor.channelSpec_return>;
    export type action_return = InstanceType<typeof GrammarTreeVisitor.action_return>;
    export type rules_return = InstanceType<typeof GrammarTreeVisitor.rules_return>;
    export type mode_return = InstanceType<typeof GrammarTreeVisitor.mode_return>;
    export type lexerRule_return = InstanceType<typeof GrammarTreeVisitor.lexerRule_return>;
    export type rule_return = InstanceType<typeof GrammarTreeVisitor.rule_return>;
    export type exceptionGroup_return = InstanceType<typeof GrammarTreeVisitor.exceptionGroup_return>;
    export type exceptionHandler_return = InstanceType<typeof GrammarTreeVisitor.exceptionHandler_return>;
    export type finallyClause_return = InstanceType<typeof GrammarTreeVisitor.finallyClause_return>;
    export type locals_return = InstanceType<typeof GrammarTreeVisitor.locals_return>;
    export type ruleReturns_return = InstanceType<typeof GrammarTreeVisitor.ruleReturns_return>;
    export type throwsSpec_return = InstanceType<typeof GrammarTreeVisitor.throwsSpec_return>;
    export type ruleAction_return = InstanceType<typeof GrammarTreeVisitor.ruleAction_return>;
    export type ruleModifier_return = InstanceType<typeof GrammarTreeVisitor.ruleModifier_return>;
    export type lexerRuleBlock_return = InstanceType<typeof GrammarTreeVisitor.lexerRuleBlock_return>;
    export type ruleBlock_return = InstanceType<typeof GrammarTreeVisitor.ruleBlock_return>;
    export type lexerOuterAlternative_return = InstanceType<typeof GrammarTreeVisitor.lexerOuterAlternative_return>;
    export type outerAlternative_return = InstanceType<typeof GrammarTreeVisitor.outerAlternative_return>;
    export type lexerAlternative_return = InstanceType<typeof GrammarTreeVisitor.lexerAlternative_return>;
    export type lexerElements_return = InstanceType<typeof GrammarTreeVisitor.lexerElements_return>;
    export type lexerElement_return = InstanceType<typeof GrammarTreeVisitor.lexerElement_return>;
    export type lexerBlock_return = InstanceType<typeof GrammarTreeVisitor.lexerBlock_return>;
    export type lexerAtom_return = InstanceType<typeof GrammarTreeVisitor.lexerAtom_return>;
    export type actionElement_return = InstanceType<typeof GrammarTreeVisitor.actionElement_return>;
    export type alternative_return = InstanceType<typeof GrammarTreeVisitor.alternative_return>;
    export type lexerCommand_return = InstanceType<typeof GrammarTreeVisitor.lexerCommand_return>;
    export type lexerCommandExpr_return = InstanceType<typeof GrammarTreeVisitor.lexerCommandExpr_return>;
    export type element_return = InstanceType<typeof GrammarTreeVisitor.element_return>;
    export type astOperand_return = InstanceType<typeof GrammarTreeVisitor.astOperand_return>;
    export type labeledElement_return = InstanceType<typeof GrammarTreeVisitor.labeledElement_return>;
    export type subrule_return = InstanceType<typeof GrammarTreeVisitor.subrule_return>;
    export type lexerSubrule_return = InstanceType<typeof GrammarTreeVisitor.lexerSubrule_return>;
    export type blockSuffix_return = InstanceType<typeof GrammarTreeVisitor.blockSuffix_return>;
    export type ebnfSuffix_return = InstanceType<typeof GrammarTreeVisitor.ebnfSuffix_return>;
    export type atom_return = InstanceType<typeof GrammarTreeVisitor.atom_return>;
    export type blockSet_return = InstanceType<typeof GrammarTreeVisitor.blockSet_return>;
    export type setElement_return = InstanceType<typeof GrammarTreeVisitor.setElement_return>;
    export type block_return = InstanceType<typeof GrammarTreeVisitor.block_return>;
    export type ruleref_return = InstanceType<typeof GrammarTreeVisitor.ruleRef_return>;
    export type range_return = InstanceType<typeof GrammarTreeVisitor.range_return>;
    export type terminal_return = InstanceType<typeof GrammarTreeVisitor.terminal_return>;
    export type elementOptions_return = InstanceType<typeof GrammarTreeVisitor.elementOptions_return>;
    export type elementOption_return = InstanceType<typeof GrammarTreeVisitor.elementOption_return>;
}
