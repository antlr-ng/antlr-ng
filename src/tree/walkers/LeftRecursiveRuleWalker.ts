/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable max-len, @typescript-eslint/naming-convention */
// cspell: disable

import { Constants } from "../../Constants.js";
import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";
import type { AltAST } from "../../tool/ast/AltAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../EarlyExitException.js";
import { FailedPredicateException } from "../FailedPredicateException.js";
import { createRecognizerSharedState } from "../misc/IRecognizerSharedState.js";
import { MismatchedSetException } from "../MismatchedSetException.js";
import { NoViableAltException } from "../NoViableAltException.js";
import { TreeParser } from "../TreeParser.js";

/** Find left-recursive rules */
export class LeftRecursiveRuleWalker extends TreeParser {
    private static readonly tokenNames = [
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

    protected numAlts: number;
    protected ruleName: string;

    private currentOuterAltNumber: number;

    public constructor(input: CommonTreeNodeStream) {
        super(input, createRecognizerSharedState());
    }

    public override getTokenNames(): string[] {
        return LeftRecursiveRuleWalker.tokenNames;
    }

    public recursiveRule(): boolean {
        let isLeftRec = false;

        let id = null;
        let a = null;

        this.currentOuterAltNumber = 1;

        {
            this.match(this.input, ANTLRv4Lexer.RULE);

            if (this.failed) {
                return isLeftRec;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return isLeftRec;
            }

            id = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;

            if (this.failed) {
                return isLeftRec;
            }

            if (this.state.backtracking === 0) {
                this.ruleName = id.getText()!;
            }

            let alt1 = 2;
            const LA1_0 = this.input.LA(1);
            if (((LA1_0 >= ANTLRv4Lexer.PRIVATE && LA1_0 <= ANTLRv4Lexer.PUBLIC))) {
                alt1 = 1;
            }
            switch (alt1) {
                case 1: {
                    {
                        this.ruleModifier();

                        if (this.failed) {
                            return isLeftRec;
                        }

                    }
                    break;
                }

                default:

            }

            let alt2 = 2;
            const LA2_0 = this.input.LA(1);
            if ((LA2_0 === ANTLRv4Lexer.RETURNS)) {
                alt2 = 1;
            }
            switch (alt2) {
                case 1: {
                    {
                        this.match(this.input, ANTLRv4Lexer.RETURNS);

                        if (this.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, Constants.DOWN);

                        if (this.failed) {
                            return isLeftRec;
                        }

                        a = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;

                        if (this.failed) {
                            return isLeftRec;
                        }

                        if (this.state.backtracking === 0) {
                            this.setReturnValues(a);
                        }
                        this.match(this.input, Constants.UP);

                        if (this.failed) {
                            return isLeftRec;
                        }

                    }
                    break;
                }

                default:

            }

            let alt3 = 2;
            const LA3_0 = this.input.LA(1);
            if ((LA3_0 === ANTLRv4Lexer.LOCALS)) {
                alt3 = 1;
            }
            switch (alt3) {
                case 1: {
                    {
                        this.match(this.input, ANTLRv4Lexer.LOCALS);

                        if (this.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, Constants.DOWN);

                        if (this.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, ANTLRv4Lexer.ARG_ACTION);

                        if (this.failed) {
                            return isLeftRec;
                        }

                        this.match(this.input, Constants.UP);

                        if (this.failed) {
                            return isLeftRec;
                        }

                    }
                    break;
                }

                default:

            }

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
                        {
                            this.match(this.input, ANTLRv4Lexer.OPTIONS);

                            if (this.failed) {
                                return isLeftRec;
                            }

                            if (this.input.LA(1) === Constants.DOWN) {
                                this.match(this.input, Constants.DOWN);

                                if (this.failed) {
                                    return isLeftRec;
                                }

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
                                            {
                                                this.matchAny();

                                                if (this.failed) {
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

                                if (this.failed) {
                                    return isLeftRec;
                                }

                            }

                        }
                        break;
                    }

                    case 2: {
                        {
                            this.match(this.input, ANTLRv4Lexer.AT);

                            if (this.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, Constants.DOWN);

                            if (this.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, ANTLRv4Lexer.ID);

                            if (this.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, ANTLRv4Lexer.ACTION);

                            if (this.failed) {
                                return isLeftRec;
                            }

                            this.match(this.input, Constants.UP);

                            if (this.failed) {
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

            isLeftRec = this.ruleBlock();
            if (this.failed) {
                return false;
            }

            if (this.state.backtracking !== 0) {
                isLeftRec = false;
            }

            this.exceptionGroup();
            if (this.failed) {
                return isLeftRec;
            }

            this.match(this.input, Constants.UP);
            if (this.failed) {
                return isLeftRec;
            }

        }

        return isLeftRec;
    }

    protected setAltAssoc(altTree: AltAST, alt: number): void { /**/ }
    protected binaryAlt(altTree: AltAST, alt: number): void { /**/ }
    protected prefixAlt(altTree: AltAST, alt: number): void { /**/ }
    protected suffixAlt(altTree: AltAST, alt: number): void {/**/ }
    protected otherAlt(altTree: AltAST, alt: number): void { /**/ }
    protected setReturnValues(t: GrammarAST): void { /**/ }

    private exceptionGroup(): void {
        {
            loop6:
            while (true) {
                let alt6 = 2;
                const LA6_0 = this.input.LA(1);
                if ((LA6_0 === ANTLRv4Lexer.CATCH)) {
                    alt6 = 1;
                }

                switch (alt6) {
                    case 1: {
                        {
                            this.exceptionHandler();

                            if (this.failed) {
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

            let alt7 = 2;
            const LA7_0 = this.input.LA(1);
            if ((LA7_0 === ANTLRv4Lexer.FINALLY)) {
                alt7 = 1;
            }
            switch (alt7) {
                case 1: {
                    {
                        this.finallyClause();

                        if (this.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

        }

    }

    private exceptionHandler(): void {
        {
            this.match(this.input, ANTLRv4Lexer.CATCH);

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            this.match(this.input, ANTLRv4Lexer.ARG_ACTION);

            if (this.failed) {
                return;
            }

            this.match(this.input, ANTLRv4Lexer.ACTION);

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.UP);

            if (this.failed) {
                return;
            }

        }

    }

    private finallyClause(): void {
        {
            this.match(this.input, ANTLRv4Lexer.FINALLY);

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            this.match(this.input, ANTLRv4Lexer.ACTION);

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.UP);

            if (this.failed) {
                return;
            }

        }

    }

    private ruleModifier(): void {
        {
            if ((this.input.LA(1) >= ANTLRv4Lexer.PRIVATE
                && this.input.LA(1) <= ANTLRv4Lexer.PUBLIC)) {
                this.input.consume();
                this.state.errorRecovery = false;
                this.failed = false;
            } else {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }
                const mse = new MismatchedSetException(null);
                throw mse;
            }
        }

    }

    private ruleBlock(): boolean {
        let result = false;
        const start = this.input.LT(1) as GrammarAST;
        this.numAlts = start.getChildCount();

        this.match(this.input, ANTLRv4Lexer.BLOCK);
        if (this.failed) {
            return result;
        }

        this.match(this.input, Constants.DOWN);

        if (this.failed) {
            return result;
        }

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
                    {
                        const o = this.outerAlternative();
                        if (this.failed) {
                            return result;
                        }

                        if (this.state.backtracking === 0 && o) {
                            result = true;
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
                        this.failed = true;

                        return result;
                    }
                    const eee = new EarlyExitException(8);
                    throw eee;
                }

            }
            cnt8++;
        }

        this.match(this.input, Constants.UP);

        if (this.failed) {
            return result;
        }

        return result;
    }

    private outerAlternative(): boolean {
        let result = false;
        const start = this.input.LT(1) as GrammarAST;

        let alt9 = 4;
        const LA9_0 = this.input.LA(1);
        if ((LA9_0 === ANTLRv4Lexer.ALT)) {
            if ((this.syntacticPredicate1())) {
                alt9 = 1;
            } else {
                if ((this.syntacitcPredicate2())) {
                    alt9 = 2;
                } else {
                    if ((this.syntacticPredicate3())) {
                        alt9 = 3;
                    } else {
                        alt9 = 4;
                    }

                }

            }
        } else {
            if (this.state.backtracking > 0) {
                this.failed = true;

                return result;
            }
            throw new NoViableAltException(9, 0);
        }

        switch (alt9) {
            case 1: {
                {
                    this.binary();

                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 0) {
                        this.binaryAlt(start as AltAST, this.currentOuterAltNumber);
                        result = true;
                    }
                }
                break;
            }

            case 2: {
                {
                    this.prefix();

                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 0) {
                        this.prefixAlt(start as AltAST, this.currentOuterAltNumber);
                    }
                }
                break;
            }

            case 3: {
                {
                    this.suffix();

                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 0) {
                        this.suffixAlt(start as AltAST, this.currentOuterAltNumber);
                        result = true;
                    }
                }
                break;
            }

            case 4: {
                {
                    this.nonLeftRecur();
                    if (this.failed) {
                        return result;
                    }

                    if (this.state.backtracking === 0) {
                        this.otherAlt(start as AltAST, this.currentOuterAltNumber);
                    }
                }
                break;
            }

            default:

        }

        return result;
    }

    private binary(): void {
        let ALT2 = null;

        {
            ALT2 = this.match(this.input, ANTLRv4Lexer.ALT)!;

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            let alt10 = 2;
            const LA10_0 = this.input.LA(1);
            if ((LA10_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt10 = 1;
            }
            switch (alt10) {
                case 1: {
                    {
                        this.elementOptions();

                        if (this.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            this.recurse();

            if (this.failed) {
                return;
            }

            while (true) {
                if (this.predictElement()) {
                    this.element();

                    if (this.failed) {
                        return;
                    }
                } else {
                    break;
                }
            }

            this.recurse();

            if (this.failed) {
                return;
            }

            loop12:
            while (true) {
                let alt12 = 2;
                const LA12_0 = this.input.LA(1);
                if ((LA12_0 === ANTLRv4Lexer.ACTION || LA12_0 === ANTLRv4Lexer.SEMPRED || LA12_0 === ANTLRv4Lexer.EPSILON)) {
                    alt12 = 1;
                }

                switch (alt12) {
                    case 1: {
                        {
                            this.epsilonElement();

                            if (this.failed) {
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

            if (this.failed) {
                return;
            }

            if (this.state.backtracking === 0) {
                this.setAltAssoc(ALT2 as AltAST, this.currentOuterAltNumber);
            }
        }

    }

    private prefix(): void {
        let ALT3 = null;

        {
            ALT3 = this.match(this.input, ANTLRv4Lexer.ALT)!;

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            let alt13 = 2;
            const LA13_0 = this.input.LA(1);
            if ((LA13_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt13 = 1;
            }
            switch (alt13) {
                case 1: {
                    {
                        this.elementOptions();

                        if (this.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            let cnt14 = 0;
            loop14:
            while (true) {
                if (this.predictElement()) {
                    this.element();

                    if (this.failed) {
                        return;
                    }
                } else {
                    if (cnt14 >= 1) {
                        break loop14;
                    }

                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return;
                    }
                    const eee = new EarlyExitException(14);
                    throw eee;
                }
                cnt14++;
            }

            this.recurse();

            if (this.failed) {
                return;
            }

            loop15:
            while (true) {
                let alt15 = 2;
                const LA15_0 = this.input.LA(1);
                if ((LA15_0 === ANTLRv4Lexer.ACTION || LA15_0 === ANTLRv4Lexer.SEMPRED || LA15_0 === ANTLRv4Lexer.EPSILON)) {
                    alt15 = 1;
                }

                switch (alt15) {
                    case 1: {
                        {
                            this.epsilonElement();

                            if (this.failed) {
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

            if (this.failed) {
                return;
            }

            if (this.state.backtracking === 0) {
                this.setAltAssoc(ALT3 as AltAST, this.currentOuterAltNumber);
            }
        }

    }

    private suffix(): void {
        let ALT4 = null;

        {
            ALT4 = this.match(this.input, ANTLRv4Lexer.ALT)!;

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            let alt16 = 2;
            const LA16_0 = this.input.LA(1);
            if ((LA16_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt16 = 1;
            }
            switch (alt16) {
                case 1: {
                    {
                        this.elementOptions();

                        if (this.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

            this.recurse();

            if (this.failed) {
                return;
            }

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
                        {
                            this.element();

                            if (this.failed) {
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
                            this.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(17);
                        throw eee;
                    }

                }
                cnt17++;
            }

            this.match(this.input, Constants.UP);

            if (this.failed) {
                return;
            }

            if (this.state.backtracking === 0) {
                this.setAltAssoc(ALT4 as AltAST, this.currentOuterAltNumber);
            }
        }

    }

    private nonLeftRecur(): void {
        {
            this.match(this.input, ANTLRv4Lexer.ALT);

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            let alt18 = 2;
            const LA18_0 = this.input.LA(1);
            if ((LA18_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt18 = 1;
            }
            switch (alt18) {
                case 1: {
                    {
                        this.elementOptions();

                        if (this.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

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
                        {
                            this.element();

                            if (this.failed) {
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
                            this.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(19);
                        throw eee;
                    }

                }
                cnt19++;
            }

            this.match(this.input, Constants.UP);

            if (this.failed) {
                return;
            }

        }

    }

    private recurse(): void {
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
                    this.failed = true;

                    return;
                }

                throw new NoViableAltException(20, 0);
            }

        }
        switch (alt20) {
            case 1: {
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.recurseNoLabel();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                {
                    this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.recurseNoLabel();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                {
                    this.recurseNoLabel();

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }

    }

    private recurseNoLabel(): void {
        {
            if ((this.input.LT(1)!).getText() !== this.ruleName) {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }
                throw new FailedPredicateException("recurseNoLabel", "((CommonTree)input.LT(1)).getText().equals(ruleName)");
            }
            this.match(this.input, ANTLRv4Lexer.RULE_REF);

            if (this.failed) {
                return;
            }

        }
    }

    private elementOptions(): void {
        {
            this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);

            if (this.failed) {
                return;
            }

            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);

                if (this.failed) {
                    return;
                }

                loop22:
                while (true) {
                    let alt22 = 2;
                    const LA22_0 = this.input.LA(1);
                    if ((LA22_0 === ANTLRv4Lexer.ASSIGN || LA22_0 === ANTLRv4Lexer.ID)) {
                        alt22 = 1;
                    }

                    switch (alt22) {
                        case 1: {
                            {
                                this.elementOption();

                                if (this.failed) {
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

                if (this.failed) {
                    return;
                }

            }

        }

    }

    private elementOption(): void {
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
                                    this.failed = true;

                                    return;
                                }
                                const nvaeMark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    for (let nvaeConsume = 0; nvaeConsume < 4 - 1; nvaeConsume++) {
                                        this.input.consume();
                                    }
                                    throw new NoViableAltException(23, 4);
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(nvaeMark);
                                }
                            }

                        }
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }
                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            for (let nvaeConsume = 0; nvaeConsume < 3 - 1; nvaeConsume++) {
                                this.input.consume();
                            }
                            throw new NoViableAltException(23, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }

                } else {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return;
                    }
                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;
                    try {
                        this.input.consume();
                        throw new NoViableAltException(23, 2);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(nvaeMark);
                    }
                }

            } else {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                throw new NoViableAltException(23, 0);
            }
        }

        switch (alt23) {
            case 1: {
                {
                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ACTION);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 5: {
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.INT);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }
    }

    private element(): void {
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
                                this.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                throw new NoViableAltException(25, 1);
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
                    this.failed = true;

                    return;
                }

                throw new NoViableAltException(25, 0);
            }

        }
        switch (alt25) {
            case 1: {
                {
                    this.atom();

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                {
                    this.match(this.input, ANTLRv4Lexer.NOT);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.element();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                {
                    this.match(this.input, ANTLRv4Lexer.RANGE);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.atom();

                    if (this.failed) {
                        return;
                    }

                    this.atom();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                {
                    this.match(this.input, ANTLRv4Lexer.ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.element();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 5: {
                {
                    this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, ANTLRv4Lexer.ID);

                    if (this.failed) {
                        return;
                    }

                    this.element();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 6: {
                {
                    this.match(this.input, ANTLRv4Lexer.SET);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

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
                                {
                                    this.setElement();

                                    if (this.failed) {
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
                                    this.failed = true;

                                    return;
                                }
                                const eee = new EarlyExitException(24);
                                throw eee;
                            }

                        }
                        cnt24++;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 7: {
                {
                    this.match(this.input, ANTLRv4Lexer.RULE_REF);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 8: {
                {
                    this.ebnf();

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 9: {
                {
                    this.epsilonElement();

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }
    }

    private epsilonElement(): void {
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
                                this.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                throw new NoViableAltException(26, 1);
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
                                this.failed = true;

                                return;
                            }
                            const nvaeMark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                throw new NoViableAltException(26, 2);
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
                    this.failed = true;

                    return;
                }

                throw new NoViableAltException(26, 0);
            }

        }
        switch (alt26) {
            case 1: {
                {
                    this.match(this.input, ANTLRv4Lexer.ACTION);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                {
                    this.match(this.input, ANTLRv4Lexer.SEMPRED);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                {
                    this.match(this.input, ANTLRv4Lexer.EPSILON);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                {
                    this.match(this.input, ANTLRv4Lexer.ACTION);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.elementOptions();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 5: {
                {
                    this.match(this.input, ANTLRv4Lexer.SEMPRED);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.elementOptions();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }

    }

    private setElement(): void {
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
                        this.failed = true;

                        return;
                    }
                    const nvaeMark = this.input.mark();
                    const lastIndex = this.input.index;
                    try {
                        this.input.consume();
                        throw new NoViableAltException(27, 1);
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
                            this.failed = true;

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
                    this.failed = true;

                    return;
                }

                throw new NoViableAltException(27, 0);
            }
        }

        switch (alt27) {
            case 1: {
                {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.elementOptions();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.elementOptions();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }
    }

    private ebnf(): void {
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
                    this.failed = true;

                    return;
                }

                throw new NoViableAltException(28, 0);
            }

        }
        switch (alt28) {
            case 1: {
                {
                    this.block();

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 2: {
                {
                    this.match(this.input, ANTLRv4Lexer.OPTIONAL);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.block();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 3: {
                {
                    this.match(this.input, ANTLRv4Lexer.CLOSURE);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.block();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            case 4: {
                {
                    this.match(this.input, ANTLRv4Lexer.POSITIVE_CLOSURE);

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.DOWN);

                    if (this.failed) {
                        return;
                    }

                    this.block();

                    if (this.failed) {
                        return;
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }

                }
                break;
            }

            default:

        }

    }

    private block(): void {
        {
            this.match(this.input, ANTLRv4Lexer.BLOCK);

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            let alt29 = 2;
            const LA29_0 = this.input.LA(1);
            if ((LA29_0 === ANTLRv4Lexer.ACTION)) {
                alt29 = 1;
            }
            switch (alt29) {
                case 1: {
                    {
                        this.match(this.input, ANTLRv4Lexer.ACTION);

                        if (this.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

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
                        {
                            this.alternative();

                            if (this.failed) {
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
                            this.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(30);
                        throw eee;
                    }

                }
                cnt30++;
            }

            this.match(this.input, Constants.UP);

            if (this.failed) {
                return;
            }

        }

    }

    private alternative(): void {
        {
            this.match(this.input, ANTLRv4Lexer.ALT);

            if (this.failed) {
                return;
            }

            this.match(this.input, Constants.DOWN);

            if (this.failed) {
                return;
            }

            let alt31 = 2;
            const LA31_0 = this.input.LA(1);
            if ((LA31_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                alt31 = 1;
            }
            switch (alt31) {
                case 1: {
                    {
                        this.elementOptions();

                        if (this.failed) {
                            return;
                        }

                    }
                    break;
                }

                default:

            }

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
                        {
                            this.element();

                            if (this.failed) {
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
                            this.failed = true;

                            return;
                        }
                        const eee = new EarlyExitException(32);
                        throw eee;
                    }

                }
                cnt32++;
            }

            this.match(this.input, Constants.UP);

            if (this.failed) {
                return;
            }

        }

    }

    private atom(): void {
        let alt35 = 8;
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.RULE_REF: {
                alt35 = 1;

                break;
            }

            case ANTLRv4Lexer.STRING_LITERAL: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    alt35 = 2;
                } else {
                    if ((lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                        || lookahead2 === ANTLRv4Lexer.ASSIGN
                        || lookahead2 === ANTLRv4Lexer.DOT
                        || lookahead2 === ANTLRv4Lexer.NOT
                        || lookahead2 === ANTLRv4Lexer.PLUS_ASSIGN
                        || lookahead2 === ANTLRv4Lexer.RANGE
                        || lookahead2 === ANTLRv4Lexer.RULE_REF
                        || lookahead2 === ANTLRv4Lexer.SEMPRED
                        || lookahead2 === ANTLRv4Lexer.STRING_LITERAL
                        || lookahead2 === ANTLRv4Lexer.TOKEN_REF
                        || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                        || lookahead2 === ANTLRv4Lexer.EPSILON
                        || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                        alt35 = 3;
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            throw new NoViableAltException(35, 2);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                }

                break;
            }

            case ANTLRv4Lexer.TOKEN_REF: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    alt35 = 4;
                } else {
                    if ((lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                        || lookahead2 === ANTLRv4Lexer.ASSIGN
                        || lookahead2 === ANTLRv4Lexer.DOT
                        || lookahead2 === ANTLRv4Lexer.NOT
                        || lookahead2 === ANTLRv4Lexer.PLUS_ASSIGN
                        || lookahead2 === ANTLRv4Lexer.RANGE
                        || lookahead2 === ANTLRv4Lexer.RULE_REF
                        || lookahead2 === ANTLRv4Lexer.SEMPRED
                        || lookahead2 === ANTLRv4Lexer.STRING_LITERAL
                        || lookahead2 === ANTLRv4Lexer.TOKEN_REF
                        || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                        || lookahead2 === ANTLRv4Lexer.EPSILON
                        || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                        alt35 = 5;
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            throw new NoViableAltException(35, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                }

                break;
            }

            case ANTLRv4Lexer.WILDCARD: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    alt35 = 6;
                } else {
                    if ((lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                        || lookahead2 === ANTLRv4Lexer.ASSIGN
                        || lookahead2 === ANTLRv4Lexer.DOT
                        || lookahead2 === ANTLRv4Lexer.NOT
                        || lookahead2 === ANTLRv4Lexer.PLUS_ASSIGN
                        || lookahead2 === ANTLRv4Lexer.RANGE
                        || lookahead2 === ANTLRv4Lexer.RULE_REF
                        || lookahead2 === ANTLRv4Lexer.SEMPRED
                        || lookahead2 === ANTLRv4Lexer.STRING_LITERAL
                        || lookahead2 === ANTLRv4Lexer.TOKEN_REF
                        || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                        || lookahead2 === ANTLRv4Lexer.EPSILON
                        || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                        alt35 = 7;
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        const nvaeMark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();
                            throw new NoViableAltException(35, 4);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(nvaeMark);
                        }
                    }
                }

                break;
            }

            case ANTLRv4Lexer.DOT: {
                alt35 = 8;
                break;
            }

            default: {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                throw new NoViableAltException(35, 0);
            }
        }

        switch (alt35) {
            case 1: {
                this.match(this.input, ANTLRv4Lexer.RULE_REF);
                if (this.failed) {
                    return;
                }

                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN);
                    if (this.failed) {
                        return;
                    }

                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Lexer.ARG_ACTION) {
                        this.match(this.input, ANTLRv4Lexer.ARG_ACTION);
                        if (this.failed) {
                            return;
                        }
                    }

                    const LA34_0 = this.input.LA(1);
                    if ((LA34_0 === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
                        this.elementOptions();
                        if (this.failed) {
                            return;
                        }
                    }

                    this.match(this.input, Constants.UP);

                    if (this.failed) {
                        return;
                    }
                }

                break;
            }

            case 2: {
                this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return;
                }

                this.elementOptions();
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return;
                }

                break;
            }

            case 3: {
                this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                if (this.failed) {
                    return;
                }

                break;
            }

            case 4: {
                this.match(this.input, ANTLRv4Lexer.TOKEN_REF);
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return;
                }

                this.elementOptions();
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return;
                }

                break;
            }

            case 5: {
                this.match(this.input, ANTLRv4Lexer.TOKEN_REF);
                if (this.failed) {
                    return;
                }

                break;
            }

            case 6: {
                this.match(this.input, ANTLRv4Lexer.WILDCARD);
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return;
                }

                this.elementOptions();
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return;
                }

                break;
            }

            case 7: {
                this.match(this.input, ANTLRv4Lexer.WILDCARD);
                if (this.failed) {
                    return;
                }

                break;
            }

            case 8: {
                this.match(this.input, ANTLRv4Lexer.DOT);
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return;
                }

                this.match(this.input, ANTLRv4Lexer.ID);
                if (this.failed) {
                    return;
                }

                this.element();
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return;
                }

                break;
            }

            default:

        }
    }

    private syntacticPredicate1(): boolean {
        this.state.backtracking++;
        const start = this.input.mark();
        const lastIndex = this.input.index;

        this.binary();

        const success = !this.failed;

        this.input.seek(lastIndex);
        this.input.release(start);
        this.state.backtracking--;
        this.failed = false;

        return success;
    }

    private syntacitcPredicate2(): boolean {
        this.state.backtracking++;
        const start = this.input.mark();
        const lastIndex = this.input.index;

        this.prefix();

        const success = !this.failed;

        this.input.seek(lastIndex);
        this.input.release(start);
        this.state.backtracking--;
        this.failed = false;

        return success;
    }

    private syntacticPredicate3(): boolean {
        this.state.backtracking++;
        const start = this.input.mark();
        const lastIndex = this.input.index;

        this.suffix();

        const success = !this.failed;

        this.input.seek(lastIndex);
        this.input.release(start);
        this.state.backtracking--;
        this.failed = false;

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
