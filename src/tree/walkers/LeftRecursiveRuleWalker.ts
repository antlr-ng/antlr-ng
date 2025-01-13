/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable max-len, @typescript-eslint/naming-convention */
// cspell: disable

import { FailedPredicateException } from "../FailedPredicateException.js";
import { createRecognizerSharedState, IRecognizerSharedState } from "../misc/IRecognizerSharedState.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { TreeParser } from "../TreeParser.js";
import { TreeRuleReturnScope } from "../../antlr3/tree/TreeRuleReturnScope.js";
import { Constants } from "../../Constants.js";
import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";
import type { AltAST } from "../../tool/ast/AltAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { EarlyExitException } from "../EarlyExitException.js";
import { MismatchedSetException } from "../MismatchedSetException.js";
import { NoViableAltException } from "../NoViableAltException.js";

/** Find left-recursive rules */
export class LeftRecursiveRuleWalker extends TreeParser {
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
        "RULE", "RULEMODIFIERS", "RULES", "SET", "WILDCARD", "PRIVATE", "PROTECTED",
        "PUBLIC"
    ];

    public static ruleBlock_return = class ruleBlock_return extends TreeRuleReturnScope {
        public isLeftRec: boolean;
    };

    // $ANTLR end "ruleBlock"

    public static outerAlternative_return = class outerAlternative_return extends TreeRuleReturnScope {
        public isLeftRec: boolean;
    };

    protected static readonly DFA14_transition: Int16Array[]; // which outer alt of rule?
    public numAlts: number;

    protected ruleName: string;

    private currentOuterAltNumber: number;

    // delegators

    public constructor(input: CommonTreeNodeStream, state?: IRecognizerSharedState) {
        super(input, state ?? createRecognizerSharedState());
    }

    // delegates
    public getDelegates(): TreeParser[] {
        return [];
    }

    public override getTokenNames(): string[] {
        return LeftRecursiveRuleWalker.tokenNames;
    }

    public setAltAssoc(altTree: AltAST, alt: number): void { /**/ }
    public binaryAlt(altTree: AltAST, alt: number): void { /**/ }
    public prefixAlt(altTree: AltAST, alt: number): void { /**/ }
    public suffixAlt(altTree: AltAST, alt: number): void {/**/ }
    public otherAlt(altTree: AltAST, alt: number): void { /**/ }
    public setReturnValues(t: GrammarAST): void { /**/ }

    // $ANTLR start "rec_rule"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:64:1: public rec_rule returns [boolean isLeftRec] : ^(r= RULE id= RULE_REF ( ruleModifier )? ( ^( RETURNS a= ARG_ACTION ) )? ( ^( LOCALS ARG_ACTION ) )? ( ^( OPTIONS ( . )* ) | ^( AT ID ACTION ) )* ruleBlock exceptionGroup ) ;
    public rec_rule(): boolean {
        let isLeftRec = false;

        let id = null;
        let a = null;
        let ruleBlock1 = null;

        this.currentOuterAltNumber = 1;

        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:69:2: ( ^(r= RULE id= RULE_REF ( ruleModifier )? ( ^( RETURNS a= ARG_ACTION ) )? ( ^( LOCALS ARG_ACTION ) )? ( ^( OPTIONS ( . )* ) | ^( AT ID ACTION ) )* ruleBlock exceptionGroup ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:69:4: ^(r= RULE id= RULE_REF ( ruleModifier )? ( ^( RETURNS a= ARG_ACTION ) )? ( ^( LOCALS ARG_ACTION ) )? ( ^( OPTIONS ( . )* ) | ^( AT ID ACTION ) )* ruleBlock exceptionGroup )
        {
            this.match(this.input, ANTLRv4Lexer.RULE);

            if (this.state.failed) {
                return isLeftRec;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return isLeftRec;
            }

            id = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return isLeftRec;
            }

            if (this.state.backtracking === 0) {
                this.ruleName = id.getText()!;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:70:4: ( ruleModifier )?
            let alt1 = 2;
            const LA1_0 = this.input.LA(1);
            if (((LA1_0 >= ANTLRv4Lexer.PRIVATE && LA1_0 <= ANTLRv4Lexer.PUBLIC))) {
                alt1 = 1;
            }
            switch (alt1) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:70:4: ruleModifier
                    {
                        this.ruleModifier();

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                    }
                    break;
                }

                default:

            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:72:4: ( ^( RETURNS a= ARG_ACTION ) )?
            let alt2 = 2;
            const LA2_0 = this.input.LA(1);
            if ((LA2_0 === ANTLRv4Lexer.RETURNS)) {
                alt2 = 1;
            }
            switch (alt2) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:72:5: ^( RETURNS a= ARG_ACTION )
                    {
                        this.match(this.input, ANTLRv4Lexer.RETURNS);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, Constants.DOWN);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                        a = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                        if (this.state.backtracking === 0) {
                            this.setReturnValues(a);
                        }
                        this.match(this.input, Constants.UP);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                    }
                    break;
                }

                default:

            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:74:9: ( ^( LOCALS ARG_ACTION ) )?
            let alt3 = 2;
            const LA3_0 = this.input.LA(1);
            if ((LA3_0 === ANTLRv4Lexer.LOCALS)) {
                alt3 = 1;
            }
            switch (alt3) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:74:11: ^( LOCALS ARG_ACTION )
                    {
                        this.match(this.input, ANTLRv4Lexer.LOCALS);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, Constants.DOWN);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, ANTLRv4Lexer.ARG_ACTION);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, Constants.UP);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return isLeftRec;
                        }

                    }
                    break;
                }

                default:

            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:75:9: ( ^( OPTIONS ( . )* ) | ^( AT ID ACTION ) )*
            loop5:
            while (true) {
                let alt5 = 3;
                const LA5_0 = this.input.LA(1);
                if ((LA5_0 === ANTLRv4Lexer.OPTIONS)) {
                    alt5 = 1;
                } else {
                    if ((LA5_0 === ANTLRv4Lexer.AT)) {
                        alt5 = 2;
                    }
                }

                switch (alt5) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:75:11: ^( OPTIONS ( . )* )
                        {
                            this.match(this.input, ANTLRv4Lexer.OPTIONS);

                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return isLeftRec;
                            }

                            if (this.input.LA(1) === Constants.DOWN) {
                                this.match(this.input, Constants.DOWN);

                                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                if (this.state.failed) {
                                    return isLeftRec;
                                }

                                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:75:21: ( . )*
                                loop4:
                                while (true) {
                                    let alt4 = 2;
                                    const LA4_0 = this.input.LA(1);
                                    if (((LA4_0 >= ANTLRv4Lexer.ACTION && LA4_0 <= ANTLRv4Lexer.PUBLIC))) {
                                        alt4 = 1;
                                    } else {
                                        if ((LA4_0 === Constants.UP)) {
                                            alt4 = 2;
                                        }
                                    }

                                    switch (alt4) {
                                        case 1: {
                                            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:75:21: .
                                            {
                                                this.matchAny();

                                                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                                if (this.state.failed) {
                                                    return isLeftRec;
                                                }

                                            }
                                            break;
                                        }

                                        default: {
                                            break loop4;
                                        }

                                    }
                                }

                                this.match(this.input, Constants.UP);

                                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                if (this.state.failed) {
                                    return isLeftRec;
                                }

                            }

                        }
                        break;
                    }

                    case 2: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:76:11: ^( AT ID ACTION )
                        {
                            this.match(this.input, ANTLRv4Lexer.AT);

                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, Constants.DOWN);

                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, ANTLRv4Lexer.ID);

                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, ANTLRv4Lexer.ACTION);

                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, Constants.UP);

                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return isLeftRec;
                            }

                        }
                        break;
                    }

                    default: {
                        break loop5;
                    }

                }
            }

            ruleBlock1 = this.ruleBlock();

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return isLeftRec;
            }

            if (this.state.backtracking === 0) {
                isLeftRec = ruleBlock1.isLeftRec;
            }
            this.exceptionGroup();

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return isLeftRec;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return isLeftRec;
            }

        }

        return isLeftRec;
    }
    // $ANTLR end "rec_rule"

    // $ANTLR start "exceptionGroup"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:83:1: exceptionGroup : ( exceptionHandler )* ( finallyClause )? ;
    public exceptionGroup(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:84:5: ( ( exceptionHandler )* ( finallyClause )? )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:84:7: ( exceptionHandler )* ( finallyClause )?
        {
            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:84:7: ( exceptionHandler )*
            loop6:
            while (true) {
                let alt6 = 2;
                const LA6_0 = this.input.LA(1);
                if ((LA6_0 === ANTLRv4Lexer.CATCH)) {
                    alt6 = 1;
                }

                switch (alt6) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:84:7: exceptionHandler
                        {
                            this.exceptionHandler();

                            if (this.state.failed) {
                                return;
                            }

                        }
                        break;
                    }

                    default: {
                        break loop6;
                    }

                }
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:84:25: ( finallyClause )?
            let alt7 = 2;
            const LA7_0 = this.input.LA(1);
            if ((LA7_0 === ANTLRv4Lexer.FINALLY)) {
                alt7 = 1;
            }
            switch (alt7) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:84:25: finallyClause
                    {
                        this.finallyClause();

                        if (this.state.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

        }

    }
    // $ANTLR end "exceptionGroup"

    // $ANTLR start "exceptionHandler"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:87:1: exceptionHandler : ^( CATCH ARG_ACTION ACTION ) ;
    public exceptionHandler(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:88:2: ( ^( CATCH ARG_ACTION ACTION ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:88:4: ^( CATCH ARG_ACTION ACTION )
        {
            this.match(this.input, ANTLRv4Lexer.CATCH);

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            this.match(this.input, ANTLRv4Lexer.ARG_ACTION);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            this.match(this.input, ANTLRv4Lexer.ACTION);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end "exceptionHandler"

    // $ANTLR start "finallyClause"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:91:1: finallyClause : ^( FINALLY ACTION ) ;
    public finallyClause(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:92:2: ( ^( FINALLY ACTION ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:92:4: ^( FINALLY ACTION )
        {
            this.match(this.input, ANTLRv4Lexer.FINALLY);

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            this.match(this.input, ANTLRv4Lexer.ACTION);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end "finallyClause"

    // $ANTLR start "ruleModifier"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:95:1: ruleModifier : ( PUBLIC | PRIVATE | PROTECTED );
    public ruleModifier(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:96:5: ( PUBLIC | PRIVATE | PROTECTED )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:
        {
            if ((this.input.LA(1) >= ANTLRv4Lexer.PRIVATE
                && this.input.LA(1) <= ANTLRv4Lexer.PUBLIC)) {
                this.input.consume();
                this.state.errorRecovery = false;
                this.state.failed = false;
            } else {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                const mse = new MismatchedSetException(null);
                throw mse;
            }
        }

    }

    // $ANTLR start "ruleBlock"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:101:1: ruleBlock returns [boolean isLeftRec] : ^( BLOCK (o= outerAlternative )+ ) ;
    public ruleBlock(): LeftRecursiveRuleWalker.ruleBlock_return {
        const retval = new LeftRecursiveRuleWalker.ruleBlock_return();
        retval.start = this.input.LT(1);

        let o = null;

        this.numAlts = (retval.start as GrammarAST).getChildCount();
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:103:2: ( ^( BLOCK (o= outerAlternative )+ ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:103:4: ^( BLOCK (o= outerAlternative )+ )
        {
            this.match(this.input, ANTLRv4Lexer.BLOCK);

            if (this.state.failed) {
                return retval;
            }

            this.match(this.input, Constants.DOWN);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return retval;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:104:4: (o= outerAlternative )+
            let cnt8 = 0;
            loop8:
            while (true) {
                let alt8 = 2;
                const LA8_0 = this.input.LA(1);
                if ((LA8_0 === ANTLRv4Lexer.ALT)) {
                    alt8 = 1;
                }

                switch (alt8) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:105:5: o= outerAlternative
                        {
                            o = this.outerAlternative();
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return retval;
                            }

                            if (this.state.backtracking === 0) {
                                if (o.isLeftRec) {
                                    retval.isLeftRec = true;
                                }
                            }
                            if (this.state.backtracking === 0) {
                                this.currentOuterAltNumber++;
                            }
                        }
                        break;
                    }

                    default: {
                        if (cnt8 >= 1) {
                            break loop8;
                        }

                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return retval;
                        }
                        const eee = new EarlyExitException(8);
                        throw eee;
                    }

                }
                cnt8++;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return retval;
            }

        }

        return retval;
    }

    // $ANTLR start "outerAlternative"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:113:1: outerAlternative returns [boolean isLeftRec] : ( ( binary )=> binary | ( prefix )=> prefix | ( suffix )=> suffix | nonLeftRecur );
    public outerAlternative(): LeftRecursiveRuleWalker.outerAlternative_return {
        const retval = new LeftRecursiveRuleWalker.outerAlternative_return();
        retval.start = this.input.LT(1);

        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:114:5: ( ( binary )=> binary | ( prefix )=> prefix | ( suffix )=> suffix | nonLeftRecur )
        let alt9 = 4;
        const LA9_0 = this.input.LA(1);
        if ((LA9_0 === ANTLRv4Lexer.ALT)) {
            if ((this.synpred1_LeftRecursiveRuleWalker())) {
                alt9 = 1;
            } else {
                if ((this.synpred2_LeftRecursiveRuleWalker())) {
                    alt9 = 2;
                } else {
                    if ((this.synpred3_LeftRecursiveRuleWalker())) {
                        alt9 = 3;
                    } else {
                        alt9 = 4;
                    }

                }

            }
        } else {
            if (this.state.backtracking > 0) {
                this.state.failed = true;

                return retval;
            }
            const nvae = new NoViableAltException(9, 0);
            throw nvae;
        }

        switch (alt9) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:114:9: ( binary )=> binary
                {
                    this.binary();

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 0) {
                        this.binaryAlt((retval.start as GrammarAST) as AltAST, this.currentOuterAltNumber); retval.isLeftRec = true;
                    }
                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:116:9: ( prefix )=> prefix
                {
                    this.prefix();

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 0) {
                        this.prefixAlt((retval.start as GrammarAST) as AltAST, this.currentOuterAltNumber);
                    }
                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:118:9: ( suffix )=> suffix
                {
                    this.suffix();

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 0) {
                        this.suffixAlt((retval.start as GrammarAST) as AltAST, this.currentOuterAltNumber); retval.isLeftRec = true;
                    }
                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:120:9: nonLeftRecur
                {
                    this.nonLeftRecur();

                    if (this.state.failed) {
                        return retval;
                    }

                    if (this.state.backtracking === 0) {
                        this.otherAlt((retval.start as GrammarAST) as AltAST, this.currentOuterAltNumber);
                    }
                }
                break;
            }

            default:

        }

        return retval;
    }
    // $ANTLR end "outerAlternative"

    // $ANTLR start "binary"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:123:1: binary : ^( ALT ( elementOptions )? recurse ( element )* recurse ( epsilonElement )* ) ;
    public binary(): void {
        let ALT2 = null;

        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:124:2: ( ^( ALT ( elementOptions )? recurse ( element )* recurse ( epsilonElement )* ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:124:4: ^( ALT ( elementOptions )? recurse ( element )* recurse ( epsilonElement )* )
        {
            ALT2 = this.match(this.input, ANTLRv4Lexer.ALT)!;

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:124:11: ( elementOptions )?
            let alt10 = 2;
            const LA10_0 = this.input.LA(1);
            if ((LA10_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt10 = 1;
            }
            switch (alt10) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:124:11: elementOptions
                    {
                        this.elementOptions();
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            this.recurse();

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:124:35: ( element )*
            while (true) {
                if (this.predictElement()) {
                    this.element();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }
                } else {
                    break;
                }
            }

            this.recurse();

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:124:52: ( epsilonElement )*
            loop12:
            while (true) {
                let alt12 = 2;
                const LA12_0 = this.input.LA(1);
                if ((LA12_0 === ANTLRv4Lexer.ACTION || LA12_0 === ANTLRv4Lexer.SEMPRED || LA12_0 === ANTLRv4Lexer.EPSILON)) {
                    alt12 = 1;
                }

                switch (alt12) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:124:52: epsilonElement
                        {
                            this.epsilonElement();

                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return;
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

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            if (this.state.backtracking === 0) {
                this.setAltAssoc(ALT2 as AltAST, this.currentOuterAltNumber);
            }
        }

    }
    // $ANTLR end "binary"

    // $ANTLR start "prefix"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:128:1: prefix : ^( ALT ( elementOptions )? ( element )+ recurse ( epsilonElement )* ) ;
    public prefix(): void {
        let ALT3 = null;

        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:129:2: ( ^( ALT ( elementOptions )? ( element )+ recurse ( epsilonElement )* ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:129:4: ^( ALT ( elementOptions )? ( element )+ recurse ( epsilonElement )* )
        {
            ALT3 = this.match(this.input, ANTLRv4Lexer.ALT)!;

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:129:11: ( elementOptions )?
            let alt13 = 2;
            const LA13_0 = this.input.LA(1);
            if ((LA13_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt13 = 1;
            }
            switch (alt13) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:129:11: elementOptions
                    {
                        this.elementOptions();
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:130:4: ( element )+
            let cnt14 = 0;
            loop14:
            while (true) {
                if (this.predictElement()) {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:130:4: element
                    this.element();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }
                } else {
                    if (cnt14 >= 1) {
                        break loop14;
                    }

                    if (this.state.backtracking > 0) {
                        this.state.failed = true;

                        return;
                    }
                    const eee = new EarlyExitException(14);
                    throw eee;
                }
                cnt14++;
            }

            this.recurse();

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:131:12: ( epsilonElement )*
            loop15:
            while (true) {
                let alt15 = 2;
                const LA15_0 = this.input.LA(1);
                if ((LA15_0 === ANTLRv4Lexer.ACTION || LA15_0 === ANTLRv4Lexer.SEMPRED || LA15_0 === ANTLRv4Lexer.EPSILON)) {
                    alt15 = 1;
                }

                switch (alt15) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:131:12: epsilonElement
                        {
                            this.epsilonElement();
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return;
                            }

                        }
                        break;
                    }

                    default: {
                        break loop15;
                    }

                }
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            if (this.state.backtracking === 0) {
                this.setAltAssoc(ALT3 as AltAST, this.currentOuterAltNumber);
            }
        }

    }
    // $ANTLR end "prefix"

    // $ANTLR start "suffix"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:136:1: suffix : ^( ALT ( elementOptions )? recurse ( element )+ ) ;
    public suffix(): void {
        let ALT4 = null;

        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:137:5: ( ^( ALT ( elementOptions )? recurse ( element )+ ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:137:9: ^( ALT ( elementOptions )? recurse ( element )+ )
        {
            ALT4 = this.match(this.input, ANTLRv4Lexer.ALT)!;

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:137:16: ( elementOptions )?
            let alt16 = 2;
            const LA16_0 = this.input.LA(1);
            if ((LA16_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt16 = 1;
            }
            switch (alt16) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:137:16: elementOptions
                    {
                        this.elementOptions();
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            this.recurse();

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:137:40: ( element )+
            let cnt17 = 0;
            loop17:
            while (true) {
                let alt17 = 2;
                const LA17_0 = this.input.LA(1);
                if ((LA17_0 === ANTLRv4Lexer.ACTION || LA17_0 === ANTLRv4Lexer.ASSIGN || LA17_0 === ANTLRv4Lexer.DOT || LA17_0 === ANTLRv4Lexer.NOT || LA17_0 === ANTLRv4Lexer.PLUS_ASSIGN || LA17_0 === ANTLRv4Lexer.RANGE || LA17_0 === ANTLRv4Lexer.RULE_REF || LA17_0 === ANTLRv4Lexer.SEMPRED || LA17_0 === ANTLRv4Lexer.STRING_LITERAL || LA17_0 === ANTLRv4Lexer.TOKEN_REF || (LA17_0 >= ANTLRv4Lexer.BLOCK && LA17_0 <= ANTLRv4Lexer.CLOSURE) || LA17_0 === ANTLRv4Lexer.EPSILON || (LA17_0 >= ANTLRv4Lexer.OPTIONAL && LA17_0 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA17_0 >= ANTLRv4Lexer.SET && LA17_0 <= ANTLRv4Lexer.WILDCARD))) {
                    alt17 = 1;
                }

                switch (alt17) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:137:40: element
                        {
                            this.element();
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return;
                            }

                        }
                        break;
                    }

                    default: {
                        if (cnt17 >= 1) {
                            break loop17;
                        }

                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(17);
                        throw eee;
                    }

                }
                cnt17++;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            if (this.state.backtracking === 0) {
                this.setAltAssoc(ALT4 as AltAST, this.currentOuterAltNumber);
            }
        }

    }
    // $ANTLR end "suffix"

    // $ANTLR start "nonLeftRecur"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:141:1: nonLeftRecur : ^( ALT ( elementOptions )? ( element )+ ) ;
    public nonLeftRecur(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:142:5: ( ^( ALT ( elementOptions )? ( element )+ ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:142:9: ^( ALT ( elementOptions )? ( element )+ )
        {
            this.match(this.input, ANTLRv4Lexer.ALT);

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:142:15: ( elementOptions )?
            let alt18 = 2;
            const LA18_0 = this.input.LA(1);
            if ((LA18_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt18 = 1;
            }
            switch (alt18) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:142:15: elementOptions
                    {
                        this.elementOptions();
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:142:31: ( element )+
            let cnt19 = 0;
            loop19:
            while (true) {
                let alt19 = 2;
                const LA19_0 = this.input.LA(1);
                if ((LA19_0 === ANTLRv4Lexer.ACTION || LA19_0 === ANTLRv4Lexer.ASSIGN || LA19_0 === ANTLRv4Lexer.DOT || LA19_0 === ANTLRv4Lexer.NOT || LA19_0 === ANTLRv4Lexer.PLUS_ASSIGN || LA19_0 === ANTLRv4Lexer.RANGE || LA19_0 === ANTLRv4Lexer.RULE_REF || LA19_0 === ANTLRv4Lexer.SEMPRED || LA19_0 === ANTLRv4Lexer.STRING_LITERAL || LA19_0 === ANTLRv4Lexer.TOKEN_REF || (LA19_0 >= ANTLRv4Lexer.BLOCK && LA19_0 <= ANTLRv4Lexer.CLOSURE) || LA19_0 === ANTLRv4Lexer.EPSILON || (LA19_0 >= ANTLRv4Lexer.OPTIONAL && LA19_0 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA19_0 >= ANTLRv4Lexer.SET && LA19_0 <= ANTLRv4Lexer.WILDCARD))) {
                    alt19 = 1;
                }

                switch (alt19) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:142:31: element
                        {
                            this.element();
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return;
                            }

                        }
                        break;
                    }

                    default: {
                        if (cnt19 >= 1) {
                            break loop19;
                        }

                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(19);
                        throw eee;
                    }

                }
                cnt19++;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end "nonLeftRecur"

    // $ANTLR start "recurse"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:145:1: recurse : ( ^( ASSIGN ID recurseNoLabel ) | ^( PLUS_ASSIGN ID recurseNoLabel ) | recurseNoLabel );
    public recurse(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:146:2: ( ^( ASSIGN ID recurseNoLabel ) | ^( PLUS_ASSIGN ID recurseNoLabel ) | recurseNoLabel )
        let alt20 = 3;
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.ASSIGN: {
                {
                    alt20 = 1;
                }
                break;
            }

            case ANTLRv4Lexer.PLUS_ASSIGN: {
                {
                    alt20 = 2;
                }
                break;
            }

            case ANTLRv4Lexer.RULE_REF: {
                {
                    alt20 = 3;
                }
                break;
            }

            default: {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                const nvae =
                    new NoViableAltException(20, 0);
                throw nvae;
            }

        }
        switch (alt20) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:146:4: ^( ASSIGN ID recurseNoLabel )
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.recurseNoLabel();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:147:4: ^( PLUS_ASSIGN ID recurseNoLabel )
                {
                    this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.recurseNoLabel();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:148:4: recurseNoLabel
                {
                    this.recurseNoLabel();

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }

    }
    // $ANTLR end "recurse"

    // $ANTLR start "recurseNoLabel"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:151:1: recurseNoLabel :{...}? RULE_REF ;
    public recurseNoLabel(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:151:16: ({...}? RULE_REF )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:151:18: {...}? RULE_REF
        {
            if ((this.input.LT(1)!).getText() !== this.ruleName) {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                throw new FailedPredicateException("recurseNoLabel", "((CommonTree)input.LT(1)).getText().equals(ruleName)");
            }
            this.match(this.input, ANTLRv4Lexer.RULE_REF);

            if (this.state.failed) {
                return;
            }

        }
    }
    // $ANTLR end "recurseNoLabel"

    // $ANTLR start "token"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:153:1: token returns [GrammarAST t=null] : ( ^( ASSIGN ID s= token ) | ^( PLUS_ASSIGN ID s= token ) |b= STRING_LITERAL | ^(b= STRING_LITERAL elementOptions ) | ^(c= TOKEN_REF elementOptions ) |c= TOKEN_REF );
    public token(): GrammarAST | null {
        let t = null;

        let b = null;
        let c = null;
        let s = null;

        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:154:2: ( ^( ASSIGN ID s= token ) | ^( PLUS_ASSIGN ID s= token ) |b= STRING_LITERAL | ^(b= STRING_LITERAL elementOptions ) | ^(c= TOKEN_REF elementOptions ) |c= TOKEN_REF )
        let alt21 = 6;
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.ASSIGN: {
                {
                    alt21 = 1;
                }
                break;
            }

            case ANTLRv4Lexer.PLUS_ASSIGN: {
                {
                    alt21 = 2;
                }
                break;
            }

            case ANTLRv4Lexer.STRING_LITERAL: {
                {
                    const LA21_3 = this.input.LA(2);
                    if ((LA21_3 === Constants.DOWN)) {
                        alt21 = 4;
                    } else {
                        if ((LA21_3 === Constants.UP)) {
                            alt21 = 3;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return t;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(21, 3);
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
                    const LA21_4 = this.input.LA(2);
                    if ((LA21_4 === Constants.DOWN)) {
                        alt21 = 5;
                    } else {
                        if ((LA21_4 === Constants.UP)) {
                            alt21 = 6;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return t;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(21, 4);
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

            default: {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return t;
                }
                const nvae =
                    new NoViableAltException(21, 0);
                throw nvae;
            }

        }
        switch (alt21) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:154:4: ^( ASSIGN ID s= token )
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    s = this.token();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    if (this.state.backtracking === 0) {
                        t = s;
                    }
                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:155:4: ^( PLUS_ASSIGN ID s= token )
                {
                    this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);

                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    s = this.token();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    if (this.state.backtracking === 0) {
                        t = s;
                    }
                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:156:4: b= STRING_LITERAL
                {
                    b = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;

                    if (this.state.failed) {
                        return t;
                    }

                    if (this.state.backtracking === 0) {
                        t = b;
                    }
                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:157:7: ^(b= STRING_LITERAL elementOptions )
                {
                    b = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;

                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    if (this.state.backtracking === 0) {
                        t = b;
                    }
                }
                break;
            }

            case 5: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:158:7: ^(c= TOKEN_REF elementOptions )
                {
                    c = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;

                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return t;
                    }

                    if (this.state.backtracking === 0) {
                        t = c;
                    }
                }
                break;
            }

            case 6: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:159:4: c= TOKEN_REF
                {
                    c = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;

                    if (this.state.failed) {
                        return t;
                    }

                    if (this.state.backtracking === 0) {
                        t = c;
                    }
                }
                break;
            }

            default:

        }

        return t;
    }
    // $ANTLR end "token"

    // $ANTLR start "elementOptions"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:162:1: elementOptions : ^( ELEMENT_OPTIONS ( elementOption )* ) ;
    public elementOptions(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:163:5: ( ^( ELEMENT_OPTIONS ( elementOption )* ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:163:7: ^( ELEMENT_OPTIONS ( elementOption )* )
        {
            this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);

            if (this.state.failed) {
                return;
            }

            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (this.state.failed) {
                    return;
                }

                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:163:25: ( elementOption )*
                loop22:
                while (true) {
                    let alt22 = 2;
                    const LA22_0 = this.input.LA(1);
                    if ((LA22_0 === ANTLRv4Lexer.ASSIGN || LA22_0 === ANTLRv4Lexer.ID)) {
                        alt22 = 1;
                    }

                    switch (alt22) {
                        case 1: {
                            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:163:25: elementOption
                            {
                                this.elementOption();
                                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                if (this.state.failed) {
                                    return;
                                }

                            }
                            break;
                        }

                        default: {
                            break loop22;
                        }

                    }
                }

                this.match(this.input, Constants.UP);

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (this.state.failed) {
                    return;
                }

            }

        }

    }
    // $ANTLR end "elementOptions"

    // $ANTLR start "elementOption"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:166:1: elementOption : ( ID | ^( ASSIGN ID ID ) | ^( ASSIGN ID STRING_LITERAL ) | ^( ASSIGN ID ACTION ) | ^( ASSIGN ID INT ) );
    public elementOption(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:167:5: ( ID | ^( ASSIGN ID ID ) | ^( ASSIGN ID STRING_LITERAL ) | ^( ASSIGN ID ACTION ) | ^( ASSIGN ID INT ) )
        let alt23 = 5;
        const LA23_0 = this.input.LA(1);
        if ((LA23_0 === ANTLRv4Lexer.ID)) {
            alt23 = 1;
        } else {
            if ((LA23_0 === ANTLRv4Lexer.ASSIGN)) {
                const LA23_2 = this.input.LA(2);
                if ((LA23_2 === Constants.DOWN)) {
                    const LA23_3 = this.input.LA(3);
                    if ((LA23_3 === ANTLRv4Lexer.ID)) {
                        switch (this.input.LA(4)) {
                            case ANTLRv4Lexer.ID: {
                                {
                                    alt23 = 2;
                                }
                                break;
                            }

                            case ANTLRv4Lexer.STRING_LITERAL: {
                                {
                                    alt23 = 3;
                                }
                                break;
                            }

                            case ANTLRv4Lexer.ACTION: {
                                {
                                    alt23 = 4;
                                }
                                break;
                            }

                            case ANTLRv4Lexer.INT: {
                                {
                                    alt23 = 5;
                                }
                                break;
                            }

                            default: {
                                if (this.state.backtracking > 0) {
                                    this.state.failed = true;

                                    return;
                                }
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }
                                    const nvae = new NoViableAltException(23, 4);
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

                            return;
                        }
                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                this.input.consume();
                            }
                            const nvae = new NoViableAltException(23, 3);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }

                } else {
                    if (this.state.backtracking > 0) {
                        this.state.failed = true;

                        return;
                    }
                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;
                    try {
                        this.input.consume();
                        const nvae = new NoViableAltException(23, 2);
                        throw nvae;
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }

            } else {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                const nvae =
                    new NoViableAltException(23, 0);
                throw nvae;
            }
        }

        switch (alt23) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:167:7: ID
                {
                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:168:9: ^( ASSIGN ID ID )
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:169:9: ^( ASSIGN ID STRING_LITERAL )
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:170:9: ^( ASSIGN ID ACTION )
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ACTION);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 5: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:171:9: ^( ASSIGN ID INT )
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.INT);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }
    }
    // $ANTLR end "elementOption"

    // $ANTLR start "element"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:174:1: element : ( atom | ^( NOT element ) | ^( RANGE atom atom ) | ^( ASSIGN ID element ) | ^( PLUS_ASSIGN ID element ) | ^( SET ( setElement )+ ) | RULE_REF | ebnf | epsilonElement );
    public element(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:175:2: ( atom | ^( NOT element ) | ^( RANGE atom atom ) | ^( ASSIGN ID element ) | ^( PLUS_ASSIGN ID element ) | ^( SET ( setElement )+ ) | RULE_REF | ebnf | epsilonElement )
        let alt25 = 9;
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.RULE_REF: {
                {
                    const LA25_1 = this.input.LA(2);
                    if ((LA25_1 === Constants.DOWN)) {
                        alt25 = 1;
                    } else {
                        if (((LA25_1 >= Constants.UP && LA25_1 <= ANTLRv4Lexer.ACTION) || LA25_1 === ANTLRv4Lexer.ASSIGN || LA25_1 === ANTLRv4Lexer.DOT || LA25_1 === ANTLRv4Lexer.NOT || LA25_1 === ANTLRv4Lexer.PLUS_ASSIGN || LA25_1 === ANTLRv4Lexer.RANGE || LA25_1 === ANTLRv4Lexer.RULE_REF || LA25_1 === ANTLRv4Lexer.SEMPRED || LA25_1 === ANTLRv4Lexer.STRING_LITERAL || LA25_1 === ANTLRv4Lexer.TOKEN_REF || (LA25_1 >= ANTLRv4Lexer.BLOCK && LA25_1 <= ANTLRv4Lexer.CLOSURE) || LA25_1 === ANTLRv4Lexer.EPSILON || (LA25_1 >= ANTLRv4Lexer.OPTIONAL && LA25_1 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA25_1 >= ANTLRv4Lexer.SET && LA25_1 <= ANTLRv4Lexer.WILDCARD))) {
                            alt25 = 7;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(25, 1);
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

            case ANTLRv4Lexer.DOT:
            case ANTLRv4Lexer.STRING_LITERAL:
            case ANTLRv4Lexer.TOKEN_REF:
            case ANTLRv4Lexer.WILDCARD: {
                {
                    alt25 = 1;
                }
                break;
            }

            case ANTLRv4Lexer.NOT: {
                {
                    alt25 = 2;
                }
                break;
            }

            case ANTLRv4Lexer.RANGE: {
                {
                    alt25 = 3;
                }
                break;
            }

            case ANTLRv4Lexer.ASSIGN: {
                {
                    alt25 = 4;
                }
                break;
            }

            case ANTLRv4Lexer.PLUS_ASSIGN: {
                {
                    alt25 = 5;
                }
                break;
            }

            case ANTLRv4Lexer.SET: {
                {
                    alt25 = 6;
                }
                break;
            }

            case ANTLRv4Lexer.BLOCK:
            case ANTLRv4Lexer.CLOSURE:
            case ANTLRv4Lexer.OPTIONAL:
            case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                {
                    alt25 = 8;
                }
                break;
            }

            case ANTLRv4Lexer.ACTION:
            case ANTLRv4Lexer.SEMPRED:
            case ANTLRv4Lexer.EPSILON: {
                {
                    alt25 = 9;
                }
                break;
            }

            default: {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                const nvae =
                    new NoViableAltException(25, 0);
                throw nvae;
            }

        }
        switch (alt25) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:175:4: atom
                {
                    this.atom();

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:176:4: ^( NOT element )
                {
                    this.match(this.input, ANTLRv4Lexer.NOT);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.element();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:177:4: ^( RANGE atom atom )
                {
                    this.match(this.input, ANTLRv4Lexer.RANGE);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.atom();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.atom();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:178:4: ^( ASSIGN ID element )
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.element();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 5: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:179:4: ^( PLUS_ASSIGN ID element )
                {
                    this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.element();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 6: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:180:7: ^( SET ( setElement )+ )
                {
                    this.match(this.input, ANTLRv4Lexer.SET);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:180:13: ( setElement )+
                    let cnt24 = 0;
                    loop24:
                    while (true) {
                        let alt24 = 2;
                        const LA24_0 = this.input.LA(1);
                        if ((LA24_0 === ANTLRv4Lexer.STRING_LITERAL || LA24_0 === ANTLRv4Lexer.TOKEN_REF)) {
                            alt24 = 1;
                        }

                        switch (alt24) {
                            case 1: {
                                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:180:13: setElement
                                {
                                    this.setElement();
                                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                    if (this.state.failed) {
                                        return;
                                    }

                                }
                                break;
                            }

                            default: {
                                if (cnt24 >= 1) {
                                    break loop24;
                                }

                                if (this.state.backtracking > 0) {
                                    this.state.failed = true;

                                    return;
                                }
                                const eee = new EarlyExitException(24);
                                throw eee;
                            }

                        }
                        cnt24++;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 7: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:181:9: RULE_REF
                {
                    this.match(this.input, ANTLRv4Lexer.RULE_REF);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 8: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:182:4: ebnf
                {
                    this.ebnf();

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 9: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:183:4: epsilonElement
                {
                    this.epsilonElement();

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }
    }
    // $ANTLR end "element"

    // $ANTLR start "epsilonElement"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:186:1: epsilonElement : ( ACTION | SEMPRED | EPSILON | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) );
    public epsilonElement(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:187:2: ( ACTION | SEMPRED | EPSILON | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) )
        let alt26 = 5;
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.ACTION: {
                {
                    const LA26_1 = this.input.LA(2);
                    if ((LA26_1 === Constants.DOWN)) {
                        alt26 = 4;
                    } else {
                        if (((LA26_1 >= Constants.UP && LA26_1 <= ANTLRv4Lexer.ACTION) || LA26_1 === ANTLRv4Lexer.ASSIGN || LA26_1 === ANTLRv4Lexer.DOT || LA26_1 === ANTLRv4Lexer.NOT || LA26_1 === ANTLRv4Lexer.PLUS_ASSIGN || LA26_1 === ANTLRv4Lexer.RANGE || LA26_1 === ANTLRv4Lexer.RULE_REF || LA26_1 === ANTLRv4Lexer.SEMPRED || LA26_1 === ANTLRv4Lexer.STRING_LITERAL || LA26_1 === ANTLRv4Lexer.TOKEN_REF || (LA26_1 >= ANTLRv4Lexer.BLOCK && LA26_1 <= ANTLRv4Lexer.CLOSURE) || LA26_1 === ANTLRv4Lexer.EPSILON || (LA26_1 >= ANTLRv4Lexer.OPTIONAL && LA26_1 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA26_1 >= ANTLRv4Lexer.SET && LA26_1 <= ANTLRv4Lexer.WILDCARD))) {
                            alt26 = 1;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(26, 1);
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
                    const LA26_2 = this.input.LA(2);
                    if ((LA26_2 === Constants.DOWN)) {
                        alt26 = 5;
                    } else {
                        if (((LA26_2 >= Constants.UP && LA26_2 <= ANTLRv4Lexer.ACTION) || LA26_2 === ANTLRv4Lexer.ASSIGN || LA26_2 === ANTLRv4Lexer.DOT || LA26_2 === ANTLRv4Lexer.NOT || LA26_2 === ANTLRv4Lexer.PLUS_ASSIGN || LA26_2 === ANTLRv4Lexer.RANGE || LA26_2 === ANTLRv4Lexer.RULE_REF || LA26_2 === ANTLRv4Lexer.SEMPRED || LA26_2 === ANTLRv4Lexer.STRING_LITERAL || LA26_2 === ANTLRv4Lexer.TOKEN_REF || (LA26_2 >= ANTLRv4Lexer.BLOCK && LA26_2 <= ANTLRv4Lexer.CLOSURE) || LA26_2 === ANTLRv4Lexer.EPSILON || (LA26_2 >= ANTLRv4Lexer.OPTIONAL && LA26_2 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA26_2 >= ANTLRv4Lexer.SET && LA26_2 <= ANTLRv4Lexer.WILDCARD))) {
                            alt26 = 2;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(26, 2);
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

            case ANTLRv4Lexer.EPSILON: {
                {
                    alt26 = 3;
                }
                break;
            }

            default: {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                const nvae =
                    new NoViableAltException(26, 0);
                throw nvae;
            }

        }
        switch (alt26) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:187:4: ACTION
                {
                    this.match(this.input, ANTLRv4Lexer.ACTION);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:188:4: SEMPRED
                {
                    this.match(this.input, ANTLRv4Lexer.SEMPRED);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:189:4: EPSILON
                {
                    this.match(this.input, ANTLRv4Lexer.EPSILON);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:190:4: ^( ACTION elementOptions )
                {
                    this.match(this.input, ANTLRv4Lexer.ACTION);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 5: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:191:4: ^( SEMPRED elementOptions )
                {
                    this.match(this.input, ANTLRv4Lexer.SEMPRED);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }

    }
    // $ANTLR end "epsilonElement"

    // $ANTLR start "setElement"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:194:1: setElement : ( ^( STRING_LITERAL elementOptions ) | ^( TOKEN_REF elementOptions ) | STRING_LITERAL | TOKEN_REF );
    public setElement(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:195:2: ( ^( STRING_LITERAL elementOptions ) | ^( TOKEN_REF elementOptions ) | STRING_LITERAL | TOKEN_REF )
        let alt27 = 4;
        const LA27_0 = this.input.LA(1);
        if ((LA27_0 === ANTLRv4Lexer.STRING_LITERAL)) {
            const LA27_1 = this.input.LA(2);
            if ((LA27_1 === Constants.DOWN)) {
                alt27 = 1;
            } else {
                if ((LA27_1 === Constants.UP || LA27_1 === ANTLRv4Lexer.STRING_LITERAL || LA27_1 === ANTLRv4Lexer.TOKEN_REF)) {
                    alt27 = 3;
                } else {
                    if (this.state.backtracking > 0) {
                        this.state.failed = true;

                        return;
                    }
                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;
                    try {
                        this.input.consume();
                        const nvae = new NoViableAltException(27, 1);
                        throw nvae;
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }
            }

        } else {
            if ((LA27_0 === ANTLRv4Lexer.TOKEN_REF)) {
                const LA27_2 = this.input.LA(2);
                if ((LA27_2 === Constants.DOWN)) {
                    alt27 = 2;
                } else {
                    if ((LA27_2 === Constants.UP || LA27_2 === ANTLRv4Lexer.STRING_LITERAL || LA27_2 === ANTLRv4Lexer.TOKEN_REF)) {
                        alt27 = 4;
                    } else {
                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return;
                        }
                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            const nvae =
                                new NoViableAltException(27, 2);
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

                    return;
                }
                const nvae =
                    new NoViableAltException(27, 0);
                throw nvae;
            }
        }

        switch (alt27) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:195:4: ^( STRING_LITERAL elementOptions )
                {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:196:4: ^( TOKEN_REF elementOptions )
                {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:197:4: STRING_LITERAL
                {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:198:4: TOKEN_REF
                {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }
    }
    // $ANTLR end "setElement"

    // $ANTLR start "ebnf"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:201:1: ebnf : ( block | ^( OPTIONAL block ) | ^( CLOSURE block ) | ^( POSITIVE_CLOSURE block ) );
    public ebnf(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:201:5: ( block | ^( OPTIONAL block ) | ^( CLOSURE block ) | ^( POSITIVE_CLOSURE block ) )
        let alt28 = 4;
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.BLOCK: {
                {
                    alt28 = 1;
                }
                break;
            }

            case ANTLRv4Lexer.OPTIONAL: {
                {
                    alt28 = 2;
                }
                break;
            }

            case ANTLRv4Lexer.CLOSURE: {
                {
                    alt28 = 3;
                }
                break;
            }

            case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                {
                    alt28 = 4;
                }
                break;
            }

            default: {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                const nvae =
                    new NoViableAltException(28, 0);
                throw nvae;
            }

        }
        switch (alt28) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:201:9: block
                {
                    this.block();

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:202:9: ^( OPTIONAL block )
                {
                    this.match(this.input, ANTLRv4Lexer.OPTIONAL);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.block();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:203:9: ^( CLOSURE block )
                {
                    this.match(this.input, ANTLRv4Lexer.CLOSURE);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.block();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:204:9: ^( POSITIVE_CLOSURE block )
                {
                    this.match(this.input, ANTLRv4Lexer.POSITIVE_CLOSURE);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.block();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }

    }
    // $ANTLR end "ebnf"

    // $ANTLR start "block"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:207:1: block : ^( BLOCK ( ACTION )? ( alternative )+ ) ;
    public block(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:208:5: ( ^( BLOCK ( ACTION )? ( alternative )+ ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:208:7: ^( BLOCK ( ACTION )? ( alternative )+ )
        {
            this.match(this.input, ANTLRv4Lexer.BLOCK);

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:208:15: ( ACTION )?
            let alt29 = 2;
            const LA29_0 = this.input.LA(1);
            if ((LA29_0 === ANTLRv4Lexer.ACTION)) {
                alt29 = 1;
            }
            switch (alt29) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:208:15: ACTION
                    {
                        this.match(this.input, ANTLRv4Lexer.ACTION);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:208:23: ( alternative )+
            let cnt30 = 0;
            loop30:
            while (true) {
                let alt30 = 2;
                const LA30_0 = this.input.LA(1);
                if ((LA30_0 === ANTLRv4Lexer.ALT)) {
                    alt30 = 1;
                }

                switch (alt30) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:208:23: alternative
                        {
                            this.alternative();
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return;
                            }

                        }
                        break;
                    }

                    default: {
                        if (cnt30 >= 1) {
                            break loop30;
                        }

                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(30);
                        throw eee;
                    }

                }
                cnt30++;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end "block"

    // $ANTLR start "alternative"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:211:1: alternative : ^( ALT ( elementOptions )? ( element )+ ) ;
    public alternative(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:212:2: ( ^( ALT ( elementOptions )? ( element )+ ) )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:212:4: ^( ALT ( elementOptions )? ( element )+ )
        {
            this.match(this.input, ANTLRv4Lexer.ALT);

            if (this.state.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:212:10: ( elementOptions )?
            let alt31 = 2;
            const LA31_0 = this.input.LA(1);
            if ((LA31_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt31 = 1;
            }
            switch (alt31) {
                case 1: {
                    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:212:10: elementOptions
                    {
                        this.elementOptions();
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:212:26: ( element )+
            let cnt32 = 0;
            loop32:
            while (true) {
                let alt32 = 2;
                const LA32_0 = this.input.LA(1);
                if ((LA32_0 === ANTLRv4Lexer.ACTION || LA32_0 === ANTLRv4Lexer.ASSIGN || LA32_0 === ANTLRv4Lexer.DOT || LA32_0 === ANTLRv4Lexer.NOT || LA32_0 === ANTLRv4Lexer.PLUS_ASSIGN || LA32_0 === ANTLRv4Lexer.RANGE || LA32_0 === ANTLRv4Lexer.RULE_REF || LA32_0 === ANTLRv4Lexer.SEMPRED || LA32_0 === ANTLRv4Lexer.STRING_LITERAL || LA32_0 === ANTLRv4Lexer.TOKEN_REF || (LA32_0 >= ANTLRv4Lexer.BLOCK && LA32_0 <= ANTLRv4Lexer.CLOSURE) || LA32_0 === ANTLRv4Lexer.EPSILON || (LA32_0 >= ANTLRv4Lexer.OPTIONAL && LA32_0 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA32_0 >= ANTLRv4Lexer.SET && LA32_0 <= ANTLRv4Lexer.WILDCARD))) {
                    alt32 = 1;
                }

                switch (alt32) {
                    case 1: {
                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:212:26: element
                        {
                            this.element();
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (this.state.failed) {
                                return;
                            }

                        }
                        break;
                    }

                    default: {
                        if (cnt32 >= 1) {
                            break loop32;
                        }

                        if (this.state.backtracking > 0) {
                            this.state.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(32);
                        throw eee;
                    }

                }
                cnt32++;
            }

            this.match(this.input, Constants.UP);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end "alternative"

    // $ANTLR start "atom"
    // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:215:1: atom : ( ^( RULE_REF ( ARG_ACTION )? ( elementOptions )? ) | ^( STRING_LITERAL elementOptions ) | STRING_LITERAL | ^( TOKEN_REF elementOptions ) | TOKEN_REF | ^( WILDCARD elementOptions ) | WILDCARD | ^( DOT ID element ) );
    public atom(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:216:2: ( ^( RULE_REF ( ARG_ACTION )? ( elementOptions )? ) | ^( STRING_LITERAL elementOptions ) | STRING_LITERAL | ^( TOKEN_REF elementOptions ) | TOKEN_REF | ^( WILDCARD elementOptions ) | WILDCARD | ^( DOT ID element ) )
        let alt35 = 8;
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.RULE_REF: {
                {
                    alt35 = 1;
                }
                break;
            }

            case ANTLRv4Lexer.STRING_LITERAL: {
                {
                    const LA35_2 = this.input.LA(2);
                    if ((LA35_2 === Constants.DOWN)) {
                        alt35 = 2;
                    } else {
                        if (((LA35_2 >= Constants.UP && LA35_2 <= ANTLRv4Lexer.ACTION) || LA35_2 === ANTLRv4Lexer.ASSIGN || LA35_2 === ANTLRv4Lexer.DOT || LA35_2 === ANTLRv4Lexer.NOT || LA35_2 === ANTLRv4Lexer.PLUS_ASSIGN || LA35_2 === ANTLRv4Lexer.RANGE || LA35_2 === ANTLRv4Lexer.RULE_REF || LA35_2 === ANTLRv4Lexer.SEMPRED || LA35_2 === ANTLRv4Lexer.STRING_LITERAL || LA35_2 === ANTLRv4Lexer.TOKEN_REF || (LA35_2 >= ANTLRv4Lexer.BLOCK && LA35_2 <= ANTLRv4Lexer.CLOSURE) || LA35_2 === ANTLRv4Lexer.EPSILON || (LA35_2 >= ANTLRv4Lexer.OPTIONAL && LA35_2 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA35_2 >= ANTLRv4Lexer.SET && LA35_2 <= ANTLRv4Lexer.WILDCARD))) {
                            alt35 = 3;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(35, 2);
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
                    const LA35_3 = this.input.LA(2);
                    if ((LA35_3 === Constants.DOWN)) {
                        alt35 = 4;
                    } else {
                        if (((LA35_3 >= Constants.UP && LA35_3 <= ANTLRv4Lexer.ACTION) || LA35_3 === ANTLRv4Lexer.ASSIGN || LA35_3 === ANTLRv4Lexer.DOT || LA35_3 === ANTLRv4Lexer.NOT || LA35_3 === ANTLRv4Lexer.PLUS_ASSIGN || LA35_3 === ANTLRv4Lexer.RANGE || LA35_3 === ANTLRv4Lexer.RULE_REF || LA35_3 === ANTLRv4Lexer.SEMPRED || LA35_3 === ANTLRv4Lexer.STRING_LITERAL || LA35_3 === ANTLRv4Lexer.TOKEN_REF || (LA35_3 >= ANTLRv4Lexer.BLOCK && LA35_3 <= ANTLRv4Lexer.CLOSURE) || LA35_3 === ANTLRv4Lexer.EPSILON || (LA35_3 >= ANTLRv4Lexer.OPTIONAL && LA35_3 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA35_3 >= ANTLRv4Lexer.SET && LA35_3 <= ANTLRv4Lexer.WILDCARD))) {
                            alt35 = 5;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(35, 3);
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

            case ANTLRv4Lexer.WILDCARD: {
                {
                    const LA35_4 = this.input.LA(2);
                    if ((LA35_4 === Constants.DOWN)) {
                        alt35 = 6;
                    } else {
                        if (((LA35_4 >= Constants.UP && LA35_4 <= ANTLRv4Lexer.ACTION) || LA35_4 === ANTLRv4Lexer.ASSIGN || LA35_4 === ANTLRv4Lexer.DOT || LA35_4 === ANTLRv4Lexer.NOT || LA35_4 === ANTLRv4Lexer.PLUS_ASSIGN || LA35_4 === ANTLRv4Lexer.RANGE || LA35_4 === ANTLRv4Lexer.RULE_REF || LA35_4 === ANTLRv4Lexer.SEMPRED || LA35_4 === ANTLRv4Lexer.STRING_LITERAL || LA35_4 === ANTLRv4Lexer.TOKEN_REF || (LA35_4 >= ANTLRv4Lexer.BLOCK && LA35_4 <= ANTLRv4Lexer.CLOSURE) || LA35_4 === ANTLRv4Lexer.EPSILON || (LA35_4 >= ANTLRv4Lexer.OPTIONAL && LA35_4 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA35_4 >= ANTLRv4Lexer.SET && LA35_4 <= ANTLRv4Lexer.WILDCARD))) {
                            alt35 = 7;
                        } else {
                            if (this.state.backtracking > 0) {
                                this.state.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(35, 4);
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

            case ANTLRv4Lexer.DOT: {
                {
                    alt35 = 8;
                }
                break;
            }

            default: {
                if (this.state.backtracking > 0) {
                    this.state.failed = true;

                    return;
                }
                const nvae =
                    new NoViableAltException(35, 0);
                throw nvae;
            }

        }
        switch (alt35) {
            case 1: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:216:4: ^( RULE_REF ( ARG_ACTION )? ( elementOptions )? )
                {
                    this.match(this.input, ANTLRv4Lexer.RULE_REF);

                    if (this.state.failed) {
                        return;
                    }

                    if (this.input.LA(1) === Constants.DOWN) {
                        this.match(this.input, Constants.DOWN);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:216:15: ( ARG_ACTION )?
                        let alt33 = 2;
                        const LA33_0 = this.input.LA(1);
                        if ((LA33_0 === ANTLRv4Lexer.ARG_ACTION)) {
                            alt33 = 1;
                        }
                        switch (alt33) {
                            case 1: {
                                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:216:15: ARG_ACTION
                                {
                                    this.match(this.input, ANTLRv4Lexer.ARG_ACTION);

                                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                    if (this.state.failed) {
                                        return;
                                    }

                                }
                                break;
                            }

                            default:

                        }

                        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:216:27: ( elementOptions )?
                        let alt34 = 2;
                        const LA34_0 = this.input.LA(1);
                        if ((LA34_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                            alt34 = 1;
                        }
                        switch (alt34) {
                            case 1: {
                                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:216:27: elementOptions
                                {
                                    this.elementOptions();
                                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                    if (this.state.failed) {
                                        return;
                                    }

                                }
                                break;
                            }

                            default:

                        }

                        this.match(this.input, Constants.UP);

                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (this.state.failed) {
                            return;
                        }

                    }

                }
                break;
            }

            case 2: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:217:8: ^( STRING_LITERAL elementOptions )
                {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:218:4: STRING_LITERAL
                {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:219:7: ^( TOKEN_REF elementOptions )
                {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 5: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:220:4: TOKEN_REF
                {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 6: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:221:7: ^( WILDCARD elementOptions )
                {
                    this.match(this.input, ANTLRv4Lexer.WILDCARD);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.elementOptions();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 7: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:222:4: WILDCARD
                {
                    this.match(this.input, ANTLRv4Lexer.WILDCARD);

                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            case 8: {
                // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:223:4: ^( DOT ID element )
                {
                    this.match(this.input, ANTLRv4Lexer.DOT);

                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.element();
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.state.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }
    }
    // $ANTLR end "atom"

    // $ANTLR start synpred1_LeftRecursiveRuleWalker
    public synpred1_LeftRecursiveRuleWalker_fragment(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:114:9: ( binary )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:114:10: binary
        {
            this.binary();

            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end synpred1_LeftRecursiveRuleWalker

    // $ANTLR start synpred2_LeftRecursiveRuleWalker
    public synpred2_LeftRecursiveRuleWalker_fragment(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:116:9: ( prefix )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:116:10: prefix
        {
            this.prefix();

            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end synpred2_LeftRecursiveRuleWalker

    // $ANTLR start synpred3_LeftRecursiveRuleWalker
    public synpred3_LeftRecursiveRuleWalker_fragment(): void {
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:118:9: ( suffix )
        // org/antlr/v4/parse/LeftRecursiveRuleWalker.g:118:10: suffix
        {
            this.suffix();

            if (this.state.failed) {
                return;
            }

        }

    }
    // $ANTLR end synpred3_LeftRecursiveRuleWalker

    // Delegated rules

    public synpred1_LeftRecursiveRuleWalker(): boolean {
        this.state.backtracking++;
        const start = this.input.mark();
        const lastIndex = this.input.index;

        this.synpred1_LeftRecursiveRuleWalker_fragment(); // can never throw exception

        const success = !this.state.failed;

        this.input.seek(lastIndex);
        this.input.release(start);
        this.state.backtracking--;
        this.state.failed = false;

        return success;
    }
    public synpred2_LeftRecursiveRuleWalker(): boolean {
        this.state.backtracking++;
        const start = this.input.mark();
        const lastIndex = this.input.index;

        this.synpred2_LeftRecursiveRuleWalker_fragment(); // can never throw exception

        const success = !this.state.failed;

        this.input.seek(lastIndex);
        this.input.release(start);
        this.state.backtracking--;
        this.state.failed = false;

        return success;
    }

    public synpred3_LeftRecursiveRuleWalker(): boolean {
        this.state.backtracking++;
        const start = this.input.mark();
        const lastIndex = this.input.index;

        this.synpred3_LeftRecursiveRuleWalker_fragment(); // can never throw exception

        const success = !this.state.failed;

        this.input.seek(lastIndex);
        this.input.release(start);
        this.state.backtracking--;
        this.state.failed = false;

        return success;
    };

    /**
     * A manual implementation of the ANTLR3 DFA prediction for the element rule.
     *
     * @returns `true` if the element rule is a viable candidate for the current input, otherwise `false`.
     */
    private predictElement(): boolean {
        const alt11 = this.input.LA(1);
        switch (alt11) {
            case ANTLRv4Lexer.STRING_LITERAL:
            case ANTLRv4Lexer.TOKEN_REF:
            case ANTLRv4Lexer.DOT:
            case ANTLRv4Lexer.NOT:
            case ANTLRv4Lexer.RANGE:
            case ANTLRv4Lexer.SET:
            case ANTLRv4Lexer.BLOCK:
            case ANTLRv4Lexer.CLOSURE:
            case ANTLRv4Lexer.OPTIONAL:
            case ANTLRv4Lexer.POSITIVE_CLOSURE:
            case ANTLRv4Lexer.ACTION:
            case ANTLRv4Lexer.SEMPRED:
            case ANTLRv4Lexer.WILDCARD:
            case ANTLRv4Lexer.EPSILON: {
                return true;
            }

            case ANTLRv4Lexer.RULE_REF: {
                const la = this.input.LA(2);
                if (la === ANTLRv4Lexer.ARG_ACTION || la === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                    return true;
                }

                if (la === Constants.UP && this.input.LT(1)!.getText() === this.ruleName) {
                    return false;
                }

                return true;
            }

            case ANTLRv4Lexer.ASSIGN:
            case ANTLRv4Lexer.PLUS_ASSIGN: {
                // LA(2) is DOWN, LA(3) is ID.
                if (this.input.LA(4) === ANTLRv4Lexer.RULE_REF) {
                    if (this.input.LT(4)!.getText() === this.ruleName) {
                        return false;
                    }
                }

                return true;
            }

            default: {
                return false;
            }
        }
    }
}

export namespace LeftRecursiveRuleWalker {
    export type ruleBlock_return = InstanceType<typeof LeftRecursiveRuleWalker.ruleBlock_return>;
    export type outerAlternative_return = InstanceType<typeof LeftRecursiveRuleWalker.outerAlternative_return>;
}
