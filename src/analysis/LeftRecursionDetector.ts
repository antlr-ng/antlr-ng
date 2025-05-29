/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

import { ATN, ATNState, HashSet, RuleStartState, RuleStopState, RuleTransition, type Token } from "antlr4ng";

import type { Grammar } from "../tool/Grammar.js";
import { IssueCode } from "../tool/Issues.js";
import type { Rule } from "../tool/Rule.js";

export class LeftRecursionDetector {
    /** Holds a list of cycles (sets of rule names). */
    public listOfRecursiveCycles: Rule[][] = [];

    /** Which rule start states have we visited while looking for a single left-recursion check? */
    private rulesVisitedPerRuleCheck = new HashSet<RuleStartState>();

    private g: Grammar;
    private atn: ATN;

    public constructor(g: Grammar, atn: ATN) {
        this.g = g;
        this.atn = atn;
    }

    public check(): void;
    /**
     * From state s, look for any transition to a rule that is currently
     *  being traced.  When tracing r, visitedPerRuleCheck has r
     *  initially.  If you reach a rule stop state, return but notify the
     *  invoking rule that the called rule is nullable. This implies that
     *  invoking rule must look at follow transition for that invoking state.
     *
     *  The visitedStates tracks visited states within a single rule so
     *  we can avoid epsilon-loop-induced infinite recursion here.  Keep
     *  filling the cycles in listOfRecursiveCycles and also, as a
     *  side-effect, set leftRecursiveRules.
     */
    public check(enclosingRule: Rule, s: ATNState, visitedStates: Set<ATNState>): boolean;
    public check(...args: unknown[]): undefined | boolean {
        if (args.length === 0) {
            for (const start of this.atn.ruleToStartState) {
                this.rulesVisitedPerRuleCheck.clear();
                this.rulesVisitedPerRuleCheck.add(start!);

                this.check(this.g.getRule(start!.ruleIndex)!, start!, new Set<ATNState>());
            }

            if (this.listOfRecursiveCycles.length > 0) {
                const token = LeftRecursionDetector.getStartTokenOfFirstRule(this.listOfRecursiveCycles);
                const line = token?.line ?? -1;
                const column = token?.column ?? -1;

                this.g.tool.errorManager.syntaxError(IssueCode.LeftRecursionCycles, this.g.fileName, line, column,
                    undefined, this.listOfRecursiveCycles);
            }

            return;
        }

        const [enclosingRule, s, visitedStates] = args as [Rule, ATNState, Set<ATNState>];

        if (s instanceof RuleStopState) {
            return true;
        }

        if (visitedStates.has(s)) {
            return false;
        }

        visitedStates.add(s);

        const n = s.transitions.length;
        let stateReachesStopState = false;
        for (let i = 0; i < n; i++) {
            const t = s.transitions[i];
            if (t instanceof RuleTransition) {
                const rt = t;
                const r = this.g.getRule(rt.ruleIndex)!;
                if (this.rulesVisitedPerRuleCheck.contains(t.target as RuleStartState)) {
                    this.addRulesToCycle(enclosingRule, r);
                } else {
                    // Must visit if not already visited; mark target, pop when done.
                    this.rulesVisitedPerRuleCheck.add(t.target as RuleStartState);

                    // Send new visitedStates set per rule invocation.
                    const nullable = this.check(r, t.target, new Set<ATNState>());

                    // We're back from visiting that rule.
                    this.rulesVisitedPerRuleCheck.remove(t.target as RuleStartState);
                    if (nullable) {
                        stateReachesStopState ||= this.check(enclosingRule, rt.followState, visitedStates);
                    }
                }
            } else {
                if (t.isEpsilon) {
                    stateReachesStopState ||= this.check(enclosingRule, t.target, visitedStates);
                }
            }

            // else ignore non-epsilon transitions.
        }

        return stateReachesStopState;
    }

    /**
     * enclosingRule calls targetRule. Find the cycle containing the target and add the caller. Find the cycle
     * containing the caller and add the target.  If no cycles contain either, then create a new cycle.
     */
    protected addRulesToCycle(enclosingRule: Rule, targetRule: Rule): void {
        let foundCycle = false;
        for (const rulesInCycle of this.listOfRecursiveCycles) {
            // Ensure both rules are in same cycle.
            if (rulesInCycle.includes(targetRule)) {
                rulesInCycle.push(enclosingRule);
                foundCycle = true;
            }

            if (rulesInCycle.includes(enclosingRule)) {
                rulesInCycle.push(targetRule);
                foundCycle = true;
            }
        }

        if (!foundCycle) {
            const cycle = new Array<Rule>();
            cycle.push(targetRule);
            cycle.push(enclosingRule);
            this.listOfRecursiveCycles.push(cycle);
        }
    }

    private static getStartTokenOfFirstRule(cycles: Rule[][]): Token | undefined {
        for (const collection of cycles) {
            for (const rule of collection) {
                return rule.ast.token;
            }
        }

        return undefined;
    }
}
