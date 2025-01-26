/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Constants } from "../../Constants.js";
import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";
import type { AltAST } from "../../tool/ast/AltAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { ErrorManager } from "../../tool/ErrorManager.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../EarlyExitException.js";
import { FailedPredicateException } from "../FailedPredicateException.js";
import { MismatchedSetException } from "../MismatchedSetException.js";
import { NoViableAltException } from "../NoViableAltException.js";
import { TreeParser } from "../TreeParser.js";

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/naming-convention */
// cspell: disable

/** Find left-recursive rules */
export class LeftRecursiveRuleWalker extends TreeParser {
    protected numAlts: number;
    protected ruleName: string;

    private currentOuterAltNumber: number;

    // A list of token types used for lookahead checks.
    private readonly singleAtomLookaheadValues = [
        ANTLRv4Lexer.ASSIGN,
        ANTLRv4Lexer.DOT,
        ANTLRv4Lexer.NOT,
        ANTLRv4Lexer.PLUS_ASSIGN,
        ANTLRv4Lexer.RANGE,
        ANTLRv4Lexer.RULE_REF,
        ANTLRv4Lexer.SEMPRED,
        ANTLRv4Lexer.STRING_LITERAL,
        ANTLRv4Lexer.TOKEN_REF,
        ANTLRv4Lexer.EPSILON,
    ];

    private readonly singleAtomWithActionLookaheadValues = [
        ANTLRv4Lexer.ACTION,
        ...this.singleAtomLookaheadValues,
    ];

    public constructor(input: CommonTreeNodeStream, errorManager: ErrorManager) {
        super(errorManager, input);
    }

