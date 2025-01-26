/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

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
import type { ErrorManager } from "../../tool/ErrorManager.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../EarlyExitException.js";
import { IRecognizerSharedState } from "../misc/IRecognizerSharedState.js";
import { NoViableAltException } from "../NoViableAltException.js";
import { TreeParser } from "../TreeParser.js";

/* eslint-disable max-len, @typescript-eslint/naming-convention */
// cspell: disable

interface IAltResults {
    altCodeBlock?: CodeBlockForAlt;
    ops: SrcOp[];
}

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

    public controller?: OutputModelController;
    public hasLookaheadBlock: boolean;

    public constructor(errorManager: ErrorManager, input: CommonTreeNodeStream,
        stateOrController?: IRecognizerSharedState | OutputModelController) {
        let state: IRecognizerSharedState | undefined;
        let controller: OutputModelController | undefined;

        if (stateOrController instanceof OutputModelController) {
            state = undefined;
            controller = stateOrController;
        } else {
            state = stateOrController;
            controller = undefined;
        }

        super(errorManager, input, state);
        this.controller = controller;
    }

    public override getTokenNames(): string[] {
        return SourceGenTriggers.tokenNames;
    }
    public dummy(): void {
        try {
            this.block(null, null);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    public block(label: GrammarAST | null, ebnfRoot: GrammarAST | null): SrcOp[] | null {
        let omos = null;

        let blk = null;

        try {
            {
                blk = this.match(this.input, ANTLRv4Lexer.BLOCK)!;
                this.match(this.input, Constants.DOWN);
                let alt2 = 2;
                const LA2_0 = this.input.LA(1);
                if ((LA2_0 === ANTLRv4Lexer.OPTIONS)) {
                    alt2 = 1;
                }
                switch (alt2) {
                    case 1: {
                        {
                            this.match(this.input, ANTLRv4Lexer.OPTIONS);
                            if (this.input.LA(1) === Constants.DOWN) {
                                this.match(this.input, Constants.DOWN);
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
                            {
                                const alternative1 = this.alternative();
                                if (alternative1.altCodeBlock !== undefined) {
                                    alts.push(alternative1.altCodeBlock);
                                }
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
        }

        return omos;
    }

    public alternative(): IAltResults {
        const result: IAltResults = { ops: [] };

        const outerMost = this.inContext("RULE BLOCK");

        try {
            {
                const a = this.alt(outerMost);
                result.altCodeBlock = a.altCodeBlock;
                result.ops = a.ops;
            }

            this.controller!.finishAlternative(result.altCodeBlock!, result.ops, outerMost);

        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }

    public alt(outerMost: boolean): IAltResults {
        const result: IAltResults = { ops: [] };
        const start = this.input.LT(1) as GrammarAST;

        // set alt if outer ALT only (the only ones with alt field set to Alternative object)
        const altAST = start as AltAST;
        if (outerMost) {
            this.controller!.setCurrentOuterMostAlt(altAST.alt);
        }

        try {
            let alt7 = 1;

            let index = 0;
            if (start.getChild(index)!.getType() === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                ++index;
            }

            if (start.getChild(index)!.getType() === ANTLRv4Lexer.EPSILON) {
                alt7 = 2;
            }

            switch (alt7) {
                case 1: {
                    {

                        const elems = new Array<SrcOp>();
                        result.altCodeBlock = this.controller!.alternative(this.controller!.getCurrentOuterMostAlt(), outerMost);
                        result.altCodeBlock.ops = result.ops = elems;
                        this.controller!.setCurrentBlock(result.altCodeBlock);

                        this.match(this.input, ANTLRv4Lexer.ALT);
                        this.match(this.input, Constants.DOWN);
                        let alt4 = 2;
                        const LA4_0 = this.input.LA(1);
                        if ((LA4_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                            alt4 = 1;
                        }
                        switch (alt4) {
                            case 1: {
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

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
                                    {
                                        const element2 = this.element();
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
                    {
                        this.match(this.input, ANTLRv4Lexer.ALT);
                        this.match(this.input, Constants.DOWN);
                        let alt6 = 2;
                        const LA6_0 = this.input.LA(1);
                        if ((LA6_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                            alt6 = 1;
                        }
                        switch (alt6) {
                            case 1: {
                                {
                                    this.elementOptions();

                                }
                                break;
                            }

                            default:

                        }

                        this.match(this.input, ANTLRv4Lexer.EPSILON);
                        this.match(this.input, Constants.UP);

                        result.altCodeBlock = this.controller!.epsilon(this.controller!.getCurrentOuterMostAlt(), outerMost);
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
    }

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
                    {
                        labeledElement3 = this.labeledElement();

                        omos = labeledElement3;
                    }
                    break;
                }

                case 2: {
                    {
                        atom4 = this.atom(null, false);

                        omos = atom4;
                    }
                    break;
                }

                case 3: {
                    {
                        subrule5 = this.subrule();

                        omos = subrule5;
                    }
                    break;
                }

                case 4: {
                    {
                        ACTION6 = this.match(this.input, ANTLRv4Lexer.ACTION)!;
                        omos = this.controller!.action(ACTION6 as ActionAST);
                    }
                    break;
                }

                case 5: {
                    {
                        SEMPRED7 = this.match(this.input, ANTLRv4Lexer.SEMPRED)!;
                        omos = this.controller!.sempred(SEMPRED7 as ActionAST);
                    }
                    break;
                }

                case 6: {
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
        }

        return omos;
    }

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
        }

        return omos;
    }

    public subrule(): SrcOp[] | null {
        let omos = null;

        let op = null;
        let OPTIONAL18 = null;
        let block19 = null;

        try {
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
                    {
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
                                {
                                    op = this.match(this.input, ANTLRv4Lexer.CLOSURE)!;
                                    this.match(this.input, Constants.DOWN);
                                    b = this.block(null, null);

                                    this.match(this.input, Constants.UP);

                                }
                                break;
                            }

                            case 2: {
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
        }

        return omos;
    }

    public blockSet(label: GrammarAST | null, invert: boolean): SrcOp[] | null {
        let omos = null;

        let SET20 = null;

        try {
            {
                SET20 = this.match(this.input, ANTLRv4Lexer.SET)!;
                this.match(this.input, Constants.DOWN);
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
        }

        return omos;
    }

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
                    {
                        range21 = this.range(label);

                        omos = range21;
                    }
                    break;
                }

                case 3: {
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
                    {
                        WILDCARD23 = this.match(this.input, ANTLRv4Lexer.WILDCARD)!;
                        omos = this.controller!.wildcard(WILDCARD23, label);
                    }
                    break;
                }

                case 7: {
                    {
                        terminal24 = this.terminal(label);

                        omos = terminal24;
                    }
                    break;
                }

                case 8: {
                    {
                        ruleref25 = this.ruleref(label);

                        omos = ruleref25;
                    }
                    break;
                }

                case 9: {
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
        }

        return omos;
    }

    public ruleref(label: GrammarAST | null): SrcOp[] | null {
        let omos = null;

        let RULE_REF27: GrammarAST | null = null;
        let ARG_ACTION28 = null;

        try {
            {
                RULE_REF27 = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN);
                    let alt14 = 2;
                    const LA14_0 = this.input.LA(1);
                    if ((LA14_0 === ANTLRv4Lexer.ARG_ACTION)) {
                        alt14 = 1;
                    }
                    switch (alt14) {
                        case 1: {
                            {
                                ARG_ACTION28 = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;
                            }
                            break;
                        }

                        default:

                    }

                    let alt15 = 2;
                    const LA15_0 = this.input.LA(1);
                    if ((LA15_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                        alt15 = 1;
                    }
                    switch (alt15) {
                        case 1: {
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
        }

        return omos;
    }

    public range(label: GrammarAST | null): SrcOp[] | null {
        const omos = null;

        try {
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
        }

        return omos;
    }

    public terminal(label: GrammarAST | null): SrcOp[] | null {
        let omos = null;

        let STRING_LITERAL29 = null;
        let STRING_LITERAL30 = null;
        let TOKEN_REF31 = null;
        let ARG_ACTION32 = null;
        let TOKEN_REF33 = null;
        let TOKEN_REF34 = null;

        try {
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
                    {
                        STRING_LITERAL30 = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;
                        omos = this.controller!.stringRef(STRING_LITERAL30, label);
                    }
                    break;
                }

                case 3: {
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
        }

        return omos;
    }

    public elementOptions(): void {
        try {
            {
                this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);
                this.match(this.input, Constants.DOWN);
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
        }
    }

    public elementOption(): void {
        try {
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
                    {
                        this.match(this.input, ANTLRv4Lexer.ID);
                    }
                    break;
                }

                case 2: {
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
        }
    };

}
