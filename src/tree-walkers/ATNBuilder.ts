/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

// $ANTLR 3.5.3 org/antlr/v4/parse/ATNBuilder.g

/* eslint-disable max-len, @typescript-eslint/naming-convention */
// cspell: disable

import { RecognitionException } from "antlr4ng";

import { EarlyExitException } from "../antlr3/EarlyExitException.js";
import { createRecognizerSharedState, IRecognizerSharedState } from "../antlr3/IRecognizerSharedState.js";
import { MismatchedSetException } from "../antlr3/MismatchedSetException.js";
import { NoViableAltException } from "../antlr3/NoViableAltException.js";
import type { TreeNodeStream } from "../antlr3/tree/TreeNodeStream.js";
import { TreeParser } from "../antlr3/tree/TreeParser.js";
import { TreeRuleReturnScope } from "../antlr3/tree/TreeRuleReturnScope.js";
import type { IATNFactory, IStatePair } from "../automata/IATNFactory.js";
import { Constants } from "../Constants.js";
import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";
import type { ActionAST } from "../tool/ast/ActionAST.js";
import type { BlockAST } from "../tool/ast/BlockAST.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { PredAST } from "../tool/ast/PredAST.js";
import type { TerminalAST } from "../tool/ast/TerminalAST.js";

export class ATNBuilder extends TreeParser {
    public static readonly tokenNames = [
        "<invalid>", "<EOR>", "<DOWN>", "<UP>", "ACTION", "ACTION_CHAR_LITERAL",
        "ACTION_ESC", "ACTION_STRING_LITERAL", "ARG_ACTION", "ARG_OR_CHARSET",
        "ASSIGN", "AT", "CATCH", "CHANNELS", "COLON", "COLONCOLON", "COMMA", "COMMENT",
        "DOC_COMMENT", "DOLLAR", "DOT", "ERRCHAR", "ESC_SEQ", "FINALLY", "FRAGMENT",
        "GRAMMAR", "GT", "HEX_DIGIT", "ID", "IMPORT", "INT", "LEXER", "LEXER_CHAR_SET",
        "LOCALS", "LPAREN", "LT", "MODE", "NESTED_ACTION", "NLCHARS", "NOT", "NameChar",
        "NameStartChar", "OPTIONS", "OR", "PARSER", "PLUS", "PLUS_ASSIGN", "POUND",
        "QUESTION", "RANGE", "RARROW", "RBRACE", "RETURNS", "RPAREN", "RULE_REF",
        "SEMI", "SEMPRED", "SRC", "STAR", "STRING_LITERAL", "THROWS", "TOKENS_SPEC",
        "TOKEN_REF", "UNICODE_ESC", "UNICODE_EXTENDED_ESC", "UnicodeBOM", "WS",
        "WSCHARS", "WSNLCHARS", "ALT", "BLOCK", "CLOSURE", "COMBINED", "ELEMENT_OPTIONS",
        "EPSILON", "LEXER_ACTION_CALL", "LEXER_ALT_ACTION", "OPTIONAL", "POSITIVE_CLOSURE",
        "RULE", "RULEMODIFIERS", "RULES", "SET", "WILDCARD"
    ];

    public static lexerCommandExpr_return = class lexerCommandExpr_return extends TreeRuleReturnScope {
    };

    // $ANTLR end "lexerCommandExpr"

    public static element_return = class element_return extends TreeRuleReturnScope {
        public p: IStatePair;
    };

    // $ANTLR end "labeledElement"

    public static subrule_return = class subrule_return extends TreeRuleReturnScope {
        public p: IStatePair;
    };

    // $ANTLR end "subrule"

    public static blockSet_return = class blockSet_return extends TreeRuleReturnScope {
        public p: IStatePair;
    };

    // $ANTLR end "blockSet"

    public static setElement_return = class setElement_return extends TreeRuleReturnScope {
    };

    // $ANTLR end "setElement"

    public static atom_return = class atom_return extends TreeRuleReturnScope {
        public p: IStatePair;
    };

    public static terminal_return = class terminal_return extends TreeRuleReturnScope {
        public p: IStatePair;
    };

    protected factory?: IATNFactory;

    public constructor(input: TreeNodeStream, stateOrFactory?: IRecognizerSharedState | IATNFactory) {
        if (!stateOrFactory) {
            stateOrFactory = createRecognizerSharedState();
        }

        if ("errorRecovery" in stateOrFactory) { // RecognizerSharedState
            super(input, stateOrFactory);
        } else {
            super(input);
            this.factory = stateOrFactory;
        }
    }

    // delegates
    public getDelegates(): TreeParser[] {
        return [];
    }

    public override getTokenNames(): string[] {
        return ATNBuilder.tokenNames;
    }

    public override getGrammarFileName(): string {
        return "org/antlr/v4/parse/ATNBuilder.g";
    }

