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
import { AltAST } from "../../tool/ast/AltAST.js";
import type { BlockAST } from "../../tool/ast/BlockAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { ErrorManager } from "../../tool/ErrorManager.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../exceptions/EarlyExitException.js";
import { NoViableAltException } from "../exceptions/NoViableAltException.js";
import { TreeParser } from "../TreeParser.js";

interface IAltResults {
    altCodeBlock?: CodeBlockForAlt;
    ops: SrcOp[];
}

export class SourceGenTriggers extends TreeParser {
    // A list of token types used for lookahead checks.
    private static readonly singleAtomLookaheadValues = [
        ANTLRv4Lexer.ASSIGN,
        ANTLRv4Lexer.DOT,
        ANTLRv4Lexer.NOT,
        ANTLRv4Lexer.PLUS_ASSIGN,
        ANTLRv4Lexer.RANGE,
        ANTLRv4Lexer.RULE_REF,
        ANTLRv4Lexer.SEMPRED,
        ANTLRv4Lexer.STRING_LITERAL,
        ANTLRv4Lexer.TOKEN_REF,
    ];

    private static readonly singleAtomWithActionLookaheadValues = [
        ANTLRv4Lexer.ACTION,
        ...this.singleAtomLookaheadValues,
    ];

    public hasLookaheadBlock: boolean;

    private controller?: OutputModelController;

    public constructor(errorManager: ErrorManager, input: CommonTreeNodeStream, controller?: OutputModelController) {
        super(errorManager, input);
        this.controller = controller;
    }

