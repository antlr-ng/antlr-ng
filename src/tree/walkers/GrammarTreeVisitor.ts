/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

import { CommonTreeNodeStream } from "../CommonTreeNodeStream.js";
import { EarlyExitException } from "../exceptions/EarlyExitException.js";
import { MismatchedSetException } from "../exceptions/MismatchedSetException.js";
import { NoViableAltException } from "../exceptions/NoViableAltException.js";
import { TreeParser } from "../TreeParser.js";

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
import type { ErrorManager } from "../../tool/ErrorManager.js";
import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";

/** The tree grammar visitor to walk the AST created from a parsed grammar. */
export class GrammarTreeVisitor extends TreeParser {
    protected currentRuleName?: string;
    protected currentOuterAltNumber = 1; // 1..n

    protected currentModeName = Constants.DefaultNodeName;

    public constructor(errorManager: ErrorManager, input?: CommonTreeNodeStream,) {
        super(errorManager, input);
    }

    public visitGrammar(t: GrammarRootAST): void {
        this.visit(t, ANTLRv4Parser.RULE_grammarSpec);
    }

    public visit(t: GrammarAST, ruleIndex: number): void {
        const nodes = new CommonTreeNodeStream(t);
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

    public outerAlternative(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.discoverOuterAlt(start as AltAST);

        try {
            this.alternative();
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    protected discoverGrammar(root: GrammarRootAST, id: GrammarAST | null): void { /**/ }
    protected finishPrequels(firstPrequel: GrammarAST | null): void { /**/ }
    protected finishGrammar(root: GrammarRootAST, id: GrammarAST | null): void { /**/ }

    protected grammarOption(id: GrammarAST | null, valueAST: GrammarAST | null): void { /**/ }
    protected ruleOption(id: GrammarAST | null, valueAST: GrammarAST | null): void { /**/ }
    protected blockOption(id: GrammarAST | null, valueAST: GrammarAST | null): void { /**/ }
    protected defineToken(id: GrammarAST): void { /**/ }
    protected defineChannel(id: GrammarAST): void { /**/ }
    protected globalNamedAction(scope: GrammarAST | null, id: GrammarAST, action: ActionAST): void { /**/ }
    protected importGrammar(label: GrammarAST | null, id: GrammarAST): void { /**/ }

    protected modeDef(m: GrammarAST | null, id: GrammarAST | null): void { /**/ }

    protected discoverRules(rules: GrammarAST): void { /**/ }
    protected discoverRule(rule: RuleAST | undefined, id: GrammarAST | undefined, modifiers: Array<GrammarAST | null>,
        arg: ActionAST | undefined, returns: ActionAST | undefined, throws: GrammarAST | undefined,
        options: GrammarAST | undefined, locals: ActionAST | undefined,
        actions: Array<GrammarAST | null>,
        block: GrammarAST | null): void { /**/ }
    protected finishRule(rule: RuleAST | null, id: GrammarAST | null, block: GrammarAST | null): void { /**/ }
    protected discoverLexerRule(rule: RuleAST | null, id: GrammarAST | null, modifiers: GrammarAST[],
        options: GrammarAST | null, block: GrammarAST): void { /**/ }
    protected ruleCatch(arg: GrammarAST, action: ActionAST): void { /**/ }
    protected finallyAction(action: ActionAST): void { /**/ }
    protected discoverOuterAlt(alt: AltAST): void { /**/ }

    protected ruleRef(ref: GrammarAST, arg: ActionAST): void { /**/ }
    protected tokenRef(ref: TerminalAST): void { /**/ }

    protected elementOption(t: GrammarASTWithOptions, id: GrammarAST, valueAST: GrammarAST | null): void { /**/ }

    protected stringRef(ref: TerminalAST): void { /**/ }
    protected actionInAlt(action: ActionAST): void { /**/ }
    protected sempredInAlt(pred: PredAST): void { /**/ }
    protected label(op: GrammarAST | null, id: GrammarAST | null, element: GrammarAST): void { /**/ }

    protected lexerCommand(outerAltNumber: number, id: GrammarAST): void { /**/ }

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

    private grammarSpec(): void {
        try {
            const grammar = this.match(this.input, ANTLRv4Parser.GRAMMAR);
            this.match(this.input, Constants.Down);

            const id = this.match(this.input, ANTLRv4Parser.ID);
            this.discoverGrammar(grammar as GrammarRootAST, id);

            const prequelConstructs = this.prequelConstructs();
            this.finishPrequels(prequelConstructs ?? null);
            this.rules();

            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.MODE) {
                    this.mode();
                } else {
                    break;
                }
            }

            this.finishGrammar(grammar as GrammarRootAST, id);
            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private prequelConstructs(): GrammarAST | undefined {
        let firstOne;
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.AT
                || lookahead === ANTLRv4Parser.CHANNELS
                || lookahead === ANTLRv4Parser.IMPORT
                || lookahead === ANTLRv4Parser.OPTIONS
                || lookahead === ANTLRv4Parser.TOKENS) {
                firstOne = start;

                let prequelCounter = 0;
                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.AT
                        || lookahead === ANTLRv4Parser.CHANNELS
                        || lookahead === ANTLRv4Parser.IMPORT
                        || lookahead === ANTLRv4Parser.OPTIONS
                        || lookahead === ANTLRv4Parser.TOKENS) {
                        this.prequelConstruct();
                    } else {
                        if (prequelCounter >= 1) {
                            break;
                        }

                        throw new EarlyExitException(2);
                    }

                    ++prequelCounter;
                }
            } else if (lookahead !== ANTLRv4Parser.RULES) {
                throw new NoViableAltException(3, 0);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return firstOne;
    }

    private prequelConstruct(): void {
        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Parser.OPTIONS: {
                    this.optionsSpec();

                    break;
                }

                case ANTLRv4Parser.IMPORT: {
                    this.delegateGrammars();

                    break;
                }

                case ANTLRv4Parser.TOKENS: {
                    this.tokensSpec();

                    break;
                }

                case ANTLRv4Parser.CHANNELS: {
                    this.channelsSpec();

                    break;
                }

                case ANTLRv4Parser.AT: {
                    this.action();

                    break;
                }

                default: {
                    throw new NoViableAltException(4, 0);
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

    private optionsSpec(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            this.match(this.input, ANTLRv4Parser.OPTIONS);
            if (this.input.lookahead(1) === Constants.Down) {
                this.match(this.input, Constants.Down);

                while (true) {
                    if (this.input.lookahead(1) === ANTLRv4Parser.ASSIGN) {
                        this.option();
                    } else {
                        break;
                    }
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

        return start;
    }

    private option(): void {
        const rule = this.inContext([ANTLRv4Lexer.RULE, Constants.Up]);
        const block = this.inContext([ANTLRv4Lexer.BLOCK, Constants.Up]);

        try {
            this.match(this.input, ANTLRv4Parser.ASSIGN);
            this.match(this.input, Constants.Down);
            const id = this.match(this.input, ANTLRv4Parser.ID);
            const v = this.optionValue();

            this.match(this.input, Constants.Up);

            if (block) {
                this.blockOption(id, v);
            } else {
                // most specific first
                if (rule) {
                    this.ruleOption(id, v);
                } else {
                    this.grammarOption(id, v);
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

    private optionValue(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.ID || lookahead === ANTLRv4Parser.INT
                || lookahead === ANTLRv4Parser.STRING_LITERAL) {
                this.input.consume();
                this.errorRecovery = false;
            } else {
                throw new MismatchedSetException();
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

    private delegateGrammars(): void {
        try {
            this.match(this.input, ANTLRv4Parser.IMPORT);
            this.match(this.input, Constants.Down);

            let grammarCount = 0;
            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.ASSIGN || lookahead === ANTLRv4Parser.ID) {
                    this.delegateGrammar();
                } else {
                    if (grammarCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(6);
                }

                ++grammarCount;
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

    private delegateGrammar(): void {
        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.ASSIGN) {
                this.match(this.input, ANTLRv4Parser.ASSIGN);
                this.match(this.input, Constants.Down);
                const label = this.match(this.input, ANTLRv4Parser.ID)!;
                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                this.match(this.input, Constants.Up);

                this.importGrammar(label, id);
            } else if (lookahead === ANTLRv4Parser.ID) {
                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                this.importGrammar(null, id);
            } else {
                throw new NoViableAltException(7, 0);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private tokensSpec(): void {
        try {
            this.match(this.input, ANTLRv4Parser.TOKENS);
            this.match(this.input, Constants.Down);

            let specCount = 0;
            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.ID) {
                    this.tokenSpec();
                } else {
                    if (specCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(8);
                }

                ++specCount;
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

    private tokenSpec(): void {
        try {
            const id = this.match(this.input, ANTLRv4Parser.ID)!;
            this.defineToken(id);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private channelsSpec(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterChannelsSpec(start);

        try {
            this.match(this.input, ANTLRv4Parser.CHANNELS);
            this.match(this.input, Constants.Down);

            let specCount = 0;
            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.ID) {
                    this.channelSpec();
                } else {
                    if (specCount > 0) {
                        break;
                    }

                    throw new EarlyExitException(9);
                }

                ++specCount;
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

    private channelSpec(): void {
        try {
            const id = this.match(this.input, ANTLRv4Parser.ID)!;
            this.defineChannel(id);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private action(): void {
        try {
            this.match(this.input, ANTLRv4Parser.AT);
            this.match(this.input, Constants.Down);

            let sc;
            if (this.input.lookahead(1) === ANTLRv4Parser.ID) {
                if (this.input.lookahead(2) === ANTLRv4Parser.ID) {
                    sc = this.match(this.input, ANTLRv4Parser.ID)!;
                }
            }

            const name = this.match(this.input, ANTLRv4Parser.ID)!;
            const action = this.match<ActionAST>(this.input, ANTLRv4Parser.ACTION)!;
            this.match(this.input, Constants.Up);

            this.globalNamedAction(sc ?? null, name, action);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private rules(): void {
        try {
            const rules = this.match(this.input, ANTLRv4Parser.RULES)!;
            this.discoverRules(rules);
            if (this.input.lookahead(1) === Constants.Down) {
                this.match(this.input, Constants.Down);

                while (true) {
                    if (this.input.lookahead(1) === ANTLRv4Parser.RULE) {
                        if (this.input.lookahead(2) === Constants.Down) {
                            const lookahead3 = this.input.lookahead(3);
                            if (lookahead3 === ANTLRv4Parser.RULE_REF) {
                                this.ruleSpec();
                            } else if (lookahead3 === ANTLRv4Parser.TOKEN_REF) {
                                this.lexerRule();
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
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
    }

    private mode(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterMode(start);

        try {
            const mode = this.match(this.input, ANTLRv4Parser.MODE);
            this.match(this.input, Constants.Down);
            const id = this.match(this.input, ANTLRv4Parser.ID);
            this.currentModeName = id?.getText() ?? Constants.DefaultNodeName;
            this.modeDef(mode, id);

            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.RULE) {
                    this.lexerRule();
                } else {
                    break;
                }
            }

            this.match(this.input, Constants.Up);
            this.exitMode(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private lexerRule(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterLexerRule(start);
        const mods = new Array<GrammarAST>();
        this.currentOuterAltNumber = 0;

        try {
            let m;
            let opts;

            const rule = this.match(this.input, ANTLRv4Parser.RULE);
            this.match(this.input, Constants.Down);
            const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF);
            this.currentRuleName = tokenRef?.getText();

            if (this.input.lookahead(1) === ANTLRv4Parser.RULEMODIFIERS) {
                this.match(this.input, ANTLRv4Parser.RULEMODIFIERS);
                this.match(this.input, Constants.Down);
                m = this.match(this.input, ANTLRv4Parser.FRAGMENT)!;
                mods.push(m);
                this.match(this.input, Constants.Up);
            }

            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.OPTIONS) {
                    opts = this.optionsSpec();
                } else {
                    break;
                }
            }

            this.discoverLexerRule(rule as RuleAST, tokenRef, mods, opts ?? null,
                this.input.lookaheadType(1) as GrammarAST);
            this.lexerRuleBlock();

            this.currentRuleName = undefined;

            this.match(this.input, Constants.Up);
            this.exitLexerRule(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private ruleSpec(): void {
        const mods = new Array<GrammarAST | null>();
        const actions = new Array<GrammarAST | null>(); // track roots
        this.currentOuterAltNumber = 0;

        try {
            const rule = this.match(this.input, ANTLRv4Parser.RULE) ?? undefined;
            this.match(this.input, Constants.Down);
            const ruleRef = this.match(this.input, ANTLRv4Parser.RULE_REF) ?? undefined;
            this.currentRuleName = ruleRef?.getText();

            let argAction;
            let ret;
            let thr;
            let loc;
            let opts;

            if (this.input.lookahead(1) === ANTLRv4Parser.RULEMODIFIERS) {
                this.match(this.input, ANTLRv4Parser.RULEMODIFIERS);
                this.match(this.input, Constants.Down);

                let modifierCount = 0;
                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.FRAGMENT
                        || (lookahead >= ANTLRv4Parser.PRIVATE && lookahead <= ANTLRv4Parser.PUBLIC)) {
                        const modifier = this.ruleModifier();
                        mods.push(modifier);
                    } else {
                        if (modifierCount >= 1) {
                            break;
                        }

                        throw new EarlyExitException(15);
                    }

                    ++modifierCount;
                }

                this.match(this.input, Constants.Up);
            }

            if (this.input.lookahead(1) === ANTLRv4Parser.ARG_ACTION) {
                argAction = this.match(this.input, ANTLRv4Parser.ARG_ACTION)!;
            }

            if (this.input.lookahead(1) === ANTLRv4Parser.RETURNS) {
                ret = this.ruleReturns();
            }

            if (this.input.lookahead(1) === ANTLRv4Parser.THROWS) {
                thr = this.throwsSpec();
            }

            if (this.input.lookahead(1) === ANTLRv4Parser.LOCALS) {
                loc = this.locals();
            }

            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.OPTIONS) {
                    opts = this.optionsSpec();
                } else if (lookahead === ANTLRv4Parser.AT) {
                    const a = this.ruleAction();
                    actions.push(a);
                } else {
                    break;
                }
            }

            this.discoverRule(rule as RuleAST, ruleRef, mods, argAction as ActionAST,
                ret?.children[0] as ActionAST, thr, opts ?? undefined,
                loc?.children[0] as ActionAST | null ?? undefined, actions, this.input.lookaheadType(1) as GrammarAST);
            const ruleBlock17 = this.ruleBlock();

            this.exceptionGroup();

            this.finishRule(rule as RuleAST | null, ruleRef ?? null, ruleBlock17);
            this.currentRuleName = undefined;
            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private exceptionGroup(): void {
        try {
            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.CATCH) {
                    this.exceptionHandler();
                } else {
                    break;
                }
            }

            if (this.input.lookahead(1) === ANTLRv4Parser.FINALLY) {
                this.finallyClause();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private exceptionHandler(): void {
        try {
            this.match(this.input, ANTLRv4Parser.CATCH);
            this.match(this.input, Constants.Down);
            const argAction = this.match(this.input, ANTLRv4Parser.ARG_ACTION)!;
            const action = this.match<ActionAST>(this.input, ANTLRv4Parser.ACTION)!;
            this.match(this.input, Constants.Up);
            this.ruleCatch(argAction, action);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private finallyClause(): void {
        try {
            this.match(this.input, ANTLRv4Parser.FINALLY);
            this.match(this.input, Constants.Down);
            const action = this.match(this.input, ANTLRv4Parser.ACTION)!;
            this.match(this.input, Constants.Up);
            this.finallyAction(action as ActionAST);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private locals(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            this.match(this.input, ANTLRv4Parser.LOCALS);
            this.match(this.input, Constants.Down);
            this.match(this.input, ANTLRv4Parser.ARG_ACTION);
            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return start;
    }

    private ruleReturns(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            this.match(this.input, ANTLRv4Parser.RETURNS);
            this.match(this.input, Constants.Down);
            this.match(this.input, ANTLRv4Parser.ARG_ACTION);
            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return start;
    }

    private throwsSpec(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            this.match(this.input, ANTLRv4Parser.THROWS);
            this.match(this.input, Constants.Down);

            let idCount = 0;
            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.ID) {
                    this.match(this.input, ANTLRv4Parser.ID);
                } else {
                    if (idCount > 0) {
                        break;
                    }

                    throw new EarlyExitException(24);
                }

                ++idCount;
            }

            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return start;
    }

    private ruleAction(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            this.match(this.input, ANTLRv4Parser.AT);
            this.match(this.input, Constants.Down);
            this.match(this.input, ANTLRv4Parser.ID);
            this.match(this.input, ANTLRv4Parser.ACTION);
            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return start;
    }

    private ruleModifier(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.FRAGMENT
                || (lookahead >= ANTLRv4Parser.PRIVATE && lookahead <= ANTLRv4Parser.PUBLIC)) {
                this.input.consume();
                this.errorRecovery = false;
            } else {
                throw new MismatchedSetException();
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

    private lexerRuleBlock(): void {
        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.Down);

            let altCount = 0;
            while (true) {
                const lookahead = this.input.lookahead(1);
                if ((lookahead === ANTLRv4Parser.ALT || lookahead === ANTLRv4Parser.LEXER_ALT_ACTION)) {
                    ++this.currentOuterAltNumber;

                    this.lexerOuterAlternative();
                } else {
                    if (altCount > 0) {
                        break;
                    }

                    throw new EarlyExitException(25);
                }

                ++altCount;
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

    private ruleBlock(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.Down);

            let altCount = 0;
            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.ALT) {
                    ++this.currentOuterAltNumber;

                    this.outerAlternative();
                } else {
                    if (altCount > 0) {
                        break;
                    }

                    throw new EarlyExitException(26);
                }

                ++altCount;
            }

            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return start;
    }

    private lexerOuterAlternative(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.discoverOuterAlt(start as AltAST);

        try {
            this.lexerAlternative();
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private lexerAlternative(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterLexerAlternative(start);

        try {
            let lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.LEXER_ALT_ACTION) {
                this.match(this.input, ANTLRv4Parser.LEXER_ALT_ACTION);
                this.match(this.input, Constants.Down);
                this.lexerElements();

                let commandCount = 0;
                while (true) {
                    lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.ID || lookahead === ANTLRv4Parser.LEXER_ACTION_CALL) {
                        this.handleLexerCommand();
                    } else {
                        if (commandCount > 0) {
                            break;
                        }

                        throw new EarlyExitException(27);
                    }

                    ++commandCount;
                }

                this.match(this.input, Constants.Up);
            } else if (lookahead === ANTLRv4Parser.ALT) {
                this.lexerElements();
            } else {
                throw new NoViableAltException(28, 0);
            }

            this.exitLexerAlternative(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private lexerElements(): void {
        try {
            this.match(this.input, ANTLRv4Parser.ALT);
            this.match(this.input, Constants.Down);

            let elementCount = 0;
            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.ACTION
                    || lookahead === ANTLRv4Parser.LEXER_CHAR_SET
                    || lookahead === ANTLRv4Parser.NOT
                    || lookahead === ANTLRv4Parser.RANGE
                    || lookahead === ANTLRv4Parser.RULE_REF
                    || lookahead === ANTLRv4Parser.SEMPRED
                    || lookahead === ANTLRv4Parser.STRING_LITERAL
                    || lookahead === ANTLRv4Parser.TOKEN_REF
                    || (lookahead >= ANTLRv4Parser.BLOCK && lookahead <= ANTLRv4Parser.CLOSURE)
                    || lookahead === ANTLRv4Parser.EPSILON
                    || (lookahead >= ANTLRv4Parser.OPTIONAL && lookahead <= ANTLRv4Parser.POSITIVE_CLOSURE)
                    || (lookahead >= ANTLRv4Parser.SET && lookahead <= ANTLRv4Parser.WILDCARD)) {
                    this.lexerElement();
                } else {
                    if (elementCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(29);
                }

                ++elementCount;
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

    private lexerElement(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterLexerElement(start);

        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Parser.LEXER_CHAR_SET:
                case ANTLRv4Parser.NOT:
                case ANTLRv4Parser.RANGE:
                case ANTLRv4Parser.RULE_REF:
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF:
                case ANTLRv4Parser.SET:
                case ANTLRv4Parser.WILDCARD: {
                    this.lexerAtom();

                    break;
                }

                case ANTLRv4Parser.BLOCK:
                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    this.lexerSubrule();

                    break;
                }

                case ANTLRv4Parser.ACTION: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const action = this.match(this.input, ANTLRv4Parser.ACTION)!;
                        this.match(this.input, Constants.Down);
                        this.elementOptions();
                        this.match(this.input, Constants.Up);
                        this.actionInAlt(action as ActionAST);
                    } else if ((lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Parser.ACTION)
                        || lookahead2 === ANTLRv4Parser.LEXER_CHAR_SET
                        || lookahead2 === ANTLRv4Parser.NOT
                        || lookahead2 === ANTLRv4Parser.RANGE
                        || lookahead2 === ANTLRv4Parser.RULE_REF
                        || lookahead2 === ANTLRv4Parser.SEMPRED
                        || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                        || lookahead2 === ANTLRv4Parser.TOKEN_REF
                        || (lookahead2 >= ANTLRv4Parser.BLOCK && lookahead2 <= ANTLRv4Parser.CLOSURE)
                        || lookahead2 === ANTLRv4Parser.EPSILON
                        || (lookahead2 >= ANTLRv4Parser.OPTIONAL && lookahead2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Parser.SET && lookahead2 <= ANTLRv4Parser.WILDCARD)) {
                        const action = this.match(this.input, ANTLRv4Parser.ACTION)!;
                        this.actionInAlt(action as ActionAST);
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(30, 3);
                        } finally {
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.SEMPRED: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const sempred = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                        this.match(this.input, Constants.Down);
                        this.elementOptions();
                        this.match(this.input, Constants.Up);
                        this.sempredInAlt(sempred as PredAST);
                    } else if ((lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Parser.ACTION)
                        || lookahead2 === ANTLRv4Parser.LEXER_CHAR_SET
                        || lookahead2 === ANTLRv4Parser.NOT
                        || lookahead2 === ANTLRv4Parser.RANGE
                        || lookahead2 === ANTLRv4Parser.RULE_REF
                        || lookahead2 === ANTLRv4Parser.SEMPRED
                        || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                        || lookahead2 === ANTLRv4Parser.TOKEN_REF
                        || (lookahead2 >= ANTLRv4Parser.BLOCK && lookahead2 <= ANTLRv4Parser.CLOSURE)
                        || lookahead2 === ANTLRv4Parser.EPSILON
                        || (lookahead2 >= ANTLRv4Parser.OPTIONAL && lookahead2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                        || (lookahead2 >= ANTLRv4Parser.SET && lookahead2 <= ANTLRv4Parser.WILDCARD)) {
                        const sempred = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                        this.sempredInAlt(sempred as PredAST);
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(30, 4);
                        } finally {
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.EPSILON: {
                    this.match(this.input, ANTLRv4Parser.EPSILON);

                    break;
                }

                default: {
                    throw new NoViableAltException(30, 0);
                }
            }

            this.exitLexerElement(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private lexerBlock(): void {
        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.Down);

            if ((this.input.lookahead(1) === ANTLRv4Parser.OPTIONS)) {
                this.optionsSpec();
            }

            let altCount = 0;
            while (true) {
                const lookahead = this.input.lookahead(1);
                if ((lookahead === ANTLRv4Parser.ALT || lookahead === ANTLRv4Parser.LEXER_ALT_ACTION)) {
                    this.lexerAlternative();
                } else {
                    if (altCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(32);
                }

                ++altCount;
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

    private lexerAtom(): void {
        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF: {
                    this.terminal();

                    break;
                }

                case ANTLRv4Parser.NOT: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.Down);
                    this.blockSet();

                    this.match(this.input, Constants.Up);

                    break;
                }

                case ANTLRv4Parser.SET: {
                    this.blockSet();

                    break;
                }

                case ANTLRv4Parser.WILDCARD: {
                    const lookahed2 = this.input.lookahead(2);
                    if (lookahed2 === Constants.Down) {
                        this.match(this.input, ANTLRv4Parser.WILDCARD);
                        this.match(this.input, Constants.Down);
                        this.elementOptions();
                        this.match(this.input, Constants.Up);
                    } else if ((lookahed2 >= Constants.Up && lookahed2 <= ANTLRv4Parser.ACTION)
                        || lookahed2 === ANTLRv4Parser.LEXER_CHAR_SET
                        || lookahed2 === ANTLRv4Parser.NOT
                        || lookahed2 === ANTLRv4Parser.RANGE
                        || lookahed2 === ANTLRv4Parser.RULE_REF
                        || lookahed2 === ANTLRv4Parser.SEMPRED
                        || lookahed2 === ANTLRv4Parser.STRING_LITERAL
                        || lookahed2 === ANTLRv4Parser.TOKEN_REF
                        || (lookahed2 >= ANTLRv4Parser.BLOCK && lookahed2 <= ANTLRv4Parser.CLOSURE)
                        || lookahed2 === ANTLRv4Parser.EPSILON
                        || (lookahed2 >= ANTLRv4Parser.OPTIONAL && lookahed2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                        || (lookahed2 >= ANTLRv4Parser.SET && lookahed2 <= ANTLRv4Parser.WILDCARD)) {
                        this.match(this.input, ANTLRv4Parser.WILDCARD);
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(33, 4);
                        } finally {
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.LEXER_CHAR_SET: {
                    this.match(this.input, ANTLRv4Parser.LEXER_CHAR_SET);

                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    this.range();

                    break;
                }

                case ANTLRv4Parser.RULE_REF: {
                    this.ruleref();

                    break;
                }

                default: {
                    throw new NoViableAltException(33, 0);
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

    private alternative(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterAlternative(start as AltAST);

        try {
            if (start.children[0]?.getType() === ANTLRv4Parser.EPSILON) { // Empty alternative.
                this.match(this.input, ANTLRv4Parser.ALT);
                this.match(this.input, Constants.Down);

                if ((this.input.lookahead(1) === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                    this.elementOptions();
                }

                this.match(this.input, ANTLRv4Parser.EPSILON);
                this.match(this.input, Constants.Up);
            } else {
                this.match(this.input, ANTLRv4Parser.ALT);
                this.match(this.input, Constants.Down);

                if ((this.input.lookahead(1) === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                    this.elementOptions();
                }

                let elementCount = 0;
                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.ACTION
                        || lookahead === ANTLRv4Parser.ASSIGN
                        || lookahead === ANTLRv4Parser.DOT
                        || lookahead === ANTLRv4Parser.NOT
                        || lookahead === ANTLRv4Parser.PLUS_ASSIGN
                        || lookahead === ANTLRv4Parser.RANGE
                        || lookahead === ANTLRv4Parser.RULE_REF
                        || lookahead === ANTLRv4Parser.SEMPRED
                        || lookahead === ANTLRv4Parser.STRING_LITERAL
                        || lookahead === ANTLRv4Parser.TOKEN_REF
                        || (lookahead >= ANTLRv4Parser.BLOCK && lookahead <= ANTLRv4Parser.CLOSURE)
                        || (lookahead >= ANTLRv4Parser.OPTIONAL && lookahead <= ANTLRv4Parser.POSITIVE_CLOSURE)
                        || (lookahead >= ANTLRv4Parser.SET && lookahead <= ANTLRv4Parser.WILDCARD)) {
                        this.element();
                    } else {
                        if (elementCount > 0) {
                            break;
                        }

                        throw new EarlyExitException(36);
                    }

                    ++elementCount;
                }

                this.match(this.input, Constants.Up);
            }

            this.exitAlternative(start as AltAST);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private lexerCommandExpr(): void {
        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.ID || lookahead === ANTLRv4Parser.INT) {
                this.input.consume();
                this.errorRecovery = false;
            } else {
                throw new MismatchedSetException();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private element(): GrammarAST {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterElement(start);

        try {
            let alt = 10;
            switch (this.input.lookahead(1)) {
                case ANTLRv4Parser.ASSIGN:
                case ANTLRv4Parser.PLUS_ASSIGN: {
                    alt = 1;

                    break;
                }

                case ANTLRv4Parser.DOT:
                case ANTLRv4Parser.RULE_REF:
                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF:
                case ANTLRv4Parser.SET:
                case ANTLRv4Parser.WILDCARD: {
                    alt = 2;

                    break;
                }

                case ANTLRv4Parser.BLOCK:
                case ANTLRv4Parser.CLOSURE:
                case ANTLRv4Parser.OPTIONAL:
                case ANTLRv4Parser.POSITIVE_CLOSURE: {
                    alt = 3;

                    break;
                }

                case ANTLRv4Parser.ACTION: {
                    const lookahead2 = this.input.lookahead(2);
                    if ((lookahead2 === Constants.Down)) {
                        alt = 6;
                    } else {
                        if ((lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Parser.ACTION)
                            || lookahead2 === ANTLRv4Parser.ASSIGN
                            || lookahead2 === ANTLRv4Parser.DOT
                            || lookahead2 === ANTLRv4Parser.NOT
                            || lookahead2 === ANTLRv4Parser.PLUS_ASSIGN
                            || lookahead2 === ANTLRv4Parser.RANGE
                            || lookahead2 === ANTLRv4Parser.RULE_REF
                            || lookahead2 === ANTLRv4Parser.SEMPRED
                            || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                            || lookahead2 === ANTLRv4Parser.TOKEN_REF
                            || (lookahead2 >= ANTLRv4Parser.BLOCK && lookahead2 <= ANTLRv4Parser.CLOSURE)
                            || (lookahead2 >= ANTLRv4Parser.OPTIONAL && lookahead2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                            || (lookahead2 >= ANTLRv4Parser.SET && lookahead2 <= ANTLRv4Parser.WILDCARD)) {
                            alt = 4;
                        } else {
                            const mark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(40, 4);
                            } finally {
                                this.input.release(mark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.SEMPRED: {
                    const lookahead2 = this.input.lookahead(2);
                    if ((lookahead2 === Constants.Down)) {
                        alt = 7;
                    } else {
                        if (((lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Parser.ACTION)
                            || lookahead2 === ANTLRv4Parser.ASSIGN
                            || lookahead2 === ANTLRv4Parser.DOT
                            || lookahead2 === ANTLRv4Parser.NOT
                            || lookahead2 === ANTLRv4Parser.PLUS_ASSIGN
                            || lookahead2 === ANTLRv4Parser.RANGE
                            || lookahead2 === ANTLRv4Parser.RULE_REF
                            || lookahead2 === ANTLRv4Parser.SEMPRED
                            || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                            || lookahead2 === ANTLRv4Parser.TOKEN_REF
                            || (lookahead2 >= ANTLRv4Parser.BLOCK && lookahead2 <= ANTLRv4Parser.CLOSURE)
                            || (lookahead2 >= ANTLRv4Parser.OPTIONAL && lookahead2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                            || (lookahead2 >= ANTLRv4Parser.SET && lookahead2 <= ANTLRv4Parser.WILDCARD))) {
                            alt = 5;
                        } else {
                            const mark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(40, 5);
                            } finally {
                                this.input.release(mark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    alt = 8;

                    break;
                }

                case ANTLRv4Parser.NOT: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const lookahead3 = this.input.lookahead(3);
                        if (lookahead3 === ANTLRv4Parser.SET) {
                            alt = 9;
                        } else if (lookahead3 === ANTLRv4Parser.BLOCK) {
                            alt = 10;
                        } else {
                            const mark = this.input.mark();
                            try {
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(40, 12);
                            } finally {
                                this.input.release(mark);
                            }
                        }
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(40, 7);
                        } finally {
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                default: {
                    throw new NoViableAltException(40, 0);
                }
            }

            switch (alt) {
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
                    const action = this.match(this.input, ANTLRv4Parser.ACTION)!;
                    this.actionInAlt(action as ActionAST);

                    break;
                }

                case 5: {
                    const sempred = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                    this.sempredInAlt(sempred as PredAST);

                    break;
                }

                case 6: {
                    const action = this.match(this.input, ANTLRv4Parser.ACTION)!;
                    this.match(this.input, Constants.Down);
                    this.elementOptions();
                    this.match(this.input, Constants.Up);
                    this.actionInAlt(action as ActionAST);

                    break;
                }

                case 7: {
                    const sempred = this.match(this.input, ANTLRv4Parser.SEMPRED)!;
                    this.match(this.input, Constants.Down);
                    this.elementOptions();
                    this.match(this.input, Constants.Up);
                    this.sempredInAlt(sempred as PredAST);

                    break;
                }

                case 8: {
                    this.range();

                    break;
                }

                case 9: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.Down);
                    this.blockSet();
                    this.match(this.input, Constants.Up);

                    break;
                }

                case 10: {
                    this.match(this.input, ANTLRv4Parser.NOT);
                    this.match(this.input, Constants.Down);
                    this.block();
                    this.match(this.input, Constants.Up);

                    break;
                }

                default:
            }

            this.exitElement(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

        return start;
    }

    private labeledElement(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            if (this.input.lookahead(1) === ANTLRv4Parser.ASSIGN
                || this.input.lookahead(1) === ANTLRv4Parser.PLUS_ASSIGN) {
                this.input.consume();
                this.errorRecovery = false;
            } else {
                throw new MismatchedSetException();
            }

            this.match(this.input, Constants.Down);
            const id = this.match(this.input, ANTLRv4Parser.ID)!;

            const element = this.element();
            this.match(this.input, Constants.Up);
            this.label(start, id, element);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private subrule(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.CLOSURE
                || (lookahead >= ANTLRv4Parser.OPTIONAL && lookahead <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                this.blockSuffix();

                this.match(this.input, Constants.Down);
                this.block();

                this.match(this.input, Constants.Up);
            } else if ((lookahead === ANTLRv4Parser.BLOCK)) {
                this.block();
            } else {
                throw new NoViableAltException(42, 0);
            }

            this.exitSubrule(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private lexerSubrule(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.CLOSURE
                || (lookahead >= ANTLRv4Parser.OPTIONAL && lookahead <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                this.blockSuffix();

                this.match(this.input, Constants.Down);
                this.lexerBlock();

                this.match(this.input, Constants.Up);
            } else if (lookahead === ANTLRv4Parser.BLOCK) {
                this.lexerBlock();
            } else {
                throw new NoViableAltException(43, 0);
            }

            this.exitLexerSubrule(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private blockSuffix(): void {
        try {
            this.ebnfSuffix();
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private ebnfSuffix(): void {
        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.CLOSURE
                || (lookahead >= ANTLRv4Parser.OPTIONAL && lookahead <= ANTLRv4Parser.POSITIVE_CLOSURE)) {
                this.input.consume();
                this.errorRecovery = false;
            } else {
                throw new MismatchedSetException();
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private atom(): void {
        try {
            let alt = 7;
            switch (this.input.lookahead(1)) {
                case ANTLRv4Parser.DOT: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const lookahead3 = this.input.lookahead(3);
                        if (lookahead3 === ANTLRv4Parser.ID) {
                            const lookahead4 = this.input.lookahead(4);
                            if (lookahead4 === ANTLRv4Parser.STRING_LITERAL || lookahead4 === ANTLRv4Parser.TOKEN_REF) {
                                alt = 1;
                            } else if (lookahead4 === ANTLRv4Parser.RULE_REF) {
                                alt = 2;
                            } else {
                                const mark = this.input.mark();
                                try {
                                    this.input.consume();
                                    this.input.consume();
                                    this.input.consume();

                                    throw new NoViableAltException(44, 9);
                                } finally {
                                    this.input.release(mark);
                                }
                            }
                        } else {
                            const mark = this.input.mark();
                            try {
                                this.input.consume();
                                this.input.consume();

                                throw new NoViableAltException(44, 6);
                            } finally {
                                this.input.release(mark);
                            }
                        }
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(44, 1);
                        } finally {
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.WILDCARD: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        alt = 3;
                    } else {
                        if (lookahead2 === ANTLRv4Parser.EOF
                            || (lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Parser.ACTION)
                            || lookahead2 === ANTLRv4Parser.ASSIGN
                            || lookahead2 === ANTLRv4Parser.DOT
                            || lookahead2 === ANTLRv4Parser.NOT
                            || lookahead2 === ANTLRv4Parser.PLUS_ASSIGN
                            || lookahead2 === ANTLRv4Parser.RANGE
                            || lookahead2 === ANTLRv4Parser.RULE_REF
                            || lookahead2 === ANTLRv4Parser.SEMPRED
                            || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                            || lookahead2 === ANTLRv4Parser.TOKEN_REF
                            || (lookahead2 >= ANTLRv4Parser.BLOCK && lookahead2 <= ANTLRv4Parser.CLOSURE)
                            || (lookahead2 >= ANTLRv4Parser.OPTIONAL && lookahead2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                            || (lookahead2 >= ANTLRv4Parser.SET && lookahead2 <= ANTLRv4Parser.WILDCARD)) {
                            alt = 4;
                        } else {
                            const mark = this.input.mark();
                            try {
                                this.input.consume();

                                throw new NoViableAltException(44, 2);
                            } finally {
                                this.input.release(mark);
                            }
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.STRING_LITERAL:
                case ANTLRv4Parser.TOKEN_REF: {
                    alt = 5;

                    break;
                }

                case ANTLRv4Parser.SET: {
                    alt = 6;

                    break;
                }

                case ANTLRv4Parser.RULE_REF: {
                    alt = 7;

                    break;
                }

                default: {
                    throw new NoViableAltException(44, 0);
                }

            }

            switch (alt) {
                case 1: {
                    this.match(this.input, ANTLRv4Parser.DOT);
                    this.match(this.input, Constants.Down);
                    this.match(this.input, ANTLRv4Parser.ID);
                    this.terminal();

                    this.match(this.input, Constants.Up);

                    break;
                }

                case 2: {
                    this.match(this.input, ANTLRv4Parser.DOT);
                    this.match(this.input, Constants.Down);
                    this.match(this.input, ANTLRv4Parser.ID);
                    this.ruleref();

                    this.match(this.input, Constants.Up);

                    break;
                }

                case 3: {
                    this.match(this.input, ANTLRv4Parser.WILDCARD)!;
                    this.match(this.input, Constants.Down);
                    this.elementOptions();

                    this.match(this.input, Constants.Up);

                    break;
                }

                case 4: {
                    this.match(this.input, ANTLRv4Parser.WILDCARD)!;

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
    }

    private blockSet(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterBlockSet(start);

        try {
            this.match(this.input, ANTLRv4Parser.SET);
            this.match(this.input, Constants.Down);

            let setElementCount = 0;
            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.LEXER_CHAR_SET
                    || lookahead === ANTLRv4Parser.RANGE
                    || lookahead === ANTLRv4Parser.STRING_LITERAL
                    || lookahead === ANTLRv4Parser.TOKEN_REF) {
                    this.setElement();
                } else {
                    if (setElementCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(45);
                }
                ++setElementCount;
            }

            this.match(this.input, Constants.Up);
            this.exitBlockSet(start);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private setElement(): void {
        try {
            switch (this.input.lookahead(1)) {
                case ANTLRv4Parser.STRING_LITERAL: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const literal = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                        this.match(this.input, Constants.Down);
                        this.elementOptions();
                        this.match(this.input, Constants.Up);
                        this.stringRef(literal as TerminalAST);
                    } else if (lookahead2 === Constants.Up
                        || lookahead2 === ANTLRv4Parser.LEXER_CHAR_SET
                        || lookahead2 === ANTLRv4Parser.RANGE
                        || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                        || lookahead2 === ANTLRv4Parser.TOKEN_REF) {
                        const literal = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                        this.stringRef(literal as TerminalAST);
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(46, 1);
                        } finally {
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.TOKEN_REF: {
                    const lookahead2 = this.input.lookahead(2);
                    if (lookahead2 === Constants.Down) {
                        const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                        this.match(this.input, Constants.Down);
                        this.elementOptions();
                        this.match(this.input, Constants.Up);
                        this.tokenRef(tokenRef as TerminalAST);
                    } else if (lookahead2 === Constants.Up
                        || lookahead2 === ANTLRv4Parser.LEXER_CHAR_SET
                        || lookahead2 === ANTLRv4Parser.RANGE
                        || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                        || lookahead2 === ANTLRv4Parser.TOKEN_REF) {
                        const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                        this.tokenRef(tokenRef as TerminalAST);
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();

                            throw new NoViableAltException(46, 2);
                        } finally {
                            this.input.release(mark);
                        }
                    }

                    break;
                }

                case ANTLRv4Parser.RANGE: {
                    this.match(this.input, ANTLRv4Parser.RANGE);
                    this.match(this.input, Constants.Down);
                    const a = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    const b = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.match(this.input, Constants.Up);

                    this.stringRef(a as TerminalAST);
                    this.stringRef(b as TerminalAST);

                    break;
                }

                case ANTLRv4Parser.LEXER_CHAR_SET: {
                    this.match(this.input, ANTLRv4Parser.LEXER_CHAR_SET);

                    break;
                }

                default: {
                    throw new NoViableAltException(46, 0);
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

    private block(): void {
        try {
            this.match(this.input, ANTLRv4Parser.BLOCK);
            this.match(this.input, Constants.Down);

            if (this.input.lookahead(1) === ANTLRv4Parser.OPTIONS) {
                this.optionsSpec();
            }

            while (true) {
                const lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.AT) {
                    this.ruleAction();
                } else {
                    break;
                }
            }

            if (this.input.lookahead(1) === ANTLRv4Parser.ACTION) {
                this.match(this.input, ANTLRv4Parser.ACTION);
            }

            let altCount = 0;
            while (true) {
                if (this.input.lookahead(1) === ANTLRv4Parser.ALT) {
                    this.alternative();
                } else {
                    if (altCount >= 1) {
                        break;
                    }

                    throw new EarlyExitException(50);
                }

                ++altCount;
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

    private ruleref(): void {
        try {
            let arg;
            const ruleRef = this.match(this.input, ANTLRv4Parser.RULE_REF)!;
            if (this.input.lookahead(1) === Constants.Down) {
                this.match(this.input, Constants.Down);

                let lookahead = this.input.lookahead(1);
                if (lookahead === ANTLRv4Parser.ARG_ACTION) {
                    arg = this.match(this.input, ANTLRv4Parser.ARG_ACTION)!;
                }

                lookahead = this.input.lookahead(1);
                if ((lookahead === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                    this.elementOptions();
                }

                this.match(this.input, Constants.Up);
            }

            this.ruleRef(ruleRef, arg as ActionAST);
            if (arg !== undefined) {
                this.actionInAlt(arg as ActionAST);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private range(): void {
        try {
            this.match(this.input, ANTLRv4Parser.RANGE);
            this.match(this.input, Constants.Down);
            this.match(this.input, ANTLRv4Parser.STRING_LITERAL);
            this.match(this.input, ANTLRv4Parser.STRING_LITERAL);
            this.match(this.input, Constants.Up);
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }

    }

    private terminal(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterTerminal(start);

        try {
            const lookahead = this.input.lookahead(1);
            if ((lookahead === ANTLRv4Parser.STRING_LITERAL)) {
                const lookahead2 = this.input.lookahead(2);
                if ((lookahead2 === Constants.Down)) {
                    const literal = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.match(this.input, Constants.Down);
                    this.elementOptions();
                    this.match(this.input, Constants.Up);
                    this.stringRef(literal as TerminalAST);
                } else if (lookahead2 === ANTLRv4Parser.EOF
                    || (lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Parser.ACTION)
                    || lookahead2 === ANTLRv4Parser.ASSIGN
                    || lookahead2 === ANTLRv4Parser.DOT
                    || lookahead2 === ANTLRv4Parser.LEXER_CHAR_SET
                    || lookahead2 === ANTLRv4Parser.NOT
                    || lookahead2 === ANTLRv4Parser.PLUS_ASSIGN
                    || lookahead2 === ANTLRv4Parser.RANGE
                    || lookahead2 === ANTLRv4Parser.RULE_REF
                    || lookahead2 === ANTLRv4Parser.SEMPRED
                    || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                    || lookahead2 === ANTLRv4Parser.TOKEN_REF
                    || (lookahead2 >= ANTLRv4Parser.BLOCK && lookahead2 <= ANTLRv4Parser.CLOSURE)
                    || lookahead2 === ANTLRv4Parser.EPSILON
                    || (lookahead2 >= ANTLRv4Parser.OPTIONAL && lookahead2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                    || (lookahead2 >= ANTLRv4Parser.SET && lookahead2 <= ANTLRv4Parser.WILDCARD)) {
                    const literal = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                    this.stringRef(literal as TerminalAST);
                } else {
                    const mark = this.input.mark();
                    try {
                        this.input.consume();

                        throw new NoViableAltException(53, 1);
                    } finally {
                        this.input.release(mark);
                    }
                }
            } else if (lookahead === ANTLRv4Parser.TOKEN_REF) {
                const lookahead2 = this.input.lookahead(2);
                if ((lookahead2 === Constants.Down)) {
                    const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                    this.match(this.input, Constants.Down);
                    this.elementOptions();
                    this.match(this.input, Constants.Up);
                    this.tokenRef(tokenRef as TerminalAST);
                } else if ((lookahead2 === ANTLRv4Parser.EOF
                    || (lookahead2 >= Constants.Up && lookahead2 <= ANTLRv4Parser.ACTION)
                    || lookahead2 === ANTLRv4Parser.ASSIGN
                    || lookahead2 === ANTLRv4Parser.DOT
                    || lookahead2 === ANTLRv4Parser.LEXER_CHAR_SET
                    || lookahead2 === ANTLRv4Parser.NOT
                    || lookahead2 === ANTLRv4Parser.PLUS_ASSIGN
                    || lookahead2 === ANTLRv4Parser.RANGE
                    || lookahead2 === ANTLRv4Parser.RULE_REF
                    || lookahead2 === ANTLRv4Parser.SEMPRED
                    || lookahead2 === ANTLRv4Parser.STRING_LITERAL
                    || lookahead2 === ANTLRv4Parser.TOKEN_REF
                    || (lookahead2 >= ANTLRv4Parser.BLOCK && lookahead2 <= ANTLRv4Parser.CLOSURE)
                    || lookahead2 === ANTLRv4Parser.EPSILON
                    || (lookahead2 >= ANTLRv4Parser.OPTIONAL && lookahead2 <= ANTLRv4Parser.POSITIVE_CLOSURE)
                    || (lookahead2 >= ANTLRv4Parser.SET && lookahead2 <= ANTLRv4Parser.WILDCARD))) {
                    const tokenRef = this.match(this.input, ANTLRv4Parser.TOKEN_REF)!;
                    this.tokenRef(tokenRef as TerminalAST);
                } else {
                    const mark = this.input.mark();
                    try {
                        this.input.consume();

                        throw new NoViableAltException(53, 2);
                    } finally {
                        this.input.release(mark);
                    }
                }
            } else {
                throw new NoViableAltException(53, 0);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                this.reportError(re);
            } else {
                throw re;
            }
        }
    }

    private elementOptions(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        try {
            this.match(this.input, ANTLRv4Parser.ELEMENT_OPTIONS);
            if (this.input.lookahead(1) === Constants.Down) {
                this.match(this.input, Constants.Down);

                while (true) {
                    const lookahead = this.input.lookahead(1);
                    if (lookahead === ANTLRv4Parser.ASSIGN || lookahead === ANTLRv4Parser.ID) {
                        this.handleElementOption(start.parent as GrammarASTWithOptions);
                    } else {
                        break;
                    }
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
    }

    private handleLexerCommand(): void {
        const start = this.input.lookaheadType(1) as GrammarAST;

        this.enterLexerCommand(start);

        try {
            const lookahead = this.input.lookahead(1);
            if ((lookahead === ANTLRv4Parser.LEXER_ACTION_CALL)) {
                this.match(this.input, ANTLRv4Parser.LEXER_ACTION_CALL);
                this.match(this.input, Constants.Down);
                this.match(this.input, ANTLRv4Parser.ID)!;
                this.lexerCommandExpr();
                this.match(this.input, Constants.Up);
            } else {
                if ((lookahead === ANTLRv4Parser.ID)) {
                    const id = this.match(this.input, ANTLRv4Parser.ID)!;
                    this.lexerCommand(this.currentOuterAltNumber, id);
                } else {
                    throw new NoViableAltException(39, 0);
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

    private handleElementOption(t: GrammarASTWithOptions): void {
        try {
            const lookahead = this.input.lookahead(1);
            if (lookahead === ANTLRv4Parser.ID) {
                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                this.elementOption(t, id, null);
            } else if (lookahead === ANTLRv4Parser.ASSIGN) {
                if (this.input.lookahead(2) === Constants.Down) {
                    if (this.input.lookahead(3) === ANTLRv4Parser.ID) {
                        switch (this.input.lookahead(4)) {
                            case ANTLRv4Parser.ID: {
                                this.match(this.input, ANTLRv4Parser.ASSIGN);
                                this.match(this.input, Constants.Down);
                                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                                const v = this.match(this.input, ANTLRv4Parser.ID)!;
                                this.match(this.input, Constants.Up);

                                this.elementOption(t, id, v);

                                break;
                            }

                            case ANTLRv4Parser.STRING_LITERAL: {
                                this.match(this.input, ANTLRv4Parser.ASSIGN);
                                this.match(this.input, Constants.Down);
                                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                                const v = this.match(this.input, ANTLRv4Parser.STRING_LITERAL)!;
                                this.match(this.input, Constants.Up);

                                this.elementOption(t, id, v);

                                break;
                            }

                            case ANTLRv4Parser.ACTION: {
                                this.match(this.input, ANTLRv4Parser.ASSIGN);
                                this.match(this.input, Constants.Down);
                                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                                const v = this.match(this.input, ANTLRv4Parser.ACTION)!;
                                this.match(this.input, Constants.Up);

                                this.elementOption(t, id, v);

                                break;
                            }

                            case ANTLRv4Parser.INT: {
                                this.match(this.input, ANTLRv4Parser.ASSIGN);
                                this.match(this.input, Constants.Down);
                                const id = this.match(this.input, ANTLRv4Parser.ID)!;
                                const v = this.match(this.input, ANTLRv4Parser.INT)!;
                                this.match(this.input, Constants.Up);

                                this.elementOption(t, id, v);

                                break;
                            }

                            default: {
                                const mark = this.input.mark();
                                try {
                                    this.input.consume();
                                    this.input.consume();
                                    this.input.consume();

                                    throw new NoViableAltException(55, 4);
                                } finally {
                                    this.input.release(mark);
                                }
                            }

                        }
                    } else {
                        const mark = this.input.mark();
                        try {
                            this.input.consume();
                            this.input.consume();

                            throw new NoViableAltException(55, 3);
                        } finally {
                            this.input.release(mark);
                        }
                    }
                } else {
                    const mark = this.input.mark();
                    try {
                        this.input.consume();

                        throw new NoViableAltException(55, 2);
                    } finally {
                        this.input.release(mark);
                    }
                }
            } else {
                throw new NoViableAltException(55, 0);
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
