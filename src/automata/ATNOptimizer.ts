/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import {
    ATN, ATNState, AtomTransition, BlockEndState, CodePointTransitions, EpsilonTransition, IntervalSet,
    NotSetTransition, RangeTransition, SetTransition, Transition
} from "antlr4ng";

import { CharSupport } from "../misc/CharSupport.js";
import { Character } from "../support/Character.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";

export class ATNOptimizer {
    private constructor() {
        // intentionally empty
    }

    public static optimize(g: Grammar, atn: ATN): void {
        ATNOptimizer.optimizeSets(g, atn);
        ATNOptimizer.optimizeStates(atn);
    }

    private static optimizeSets(g: Grammar, atn: ATN): void {
        if (g.isParser()) {
            // parser codegen doesn't currently support SetTransition
            return;
        }

        const decisions = atn.decisionToState;
        for (const decision of decisions) {
            if (decision.ruleIndex >= 0) {
                const rule = g.getRule(decision.ruleIndex)!;
                if (Character.isLowerCase(rule.name.codePointAt(0)!)) {
                    // parser codegen doesn't currently support SetTransition
                    continue;
                }
            }

            const setTransitions = new IntervalSet();
            for (let i = 0; i < decision.transitions.length; i++) {
                const epsTransition = decision.transitions[i];
                if (!(epsTransition instanceof EpsilonTransition)) {
                    continue;
                }

                if (epsTransition.target.transitions.length !== 1) {
                    continue;
                }

                const transition = epsTransition.target.transitions[0];
                if (!(transition.target instanceof BlockEndState)) {
                    continue;
                }

                if (transition instanceof NotSetTransition) {
                    // TODO: not yet implemented
                    continue;
                }

                if (transition instanceof AtomTransition
                    || transition instanceof RangeTransition
                    || transition instanceof SetTransition) {
                    setTransitions.addOne(i);
                }
            }

            // due to min alt resolution policies, can only collapse sequential alts
            const setIntervals = Array.from(setTransitions);
            for (let i = setIntervals.length - 1; i >= 0; i--) {
                const interval = setIntervals[i];
                if (interval.length <= 1) {
                    continue;
                }

                const blockEndState = decision.transitions[interval.start].target.transitions[0].target;
                const matchSet = new IntervalSet();
                for (let j = interval.start; j <= interval.stop; j++) {
                    const matchTransition = decision.transitions[j].target.transitions[0];
                    if (matchTransition instanceof NotSetTransition) {
                        throw new Error("Not yet implemented.");
                    }

                    const set = matchTransition.label!;
                    for (const setInterval of set) {
                        const a = setInterval.start;
                        const b = setInterval.stop;
                        if (a !== -1 && b !== -1) {
                            for (let v = a; v <= b; v++) {
                                if (matchSet.contains(v)) {
                                    // TODO: Token is missing (i.e. position in source is not displayed).
                                    g.tool.errorManager.grammarError(ErrorType.CHARACTERS_COLLISION_IN_SET,
                                        g.fileName, null, CharSupport.getANTLRCharLiteralForChar(v),
                                        CharSupport.getIntervalSetEscapedString(matchSet));
                                    break;
                                }
                            }
                        }
                    }
                    matchSet.addSet(set);
                }

                let newTransition: Transition;
                const intervals = Array.from(matchSet);
                if (intervals.length === 1) {
                    const matchInterval = intervals[0];
                    newTransition = CodePointTransitions.createWithCodePointRange(blockEndState, matchInterval.start,
                        matchInterval.stop);
                } else {
                    newTransition = new SetTransition(blockEndState, matchSet);
                }

                decision.transitions[interval.start].target.setTransition(0, newTransition);
                for (let j = interval.start + 1; j <= interval.stop; j++) {
                    const removed = decision.removeTransition(interval.start + 1);
                    atn.removeState(removed.target);
                }
            }
        }
    }

    private static optimizeStates(atn: ATN): void {
        const compressed = new Array<ATNState>();
        let i = 0; // new state number
        for (const s of atn.states) {
            if (s !== null) {
                compressed.push(s);
                s.stateNumber = i; // reset state number as we shift to new position
                i++;
            }
        }
        atn.states.splice(0, atn.states.length, ...compressed); // clear and add all
    }

}