    public block(label: GrammarAST | null, ebnfRoot: GrammarAST | null): SrcOp[] {
        let result: SrcOp[] = [];

        let blk = null;

        try {
            blk = this.match(this.input, ANTLRv4Lexer.BLOCK)!;
            this.match(this.input, Constants.Down);

            if (this.input.lookahead(1) === ANTLRv4Lexer.OPTIONS) {
                this.match(this.input, ANTLRv4Lexer.OPTIONS);
                if (this.input.lookahead(1) === Constants.Down) {
                    this.match(this.input, Constants.Down);

                    let matchCount = 0;
                    while (true) {
                        const lookahead = this.input.lookahead(1);
                        if (lookahead >= ANTLRv4Lexer.ACTION && lookahead <= ANTLRv4Lexer.WILDCARD) {
                            this.matchAny();
                        } else {
                            if (matchCount >= 1) {
                                break;
                            }

                            throw new EarlyExitException(1);
                        }

                        matchCount++;
                    }

                    this.match(this.input, Constants.Up);
                }
            }

            const alts = new Array<CodeBlockForAlt>();
            let altCount = 0;
            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Lexer.ALT) {
                    const alternative1 = this.alternative();
                    if (alternative1.altCodeBlock !== undefined) {
                        alts.push(alternative1.altCodeBlock);
                    }
                } else {
                    if (altCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(3);
                }

                altCount++;
            }

            this.match(this.input, Constants.Up);
            if (alts.length === 1 && ebnfRoot === null) {
                return alts;
            }

            if (ebnfRoot === null) {
                result = [this.controller!.getChoiceBlock(blk as BlockAST, alts, label)];
            } else {
                const choice = this.controller!.getEBNFBlock(ebnfRoot, alts);
                this.hasLookaheadBlock ||= choice instanceof PlusBlock || choice instanceof StarBlock;
                result = [choice];
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

    private alternative(): IAltResults {
        const result: IAltResults = { ops: [] };

        const outerMost = this.inContext([ANTLRv4Lexer.RULE, ANTLRv4Lexer.BLOCK]);

        try {
            const a = this.alt(outerMost);
            result.altCodeBlock = a.altCodeBlock;
            result.ops = a.ops;

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

    private alt(outerMost: boolean): IAltResults {
        const result: IAltResults = { ops: [] };
        const start = this.input.lookaheadType(1) as GrammarAST;

        // Set alt if outer ALT only (the only ones with alt field set to Alternative object).
        const altAST = start as AltAST;
        if (outerMost) {
            this.controller!.currentOuterMostAlt = altAST.alt;
        }

        try {
            let index = 0;
            if (start.children[index].getType() === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                ++index;
            }

            if (start.children[index].getType() === ANTLRv4Lexer.EPSILON) {
                this.match(this.input, ANTLRv4Lexer.ALT);
                this.match(this.input, Constants.Down);

                if (this.input.lookahead(1) === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                    this.elementOptions();
                }

                this.match(this.input, ANTLRv4Lexer.EPSILON);
                this.match(this.input, Constants.Up);

                result.altCodeBlock = this.controller!.epsilon(this.controller!.currentOuterMostAlt, outerMost);
            } else {
                const elems = new Array<SrcOp>();
                result.altCodeBlock = this.controller!.alternative(this.controller!.currentOuterMostAlt, outerMost);
                result.altCodeBlock.ops = result.ops = elems;
                this.controller!.currentBlock = result.altCodeBlock;

                this.match(this.input, ANTLRv4Lexer.ALT);
                this.match(this.input, Constants.Down);

                if (this.input.lookahead(1) === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                    this.elementOptions();
                }

                let elementCount = 0;
                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (
                        SourceGenTriggers.singleAtomWithActionLookaheadValues.includes(lookahead)
                        || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                        const element = this.element();
                        element.forEach((op) => {
                            elems.push(op);
                        });
                    } else {
                        if (elementCount >= 1) {
                            break;
                        }

                        throw new EarlyExitException(5);
                    }

                    ++elementCount;
                }

                this.match(this.input, Constants.Up);
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

    private element(): SrcOp[] {
        let result: SrcOp[] = [];

        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Lexer.ASSIGN:
                case ANTLRv4Lexer.PLUS_ASSIGN: {
                    result = this.labeledElement();

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
                    result = this.atom(null, false);

                    break;
                }

                case ANTLRv4Lexer.BLOCK:
                case ANTLRv4Lexer.CLOSURE:
                case ANTLRv4Lexer.OPTIONAL:
                case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                    result = this.subrule();

                    break;
                }

                case ANTLRv4Lexer.ACTION: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const action = this.match<ActionAST>(this.input, ANTLRv4Lexer.ACTION)!;
                        this.match(this.input, Constants.Down);
                        this.elementOptions();

                        this.match(this.input, Constants.Up);
                        result = this.controller!.action(action);
                    } else if ((lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Lexer.ACTION)
                        || SourceGenTriggers.singleAtomLookaheadValues.includes(lookahead2)
                        || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                        const action = this.match(this.input, ANTLRv4Lexer.ACTION)!;
                        result = this.controller!.action(action as ActionAST);
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();

                            throw new NoViableAltException(8, 4);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Lexer.SEMPRED: {
                    const lookahead = this.input.lookahead(2);
                    if (lookahead === Constants.Down) {
                        const sempred = this.match<ActionAST>(this.input, ANTLRv4Lexer.SEMPRED)!;
                        this.match(this.input, Constants.Down);
                        this.elementOptions();

                        this.match(this.input, Constants.Up);
                        result = this.controller!.sempred(sempred);
                    } else if ((lookahead >= Constants.Up && lookahead <= ANTLRv4Lexer.ACTION)
                        || SourceGenTriggers.singleAtomLookaheadValues.includes(lookahead)
                        || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                        const sempred = this.match(this.input, ANTLRv4Lexer.SEMPRED)!;
                        result = this.controller!.sempred(sempred as ActionAST);
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();

                            throw new NoViableAltException(8, 5);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                default: {
                    throw new NoViableAltException(8, 0);
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

    private labeledElement(): SrcOp[] {
        let result: SrcOp[] = [];

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Lexer.ASSIGN) {
                if (this.input.lookahead(2) === Constants.Down) {
                    if (this.input.lookahead(3) === ANTLRv4Lexer.ID) {
                        const lookahead4 = this.input.lookahead(4);
                        if (lookahead4 === ANTLRv4Lexer.DOT
                            || lookahead4 === ANTLRv4Lexer.NOT
                            || lookahead4 === ANTLRv4Lexer.RANGE
                            || lookahead4 === ANTLRv4Lexer.RULE_REF
                            || lookahead4 === ANTLRv4Lexer.STRING_LITERAL
                            || lookahead4 === ANTLRv4Lexer.TOKEN_REF
                            || (lookahead4 >= ANTLRv4Lexer.SET && lookahead4 <= ANTLRv4Lexer.WILDCARD)) {
                            this.match(this.input, ANTLRv4Lexer.ASSIGN);
                            this.match(this.input, Constants.Down);

                            const id = this.match(this.input, ANTLRv4Lexer.ID)!;
                            result = this.atom(id, false);
                            this.match(this.input, Constants.Up);
                        } else if (lookahead4 === ANTLRv4Lexer.BLOCK) {
                            this.match(this.input, ANTLRv4Lexer.ASSIGN);
                            this.match(this.input, Constants.Down);

                            const id = this.match(this.input, ANTLRv4Lexer.ID)!;
                            result = this.block(id, null);
                            this.match(this.input, Constants.Up);
                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;

                            try {
                                this.input.consume();
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(9, 5);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();
                            this.input.consume();

                            throw new NoViableAltException(9, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }

                } else {
                    const mark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        throw new NoViableAltException(9, 1);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
                    }
                }
            } else if (lookahead === ANTLRv4Lexer.PLUS_ASSIGN) {
                if (this.input.lookahead(2) === Constants.Down) {
                    if (this.input.lookahead(3) === ANTLRv4Lexer.ID) {
                        const lookahead4 = this.input.lookahead(4);
                        if (lookahead4 === ANTLRv4Lexer.DOT
                            || lookahead4 === ANTLRv4Lexer.NOT
                            || lookahead4 === ANTLRv4Lexer.RANGE
                            || lookahead4 === ANTLRv4Lexer.RULE_REF
                            || lookahead4 === ANTLRv4Lexer.STRING_LITERAL
                            || lookahead4 === ANTLRv4Lexer.TOKEN_REF
                            || (lookahead4 >= ANTLRv4Lexer.SET && lookahead4 <= ANTLRv4Lexer.WILDCARD)) {
                            this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);
                            this.match(this.input, Constants.Down);

                            const id = this.match(this.input, ANTLRv4Lexer.ID)!;
                            result = this.atom(id, false);
                            this.match(this.input, Constants.Up);
                        } else if (lookahead4 === ANTLRv4Lexer.BLOCK) {
                            this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);
                            this.match(this.input, Constants.Down);

                            const id = this.match(this.input, ANTLRv4Lexer.ID)!;
                            result = this.block(id, null);
                            this.match(this.input, Constants.Up);

                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;

                            try {
                                this.input.consume();
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(9, 6);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();
                            this.input.consume();

                            throw new NoViableAltException(9, 4);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                } else {
                    const mark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        throw new NoViableAltException(9, 2);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
                    }
                }
            } else {
                throw new NoViableAltException(9, 0);
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

    private subrule(): SrcOp[] {
        let result: SrcOp[] = [];

        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Lexer.OPTIONAL: {
                    const optional = this.match(this.input, ANTLRv4Lexer.OPTIONAL)!;
                    this.match(this.input, Constants.Down);

                    result = this.block(null, optional);
                    this.match(this.input, Constants.Up);

                    break;
                }

                case ANTLRv4Lexer.CLOSURE:
                case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                    let b: SrcOp[];
                    let op: GrammarAST | null = null;

                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Lexer.CLOSURE) {
                        op = this.match(this.input, ANTLRv4Lexer.CLOSURE)!;
                        this.match(this.input, Constants.Down);
                        b = this.block(null, null);

                        this.match(this.input, Constants.Up);
                    } else if (lookahead === ANTLRv4Lexer.POSITIVE_CLOSURE) {
                        op = this.match(this.input, ANTLRv4Lexer.POSITIVE_CLOSURE)!;
                        this.match(this.input, Constants.Down);
                        b = this.block(null, null);

                        this.match(this.input, Constants.Up);
                    } else {
                        throw new NoViableAltException(10, 0);
                    }

                    const alts: CodeBlockForAlt[] = [];
                    const blk = b[0];
                    const alt = new CodeBlockForAlt(this.controller!.factory);

                    alt.addOp(blk);
                    alts.push(alt);
                    const loop = this.controller!.getEBNFBlock(op, alts); // "star it"
                    this.hasLookaheadBlock ||= loop instanceof PlusBlock || loop instanceof StarBlock;
                    result = [loop];

                    break;
                }

                case ANTLRv4Lexer.BLOCK: {
                    result = this.block(null, null);

                    break;
                }

                default: {
                    throw new NoViableAltException(11, 0);
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

    private blockSet(label: GrammarAST | null, invert: boolean): SrcOp[] {
        let result: SrcOp[] = [];

        try {
            const set = this.match(this.input, ANTLRv4Lexer.SET)!;
            this.match(this.input, Constants.Down);

            let atomCount = 0;
            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Lexer.DOT
                    || lookahead === ANTLRv4Lexer.NOT
                    || lookahead === ANTLRv4Lexer.RANGE
                    || lookahead === ANTLRv4Lexer.RULE_REF
                    || lookahead === ANTLRv4Lexer.STRING_LITERAL
                    || lookahead === ANTLRv4Lexer.TOKEN_REF
                    || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                    this.atom(label, invert);
                } else {
                    if (atomCount > 0) {
                        break;
                    }

                    throw new EarlyExitException(12);
                }

                ++atomCount;
            }

            this.match(this.input, Constants.Up);
            result = this.controller!.set(set, label, invert);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }

    private atom(label: GrammarAST | null, invert: boolean): SrcOp[] {
        let result: SrcOp[] = [];

        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Lexer.NOT: {
                    this.match(this.input, ANTLRv4Lexer.NOT);
                    this.match(this.input, Constants.Down);

                    result = this.atom(label, true);
                    this.match(this.input, Constants.Up);

                    break;
                }

                case ANTLRv4Lexer.RANGE: {
                    this.range();

                    break;
                }

                case ANTLRv4Lexer.DOT: {
                    if (this.input.lookahead(2) === Constants.Down) {
                        if (this.input.lookahead(3) === ANTLRv4Lexer.ID) {
                            const lookahead4 = this.input.lookahead(4);
                            if (lookahead4 === ANTLRv4Lexer.STRING_LITERAL || lookahead4 === ANTLRv4Lexer.TOKEN_REF) {
                                this.match(this.input, ANTLRv4Lexer.DOT);
                                this.match(this.input, Constants.Down);
                                this.match(this.input, ANTLRv4Lexer.ID);
                                this.terminal(label);
                                this.match(this.input, Constants.Up);
                            } else if (lookahead4 === ANTLRv4Lexer.RULE_REF) {
                                this.match(this.input, ANTLRv4Lexer.DOT);
                                this.match(this.input, Constants.Down);
                                this.match(this.input, ANTLRv4Lexer.ID);
                                this.ruleref(label);
                                this.match(this.input, Constants.Up);
                            } else {
                                const mark = this.input.mark();
                                const lastIndex = this.input.index;

                                try {
                                    this.input.consume();
                                    this.input.consume();
                                    this.input.consume();

                                    throw new NoViableAltException(13, 11);
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(mark);
                                }
                            }
                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;

                            try {
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(13, 8);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();

                            throw new NoViableAltException(13, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Lexer.WILDCARD: {
                    const lookahead = this.input.lookahead(2);
                    if (lookahead === Constants.Down) {
                        const wildcard = this.match(this.input, ANTLRv4Lexer.WILDCARD)!;
                        this.match(this.input, Constants.Down);
                        this.matchAny();
                        this.match(this.input, Constants.Up);
                        result = this.controller!.wildcard(wildcard, label);
                    } else {
                        if ((lookahead >= Constants.Up && lookahead <= ANTLRv4Lexer.ACTION)
                            || SourceGenTriggers.singleAtomLookaheadValues.includes(lookahead)
                            || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                            || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                            || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                            const wildcard = this.match(this.input, ANTLRv4Lexer.WILDCARD)!;
                            result = this.controller!.wildcard(wildcard, label);
                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;

                            try {
                                this.input.consume();

                                throw new NoViableAltException(13, 4);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer.TOKEN_REF: {
                    result = this.terminal(label);

                    break;
                }

                case ANTLRv4Lexer.RULE_REF: {
                    result = this.ruleref(label);

                    break;
                }

                case ANTLRv4Lexer.SET: {
                    result = this.blockSet(label, invert);

                    break;
                }

                default: {
                    throw new NoViableAltException(13, 0);
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

    private ruleref(label: GrammarAST | null): SrcOp[] {
        let result: SrcOp[] = [];

        try {
            let argAction;
            const ruleRef = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;
            if (this.input.lookahead(1) === Constants.Down) {
                this.match(this.input, Constants.Down);

                if (this.input.lookahead(1) === ANTLRv4Lexer.ARG_ACTION) {
                    argAction = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;
                }

                if (this.input.lookahead(1) === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                    this.elementOptions();
                }

                this.match(this.input, Constants.Up);
            }

            result = this.controller!.ruleRef(ruleRef, label, argAction ?? null);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result;
    }

    private range(): void {
        try {
            this.match(this.input, ANTLRv4Lexer.RANGE);
            this.match(this.input, Constants.Down);
            this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
            this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private terminal(label: GrammarAST | null): SrcOp[] {
        let result: SrcOp[] = [];

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Lexer.STRING_LITERAL) {
                const lookahead2 = this.input.lookahead(2);
                if (lookahead2 === Constants.Down) {
                    const stringLiteral = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;
                    this.match(this.input, Constants.Down);
                    this.matchAny();
                    this.match(this.input, Constants.Up);

                    result = this.controller!.stringRef(stringLiteral, label);
                } else if ((lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Lexer.ACTION)
                    || SourceGenTriggers.singleAtomLookaheadValues.includes(lookahead2)
                    || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                    const stringLiteral = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;
                    result = this.controller!.stringRef(stringLiteral, label);
                } else {
                    const mark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        throw new NoViableAltException(16, 1);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
                    }
                }
            } else if (lookahead === ANTLRv4Lexer.TOKEN_REF) {
                const lookahead2 = this.input.lookahead(2);
                if (lookahead2 === Constants.Down) {
                    const lookahead3 = this.input.lookahead(3);
                    if (lookahead3 === ANTLRv4Lexer.ARG_ACTION) {
                        const lookahead4 = this.input.lookahead(4);
                        if (lookahead4 >= ANTLRv4Lexer.ACTION && lookahead4 <= ANTLRv4Lexer.WILDCARD) {
                            const tokenRef = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;
                            this.match(this.input, Constants.Down);
                            const argAction = this.match(this.input, ANTLRv4Lexer.ARG_ACTION)!;
                            this.matchAny();
                            this.match(this.input, Constants.Up);

                            result = this.controller!.tokenRef(tokenRef, label, argAction);
                        } else {
                            if (lookahead4 >= Constants.Down && lookahead4 <= Constants.Up) {
                                const tokenRef = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;
                                this.match(this.input, Constants.Down);
                                this.matchAny();
                                this.match(this.input, Constants.Up);

                                result = this.controller!.tokenRef(tokenRef, label, null);
                            } else {
                                const mark = this.input.mark();
                                const lastIndex = this.input.index;

                                try {
                                    this.input.consume();
                                    this.input.consume();
                                    this.input.consume();

                                    throw new NoViableAltException(16, 7);
                                } finally {
                                    this.input.seek(lastIndex);
                                    this.input.release(mark);
                                }
                            }
                        }
                    } else {
                        if ((lookahead3 === ANTLRv4Lexer.ACTION)
                            || (lookahead3 >= ANTLRv4Lexer.ARG_OR_CHARSET && lookahead3 <= ANTLRv4Lexer.WILDCARD)) {
                            const tokenRef = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;
                            this.match(this.input, Constants.Down);
                            this.matchAny();
                            this.match(this.input, Constants.Up);

                            result = this.controller!.tokenRef(tokenRef, label, null);
                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;

                            try {
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(16, 5);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    }
                } else {
                    if ((lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Lexer.ACTION)
                        || SourceGenTriggers.singleAtomLookaheadValues.includes(lookahead2)
                        || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                        const tokenRef = this.match(this.input, ANTLRv4Lexer.TOKEN_REF)!;
                        result = this.controller!.tokenRef(tokenRef, label, null);
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();

                            throw new NoViableAltException(16, 2);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                }
            } else {
                throw new NoViableAltException(16, 0);
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

    private elementOptions(): void {
        try {
            this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);
            this.match(this.input, Constants.Down);

            let optionCount = 0;
            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Lexer.ASSIGN || lookahead === ANTLRv4Lexer.ID) {
                    this.elementOption();
                } else {
                    if (optionCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(17);
                }

                ++optionCount;
            }

            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private elementOption(): void {
        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Lexer.ID) {
                this.match(this.input, ANTLRv4Lexer.ID);
            } else {
                if (lookahead === ANTLRv4Lexer.ASSIGN) {
                    if (this.input.lookahead(2) === Constants.Down) {
                        if (this.input.lookahead(3) === ANTLRv4Lexer.ID) {
                            switch (this.input.lookahead(4)) {
                                case ANTLRv4Lexer.ID: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.Down);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, Constants.Up);

                                    break;
                                }

                                case ANTLRv4Lexer.STRING_LITERAL: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.Down);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                                    this.match(this.input, Constants.Up);

                                    break;
                                }

                                case ANTLRv4Lexer.ACTION: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.Down);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.ACTION);
                                    this.match(this.input, Constants.Up);

                                    break;
                                }

                                case ANTLRv4Lexer.INT: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.Down);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.INT);
                                    this.match(this.input, Constants.Up);

                                    break;
                                }

                                default: {
                                    const mark = this.input.mark();
                                    const lastIndex = this.input.index;

                                    try {
                                        this.input.consume();
                                        this.input.consume();
                                        this.input.consume();

                                        throw new NoViableAltException(18, 4);
                                    } finally {
                                        this.input.seek(lastIndex);
                                        this.input.release(mark);
                                    }
                                }
                            }
                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;

                            try {
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(18, 3);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }

                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();

                            throw new NoViableAltException(18, 2);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                } else {
                    throw new NoViableAltException(18, 0);
                }
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
