import { RecognitionException } from "antlr4ng";

import { IRecognizerSharedState } from "../misc/IRecognizerSharedState.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { TreeParser } from "../TreeParser.js";
import { TreeRuleReturnScope } from "../../antlr3/tree/TreeRuleReturnScope.js";
import { CodeBlockForAlt } from "../../codegen/model/CodeBlockForAlt.js";
import { PlusBlock } from "../../codegen/model/PlusBlock.js";
import type { SrcOp } from "../../codegen/model/SrcOp.js";
import { StarBlock } from "../../codegen/model/StarBlock.js";
import { OutputModelController } from "../../codegen/OutputModelController.js";
import { Constants } from "../../Constants.js";
import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";
import type { ActionAST } from "../../tool/ast/ActionAST.js";
import type { AltAST } from "../../tool/ast/AltAST.js";
import type { BlockAST } from "../../tool/ast/BlockAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { EarlyExitException } from "../EarlyExitException.js";
import { NoViableAltException } from "../NoViableAltException.js";

/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable max-len, @typescript-eslint/naming-convention */
// cspell: disable

export class SourceGenTriggers extends TreeParser {
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

    public static alternative_return = class alternative_return extends TreeRuleReturnScope {
        public altCodeBlock: CodeBlockForAlt;
        public ops: SrcOp[];
    };

    // $ANTLR end "alternative"

    public static alt_return = class alt_return extends TreeRuleReturnScope {
        public altCodeBlock: CodeBlockForAlt;
        public ops?: SrcOp[];
    };

    public controller?: OutputModelController;
    public hasLookaheadBlock: boolean;

    public constructor(input: CommonTreeNodeStream, stateOrController?: IRecognizerSharedState | OutputModelController) {
        let state: IRecognizerSharedState | undefined;
        let controller: OutputModelController | undefined;

        if (stateOrController instanceof OutputModelController) {
            state = undefined;
            controller = stateOrController;
        } else {
            state = stateOrController;
            controller = undefined;
        }

        super(input, state);
        this.controller = controller;
    }

    public getDelegates(): TreeParser[] {
        return [];
    }

    public override getTokenNames(): string[] {
        return SourceGenTriggers.tokenNames;
    }

    // $ANTLR start "dummy"
    // ./SourceGenTriggers.g:59:1: dummy : block[null, null] ;
    public dummy(): void {
        try {
            // ./SourceGenTriggers.g:59:7: ( block[null, null] )
            // ./SourceGenTriggers.g:59:9: block[null, null]
            {
                this.block(null, null);

            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }
    }
    // $ANTLR end "dummy"

    // $ANTLR start "block"
    // ./SourceGenTriggers.g:61:1: block[GrammarAST label, GrammarAST ebnfRoot] returns [List<? extends SrcOp> omos] : ^(blk= BLOCK ( ^( OPTIONS ( . )+ ) )? ( alternative )+ ) ;
    public block(label: GrammarAST | null, ebnfRoot: GrammarAST | null): SrcOp[] | null {
        let omos = null;

        let blk = null;
        let alternative1 = null;

        try {
            // ./SourceGenTriggers.g:62:5: ( ^(blk= BLOCK ( ^( OPTIONS ( . )+ ) )? ( alternative )+ ) )
            // ./SourceGenTriggers.g:62:7: ^(blk= BLOCK ( ^( OPTIONS ( . )+ ) )? ( alternative )+ )
            {
                blk = this.match(this.input, ANTLRv4Lexer.BLOCK)!;
                this.match(this.input, Constants.DOWN);
                // ./SourceGenTriggers.g:62:20: ( ^( OPTIONS ( . )+ ) )?
                let alt2 = 2;
                const LA2_0 = this.input.LA(1);
                if ((LA2_0 === ANTLRv4Lexer.OPTIONS)) {
                    alt2 = 1;
                }
                switch (alt2) {
                    case 1: {
                        // ./SourceGenTriggers.g:62:21: ^( OPTIONS ( . )* )
                        {
                            this.match(this.input, ANTLRv4Lexer.OPTIONS);
                            if (this.input.LA(1) === Constants.DOWN) {
                                this.match(this.input, Constants.DOWN);
                                // ./SourceGenTriggers.g:62:31: ( . )+
                                let cnt1 = 0;
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
                                            // ./SourceGenTriggers.g:62:31: .
                                            {
                                                this.matchAny();
                                            }
                                            break;
                                        }

                                        default: {
                                            if (cnt1 >= 1) {
                                                break loop1;
                                            }

                                            const eee = new EarlyExitException(1);
                                            throw eee;
                                        }

                                    }
                                    cnt1++;
                                }

                                this.match(this.input, Constants.UP);
                            }
                        }
                        break;
                    }

                    default:

                }

                const alts = new Array<CodeBlockForAlt>();
                // ./SourceGenTriggers.g:64:7: ( alternative )+
                let cnt3 = 0;
                loop3:
                while (true) {
                    let alt3 = 2;
                    const LA3_0 = this.input.LA(1);
                    if ((LA3_0 === ANTLRv4Lexer.ALT)) {
                        alt3 = 1;
                    }

                    switch (alt3) {
                        case 1: {
                            // ./SourceGenTriggers.g:64:9: alternative
                            {
                                alternative1 = this.alternative();

                                alts.push(alternative1.altCodeBlock);
                            }
                            break;
                        }

                        default: {
                            if (cnt3 >= 1) {
                                break loop3;
                            }

                            const eee = new EarlyExitException(3);
                            throw eee;
                        }

                    }
                    cnt3++;
                }

                this.match(this.input, Constants.UP);

                if (alts.length === 1 && ebnfRoot === null) {
                    return alts;
                }

                if (ebnfRoot === null) {
                    omos = [this.controller!.getChoiceBlock(blk as BlockAST, alts, label)];
                } else {
                    const choice = this.controller!.getEBNFBlock(ebnfRoot, alts);
                    this.hasLookaheadBlock ||= choice instanceof PlusBlock || choice instanceof StarBlock;
                    omos = [choice];
                }

            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return omos;
    }

