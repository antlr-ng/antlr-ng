/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/* eslint-disable max-len, @typescript-eslint/naming-convention */
// cspell: disable

import { RecognitionException } from "antlr4ng";

import { EarlyExitException } from "../antlr3/EarlyExitException.js";
import { createRecognizerSharedState, IRecognizerSharedState } from "../antlr3/IRecognizerSharedState.js";
import { MismatchedSetException } from "../antlr3/MismatchedSetException.js";
import { NoViableAltException } from "../antlr3/NoViableAltException.js";
import { CommonTreeNodeStream } from "../antlr3/tree/CommonTreeNodeStream.js";
import type { TreeNodeStream } from "../antlr3/tree/TreeNodeStream.js";
import { TreeParser } from "../antlr3/tree/TreeParser.js";
import { TreeRuleReturnScope } from "../antlr3/tree/TreeRuleReturnScope.js";

import { ClassFactory } from "../ClassFactory.js";
import { Constants } from "../Constants.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import type { ActionAST } from "../tool/ast/ActionAST.js";
import type { AltAST } from "../tool/ast/AltAST.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { GrammarRootAST } from "../tool/ast/GrammarRootAST.js";
import type { PredAST } from "../tool/ast/PredAST.js";
import type { RuleAST } from "../tool/ast/RuleAST.js";
import type { TerminalAST } from "../tool/ast/TerminalAST.js";

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

    public constructor(input?: TreeNodeStream, state?: IRecognizerSharedState) {
        super(input, state ?? createRecognizerSharedState());
    }

    public getDelegates(): TreeParser[] {
        return [];
    }

    public override getTokenNames(): string[] {
        return GrammarTreeVisitor.tokenNames;
    }

    public override getGrammarFileName(): string {
        return "org/antlr/v4/parse/GrammarTreeVisitor.g";
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

    // $ANTLR start "elementOption"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:1008:1: elementOption[GrammarASTWithOptions t] : ( ID | ^( ASSIGN id= ID v= ID ) | ^( ASSIGN ID v= STRING_LITERAL ) | ^( ASSIGN ID v= ACTION ) | ^( ASSIGN ID v= INT ) );
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

                this.enterElementOption((retval.start as GrammarAST));

                try {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:1015:5: ( ID | ^( ASSIGN id= ID v= ID ) | ^( ASSIGN ID v= STRING_LITERAL ) | ^( ASSIGN ID v= ACTION ) | ^( ASSIGN ID v= INT ) )
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

                                                const nvae =
                                                    new NoViableAltException("", 55, 4, this.input);
                                                throw nvae;
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
                                        const nvae =
                                            new NoViableAltException("", 55, 3, this.input);
                                        throw nvae;
                                    } finally {
                                        this.input.release(nvaeMark);
                                    }
                                }
                            } else {
                                const nvaeMark = this.input.mark();
                                try {
                                    this.input.consume();
                                    const nvae =
                                        new NoViableAltException("", 55, 2, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        } else {
                            const nvae =
                                new NoViableAltException("", 55, 0, this.input);
                            throw nvae;
                        }
                    }

                    switch (alt55) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:1015:7: ID
                            {
                                ID45 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                this.elementOption(t, ID45, null);
                            }
                            break;
                        }

                        case 2: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:1016:9: ^( ASSIGN id= ID v= ID )
                            {
                                this.match(this.input, ANTLRv4Parser.ASSIGN, null);
                                this.match(this.input, Constants.DOWN, null);
                                id = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                v = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                this.match(this.input, Constants.UP, null);

                                this.elementOption(t, id, v);
                            }
                            break;
                        }

                        case 3: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:1017:9: ^( ASSIGN ID v= STRING_LITERAL )
                            {
                                this.match(this.input, ANTLRv4Parser.ASSIGN, null);
                                this.match(this.input, Constants.DOWN, null);
                                ID46 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                v = this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null) as GrammarAST;
                                this.match(this.input, Constants.UP, null);

                                this.elementOption(t, ID46, v);
                            }
                            break;
                        }

                        case 4: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:1018:9: ^( ASSIGN ID v= ACTION )
                            {
                                this.match(this.input, ANTLRv4Parser.ASSIGN, null);
                                this.match(this.input, Constants.DOWN, null);
                                ID47 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                v = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                                this.match(this.input, Constants.UP, null);

                                this.elementOption(t, ID47, v);
                            }
                            break;
                        }

                        case 5: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:1019:9: ^( ASSIGN ID v= INT )
                            {
                                this.match(this.input, ANTLRv4Parser.ASSIGN, null);
                                this.match(this.input, Constants.DOWN, null);
                                ID48 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                v = this.match(this.input, ANTLRv4Parser.INT, null) as GrammarAST;
                                this.match(this.input, Constants.UP, null);

                                this.elementOption(t, ID48, v);
                            }
                            break;
                        }

                        default:

                    }

                    this.exitElementOption((retval.start as GrammarAST));
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

    // $ANTLR start "lexerCommand"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:796:1: lexerCommand : ( ^( LEXER_ACTION_CALL ID lexerCommandExpr ) | ID );
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
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:803:2: ( ^( LEXER_ACTION_CALL ID lexerCommandExpr ) | ID )
                    let alt39 = 2;
                    const LA39_0 = this.input.LA(1);
                    if ((LA39_0 === ANTLRv4Parser.LEXER_ACTION_CALL)) {
                        alt39 = 1;
                    } else {
                        if ((LA39_0 === ANTLRv4Parser.ID)) {
                            alt39 = 2;
                        } else {
                            const nvae =
                                new NoViableAltException("", 39, 0, this.input);
                            throw nvae;
                        }
                    }

                    switch (alt39) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:803:4: ^( LEXER_ACTION_CALL ID lexerCommandExpr )
                            {
                                this.match(this.input, ANTLRv4Parser.LEXER_ACTION_CALL, null);
                                this.match(this.input, Constants.DOWN, null);
                                ID25 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                lexerCommandExpr26 = this.lexerCommandExpr();

                                this.match(this.input, Constants.UP, null);

                                this.lexerCallCommand(this.currentOuterAltNumber, ID25,
                                    lexerCommandExpr26.start as GrammarAST);
                            }
                            break;
                        }

                        case 2: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:805:4: ID
                            {
                                ID27 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                                this.lexerCommand(this.currentOuterAltNumber, ID27);
                            }
                            break;
                        }

                        default:
                    }

                    this.exitLexerCommand((retval.start as GrammarAST));

                } catch (re) {
                    if (re instanceof RecognitionException) {
                        this.reportError(re);
                    } else {
                        throw re;
                    }
                } finally {
                    // do for sure before leaving
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

    public override traceIn(ruleName: string, ruleIndex: number): void {
        console.error("enter " + ruleName + ": " + this.input.LT(1));
    }

    public override traceOut(ruleName: string, ruleIndex: number): void {
        console.error("exit " + ruleName + ": " + this.input.LT(1));
    }

    // $ANTLR start "grammarSpec"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:341:1: grammarSpec : ^( GRAMMAR ID prequelConstructs rules ( mode )* ) ;
    public grammarSpec(): GrammarTreeVisitor.grammarSpec_return {
        const retval = new GrammarTreeVisitor.grammarSpec_return();
        retval.start = this.input.LT(1);

        let ID1 = null;
        let GRAMMAR2 = null;
        let prequelConstructs3 = null;

        this.enterGrammarSpec((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:348:5: ( ^( GRAMMAR ID prequelConstructs rules ( mode )* ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:348:9: ^( GRAMMAR ID prequelConstructs rules ( mode )* )
            {
                GRAMMAR2 = this.match(this.input, ANTLRv4Parser.GRAMMAR, null) as GrammarAST | null;
                this.match(this.input, Constants.DOWN, null);
                ID1 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST | null;
                this.grammarName = ID1?.getText() ?? null;
                this.discoverGrammar(GRAMMAR2 as GrammarRootAST, ID1);
                prequelConstructs3 = this.prequelConstructs();

                this.finishPrequels(prequelConstructs3.firstOne);
                this.rules();

                // org/antlr/v4/parse/GrammarTreeVisitor.g:352:14: ( mode )*
                loop1:
                while (true) {
                    let alt1 = 2;
                    const LA1_0 = this.input.LA(1);
                    if ((LA1_0 === ANTLRv4Parser.MODE)) {
                        alt1 = 1;
                    }

                    switch (alt1) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:352:14: mode
                            {
                                this.mode();

                            }
                            break;
                        }

                        default: {
                            break loop1;
                        }

                    }
                }

                this.finishGrammar(GRAMMAR2 as GrammarRootAST, ID1);
                this.match(this.input, Constants.UP, null);

            }

            this.exitGrammarSpec((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "prequelConstructs"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:357:1: prequelConstructs returns [GrammarAST firstOne=null] : ( ( prequelConstruct )+ |);
    public prequelConstructs(): GrammarTreeVisitor.prequelConstructs_return {
        const retval = new GrammarTreeVisitor.prequelConstructs_return();
        retval.start = this.input.LT(1);

        this.enterPrequelConstructs((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:364:2: ( ( prequelConstruct )+ |)
            let alt3 = 2;
            const LA3_0 = this.input.LA(1);
            if ((LA3_0 === ANTLRv4Parser.AT || LA3_0 === ANTLRv4Parser.CHANNELS || LA3_0 === ANTLRv4Parser.IMPORT || LA3_0 === ANTLRv4Parser.OPTIONS || LA3_0 === ANTLRv4Parser.TOKENS)) {
                alt3 = 1;
            } else {
                if ((LA3_0 === ANTLRv4Parser.RULES)) {
                    alt3 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 3, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt3) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:364:4: ( prequelConstruct )+
                    {
                        retval.firstOne = (retval.start as GrammarAST);
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:364:24: ( prequelConstruct )+
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
                                    // org/antlr/v4/parse/GrammarTreeVisitor.g:364:24: prequelConstruct
                                    {
                                        this.prequelConstruct();

                                    }
                                    break;
                                }

                                default: {
                                    if (cnt2 >= 1) {
                                        break loop2;
                                    }

                                    const eee = new EarlyExitException(2, this.input);
                                    throw eee;
                                }

                            }
                            cnt2++;
                        }

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:366:2:
                    break;
                }

                default:

            }

            this.exitPrequelConstructs((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "prequelConstruct"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:368:1: prequelConstruct : ( optionsSpec | delegateGrammars | tokensSpec | channelsSpec | action );
    public prequelConstruct(): GrammarTreeVisitor.prequelConstruct_return {
        const retval = new GrammarTreeVisitor.prequelConstruct_return();
        retval.start = this.input.LT(1);

        this.enterPrequelConstructs((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:375:2: ( optionsSpec | delegateGrammars | tokensSpec | channelsSpec | action )
            let alt4 = 5;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.OPTIONS: {
                    {
                        alt4 = 1;
                    }
                    break;
                }

                case ANTLRv4Parser.IMPORT: {
                    {
                        alt4 = 2;
                    }
                    break;
                }

                case ANTLRv4Parser.TOKENS: {
                    {
                        alt4 = 3;
                    }
                    break;
                }

                case ANTLRv4Parser.CHANNELS: {
                    {
                        alt4 = 4;
                    }
                    break;
                }

                case ANTLRv4Parser.AT: {
                    {
                        alt4 = 5;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException("", 4, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt4) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:375:6: optionsSpec
                    {
                        this.optionsSpec();

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:376:9: delegateGrammars
                    {
                        this.delegateGrammars();

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:377:9: tokensSpec
                    {
                        this.tokensSpec();

                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:378:9: channelsSpec
                    {
                        this.channelsSpec();

                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:379:9: action
                    {
                        this.action();

                    }
                    break;
                }

                default:

            }

            this.exitPrequelConstructs((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "optionsSpec"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:382:1: optionsSpec : ^( OPTIONS ( option )* ) ;
    public optionsSpec(): GrammarTreeVisitor.optionsSpec_return {
        const retval = new GrammarTreeVisitor.optionsSpec_return();
        retval.start = this.input.LT(1);

        this.enterOptionsSpec((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:389:2: ( ^( OPTIONS ( option )* ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:389:4: ^( OPTIONS ( option )* )
            {
                this.match(this.input, ANTLRv4Parser.OPTIONS, null);
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN, null);
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:389:14: ( option )*
                    loop5:
                    while (true) {
                        let alt5 = 2;
                        const LA5_0 = this.input.LA(1);
                        if ((LA5_0 === ANTLRv4Parser.ASSIGN)) {
                            alt5 = 1;
                        }

                        switch (alt5) {
                            case 1: {
                                // org/antlr/v4/parse/GrammarTreeVisitor.g:389:14: option
                                {
                                    this.option();

                                }
                                break;
                            }

                            default: {
                                break loop5;
                            }

                        }
                    }

                    this.match(this.input, Constants.UP, null);
                }

            }

            this.exitOptionsSpec((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "option"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:392:1: option : ^(a= ASSIGN ID v= optionValue ) ;
    public option(): GrammarTreeVisitor.option_return {
        const retval = new GrammarTreeVisitor.option_return();
        retval.start = this.input.LT(1);

        let ID4 = null;
        let v = null;

        this.enterOption((retval.start as GrammarAST));
        const rule = this.inContext("RULE ...");
        const block = this.inContext("BLOCK ...");

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:401:5: ( ^(a= ASSIGN ID v= optionValue ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:401:9: ^(a= ASSIGN ID v= optionValue )
            {
                this.match(this.input, ANTLRv4Parser.ASSIGN, null) as GrammarAST | null;
                this.match(this.input, Constants.DOWN, null);
                ID4 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST | null;
                v = this.optionValue();

                this.match(this.input, Constants.UP, null);

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

            }

            this.exitOption((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "optionValue"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:409:1: optionValue returns [String v] : ( ID | STRING_LITERAL | INT );
    public optionValue(): GrammarTreeVisitor.optionValue_return {
        const retval = new GrammarTreeVisitor.optionValue_return();
        retval.start = this.input.LT(1);

        this.enterOptionValue((retval.start as GrammarAST));
        retval.v = (retval.start as GrammarAST).token?.text ?? "";

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:417:5: ( ID | STRING_LITERAL | INT )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:
            {
                if (this.input.LA(1) === ANTLRv4Parser.ID || this.input.LA(1) === ANTLRv4Parser.INT
                    || this.input.LA(1) === ANTLRv4Parser.STRING_LITERAL) {
                    this.input.consume();
                    this.state.errorRecovery = false;
                } else {
                    const mse = new MismatchedSetException(null, this.input);
                    throw mse;
                }
            }

            this.exitOptionValue((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    // $ANTLR start "delegateGrammars"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:422:1: delegateGrammars : ^( IMPORT ( delegateGrammar )+ ) ;
    public delegateGrammars(): GrammarTreeVisitor.delegateGrammars_return {
        const retval = new GrammarTreeVisitor.delegateGrammars_return();
        retval.start = this.input.LT(1);

        this.enterDelegateGrammars((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:429:2: ( ^( IMPORT ( delegateGrammar )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:429:6: ^( IMPORT ( delegateGrammar )+ )
            {
                this.match(this.input, ANTLRv4Parser.IMPORT, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:429:15: ( delegateGrammar )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:429:15: delegateGrammar
                            {
                                this.delegateGrammar();

                            }
                            break;
                        }

                        default: {
                            if (cnt6 >= 1) {
                                break loop6;
                            }

                            const eee = new EarlyExitException(6, this.input);
                            throw eee;
                        }

                    }
                    cnt6++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitDelegateGrammars((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "delegateGrammar"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:432:1: delegateGrammar : ( ^( ASSIGN label= ID id= ID ) |id= ID );
    public delegateGrammar(): GrammarTreeVisitor.delegateGrammar_return {
        const retval = new GrammarTreeVisitor.delegateGrammar_return();
        retval.start = this.input.LT(1);

        let label = null;
        let id = null;

        this.enterDelegateGrammar((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:439:5: ( ^( ASSIGN label= ID id= ID ) |id= ID )
            let alt7 = 2;
            const LA7_0 = this.input.LA(1);
            if ((LA7_0 === ANTLRv4Parser.ASSIGN)) {
                alt7 = 1;
            } else {
                if ((LA7_0 === ANTLRv4Parser.ID)) {
                    alt7 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 7, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt7) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:439:9: ^( ASSIGN label= ID id= ID )
                    {
                        this.match(this.input, ANTLRv4Parser.ASSIGN, null);
                        this.match(this.input, Constants.DOWN, null);
                        label = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                        id = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                        this.match(this.input, Constants.UP, null);

                        this.importGrammar(label, id);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:440:9: id= ID
                    {
                        id = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                        this.importGrammar(null, id);
                    }
                    break;
                }

                default:

            }

            this.exitDelegateGrammar((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "tokensSpec"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:443:1: tokensSpec : ^( TOKENS ( tokenSpec )+ ) ;
    public tokensSpec(): GrammarTreeVisitor.tokensSpec_return {
        const retval = new GrammarTreeVisitor.tokensSpec_return();
        retval.start = this.input.LT(1);

        this.enterTokensSpec((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:450:2: ( ^( TOKENS ( tokenSpec )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:450:6: ^( TOKENS ( tokenSpec )+ )
            {
                this.match(this.input, ANTLRv4Parser.TOKENS, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:450:20: ( tokenSpec )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:450:20: tokenSpec
                            {
                                this.tokenSpec();

                            }
                            break;
                        }

                        default: {
                            if (cnt8 >= 1) {
                                break loop8;
                            }

                            const eee = new EarlyExitException(8, this.input);
                            throw eee;
                        }

                    }
                    cnt8++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitTokensSpec((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "tokenSpec"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:453:1: tokenSpec : ID ;
    public tokenSpec(): GrammarTreeVisitor.tokenSpec_return {
        const retval = new GrammarTreeVisitor.tokenSpec_return();
        retval.start = this.input.LT(1);

        let ID5 = null;

        this.enterTokenSpec((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:460:2: ( ID )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:460:4: ID
            {
                ID5 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                this.defineToken(ID5);
            }

            this.exitTokenSpec((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "channelsSpec"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:463:1: channelsSpec : ^( CHANNELS ( channelSpec )+ ) ;
    public channelsSpec(): GrammarTreeVisitor.channelsSpec_return {
        const retval = new GrammarTreeVisitor.channelsSpec_return();
        retval.start = this.input.LT(1);

        this.enterChannelsSpec((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:470:2: ( ^( CHANNELS ( channelSpec )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:470:6: ^( CHANNELS ( channelSpec )+ )
            {
                this.match(this.input, ANTLRv4Parser.CHANNELS, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:470:17: ( channelSpec )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:470:17: channelSpec
                            {
                                this.channelSpec();

                            }
                            break;
                        }

                        default: {
                            if (cnt9 >= 1) {
                                break loop9;
                            }

                            const eee = new EarlyExitException(9, this.input);
                            throw eee;
                        }

                    }
                    cnt9++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitChannelsSpec((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "channelSpec"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:473:1: channelSpec : ID ;
    public channelSpec(): GrammarTreeVisitor.channelSpec_return {
        const retval = new GrammarTreeVisitor.channelSpec_return();
        retval.start = this.input.LT(1);

        let ID6 = null;

        this.enterChannelSpec((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:480:2: ( ID )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:480:4: ID
            {
                ID6 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                this.defineChannel(ID6);
            }

            this.exitChannelSpec((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "action"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:483:1: action : ^( AT (sc= ID )? name= ID ACTION ) ;
    public action(): GrammarTreeVisitor.action_return {
        const retval = new GrammarTreeVisitor.action_return();
        retval.start = this.input.LT(1);

        let sc = null;
        let name = null;
        let ACTION7 = null;

        this.enterAction((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:490:2: ( ^( AT (sc= ID )? name= ID ACTION ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:490:4: ^( AT (sc= ID )? name= ID ACTION )
            {
                this.match(this.input, ANTLRv4Parser.AT, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:490:11: (sc= ID )?
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
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:490:11: sc= ID
                        {
                            sc = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                        }
                        break;
                    }

                    default:

                }

                name = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;
                ACTION7 = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                this.match(this.input, Constants.UP, null);

                this.globalNamedAction(sc, name, ACTION7 as ActionAST);
            }

            this.exitAction((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "rules"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:493:1: rules : ^( RULES ( rule | lexerRule )* ) ;
    public rules(): GrammarTreeVisitor.rules_return {
        const retval = new GrammarTreeVisitor.rules_return();
        retval.start = this.input.LT(1);

        let RULES8 = null;

        this.enterRules((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:500:5: ( ^( RULES ( rule | lexerRule )* ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:500:7: ^( RULES ( rule | lexerRule )* )
            {
                RULES8 = this.match(this.input, ANTLRv4Parser.RULES, null) as GrammarAST;
                this.discoverRules(RULES8);
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN, null);
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:500:40: ( rule | lexerRule )*
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
                                // org/antlr/v4/parse/GrammarTreeVisitor.g:500:41: rule
                                {
                                    this.ruleSpec();

                                }
                                break;
                            }

                            case 2: {
                                // org/antlr/v4/parse/GrammarTreeVisitor.g:500:46: lexerRule
                                {
                                    this.lexerRule();

                                }
                                break;
                            }

                            default: {
                                break loop11;
                            }

                        }
                    }

                    this.finishRules(RULES8);
                    this.match(this.input, Constants.UP, null);
                }

            }

            this.exitRules((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "mode"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:503:1: mode : ^( MODE ID ( lexerRule )* ) ;
    public mode(): GrammarTreeVisitor.mode_return {
        const retval = new GrammarTreeVisitor.mode_return();
        retval.start = this.input.LT(1);

        let ID9 = null;
        let MODE10 = null;

        this.enterMode((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:510:2: ( ^( MODE ID ( lexerRule )* ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:510:4: ^( MODE ID ( lexerRule )* )
            {
                MODE10 = this.match(this.input, ANTLRv4Parser.MODE, null) as GrammarAST | null;
                this.match(this.input, Constants.DOWN, null);
                ID9 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST | null;
                this.currentModeName = (ID9 !== null ? ID9.getText() : null);
                this.modeDef(MODE10, ID9);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:510:64: ( lexerRule )*
                loop12:
                while (true) {
                    let alt12 = 2;
                    const LA12_0 = this.input.LA(1);
                    if ((LA12_0 === ANTLRv4Parser.RULE)) {
                        alt12 = 1;
                    }

                    switch (alt12) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:510:64: lexerRule
                            {
                                this.lexerRule();

                            }
                            break;
                        }

                        default: {
                            break loop12;
                        }

                    }
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitMode((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerRule"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:513:1: lexerRule : ^( RULE TOKEN_REF ( ^( RULEMODIFIERS m= FRAGMENT ) )? (opts= optionsSpec )* lexerRuleBlock ) ;
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
            // org/antlr/v4/parse/GrammarTreeVisitor.g:522:2: ( ^( RULE TOKEN_REF ( ^( RULEMODIFIERS m= FRAGMENT ) )? (opts= optionsSpec )* lexerRuleBlock ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:522:4: ^( RULE TOKEN_REF ( ^( RULEMODIFIERS m= FRAGMENT ) )? (opts= optionsSpec )* lexerRuleBlock )
            {
                RULE12 = this.match(this.input, ANTLRv4Parser.RULE, null) as GrammarAST | null;
                this.match(this.input, Constants.DOWN, null);
                TOKEN_REF11 = this.match(this.input, ANTLRv4Parser.TOKEN_REF, null) as GrammarAST | null;
                this.currentRuleName = TOKEN_REF11?.getText() ?? null;
                this.currentRuleAST = RULE12;
                // org/antlr/v4/parse/GrammarTreeVisitor.g:524:4: ( ^( RULEMODIFIERS m= FRAGMENT ) )?
                let alt13 = 2;
                const LA13_0 = this.input.LA(1);
                if ((LA13_0 === ANTLRv4Parser.RULEMODIFIERS)) {
                    alt13 = 1;
                }
                switch (alt13) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:524:5: ^( RULEMODIFIERS m= FRAGMENT )
                        {
                            this.match(this.input, ANTLRv4Parser.RULEMODIFIERS, null);
                            this.match(this.input, Constants.DOWN, null);
                            m = this.match(this.input, ANTLRv4Parser.FRAGMENT, null) as GrammarAST;
                            mods.push(m);
                            this.match(this.input, Constants.UP, null);

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:525:8: (opts= optionsSpec )*
                loop14:
                while (true) {
                    let alt14 = 2;
                    const LA14_0 = this.input.LA(1);
                    if ((LA14_0 === ANTLRv4Parser.OPTIONS)) {
                        alt14 = 1;
                    }

                    switch (alt14) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:525:8: opts= optionsSpec
                            {
                                opts = this.optionsSpec();

                            }
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

                this.match(this.input, Constants.UP, null);

            }

            this.exitLexerRule((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "rule"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:535:1: rule : ^( RULE RULE_REF ( ^( RULEMODIFIERS (m= ruleModifier )+ ) )? ( ARG_ACTION )? (ret= ruleReturns )? (thr= throwsSpec )? (loc= locals )? (opts= optionsSpec |a= ruleAction )* ruleBlock exceptionGroup ) ;
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

        this.enterRule((retval.start as GrammarAST));
        const mods = new Array<GrammarAST | null>();
        const actions = new Array<GrammarAST | null>(); // track roots
        this.currentOuterAltNumber = 0;

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:545:2: ( ^( RULE RULE_REF ( ^( RULEMODIFIERS (m= ruleModifier )+ ) )? ( ARG_ACTION )? (ret= ruleReturns )? (thr= throwsSpec )? (loc= locals )? (opts= optionsSpec |a= ruleAction )* ruleBlock exceptionGroup ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:545:6: ^( RULE RULE_REF ( ^( RULEMODIFIERS (m= ruleModifier )+ ) )? ( ARG_ACTION )? (ret= ruleReturns )? (thr= throwsSpec )? (loc= locals )? (opts= optionsSpec |a= ruleAction )* ruleBlock exceptionGroup )
            {
                RULE15 = this.match(this.input, ANTLRv4Parser.RULE, null) as GrammarAST | null;
                this.match(this.input, Constants.DOWN, null);
                RULE_REF14 = this.match(this.input, ANTLRv4Parser.RULE_REF, null) as GrammarAST | null;
                this.currentRuleName = (RULE_REF14 !== null ? RULE_REF14.getText() : null); this.currentRuleAST = RULE15;
                // org/antlr/v4/parse/GrammarTreeVisitor.g:546:4: ( ^( RULEMODIFIERS (m= ruleModifier )+ ) )?
                let alt16 = 2;
                const LA16_0 = this.input.LA(1);
                if ((LA16_0 === ANTLRv4Parser.RULEMODIFIERS)) {
                    alt16 = 1;
                }
                switch (alt16) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:546:5: ^( RULEMODIFIERS (m= ruleModifier )+ )
                        {
                            this.match(this.input, ANTLRv4Parser.RULEMODIFIERS, null);
                            this.match(this.input, Constants.DOWN, null);
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:546:21: (m= ruleModifier )+
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
                                        // org/antlr/v4/parse/GrammarTreeVisitor.g:546:22: m= ruleModifier
                                        {
                                            m = this.ruleModifier();

                                            mods.push(m.start as GrammarAST | null);
                                        }
                                        break;
                                    }

                                    default: {
                                        if (cnt15 >= 1) {
                                            break loop15;
                                        }

                                        const eee = new EarlyExitException(15, this.input);
                                        throw eee;
                                    }

                                }
                                cnt15++;
                            }

                            this.match(this.input, Constants.UP, null);

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:547:4: ( ARG_ACTION )?
                let alt17 = 2;
                const LA17_0 = this.input.LA(1);
                if ((LA17_0 === ANTLRv4Parser.ARG_ACTION)) {
                    alt17 = 1;
                }
                switch (alt17) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:547:4: ARG_ACTION
                        {
                            ARG_ACTION16 = this.match(this.input, ANTLRv4Parser.ARG_ACTION, null) as GrammarAST;
                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:548:12: (ret= ruleReturns )?
                let alt18 = 2;
                const LA18_0 = this.input.LA(1);
                if ((LA18_0 === ANTLRv4Parser.RETURNS)) {
                    alt18 = 1;
                }
                switch (alt18) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:548:12: ret= ruleReturns
                        {
                            ret = this.ruleReturns();

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:549:12: (thr= throwsSpec )?
                let alt19 = 2;
                const LA19_0 = this.input.LA(1);
                if ((LA19_0 === ANTLRv4Parser.THROWS)) {
                    alt19 = 1;
                }
                switch (alt19) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:549:12: thr= throwsSpec
                        {
                            thr = this.throwsSpec();

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:550:12: (loc= locals )?
                let alt20 = 2;
                const LA20_0 = this.input.LA(1);
                if ((LA20_0 === ANTLRv4Parser.LOCALS)) {
                    alt20 = 1;
                }
                switch (alt20) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:550:12: loc= locals
                        {
                            loc = this.locals();

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:551:9: (opts= optionsSpec |a= ruleAction )*
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:551:11: opts= optionsSpec
                            {
                                opts = this.optionsSpec();

                            }
                            break;
                        }

                        case 2: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:552:11: a= ruleAction
                            {
                                a = this.ruleAction();

                                actions.push(a.start as GrammarAST | null);
                            }
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
                this.match(this.input, Constants.UP, null);

            }

            this.exitRule((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "exceptionGroup"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:564:1: exceptionGroup : ( exceptionHandler )* ( finallyClause )? ;
    public exceptionGroup(): GrammarTreeVisitor.exceptionGroup_return {
        const retval = new GrammarTreeVisitor.exceptionGroup_return();
        retval.start = this.input.LT(1);

        this.enterExceptionGroup((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:571:5: ( ( exceptionHandler )* ( finallyClause )? )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:571:7: ( exceptionHandler )* ( finallyClause )?
            {
                // org/antlr/v4/parse/GrammarTreeVisitor.g:571:7: ( exceptionHandler )*
                loop22:
                while (true) {
                    let alt22 = 2;
                    const LA22_0 = this.input.LA(1);
                    if ((LA22_0 === ANTLRv4Parser.CATCH)) {
                        alt22 = 1;
                    }

                    switch (alt22) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:571:7: exceptionHandler
                            {
                                this.exceptionHandler();

                            }
                            break;
                        }

                        default: {
                            break loop22;
                        }

                    }
                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:571:25: ( finallyClause )?
                let alt23 = 2;
                const LA23_0 = this.input.LA(1);
                if ((LA23_0 === ANTLRv4Parser.FINALLY)) {
                    alt23 = 1;
                }
                switch (alt23) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:571:25: finallyClause
                        {
                            this.finallyClause();

                        }
                        break;
                    }

                    default:

                }

            }

            this.exitExceptionGroup((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "exceptionHandler"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:574:1: exceptionHandler : ^( CATCH ARG_ACTION ACTION ) ;
    public exceptionHandler(): GrammarTreeVisitor.exceptionHandler_return {
        const retval = new GrammarTreeVisitor.exceptionHandler_return();
        retval.start = this.input.LT(1);

        let ARG_ACTION18 = null;
        let ACTION19 = null;

        this.enterExceptionHandler((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:581:2: ( ^( CATCH ARG_ACTION ACTION ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:581:4: ^( CATCH ARG_ACTION ACTION )
            {
                this.match(this.input, ANTLRv4Parser.CATCH, null);
                this.match(this.input, Constants.DOWN, null);
                ARG_ACTION18 = this.match(this.input, ANTLRv4Parser.ARG_ACTION, null) as GrammarAST;
                ACTION19 = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                this.match(this.input, Constants.UP, null);

                this.ruleCatch(ARG_ACTION18, ACTION19 as ActionAST);
            }

            this.exitExceptionHandler((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "finallyClause"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:584:1: finallyClause : ^( FINALLY ACTION ) ;
    public finallyClause(): GrammarTreeVisitor.finallyClause_return {
        const retval = new GrammarTreeVisitor.finallyClause_return();
        retval.start = this.input.LT(1);

        let ACTION20 = null;

        this.enterFinallyClause((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:591:2: ( ^( FINALLY ACTION ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:591:4: ^( FINALLY ACTION )
            {
                this.match(this.input, ANTLRv4Parser.FINALLY, null);
                this.match(this.input, Constants.DOWN, null);
                ACTION20 = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                this.match(this.input, Constants.UP, null);

                this.finallyAction(ACTION20 as ActionAST);
            }

            this.exitFinallyClause((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "locals"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:594:1: locals : ^( LOCALS ARG_ACTION ) ;
    public locals(): GrammarTreeVisitor.locals_return {
        const retval = new GrammarTreeVisitor.locals_return();
        retval.start = this.input.LT(1);

        this.enterLocals((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:601:2: ( ^( LOCALS ARG_ACTION ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:601:4: ^( LOCALS ARG_ACTION )
            {
                this.match(this.input, ANTLRv4Parser.LOCALS, null);
                this.match(this.input, Constants.DOWN, null);
                this.match(this.input, ANTLRv4Parser.ARG_ACTION, null);
                this.match(this.input, Constants.UP, null);

            }

            this.exitLocals((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "ruleReturns"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:604:1: ruleReturns : ^( RETURNS ARG_ACTION ) ;
    public ruleReturns(): GrammarTreeVisitor.ruleReturns_return {
        const retval = new GrammarTreeVisitor.ruleReturns_return();
        retval.start = this.input.LT(1);

        this.enterRuleReturns((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:611:2: ( ^( RETURNS ARG_ACTION ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:611:4: ^( RETURNS ARG_ACTION )
            {
                this.match(this.input, ANTLRv4Parser.RETURNS, null);
                this.match(this.input, Constants.DOWN, null);
                this.match(this.input, ANTLRv4Parser.ARG_ACTION, null);
                this.match(this.input, Constants.UP, null);

            }

            this.exitRuleReturns((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "throwsSpec"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:614:1: throwsSpec : ^( THROWS ( ID )+ ) ;
    public throwsSpec(): GrammarTreeVisitor.throwsSpec_return {
        const retval = new GrammarTreeVisitor.throwsSpec_return();
        retval.start = this.input.LT(1);

        this.enterThrowsSpec((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:621:5: ( ^( THROWS ( ID )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:621:7: ^( THROWS ( ID )+ )
            {
                this.match(this.input, ANTLRv4Parser.THROWS, null);
                this.match(this.input, Constants.DOWN, null);
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:621:16: ID
                            {
                                this.match(this.input, ANTLRv4Parser.ID, null);
                            }
                            break;
                        }

                        default: {
                            if (cnt24 >= 1) {
                                break loop24;
                            }

                            const eee = new EarlyExitException(24, this.input);
                            throw eee;
                        }

                    }
                    cnt24++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitThrowsSpec((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "ruleAction"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:624:1: ruleAction : ^( AT ID ACTION ) ;
    public ruleAction(): GrammarTreeVisitor.ruleAction_return {
        const retval = new GrammarTreeVisitor.ruleAction_return();
        retval.start = this.input.LT(1);

        this.enterRuleAction((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:631:2: ( ^( AT ID ACTION ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:631:4: ^( AT ID ACTION )
            {
                this.match(this.input, ANTLRv4Parser.AT, null);
                this.match(this.input, Constants.DOWN, null);
                this.match(this.input, ANTLRv4Parser.ID, null);
                this.match(this.input, ANTLRv4Parser.ACTION, null);
                this.match(this.input, Constants.UP, null);

            }

            this.exitRuleAction((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "ruleModifier"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:634:1: ruleModifier : ( PUBLIC | PRIVATE | PROTECTED | FRAGMENT );
    public ruleModifier(): GrammarTreeVisitor.ruleModifier_return {
        const retval = new GrammarTreeVisitor.ruleModifier_return();
        retval.start = this.input.LT(1);

        this.enterRuleModifier((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:641:5: ( PUBLIC | PRIVATE | PROTECTED | FRAGMENT )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:
            {
                if (this.input.LA(1) === ANTLRv4Parser.FRAGMENT || (this.input.LA(1) >= ANTLRv4Parser.PRIVATE && this.input.LA(1) <= ANTLRv4Parser.PUBLIC)) {
                    this.input.consume();
                    this.state.errorRecovery = false;
                } else {
                    const mse = new MismatchedSetException(null, this.input);
                    throw mse;
                }
            }

            this.exitRuleModifier((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerRuleBlock"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:647:1: lexerRuleBlock : ^( BLOCK ( lexerOuterAlternative )+ ) ;
    public lexerRuleBlock(): GrammarTreeVisitor.lexerRuleBlock_return {
        const retval = new GrammarTreeVisitor.lexerRuleBlock_return();
        retval.start = this.input.LT(1);

        this.enterLexerRuleBlock((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:654:5: ( ^( BLOCK ( lexerOuterAlternative )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:654:7: ^( BLOCK ( lexerOuterAlternative )+ )
            {
                this.match(this.input, ANTLRv4Parser.BLOCK, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:655:7: ( lexerOuterAlternative )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:655:9: lexerOuterAlternative
                            {

                                this.currentOuterAltRoot = this.input.LT(1) as GrammarAST;
                                this.currentOuterAltNumber++;

                                this.lexerOuterAlternative();

                            }
                            break;
                        }

                        default: {
                            if (cnt25 >= 1) {
                                break loop25;
                            }

                            const eee = new EarlyExitException(25, this.input);
                            throw eee;
                        }

                    }
                    cnt25++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitLexerRuleBlock((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "ruleBlock"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:664:1: ruleBlock : ^( BLOCK ( outerAlternative )+ ) ;
    public ruleBlock(): GrammarTreeVisitor.ruleBlock_return {
        const retval = new GrammarTreeVisitor.ruleBlock_return();
        retval.start = this.input.LT(1);

        this.enterRuleBlock((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:671:5: ( ^( BLOCK ( outerAlternative )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:671:7: ^( BLOCK ( outerAlternative )+ )
            {
                this.match(this.input, ANTLRv4Parser.BLOCK, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:672:7: ( outerAlternative )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:672:9: outerAlternative
                            {

                                this.currentOuterAltRoot = this.input.LT(1) as GrammarAST;
                                this.currentOuterAltNumber++;

                                this.outerAlternative();

                            }
                            break;
                        }

                        default: {
                            if (cnt26 >= 1) {
                                break loop26;
                            }

                            const eee = new EarlyExitException(26, this.input);
                            throw eee;
                        }

                    }
                    cnt26++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitRuleBlock((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerOuterAlternative"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:681:1: lexerOuterAlternative : lexerAlternative ;
    public lexerOuterAlternative(): GrammarTreeVisitor.lexerOuterAlternative_return {
        const retval = new GrammarTreeVisitor.lexerOuterAlternative_return();
        retval.start = this.input.LT(1);

        this.enterLexerOuterAlternative((retval.start as GrammarAST) as AltAST);
        this.discoverOuterAlt((retval.start as GrammarAST) as AltAST);

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:690:2: ( lexerAlternative )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:690:4: lexerAlternative
            {
                this.lexerAlternative();

            }

            this.finishOuterAlt((retval.start as GrammarAST) as AltAST);
            this.exitLexerOuterAlternative((retval.start as GrammarAST) as AltAST);

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "outerAlternative"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:694:1: outerAlternative : alternative ;
    public outerAlternative(): GrammarTreeVisitor.outerAlternative_return {
        const retval = new GrammarTreeVisitor.outerAlternative_return();
        retval.start = this.input.LT(1);

        this.enterOuterAlternative((retval.start as GrammarAST) as AltAST);
        this.discoverOuterAlt((retval.start as GrammarAST) as AltAST);

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:703:2: ( alternative )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:703:4: alternative
            {
                this.alternative();

            }

            this.finishOuterAlt((retval.start as GrammarAST) as AltAST);
            this.exitOuterAlternative((retval.start as GrammarAST) as AltAST);

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerAlternative"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:706:1: lexerAlternative : ( ^( LEXER_ALT_ACTION lexerElements ( lexerCommand )+ ) | lexerElements );
    public lexerAlternative(): GrammarTreeVisitor.lexerAlternative_return {
        const retval = new GrammarTreeVisitor.lexerAlternative_return();
        retval.start = this.input.LT(1);

        this.enterLexerAlternative((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:713:2: ( ^( LEXER_ALT_ACTION lexerElements ( lexerCommand )+ ) | lexerElements )
            let alt28 = 2;
            const LA28_0 = this.input.LA(1);
            if ((LA28_0 === ANTLRv4Parser.LEXER_ALT_ACTION)) {
                alt28 = 1;
            } else {
                if ((LA28_0 === ANTLRv4Parser.ALT)) {
                    alt28 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 28, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt28) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:713:4: ^( LEXER_ALT_ACTION lexerElements ( lexerCommand )+ )
                    {
                        this.match(this.input, ANTLRv4Parser.LEXER_ALT_ACTION, null);
                        this.match(this.input, Constants.DOWN, null);
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
                                    // org/antlr/v4/parse/GrammarTreeVisitor.g:713:37: lexerCommand
                                    {
                                        this.lexerCommand();

                                    }
                                    break;
                                }

                                default: {
                                    if (cnt27 >= 1) {
                                        break loop27;
                                    }

                                    const eee = new EarlyExitException(27, this.input);
                                    throw eee;
                                }

                            }
                            cnt27++;
                        }

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:714:9: lexerElements
                    {
                        this.lexerElements();

                    }
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
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerElements"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:717:1: lexerElements : ^( ALT ( lexerElement )+ ) ;
    public lexerElements(): GrammarTreeVisitor.lexerElements_return {
        const retval = new GrammarTreeVisitor.lexerElements_return();
        retval.start = this.input.LT(1);

        this.enterLexerElements((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:724:5: ( ^( ALT ( lexerElement )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:724:7: ^( ALT ( lexerElement )+ )
            {
                this.match(this.input, ANTLRv4Parser.ALT, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:724:13: ( lexerElement )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:724:13: lexerElement
                            {
                                this.lexerElement();

                            }
                            break;
                        }

                        default: {
                            if (cnt29 >= 1) {
                                break loop29;
                            }

                            const eee = new EarlyExitException(29, this.input);
                            throw eee;
                        }

                    }
                    cnt29++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitLexerElements((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerElement"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:727:1: lexerElement : ( lexerAtom | lexerSubrule | ACTION | SEMPRED | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) | EPSILON );
    public lexerElement(): GrammarTreeVisitor.lexerElement_return {
        const retval = new GrammarTreeVisitor.lexerElement_return();
        retval.start = this.input.LT(1);

        let ACTION21 = null;
        let SEMPRED22 = null;
        let ACTION23 = null;
        let SEMPRED24 = null;

        this.enterLexerElement((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:734:2: ( lexerAtom | lexerSubrule | ACTION | SEMPRED | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) | EPSILON )
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
                    {
                        alt30 = 1;
                    }
                    break;
                }

                case ANTLRv4Parser.BLOCK:
                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    {
                        alt30 = 2;
                    }
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
                                    const nvae =
                                        new NoViableAltException("", 30, 3, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.SEMPRED: {
                    {
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
                                    const nvae =
                                        new NoViableAltException("", 30, 4, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.EPSILON: {
                    {
                        alt30 = 7;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException("", 30, 0, this.input);
                    throw nvae;
                }

            }

            switch (alt30) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:734:4: lexerAtom
                    {
                        this.lexerAtom();

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:735:4: lexerSubrule
                    {
                        this.lexerSubrule();

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:736:6: ACTION
                    {
                        ACTION21 = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                        this.actionInAlt(ACTION21 as ActionAST);
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:737:6: SEMPRED
                    {
                        SEMPRED22 = this.match(this.input, ANTLRv4Parser.SEMPRED, null) as GrammarAST;
                        this.sempredInAlt(SEMPRED22 as PredAST);
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:738:6: ^( ACTION elementOptions )
                    {
                        ACTION23 = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.actionInAlt(ACTION23 as ActionAST);
                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:739:6: ^( SEMPRED elementOptions )
                    {
                        SEMPRED24 = this.match(this.input, ANTLRv4Parser.SEMPRED, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.sempredInAlt(SEMPRED24 as PredAST);
                    }
                    break;
                }

                case 7: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:740:4: EPSILON
                    {
                        this.match(this.input, ANTLRv4Parser.EPSILON, null);
                    }
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
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerBlock"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:743:1: lexerBlock : ^( BLOCK ( optionsSpec )? ( lexerAlternative )+ ) ;
    public lexerBlock(): GrammarTreeVisitor.lexerBlock_return {
        const retval = new GrammarTreeVisitor.lexerBlock_return();
        retval.start = this.input.LT(1);

        this.enterLexerBlock((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:750:3: ( ^( BLOCK ( optionsSpec )? ( lexerAlternative )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:750:5: ^( BLOCK ( optionsSpec )? ( lexerAlternative )+ )
            {
                this.match(this.input, ANTLRv4Parser.BLOCK, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:750:13: ( optionsSpec )?
                let alt31 = 2;
                const LA31_0 = this.input.LA(1);
                if ((LA31_0 === ANTLRv4Parser.OPTIONS)) {
                    alt31 = 1;
                }
                switch (alt31) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:750:13: optionsSpec
                        {
                            this.optionsSpec();

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:750:26: ( lexerAlternative )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:750:26: lexerAlternative
                            {
                                this.lexerAlternative();

                            }
                            break;
                        }

                        default: {
                            if (cnt32 >= 1) {
                                break loop32;
                            }

                            const eee = new EarlyExitException(32, this.input);
                            throw eee;
                        }

                    }
                    cnt32++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitLexerBlock((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerAtom"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:753:1: lexerAtom : ( terminal | ^( NOT blockSet ) | blockSet | ^( WILDCARD elementOptions ) | WILDCARD | LEXER_CHAR_SET | range | ruleref );
    public lexerAtom(): GrammarTreeVisitor.lexerAtom_return {
        const retval = new GrammarTreeVisitor.lexerAtom_return();
        retval.start = this.input.LT(1);

        this.enterLexerAtom((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:760:5: ( terminal | ^( NOT blockSet ) | blockSet | ^( WILDCARD elementOptions ) | WILDCARD | LEXER_CHAR_SET | range | ruleref )
            let alt33 = 8;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF: {
                    {
                        alt33 = 1;
                    }
                    break;
                }

                case ANTLRv4Parser.NOT: {
                    {
                        alt33 = 2;
                    }
                    break;
                }

                case ANTLRv4Parser.SET: {
                    {
                        alt33 = 3;
                    }
                    break;
                }

                case ANTLRv4Parser.WILDCARD: {
                    {
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
                                    const nvae =
                                        new NoViableAltException("", 33, 4, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.LEXER_CHAR_SET: {
                    {
                        alt33 = 6;
                    }
                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    {
                        alt33 = 7;
                    }
                    break;
                }

                case ANTLRv4Parser.RULE_REF: {
                    {
                        alt33 = 8;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException("", 33, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt33) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:760:9: terminal
                    {
                        this.terminal();

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:761:9: ^( NOT blockSet )
                    {
                        this.match(this.input, ANTLRv4Parser.NOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.blockSet();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:762:9: blockSet
                    {
                        this.blockSet();

                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:763:9: ^( WILDCARD elementOptions )
                    {
                        this.match(this.input, ANTLRv4Parser.WILDCARD, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:764:9: WILDCARD
                    {
                        this.match(this.input, ANTLRv4Parser.WILDCARD, null);
                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:765:7: LEXER_CHAR_SET
                    {
                        this.match(this.input, ANTLRv4Parser.LEXER_CHAR_SET, null);
                    }
                    break;
                }

                case 7: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:766:9: range
                    {
                        this.range();

                    }
                    break;
                }

                case 8: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:767:9: ruleref
                    {
                        this.ruleref();

                    }
                    break;
                }

                default:

            }

            this.exitLexerAtom((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "actionElement"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:770:1: actionElement : ( ACTION | ^( ACTION elementOptions ) | SEMPRED | ^( SEMPRED elementOptions ) );
    public actionElement(): GrammarTreeVisitor.actionElement_return {
        const retval = new GrammarTreeVisitor.actionElement_return();
        retval.start = this.input.LT(1);

        this.enterActionElement((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:777:2: ( ACTION | ^( ACTION elementOptions ) | SEMPRED | ^( SEMPRED elementOptions ) )
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
                            const nvae =
                                new NoViableAltException("", 34, 1, this.input);
                            throw nvae;
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
                                const nvae =
                                    new NoViableAltException("", 34, 2, this.input);
                                throw nvae;
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException("", 34, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt34) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:777:4: ACTION
                    {
                        this.match(this.input, ANTLRv4Parser.ACTION, null);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:778:6: ^( ACTION elementOptions )
                    {
                        this.match(this.input, ANTLRv4Parser.ACTION, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:779:6: SEMPRED
                    {
                        this.match(this.input, ANTLRv4Parser.SEMPRED, null);
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:780:6: ^( SEMPRED elementOptions )
                    {
                        this.match(this.input, ANTLRv4Parser.SEMPRED, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                default:

            }

            this.exitActionElement((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "alternative"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:783:1: alternative : ( ^( ALT ( elementOptions )? ( element )+ ) | ^( ALT ( elementOptions )? EPSILON ) );
    public alternative(): GrammarTreeVisitor.alternative_return {
        const retval = new GrammarTreeVisitor.alternative_return();
        retval.start = this.input.LT(1);

        this.enterAlternative((retval.start as GrammarAST) as AltAST);
        this.discoverAlt((retval.start as GrammarAST) as AltAST);

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:792:2: ( ^( ALT ( elementOptions )? ( element )+ ) | ^( ALT ( elementOptions )? EPSILON ) )
            // eslint-disable-next-line @typescript-eslint/no-inferrable-types
            let alt38: number = 1;
            if (retval.start?.getChild(0)?.getType() === ANTLRv4Parser.EPSILON) { // Empty alternative.
                alt38 = 2;
            }

            switch (alt38) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:792:4: ^( ALT ( elementOptions )? ( element )+ )
                    {
                        this.match(this.input, ANTLRv4Parser.ALT, null);
                        this.match(this.input, Constants.DOWN, null);
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:792:10: ( elementOptions )?
                        let alt35 = 2;
                        const LA35_0 = this.input.LA(1);
                        if ((LA35_0 === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                            alt35 = 1;
                        }
                        switch (alt35) {
                            case 1: {
                                // org/antlr/v4/parse/GrammarTreeVisitor.g:792:10: elementOptions
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

                        // org/antlr/v4/parse/GrammarTreeVisitor.g:792:26: ( element )+
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
                                    // org/antlr/v4/parse/GrammarTreeVisitor.g:792:26: element
                                    {
                                        this.element();

                                    }
                                    break;
                                }

                                default: {
                                    if (cnt36 >= 1) {
                                        break loop36;
                                    }

                                    const eee = new EarlyExitException(36, this.input);
                                    throw eee;
                                }

                            }
                            cnt36++;
                        }

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:793:4: ^( ALT ( elementOptions )? EPSILON )
                    {
                        this.match(this.input, ANTLRv4Parser.ALT, null);
                        this.match(this.input, Constants.DOWN, null);
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:793:10: ( elementOptions )?
                        let alt37 = 2;
                        const LA37_0 = this.input.LA(1);
                        if ((LA37_0 === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                            alt37 = 1;
                        }
                        switch (alt37) {
                            case 1: {
                                // org/antlr/v4/parse/GrammarTreeVisitor.g:793:10: elementOptions
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

                        this.match(this.input, ANTLRv4Parser.EPSILON, null);
                        this.match(this.input, Constants.UP, null);

                    }
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
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerCommandExpr"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:809:1: lexerCommandExpr : ( ID | INT );
    public lexerCommandExpr(): GrammarTreeVisitor.lexerCommandExpr_return {
        const retval = new GrammarTreeVisitor.lexerCommandExpr_return();
        retval.start = this.input.LT(1);

        this.enterLexerCommandExpr((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:816:2: ( ID | INT )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:
            {
                if (this.input.LA(1) === ANTLRv4Parser.ID || this.input.LA(1) === ANTLRv4Parser.INT) {
                    this.input.consume();
                    this.state.errorRecovery = false;
                } else {
                    const mse = new MismatchedSetException(null, this.input);
                    throw mse;
                }
            }

            this.exitLexerCommandExpr((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return retval;
    }

    // $ANTLR start "element"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:820:1: element : ( labeledElement | atom | subrule | ACTION | SEMPRED | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) | range | ^( NOT blockSet ) | ^( NOT block ) );
    public element(): GrammarTreeVisitor.element_return {
        const retval = new GrammarTreeVisitor.element_return();
        retval.start = this.input.LT(1);

        let ACTION28 = null;
        let SEMPRED29 = null;
        let ACTION30 = null;
        let SEMPRED31 = null;

        this.enterElement((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:827:2: ( labeledElement | atom | subrule | ACTION | SEMPRED | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) | range | ^( NOT blockSet ) | ^( NOT block ) )
            let alt40 = 10;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.ASSIGN:
                case ANTLRv4Parser.PLUS_ASSIGN: {
                    {
                        alt40 = 1;
                    }
                    break;
                }

                case ANTLRv4Parser.DOT:
                case ANTLRv4Parser.RULE_REF:
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF:
                case ANTLRv4Parser.SET:
                case ANTLRv4Parser.WILDCARD: {
                    {
                        alt40 = 2;
                    }
                    break;
                }

                case ANTLRv4Parser.BLOCK:
                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    {
                        alt40 = 3;
                    }
                    break;
                }

                case ANTLRv4Parser.ACTION: {
                    {
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
                                    const nvae =
                                        new NoViableAltException("", 40, 4, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.SEMPRED: {
                    {
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
                                    const nvae =
                                        new NoViableAltException("", 40, 5, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    {
                        alt40 = 8;
                    }
                    break;
                }

                case ANTLRv4Parser.NOT: {
                    {
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
                                        const nvae =
                                            new NoViableAltException("", 40, 12, this.input);
                                        throw nvae;
                                    } finally {
                                        this.input.release(nvaeMark);
                                    }
                                }
                            }

                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();
                                const nvae =
                                    new NoViableAltException("", 40, 7, this.input);
                                throw nvae;
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }

                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException("", 40, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt40) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:827:4: labeledElement
                    {
                        this.labeledElement();

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:828:4: atom
                    {
                        this.atom();

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:829:4: subrule
                    {
                        this.subrule();

                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:830:6: ACTION
                    {
                        ACTION28 = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                        this.actionInAlt(ACTION28 as ActionAST);
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:831:6: SEMPRED
                    {
                        SEMPRED29 = this.match(this.input, ANTLRv4Parser.SEMPRED, null) as GrammarAST;
                        this.sempredInAlt(SEMPRED29 as PredAST);
                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:832:6: ^( ACTION elementOptions )
                    {
                        ACTION30 = this.match(this.input, ANTLRv4Parser.ACTION, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.actionInAlt(ACTION30 as ActionAST);
                    }
                    break;
                }

                case 7: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:833:6: ^( SEMPRED elementOptions )
                    {
                        SEMPRED31 = this.match(this.input, ANTLRv4Parser.SEMPRED, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.sempredInAlt(SEMPRED31 as PredAST);
                    }
                    break;
                }

                case 8: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:834:4: range
                    {
                        this.range();

                    }
                    break;
                }

                case 9: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:835:4: ^( NOT blockSet )
                    {
                        this.match(this.input, ANTLRv4Parser.NOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.blockSet();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 10: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:836:4: ^( NOT block )
                    {
                        this.match(this.input, ANTLRv4Parser.NOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.block();

                        this.match(this.input, Constants.UP, null);

                    }
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
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "astOperand"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:839:1: astOperand : ( atom | ^( NOT blockSet ) | ^( NOT block ) );
    public astOperand(): GrammarTreeVisitor.astOperand_return {
        const retval = new GrammarTreeVisitor.astOperand_return();
        retval.start = this.input.LT(1);

        this.enterAstOperand((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:846:2: ( atom | ^( NOT blockSet ) | ^( NOT block ) )
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
                                    const nvae =
                                        new NoViableAltException("", 41, 3, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    } else {
                        const nvaeMark = this.input.mark();
                        try {
                            this.input.consume();
                            const nvae =
                                new NoViableAltException("", 41, 2, this.input);
                            throw nvae;
                        } finally {
                            this.input.release(nvaeMark);
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException("", 41, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt41) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:846:4: atom
                    {
                        this.atom();

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:847:4: ^( NOT blockSet )
                    {
                        this.match(this.input, ANTLRv4Parser.NOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.blockSet();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:848:4: ^( NOT block )
                    {
                        this.match(this.input, ANTLRv4Parser.NOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.block();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                default:

            }

            this.exitAstOperand((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "labeledElement"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:851:1: labeledElement : ^( ( ASSIGN | PLUS_ASSIGN ) ID element ) ;
    public labeledElement(): GrammarTreeVisitor.labeledElement_return {
        const retval = new GrammarTreeVisitor.labeledElement_return();
        retval.start = this.input.LT(1);

        let ID32 = null;

        this.enterLabeledElement((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:858:2: ( ^( ( ASSIGN | PLUS_ASSIGN ) ID element ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:858:4: ^( ( ASSIGN | PLUS_ASSIGN ) ID element )
            {
                if (this.input.LA(1) === ANTLRv4Parser.ASSIGN || this.input.LA(1) === ANTLRv4Parser.PLUS_ASSIGN) {
                    this.input.consume();
                    this.state.errorRecovery = false;
                } else {
                    const mse = new MismatchedSetException(null, this.input);
                    throw mse;
                }
                this.match(this.input, Constants.DOWN, null);
                ID32 = this.match(this.input, ANTLRv4Parser.ID, null) as GrammarAST;

                const element33 = this.element();

                this.match(this.input, Constants.UP, null);

                this.label((retval.start as GrammarAST | null), ID32, element33.start as GrammarAST | null);
            }

            this.exitLabeledElement((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "subrule"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:861:1: subrule : ( ^( blockSuffix block ) | block );
    public subrule(): GrammarTreeVisitor.subrule_return {
        const retval = new GrammarTreeVisitor.subrule_return();
        retval.start = this.input.LT(1);

        this.enterSubrule((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:868:2: ( ^( blockSuffix block ) | block )
            let alt42 = 2;
            const LA42_0 = this.input.LA(1);
            if ((LA42_0 === ANTLRv4Parser.CLOSURE || (LA42_0 >= ANTLRv4Parser.OPTIONAL && LA42_0 <= ANTLRv4Parser.POSITIVE_CLOSURE))) {
                alt42 = 1;
            } else {
                if ((LA42_0 === ANTLRv4Parser.BLOCK)) {
                    alt42 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 42, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt42) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:868:4: ^( blockSuffix block )
                    {
                        this.blockSuffix();

                        this.match(this.input, Constants.DOWN, null);
                        this.block();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:869:5: block
                    {
                        this.block();

                    }
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
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "lexerSubrule"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:872:1: lexerSubrule : ( ^( blockSuffix lexerBlock ) | lexerBlock );
    public lexerSubrule(): GrammarTreeVisitor.lexerSubrule_return {
        const retval = new GrammarTreeVisitor.lexerSubrule_return();
        retval.start = this.input.LT(1);

        this.enterLexerSubrule((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:879:2: ( ^( blockSuffix lexerBlock ) | lexerBlock )
            let alt43 = 2;
            const LA43_0 = this.input.LA(1);
            if ((LA43_0 === ANTLRv4Parser.CLOSURE || (LA43_0 >= ANTLRv4Parser.OPTIONAL && LA43_0 <= ANTLRv4Parser.POSITIVE_CLOSURE))) {
                alt43 = 1;
            } else {
                if ((LA43_0 === ANTLRv4Parser.BLOCK)) {
                    alt43 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 43, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt43) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:879:4: ^( blockSuffix lexerBlock )
                    {
                        this.blockSuffix();

                        this.match(this.input, Constants.DOWN, null);
                        this.lexerBlock();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:880:5: lexerBlock
                    {
                        this.lexerBlock();

                    }
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
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "blockSuffix"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:883:1: blockSuffix : ebnfSuffix ;
    public blockSuffix(): GrammarTreeVisitor.blockSuffix_return {
        const retval = new GrammarTreeVisitor.blockSuffix_return();
        retval.start = this.input.LT(1);

        this.enterBlockSuffix((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:890:5: ( ebnfSuffix )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:890:7: ebnfSuffix
            {
                this.ebnfSuffix();

            }

            this.exitBlockSuffix((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "ebnfSuffix"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:893:1: ebnfSuffix : ( OPTIONAL | CLOSURE | POSITIVE_CLOSURE );
    public ebnfSuffix(): GrammarTreeVisitor.ebnfSuffix_return {
        const retval = new GrammarTreeVisitor.ebnfSuffix_return();
        retval.start = this.input.LT(1);

        this.enterEbnfSuffix((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:900:2: ( OPTIONAL | CLOSURE | POSITIVE_CLOSURE )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:
            {
                if (this.input.LA(1) === ANTLRv4Parser.CLOSURE || (this.input.LA(1) >= ANTLRv4Parser.OPTIONAL && this.input.LA(1) <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                    this.input.consume();
                    this.state.errorRecovery = false;
                } else {
                    const mse = new MismatchedSetException(null, this.input);
                    throw mse;
                }
            }

            this.exitEbnfSuffix((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "atom"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:905:1: atom : ( ^( DOT ID terminal ) | ^( DOT ID ruleref ) | ^( WILDCARD elementOptions ) | WILDCARD | terminal | blockSet | ruleref );
    public atom(): GrammarTreeVisitor.atom_return {
        const retval = new GrammarTreeVisitor.atom_return();
        retval.start = this.input.LT(1);

        let WILDCARD34 = null;
        let WILDCARD35 = null;

        this.enterAtom((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:912:2: ( ^( DOT ID terminal ) | ^( DOT ID ruleref ) | ^( WILDCARD elementOptions ) | WILDCARD | terminal | blockSet | ruleref )
            let alt44 = 7;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.DOT: {
                    {
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
                                            const nvae =
                                                new NoViableAltException("", 44, 9, this.input);
                                            throw nvae;
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
                                    const nvae =
                                        new NoViableAltException("", 44, 6, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }

                        } else {
                            const nvaeMark = this.input.mark();
                            try {
                                this.input.consume();
                                const nvae =
                                    new NoViableAltException("", 44, 1, this.input);
                                throw nvae;
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.WILDCARD: {
                    {
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
                                    const nvae =
                                        new NoViableAltException("", 44, 2, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF: {
                    {
                        alt44 = 5;
                    }
                    break;
                }

                case ANTLRv4Parser.SET: {
                    {
                        alt44 = 6;
                    }
                    break;
                }

                case ANTLRv4Parser.RULE_REF: {
                    {
                        alt44 = 7;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException("", 44, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt44) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:912:4: ^( DOT ID terminal )
                    {
                        this.match(this.input, ANTLRv4Parser.DOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Parser.ID, null);
                        this.terminal();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:913:4: ^( DOT ID ruleref )
                    {
                        this.match(this.input, ANTLRv4Parser.DOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Parser.ID, null);
                        this.ruleref();

                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:914:7: ^( WILDCARD elementOptions )
                    {
                        WILDCARD34 = this.match(this.input, ANTLRv4Parser.WILDCARD, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.wildcardRef(WILDCARD34);
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:915:7: WILDCARD
                    {
                        WILDCARD35 = this.match(this.input, ANTLRv4Parser.WILDCARD, null) as GrammarAST;
                        this.wildcardRef(WILDCARD35);
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:916:9: terminal
                    {
                        this.terminal();

                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:917:7: blockSet
                    {
                        this.blockSet();

                    }
                    break;
                }

                case 7: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:918:9: ruleref
                    {
                        this.ruleref();

                    }
                    break;
                }

                default:

            }

            this.exitAtom((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "blockSet"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:921:1: blockSet : ^( SET ( setElement )+ ) ;
    public blockSet(): GrammarTreeVisitor.blockSet_return {
        const retval = new GrammarTreeVisitor.blockSet_return();
        retval.start = this.input.LT(1);

        this.enterBlockSet((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:928:2: ( ^( SET ( setElement )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:928:4: ^( SET ( setElement )+ )
            {
                this.match(this.input, ANTLRv4Parser.SET, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:928:10: ( setElement )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:928:10: setElement
                            {
                                this.setElement();

                            }
                            break;
                        }

                        default: {
                            if (cnt45 >= 1) {
                                break loop45;
                            }

                            const eee = new EarlyExitException(45, this.input);
                            throw eee;
                        }

                    }
                    cnt45++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitBlockSet((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "setElement"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:931:1: setElement : ( ^( STRING_LITERAL elementOptions ) | ^( TOKEN_REF elementOptions ) | STRING_LITERAL | TOKEN_REF | ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) | LEXER_CHAR_SET );
    public setElement(): GrammarTreeVisitor.setElement_return {
        const retval = new GrammarTreeVisitor.setElement_return();
        retval.start = this.input.LT(1);

        let a = null;
        let b = null;
        let STRING_LITERAL36 = null;
        let TOKEN_REF37 = null;
        let STRING_LITERAL38 = null;
        let TOKEN_REF39 = null;

        this.enterSetElement((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:938:2: ( ^( STRING_LITERAL elementOptions ) | ^( TOKEN_REF elementOptions ) | STRING_LITERAL | TOKEN_REF | ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) | LEXER_CHAR_SET )
            let alt46 = 6;
            switch (this.input.LA(1)) {
                case ANTLRv4Parser.STRING_LITERAL: {
                    {
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
                                    const nvae =
                                        new NoViableAltException("", 46, 1, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.TOKEN_REF: {
                    {
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
                                    const nvae =
                                        new NoViableAltException("", 46, 2, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    {
                        alt46 = 5;
                    }
                    break;
                }

                case ANTLRv4Parser.LEXER_CHAR_SET: {
                    {
                        alt46 = 6;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException("", 46, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt46) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:938:4: ^( STRING_LITERAL elementOptions )
                    {
                        STRING_LITERAL36 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.stringRef(STRING_LITERAL36 as TerminalAST);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:939:4: ^( TOKEN_REF elementOptions )
                    {
                        TOKEN_REF37 = this.match(this.input, ANTLRv4Parser.TOKEN_REF, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.tokenRef(TOKEN_REF37 as TerminalAST);
                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:940:4: STRING_LITERAL
                    {
                        STRING_LITERAL38 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null) as GrammarAST;
                        this.stringRef(STRING_LITERAL38 as TerminalAST);
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:941:4: TOKEN_REF
                    {
                        TOKEN_REF39 = this.match(this.input, ANTLRv4Parser.TOKEN_REF, null) as GrammarAST;
                        this.tokenRef(TOKEN_REF39 as TerminalAST);
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:942:4: ^( RANGE a= STRING_LITERAL b= STRING_LITERAL )
                    {
                        this.match(this.input, ANTLRv4Parser.RANGE, null);
                        this.match(this.input, Constants.DOWN, null);
                        a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null) as GrammarAST;
                        b = this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null) as GrammarAST;
                        this.match(this.input, Constants.UP, null);

                        this.stringRef(a as TerminalAST);
                        this.stringRef(b as TerminalAST);

                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:947:17: LEXER_CHAR_SET
                    {
                        this.match(this.input, ANTLRv4Parser.LEXER_CHAR_SET, null);
                    }
                    break;
                }

                default:

            }

            this.exitSetElement((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "block"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:950:1: block : ^( BLOCK ( optionsSpec )? ( ruleAction )* ( ACTION )? ( alternative )+ ) ;
    public block(): GrammarTreeVisitor.block_return {
        const retval = new GrammarTreeVisitor.block_return();
        retval.start = this.input.LT(1);

        this.enterBlock((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:957:5: ( ^( BLOCK ( optionsSpec )? ( ruleAction )* ( ACTION )? ( alternative )+ ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:957:7: ^( BLOCK ( optionsSpec )? ( ruleAction )* ( ACTION )? ( alternative )+ )
            {
                this.match(this.input, ANTLRv4Parser.BLOCK, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/GrammarTreeVisitor.g:957:15: ( optionsSpec )?
                let alt47 = 2;
                const LA47_0 = this.input.LA(1);
                if ((LA47_0 === ANTLRv4Parser.OPTIONS)) {
                    alt47 = 1;
                }
                switch (alt47) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:957:15: optionsSpec
                        {
                            this.optionsSpec();

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:957:28: ( ruleAction )*
                loop48:
                while (true) {
                    let alt48 = 2;
                    const LA48_0 = this.input.LA(1);
                    if ((LA48_0 === ANTLRv4Parser.AT)) {
                        alt48 = 1;
                    }

                    switch (alt48) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:957:28: ruleAction
                            {
                                this.ruleAction();

                            }
                            break;
                        }

                        default: {
                            break loop48;
                        }

                    }
                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:957:40: ( ACTION )?
                let alt49 = 2;
                const LA49_0 = this.input.LA(1);
                if ((LA49_0 === ANTLRv4Parser.ACTION)) {
                    alt49 = 1;
                }
                switch (alt49) {
                    case 1: {
                        // org/antlr/v4/parse/GrammarTreeVisitor.g:957:40: ACTION
                        {
                            this.match(this.input, ANTLRv4Parser.ACTION, null);
                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/GrammarTreeVisitor.g:957:48: ( alternative )+
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
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:957:48: alternative
                            {
                                this.alternative();

                            }
                            break;
                        }

                        default: {
                            if (cnt50 >= 1) {
                                break loop50;
                            }

                            const eee = new EarlyExitException(50, this.input);
                            throw eee;
                        }

                    }
                    cnt50++;
                }

                this.match(this.input, Constants.UP, null);

            }

            this.exitBlock((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "ruleref"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:960:1: ruleref : ^( RULE_REF (arg= ARG_ACTION )? ( elementOptions )? ) ;
    public ruleref(): GrammarTreeVisitor.ruleref_return {
        const retval = new GrammarTreeVisitor.ruleRef_return();
        retval.start = this.input.LT(1);

        let arg = null;
        let RULE_REF40 = null;

        this.enterRuleref((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:967:5: ( ^( RULE_REF (arg= ARG_ACTION )? ( elementOptions )? ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:967:7: ^( RULE_REF (arg= ARG_ACTION )? ( elementOptions )? )
            {
                RULE_REF40 = this.match(this.input, ANTLRv4Parser.RULE_REF, null) as GrammarAST;
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN, null);
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:967:21: (arg= ARG_ACTION )?
                    let alt51 = 2;
                    const LA51_0 = this.input.LA(1);
                    if ((LA51_0 === ANTLRv4Parser.ARG_ACTION)) {
                        alt51 = 1;
                    }
                    switch (alt51) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:967:21: arg= ARG_ACTION
                            {
                                arg = this.match(this.input, ANTLRv4Parser.ARG_ACTION, null) as GrammarAST;
                            }
                            break;
                        }

                        default:

                    }

                    // org/antlr/v4/parse/GrammarTreeVisitor.g:967:34: ( elementOptions )?
                    let alt52 = 2;
                    const LA52_0 = this.input.LA(1);
                    if ((LA52_0 === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                        alt52 = 1;
                    }
                    switch (alt52) {
                        case 1: {
                            // org/antlr/v4/parse/GrammarTreeVisitor.g:967:34: elementOptions
                            {
                                this.elementOptions();

                            }
                            break;
                        }

                        default:

                    }

                    this.match(this.input, Constants.UP, null);
                }

                this.ruleRef(RULE_REF40, arg as ActionAST);
                if (arg !== null) {
                    this.actionInAlt(arg as ActionAST);
                }

            }

            this.exitRuleref((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "range"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:974:1: range : ^( RANGE STRING_LITERAL STRING_LITERAL ) ;
    public range(): GrammarTreeVisitor.range_return {
        const retval = new GrammarTreeVisitor.range_return();
        retval.start = this.input.LT(1);

        this.enterRange((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:981:5: ( ^( RANGE STRING_LITERAL STRING_LITERAL ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:981:7: ^( RANGE STRING_LITERAL STRING_LITERAL )
            {
                this.match(this.input, ANTLRv4Parser.RANGE, null);
                this.match(this.input, Constants.DOWN, null);
                this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null);
                this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null);
                this.match(this.input, Constants.UP, null);

            }

            this.exitRange((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "terminal"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:984:1: terminal : ( ^( STRING_LITERAL elementOptions ) | STRING_LITERAL | ^( TOKEN_REF elementOptions ) | TOKEN_REF );
    public terminal(): GrammarTreeVisitor.terminal_return {
        const retval = new GrammarTreeVisitor.terminal_return();
        retval.start = this.input.LT(1);

        let STRING_LITERAL41 = null;
        let STRING_LITERAL42 = null;
        let TOKEN_REF43 = null;
        let TOKEN_REF44 = null;

        this.enterTerminal((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:991:5: ( ^( STRING_LITERAL elementOptions ) | STRING_LITERAL | ^( TOKEN_REF elementOptions ) | TOKEN_REF )
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
                            const nvae =
                                new NoViableAltException("", 53, 1, this.input);
                            throw nvae;
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
                                const nvae =
                                    new NoViableAltException("", 53, 2, this.input);
                                throw nvae;
                            } finally {
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException("", 53, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt53) {
                case 1: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:991:8: ^( STRING_LITERAL elementOptions )
                    {
                        STRING_LITERAL41 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.stringRef(STRING_LITERAL41 as TerminalAST);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:993:7: STRING_LITERAL
                    {
                        STRING_LITERAL42 = this.match(this.input, ANTLRv4Parser.STRING_LITERAL, null) as GrammarAST;
                        this.stringRef(STRING_LITERAL42 as TerminalAST);
                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:994:7: ^( TOKEN_REF elementOptions )
                    {
                        TOKEN_REF43 = this.match(this.input, ANTLRv4Parser.TOKEN_REF, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.elementOptions();

                        this.match(this.input, Constants.UP, null);

                        this.tokenRef(TOKEN_REF43 as TerminalAST);
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:995:7: TOKEN_REF
                    {
                        TOKEN_REF44 = this.match(this.input, ANTLRv4Parser.TOKEN_REF, null) as GrammarAST;
                        this.tokenRef(TOKEN_REF44 as TerminalAST);
                    }
                    break;
                }

                default:

            }

            this.exitTerminal((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    // $ANTLR start "elementOptions"
    // org/antlr/v4/parse/GrammarTreeVisitor.g:998:1: elementOptions : ^( ELEMENT_OPTIONS ( elementOption[(GrammarASTWithOptions)$start.getParent()] )* ) ;
    public elementOptions(): GrammarTreeVisitor.elementOptions_return {
        const retval = new GrammarTreeVisitor.elementOptions_return();
        retval.start = this.input.LT(1);

        this.enterElementOptions((retval.start as GrammarAST));

        try {
            // org/antlr/v4/parse/GrammarTreeVisitor.g:1005:5: ( ^( ELEMENT_OPTIONS ( elementOption[(GrammarASTWithOptions)$start.getParent()] )* ) )
            // org/antlr/v4/parse/GrammarTreeVisitor.g:1005:7: ^( ELEMENT_OPTIONS ( elementOption[(GrammarASTWithOptions)$start.getParent()] )* )
            {
                this.match(this.input, ANTLRv4Parser.ELEMENT_OPTIONS, null);
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN, null);
                    // org/antlr/v4/parse/GrammarTreeVisitor.g:1005:25: ( elementOption[(GrammarASTWithOptions)$start.getParent()] )*
                    loop54:
                    while (true) {
                        let alt54 = 2;
                        const LA54_0 = this.input.LA(1);
                        if ((LA54_0 === ANTLRv4Parser.ASSIGN || LA54_0 === ANTLRv4Parser.ID)) {
                            alt54 = 1;
                        }

                        switch (alt54) {
                            case 1: {
                                // org/antlr/v4/parse/GrammarTreeVisitor.g:1005:25: elementOption[(GrammarASTWithOptions)$start.getParent()]
                                {
                                    this.elementOption((retval.start as GrammarAST).getParent() as GrammarASTWithOptions);

                                }
                                break;
                            }

                            default: {
                                break loop54;
                            }

                        }
                    }

                    this.match(this.input, Constants.UP, null);
                }

            }

            this.exitElementOptions((retval.start as GrammarAST));

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return retval;
    }

    protected enterGrammarSpec(tree: GrammarAST): void { /**/ }
    protected exitGrammarSpec(tree: GrammarAST): void { /**/ }

    protected enterPrequelConstructs(tree: GrammarAST): void { /**/ }
    protected exitPrequelConstructs(tree: GrammarAST): void { /**/ }

    protected enterPrequelConstruct(tree: GrammarAST): void { /**/ }
    protected exitPrequelConstruct(tree: GrammarAST): void { /**/ }

    protected enterOptionsSpec(tree: GrammarAST): void { /**/ }
    protected exitOptionsSpec(tree: GrammarAST): void { /**/ }

    protected enterOption(tree: GrammarAST): void { /**/ }
    protected exitOption(tree: GrammarAST): void { /**/ }

    protected enterOptionValue(tree: GrammarAST): void { /**/ }
    protected exitOptionValue(tree: GrammarAST): void { /**/ }

    protected enterDelegateGrammars(tree: GrammarAST): void { /**/ }
    protected exitDelegateGrammars(tree: GrammarAST): void { /**/ }

    protected enterDelegateGrammar(tree: GrammarAST): void { /**/ }
    protected exitDelegateGrammar(tree: GrammarAST): void { /**/ }

    protected enterTokensSpec(tree: GrammarAST): void { /**/ }
    protected exitTokensSpec(tree: GrammarAST): void { /**/ }

    protected enterTokenSpec(tree: GrammarAST): void { /**/ }
    protected exitTokenSpec(tree: GrammarAST): void { /**/ }

    protected enterChannelsSpec(tree: GrammarAST): void { /**/ }
    protected exitChannelsSpec(tree: GrammarAST): void { /**/ }

    protected enterChannelSpec(tree: GrammarAST): void { /**/ }
    protected exitChannelSpec(tree: GrammarAST): void { /**/ }

    protected enterAction(tree: GrammarAST): void { /**/ }
    protected exitAction(tree: GrammarAST): void { /**/ }

    protected enterRules(tree: GrammarAST): void { /**/ }
    protected exitRules(tree: GrammarAST): void { /**/ }

    protected enterMode(tree: GrammarAST): void { /**/ }
    protected exitMode(tree: GrammarAST): void { /**/ }

    protected enterLexerRule(tree: GrammarAST): void { /**/ }
    protected exitLexerRule(tree: GrammarAST): void { /**/ }

    protected enterRule(tree: GrammarAST): void { /**/ }
    protected exitRule(tree: GrammarAST): void { /**/ }

    protected enterExceptionGroup(tree: GrammarAST): void { /**/ }
    protected exitExceptionGroup(tree: GrammarAST): void { /**/ }

    protected enterExceptionHandler(tree: GrammarAST): void { /**/ }
    protected exitExceptionHandler(tree: GrammarAST): void { /**/ }

    protected enterFinallyClause(tree: GrammarAST): void { /**/ }
    protected exitFinallyClause(tree: GrammarAST): void { /**/ }

    protected enterLocals(tree: GrammarAST): void { /**/ }
    protected exitLocals(tree: GrammarAST): void { /**/ }

    protected enterRuleReturns(tree: GrammarAST): void { /**/ }
    protected exitRuleReturns(tree: GrammarAST): void { /**/ }

    protected enterThrowsSpec(tree: GrammarAST): void { /**/ }
    protected exitThrowsSpec(tree: GrammarAST): void { /**/ }

    protected enterRuleAction(tree: GrammarAST): void { /**/ }
    protected exitRuleAction(tree: GrammarAST): void { /**/ }

    protected enterRuleModifier(tree: GrammarAST): void { /**/ }
    protected exitRuleModifier(tree: GrammarAST): void { /**/ }

    protected enterLexerRuleBlock(tree: GrammarAST): void { /**/ }
    protected exitLexerRuleBlock(tree: GrammarAST): void { /**/ }

    protected enterRuleBlock(tree: GrammarAST): void { /**/ }
    protected exitRuleBlock(tree: GrammarAST): void { /**/ }

    protected enterLexerOuterAlternative(tree: AltAST): void { /**/ }
    protected exitLexerOuterAlternative(tree: AltAST): void { /**/ }

    protected enterOuterAlternative(tree: AltAST): void { /**/ }
    protected exitOuterAlternative(tree: AltAST): void { /**/ }

    protected enterLexerAlternative(tree: GrammarAST): void { /**/ }
    protected exitLexerAlternative(tree: GrammarAST): void { /**/ }

    protected enterLexerElements(tree: GrammarAST): void { /**/ }
    protected exitLexerElements(tree: GrammarAST): void { /**/ }

    protected enterLexerElement(tree: GrammarAST): void { /**/ }
    protected exitLexerElement(tree: GrammarAST): void { /**/ }

    protected enterLexerBlock(tree: GrammarAST): void { /**/ }
    protected exitLexerBlock(tree: GrammarAST): void { /**/ }

    protected enterLexerAtom(tree: GrammarAST): void { /**/ }
    protected exitLexerAtom(tree: GrammarAST): void { /**/ }

    protected enterActionElement(tree: GrammarAST): void { /**/ }
    protected exitActionElement(tree: GrammarAST): void { /**/ }

    protected enterAlternative(tree: AltAST): void { /**/ }
    protected exitAlternative(tree: AltAST): void { /**/ }

    protected enterLexerCommand(tree: GrammarAST): void { /**/ }
    protected exitLexerCommand(tree: GrammarAST): void { /**/ }

    protected enterLexerCommandExpr(tree: GrammarAST): void { /**/ }
    protected exitLexerCommandExpr(tree: GrammarAST): void { /**/ }

    protected enterElement(tree: GrammarAST): void { /**/ }
    protected exitElement(tree: GrammarAST): void { /**/ }

    protected enterAstOperand(tree: GrammarAST): void { /**/ }
    protected exitAstOperand(tree: GrammarAST): void { /**/ }

    protected enterLabeledElement(tree: GrammarAST): void { /**/ }
    protected exitLabeledElement(tree: GrammarAST): void { /**/ }

    protected enterSubrule(tree: GrammarAST): void { /**/ }
    protected exitSubrule(tree: GrammarAST): void { /**/ }

    protected enterLexerSubrule(tree: GrammarAST): void { /**/ }
    protected exitLexerSubrule(tree: GrammarAST): void { /**/ }

    protected enterBlockSuffix(tree: GrammarAST): void { /**/ }
    protected exitBlockSuffix(tree: GrammarAST): void { /**/ }

    protected enterEbnfSuffix(tree: GrammarAST): void { /**/ }
    protected exitEbnfSuffix(tree: GrammarAST): void { /**/ }

    protected enterAtom(tree: GrammarAST): void { /**/ }
    protected exitAtom(tree: GrammarAST): void { /**/ }

    protected enterBlockSet(tree: GrammarAST): void { /**/ }
    protected exitBlockSet(tree: GrammarAST): void { /**/ }

    protected enterSetElement(tree: GrammarAST): void { /**/ }
    protected exitSetElement(tree: GrammarAST): void { /**/ }

    protected enterBlock(tree: GrammarAST): void { /**/ }
    protected exitBlock(tree: GrammarAST): void { /**/ }

    protected enterRuleref(tree: GrammarAST): void { /**/ }
    protected exitRuleref(tree: GrammarAST): void { /**/ }

    protected enterRange(tree: GrammarAST): void { /**/ }
    protected exitRange(tree: GrammarAST): void { /**/ }

    protected enterTerminal(tree: GrammarAST): void { /**/ }
    protected exitTerminal(tree: GrammarAST): void { /**/ }

    protected enterElementOptions(tree: GrammarAST): void { /**/ }
    protected exitElementOptions(tree: GrammarAST): void { /**/ }

    protected enterElementOption(tree: GrammarAST): void { /**/ }
    protected exitElementOption(tree: GrammarAST): void { /**/ }
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