    // $ANTLR start "dummy"
    // org/antlr/v4/parse/ATNBuilder.g:80:1: dummy : block[null] ;
    public dummy(): void {
        try {
            // org/antlr/v4/parse/ATNBuilder.g:80:7: ( block[null] )
            // org/antlr/v4/parse/ATNBuilder.g:80:9: block[null]
            {
                this.block(null);

            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

    }
    // $ANTLR end "dummy"

    // $ANTLR start "ruleBlock"
    // org/antlr/v4/parse/ATNBuilder.g:82:1: ruleBlock[GrammarAST ebnfRoot] returns [IStatePair p] : ^( BLOCK ( ^( OPTIONS ( . )* ) )? (a= alternative )+ ) ;
    public ruleBlock(ebnfRoot: GrammarAST | null): IStatePair | null {
        let p = null;

        let BLOCK1 = null;

        const alts = new Array<IStatePair>();
        let alt = 1;
        this.factory!.setCurrentOuterAlt(alt);

        try {
            // org/antlr/v4/parse/ATNBuilder.g:88:5: ( ^( BLOCK ( ^( OPTIONS ( . )* ) )? (a= alternative )+ ) )
            // org/antlr/v4/parse/ATNBuilder.g:88:7: ^( BLOCK ( ^( OPTIONS ( . )* ) )? (a= alternative )+ )
            {
                BLOCK1 = this.match(this.input, ANTLRv4Lexer.BLOCK, null) as GrammarAST;
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/ATNBuilder.g:89:13: ( ^( OPTIONS ( . )* ) )?
                let alt2 = 2;
                const LA2_0 = this.input.LA(1);
                if ((LA2_0 === ANTLRv4Lexer.OPTIONS)) {
                    alt2 = 1;
                }
                switch (alt2) {
                    case 1: {
                        // org/antlr/v4/parse/ATNBuilder.g:89:14: ^( OPTIONS ( . )* )
                        {
                            this.match(this.input, ANTLRv4Lexer.OPTIONS, null);
                            if (this.input.LA(1) === Constants.DOWN) {
                                this.match(this.input, Constants.DOWN, null);
                                // org/antlr/v4/parse/ATNBuilder.g:89:24: ( . )*
                                loop1:
                                while (true) {
                                    let alt1 = 2;
                                    const LA1_0 = this.input.LA(1);
                                    if (((LA1_0 >= ANTLRv4Lexer.ACTION && LA1_0 <= ANTLRv4Lexer.WILDCARD))) {
                                        alt1 = 1;
                                    } else {
                                        if ((LA1_0 === Constants.UP)) {
                                            alt1 = 2;
                                        }
                                    }

                                    switch (alt1) {
                                        case 1: {
                                            // org/antlr/v4/parse/ATNBuilder.g:89:24: .
                                            {
                                                this.matchAny(this.input);
                                            }
                                            break;
                                        }

                                        default: {
                                            break loop1;
                                        }

                                    }
                                }

                                this.match(this.input, Constants.UP, null);
                            }

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/ATNBuilder.g:90:13: (a= alternative )+
                let cnt3 = 0;
                loop3:
                while (true) {
                    let alt3 = 2;
                    const LA3_0 = this.input.LA(1);
                    if ((LA3_0 === ANTLRv4Lexer.ALT || LA3_0 === ANTLRv4Lexer.LEXER_ALT_ACTION)) {
                        alt3 = 1;
                    }

                    switch (alt3) {
                        case 1: {
                            // org/antlr/v4/parse/ATNBuilder.g:90:17: a= alternative
                            {
                                const a = this.alternative();

                                alts.push(a!);
                                this.factory!.setCurrentOuterAlt(++alt);
                            }
                            break;
                        }

                        default: {
                            if (cnt3 >= 1) {
                                break loop3;
                            }

                            const eee = new EarlyExitException(3, this.input);
                            throw eee;
                        }

                    }
                    cnt3++;
                }

                this.match(this.input, Constants.UP, null);

                p = this.factory!.block(BLOCK1 as BlockAST, ebnfRoot, alts);
            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return p;
    }
    // $ANTLR end "ruleBlock"

    // $ANTLR start "block"
    // org/antlr/v4/parse/ATNBuilder.g:97:1: block[GrammarAST ebnfRoot] returns [IStatePair p] : ^( BLOCK ( ^( OPTIONS ( . )* ) )? (a= alternative )+ ) ;
    public block(ebnfRoot: GrammarAST | null): IStatePair | null {
        let p = null;

        let BLOCK2 = null;

        const alts = new Array<IStatePair>();
        try {
            // org/antlr/v4/parse/ATNBuilder.g:99:5: ( ^( BLOCK ( ^( OPTIONS ( . )* ) )? (a= alternative )+ ) )
            // org/antlr/v4/parse/ATNBuilder.g:99:7: ^( BLOCK ( ^( OPTIONS ( . )* ) )? (a= alternative )+ )
            {
                BLOCK2 = this.match(this.input, ANTLRv4Lexer.BLOCK, null) as GrammarAST;
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/ATNBuilder.g:99:15: ( ^( OPTIONS ( . )* ) )?
                let alt5 = 2;
                const LA5_0 = this.input.LA(1);
                if ((LA5_0 === ANTLRv4Lexer.OPTIONS)) {
                    alt5 = 1;
                }
                switch (alt5) {
                    case 1: {
                        // org/antlr/v4/parse/ATNBuilder.g:99:16: ^( OPTIONS ( . )* )
                        {
                            this.match(this.input, ANTLRv4Lexer.OPTIONS, null);
                            if (this.input.LA(1) === Constants.DOWN) {
                                this.match(this.input, Constants.DOWN, null);
                                // org/antlr/v4/parse/ATNBuilder.g:99:26: ( . )*
                                loop4:
                                while (true) {
                                    let alt4 = 2;
                                    const LA4_0 = this.input.LA(1);
                                    if (((LA4_0 >= ANTLRv4Lexer.ACTION && LA4_0 <= ANTLRv4Lexer.WILDCARD))) {
                                        alt4 = 1;
                                    } else {
                                        if ((LA4_0 === Constants.UP)) {
                                            alt4 = 2;
                                        }
                                    }

                                    switch (alt4) {
                                        case 1: {
                                            // org/antlr/v4/parse/ATNBuilder.g:99:26: .
                                            {
                                                this.matchAny(this.input);
                                            }
                                            break;
                                        }

                                        default: {
                                            break loop4;
                                        }

                                    }
                                }

                                this.match(this.input, Constants.UP, null);
                            }

                        }
                        break;
                    }

                    default:

                }

                // org/antlr/v4/parse/ATNBuilder.g:99:32: (a= alternative )+
                let cnt6 = 0;
                loop6:
                while (true) {
                    let alt6 = 2;
                    const LA6_0 = this.input.LA(1);
                    if ((LA6_0 === ANTLRv4Lexer.ALT || LA6_0 === ANTLRv4Lexer.LEXER_ALT_ACTION)) {
                        alt6 = 1;
                    }

                    switch (alt6) {
                        case 1: {
                            // org/antlr/v4/parse/ATNBuilder.g:99:33: a= alternative
                            {
                                const a = this.alternative();

                                alts.push(a!);
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

                p = this.factory!.block(BLOCK2 as BlockAST, ebnfRoot, alts);
            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return p;
    }
    // $ANTLR end "block"

    // $ANTLR start "alternative"
    // org/antlr/v4/parse/ATNBuilder.g:103:1: alternative returns [IStatePair p] : ( ^( LEXER_ALT_ACTION a= alternative lexerCommands ) | ^( ALT ( elementOptions )? EPSILON ) | ^( ALT ( elementOptions )? (e= element )+ ) );
    public alternative(): IStatePair | null {
        let p = null;

        let EPSILON4 = null;

        const els = new Array<IStatePair>();
        try {
            // org/antlr/v4/parse/ATNBuilder.g:105:5: ( ^( LEXER_ALT_ACTION a= alternative lexerCommands ) | ^( ALT ( elementOptions )? EPSILON ) | ^( ALT ( elementOptions )? (e= element )+ ) )
            let alt10 = 3;

            if (this.input.LA(1) === ANTLRv4Lexer.LEXER_ALT_ACTION) {
                alt10 = 1;
            } else {
                const current = this.input.LT(1)!;
                if (current.getChild(0)!.getType() === ANTLRv4Lexer.EPSILON) {
                    alt10 = 2;
                }
            }

            switch (alt10) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:105:7: ^( LEXER_ALT_ACTION a= alternative lexerCommands )
                    {
                        this.match(this.input, ANTLRv4Lexer.LEXER_ALT_ACTION, null);
                        this.match(this.input, Constants.DOWN, null);
                        const a = this.alternative();

                        const lexerCommands3 = this.lexerCommands();

                        this.match(this.input, Constants.UP, null);

                        p = this.factory!.lexerAltCommands(a!, lexerCommands3!);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:107:7: ^( ALT ( elementOptions )? EPSILON )
                    {
                        this.match(this.input, ANTLRv4Lexer.ALT, null);
                        this.match(this.input, Constants.DOWN, null);
                        // org/antlr/v4/parse/ATNBuilder.g:107:13: ( elementOptions )?
                        let alt7 = 2;
                        const LA7_0 = this.input.LA(1);
                        if ((LA7_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                            alt7 = 1;
                        }
                        switch (alt7) {
                            case 1: {
                                // org/antlr/v4/parse/ATNBuilder.g:107:13: elementOptions
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

                        EPSILON4 = this.match(this.input, ANTLRv4Lexer.EPSILON, null) as GrammarAST;
                        this.match(this.input, Constants.UP, null);

                        p = this.factory!.epsilon(EPSILON4);
                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:108:9: ^( ALT ( elementOptions )? (e= element )+ )
                    {
                        this.match(this.input, ANTLRv4Lexer.ALT, null);
                        this.match(this.input, Constants.DOWN, null);
                        // org/antlr/v4/parse/ATNBuilder.g:108:15: ( elementOptions )?
                        let alt8 = 2;
                        const LA8_0 = this.input.LA(1);
                        if ((LA8_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                            alt8 = 1;
                        }
                        switch (alt8) {
                            case 1: {
                                // org/antlr/v4/parse/ATNBuilder.g:108:15: elementOptions
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

                        // org/antlr/v4/parse/ATNBuilder.g:108:31: (e= element )+
                        let cnt9 = 0;
                        loop9:
                        while (true) {
                            let alt9 = 2;
                            const LA9_0 = this.input.LA(1);
                            if ((LA9_0 === ANTLRv4Lexer.ACTION || LA9_0 === ANTLRv4Lexer.ASSIGN || LA9_0 === ANTLRv4Lexer.DOT || LA9_0 === ANTLRv4Lexer.LEXER_CHAR_SET || LA9_0 === ANTLRv4Lexer.NOT || LA9_0 === ANTLRv4Lexer.PLUS_ASSIGN || LA9_0 === ANTLRv4Lexer.RANGE || LA9_0 === ANTLRv4Lexer.RULE_REF || LA9_0 === ANTLRv4Lexer.SEMPRED || LA9_0 === ANTLRv4Lexer.STRING_LITERAL || LA9_0 === ANTLRv4Lexer.TOKEN_REF || (LA9_0 >= ANTLRv4Lexer.BLOCK && LA9_0 <= ANTLRv4Lexer.CLOSURE) || (LA9_0 >= ANTLRv4Lexer.OPTIONAL && LA9_0 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA9_0 >= ANTLRv4Lexer.SET && LA9_0 <= ANTLRv4Lexer.WILDCARD))) {
                                alt9 = 1;
                            }

                            switch (alt9) {
                                case 1: {
                                    // org/antlr/v4/parse/ATNBuilder.g:108:32: e= element
                                    {
                                        const e = this.element();

                                        els.push(e.p);
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

                        p = this.factory!.alt(els);
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

        return p;
    }
    // $ANTLR end "alternative"

    // $ANTLR start "lexerCommands"
    // org/antlr/v4/parse/ATNBuilder.g:111:1: lexerCommands returns [IStatePair p] : (c= lexerCommand )+ ;
    public lexerCommands(): IStatePair | null {
        let p = null;

        let c = null;

        const cmds = new Array<IStatePair>();
        try {
            // org/antlr/v4/parse/ATNBuilder.g:113:5: ( (c= lexerCommand )+ )
            // org/antlr/v4/parse/ATNBuilder.g:113:9: (c= lexerCommand )+
            {
                // org/antlr/v4/parse/ATNBuilder.g:113:9: (c= lexerCommand )+
                let cnt11 = 0;
                loop11:
                while (true) {
                    let alt11 = 2;
                    const LA11_0 = this.input.LA(1);
                    if ((LA11_0 === ANTLRv4Lexer.ID || LA11_0 === ANTLRv4Lexer.LEXER_ACTION_CALL)) {
                        alt11 = 1;
                    }

                    switch (alt11) {
                        case 1: {
                            // org/antlr/v4/parse/ATNBuilder.g:113:10: c= lexerCommand
                            {
                                c = this.lexerCommand();

                                if (c !== null) {
                                    cmds.push(c);
                                }

                            }
                            break;
                        }

                        default: {
                            if (cnt11 >= 1) {
                                break loop11;
                            }

                            const eee = new EarlyExitException(11, this.input);
                            throw eee;
                        }

                    }
                    cnt11++;
                }

                p = this.factory!.alt(cmds);

            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return p;
    }
    // $ANTLR end "lexerCommands"

    // $ANTLR start "lexerCommand"
    // org/antlr/v4/parse/ATNBuilder.g:119:1: lexerCommand returns [IStatePair cmd] : ( ^( LEXER_ACTION_CALL ID lexerCommandExpr ) | ID );
    public lexerCommand(): IStatePair | null {
        let cmd = null;

        let ID5 = null;
        let ID7 = null;

        try {
            // org/antlr/v4/parse/ATNBuilder.g:120:2: ( ^( LEXER_ACTION_CALL ID lexerCommandExpr ) | ID )
            let alt12 = 2;
            const LA12_0 = this.input.LA(1);
            if ((LA12_0 === ANTLRv4Lexer.LEXER_ACTION_CALL)) {
                alt12 = 1;
            } else {
                if ((LA12_0 === ANTLRv4Lexer.ID)) {
                    alt12 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 12, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt12) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:120:4: ^( LEXER_ACTION_CALL ID lexerCommandExpr )
                    {
                        this.match(this.input, ANTLRv4Lexer.LEXER_ACTION_CALL, null);
                        this.match(this.input, Constants.DOWN, null);
                        ID5 = this.match(this.input, ANTLRv4Lexer.ID, null) as GrammarAST;
                        const lexerCommandExpr6 = this.lexerCommandExpr();

                        this.match(this.input, Constants.UP, null);

                        cmd = this.factory!.lexerCallCommand(ID5, lexerCommandExpr6.start as GrammarAST);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:122:4: ID
                    {
                        ID7 = this.match(this.input, ANTLRv4Lexer.ID, null) as GrammarAST;
                        cmd = this.factory!.lexerCommand(ID7);
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

        return cmd;
    }

    // $ANTLR start "lexerCommandExpr"
    // org/antlr/v4/parse/ATNBuilder.g:126:1: lexerCommandExpr : ( ID | INT );
    public lexerCommandExpr(): ATNBuilder.lexerCommandExpr_return {
        const retval = new ATNBuilder.lexerCommandExpr_return();
        retval.start = this.input.LT(1);

        try {
            // org/antlr/v4/parse/ATNBuilder.g:127:2: ( ID | INT )
            // org/antlr/v4/parse/ATNBuilder.g:
            {
                if (this.input.LA(1) === ANTLRv4Lexer.ID || this.input.LA(1) === ANTLRv4Lexer.INT) {
                    this.input.consume();
                    this.state.errorRecovery = false;
                } else {
                    const mse = new MismatchedSetException(null, this.input);
                    throw mse;
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

    // $ANTLR start "element"
    // org/antlr/v4/parse/ATNBuilder.g:131:1: element returns [IStatePair p] : ( labeledElement | atom | subrule | ACTION | SEMPRED | ^( ACTION . ) | ^( SEMPRED . ) | ^( NOT b= blockSet[true] ) | LEXER_CHAR_SET );
    public element(): ATNBuilder.element_return {
        const retval = new ATNBuilder.element_return();
        retval.start = this.input.LT(1);

        let ACTION11 = null;
        let SEMPRED12 = null;
        let ACTION13 = null;
        let SEMPRED14 = null;
        let b = null;
        let labeledElement8 = null;
        let atom9 = null;
        let subrule10 = null;

        try {
            // org/antlr/v4/parse/ATNBuilder.g:132:2: ( labeledElement | atom | subrule | ACTION | SEMPRED | ^( ACTION . ) | ^( SEMPRED . ) | ^( NOT b= blockSet[true] ) | LEXER_CHAR_SET )
            let alt13 = 9;
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.ASSIGN:
                case ANTLRv4Lexer.PLUS_ASSIGN: {
                    {
                        alt13 = 1;
                    }
                    break;
                }

                case ANTLRv4Lexer.DOT:
                case ANTLRv4Lexer.RANGE:
                case ANTLRv4Lexer.RULE_REF:
                case ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer.TOKEN_REF:
                case ANTLRv4Lexer.SET:
                case ANTLRv4Lexer.WILDCARD: {
                    {
                        alt13 = 2;
                    }
                    break;
                }

                case ANTLRv4Lexer.BLOCK:
                case ANTLRv4Lexer.CLOSURE:
                case ANTLRv4Lexer.OPTIONAL:
                case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                    {
                        alt13 = 3;
                    }
                    break;
                }

                case ANTLRv4Lexer.ACTION: {
                    {
                        const LA13_4 = this.input.LA(2);
                        if ((LA13_4 === Constants.DOWN)) {
                            alt13 = 6;
                        } else {
                            if (((LA13_4 >= Constants.UP && LA13_4 <= ANTLRv4Lexer.ACTION) || LA13_4 === ANTLRv4Lexer.ASSIGN || LA13_4 === ANTLRv4Lexer.DOT || LA13_4 === ANTLRv4Lexer.LEXER_CHAR_SET || LA13_4 === ANTLRv4Lexer.NOT || LA13_4 === ANTLRv4Lexer.PLUS_ASSIGN || LA13_4 === ANTLRv4Lexer.RANGE || LA13_4 === ANTLRv4Lexer.RULE_REF || LA13_4 === ANTLRv4Lexer.SEMPRED || LA13_4 === ANTLRv4Lexer.STRING_LITERAL || LA13_4 === ANTLRv4Lexer.TOKEN_REF || (LA13_4 >= ANTLRv4Lexer.BLOCK && LA13_4 <= ANTLRv4Lexer.CLOSURE) || (LA13_4 >= ANTLRv4Lexer.OPTIONAL && LA13_4 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA13_4 >= ANTLRv4Lexer.SET && LA13_4 <= ANTLRv4Lexer.WILDCARD))) {
                                alt13 = 4;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae =
                                        new NoViableAltException("", 13, 4, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Lexer.SEMPRED: {
                    {
                        const LA13_5 = this.input.LA(2);
                        if ((LA13_5 === Constants.DOWN)) {
                            alt13 = 7;
                        } else {
                            if (((LA13_5 >= Constants.UP && LA13_5 <= ANTLRv4Lexer.ACTION) || LA13_5 === ANTLRv4Lexer.ASSIGN || LA13_5 === ANTLRv4Lexer.DOT || LA13_5 === ANTLRv4Lexer.LEXER_CHAR_SET || LA13_5 === ANTLRv4Lexer.NOT || LA13_5 === ANTLRv4Lexer.PLUS_ASSIGN || LA13_5 === ANTLRv4Lexer.RANGE || LA13_5 === ANTLRv4Lexer.RULE_REF || LA13_5 === ANTLRv4Lexer.SEMPRED || LA13_5 === ANTLRv4Lexer.STRING_LITERAL || LA13_5 === ANTLRv4Lexer.TOKEN_REF || (LA13_5 >= ANTLRv4Lexer.BLOCK && LA13_5 <= ANTLRv4Lexer.CLOSURE) || (LA13_5 >= ANTLRv4Lexer.OPTIONAL && LA13_5 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA13_5 >= ANTLRv4Lexer.SET && LA13_5 <= ANTLRv4Lexer.WILDCARD))) {
                                alt13 = 5;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae =
                                        new NoViableAltException("", 13, 5, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Lexer.NOT: {
                    {
                        alt13 = 8;
                    }
                    break;
                }

                case ANTLRv4Lexer.LEXER_CHAR_SET: {
                    {
                        alt13 = 9;
                    }
                    break;
                }

                default: {
                    const nvae = new NoViableAltException("", 13, 0, this.input);
                    throw nvae;
                }

            }

            switch (alt13) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:132:4: labeledElement
                    {
                        labeledElement8 = this.labeledElement();

                        retval.p = labeledElement8!;
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:133:4: atom
                    {
                        atom9 = this.atom();

                        retval.p = atom9.p;
                    }

                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:134:4: subrule
                    {
                        subrule10 = this.subrule();

                        retval.p = subrule10.p;
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/ATNBuilder.g:135:6: ACTION
                    {
                        ACTION11 = this.match(this.input, ANTLRv4Lexer.ACTION, null) as GrammarAST;
                        retval.p = this.factory!.action(ACTION11 as ActionAST);
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/ATNBuilder.g:136:6: SEMPRED
                    {
                        SEMPRED12 = this.match(this.input, ANTLRv4Lexer.SEMPRED, null) as GrammarAST;
                        retval.p = this.factory!.sempred(SEMPRED12 as PredAST);
                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/ATNBuilder.g:137:6: ^( ACTION . )
                    {
                        ACTION13 = this.match(this.input, ANTLRv4Lexer.ACTION, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                        retval.p = this.factory!.action(ACTION13 as ActionAST);
                    }
                    break;
                }

                case 7: {
                    // org/antlr/v4/parse/ATNBuilder.g:138:6: ^( SEMPRED . )
                    {
                        SEMPRED14 = this.match(this.input, ANTLRv4Lexer.SEMPRED, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                        retval.p = this.factory!.sempred(SEMPRED14 as PredAST);
                    }
                    break;
                }

                case 8: {
                    // org/antlr/v4/parse/ATNBuilder.g:139:7: ^( NOT b= blockSet[true] )
                    {
                        this.match(this.input, ANTLRv4Lexer.NOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        b = this.blockSet(true);

                        this.match(this.input, Constants.UP, null);

                        retval.p = b.p;
                    }
                    break;
                }

                case 9: {
                    // org/antlr/v4/parse/ATNBuilder.g:140:7: LEXER_CHAR_SET
                    {
                        this.match(this.input, ANTLRv4Lexer.LEXER_CHAR_SET, null);
                        retval.p = this.factory!.charSetLiteral((retval.start as GrammarAST))!;
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
    // $ANTLR end "element"

    // $ANTLR start "astOperand"
    // org/antlr/v4/parse/ATNBuilder.g:143:1: astOperand returns [IStatePair p] : ( atom | ^( NOT blockSet[true] ) );
    public astOperand(): IStatePair | null {
        let p = null;

        try {
            // org/antlr/v4/parse/ATNBuilder.g:144:2: ( atom | ^( NOT blockSet[true] ) )
            let alt14 = 2;
            const LA14_0 = this.input.LA(1);
            if ((LA14_0 === ANTLRv4Lexer.DOT || LA14_0 === ANTLRv4Lexer.RANGE || LA14_0 === ANTLRv4Lexer.RULE_REF || LA14_0 === ANTLRv4Lexer.STRING_LITERAL || LA14_0 === ANTLRv4Lexer.TOKEN_REF || (LA14_0 >= ANTLRv4Lexer.SET && LA14_0 <= ANTLRv4Lexer.WILDCARD))) {
                alt14 = 1;
            } else {
                if ((LA14_0 === ANTLRv4Lexer.NOT)) {
                    alt14 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 14, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt14) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:144:4: atom
                    {
                        const atom15 = this.atom();

                        p = atom15.p;
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:145:4: ^( NOT blockSet[true] )
                    {
                        this.match(this.input, ANTLRv4Lexer.NOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        const blockSet16 = this.blockSet(true);

                        this.match(this.input, Constants.UP, null);

                        p = blockSet16.p;
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

        return p;
    }
    // $ANTLR end "astOperand"

    // $ANTLR start "labeledElement"
    // org/antlr/v4/parse/ATNBuilder.g:148:1: labeledElement returns [IStatePair p] : ( ^( ASSIGN ID element ) | ^( PLUS_ASSIGN ID element ) );
    public labeledElement(): IStatePair | null {
        let p = null;

        try {
            // org/antlr/v4/parse/ATNBuilder.g:149:2: ( ^( ASSIGN ID element ) | ^( PLUS_ASSIGN ID element ) )
            let alt15 = 2;
            const LA15_0 = this.input.LA(1);
            if ((LA15_0 === ANTLRv4Lexer.ASSIGN)) {
                alt15 = 1;
            } else {
                if ((LA15_0 === ANTLRv4Lexer.PLUS_ASSIGN)) {
                    alt15 = 2;
                } else {
                    const nvae =
                        new NoViableAltException("", 15, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt15) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:149:4: ^( ASSIGN ID element )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        const element17 = this.element();

                        this.match(this.input, Constants.UP, null);

                        p = this.factory!.label(element17.p);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:150:4: ^( PLUS_ASSIGN ID element )
                    {
                        this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        const element18 = this.element();

                        this.match(this.input, Constants.UP, null);

                        p = this.factory!.listLabel(element18.p);
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

        return p;
    }

    // $ANTLR start "subrule"
    // org/antlr/v4/parse/ATNBuilder.g:153:1: subrule returns [IStatePair p] : ( ^( OPTIONAL block[$start] ) | ^( CLOSURE block[$start] ) | ^( POSITIVE_CLOSURE block[$start] ) | block[null] );
    public subrule(): ATNBuilder.subrule_return {
        const retval = new ATNBuilder.subrule_return();
        retval.start = this.input.LT(1);

        try {
            // org/antlr/v4/parse/ATNBuilder.g:154:2: ( ^( OPTIONAL block[$start] ) | ^( CLOSURE block[$start] ) | ^( POSITIVE_CLOSURE block[$start] ) | block[null] )
            let alt16 = 4;
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.OPTIONAL: {
                    {
                        alt16 = 1;
                    }
                    break;
                }

                case ANTLRv4Lexer.CLOSURE: {
                    {
                        alt16 = 2;
                    }
                    break;
                }

                case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                    {
                        alt16 = 3;
                    }
                    break;
                }

                case ANTLRv4Lexer.BLOCK: {
                    {
                        alt16 = 4;
                    }
                    break;
                }

                default: {
                    const nvae = new NoViableAltException("", 16, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt16) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:154:4: ^( OPTIONAL block[$start] )
                    {
                        this.match(this.input, ANTLRv4Lexer.OPTIONAL, null);
                        this.match(this.input, Constants.DOWN, null);
                        const block19 = this.block((retval.start as GrammarAST));

                        this.match(this.input, Constants.UP, null);

                        retval.p = block19!;
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:155:4: ^( CLOSURE block[$start] )
                    {
                        this.match(this.input, ANTLRv4Lexer.CLOSURE, null);
                        this.match(this.input, Constants.DOWN, null);
                        const block20 = this.block((retval.start as GrammarAST));

                        this.match(this.input, Constants.UP, null);

                        retval.p = block20!;
                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:156:4: ^( POSITIVE_CLOSURE block[$start] )
                    {
                        this.match(this.input, ANTLRv4Lexer.POSITIVE_CLOSURE, null);
                        this.match(this.input, Constants.DOWN, null);
                        const block21 = this.block((retval.start as GrammarAST));

                        this.match(this.input, Constants.UP, null);

                        retval.p = block21!;
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/ATNBuilder.g:157:5: block[null]
                    {
                        const block22 = this.block(null);

                        retval.p = block22!;
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

    // $ANTLR start "blockSet"
    // org/antlr/v4/parse/ATNBuilder.g:160:1: blockSet[boolean invert] returns [IStatePair p] : ^( SET ( setElement )+ ) ;
    public blockSet(invert: boolean): ATNBuilder.blockSet_return {
        const retval = new ATNBuilder.blockSet_return();
        retval.start = this.input.LT(1);

        const alts = new Array<GrammarAST>();
        try {
            // org/antlr/v4/parse/ATNBuilder.g:162:2: ( ^( SET ( setElement )+ ) )
            // org/antlr/v4/parse/ATNBuilder.g:162:4: ^( SET ( setElement )+ )
            {
                this.match(this.input, ANTLRv4Lexer.SET, null);
                this.match(this.input, Constants.DOWN, null);
                // org/antlr/v4/parse/ATNBuilder.g:162:10: ( setElement )+
                let cnt17 = 0;
                loop17:
                while (true) {
                    let alt17 = 2;
                    const LA17_0 = this.input.LA(1);
                    if ((LA17_0 === ANTLRv4Lexer.LEXER_CHAR_SET || LA17_0 === ANTLRv4Lexer.RANGE || LA17_0 === ANTLRv4Lexer.STRING_LITERAL || LA17_0 === ANTLRv4Lexer.TOKEN_REF)) {
                        alt17 = 1;
                    }

                    switch (alt17) {
                        case 1: {
                            // org/antlr/v4/parse/ATNBuilder.g:162:11: setElement
                            {
                                const setElement23 = this.setElement();

                                alts.push(setElement23.start as GrammarAST);
                            }
                            break;
                        }

                        default: {
                            if (cnt17 >= 1) {
                                break loop17;
                            }

                            const eee = new EarlyExitException(17, this.input);
                            throw eee;
                        }

                    }
                    cnt17++;
                }

                this.match(this.input, Constants.UP, null);

                retval.p = this.factory!.set((retval.start as GrammarAST), alts, invert);
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

    // $ANTLR start "setElement"
    // org/antlr/v4/parse/ATNBuilder.g:166:1: setElement : ( ^( STRING_LITERAL . ) | ^( TOKEN_REF . ) | STRING_LITERAL | TOKEN_REF | ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) | LEXER_CHAR_SET );
    public setElement(): ATNBuilder.setElement_return {
        const retval = new ATNBuilder.setElement_return();
        retval.start = this.input.LT(1);

        try {
            // org/antlr/v4/parse/ATNBuilder.g:167:2: ( ^( STRING_LITERAL . ) | ^( TOKEN_REF . ) | STRING_LITERAL | TOKEN_REF | ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) | LEXER_CHAR_SET )
            let alt18 = 6;
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.STRING_LITERAL: {
                    {
                        const LA18_1 = this.input.LA(2);
                        if ((LA18_1 === Constants.DOWN)) {
                            alt18 = 1;
                        } else {
                            if ((LA18_1 === Constants.UP || LA18_1 === ANTLRv4Lexer.LEXER_CHAR_SET
                                || LA18_1 === ANTLRv4Lexer.RANGE || LA18_1 === ANTLRv4Lexer.STRING_LITERAL
                                || LA18_1 === ANTLRv4Lexer.TOKEN_REF)) {
                                alt18 = 3;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae =
                                        new NoViableAltException("", 18, 1, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Lexer.TOKEN_REF: {
                    {
                        const LA18_2 = this.input.LA(2);
                        if ((LA18_2 === Constants.DOWN)) {
                            alt18 = 2;
                        } else {
                            if ((LA18_2 === Constants.UP || LA18_2 === ANTLRv4Lexer.LEXER_CHAR_SET
                                || LA18_2 === ANTLRv4Lexer.RANGE || LA18_2 === ANTLRv4Lexer.STRING_LITERAL
                                || LA18_2 === ANTLRv4Lexer.TOKEN_REF)) {
                                alt18 = 4;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae =
                                        new NoViableAltException("", 18, 2, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Lexer.RANGE: {
                    {
                        alt18 = 5;
                    }
                    break;
                }

                case ANTLRv4Lexer.LEXER_CHAR_SET: {
                    {
                        alt18 = 6;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException("", 18, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt18) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:167:4: ^( STRING_LITERAL . )
                    {
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:168:4: ^( TOKEN_REF . )
                    {
                        this.match(this.input, ANTLRv4Lexer.TOKEN_REF, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:169:4: STRING_LITERAL
                    {
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null);
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/ATNBuilder.g:170:4: TOKEN_REF
                    {
                        this.match(this.input, ANTLRv4Lexer.TOKEN_REF, null);
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/ATNBuilder.g:171:4: ^( RANGE a= STRING_LITERAL b= STRING_LITERAL )
                    {
                        this.match(this.input, ANTLRv4Lexer.RANGE, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null);
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null);
                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/ATNBuilder.g:172:9: LEXER_CHAR_SET
                    {
                        this.match(this.input, ANTLRv4Lexer.LEXER_CHAR_SET, null);
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

    // $ANTLR start "atom"
    // org/antlr/v4/parse/ATNBuilder.g:175:1: atom returns [IStatePair p] : ( range | ^( DOT ID terminal ) | ^( DOT ID ruleref ) | ^( WILDCARD . ) | WILDCARD | blockSet[false] | terminal | ruleref );
    public atom(): ATNBuilder.atom_return {
        const retval = new ATNBuilder.atom_return();
        retval.start = this.input.LT(1);

        try {
            // org/antlr/v4/parse/ATNBuilder.g:176:2: ( range | ^( DOT ID terminal ) | ^( DOT ID ruleref ) | ^( WILDCARD . ) | WILDCARD | blockSet[false] | terminal | ruleref )
            let alt19 = 8;
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.RANGE: {
                    {
                        alt19 = 1;
                    }
                    break;
                }

                case ANTLRv4Lexer.DOT: {
                    {
                        const LA19_2 = this.input.LA(2);
                        if ((LA19_2 === Constants.DOWN)) {
                            const LA19_7 = this.input.LA(3);
                            if ((LA19_7 === ANTLRv4Lexer.ID)) {
                                const LA19_10 = this.input.LA(4);
                                if ((LA19_10 === ANTLRv4Lexer.STRING_LITERAL || LA19_10 === ANTLRv4Lexer.TOKEN_REF)) {
                                    alt19 = 2;
                                } else {
                                    if ((LA19_10 === ANTLRv4Lexer.RULE_REF)) {
                                        alt19 = 3;
                                    } else {
                                        const nvaeMark = this.input.mark();
                                        const lastIndex = this.input.index;
                                        try {
                                            for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                                this.input.consume();
                                            }
                                            const nvae = new NoViableAltException("", 19, 10, this.input);
                                            throw nvae;
                                        } finally {
                                            this.input.seek(lastIndex);
                                            this.input.release(nvaeMark);
                                        }
                                    }
                                }

                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }
                                    const nvae = new NoViableAltException("", 19, 7, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }

                        } else {
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException("", 19, 2, this.input);
                                throw nvae;
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(nvaeMark);
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Lexer.WILDCARD: {
                    {
                        const LA19_3 = this.input.LA(2);
                        if ((LA19_3 === Constants.DOWN)) {
                            alt19 = 4;
                        } else {
                            if ((LA19_3 === ANTLRv4Lexer.EOF || (LA19_3 >= Constants.UP && LA19_3 <= ANTLRv4Lexer.ACTION) || LA19_3 === ANTLRv4Lexer.ASSIGN || LA19_3 === ANTLRv4Lexer.DOT || LA19_3 === ANTLRv4Lexer.LEXER_CHAR_SET || LA19_3 === ANTLRv4Lexer.NOT || LA19_3 === ANTLRv4Lexer.PLUS_ASSIGN || LA19_3 === ANTLRv4Lexer.RANGE || LA19_3 === ANTLRv4Lexer.RULE_REF || LA19_3 === ANTLRv4Lexer.SEMPRED || LA19_3 === ANTLRv4Lexer.STRING_LITERAL || LA19_3 === ANTLRv4Lexer.TOKEN_REF || (LA19_3 >= ANTLRv4Lexer.BLOCK && LA19_3 <= ANTLRv4Lexer.CLOSURE) || (LA19_3 >= ANTLRv4Lexer.OPTIONAL && LA19_3 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA19_3 >= ANTLRv4Lexer.SET && LA19_3 <= ANTLRv4Lexer.WILDCARD))) {
                                alt19 = 5;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae = new NoViableAltException("", 19, 3, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    }
                    break;
                }

                case ANTLRv4Lexer.SET: {
                    {
                        alt19 = 6;
                    }
                    break;
                }

                case ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer.TOKEN_REF: {
                    {
                        alt19 = 7;
                    }
                    break;
                }

                case ANTLRv4Lexer.RULE_REF: {
                    {
                        alt19 = 8;
                    }
                    break;
                }

                default: {
                    const nvae = new NoViableAltException("", 19, 0, this.input);
                    throw nvae;
                }

            }
            switch (alt19) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:176:4: range
                    {
                        const range24 = this.range();

                        retval.p = range24!;
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:177:4: ^( DOT ID terminal )
                    {
                        this.match(this.input, ANTLRv4Lexer.DOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        const terminal25 = this.terminal();

                        this.match(this.input, Constants.UP, null);

                        retval.p = terminal25.p;
                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:178:4: ^( DOT ID ruleref )
                    {
                        this.match(this.input, ANTLRv4Lexer.DOT, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        const ruleref26 = this.ruleref();

                        this.match(this.input, Constants.UP, null);

                        retval.p = ruleref26!;
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/ATNBuilder.g:179:7: ^( WILDCARD . )
                    {
                        this.match(this.input, ANTLRv4Lexer.WILDCARD, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                        retval.p = this.factory!.wildcard((retval.start as GrammarAST));
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/ATNBuilder.g:180:7: WILDCARD
                    {
                        this.match(this.input, ANTLRv4Lexer.WILDCARD, null);
                        retval.p = this.factory!.wildcard((retval.start as GrammarAST));
                    }
                    break;
                }

                case 6: {
                    // org/antlr/v4/parse/ATNBuilder.g:181:7: blockSet[false]
                    {
                        const blockSet27 = this.blockSet(false);

                        retval.p = blockSet27.p;
                    }
                    break;
                }

                case 7: {
                    // org/antlr/v4/parse/ATNBuilder.g:182:9: terminal
                    {
                        const terminal28 = this.terminal();

                        retval.p = terminal28.p;
                    }
                    break;
                }

                case 8: {
                    // org/antlr/v4/parse/ATNBuilder.g:183:9: ruleref
                    {
                        const ruleref29 = this.ruleref();

                        retval.p = ruleref29!;
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
    // $ANTLR end "atom"

    // $ANTLR start "ruleref"
    // org/antlr/v4/parse/ATNBuilder.g:186:1: ruleref returns [IStatePair p] : ( ^( RULE_REF ( ARG_ACTION )? ^( ELEMENT_OPTIONS ( . )* ) ) | ^( RULE_REF ( ARG_ACTION )? ) | RULE_REF );
    public ruleref(): IStatePair | null {
        let p = null;

        let RULE_REF30 = null;
        let RULE_REF31 = null;
        let RULE_REF32 = null;

        try {
            // org/antlr/v4/parse/ATNBuilder.g:187:5: ( ^( RULE_REF ( ARG_ACTION )? ^( ELEMENT_OPTIONS ( . )* ) ) | ^( RULE_REF ( ARG_ACTION )? ) | RULE_REF )
            let alt23 = 3;
            const LA23_0 = this.input.LA(1);
            if ((LA23_0 === ANTLRv4Lexer.RULE_REF)) {
                const LA23_1 = this.input.LA(2);
                if ((LA23_1 === Constants.DOWN)) {
                    switch (this.input.LA(3)) {
                        case ANTLRv4Lexer.ARG_ACTION: {
                            {
                                const LA23_4 = this.input.LA(4);
                                if ((LA23_4 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                                    alt23 = 1;
                                } else {
                                    if ((LA23_4 === Constants.UP)) {
                                        alt23 = 2;
                                    } else {
                                        const nvaeMark = this.input.mark();
                                        const lastIndex = this.input.index;
                                        try {
                                            for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                                this.input.consume();
                                            }
                                            const nvae = new NoViableAltException("", 23, 4, this.input);
                                            throw nvae;
                                        } finally {
                                            this.input.seek(lastIndex);
                                            this.input.release(nvaeMark);
                                        }
                                    }
                                }

                            }
                            break;
                        }

                        case ANTLRv4Lexer.ELEMENT_OPTIONS: {
                            {
                                alt23 = 1;
                            }
                            break;
                        }

                        case Constants.UP: {
                            {
                                alt23 = 2;
                            }
                            break;
                        }

                        default: {
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                    this.input.consume();
                                }
                                const nvae =
                                    new NoViableAltException("", 23, 2, this.input);
                                throw nvae;
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(nvaeMark);
                            }
                        }

                    }
                } else {
                    if ((LA23_1 === ANTLRv4Lexer.EOF || (LA23_1 >= Constants.UP && LA23_1 <= ANTLRv4Lexer.ACTION) || LA23_1 === ANTLRv4Lexer.ASSIGN || LA23_1 === ANTLRv4Lexer.DOT || LA23_1 === ANTLRv4Lexer.LEXER_CHAR_SET || LA23_1 === ANTLRv4Lexer.NOT || LA23_1 === ANTLRv4Lexer.PLUS_ASSIGN || LA23_1 === ANTLRv4Lexer.RANGE || LA23_1 === ANTLRv4Lexer.RULE_REF || LA23_1 === ANTLRv4Lexer.SEMPRED || LA23_1 === ANTLRv4Lexer.STRING_LITERAL || LA23_1 === ANTLRv4Lexer.TOKEN_REF || (LA23_1 >= ANTLRv4Lexer.BLOCK && LA23_1 <= ANTLRv4Lexer.CLOSURE) || (LA23_1 >= ANTLRv4Lexer.OPTIONAL && LA23_1 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA23_1 >= ANTLRv4Lexer.SET && LA23_1 <= ANTLRv4Lexer.WILDCARD))) {
                        alt23 = 3;
                    } else {
                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            const nvae =
                                new NoViableAltException("", 23, 1, this.input);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                }

            } else {
                const nvae =
                    new NoViableAltException("", 23, 0, this.input);
                throw nvae;
            }

            switch (alt23) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:187:7: ^( RULE_REF ( ARG_ACTION )? ^( ELEMENT_OPTIONS ( . )* ) )
                    {
                        RULE_REF30 = this.match(this.input, ANTLRv4Lexer.RULE_REF, null) as GrammarAST;
                        this.match(this.input, Constants.DOWN, null);
                        // org/antlr/v4/parse/ATNBuilder.g:187:18: ( ARG_ACTION )?
                        let alt20 = 2;
                        const LA20_0 = this.input.LA(1);
                        if ((LA20_0 === ANTLRv4Lexer.ARG_ACTION)) {
                            alt20 = 1;
                        }
                        switch (alt20) {
                            case 1: {
                                // org/antlr/v4/parse/ATNBuilder.g:187:18: ARG_ACTION
                                {
                                    this.match(this.input, ANTLRv4Lexer.ARG_ACTION, null);
                                }
                                break;
                            }

                            default:

                        }

                        this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS, null);
                        if (this.input.LA(1) === Constants.DOWN) {
                            this.match(this.input, Constants.DOWN, null);
                            // org/antlr/v4/parse/ATNBuilder.g:187:48: ( . )*
                            loop21:
                            while (true) {
                                let alt21 = 2;
                                const LA21_0 = this.input.LA(1);
                                if (((LA21_0 >= ANTLRv4Lexer.ACTION && LA21_0 <= ANTLRv4Lexer.WILDCARD))) {
                                    alt21 = 1;
                                } else {
                                    if ((LA21_0 === Constants.UP)) {
                                        alt21 = 2;
                                    }
                                }

                                switch (alt21) {
                                    case 1: {
                                        // org/antlr/v4/parse/ATNBuilder.g:187:48: .
                                        {
                                            this.matchAny(this.input);
                                        }
                                        break;
                                    }

                                    default: {
                                        break loop21;
                                    }

                                }
                            }

                            this.match(this.input, Constants.UP, null);
                        }

                        this.match(this.input, Constants.UP, null);

                        p = this.factory!.ruleRef(RULE_REF30);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:188:7: ^( RULE_REF ( ARG_ACTION )? )
                    {
                        RULE_REF31 = this.match(this.input, ANTLRv4Lexer.RULE_REF, null) as GrammarAST;
                        if (this.input.LA(1) === Constants.DOWN) {
                            this.match(this.input, Constants.DOWN, null);
                            // org/antlr/v4/parse/ATNBuilder.g:188:18: ( ARG_ACTION )?
                            let alt22 = 2;
                            const LA22_0 = this.input.LA(1);
                            if ((LA22_0 === ANTLRv4Lexer.ARG_ACTION)) {
                                alt22 = 1;
                            }
                            switch (alt22) {
                                case 1: {
                                    // org/antlr/v4/parse/ATNBuilder.g:188:18: ARG_ACTION
                                    {
                                        this.match(this.input, ANTLRv4Lexer.ARG_ACTION, null);
                                    }
                                    break;
                                }

                                default:

                            }

                            this.match(this.input, Constants.UP, null);
                        }

                        p = this.factory!.ruleRef(RULE_REF31);
                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:189:7: RULE_REF
                    {
                        RULE_REF32 = this.match(this.input, ANTLRv4Lexer.RULE_REF, null) as GrammarAST;
                        p = this.factory!.ruleRef(RULE_REF32);
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

        return p;
    }
    // $ANTLR end "ruleref"

    // $ANTLR start "range"
    // org/antlr/v4/parse/ATNBuilder.g:192:1: range returns [IStatePair p] : ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) ;
    public range(): IStatePair | null {
        let p = null;

        let a = null;
        let b = null;

        try {
            // org/antlr/v4/parse/ATNBuilder.g:193:5: ( ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) )
            // org/antlr/v4/parse/ATNBuilder.g:193:7: ^( RANGE a= STRING_LITERAL b= STRING_LITERAL )
            {
                this.match(this.input, ANTLRv4Lexer.RANGE, null);
                this.match(this.input, Constants.DOWN, null);
                a = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null) as GrammarAST;
                b = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null) as GrammarAST;
                this.match(this.input, Constants.UP, null);

                p = this.factory!.range(a, b);
            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return p;
    }

    // $ANTLR start "terminal"
    // org/antlr/v4/parse/ATNBuilder.g:196:1: terminal returns [IStatePair p] : ( ^( STRING_LITERAL . ) | STRING_LITERAL | ^( TOKEN_REF ARG_ACTION . ) | ^( TOKEN_REF . ) | TOKEN_REF );
    public terminal(): ATNBuilder.terminal_return {
        const retval = new ATNBuilder.terminal_return();
        retval.start = this.input.LT(1);

        try {
            // org/antlr/v4/parse/ATNBuilder.g:197:5: ( ^( STRING_LITERAL . ) | STRING_LITERAL | ^( TOKEN_REF ARG_ACTION . ) | ^( TOKEN_REF . ) | TOKEN_REF )
            let alt24 = 5;
            const LA24_0 = this.input.LA(1);
            if ((LA24_0 === ANTLRv4Lexer.STRING_LITERAL)) {
                const LA24_1 = this.input.LA(2);
                if ((LA24_1 === Constants.DOWN)) {
                    alt24 = 1;
                } else {
                    if ((LA24_1 === ANTLRv4Lexer.EOF || (LA24_1 >= Constants.UP && LA24_1 <= ANTLRv4Lexer.ACTION) || LA24_1 === ANTLRv4Lexer.ASSIGN || LA24_1 === ANTLRv4Lexer.DOT || LA24_1 === ANTLRv4Lexer.LEXER_CHAR_SET || LA24_1 === ANTLRv4Lexer.NOT || LA24_1 === ANTLRv4Lexer.PLUS_ASSIGN || LA24_1 === ANTLRv4Lexer.RANGE || LA24_1 === ANTLRv4Lexer.RULE_REF || LA24_1 === ANTLRv4Lexer.SEMPRED || LA24_1 === ANTLRv4Lexer.STRING_LITERAL || LA24_1 === ANTLRv4Lexer.TOKEN_REF || (LA24_1 >= ANTLRv4Lexer.BLOCK && LA24_1 <= ANTLRv4Lexer.CLOSURE) || (LA24_1 >= ANTLRv4Lexer.OPTIONAL && LA24_1 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA24_1 >= ANTLRv4Lexer.SET && LA24_1 <= ANTLRv4Lexer.WILDCARD))) {
                        alt24 = 2;
                    } else {
                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            const nvae = new NoViableAltException("", 24, 1, this.input);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                }

            } else {
                if ((LA24_0 === ANTLRv4Lexer.TOKEN_REF)) {
                    const LA24_2 = this.input.LA(2);
                    if ((LA24_2 === Constants.DOWN)) {
                        const LA24_5 = this.input.LA(3);
                        if ((LA24_5 === ANTLRv4Lexer.ARG_ACTION)) {
                            const LA24_7 = this.input.LA(4);
                            if (((LA24_7 >= ANTLRv4Lexer.ACTION && LA24_7 <= ANTLRv4Lexer.WILDCARD))) {
                                alt24 = 3;
                            } else {
                                if (((LA24_7 >= Constants.DOWN && LA24_7 <= Constants.UP))) {
                                    alt24 = 4;
                                } else {
                                    const nvaeMark = this.input.mark();
                                    const lastIndex = this.input.index;
                                    try {
                                        for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                            this.input.consume();
                                        }
                                        const nvae = new NoViableAltException("", 24, 7, this.input);
                                        throw nvae;
                                    } finally {
                                        this.input.seek(lastIndex);
                                        this.input.release(nvaeMark);
                                    }
                                }
                            }

                        } else {
                            if (((LA24_5 >= ANTLRv4Lexer.ACTION && LA24_5 <= ANTLRv4Lexer.ACTION_STRING_LITERAL) || (LA24_5 >= ANTLRv4Lexer.ARG_OR_CHARSET && LA24_5 <= ANTLRv4Lexer.WILDCARD))) {
                                alt24 = 4;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }
                                    const nvae = new NoViableAltException("", 24, 5, this.input);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    } else {
                        if ((LA24_2 === ANTLRv4Lexer.EOF || (LA24_2 >= Constants.UP && LA24_2 <= ANTLRv4Lexer.ACTION) || LA24_2 === ANTLRv4Lexer.ASSIGN || LA24_2 === ANTLRv4Lexer.DOT || LA24_2 === ANTLRv4Lexer.LEXER_CHAR_SET || LA24_2 === ANTLRv4Lexer.NOT || LA24_2 === ANTLRv4Lexer.PLUS_ASSIGN || LA24_2 === ANTLRv4Lexer.RANGE || LA24_2 === ANTLRv4Lexer.RULE_REF || LA24_2 === ANTLRv4Lexer.SEMPRED || LA24_2 === ANTLRv4Lexer.STRING_LITERAL || LA24_2 === ANTLRv4Lexer.TOKEN_REF || (LA24_2 >= ANTLRv4Lexer.BLOCK && LA24_2 <= ANTLRv4Lexer.CLOSURE) || (LA24_2 >= ANTLRv4Lexer.OPTIONAL && LA24_2 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA24_2 >= ANTLRv4Lexer.SET && LA24_2 <= ANTLRv4Lexer.WILDCARD))) {
                            alt24 = 5;
                        } else {
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException("", 24, 2, this.input);
                                throw nvae;
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException("", 24, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt24) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:197:8: ^( STRING_LITERAL . )
                    {
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                        retval.p = this.factory!.stringLiteral((retval.start as GrammarAST) as TerminalAST)!;
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:198:7: STRING_LITERAL
                    {
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null);
                        retval.p = this.factory!.stringLiteral((retval.start as GrammarAST) as TerminalAST)!;
                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:199:7: ^( TOKEN_REF ARG_ACTION . )
                    {
                        this.match(this.input, ANTLRv4Lexer.TOKEN_REF, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ARG_ACTION, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                        retval.p = this.factory!.tokenRef((retval.start as GrammarAST) as TerminalAST)!;
                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/ATNBuilder.g:200:7: ^( TOKEN_REF . )
                    {
                        this.match(this.input, ANTLRv4Lexer.TOKEN_REF, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.matchAny(this.input);
                        this.match(this.input, Constants.UP, null);

                        retval.p = this.factory!.tokenRef((retval.start as GrammarAST) as TerminalAST)!;
                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/ATNBuilder.g:201:7: TOKEN_REF
                    {
                        this.match(this.input, ANTLRv4Lexer.TOKEN_REF, null);
                        retval.p = this.factory!.tokenRef((retval.start as GrammarAST) as TerminalAST)!;
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
    // $ANTLR end "terminal"

    // $ANTLR start "elementOptions"
    // org/antlr/v4/parse/ATNBuilder.g:204:1: elementOptions : ^( ELEMENT_OPTIONS ( elementOption )* ) ;
    public elementOptions(): void {
        try {
            // org/antlr/v4/parse/ATNBuilder.g:205:2: ( ^( ELEMENT_OPTIONS ( elementOption )* ) )
            // org/antlr/v4/parse/ATNBuilder.g:205:4: ^( ELEMENT_OPTIONS ( elementOption )* )
            {
                this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS, null);
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN, null);
                    // org/antlr/v4/parse/ATNBuilder.g:205:22: ( elementOption )*
                    loop25:
                    while (true) {
                        let alt25 = 2;
                        const LA25_0 = this.input.LA(1);
                        if ((LA25_0 === ANTLRv4Lexer.ASSIGN || LA25_0 === ANTLRv4Lexer.ID)) {
                            alt25 = 1;
                        }

                        switch (alt25) {
                            case 1: {
                                // org/antlr/v4/parse/ATNBuilder.g:205:22: elementOption
                                {
                                    this.elementOption();

                                }
                                break;
                            }

                            default: {
                                break loop25;
                            }

                        }
                    }

                    this.match(this.input, Constants.UP, null);
                }

            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

    }
    // $ANTLR end "elementOptions"

    // $ANTLR start "elementOption"
    // org/antlr/v4/parse/ATNBuilder.g:208:1: elementOption : ( ID | ^( ASSIGN ID ID ) | ^( ASSIGN ID STRING_LITERAL ) | ^( ASSIGN ID ACTION ) | ^( ASSIGN ID INT ) );
    public elementOption(): void {
        try {
            // org/antlr/v4/parse/ATNBuilder.g:209:2: ( ID | ^( ASSIGN ID ID ) | ^( ASSIGN ID STRING_LITERAL ) | ^( ASSIGN ID ACTION ) | ^( ASSIGN ID INT ) )
            let alt26 = 5;
            const LA26_0 = this.input.LA(1);
            if ((LA26_0 === ANTLRv4Lexer.ID)) {
                alt26 = 1;
            } else {
                if ((LA26_0 === ANTLRv4Lexer.ASSIGN)) {
                    const LA26_2 = this.input.LA(2);
                    if ((LA26_2 === Constants.DOWN)) {
                        const LA26_3 = this.input.LA(3);
                        if ((LA26_3 === ANTLRv4Lexer.ID)) {
                            switch (this.input.LA(4)) {
                                case ANTLRv4Lexer.ID: {
                                    {
                                        alt26 = 2;
                                    }
                                    break;
                                }

                                case ANTLRv4Lexer.STRING_LITERAL: {
                                    {
                                        alt26 = 3;
                                    }
                                    break;
                                }

                                case ANTLRv4Lexer.ACTION: {
                                    {
                                        alt26 = 4;
                                    }
                                    break;
                                }

                                case ANTLRv4Lexer.INT: {
                                    {
                                        alt26 = 5;
                                    }
                                    break;
                                }

                                default: {
                                    const nvaeMark = this.input.mark();
                                    const lastIndex = this.input.index;
                                    try {
                                        for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                            this.input.consume();
                                        }
                                        const nvae = new NoViableAltException("", 26, 4, this.input);
                                        throw nvae;
                                    } finally {
                                        this.input.seek(lastIndex);
                                        this.input.release(nvaeMark);
                                    }
                                }

                            }
                        } else {
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                    this.input.consume();
                                }
                                const nvae = new NoViableAltException("", 26, 3, this.input);
                                throw nvae;
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(nvaeMark);
                            }
                        }

                    } else {
                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            const nvae = new NoViableAltException("", 26, 2, this.input);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException("", 26, 0, this.input);
                    throw nvae;
                }
            }

            switch (alt26) {
                case 1: {
                    // org/antlr/v4/parse/ATNBuilder.g:209:4: ID
                    {
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                    }
                    break;
                }

                case 2: {
                    // org/antlr/v4/parse/ATNBuilder.g:210:4: ^( ASSIGN ID ID )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 3: {
                    // org/antlr/v4/parse/ATNBuilder.g:211:4: ^( ASSIGN ID STRING_LITERAL )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL, null);
                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 4: {
                    // org/antlr/v4/parse/ATNBuilder.g:212:4: ^( ASSIGN ID ACTION )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        this.match(this.input, ANTLRv4Lexer.ACTION, null);
                        this.match(this.input, Constants.UP, null);

                    }
                    break;
                }

                case 5: {
                    // org/antlr/v4/parse/ATNBuilder.g:213:4: ^( ASSIGN ID INT )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN, null);
                        this.match(this.input, Constants.DOWN, null);
                        this.match(this.input, ANTLRv4Lexer.ID, null);
                        this.match(this.input, ANTLRv4Lexer.INT, null);
                        this.match(this.input, Constants.UP, null);

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
    }
}

export namespace ATNBuilder {
    export type lexerCommandExpr_return = InstanceType<typeof ATNBuilder.lexerCommandExpr_return>;
    export type element_return = InstanceType<typeof ATNBuilder.element_return>;
    export type subrule_return = InstanceType<typeof ATNBuilder.subrule_return>;
    export type blockSet_return = InstanceType<typeof ATNBuilder.blockSet_return>;
    export type setElement_return = InstanceType<typeof ATNBuilder.setElement_return>;
    export type atom_return = InstanceType<typeof ATNBuilder.atom_return>;
    export type terminal_return = InstanceType<typeof ATNBuilder.terminal_return>;
}