    // $ANTLR start "alternative"
    // ./SourceGenTriggers.g:79:1: alternative returns [CodeBlockForAlt altCodeBlock, List<SrcOp> ops] : a= alt[outerMost] ;
    public alternative(): SourceGenTriggers.alternative_return {
        const retval = new SourceGenTriggers.alternative_return();
        retval.start = this.input.LT(1);

        let a = null;

        const outerMost = this.inContext("RULE BLOCK");

        try {
            // ./SourceGenTriggers.g:86:5: (a= alt[outerMost] )
            // ./SourceGenTriggers.g:86:7: a= alt[outerMost]
            {
                a = this.alt(outerMost);

                retval.altCodeBlock = a.altCodeBlock;
                retval.ops = a.ops ?? [];
            }

            this.controller!.finishAlternative(retval.altCodeBlock, retval.ops, outerMost);

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

    // $ANTLR start "alt"
    // ./SourceGenTriggers.g:89:1: alt[boolean outerMost] returns [CodeBlockForAlt altCodeBlock, List<SrcOp> ops] : ( ^( ALT ( elementOptions )? ( element )+ ) | ^( ALT ( elementOptions )? EPSILON ) );
    public alt(outerMost: boolean): SourceGenTriggers.alt_return {
        const retval = new SourceGenTriggers.alt_return();
        retval.start = this.input.LT(1);

        let element2 = null;

        // set alt if outer ALT only (the only ones with alt field set to Alternative object)
        const altAST = retval.start as AltAST;
        if (outerMost) {
            this.controller!.setCurrentOuterMostAlt(altAST.alt);
        }

        try {
            // ./SourceGenTriggers.g:95:2: ( ^( ALT ( elementOptions )? ( element )+ ) | ^( ALT ( elementOptions )? EPSILON ) )
            let alt7 = 1;

            let index = 0;
            if (retval.start!.getChild(index)!.getType() === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                ++index;
            }

            if (retval.start!.getChild(index)!.getType() === ANTLRv4Lexer.EPSILON) {
                alt7 = 2;
            }

            switch (alt7) {
                case 1: {
                    // ./SourceGenTriggers.g:95:4: ^( ALT ( elementOptions )? ( element )+ )
                    {

                        const elems = new Array<SrcOp>();
                        // TODO: shouldn't we pass ((GrammarAST)retval.start) to controller.alternative()?
                        retval.altCodeBlock = this.controller!.alternative(this.controller!.getCurrentOuterMostAlt(), outerMost);
                        retval.altCodeBlock.ops = retval.ops = elems;
                        this.controller!.setCurrentBlock(retval.altCodeBlock);

                        this.match(this.input, ANTLRv4Lexer.ALT);
                        this.match(this.input, Constants.DOWN);
                        // ./SourceGenTriggers.g:102:10: ( elementOptions )?
                        let alt4 = 2;
                        const LA4_0 = this.input.LA(1);
                        if ((LA4_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                            alt4 = 1;
                        }
                        switch (alt4) {
                            case 1: {
                                // ./SourceGenTriggers.g:102:10: elementOptions
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

                        // ./SourceGenTriggers.g:102:26: ( element )+
                        let cnt5 = 0;
                        loop5:
                        while (true) {
                            let alt5 = 2;
                            const LA5_0 = this.input.LA(1);
                            if ((LA5_0 === ANTLRv4Lexer.ACTION || LA5_0 === ANTLRv4Lexer.ASSIGN || LA5_0 === ANTLRv4Lexer.DOT || LA5_0 === ANTLRv4Lexer.NOT || LA5_0 === ANTLRv4Lexer.PLUS_ASSIGN || LA5_0 === ANTLRv4Lexer.RANGE || LA5_0 === ANTLRv4Lexer.RULE_REF || LA5_0 === ANTLRv4Lexer.SEMPRED || LA5_0 === ANTLRv4Lexer.STRING_LITERAL || LA5_0 === ANTLRv4Lexer.TOKEN_REF || (LA5_0 >= ANTLRv4Lexer.BLOCK && LA5_0 <= ANTLRv4Lexer.CLOSURE) || (LA5_0 >= ANTLRv4Lexer.OPTIONAL && LA5_0 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA5_0 >= ANTLRv4Lexer.SET && LA5_0 <= ANTLRv4Lexer.WILDCARD))) {
                                alt5 = 1;
                            }

                            switch (alt5) {
                                case 1: {
                                    // ./SourceGenTriggers.g:102:28: element
                                    {
                                        element2 = this.element();

                                        if (element2 !== null) {
                                            element2.forEach((element: SrcOp | null) => {
                                                if (element) {
                                                    elems.push(element);
                                                }
                                            });
                                        }

                                    }
                                    break;
                                }

                                default: {
                                    if (cnt5 >= 1) {
                                        break loop5;
                                    }

                                    const eee = new EarlyExitException(5);
                                    throw eee;
                                }

                            }
                            cnt5++;
                        }

                        this.match(this.input, Constants.UP);

                    }
                    break;
                }

                case 2: {
                    // ./SourceGenTriggers.g:104:4: ^( ALT ( elementOptions )? EPSILON )
                    {
                        this.match(this.input, ANTLRv4Lexer.ALT);
                        this.match(this.input, Constants.DOWN);
                        // ./SourceGenTriggers.g:104:10: ( elementOptions )?
                        let alt6 = 2;
                        const LA6_0 = this.input.LA(1);
                        if ((LA6_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                            alt6 = 1;
                        }
                        switch (alt6) {
                            case 1: {
                                // ./SourceGenTriggers.g:104:10: elementOptions
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

                        this.match(this.input, ANTLRv4Lexer.EPSILON);
                        this.match(this.input, Constants.UP);

                        retval.altCodeBlock = this.controller!.epsilon(this.controller!.getCurrentOuterMostAlt(), outerMost);
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
        } finally {
            // do for sure before leaving
        }

        return retval;
    }
    // $ANTLR end "alt"

    // $ANTLR start "element"
    // ./SourceGenTriggers.g:108:1: element returns [List<? extends SrcOp> omos] : ( labeledElement | atom[null,false] | subrule | ACTION | SEMPRED | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) );
    public element(): SrcOp[] | null {
        let omos = null;

        let ACTION6 = null;
        let SEMPRED7 = null;
        let ACTION8 = null;
        let SEMPRED9 = null;
        let labeledElement3 = null;
        let atom4 = null;
        let subrule5 = null;

        try {
            // ./SourceGenTriggers.g:109:2: ( labeledElement | atom[null,false] | subrule | ACTION | SEMPRED | ^( ACTION elementOptions ) | ^( SEMPRED elementOptions ) )
            let alt8 = 7;
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.ASSIGN:
                case ANTLRv4Lexer.PLUS_ASSIGN: {
                    {
                        alt8 = 1;
                    }
                    break;
                }

                case ANTLRv4Lexer.DOT:
                case ANTLRv4Lexer.NOT:
                case ANTLRv4Lexer.RANGE:
                case ANTLRv4Lexer.RULE_REF:
                case ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer.TOKEN_REF:
                case ANTLRv4Lexer.SET:
                case ANTLRv4Lexer.WILDCARD: {
                    {
                        alt8 = 2;
                    }
                    break;
                }

                case ANTLRv4Lexer.BLOCK:
                case ANTLRv4Lexer.CLOSURE:
                case ANTLRv4Lexer.OPTIONAL:
                case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                    {
                        alt8 = 3;
                    }
                    break;
                }

                case ANTLRv4Lexer.ACTION: {
                    {
                        const LA8_4 = this.input.LA(2);
                        if ((LA8_4 === Constants.DOWN)) {
                            alt8 = 6;
                        } else {
                            if (((LA8_4 >= Constants.UP && LA8_4 <= ANTLRv4Lexer.ACTION) || LA8_4 === ANTLRv4Lexer.ASSIGN || LA8_4 === ANTLRv4Lexer.DOT || LA8_4 === ANTLRv4Lexer.NOT || LA8_4 === ANTLRv4Lexer.PLUS_ASSIGN || LA8_4 === ANTLRv4Lexer.RANGE || LA8_4 === ANTLRv4Lexer.RULE_REF || LA8_4 === ANTLRv4Lexer.SEMPRED || LA8_4 === ANTLRv4Lexer.STRING_LITERAL || LA8_4 === ANTLRv4Lexer.TOKEN_REF || (LA8_4 >= ANTLRv4Lexer.BLOCK && LA8_4 <= ANTLRv4Lexer.CLOSURE) || (LA8_4 >= ANTLRv4Lexer.OPTIONAL && LA8_4 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA8_4 >= ANTLRv4Lexer.SET && LA8_4 <= ANTLRv4Lexer.WILDCARD))) {
                                alt8 = 4;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae = new NoViableAltException(8, 4);
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
                        const LA8_5 = this.input.LA(2);
                        if ((LA8_5 === Constants.DOWN)) {
                            alt8 = 7;
                        } else {
                            if (((LA8_5 >= Constants.UP && LA8_5 <= ANTLRv4Lexer.ACTION) || LA8_5 === ANTLRv4Lexer.ASSIGN || LA8_5 === ANTLRv4Lexer.DOT || LA8_5 === ANTLRv4Lexer.NOT || LA8_5 === ANTLRv4Lexer.PLUS_ASSIGN || LA8_5 === ANTLRv4Lexer.RANGE || LA8_5 === ANTLRv4Lexer.RULE_REF || LA8_5 === ANTLRv4Lexer.SEMPRED || LA8_5 === ANTLRv4Lexer.STRING_LITERAL || LA8_5 === ANTLRv4Lexer.TOKEN_REF || (LA8_5 >= ANTLRv4Lexer.BLOCK && LA8_5 <= ANTLRv4Lexer.CLOSURE) || (LA8_5 >= ANTLRv4Lexer.OPTIONAL && LA8_5 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA8_5 >= ANTLRv4Lexer.SET && LA8_5 <= ANTLRv4Lexer.WILDCARD))) {
                                alt8 = 5;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae = new NoViableAltException(8, 5);
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
                    const nvae =
                        new NoViableAltException(8, 0);
                    throw nvae;
                }

            }
            switch (alt8) {
                case 1: {
                    // ./SourceGenTriggers.g:109:4: labeledElement
                    {
                        labeledElement3 = this.labeledElement();

                        omos = labeledElement3;
                    }
                    break;
                }

                case 2: {
                    // ./SourceGenTriggers.g:110:4: atom[null,false]
                    {
                        atom4 = this.atom(null, false);

                        omos = atom4;
                    }
                    break;
                }

                case 3: {
                    // ./SourceGenTriggers.g:111:4: subrule
                    {
                        subrule5 = this.subrule();

                        omos = subrule5;
                    }
                    break;
                }

                case 4: {
                    // ./SourceGenTriggers.g:112:6: ACTION
                    {
                        ACTION6 = this.match(this.input, ANTLRv4Lexer.ACTION)!;
                        omos = this.controller!.action(ACTION6 as ActionAST);
                    }
                    break;
                }

                case 5: {
                    // ./SourceGenTriggers.g:113:6: SEMPRED
                    {
                        SEMPRED7 = this.match(this.input, ANTLRv4Lexer.SEMPRED)!;
                        omos = this.controller!.sempred(SEMPRED7 as ActionAST);
                    }
                    break;
                }

                case 6: {
                    // ./SourceGenTriggers.g:114:4: ^( ACTION elementOptions )
                    {
                        ACTION8 = this.match(this.input, ANTLRv4Lexer.ACTION)!;
                        this.match(this.input, Constants.DOWN);
                        this.elementOptions();

                        this.match(this.input, Constants.UP);

                        omos = this.controller!.action(ACTION8 as ActionAST);
                    }
                    break;
                }

                case 7: {
                    // ./SourceGenTriggers.g:115:6: ^( SEMPRED elementOptions )
                    {
                        SEMPRED9 = this.match(this.input, ANTLRv4Lexer.SEMPRED)!;
                        this.match(this.input, Constants.DOWN);
                        this.elementOptions();

                        this.match(this.input, Constants.UP);

                        omos = this.controller!.sempred(SEMPRED9 as ActionAST);
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
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "element"

    // $ANTLR start "labeledElement"
    // ./SourceGenTriggers.g:118:1: labeledElement returns [List<? extends SrcOp> omos] : ( ^( ASSIGN ID atom[$ID,false] ) | ^( PLUS_ASSIGN ID atom[$ID,false] ) | ^( ASSIGN ID block[$ID,null] ) | ^( PLUS_ASSIGN ID block[$ID,null] ) );
    public labeledElement(): SrcOp[] | null {
        let omos = null;

        let ID10 = null;
        let ID12 = null;
        let ID14 = null;
        let ID16 = null;
        let atom11 = null;
        let atom13 = null;
        let block15 = null;
        let block17 = null;

        try {
            // ./SourceGenTriggers.g:119:2: ( ^( ASSIGN ID atom[$ID,false] ) | ^( PLUS_ASSIGN ID atom[$ID,false] ) | ^( ASSIGN ID block[$ID,null] ) | ^( PLUS_ASSIGN ID block[$ID,null] ) )
            let alt9 = 4;
            const LA9_0 = this.input.LA(1);
            if ((LA9_0 === ANTLRv4Lexer.ASSIGN)) {
                const LA9_1 = this.input.LA(2);
                if ((LA9_1 === Constants.DOWN)) {
                    const LA9_3 = this.input.LA(3);
                    if ((LA9_3 === ANTLRv4Lexer.ID)) {
                        const LA9_5 = this.input.LA(4);
                        if ((LA9_5 === ANTLRv4Lexer.DOT || LA9_5 === ANTLRv4Lexer.NOT || LA9_5 === ANTLRv4Lexer.RANGE || LA9_5 === ANTLRv4Lexer.RULE_REF || LA9_5 === ANTLRv4Lexer.STRING_LITERAL || LA9_5 === ANTLRv4Lexer.TOKEN_REF || (LA9_5 >= ANTLRv4Lexer.SET && LA9_5 <= ANTLRv4Lexer.WILDCARD))) {
                            alt9 = 1;
                        } else {
                            if ((LA9_5 === ANTLRv4Lexer.BLOCK)) {
                                alt9 = 3;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }
                                    const nvae = new NoViableAltException(9, 5);
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
                            const nvae = new NoViableAltException(9, 3);
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
                        const nvae = new NoViableAltException(9, 1);
                        throw nvae;
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }

            } else {
                if ((LA9_0 === ANTLRv4Lexer.PLUS_ASSIGN)) {
                    const LA9_2 = this.input.LA(2);
                    if ((LA9_2 === Constants.DOWN)) {
                        const LA9_4 = this.input.LA(3);
                        if ((LA9_4 === ANTLRv4Lexer.ID)) {
                            const LA9_6 = this.input.LA(4);
                            if ((LA9_6 === ANTLRv4Lexer.DOT || LA9_6 === ANTLRv4Lexer.NOT || LA9_6 === ANTLRv4Lexer.RANGE || LA9_6 === ANTLRv4Lexer.RULE_REF || LA9_6 === ANTLRv4Lexer.STRING_LITERAL || LA9_6 === ANTLRv4Lexer.TOKEN_REF || (LA9_6 >= ANTLRv4Lexer.SET && LA9_6 <= ANTLRv4Lexer.WILDCARD))) {
                                alt9 = 2;
                            } else {
                                if ((LA9_6 === ANTLRv4Lexer.BLOCK)) {
                                    alt9 = 4;
                                } else {
                                    const nvaeMark = this.input.mark();
                                    const lastIndex = this.input.index;
                                    try {
                                        for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                            this.input.consume();
                                        }
                                        const nvae = new NoViableAltException(9, 6);
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
                                const nvae = new NoViableAltException(9, 4);
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
                            const nvae = new NoViableAltException(9, 2);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException(9, 0);
                    throw nvae;
                }
            }

            switch (alt9) {
                case 1: {
                    // ./SourceGenTriggers.g:119:4: ^( ASSIGN ID atom[$ID,false] )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        ID10 = this.match(this.input, ANTLRv4Lexer.ID)!;
                        atom11 = this.atom(ID10, false);

                        this.match(this.input, Constants.UP);

                        omos = atom11;
                    }
                    break;
                }

                case 2: {
                    // ./SourceGenTriggers.g:120:4: ^( PLUS_ASSIGN ID atom[$ID,false] )
                    {
                        this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        ID12 = this.match(this.input, ANTLRv4Lexer.ID)!;
                        atom13 = this.atom(ID12, false);

                        this.match(this.input, Constants.UP);

                        omos = atom13;
                    }
                    break;
                }

                case 3: {
                    // ./SourceGenTriggers.g:121:4: ^( ASSIGN ID block[$ID,null] )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        ID14 = this.match(this.input, ANTLRv4Lexer.ID)!;
                        block15 = this.block(ID14, null);

                        this.match(this.input, Constants.UP);

                        omos = block15;
                    }
                    break;
                }

                case 4: {
                    // ./SourceGenTriggers.g:122:4: ^( PLUS_ASSIGN ID block[$ID,null] )
                    {
                        this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        ID16 = this.match(this.input, ANTLRv4Lexer.ID)!;
                        block17 = this.block(ID16, null);

                        this.match(this.input, Constants.UP);

                        omos = block17;
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
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "labeledElement"

    // $ANTLR start "subrule"
    // ./SourceGenTriggers.g:125:1: subrule returns [List<? extends SrcOp> omos] : ( ^( OPTIONAL b= block[null,$OPTIONAL] ) | ( ^(op= CLOSURE b= block[null,null] ) | ^(op= POSITIVE_CLOSURE b= block[null,null] ) ) | block[null, null] );
    public subrule(): SrcOp[] | null {
        let omos = null;

        let op = null;
        let OPTIONAL18 = null;
        let block19 = null;

        try {
            // ./SourceGenTriggers.g:126:2: ( ^( OPTIONAL b= block[null,$OPTIONAL] ) | ( ^(op= CLOSURE b= block[null,null] ) | ^(op= POSITIVE_CLOSURE b= block[null,null] ) ) | block[null, null] )
            let alt11 = 3;
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.OPTIONAL: {
                    {
                        alt11 = 1;
                    }
                    break;
                }

                case ANTLRv4Lexer.CLOSURE:
                case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                    {
                        alt11 = 2;
                    }
                    break;
                }

                case ANTLRv4Lexer.BLOCK: {
                    {
                        alt11 = 3;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException(11, 0);
                    throw nvae;
                }

            }
            switch (alt11) {
                case 1: {
                    // ./SourceGenTriggers.g:126:4: ^( OPTIONAL b= block[null,$OPTIONAL] )
                    {
                        OPTIONAL18 = this.match(this.input, ANTLRv4Lexer.OPTIONAL)!;
                        this.match(this.input, Constants.DOWN);
                        const b = this.block(null, OPTIONAL18);

                        this.match(this.input, Constants.UP);

                        omos = b;

                    }
                    break;
                }

                case 2: {
                    let b: SrcOp[] | null = null;
                    // ./SourceGenTriggers.g:130:4: ( ^(op= CLOSURE b= block[null,null] ) | ^(op= POSITIVE_CLOSURE b= block[null,null] ) )
                    {
                        // ./SourceGenTriggers.g:130:4: ( ^(op= CLOSURE b= block[null,null] ) | ^(op= POSITIVE_CLOSURE b= block[null,null] ) )
                        let alt10 = 2;
                        const LA10_0 = this.input.LA(1);
                        if ((LA10_0 === ANTLRv4Lexer.CLOSURE)) {
                            alt10 = 1;
                        } else {
                            if ((LA10_0 === ANTLRv4Lexer.POSITIVE_CLOSURE)) {
                                alt10 = 2;
                            } else {
                                const nvae =
                                    new NoViableAltException(10, 0);
                                throw nvae;
                            }
                        }

                        switch (alt10) {
                            case 1: {
                                // ./SourceGenTriggers.g:130:6: ^(op= CLOSURE b= block[null,null] )
                                {
                                    op = this.match(this.input, ANTLRv4Lexer.CLOSURE)!;
                                    this.match(this.input, Constants.DOWN);
                                    b = this.block(null, null);

                                    this.match(this.input, Constants.UP);

                                }
                                break;
                            }

                            case 2: {
                                // ./SourceGenTriggers.g:131:5: ^(op= POSITIVE_CLOSURE b= block[null,null] )
                                {
                                    op = this.match(this.input, ANTLRv4Lexer.POSITIVE_CLOSURE)!;
                                    this.match(this.input, Constants.DOWN);
                                    b = this.block(null, null);

                                    this.match(this.input, Constants.UP);

                                }
                                break;
                            }

                            default:

                        }

                        const alts = new Array<CodeBlockForAlt>();
                        const blk = b![0];
                        const alt = new CodeBlockForAlt(this.controller!.delegate);
                        alt.addOp(blk);
                        alts.push(alt);
                        const loop = this.controller!.getEBNFBlock(op, alts); // "star it"
                        this.hasLookaheadBlock ||= loop instanceof PlusBlock || loop instanceof StarBlock;
                        omos = [loop];

                    }
                    break;
                }

                case 3: {
                    // ./SourceGenTriggers.g:143:5: block[null, null]
                    {
                        block19 = this.block(null, null);

                        omos = block19;
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
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "subrule"

    // $ANTLR start "blockSet"
    // ./SourceGenTriggers.g:146:1: blockSet[GrammarAST label, boolean invert] returns [List<SrcOp> omos] : ^( SET ( atom[label,invert] )+ ) ;
    public blockSet(label: GrammarAST | null, invert: boolean): SrcOp[] | null {
        let omos = null;

        let SET20 = null;

        try {
            ;
            // ./SourceGenTriggers.g:147:5: ( ^( SET ( atom[label,invert] )+ ) )
            // ./SourceGenTriggers.g:147:7: ^( SET ( atom[label,invert] )+ )
            {
                SET20 = this.match(this.input, ANTLRv4Lexer.SET)!;
                this.match(this.input, Constants.DOWN);
                // ./SourceGenTriggers.g:147:13: ( atom[label,invert] )+
                let cnt12 = 0;
                loop12:
                while (true) {
                    let alt12 = 2;
                    const LA12_0 = this.input.LA(1);
                    if ((LA12_0 === ANTLRv4Lexer.DOT || LA12_0 === ANTLRv4Lexer.NOT || LA12_0 === ANTLRv4Lexer.RANGE || LA12_0 === ANTLRv4Lexer.RULE_REF || LA12_0 === ANTLRv4Lexer.STRING_LITERAL || LA12_0 === ANTLRv4Lexer.TOKEN_REF || (LA12_0 >= ANTLRv4Lexer.SET && LA12_0 <= ANTLRv4Lexer.WILDCARD))) {
                        alt12 = 1;
                    }

                    switch (alt12) {
                        case 1: {
                            // ./SourceGenTriggers.g:147:13: atom[label,invert]
                            {
                                this.atom(label, invert);

                            }
                            break;
                        }

                        default: {
                            if (cnt12 >= 1) {
                                break loop12;
                            }

                            const eee = new EarlyExitException(12);
                            throw eee;
                        }

                    }
                    cnt12++;
                }

                this.match(this.input, Constants.UP);

                omos = this.controller!.set(SET20, label, invert);
            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "blockSet"

    // $ANTLR start "atom"
    // ./SourceGenTriggers.g:160:1: atom[GrammarAST label, boolean invert] returns [List<SrcOp> omos] : ( ^( NOT a= atom[$label, true] ) | range[label] | ^( DOT ID terminal[$label] ) | ^( DOT ID ruleref[$label] ) | ^( WILDCARD . ) | WILDCARD | terminal[label] | ruleref[label] | blockSet[$label, invert] );
    public atom(label: GrammarAST | null, invert: boolean): SrcOp[] | null {
        let omos = null;

        let WILDCARD22 = null;
        let WILDCARD23 = null;
        let a = null;
        let range21 = null;
        let terminal24 = null;
        let ruleref25 = null;
        let blockSet26 = null;

        try {
            // ./SourceGenTriggers.g:161:2: ( ^( NOT a= atom[$label, true] ) | range[label] | ^( DOT ID terminal[$label] ) | ^( DOT ID ruleref[$label] ) | ^( WILDCARD . ) | WILDCARD | terminal[label] | ruleref[label] | blockSet[$label, invert] )
            let alt13 = 9;
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.NOT: {
                    {
                        alt13 = 1;
                    }
                    break;
                }

                case ANTLRv4Lexer.RANGE: {
                    {
                        alt13 = 2;
                    }
                    break;
                }

                case ANTLRv4Lexer.DOT: {
                    {
                        const LA13_3 = this.input.LA(2);
                        if ((LA13_3 === Constants.DOWN)) {
                            const LA13_8 = this.input.LA(3);
                            if ((LA13_8 === ANTLRv4Lexer.ID)) {
                                const LA13_11 = this.input.LA(4);
                                if ((LA13_11 === ANTLRv4Lexer.STRING_LITERAL || LA13_11 === ANTLRv4Lexer.TOKEN_REF)) {
                                    alt13 = 3;
                                } else {
                                    if ((LA13_11 === ANTLRv4Lexer.RULE_REF)) {
                                        alt13 = 4;
                                    } else {
                                        const nvaeMark = this.input.mark();
                                        const lastIndex = this.input.index;
                                        try {
                                            for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                                this.input.consume();
                                            }
                                            const nvae = new NoViableAltException(13, 11);
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
                                    const nvae = new NoViableAltException(13, 8);
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
                                const nvae = new NoViableAltException(13, 3);
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
                        const LA13_4 = this.input.LA(2);
                        if ((LA13_4 === Constants.DOWN)) {
                            alt13 = 5;
                        } else {
                            if (((LA13_4 >= Constants.UP && LA13_4 <= ANTLRv4Lexer.ACTION) || LA13_4 === ANTLRv4Lexer.ASSIGN || LA13_4 === ANTLRv4Lexer.DOT || LA13_4 === ANTLRv4Lexer.NOT || LA13_4 === ANTLRv4Lexer.PLUS_ASSIGN || LA13_4 === ANTLRv4Lexer.RANGE || LA13_4 === ANTLRv4Lexer.RULE_REF || LA13_4 === ANTLRv4Lexer.SEMPRED || LA13_4 === ANTLRv4Lexer.STRING_LITERAL || LA13_4 === ANTLRv4Lexer.TOKEN_REF || (LA13_4 >= ANTLRv4Lexer.BLOCK && LA13_4 <= ANTLRv4Lexer.CLOSURE) || (LA13_4 >= ANTLRv4Lexer.OPTIONAL && LA13_4 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA13_4 >= ANTLRv4Lexer.SET && LA13_4 <= ANTLRv4Lexer.WILDCARD))) {
                                alt13 = 6;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    const nvae = new NoViableAltException(13, 4);
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

                case ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer.TOKEN_REF: {
                    {
                        alt13 = 7;
                    }
                    break;
                }

                case ANTLRv4Lexer.RULE_REF: {
                    {
                        alt13 = 8;
                    }
                    break;
                }

                case ANTLRv4Lexer.SET: {
                    {
                        alt13 = 9;
                    }
                    break;
                }

                default: {
                    const nvae =
                        new NoViableAltException(13, 0);
                    throw nvae;
                }

            }
            switch (alt13) {
                case 1: {
                    // ./SourceGenTriggers.g:161:4: ^( NOT a= atom[$label, true] )
                    {
                        this.match(this.input, ANTLRv4Lexer.NOT);
                        this.match(this.input, Constants.DOWN);
                        a = this.atom(label, true);

                        this.match(this.input, Constants.UP);

                        omos = a;
                    }
                    break;
                }

                case 2: {
                    // ./SourceGenTriggers.g:162:4: range[label]
                    {
                        range21 = this.range(label);

                        omos = range21;
                    }
                    break;
                }

                case 3: {
                    // ./SourceGenTriggers.g:163:4: ^( DOT ID terminal[$label] )
                    {
                        this.match(this.input, ANTLRv4Lexer.DOT);
                        this.match(this.input, Constants.DOWN);
                        this.match(this.input, ANTLRv4Lexer.ID);
                        this.terminal(label);

                        this.match(this.input, Constants.UP);

                    }
                    break;
                }

                case 4: {
                    // ./SourceGenTriggers.g:164:4: ^( DOT ID ruleref[$label] )
                    {
                        this.match(this.input, ANTLRv4Lexer.DOT);
                        this.match(this.input, Constants.DOWN);
                        this.match(this.input, ANTLRv4Lexer.ID);
                        this.ruleref(label);

                        this.match(this.input, Constants.UP);

                    }
                    break;
                }

                case 5: {
                    // ./SourceGenTriggers.g:165:7: ^( WILDCARD . )
                    {
                        WILDCARD22 = this.match(this.input, ANTLRv4Lexer.WILDCARD)!;
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);

                        omos = this.controller!.wildcard(WILDCARD22, label);
                    }
                    break;
                }

                case 6: {
                    // ./SourceGenTriggers.g:166:7: WILDCARD
                    {
                        WILDCARD23 = this.match(this.input, ANTLRv4Lexer.WILDCARD)!;
                        omos = this.controller!.wildcard(WILDCARD23, label);
                    }
                    break;
                }

                case 7: {
                    // ./SourceGenTriggers.g:167:9: terminal[label]
                    {
                        terminal24 = this.terminal(label);

                        omos = terminal24;
                    }
                    break;
                }

                case 8: {
                    // ./SourceGenTriggers.g:168:9: ruleref[label]
                    {
                        ruleref25 = this.ruleref(label);

                        omos = ruleref25;
                    }
                    break;
                }

                case 9: {
                    // ./SourceGenTriggers.g:169:4: blockSet[$label, invert]
                    {
                        blockSet26 = this.blockSet(label, invert);

                        omos = blockSet26;
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
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "atom"

    // $ANTLR start "ruleref"
    // ./SourceGenTriggers.g:172:1: ruleref[GrammarAST label] returns [List<SrcOp> omos] : ^( RULE_REF ( ARG_ACTION )? ( elementOptions )? ) ;
    public ruleref(label: GrammarAST | null): SrcOp[] | null {
        let omos = null;

        let RULE_REF27: GrammarAST | null = null;
        let ARG_ACTION28 = null;

        try {
            ;
            // ./SourceGenTriggers.g:173:5: ( ^( RULE_REF ( ARG_ACTION )? ( elementOptions )? ) )
            // ./SourceGenTriggers.g:173:7: ^( RULE_REF ( ARG_ACTION )? ( elementOptions )? )
            {
                RULE_REF27 = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN);
                    // ./SourceGenTriggers.g:173:18: ( ARG_ACTION )?
                    let alt14 = 2;
                    const LA14_0 = this.input.LA(1);
                    if ((LA14_0 === ANTLRv4Lexer.ARG_ACTION)) {
                        alt14 = 1;
                    }
                    switch (alt14) {
                        case 1: {
                            // ./SourceGenTriggers.g:173:18: ARG_ACTION
                            {
                                ARG_ACTION28 = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;
                            }
                            break;
                        }

                        default:

                    }

                    // ./SourceGenTriggers.g:173:30: ( elementOptions )?
                    let alt15 = 2;
                    const LA15_0 = this.input.LA(1);
                    if ((LA15_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                        alt15 = 1;
                    }
                    switch (alt15) {
                        case 1: {
                            // ./SourceGenTriggers.g:173:30: elementOptions
                            {
                                this.elementOptions();

                            }
                            break;
                        }

                        default:

                    }

                    this.match(this.input, Constants.UP);
                }

                omos = this.controller!.ruleRef(RULE_REF27, label, ARG_ACTION28);
            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "ruleref"

    // $ANTLR start "range"
    // ./SourceGenTriggers.g:176:1: range[GrammarAST label] returns [List<SrcOp> omos] : ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) ;
    public range(label: GrammarAST | null): SrcOp[] | null {
        const omos = null;

        try {
            // ./SourceGenTriggers.g:177:5: ( ^( RANGE a= STRING_LITERAL b= STRING_LITERAL ) )
            // ./SourceGenTriggers.g:177:7: ^( RANGE a= STRING_LITERAL b= STRING_LITERAL )
            {
                this.match(this.input, ANTLRv4Lexer.RANGE);
                this.match(this.input, Constants.DOWN);
                this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                this.match(this.input, Constants.UP);

            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "range"

    // $ANTLR start "terminal"
    // ./SourceGenTriggers.g:180:1: terminal[GrammarAST label] returns [List<SrcOp> omos] : ( ^( STRING_LITERAL . ) | STRING_LITERAL | ^( TOKEN_REF ARG_ACTION . ) | ^( TOKEN_REF . ) | TOKEN_REF );
    public terminal(label: GrammarAST | null): SrcOp[] | null {
        let omos = null;

        let STRING_LITERAL29 = null;
        let STRING_LITERAL30 = null;
        let TOKEN_REF31 = null;
        let ARG_ACTION32 = null;
        let TOKEN_REF33 = null;
        let TOKEN_REF34 = null;

        try {
            // ./SourceGenTriggers.g:181:5: ( ^( STRING_LITERAL . ) | STRING_LITERAL | ^( TOKEN_REF ARG_ACTION . ) | ^( TOKEN_REF . ) | TOKEN_REF )
            let alt16 = 5;
            const LA16_0 = this.input.LA(1);
            if ((LA16_0 === ANTLRv4Lexer.STRING_LITERAL)) {
                const LA16_1 = this.input.LA(2);
                if ((LA16_1 === Constants.DOWN)) {
                    alt16 = 1;
                } else {
                    if (((LA16_1 >= Constants.UP && LA16_1 <= ANTLRv4Lexer.ACTION) || LA16_1 === ANTLRv4Lexer.ASSIGN || LA16_1 === ANTLRv4Lexer.DOT || LA16_1 === ANTLRv4Lexer.NOT || LA16_1 === ANTLRv4Lexer.PLUS_ASSIGN || LA16_1 === ANTLRv4Lexer.RANGE || LA16_1 === ANTLRv4Lexer.RULE_REF || LA16_1 === ANTLRv4Lexer.SEMPRED || LA16_1 === ANTLRv4Lexer.STRING_LITERAL || LA16_1 === ANTLRv4Lexer.TOKEN_REF || (LA16_1 >= ANTLRv4Lexer.BLOCK && LA16_1 <= ANTLRv4Lexer.CLOSURE) || (LA16_1 >= ANTLRv4Lexer.OPTIONAL && LA16_1 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA16_1 >= ANTLRv4Lexer.SET && LA16_1 <= ANTLRv4Lexer.WILDCARD))) {
                        alt16 = 2;
                    } else {
                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            const nvae = new NoViableAltException(16, 1);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                }

            } else {
                if ((LA16_0 === ANTLRv4Lexer.TOKEN_REF)) {
                    const LA16_2 = this.input.LA(2);
                    if ((LA16_2 === Constants.DOWN)) {
                        const LA16_5 = this.input.LA(3);
                        if ((LA16_5 === ANTLRv4Lexer.ARG_ACTION)) {
                            const LA16_7 = this.input.LA(4);
                            if (((LA16_7 >= ANTLRv4Lexer.ACTION && LA16_7 <= ANTLRv4Lexer.WILDCARD))) {
                                alt16 = 3;
                            } else {
                                if (((LA16_7 >= Constants.DOWN && LA16_7 <= Constants.UP))) {
                                    alt16 = 4;
                                } else {
                                    const nvaeMark = this.input.mark();
                                    const lastIndex = this.input.index;
                                    try {
                                        for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                            this.input.consume();
                                        }
                                        const nvae = new NoViableAltException(16, 7);
                                        throw nvae;
                                    } finally {
                                        this.input.seek(lastIndex);
                                        this.input.release(nvaeMark);
                                    }
                                }
                            }

                        } else {
                            if (((LA16_5 >= ANTLRv4Lexer.ACTION && LA16_5 <= ANTLRv4Lexer.ACTION_STRING_LITERAL) || (LA16_5 >= ANTLRv4Lexer.ARG_OR_CHARSET && LA16_5 <= ANTLRv4Lexer.WILDCARD))) {
                                alt16 = 4;
                            } else {
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }
                                    const nvae = new NoViableAltException(16, 5);
                                    throw nvae;
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }
                        }

                    } else {
                        if (((LA16_2 >= Constants.UP && LA16_2 <= ANTLRv4Lexer.ACTION) || LA16_2 === ANTLRv4Lexer.ASSIGN || LA16_2 === ANTLRv4Lexer.DOT || LA16_2 === ANTLRv4Lexer.NOT || LA16_2 === ANTLRv4Lexer.PLUS_ASSIGN || LA16_2 === ANTLRv4Lexer.RANGE || LA16_2 === ANTLRv4Lexer.RULE_REF || LA16_2 === ANTLRv4Lexer.SEMPRED || LA16_2 === ANTLRv4Lexer.STRING_LITERAL || LA16_2 === ANTLRv4Lexer.TOKEN_REF || (LA16_2 >= ANTLRv4Lexer.BLOCK && LA16_2 <= ANTLRv4Lexer.CLOSURE) || (LA16_2 >= ANTLRv4Lexer.OPTIONAL && LA16_2 <= ANTLRv4Lexer.POSITIVE_CLOSURE) || (LA16_2 >= ANTLRv4Lexer.SET && LA16_2 <= ANTLRv4Lexer.WILDCARD))) {
                            alt16 = 5;
                        } else {
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                const nvae = new NoViableAltException(16, 2);
                                throw nvae;
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(nvaeMark);
                            }
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException(16, 0);
                    throw nvae;
                }
            }

            switch (alt16) {
                case 1: {
                    // ./SourceGenTriggers.g:181:8: ^( STRING_LITERAL . )
                    {
                        STRING_LITERAL29 = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);

                        omos = this.controller!.stringRef(STRING_LITERAL29, label);
                    }
                    break;
                }

                case 2: {
                    // ./SourceGenTriggers.g:182:7: STRING_LITERAL
                    {
                        STRING_LITERAL30 = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;
                        omos = this.controller!.stringRef(STRING_LITERAL30, label);
                    }
                    break;
                }

                case 3: {
                    // ./SourceGenTriggers.g:183:7: ^( TOKEN_REF ARG_ACTION . )
                    {
                        TOKEN_REF31 = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;
                        this.match(this.input, Constants.DOWN);
                        ARG_ACTION32 = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;
                        this.matchAny();
                        this.match(this.input, Constants.UP);

                        omos = this.controller!.tokenRef(TOKEN_REF31, label, ARG_ACTION32);
                    }
                    break;
                }

                case 4: {
                    // ./SourceGenTriggers.g:184:7: ^( TOKEN_REF . )
                    {
                        TOKEN_REF33 = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);

                        omos = this.controller!.tokenRef(TOKEN_REF33, label, null);
                    }
                    break;
                }

                case 5: {
                    // ./SourceGenTriggers.g:185:7: TOKEN_REF
                    {
                        TOKEN_REF34 = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;
                        omos = this.controller!.tokenRef(TOKEN_REF34, label, null);
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
        } finally {
            // do for sure before leaving
        }

        return omos;
    }
    // $ANTLR end "terminal"

    // $ANTLR start "elementOptions"
    // ./SourceGenTriggers.g:188:1: elementOptions : ^( ELEMENT_OPTIONS ( elementOption )+ ) ;
    public elementOptions(): void {
        try {
            ;
            // ./SourceGenTriggers.g:189:5: ( ^( ELEMENT_OPTIONS ( elementOption )+ ) )
            // ./SourceGenTriggers.g:189:7: ^( ELEMENT_OPTIONS ( elementOption )+ )
            {
                this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);
                this.match(this.input, Constants.DOWN);
                // ./SourceGenTriggers.g:189:25: ( elementOption )+
                let cnt17 = 0;
                loop17:
                while (true) {
                    let alt17 = 2;
                    const LA17_0 = this.input.LA(1);
                    if ((LA17_0 === ANTLRv4Lexer.ASSIGN || LA17_0 === ANTLRv4Lexer.ID)) {
                        alt17 = 1;
                    }

                    switch (alt17) {
                        case 1: {
                            // ./SourceGenTriggers.g:189:25: elementOption
                            {
                                this.elementOption();

                            }
                            break;
                        }

                        default: {
                            if (cnt17 >= 1) {
                                break loop17;
                            }

                            const eee = new EarlyExitException(17);
                            throw eee;
                        }

                    }
                    cnt17++;
                }

                this.match(this.input, Constants.UP);

            }

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        } finally {
            // do for sure before leaving
        }
    }
    // $ANTLR end "elementOptions"

    // $ANTLR start "elementOption"
    // ./SourceGenTriggers.g:192:1: elementOption : ( ID | ^( ASSIGN ID ID ) | ^( ASSIGN ID STRING_LITERAL ) | ^( ASSIGN ID ACTION ) | ^( ASSIGN ID INT ) );
    public elementOption(): void {
        try {
            // ./SourceGenTriggers.g:193:5: ( ID | ^( ASSIGN ID ID ) | ^( ASSIGN ID STRING_LITERAL ) | ^( ASSIGN ID ACTION ) | ^( ASSIGN ID INT ) )
            let alt18 = 5;
            const LA18_0 = this.input.LA(1);
            if ((LA18_0 === ANTLRv4Lexer.ID)) {
                alt18 = 1;
            } else {
                if ((LA18_0 === ANTLRv4Lexer.ASSIGN)) {
                    const LA18_2 = this.input.LA(2);
                    if ((LA18_2 === Constants.DOWN)) {
                        const LA18_3 = this.input.LA(3);
                        if ((LA18_3 === ANTLRv4Lexer.ID)) {
                            switch (this.input.LA(4)) {
                                case ANTLRv4Lexer.ID: {
                                    {
                                        alt18 = 2;
                                    }
                                    break;
                                }

                                case ANTLRv4Lexer.STRING_LITERAL: {
                                    {
                                        alt18 = 3;
                                    }
                                    break;
                                }

                                case ANTLRv4Lexer.ACTION: {
                                    {
                                        alt18 = 4;
                                    }
                                    break;
                                }

                                case ANTLRv4Lexer.INT: {
                                    {
                                        alt18 = 5;
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
                                        const nvae = new NoViableAltException(18, 4);
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
                                const nvae = new NoViableAltException(18, 3);
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
                            const nvae = new NoViableAltException(18, 2);
                            throw nvae;
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }

                } else {
                    const nvae =
                        new NoViableAltException(18, 0);
                    throw nvae;
                }
            }

            switch (alt18) {
                case 1: {
                    // ./SourceGenTriggers.g:193:7: ID
                    {
                        this.match(this.input, ANTLRv4Lexer.ID);
                    }
                    break;
                }

                case 2: {
                    // ./SourceGenTriggers.g:194:9: ^( ASSIGN ID ID )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        this.match(this.input, ANTLRv4Lexer.ID);
                        this.match(this.input, ANTLRv4Lexer.ID);
                        this.match(this.input, Constants.UP);

                    }
                    break;
                }

                case 3: {
                    // ./SourceGenTriggers.g:195:9: ^( ASSIGN ID STRING_LITERAL )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        this.match(this.input, ANTLRv4Lexer.ID);
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                        this.match(this.input, Constants.UP);

                    }
                    break;
                }

                case 4: {
                    // ./SourceGenTriggers.g:196:9: ^( ASSIGN ID ACTION )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        this.match(this.input, ANTLRv4Lexer.ID);
                        this.match(this.input, ANTLRv4Lexer.ACTION);
                        this.match(this.input, Constants.UP);

                    }
                    break;
                }

                case 5: {
                    // ./SourceGenTriggers.g:197:9: ^( ASSIGN ID INT )
                    {
                        this.match(this.input, ANTLRv4Lexer.ASSIGN);
                        this.match(this.input, Constants.DOWN);
                        this.match(this.input, ANTLRv4Lexer.ID);
                        this.match(this.input, ANTLRv4Lexer.INT);
                        this.match(this.input, Constants.UP);

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
        } finally {
            // do for sure before leaving
        }
    };;

}

export namespace SourceGenTriggers {
    export type alternative_return = InstanceType<typeof SourceGenTriggers.alternative_return>;
    export type alt_return = InstanceType<typeof SourceGenTriggers.alt_return>;
}
