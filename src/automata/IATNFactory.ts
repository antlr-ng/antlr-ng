/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { ATN, ATNState } from "antlr4ng";

import { ActionAST } from "../tool/ast/ActionAST.js";
import { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { PredAST } from "../tool/ast/PredAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";

/**
 * A pair of states pointing to the left/right (start and end) states of a
 * state submachine. Used to build ATNs.
 */
export interface IStatePair {
    left: ATNState;
    right: ATNState | null;
}

export interface IATNFactory {
    setCurrentOuterAlt(alt: number): void;

    createATN(): ATN;
    setCurrentRuleName(name: string): void;
    rule(ruleAST: GrammarAST, name: string, blk: IStatePair): IStatePair;
    newState(): ATNState;
    label(t: IStatePair): IStatePair;
    listLabel(t: IStatePair): IStatePair;
    tokenRef(node: TerminalAST): IStatePair | null;
    set(associatedAST: GrammarAST, alts: GrammarAST[], invert: boolean): IStatePair;
    charSetLiteral(charSetAST: GrammarAST): IStatePair | null;
    range(a: GrammarAST, b: GrammarAST): IStatePair | null;

    /**
     * For a non-lexer, just build a simple token reference atom.
     *  For a lexer, a string is a sequence of char to match.  That is,
     *  "fog" is treated as 'f' 'o' 'g' not as a single transition in
     *  the DFA. Machine== o-'f'->o-'o'->o-'g'->o and has n+1 states
     *  for n characters.
     */
    stringLiteral(stringLiteralAST: TerminalAST): IStatePair | null;

    /**
     * For reference to rule r, build
     *
     *     o-e->(r)  o
     *
     * where (r) is the start of rule r and the trailing o is not linked
     * to from rule ref state directly (it's done thru the transition(0)
     * RuleClosureTransition.
     *
     * If the rule r is just a list of tokens, it's block will be just
     * a set on an edge o->o->o-set->o->o->o, could inline it rather than doing
     * the rule reference, but i'm not doing this yet as I'm not sure
     * it would help much in the ATN->DFA construction.
     *
     * TODO add to codegen: collapse alt blocks that are sets into single matchSet
     */
    ruleRef(node: GrammarAST): IStatePair | null;

    /** From an empty alternative build Grip o-e->o */
    epsilon(node: GrammarAST): IStatePair;

    /**
     * Build what amounts to an epsilon transition with a semantic
     * predicate action.  The pred is a pointer into the AST of
     * the SEMPRED token.
     */
    sempred(pred: PredAST): IStatePair;

    /**
     * Build what amounts to an epsilon transition with an action.
     * The action goes into ATN though it is ignored during analysis.
     */
    action(action: ActionAST | string): IStatePair;

    alt(els: IStatePair[]): IStatePair;

    /**
     * From A|B|..|Z alternative block build
     *
     *  o->o-A->o->o (last ATNState is blockEndATNState pointed to by all alts)
     *  |          ^
     *  o->o-B->o--|
     *  |          |
     *  ...        |
     *  |          |
     *  o->o-Z->o--|
     *
     * So every alternative gets begin ATNState connected by epsilon
     * and every alt right side points at a block end ATNState.  There is a
     * new ATNState in the ATNState in the Grip for each alt plus one for the
     * end ATNState.
     *
     * Special case: only one alternative: don't make a block with alt
     * begin/end.
     *
     * Special case: if just a list of tokens/chars/sets, then collapse
     * to a single edge'd o-set->o graph.
     *
     * Set alt number (1..n) in the left-Transition ATNState.
     */
    block(blockAST: BlockAST, ebnfRoot: GrammarAST | null, alternativeGrips: IStatePair[]): IStatePair | null;

    /**
     * From (A)? build either:
     *
     *  o--A->o
     *  |     ^
     *  o---->|
     *
     * or, if A is a block, just add an empty alt to the end of the block
     */
    optional(optAST: GrammarAST, blk: IStatePair): IStatePair;

    /**
     * From (A)+ build
     *
     *     |---|    (Transition 2 from A.right points at alt 1)
     *     v   |    (follow of loop is Transition 1)
     *  o->o-A-o->o
     *
     * Meaning that the last ATNState in A points back to A's left Transition ATNState
     * and we add a new begin/end ATNState.  A can be single alternative or
     * multiple.
     *
     * During analysis we'll call the follow link (transition 1) alt n+1 for
     * an n-alt A block.
     */
    plus(plusAST: GrammarAST, blk: IStatePair): IStatePair;

    /**
     * From (A)* build
     *
     *     |---|
     *     v   |
     *  o->o-A-o--o (Transition 2 from block end points at alt 1; follow is Transition 1)
     *  |         ^
     *  o---------| (optional branch is 2nd alt of optional block containing A+)
     *
     * Meaning that the last (end) ATNState in A points back to A's
     * left side ATNState and we add 3 new ATNStates (the
     * optional branch is built just like an optional subrule).
     * See the Aplus() method for more on the loop back Transition.
     * The new node on right edge is set to RIGHT_EDGE_OF_CLOSURE so we
     * can detect nested (A*)* loops and insert an extra node.  Previously,
     * two blocks shared same EOB node.
     *
     * There are 2 or 3 decision points in a A*.  If A is not a block (i.e.,
     * it only has one alt), then there are two decisions: the optional bypass
     * and then loopback.  If A is a block of alts, then there are three
     * decisions: bypass, loopback, and A's decision point.
     *
     * Note that the optional bypass must be outside the loop as (A|B)* is
     * not the same thing as (A|B|)+.
     *
     * This is an accurate ATN representation of the meaning of (A)*, but
     * for generating code, I don't need a DFA for the optional branch by
     * virtue of how I generate code.  The exit-loopback-branch decision
     * is sufficient to let me make an appropriate enter, exit, loop
     * determination.  See codegen.g
     */

    star(starAST: GrammarAST, blk: IStatePair): IStatePair;

    /** Build an atom with all possible values in its label */
    wildcard(associatedAST: GrammarAST): IStatePair;

    lexerAltCommands(alt: IStatePair, commands: IStatePair): IStatePair;
    lexerCallCommand(id: GrammarAST, arg: GrammarAST): IStatePair;
    lexerCommand(id: GrammarAST): IStatePair;
}