    public recursiveRule(): boolean {
        let isLeftRec = false;

        this.currentOuterAltNumber = 1;

        this.match(this.input, ANTLRv4Lexer.RULE);
        if (this.failed) {
            return isLeftRec;
        }

        this.match(this.input, Constants.DOWN);
        if (this.failed) {
            return isLeftRec;
        }

        const id = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;
        if (this.failed) {
            return isLeftRec;
        }

        if (this.state.backtracking === 0) {
            this.ruleName = id.getText()!;
        }

        const lookahead = this.input.LA(1);
        if ((lookahead >= ANTLRv4Lexer.PRIVATE && lookahead <= ANTLRv4Lexer.PUBLIC)) {
            this.ruleModifier();
            if (this.failed) {
                return isLeftRec;
            }
        }

        if (this.input.LA(1) === ANTLRv4Lexer.RETURNS) {
            this.match(this.input, ANTLRv4Lexer.RETURNS);
            if (this.failed) {
                return isLeftRec;
            }

            this.match(this.input, Constants.DOWN);
            if (this.failed) {
                return isLeftRec;
            }

            const a = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;
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

        if (this.input.LA(1) === ANTLRv4Lexer.LOCALS) {
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

        while (true) {
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.OPTIONS) {
                this.match(this.input, ANTLRv4Lexer.OPTIONS);
                if (this.failed) {
                    return isLeftRec;
                }

                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN);
                    if (this.failed) {
                        return isLeftRec;
                    }

                    while (true) {
                        const lookahead = this.input.LA(1);
                        if (lookahead >= ANTLRv4Lexer.ACTION && lookahead <= ANTLRv4Lexer.PUBLIC) {
                            this.matchAny();
                            if (this.failed) {
                                return isLeftRec;
                            }
                        } else {
                            break;
                        }
                    }

                    this.match(this.input, Constants.UP);
                    if (this.failed) {
                        return isLeftRec;
                    }
                }
            } else if (lookahead === ANTLRv4Lexer.AT) {
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
            } else {
                break;
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

        return isLeftRec;
    }

    protected setAltAssoc(altTree: AltAST, alt: number): void { /**/ }
    protected binaryAlt(altTree: AltAST, alt: number): void { /**/ }
    protected prefixAlt(altTree: AltAST, alt: number): void { /**/ }
    protected suffixAlt(altTree: AltAST, alt: number): void {/**/ }
    protected otherAlt(altTree: AltAST, alt: number): void { /**/ }
    protected setReturnValues(t: GrammarAST): void { /**/ }

    private exceptionGroup(): void {
        while (true) {
            if (this.input.LA(1) === ANTLRv4Lexer.CATCH) {
                this.exceptionHandler();
                if (this.failed) {
                    return;
                }
            } else {
                break;
            }
        }

        if (this.input.LA(1) === ANTLRv4Lexer.FINALLY) {
            this.finallyClause();
            if (this.failed) {
                return;
            }
        }
    }

    private exceptionHandler(): void {
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

    private finallyClause(): void {
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

    private ruleModifier(): void {
        const lookahead = this.input.LA(1);
        if (lookahead >= ANTLRv4Lexer.PRIVATE && lookahead <= ANTLRv4Lexer.PUBLIC) {
            this.input.consume();
            this.state.errorRecovery = false;
            this.failed = false;
        } else {
            if (this.state.backtracking > 0) {
                this.failed = true;

                return;
            }

            throw new MismatchedSetException(null);
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

        let alternativeCount = 0;
        while (true) {
            if (this.input.LA(1) === ANTLRv4Lexer.ALT) {
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
            } else {
                if (alternativeCount >= 1) {
                    break;
                }

                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return result;
                }

                throw new EarlyExitException(8);
            }

            alternativeCount++;
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

        if (this.input.LA(1) === ANTLRv4Lexer.ALT) {
            if (this.syntacticPredicate1()) {
                this.binary();
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 0) {
                    this.binaryAlt(start as AltAST, this.currentOuterAltNumber);
                    result = true;
                }
            } else if (this.syntacticPredicate2()) {
                this.prefix();
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 0) {
                    this.prefixAlt(start as AltAST, this.currentOuterAltNumber);
                }
            } else if (this.syntacticPredicate3()) {
                this.suffix();
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 0) {
                    this.suffixAlt(start as AltAST, this.currentOuterAltNumber);
                    result = true;
                }
            } else {
                this.nonLeftRecur();
                if (this.failed) {
                    return result;
                }

                if (this.state.backtracking === 0) {
                    this.otherAlt(start as AltAST, this.currentOuterAltNumber);
                }
            }
        } else {
            if (this.state.backtracking > 0) {
                this.failed = true;

                return result;
            }

            throw new NoViableAltException(9, 0);
        }

        return result;
    }

    private binary(): void {
        const alt = this.match(this.input, ANTLRv4Lexer.ALT);
        if (this.failed) {
            return;
        }

        this.match(this.input, Constants.DOWN);
        if (this.failed) {
            return;
        }

        if ((this.input.LA(1) === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
            this.elementOptions();
            if (this.failed) {
                return;
            }
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

        while (true) {
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.ACTION
                || lookahead === ANTLRv4Lexer.SEMPRED
                || lookahead === ANTLRv4Lexer.EPSILON) {
                this.epsilonElement();
                if (this.failed) {
                    return;
                }
            } else {
                break;
            }
        }

        this.match(this.input, Constants.UP);
        if (this.failed) {
            return;
        }

        if (this.state.backtracking === 0) {
            this.setAltAssoc(alt as AltAST, this.currentOuterAltNumber);
        }
    }

    private prefix(): void {
        const alt = this.match(this.input, ANTLRv4Lexer.ALT);
        if (this.failed) {
            return;
        }

        this.match(this.input, Constants.DOWN);
        if (this.failed) {
            return;
        }

        if ((this.input.LA(1) === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
            this.elementOptions();
            if (this.failed) {
                return;
            }
        }

        let elementCount = 0;
        while (true) {
            if (this.predictElement()) {
                this.element();
                if (this.failed) {
                    return;
                }
            } else {
                if (elementCount >= 1) {
                    break;
                }

                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                throw new EarlyExitException(14);
            }

            elementCount++;
        }

        this.recurse();
        if (this.failed) {
            return;
        }

        while (true) {
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.ACTION
                || lookahead === ANTLRv4Lexer.SEMPRED
                || lookahead === ANTLRv4Lexer.EPSILON) {
                this.epsilonElement();
                if (this.failed) {
                    return;
                }
            } else {
                break;
            }
        }

        this.match(this.input, Constants.UP);
        if (this.failed) {
            return;
        }

        if (this.state.backtracking === 0) {
            this.setAltAssoc(alt as AltAST, this.currentOuterAltNumber);
        }
    }

    private suffix(): void {
        const alt = this.match(this.input, ANTLRv4Lexer.ALT);
        if (this.failed) {
            return;
        }

        this.match(this.input, Constants.DOWN);
        if (this.failed) {
            return;
        }

        if (this.input.LA(1) === ANTLRv4Lexer.ELEMENT_OPTIONS) {
            this.elementOptions();
            if (this.failed) {
                return;
            }
        }

        this.recurse();
        if (this.failed) {
            return;
        }

        let elementCount = 0;
        while (true) {
            const lookahead = this.input.LA(1);
            if (this.singleAtomWithActionLookaheadValues.includes(lookahead)
                || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                this.element();
                if (this.failed) {
                    return;
                }
            } else {
                if (elementCount >= 1) {
                    break;
                }

                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                throw new EarlyExitException(17);
            }

            elementCount++;
        }

        this.match(this.input, Constants.UP);
        if (this.failed) {
            return;
        }

        if (this.state.backtracking === 0 && alt) {
            this.setAltAssoc(alt as AltAST, this.currentOuterAltNumber);
        }
    }

    private nonLeftRecur(): void {
        this.match(this.input, ANTLRv4Lexer.ALT);
        if (this.failed) {
            return;
        }

        this.match(this.input, Constants.DOWN);
        if (this.failed) {
            return;
        }

        if (this.input.LA(1) === ANTLRv4Lexer.ELEMENT_OPTIONS) {
            this.elementOptions();
            if (this.failed) {
                return;
            }
        }

        let elementCount = 0;
        while (true) {
            const lookahead = this.input.LA(1);

            if (
                this.singleAtomWithActionLookaheadValues.includes(lookahead)
                || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                this.element();
                if (this.failed) {
                    return;
                }
            } else {
                if (elementCount >= 1) {
                    break;
                }

                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }
                const eee = new EarlyExitException(19);
                throw eee;
            }

            elementCount++;
        }

        this.match(this.input, Constants.UP);
        if (this.failed) {
            return;
        }
    }

    private recurse(): void {
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.ASSIGN: {
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

                break;
            }

            case ANTLRv4Lexer.PLUS_ASSIGN: {
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

                break;
            }

            case ANTLRv4Lexer.RULE_REF: {
                this.recurseNoLabel();
                if (this.failed) {
                    return;
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
    }

    private recurseNoLabel(): void {
        if ((this.input.LT(1)!).getText() !== this.ruleName) {
            if (this.state.backtracking > 0) {
                this.failed = true;

                return;
            }

            throw new FailedPredicateException("recurseNoLabel", "");
        }

        this.match(this.input, ANTLRv4Lexer.RULE_REF);
        if (this.failed) {
            return;
        }
    }

    private elementOptions(): void {
        this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);
        if (this.failed) {
            return;
        }

        if (this.input.LA(1) === Constants.DOWN) {
            this.match(this.input, Constants.DOWN);
            if (this.failed) {
                return;
            }

            while (true) {
                const lookahed = this.input.LA(1);
                if (lookahed === ANTLRv4Lexer.ASSIGN || lookahed === ANTLRv4Lexer.ID) {
                    this.elementOption();
                    if (this.failed) {
                        return;
                    }
                } else {
                    break;
                }
            }

            this.match(this.input, Constants.UP);
            if (this.failed) {
                return;
            }
        }
    }

    private elementOption(): void {
        const lookahead = this.input.LA(1);
        if (lookahead === ANTLRv4Lexer.ID) {
            this.match(this.input, ANTLRv4Lexer.ID);
            if (this.failed) {
                return;
            }
        } else {
            if (lookahead === ANTLRv4Lexer.ASSIGN) {
                if ((this.input.LA(2) === Constants.DOWN)) {
                    if (this.input.LA(3) === ANTLRv4Lexer.ID) {
                        switch (this.input.LA(4)) {
                            case ANTLRv4Lexer.ID: {
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

                                break;
                            }

                            case ANTLRv4Lexer.STRING_LITERAL: {
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

                                break;
                            }

                            case ANTLRv4Lexer.ACTION: {
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

                                break;
                            }

                            case ANTLRv4Lexer.INT: {
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

                                break;
                            }

                            default: {
                                if (this.state.backtracking > 0) {
                                    this.failed = true;

                                    return;
                                }

                                const mark = this.input.mark();
                                const lastIndex = this.input.index;
                                try {
                                    this.input.consume();
                                    this.input.consume();
                                    this.input.consume();

                                    throw new NoViableAltException(23, 4);
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(mark);
                                }
                            }

                        }
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();
                            this.input.consume();

                            throw new NoViableAltException(23, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                } else {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return;
                    }

                    const mark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        throw new NoViableAltException(23, 2);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
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
    }

    private element(): void {
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.RULE_REF: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    this.atom();
                    if (this.failed) {
                        return;
                    }
                } else if ((lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                    || this.singleAtomLookaheadValues.includes(lookahead2)
                    || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                    this.match(this.input, ANTLRv4Lexer.RULE_REF);
                    if (this.failed) {
                        return;
                    }
                } else {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return;
                    }

                    const mark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        throw new NoViableAltException(25, 1);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
                    }
                }

                break;
            }

            case ANTLRv4Lexer.DOT:
            case ANTLRv4Lexer.STRING_LITERAL:
            case ANTLRv4Lexer.TOKEN_REF:
            case ANTLRv4Lexer.WILDCARD: {
                this.atom();
                if (this.failed) {
                    return;
                }

                break;
            }

            case ANTLRv4Lexer.NOT: {
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

                break;
            }

            case ANTLRv4Lexer.RANGE: {
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

                break;
            }

            case ANTLRv4Lexer.ASSIGN: {
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

                break;
            }

            case ANTLRv4Lexer.PLUS_ASSIGN: {
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

                break;
            }

            case ANTLRv4Lexer.SET: {
                this.match(this.input, ANTLRv4Lexer.SET);
                if (this.failed) {
                    return;
                }

                this.match(this.input, Constants.DOWN);
                if (this.failed) {
                    return;
                }

                let setElementCount = 0;
                while (true) {
                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Lexer.STRING_LITERAL || lookahead === ANTLRv4Lexer.TOKEN_REF) {
                        this.setElement();
                        if (this.failed) {
                            return;
                        }
                    } else {
                        if (setElementCount >= 1) {
                            break;
                        }

                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        throw new EarlyExitException(24);
                    }

                    setElementCount++;
                }

                this.match(this.input, Constants.UP);
                if (this.failed) {
                    return;
                }

                break;
            }

            case ANTLRv4Lexer.BLOCK:
            case ANTLRv4Lexer.CLOSURE:
            case ANTLRv4Lexer.OPTIONAL:
            case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                this.ebnf();
                if (this.failed) {
                    return;
                }

                break;
            }

            case ANTLRv4Lexer.ACTION:
            case ANTLRv4Lexer.SEMPRED:
            case ANTLRv4Lexer.EPSILON: {
                this.epsilonElement();
                if (this.failed) {
                    return;
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
    }

    private epsilonElement(): void {
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.ACTION: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
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
                } else if (
                    (lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                    || this.singleAtomLookaheadValues.includes(lookahead2)
                    || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                    this.match(this.input, ANTLRv4Lexer.ACTION);
                    if (this.failed) {
                        return;
                    }

                } else {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return;
                    }

                    const mark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();
                        throw new NoViableAltException(26, 1);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
                    }
                }

                break;
            }

            case ANTLRv4Lexer.SEMPRED: {
                const lookahead2 = this.input.LA(2);
                if ((lookahead2 === Constants.DOWN)) {
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
                } else if ((lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                    || this.singleAtomLookaheadValues.includes(lookahead2)
                    || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                    this.match(this.input, ANTLRv4Lexer.SEMPRED);
                    if (this.failed) {
                        return;
                    }
                } else {
                    if (this.state.backtracking > 0) {
                        this.failed = true;

                        return;
                    }

                    const mark = this.input.mark();
                    const lastIndex = this.input.index;
                    try {
                        this.input.consume();

                        throw new NoViableAltException(26, 2);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
                    }
                }

                break;
            }

            case ANTLRv4Lexer.EPSILON: {
                this.match(this.input, ANTLRv4Lexer.EPSILON);
                if (this.failed) {
                    return;
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
    }

    private setElement(): void {
        const lookahead = this.input.LA(1);
        if ((lookahead === ANTLRv4Lexer.STRING_LITERAL)) {
            const lookahead2 = this.input.LA(2);
            if (lookahead2 === Constants.DOWN) {
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
            } else if (lookahead2 === Constants.UP
                || lookahead2 === ANTLRv4Lexer.STRING_LITERAL
                || lookahead2 === ANTLRv4Lexer.TOKEN_REF) {
                this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                if (this.failed) {
                    return;
                }
            } else {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                const mark = this.input.mark();
                const lastIndex = this.input.index;
                try {
                    this.input.consume();

                    throw new NoViableAltException(27, 1);
                } finally {
                    this.input.seek(lastIndex);
                    this.input.release(mark);
                }
            }
        } else if ((lookahead === ANTLRv4Lexer.TOKEN_REF)) {
            const lookahead2 = this.input.LA(2);
            if (lookahead2 === Constants.DOWN) {
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
            } else if (lookahead2 === Constants.UP
                || lookahead2 === ANTLRv4Lexer.STRING_LITERAL
                || lookahead2 === ANTLRv4Lexer.TOKEN_REF) {
                this.match(this.input, ANTLRv4Lexer.TOKEN_REF);
                if (this.failed) {
                    return;
                }
            } else {
                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                const mark = this.input.mark();
                const lastIndex = this.input.index;
                try {
                    this.input.consume();

                    throw new NoViableAltException(27, 2);
                } finally {
                    this.input.seek(lastIndex);
                    this.input.release(mark);
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

    private ebnf(): void {
        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.BLOCK: {
                this.block();
                if (this.failed) {
                    return;
                }

                break;
            }

            case ANTLRv4Lexer.OPTIONAL: {
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

                break;
            }

            case ANTLRv4Lexer.CLOSURE: {
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

                break;
            }

            case ANTLRv4Lexer.POSITIVE_CLOSURE: {
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
    }

    private block(): void {
        this.match(this.input, ANTLRv4Lexer.BLOCK);
        if (this.failed) {
            return;
        }

        this.match(this.input, Constants.DOWN);
        if (this.failed) {
            return;
        }

        if ((this.input.LA(1) === ANTLRv4Lexer.ACTION)) {
            this.match(this.input, ANTLRv4Lexer.ACTION);
            if (this.failed) {
                return;
            }
        }

        let altCount = 0;
        while (true) {
            if (this.input.LA(1) === ANTLRv4Lexer.ALT) {
                this.alternative();
                if (this.failed) {
                    return;
                }
            } else {
                if (altCount >= 1) {
                    break;
                }

                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                throw new EarlyExitException(30);
            }

            altCount++;
        }

        this.match(this.input, Constants.UP);
        if (this.failed) {
            return;
        }
    }

    private alternative(): void {
        this.match(this.input, ANTLRv4Lexer.ALT);
        if (this.failed) {
            return;
        }

        this.match(this.input, Constants.DOWN);
        if (this.failed) {
            return;
        }

        if ((this.input.LA(1) === ANTLRv4Lexer.ELEMENT_OPTIONS)) {
            this.elementOptions();
            if (this.failed) {
                return;
            }
        }

        let elementCount = 0;
        while (true) {
            const lookahead = this.input.LA(1);
            if (this.singleAtomWithActionLookaheadValues.includes(lookahead)
                || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                this.element();
                if (this.failed) {
                    return;
                }
            } else {
                if (elementCount >= 1) {
                    break;
                }

                if (this.state.backtracking > 0) {
                    this.failed = true;

                    return;
                }

                throw new EarlyExitException(32);
            }

            elementCount++;
        }

        this.match(this.input, Constants.UP);
        if (this.failed) {
            return;
        }
    }

    private atom(): void {
        let alt = 8;

        const matchesLookahead = (lookahead: number): boolean => {
            return (lookahead >= Constants.UP && lookahead <= ANTLRv4Lexer.ACTION)
                || this.singleAtomLookaheadValues.includes(lookahead)
                || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD);
        };

        switch (this.input.LA(1)) {
            case ANTLRv4Lexer.RULE_REF: {
                alt = 1;

                break;
            }

            case ANTLRv4Lexer.STRING_LITERAL: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    alt = 2;
                } else {
                    if (matchesLookahead(lookahead2)) {
                        alt = 3;
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        const mark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();

                            throw new NoViableAltException(35, 2);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                }

                break;
            }

            case ANTLRv4Lexer.TOKEN_REF: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    alt = 4;
                } else {
                    if (matchesLookahead(lookahead2)) {
                        alt = 5;
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        const mark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();

                            throw new NoViableAltException(35, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                }

                break;
            }

            case ANTLRv4Lexer.WILDCARD: {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    alt = 6;
                } else {
                    if (matchesLookahead(lookahead2)) {
                        alt = 7;
                    } else {
                        if (this.state.backtracking > 0) {
                            this.failed = true;

                            return;
                        }

                        const mark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();

                            throw new NoViableAltException(35, 4);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                }

                break;
            }

            case ANTLRv4Lexer.DOT: {
                alt = 8;
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

        switch (alt) {
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

    private syntacticPredicate2(): boolean {
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
        const alt = this.input.LA(1);
        switch (alt) {
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
