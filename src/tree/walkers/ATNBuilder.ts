/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

import { EarlyExitException } from "../EarlyExitException.js";
import { MismatchedSetException } from "../MismatchedSetException.js";
import { NoViableAltException } from "../NoViableAltException.js";
import { TreeParser } from "../TreeParser.js";

import type { IATNFactory, IStatePair } from "../../automata/IATNFactory.js";
import { Constants } from "../../Constants.js";
import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";
import type { ActionAST } from "../../tool/ast/ActionAST.js";
import type { BlockAST } from "../../tool/ast/BlockAST.js";
import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { PredAST } from "../../tool/ast/PredAST.js";
import type { TerminalAST } from "../../tool/ast/TerminalAST.js";
import type { ErrorManager } from "../../tool/ErrorManager.js";
import type { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { createRecognizerSharedState } from "../misc/IRecognizerSharedState.js";

export class ATNBuilder extends TreeParser {
    public constructor(errorManager: ErrorManager, input: CommonTreeNodeStream, private factory: IATNFactory) {
        super(errorManager, input, createRecognizerSharedState());
    }

    public ruleBlock(ebnfRoot: GrammarAST | null): IStatePair | undefined {
        this.factory.currentOuterAlt = 1;

        try {
            const block = this.match(this.input, ANTLRv4Lexer.BLOCK)!;
            this.match(this.input, Constants.DOWN);

            if (this.input.LA(1) === ANTLRv4Lexer.OPTIONS) {
                this.match(this.input, ANTLRv4Lexer.OPTIONS);
                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN);

                    while (true) {
                        const lookahead = this.input.LA(1);
                        if (lookahead >= ANTLRv4Lexer.ACTION && lookahead <= ANTLRv4Lexer.WILDCARD) {
                            this.matchAny();
                        } else {
                            if (lookahead === Constants.UP) {
                                break;
                            }
                        }
                    }
                    this.match(this.input, Constants.UP);
                }
            }

            let altCount = 0;
            const alts = new Array<IStatePair>();
            let currentAlt = 1;

            while (true) {
                const lookahead = this.input.LA(1);
                if (lookahead === ANTLRv4Lexer.ALT || lookahead === ANTLRv4Lexer.LEXER_ALT_ACTION) {
                    const alt = this.alternative();
                    if (alt) {
                        alts.push(alt);
                    }
                    this.factory.currentOuterAlt = ++currentAlt;
                } else {
                    if (altCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(3);
                }

                ++altCount;
            }

            this.match(this.input, Constants.UP);

            return this.factory.block(block as BlockAST, ebnfRoot, alts);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private block(ebnfRoot: GrammarAST | null): IStatePair | undefined {
        try {
            const block = this.match(this.input, ANTLRv4Lexer.BLOCK)!;
            this.match(this.input, Constants.DOWN);

            if (this.input.LA(1) === ANTLRv4Lexer.OPTIONS) {
                this.match(this.input, ANTLRv4Lexer.OPTIONS);

                if (this.input.LA(1) === Constants.DOWN) {
                    this.match(this.input, Constants.DOWN);

                    while (true) {
                        const lookahead = this.input.LA(1);
                        if (lookahead >= ANTLRv4Lexer.ACTION && lookahead <= ANTLRv4Lexer.WILDCARD) {
                            this.matchAny();
                        } else {
                            if (lookahead === Constants.UP) {
                                break;
                            }
                        }
                    }

                    this.match(this.input, Constants.UP);
                }
            }

            let altCount = 0;
            const alts = new Array<IStatePair>();

            while (true) {
                const lookahead = this.input.LA(1);
                if (lookahead === ANTLRv4Lexer.ALT || lookahead === ANTLRv4Lexer.LEXER_ALT_ACTION) {
                    const alt = this.alternative();
                    if (alt) {
                        alts.push(alt);
                    }
                } else {
                    if (altCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(6);
                }

                altCount++;
            }

            this.match(this.input, Constants.UP);

            return this.factory.block(block as BlockAST, ebnfRoot, alts);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private alternative(): IStatePair | undefined {
        try {
            if (this.input.LA(1) === ANTLRv4Lexer.LEXER_ALT_ACTION) {
                this.match(this.input, ANTLRv4Lexer.LEXER_ALT_ACTION);
                this.match(this.input, Constants.DOWN);

                const a = this.alternative();
                const commands = this.lexerCommands();
                this.match(this.input, Constants.UP);

                if (a && commands) {
                    return this.factory.lexerAltCommands(a, commands);
                }

                return undefined;
            } else {
                const current = this.input.lookAhead(1)!;
                if (current.children[0].getType() === ANTLRv4Lexer.EPSILON) {
                    this.match(this.input, ANTLRv4Lexer.ALT);
                    this.match(this.input, Constants.DOWN);

                    if (this.input.LA(1) === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                        this.elementOptions();
                    }

                    const epsilon = this.match(this.input, ANTLRv4Lexer.EPSILON)!;
                    this.match(this.input, Constants.UP);

                    return this.factory.epsilon(epsilon);
                } else {
                    this.match(this.input, ANTLRv4Lexer.ALT);
                    this.match(this.input, Constants.DOWN);

                    if (this.input.LA(1) === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                        this.elementOptions();
                    }

                    let cnt9 = 0;
                    const els = new Array<IStatePair>();

                    while (true) {
                        const lookahead = this.input.LA(1);
                        if (lookahead === ANTLRv4Lexer.ACTION || lookahead === ANTLRv4Lexer.ASSIGN
                            || lookahead === ANTLRv4Lexer.DOT || lookahead === ANTLRv4Lexer.LEXER_CHAR_SET
                            || lookahead === ANTLRv4Lexer.NOT || lookahead === ANTLRv4Lexer.PLUS_ASSIGN
                            || lookahead === ANTLRv4Lexer.RANGE || lookahead === ANTLRv4Lexer.RULE_REF
                            || lookahead === ANTLRv4Lexer.SEMPRED || lookahead === ANTLRv4Lexer.STRING_LITERAL
                            || lookahead === ANTLRv4Lexer.TOKEN_REF
                            || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                            || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                            || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                            const e = this.element();
                            if (e) {
                                els.push(e);
                            }
                        } else {
                            if (cnt9 >= 1) {
                                break;
                            }

                            throw new EarlyExitException(9);
                        }

                        cnt9++;
                    }

                    this.match(this.input, Constants.UP);

                    return this.factory.alt(els);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private lexerCommands(): IStatePair | undefined {
        try {
            let commandCount = 0;
            const commands = new Array<IStatePair>();

            while (true) {
                const lookahead = this.input.LA(1);
                if (lookahead === ANTLRv4Lexer.ID || lookahead === ANTLRv4Lexer.LEXER_ACTION_CALL) {
                    const c = this.lexerCommand();

                    if (c) {
                        commands.push(c);
                    }
                } else {
                    if (commandCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(11);
                }

                ++commandCount;
            }

            return this.factory.alt(commands);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private lexerCommand(): IStatePair | undefined {
        try {
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.LEXER_ACTION_CALL) {
                this.match(this.input, ANTLRv4Lexer.LEXER_ACTION_CALL);
                this.match(this.input, Constants.DOWN);

                const id = this.match(this.input, ANTLRv4Lexer.ID)!;
                const expression = this.lexerCommandExpr();
                this.match(this.input, Constants.UP);

                if (!expression) {
                    return undefined;
                }

                return this.factory.lexerCallCommand(id, expression);
            } else if (lookahead === ANTLRv4Lexer.ID) {
                const id = this.match(this.input, ANTLRv4Lexer.ID)!;

                return this.factory.lexerCommand(id);
            } else {
                throw new NoViableAltException(12, 0);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private lexerCommandExpr(): GrammarAST | undefined {
        const result = this.input.lookAhead(1) ?? undefined;

        try {
            if (this.input.LA(1) === ANTLRv4Lexer.ID || this.input.LA(1) === ANTLRv4Lexer.INT) {
                this.input.consume();
                this.state.errorRecovery = false;
            } else {
                throw new MismatchedSetException(null);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return result as GrammarAST;
    }

    private element(): IStatePair | undefined {
        let result: IStatePair | undefined;
        const start = this.input.lookAhead(1);

        try {
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.ASSIGN:
                case ANTLRv4Lexer.PLUS_ASSIGN: {
                    result = this.labeledElement()!;

                    break;
                }

                case ANTLRv4Lexer.DOT:
                case ANTLRv4Lexer.RANGE:
                case ANTLRv4Lexer.RULE_REF:
                case ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer.TOKEN_REF:
                case ANTLRv4Lexer.SET:
                case ANTLRv4Lexer.WILDCARD: {
                    result = this.atom();

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
                    const lookahead = this.input.LA(2);
                    if (lookahead === Constants.DOWN) {
                        const action = this.match(this.input, ANTLRv4Lexer.ACTION)!;
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);

                        result = this.factory.action(action as ActionAST);
                    } else if ((lookahead >= Constants.UP && lookahead <= ANTLRv4Lexer.ACTION)
                        || lookahead === ANTLRv4Lexer.ASSIGN || lookahead === ANTLRv4Lexer.DOT
                        || lookahead === ANTLRv4Lexer.LEXER_CHAR_SET || lookahead === ANTLRv4Lexer.NOT
                        || lookahead === ANTLRv4Lexer.PLUS_ASSIGN || lookahead === ANTLRv4Lexer.RANGE
                        || lookahead === ANTLRv4Lexer.RULE_REF || lookahead === ANTLRv4Lexer.SEMPRED
                        || lookahead === ANTLRv4Lexer.STRING_LITERAL || lookahead === ANTLRv4Lexer.TOKEN_REF
                        || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                        const action = this.match(this.input, ANTLRv4Lexer.ACTION)!;
                        result = this.factory.action(action as ActionAST);
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

                    break;
                }

                case ANTLRv4Lexer.SEMPRED: {
                    const lookahead = this.input.LA(2);
                    if (lookahead === Constants.DOWN) {
                        const sempred = this.match(this.input, ANTLRv4Lexer.SEMPRED)!;
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);

                        result = this.factory.sempred(sempred as PredAST);
                    } else if ((lookahead >= Constants.UP && lookahead <= ANTLRv4Lexer.ACTION)
                        || lookahead === ANTLRv4Lexer.ASSIGN || lookahead === ANTLRv4Lexer.DOT
                        || lookahead === ANTLRv4Lexer.LEXER_CHAR_SET || lookahead === ANTLRv4Lexer.NOT
                        || lookahead === ANTLRv4Lexer.PLUS_ASSIGN || lookahead === ANTLRv4Lexer.RANGE
                        || lookahead === ANTLRv4Lexer.RULE_REF || lookahead === ANTLRv4Lexer.SEMPRED
                        || lookahead === ANTLRv4Lexer.STRING_LITERAL || lookahead === ANTLRv4Lexer.TOKEN_REF
                        || (lookahead >= ANTLRv4Lexer.BLOCK && lookahead <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.OPTIONAL && lookahead <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead >= ANTLRv4Lexer.SET && lookahead <= ANTLRv4Lexer.WILDCARD)) {
                        const sempred = this.match(this.input, ANTLRv4Lexer.SEMPRED)!;
                        result = this.factory.sempred(sempred as PredAST);
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();

                            throw new NoViableAltException(13, 5);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Lexer.NOT: {
                    this.match(this.input, ANTLRv4Lexer.NOT);
                    this.match(this.input, Constants.DOWN);

                    result = this.blockSet(true);
                    this.match(this.input, Constants.UP);

                    break;
                }

                case ANTLRv4Lexer.LEXER_CHAR_SET: {
                    this.match(this.input, ANTLRv4Lexer.LEXER_CHAR_SET);
                    result = this.factory.charSetLiteral((start as GrammarAST))!;

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

    private labeledElement(): IStatePair | undefined {
        try {
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.ASSIGN) {
                this.match(this.input, ANTLRv4Lexer.ASSIGN);
                this.match(this.input, Constants.DOWN);
                this.match(this.input, ANTLRv4Lexer.ID);

                const element = this.element();
                this.match(this.input, Constants.UP);
                if (element) {
                    return this.factory.label(element);
                }

                return undefined;
            } else {
                if (lookahead === ANTLRv4Lexer.PLUS_ASSIGN) {
                    this.match(this.input, ANTLRv4Lexer.PLUS_ASSIGN);
                    this.match(this.input, Constants.DOWN);
                    this.match(this.input, ANTLRv4Lexer.ID);

                    const element = this.element();
                    this.match(this.input, Constants.UP);
                    if (element) {
                        return this.factory.listLabel(element);
                    }

                    return undefined;
                } else {
                    throw new NoViableAltException(15, 0);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private subrule(): IStatePair | undefined {
        let result: IStatePair | undefined;
        const start = this.input.lookAhead(1) as GrammarAST;

        try {
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.OPTIONAL: {
                    this.match(this.input, ANTLRv4Lexer.OPTIONAL);
                    this.match(this.input, Constants.DOWN);

                    result = this.block(start);
                    this.match(this.input, Constants.UP);

                    break;
                }

                case ANTLRv4Lexer.CLOSURE: {
                    this.match(this.input, ANTLRv4Lexer.CLOSURE);
                    this.match(this.input, Constants.DOWN);

                    result = this.block(start);
                    this.match(this.input, Constants.UP);

                    break;
                }

                case ANTLRv4Lexer.POSITIVE_CLOSURE: {
                    this.match(this.input, ANTLRv4Lexer.POSITIVE_CLOSURE);
                    this.match(this.input, Constants.DOWN);

                    result = this.block(start);
                    this.match(this.input, Constants.UP);

                    break;
                }

                case ANTLRv4Lexer.BLOCK: {
                    result = this.block(null);

                    break;
                }

                default: {
                    throw new NoViableAltException(16, 0);
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

    private blockSet(invert: boolean): IStatePair | undefined {
        try {
            const start = this.input.lookAhead(1)!;

            this.match(this.input, ANTLRv4Lexer.SET);
            this.match(this.input, Constants.DOWN);

            let elementCount = 0;
            const alts = new Array<GrammarAST>();

            while (true) {
                const lookahead = this.input.LA(1);
                if (lookahead === ANTLRv4Lexer.LEXER_CHAR_SET || lookahead === ANTLRv4Lexer.RANGE
                    || lookahead === ANTLRv4Lexer.STRING_LITERAL || lookahead === ANTLRv4Lexer.TOKEN_REF) {
                    const element = this.setElement();
                    if (element) {
                        alts.push(element);
                    }
                } else {
                    if (elementCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(17);
                }

                ++elementCount;
            }

            this.match(this.input, Constants.UP);

            return this.factory.set((start as GrammarAST), alts, invert);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private setElement(): GrammarAST | undefined {
        const start = this.input.lookAhead(1) as GrammarAST;

        try {
            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.STRING_LITERAL: {
                    const lookahead = this.input.LA(2);
                    if (lookahead === Constants.DOWN) {
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);
                    } else if (lookahead === Constants.UP || lookahead === ANTLRv4Lexer.LEXER_CHAR_SET
                        || lookahead === ANTLRv4Lexer.RANGE || lookahead === ANTLRv4Lexer.STRING_LITERAL
                        || lookahead === ANTLRv4Lexer.TOKEN_REF) {
                        this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();

                            throw new NoViableAltException(18, 1);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Lexer.TOKEN_REF: {
                    const lookahead = this.input.LA(2);
                    if (lookahead === Constants.DOWN) {
                        this.match(this.input, ANTLRv4Lexer.TOKEN_REF);
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);
                    } else if (lookahead === Constants.UP || lookahead === ANTLRv4Lexer.LEXER_CHAR_SET
                        || lookahead === ANTLRv4Lexer.RANGE || lookahead === ANTLRv4Lexer.STRING_LITERAL
                        || lookahead === ANTLRv4Lexer.TOKEN_REF) {
                        this.match(this.input, ANTLRv4Lexer.TOKEN_REF);
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

                    break;
                }

                case ANTLRv4Lexer.RANGE: {
                    this.match(this.input, ANTLRv4Lexer.RANGE);
                    this.match(this.input, Constants.DOWN);
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                    this.match(this.input, Constants.UP);

                    break;
                }

                case ANTLRv4Lexer.LEXER_CHAR_SET: {
                    this.match(this.input, ANTLRv4Lexer.LEXER_CHAR_SET);

                    break;
                }

                default: {
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

        return start;
    }

    private atom(): IStatePair | undefined {
        try {
            const start = this.input.lookAhead(1) as GrammarAST;

            switch (this.input.LA(1)) {
                case ANTLRv4Lexer.RANGE: {
                    return this.range()!;
                }

                case ANTLRv4Lexer.DOT: {
                    const lookahead2 = this.input.LA(2);
                    if (lookahead2 === Constants.DOWN) {
                        const lookahead3 = this.input.LA(3);
                        if (lookahead3 === ANTLRv4Lexer.ID) {
                            const lookahead4 = this.input.LA(4);
                            if (lookahead4 === ANTLRv4Lexer.STRING_LITERAL || lookahead4 === ANTLRv4Lexer.TOKEN_REF) {
                                this.match(this.input, ANTLRv4Lexer.DOT);
                                this.match(this.input, Constants.DOWN);
                                this.match(this.input, ANTLRv4Lexer.ID);

                                const result = this.terminal();
                                this.match(this.input, Constants.UP);

                                return result;
                            } else if (lookahead4 === ANTLRv4Lexer.RULE_REF) {
                                this.match(this.input, ANTLRv4Lexer.DOT);
                                this.match(this.input, Constants.DOWN);
                                this.match(this.input, ANTLRv4Lexer.ID);

                                const result = this.ruleref();
                                this.match(this.input, Constants.UP);

                                return result;
                            } else {
                                const mark = this.input.mark();
                                const lastIndex = this.input.index;

                                try {
                                    this.input.consume();
                                    this.input.consume();
                                    this.input.consume();

                                    throw new NoViableAltException(19, 10);
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

                                throw new NoViableAltException(19, 7);
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

                            throw new NoViableAltException(19, 2);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                }

                case ANTLRv4Lexer.WILDCARD: {
                    const lookahead2 = this.input.LA(2);
                    if (lookahead2 === Constants.DOWN) {
                        this.match(this.input, ANTLRv4Lexer.WILDCARD);
                        this.match(this.input, Constants.DOWN);
                        this.matchAny();
                        this.match(this.input, Constants.UP);

                        return this.factory.wildcard((start));
                    } else if (lookahead2 === ANTLRv4Lexer.EOF
                        || (lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                        || lookahead2 === ANTLRv4Lexer.ASSIGN || lookahead2 === ANTLRv4Lexer.DOT
                        || lookahead2 === ANTLRv4Lexer.LEXER_CHAR_SET || lookahead2 === ANTLRv4Lexer.NOT
                        || lookahead2 === ANTLRv4Lexer.PLUS_ASSIGN || lookahead2 === ANTLRv4Lexer.RANGE
                        || lookahead2 === ANTLRv4Lexer.RULE_REF || lookahead2 === ANTLRv4Lexer.SEMPRED
                        || lookahead2 === ANTLRv4Lexer.STRING_LITERAL || lookahead2 === ANTLRv4Lexer.TOKEN_REF
                        || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                        this.match(this.input, ANTLRv4Lexer.WILDCARD);

                        return this.factory.wildcard((start));
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;
                        try {
                            this.input.consume();

                            throw new NoViableAltException(19, 3);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                }

                case ANTLRv4Lexer.SET: {
                    return this.blockSet(false);
                }

                case ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer.TOKEN_REF: {
                    return this.terminal();
                }

                case ANTLRv4Lexer.RULE_REF: {
                    return this.ruleref() ?? undefined;
                }

                default: {
                    throw new NoViableAltException(19, 0);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private ruleref(): IStatePair | undefined {
        try {
            let alt = -1;
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.RULE_REF) {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    switch (this.input.LA(3)) {
                        case ANTLRv4Lexer.ARG_ACTION: {
                            const lookahead4 = this.input.LA(4);
                            if (lookahead4 === ANTLRv4Lexer.ELEMENT_OPTIONS) {
                                alt = 1;
                            } else {
                                if (lookahead4 === Constants.UP) {
                                    alt = 2;
                                } else {
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

                            break;
                        }

                        case ANTLRv4Lexer.ELEMENT_OPTIONS: {
                            alt = 1;

                            break;
                        }

                        case Constants.UP: {
                            alt = 2;

                            break;
                        }

                        default: {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(23, 2);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    }
                } else if (lookahead2 === ANTLRv4Lexer.EOF
                    || (lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                    || lookahead2 === ANTLRv4Lexer.ASSIGN || lookahead2 === ANTLRv4Lexer.DOT
                    || lookahead2 === ANTLRv4Lexer.LEXER_CHAR_SET || lookahead2 === ANTLRv4Lexer.NOT
                    || lookahead2 === ANTLRv4Lexer.PLUS_ASSIGN || lookahead2 === ANTLRv4Lexer.RANGE
                    || lookahead2 === ANTLRv4Lexer.RULE_REF || lookahead2 === ANTLRv4Lexer.SEMPRED
                    || lookahead2 === ANTLRv4Lexer.STRING_LITERAL || lookahead2 === ANTLRv4Lexer.TOKEN_REF
                    || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                    || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                    const ruleRef = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;

                    return this.factory.ruleRef(ruleRef) ?? undefined;
                } else {
                    const mark = this.input.mark();
                    const lastIndex = this.input.index;

                    try {
                        this.input.consume();

                        throw new NoViableAltException(23, 1);
                    } finally {
                        this.input.seek(lastIndex);
                        this.input.release(mark);
                    }
                }
            } else {
                throw new NoViableAltException(23, 0);
            }

            switch (alt) {
                case 1: {
                    const ruleRef = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;
                    this.match(this.input, Constants.DOWN);

                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Lexer.ARG_ACTION) {
                        this.match(this.input, ANTLRv4Lexer.ARG_ACTION);
                    }

                    this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);
                    if (this.input.LA(1) === Constants.DOWN) {
                        this.match(this.input, Constants.DOWN);

                        while (true) {
                            const lookahead = this.input.LA(1);
                            if (lookahead >= ANTLRv4Lexer.ACTION && lookahead <= ANTLRv4Lexer.WILDCARD) {
                                this.matchAny();
                            } else if (lookahead === Constants.UP) {
                                break;
                            }
                        }

                        this.match(this.input, Constants.UP);
                    }

                    this.match(this.input, Constants.UP);

                    return this.factory.ruleRef(ruleRef) ?? undefined;
                }

                case 2: {
                    const ruleRef = this.match(this.input, ANTLRv4Lexer.RULE_REF)!;
                    if (this.input.LA(1) === Constants.DOWN) {
                        this.match(this.input, Constants.DOWN);

                        if (this.input.LA(1) === ANTLRv4Lexer.ARG_ACTION) {
                            this.match(this.input, ANTLRv4Lexer.ARG_ACTION);
                        }

                        this.match(this.input, Constants.UP);
                    }

                    return this.factory.ruleRef(ruleRef) ?? undefined;
                }

                default: {
                    return undefined;
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private range(): IStatePair | undefined {
        try {
            this.match(this.input, ANTLRv4Lexer.RANGE);
            this.match(this.input, Constants.DOWN);
            const a = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;
            const b = this.match(this.input, ANTLRv4Lexer.STRING_LITERAL)!;
            this.match(this.input, Constants.UP);

            return this.factory.range(a, b) ?? undefined;
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private terminal(): IStatePair | undefined {
        try {
            const start = this.input.lookAhead(1) as GrammarAST;

            let alt24 = 5;
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.STRING_LITERAL) {
                const lookahead2 = this.input.LA(2);
                if (lookahead2 === Constants.DOWN) {
                    alt24 = 1;
                } else {
                    if (lookahead2 === ANTLRv4Lexer.EOF
                        || (lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                        || lookahead2 === ANTLRv4Lexer.ASSIGN || lookahead2 === ANTLRv4Lexer.DOT
                        || lookahead2 === ANTLRv4Lexer.LEXER_CHAR_SET || lookahead2 === ANTLRv4Lexer.NOT
                        || lookahead2 === ANTLRv4Lexer.PLUS_ASSIGN || lookahead2 === ANTLRv4Lexer.RANGE
                        || lookahead2 === ANTLRv4Lexer.RULE_REF || lookahead2 === ANTLRv4Lexer.SEMPRED
                        || lookahead2 === ANTLRv4Lexer.STRING_LITERAL || lookahead2 === ANTLRv4Lexer.TOKEN_REF
                        || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                        alt24 = 2;
                    } else {
                        const mark = this.input.mark();
                        const lastIndex = this.input.index;

                        try {
                            this.input.consume();

                            throw new NoViableAltException(24, 1);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                }
            } else {
                if (lookahead === ANTLRv4Lexer.TOKEN_REF) {
                    const lookahead2 = this.input.LA(2);
                    if (lookahead2 === Constants.DOWN) {
                        const lookahead3 = this.input.LA(3);
                        if (lookahead3 === ANTLRv4Lexer.ARG_ACTION) {
                            const lookahead4 = this.input.LA(4);
                            if (lookahead4 >= ANTLRv4Lexer.ACTION && lookahead4 <= ANTLRv4Lexer.WILDCARD) {
                                alt24 = 3;
                            } else {
                                if (lookahead4 >= Constants.DOWN && lookahead4 <= Constants.UP) {
                                    alt24 = 4;
                                } else {
                                    const mark = this.input.mark();
                                    const lastIndex = this.input.index;
                                    try {
                                        this.input.consume();
                                        this.input.consume();
                                        this.input.consume();

                                        throw new NoViableAltException(24, 7);
                                    } finally {
                                        this.input.seek(lastIndex);
                                        this.input.release(mark);
                                    }
                                }
                            }
                        } else if (
                            (lookahead3 >= ANTLRv4Lexer.ACTION && lookahead3 <= ANTLRv4Lexer.ACTION_STRING_LITERAL)
                            || (lookahead3 >= ANTLRv4Lexer.ARG_OR_CHARSET && lookahead3 <= ANTLRv4Lexer.WILDCARD)) {
                            alt24 = 4;
                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;

                            try {
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(24, 5);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    } else {
                        if (lookahead2 === ANTLRv4Lexer.EOF
                            || (lookahead2 >= Constants.UP && lookahead2 <= ANTLRv4Lexer.ACTION)
                            || lookahead2 === ANTLRv4Lexer.ASSIGN || lookahead2 === ANTLRv4Lexer.DOT
                            || lookahead2 === ANTLRv4Lexer.LEXER_CHAR_SET || lookahead2 === ANTLRv4Lexer.NOT
                            || lookahead2 === ANTLRv4Lexer.PLUS_ASSIGN || lookahead2 === ANTLRv4Lexer.RANGE
                            || lookahead2 === ANTLRv4Lexer.RULE_REF || lookahead2 === ANTLRv4Lexer.SEMPRED
                            || lookahead2 === ANTLRv4Lexer.STRING_LITERAL || lookahead2 === ANTLRv4Lexer.TOKEN_REF
                            || (lookahead2 >= ANTLRv4Lexer.BLOCK && lookahead2 <= ANTLRv4Lexer.CLOSURE)
                            || (lookahead2 >= ANTLRv4Lexer.OPTIONAL && lookahead2 <= ANTLRv4Lexer.POSITIVE_CLOSURE)
                            || (lookahead2 >= ANTLRv4Lexer.SET && lookahead2 <= ANTLRv4Lexer.WILDCARD)) {
                            alt24 = 5;
                        } else {
                            const mark = this.input.mark();
                            const lastIndex = this.input.index;
                            try {
                                this.input.consume();

                                throw new NoViableAltException(24, 2);
                            } finally {
                                this.input.seek(lastIndex);
                                this.input.release(mark);
                            }
                        }
                    }
                } else {
                    throw new NoViableAltException(24, 0);
                }
            }

            switch (alt24) {
                case 1: {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                    this.match(this.input, Constants.DOWN);
                    this.matchAny();
                    this.match(this.input, Constants.UP);

                    return this.factory.stringLiteral((start) as TerminalAST)!;
                }

                case 2: {
                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);

                    return this.factory.stringLiteral(start as TerminalAST)!;
                }

                case 3: {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);
                    this.match(this.input, Constants.DOWN);
                    this.match(this.input, ANTLRv4Lexer.ARG_ACTION);
                    this.matchAny();
                    this.match(this.input, Constants.UP);

                    return this.factory.tokenRef(start as TerminalAST)!;
                }

                case 4: {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);
                    this.match(this.input, Constants.DOWN);
                    this.matchAny();
                    this.match(this.input, Constants.UP);

                    return this.factory.tokenRef(start as TerminalAST) ?? undefined;
                }

                case 5: {
                    this.match(this.input, ANTLRv4Lexer.TOKEN_REF);

                    return this.factory.tokenRef(start as TerminalAST) ?? undefined;
                }

                default: {
                    return undefined;
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);

                return undefined;
            } else {
                throw re;
            }
        }
    }

    private elementOptions(): void {
        try {
            this.match(this.input, ANTLRv4Lexer.ELEMENT_OPTIONS);
            if (this.input.LA(1) === Constants.DOWN) {
                this.match(this.input, Constants.DOWN);

                while (true) {
                    const lookahead = this.input.LA(1);
                    if (lookahead === ANTLRv4Lexer.ASSIGN || lookahead === ANTLRv4Lexer.ID) {
                        this.elementOption();
                    } else {
                        break;
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
    }

    private elementOption(): void {
        try {
            const lookahead = this.input.LA(1);
            if (lookahead === ANTLRv4Lexer.ID) {
                this.match(this.input, ANTLRv4Lexer.ID);
            } else {
                if (lookahead === ANTLRv4Lexer.ASSIGN) {
                    if (this.input.LA(2) === Constants.DOWN) {
                        if (this.input.LA(3) === ANTLRv4Lexer.ID) {
                            switch (this.input.LA(4)) {
                                case ANTLRv4Lexer.ID: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.DOWN);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, Constants.UP);

                                    break;
                                }

                                case ANTLRv4Lexer.STRING_LITERAL: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.DOWN);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.STRING_LITERAL);
                                    this.match(this.input, Constants.UP);

                                    break;
                                }

                                case ANTLRv4Lexer.ACTION: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.DOWN);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.ACTION);
                                    this.match(this.input, Constants.UP);

                                    break;
                                }

                                case ANTLRv4Lexer.INT: {
                                    this.match(this.input, ANTLRv4Lexer.ASSIGN);
                                    this.match(this.input, Constants.DOWN);
                                    this.match(this.input, ANTLRv4Lexer.ID);
                                    this.match(this.input, ANTLRv4Lexer.INT);
                                    this.match(this.input, Constants.UP);

                                    break;
                                }

                                default: {
                                    const mark = this.input.mark();
                                    const lastIndex = this.input.index;
                                    try {
                                        this.input.consume();
                                        this.input.consume();
                                        this.input.consume();

                                        throw new NoViableAltException(26, 4);
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

                                throw new NoViableAltException(26, 3);
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

                            throw new NoViableAltException(26, 2);
                        } finally {
                            this.input.seek(lastIndex);
                            this.input.release(mark);
                        }
                    }
                } else {
                    throw new NoViableAltException(26, 0);
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
}
