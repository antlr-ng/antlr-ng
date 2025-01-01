/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import {
    ATN, ATNState, AbstractPredicateTransition, ActionTransition, AtomTransition, BasicBlockStartState,
    BasicState,
    BlockEndState, BlockStartState, EpsilonTransition, IntervalSet, LL1Analyzer, LoopEndState,
    NotSetTransition, PlusBlockStartState, PlusLoopbackState, PrecedencePredicateTransition, PredicateTransition,
    RuleStartState, RuleStopState, RuleTransition, SetTransition, StarBlockStartState, StarLoopEntryState,
    StarLoopbackState, Token, WildcardTransition
} from "antlr4ng";

import { CommonTreeNodeStream } from "../antlr3/tree/CommonTreeNodeStream.js";
import { ClassFactory } from "../ClassFactory.js";
import { Constants } from "../Constants.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { CharSupport } from "../misc/CharSupport.js";
import type { Constructor } from "../misc/Utils.js";
import { GrammarASTAdaptor } from "../parse/GrammarASTAdaptor.js";
import { UseDefAnalyzer } from "../semantics/UseDefAnalyzer.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { AltAST } from "../tool/ast/AltAST.js";
import { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import { PredAST } from "../tool/ast/PredAST.js";
import { QuantifierAST } from "../tool/ast/QuantifierAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";
import { ErrorType } from "../tool/ErrorType.js";
import { LeftRecursiveRule } from "../tool/LeftRecursiveRule.js";
import { LexerGrammar } from "../tool/LexerGrammar.js";
import { Rule } from "../tool/Rule.js";
import { ATNBuilder } from "../tree-walkers/ATNBuilder.js";
import type { IGrammar, IParserATNFactory } from "../types.js";
import { ATNOptimizer } from "./ATNOptimizer.js";
import { IATNFactory, type IStatePair } from "./IATNFactory.js";
import { TailEpsilonRemover } from "./TailEpsilonRemover.js";

/**
 * ATN construction routines triggered by ATNBuilder.g.
 *
 *  No side-effects. It builds an {@link ATN} object and returns it.
 */
export class ParserATNFactory implements IParserATNFactory, IATNFactory {

    public readonly g: IGrammar;

    public readonly atn: ATN;

    public currentRule?: Rule;

    public currentOuterAlt: number;

    protected readonly preventEpsilonClosureBlocks = new Array<[Rule, ATNState, ATNState]>();

    protected readonly preventEpsilonOptionalBlocks = new Array<[Rule, ATNState, ATNState]>();

    public constructor(g: IGrammar) {
        this.g = g;

        const atnType = g instanceof LexerGrammar ? ATN.LEXER : ATN.PARSER;
        const maxTokenType = g.getMaxTokenType();
        this.atn = new ATN(atnType, maxTokenType);
    }

    /**
     * {@code (BLOCK (ALT .))} or {@code (BLOCK (ALT 'a') (ALT .))}.
     */
    public static blockHasWildcardAlt(block: GrammarAST): boolean {
        for (const alt of block.getChildren()) {
            if (!(alt instanceof AltAST)) {
                continue;
            }

            const altAST = alt;
            if (altAST.getChildCount() === 1 || (altAST.getChildCount() === 2
                && altAST.getChild(0)!.getType() === ANTLRv4Parser.ELEMENT_OPTIONS)) {
                const e = altAST.getChild(altAST.getChildCount() - 1)!;
                if (e.getType() === ANTLRv4Parser.WILDCARD) {
                    return true;
                }
            }
        }

        return false;
    }

    public createATN(): ATN {
        this._createATN(Array.from(this.g.rules.values()));

        this.addRuleFollowLinks();
        this.addEOFTransitionToStartRules();
        ATNOptimizer.optimize(this.g, this.atn);
        this.checkEpsilonClosure();

        optionalCheck:
        for (const [rule, atnState1, atnState2] of this.preventEpsilonOptionalBlocks) {
            let bypassCount = 0;
            for (const transition of atnState1.transitions) {
                const startState = transition.target;
                if (startState === atnState2) {
                    bypassCount++;
                    continue;
                }

                const analyzer = new LL1Analyzer(this.atn);
                if (analyzer.look(startState, atnState2).contains(Token.EPSILON)) {
                    this.g.tool.errorManager.grammarError(ErrorType.EPSILON_OPTIONAL, this.g.fileName,
                        (rule.ast.getChild(0) as GrammarAST).token!, rule.name);
                    continue optionalCheck;
                }
            }

            if (bypassCount !== 1) {
                throw new Error("Expected optional block with exactly 1 bypass alternative.");
            }
        }

        return this.atn;
    }

    public setCurrentRuleName(name: string): void {
        this.currentRule = this.g.getRule(name) ?? undefined;
    }

    public setCurrentOuterAlt(alt: number): void {
        this.currentOuterAlt = alt;
    }

    /* start->rule-block->end */

    public rule(ruleAST: GrammarAST, name: string, blk: IStatePair): IStatePair {
        const r = this.g.getRule(name)!;
        const start = this.atn.ruleToStartState[r.index]!;
        this.epsilon(start, blk.left!);
        const stop = this.atn.ruleToStopState[r.index]!;
        this.epsilon(blk.right, stop);
        const h = { left: start, right: stop };
        ruleAST.atnState = start;

        return h;
    }

    /** From label {@code A} build graph {@code o-A->o}. */

    public tokenRef(node: TerminalAST): IStatePair | null {
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        const ttype = this.g.getTokenType(node.getText());
        left.addTransition(new AtomTransition(right, ttype));
        node.atnState = left;

        return { left, right };
    }

    /**
     * From set build single edge graph {@code o->o-set->o}.  To conform to
     *  what an alt block looks like, must have extra state on left.
     *  This also handles {@code ~A}, converted to {@code ~{A}} set.
     */
    public set(associatedAST: GrammarAST, terminals: GrammarAST[], invert: boolean): IStatePair {
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        const set = new IntervalSet();
        for (const t of terminals) {
            const ttype = this.g.getTokenType(t.getText());
            set.addOne(ttype);
        }

        if (invert) {
            left.addTransition(new NotSetTransition(right, set));
        } else {
            left.addTransition(new SetTransition(right, set));
        }
        associatedAST.atnState = left;

        return { left, right };
    }

    /** Not valid for non-lexers. */
    public range(a: GrammarAST, b: GrammarAST): IStatePair | null {
        this.g.tool.errorManager.grammarError(ErrorType.TOKEN_RANGE_IN_PARSER, this.g.fileName, a.token!, a.token?.text,
            b.token?.text);

        // From a..b, yield ATN for just a.
        return this.tokenRef(a as TerminalAST);
    }

    /** For a non-lexer, just build a simple token reference atom. */

    public stringLiteral(stringLiteralAST: TerminalAST): IStatePair | null {
        return this.tokenRef(stringLiteralAST);
    }

    /** {@code [Aa]} char sets not allowed in parser */

    public charSetLiteral(charSetAST: GrammarAST): IStatePair | null {
        return null;
    }

    /**
     * For reference to rule {@code r}, build
     *
     * <pre>
     *  o-&gt;(r)  o
     * </pre>
     *
     * where {@code (r)} is the start of rule {@code r} and the trailing
     * {@code o} is not linked to from rule ref state directly (uses
     * {@link RuleTransition#followState}).
     */

    public ruleRef(node: GrammarAST): IStatePair | null {
        const h = this._ruleRef(node);

        return h;
    }

    public _ruleRef(node: GrammarAST): IStatePair | null {
        const r = this.g.getRule(node.getText());
        if (r === null) {
            this.g.tool.errorManager.grammarError(ErrorType.INTERNAL_ERROR, this.g.fileName, node.token!,
                "Rule " + node.getText() + " undefined");

            return null;
        }

        const start = this.atn.ruleToStartState[r.index]!;
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        let precedence = 0;
        const ast = node as GrammarASTWithOptions;
        if (ast.getOptionString(Constants.PRECEDENCE_OPTION_NAME)) {
            precedence = Number.parseInt(ast.getOptionString(Constants.PRECEDENCE_OPTION_NAME) ?? "0");
        }
        const call = new RuleTransition(start, r.index, precedence, right);
        left.addTransition(call);

        node.atnState = left;

        return { left, right };
    }

    public addFollowLink(ruleIndex: number, right: ATNState): void {
        // add follow edge from end of invoked rule
        const stop = this.atn.ruleToStopState[ruleIndex]!;
        this.epsilon(stop, right);
    }

    /** From an empty alternative build {@code o-e->o}. */

    public epsilon(node: GrammarAST): IStatePair;
    public epsilon(a: ATNState | null, b: ATNState, prepend?: boolean): void;
    public epsilon(...args: unknown[]): IStatePair | undefined {
        if (args.length === 1) {
            const [node] = args as [GrammarAST];

            const left = this.newState(BasicState);
            const right = this.newState(BasicState);
            this.epsilon(left, right);
            node.atnState = left;

            return { left, right };
        }

        const [a, b, prepend] = args as [ATNState | null, ATNState, boolean | undefined];

        if (a !== null) {
            const index = prepend ? 0 : a.transitions.length;
            a.addTransitionAtIndex(index, new EpsilonTransition(b));
        }

        return undefined;
    }

    /**
     * Build what amounts to an epsilon transition with a semantic
     *  predicate action.  The {@code pred} is a pointer into the AST of
     *  the {@link ANTLRParser#SEMPRED} token.
     */
    public sempred(pred: PredAST): IStatePair {
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);

        let p: AbstractPredicateTransition;
        if (pred.getOptionString(Constants.PRECEDENCE_OPTION_NAME)) {
            const precedence = Number.parseInt(pred.getOptionString(Constants.PRECEDENCE_OPTION_NAME) ?? "0");
            p = new PrecedencePredicateTransition(right, precedence);
        } else {
            const isCtxDependent = UseDefAnalyzer.actionIsContextDependent(pred);
            p = new PredicateTransition(right, this.currentRule!.index, this.g.sempreds.get(pred)!, isCtxDependent);
        }

        left.addTransition(p);
        pred.atnState = left;

        return { left, right };
    }

    /**
     * Build what amounts to an epsilon transition with an action.
     *  The action goes into ATN though it is ignored during prediction
     *  if {@link ActionTransition#actionIndex actionIndex}{@code <0}.
     */
    public action(astOrString: ActionAST | string): IStatePair {
        if (astOrString instanceof ActionAST) {
            const left = this.newState(BasicState);
            const right = this.newState(BasicState);
            const a = new ActionTransition(right, this.currentRule!.index, -1, false);
            left.addTransition(a);
            astOrString.atnState = left;

            return { left, right };
        }

        throw new Error("This element is not valid in parsers.");
    }

    /**
     * From {@code A|B|..|Z} alternative block build
     *
     * <pre>
     *  o-&gt;o-A-&gt;o-&gt;o (last ATNState is BlockEndState pointed to by all alts)
     *  |          ^
     *  |-&gt;o-B-&gt;o--|
     *  |          |
     *  ...        |
     *  |          |
     *  |-&gt;o-Z-&gt;o--|
     * </pre>
     *
     * So start node points at every alternative with epsilon transition and
     * every alt right side points at a block end ATNState.
     * <p>
     * Special case: only one alternative: don't make a block with alt
     * begin/end.
     * <p>
     * Special case: if just a list of tokens/chars/sets, then collapse to a
     * single edged o-set-&gt;o graph.
     * <p>
     * TODO: Set alt number (1..n) in the states?
     */
    public block(blkAST: BlockAST, ebnfRoot: GrammarAST | null, alts: IStatePair[]): IStatePair | null {
        if (ebnfRoot === null) {
            if (alts.length === 1) {
                const h = alts[0];
                blkAST.atnState = h.left!;

                return h;
            }

            const start = this.newState(BasicBlockStartState);
            if (alts.length > 1) {
                this.atn.defineDecisionState(start);
            }

            return this.makeBlock(start, blkAST, alts);
        }

        switch (ebnfRoot.getType()) {
            case ANTLRv4Parser.OPTIONAL: {
                const start = this.newState(BasicBlockStartState);
                this.atn.defineDecisionState(start);
                const h = this.makeBlock(start, blkAST, alts);

                return this.optional(ebnfRoot, h);
            }

            case ANTLRv4Parser.CLOSURE: {
                const star = this.newState(StarBlockStartState);
                if (alts.length > 1) {
                    this.atn.defineDecisionState(star);
                }

                const h = this.makeBlock(star, blkAST, alts);

                return this.star(ebnfRoot, h);
            }

            case ANTLRv4Parser.POSITIVE_CLOSURE: {
                const plus = this.newState(PlusBlockStartState);
                if (alts.length > 1) {
                    this.atn.defineDecisionState(plus);
                }

                const h = this.makeBlock(plus, blkAST, alts);

                return this.plus(ebnfRoot, h);
            }

            default:

        }

        return null;
    }

    public alt(els: IStatePair[]): IStatePair {
        return this.elemList(els);
    }

    public elemList(els: Array<IStatePair | null>): IStatePair {
        const n = els.length;
        for (let i = 0; i < n - 1; i++) {	// hook up elements (visit all but last)
            const el = els[i]!;

            // if el is of form o-x->o for x in {rule, action, pred, token, ...}
            // and not last in alt
            let tr = null;
            if (el.left!.transitions.length === 1) {
                tr = el.left!.transitions[0];
            }

            const isRuleTrans = tr instanceof RuleTransition;
            if ((el.left!.constructor as typeof ATNState).stateType === ATNState.BASIC
                && el.right && (el.right.constructor as typeof ATNState).stateType === ATNState.BASIC
                && tr !== null
                && (isRuleTrans && (tr as RuleTransition).followState === el.right || tr.target === el.right)) {
                // we can avoid epsilon edge to next el
                let handle = null;
                if (i + 1 < els.length) {
                    handle = els[i + 1];
                }

                if (handle !== null) {
                    if (isRuleTrans) {
                        (tr as RuleTransition).followState = handle.left!;
                    } else {
                        tr.target = handle.left!;
                    }
                }
                this.atn.removeState(el.right); // we skipped over this state
            } else { // need epsilon if previous block's right end node is complicated
                this.epsilon(el.right, els[i + 1]!.left!);
            }
        }

        const first = els[0];
        const last = els[n - 1];
        let left: ATNState | null = null;
        if (first !== null) {
            left = first.left;
        }

        let right: ATNState | null = null;
        if (last !== null) {
            right = last.right;
        }

        return { left, right };
    }

    /**
     * From {@code (A)?} build either:
     *
     * <pre>
     *  o--A-&gt;o
     *  |     ^
     *  o----&gt;|
     * </pre>
     *
     * or, if {@code A} is a block, just add an empty alt to the end of the
     * block
     */
    public optional(optAST: GrammarAST, blk: IStatePair): IStatePair {
        const blkStart = blk.left as BlockStartState;
        const blkEnd = blk.right;
        this.preventEpsilonOptionalBlocks.push([this.currentRule!, blkStart, blkEnd!]);

        const greedy = (optAST as QuantifierAST).isGreedy();
        blkStart.nonGreedy = !greedy;
        this.epsilon(blkStart, blk.right!, !greedy);

        optAST.atnState = blk.left!;

        return blk;
    }

    /**
     * From {@code (blk)+} build
     *
     * <pre>
     *   |---------|
     *   v         |
     *  [o-blk-o]-&gt;o-&gt;o
     * </pre>
     *
     * We add a decision for loop back node to the existing one at {@code blk}
     * start.
     */
    public plus(plusAST: GrammarAST, blk: IStatePair): IStatePair {
        const blkStart = blk.left as PlusBlockStartState;
        const blkEnd = blk.right as BlockEndState;
        this.preventEpsilonClosureBlocks.push([this.currentRule!, blkStart, blkEnd]);

        const loop = this.newState(PlusLoopbackState);
        loop.nonGreedy = !(plusAST as QuantifierAST).isGreedy();
        this.atn.defineDecisionState(loop);
        const end = this.newState(LoopEndState);
        blkStart.loopBackState = loop;
        end.loopBackState = loop;

        plusAST.atnState = loop;
        this.epsilon(blkEnd, loop); // blk can see loop back

        const blkAST = plusAST.getChild(0) as BlockAST;
        if ((plusAST as QuantifierAST).isGreedy()) {
            if (this.expectNonGreedy(blkAST)) {
                this.g.tool.errorManager.grammarError(ErrorType.EXPECTED_NON_GREEDY_WILDCARD_BLOCK, this.g.fileName,
                    plusAST.token!, plusAST.token?.text);
            }

            this.epsilon(loop, blkStart);	// loop back to start
            this.epsilon(loop, end); // or exit
        } else {
            // if not greedy, priority to exit branch; make it first
            this.epsilon(loop, end); // exit
            this.epsilon(loop, blkStart);	// loop back to start
        }

        return { left: blkStart, right: end };
    }

    /**
     * From {@code (blk)*} build {@code ( blk+ )?} with *two* decisions, one for
     * entry and one for choosing alts of {@code blk}.
     *
     * <pre>
     *   |-------------|
     *   v             |
     *   o--[o-blk-o]-&gt;o  o
     *   |                ^
     *   -----------------|
     * </pre>
     *
     * Note that the optional bypass must jump outside the loop as
     * {@code (A|B)*} is not the same thing as {@code (A|B|)+}.
     */
    public star(starAST: GrammarAST, elem: IStatePair): IStatePair {
        const blkStart = elem.left as StarBlockStartState;
        const blkEnd = elem.right as BlockEndState;
        this.preventEpsilonClosureBlocks.push([this.currentRule!, blkStart, blkEnd]);

        const entry = this.newState(StarLoopEntryState);
        entry.nonGreedy = !(starAST as QuantifierAST).isGreedy();
        this.atn.defineDecisionState(entry);
        const end = this.newState(LoopEndState);
        const loop = this.newState(StarLoopbackState);
        entry.loopBackState = loop;
        end.loopBackState = loop;

        const blkAST = starAST.getChild(0) as BlockAST;
        if ((starAST as QuantifierAST).isGreedy()) {
            if (this.expectNonGreedy(blkAST)) {
                this.g.tool.errorManager.grammarError(ErrorType.EXPECTED_NON_GREEDY_WILDCARD_BLOCK, this.g.fileName,
                    starAST.token!, starAST.token?.text);
            }

            this.epsilon(entry, blkStart);	// loop enter edge (alt 1)
            this.epsilon(entry, end); // bypass loop edge (alt 2)
        } else {
            // if not greedy, priority to exit branch; make it first
            this.epsilon(entry, end); // bypass loop edge (alt 1)
            this.epsilon(entry, blkStart);	// loop enter edge (alt 2)
        }
        this.epsilon(blkEnd, loop); // block end hits loop back
        this.epsilon(loop, entry); // loop back to entry/exit decision

        starAST.atnState = entry;	// decision is to enter/exit; blk is its own decision

        return { left: entry, right: end };
    }

    /** Build an atom with all possible values in its label. */

    public wildcard(node: GrammarAST): IStatePair {
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        left.addTransition(new WildcardTransition(right));
        node.atnState = left;

        return { left, right };
    }

    public addRuleFollowLinks(): void {
        for (const p of this.atn.states) {
            if (p !== null &&
                (p.constructor as typeof ATNState).stateType === ATNState.BASIC && p.transitions.length === 1 &&
                p.transitions[0] instanceof RuleTransition) {
                const rt = p.transitions[0];
                this.addFollowLink(rt.ruleIndex, rt.followState);
            }
        }
    }

    /**
     * Add an EOF transition to any rule end ATNState that points to nothing
     *  (i.e., for all those rules not invoked by another rule).  These
     *  are start symbols then.
     *
     *  Return the number of grammar entry points; i.e., how many rules are
     *  not invoked by another rule (they can only be invoked from outside).
     *  These are the start rules.
     */
    public addEOFTransitionToStartRules(): number {
        let n = 0;
        const eofTarget = this.newState(BasicState); // one unique EOF target for all rules
        for (const r of this.g.rules.values()) {
            const stop = this.atn.ruleToStopState[r.index]!;
            if (stop.transitions.length > 0) {
                continue;
            }

            ++n;
            const t = new AtomTransition(eofTarget, Token.EOF);
            stop.addTransition(t);
        }

        return n;
    }

    public label(t: IStatePair): IStatePair {
        return t;
    }

    public listLabel(t: IStatePair): IStatePair {
        return t;
    }

    public newState<T extends ATNState>(nodeType: Constructor<T>): T {
        try {
            const s = new nodeType();
            if (!this.currentRule) {
                s.ruleIndex = -1;
            } else {
                s.ruleIndex = this.currentRule.index;
            }

            this.atn.addState(s);

            return s;
        } catch (cause) {
            const message = `Could not create ATN state of type ${nodeType.name}.`;
            const error = new Error(message);
            error.cause = cause;

            throw error;
        }
    }

    public expectNonGreedy(blkAST: BlockAST): boolean {
        if (ParserATNFactory.blockHasWildcardAlt(blkAST)) {
            return true;
        }

        return false;
    }

    public lexerAltCommands(alt: IStatePair, commands: IStatePair): IStatePair {
        throw new Error("This element is not allowed in parsers.");
    }

    public lexerCallCommand(_id: GrammarAST, arg: GrammarAST): IStatePair {
        throw new Error("This element is not allowed in parsers.");
    }

    public lexerCommand(id: GrammarAST): IStatePair {
        throw new Error("This element is not allowed in parsers.");
    }

    protected checkEpsilonClosure(): void {
        for (const [rule, atnState1, atnState2] of this.preventEpsilonClosureBlocks) {
            const analyzer = new LL1Analyzer(this.atn);
            const blkStart = atnState1;
            const blkStop = atnState2;
            const lookahead = analyzer.look(blkStart, blkStop);
            if (lookahead.contains(Token.EPSILON)) {
                const errorType = rule instanceof LeftRecursiveRule
                    ? ErrorType.EPSILON_LR_FOLLOW
                    : ErrorType.EPSILON_CLOSURE;
                this.g.tool.errorManager.grammarError(errorType, this.g.fileName,
                    (rule.ast.getChild(0) as GrammarAST).token!, rule.name);
            }

            if (lookahead.contains(Token.EOF)) {
                this.g.tool.errorManager.grammarError(ErrorType.EOF_CLOSURE, this.g.fileName,
                    (rule.ast.getChild(0) as GrammarAST).token!, rule.name);
            }
        }
    }

    protected _createATN(rules: Rule[]): void {
        this.createRuleStartAndStopATNStates();

        const adaptor = new GrammarASTAdaptor();
        for (const r of rules) {
            // find rule's block
            const blk = r.ast.getFirstChildWithType(ANTLRv4Parser.BLOCK) as GrammarAST;
            const nodes = new CommonTreeNodeStream(adaptor, blk);
            const b = new ATNBuilder(nodes, this);

            this.setCurrentRuleName(r.name);
            const h = b.ruleBlock(null)!;
            this.rule(r.ast, r.name, h);
        }
    }

    protected getTokenType(atom: GrammarAST): number {
        let ttype: number;
        if (this.g.isLexer()) {
            ttype = CharSupport.getCharValueFromGrammarCharLiteral(atom.getText());
        } else {
            ttype = this.g.getTokenType(atom.getText());
        }

        return ttype;
    }

    protected makeBlock(start: BlockStartState, blkAST: BlockAST, alts: IStatePair[]): IStatePair {
        const end = this.newState(BlockEndState);
        start.endState = end;
        for (const alt of alts) {
            // hook alts up to decision block
            this.epsilon(start, alt.left!);
            this.epsilon(alt.right, end);
            // no back link in ATN so must walk entire alt to see if we can
            // strip out the epsilon to 'end' state
            const opt = new TailEpsilonRemover(this.atn);
            opt.visit(alt.left!);
        }

        blkAST.atnState = start;

        return { left: start, right: end };
    }

    /**
     * Define all the rule begin/end ATNStates to solve forward reference
     *  issues.
     */
    protected createRuleStartAndStopATNStates(): void {
        this.atn.ruleToStartState = new Array<RuleStartState>(this.g.rules.size);
        this.atn.ruleToStopState = new Array<RuleStopState>(this.g.rules.size);
        for (const r of this.g.rules.values()) {
            const start = this.newState(RuleStartState);
            const stop = this.newState(RuleStopState);
            start.stopState = stop;
            start.isLeftRecursiveRule = r instanceof LeftRecursiveRule;
            start.ruleIndex = r.index;
            stop.ruleIndex = r.index;
            this.atn.ruleToStartState[r.index] = start;
            this.atn.ruleToStopState[r.index] = stop;
        }
    }

    static {
        ClassFactory.createParserATNFactory = (g: IGrammar) => {
            return new ParserATNFactory(g);
        };
    }
}
