/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import {
    ATN, ATNState, BlockEndState, EpsilonTransition, PlusLoopbackState, RuleTransition, StarLoopbackState
} from "antlr4ng";

export class TailEpsilonRemover {
    public constructor(private atn: ATN) { }

    public visit(s: ATNState): void {
        this.doVisit(s, new Set<number>());
    }

    private visitState(p: ATNState): void {
        if ((p.constructor as typeof ATNState).stateType === ATNState.BASIC && p.transitions.length === 1) {
            const transition = p.transitions[0];
            let q = transition.target;
            if (transition instanceof RuleTransition) {
                q = transition.followState;
            }

            if ((q.constructor as typeof ATNState).stateType === ATNState.BASIC) {
                // We have p-x->q for x in {rule, action, pred, token, ...}. If edge out of q is single epsilon
                // to block end we can strip epsilon p-x->q-eps->r.
                const trans = q.transitions[0];
                if (q.transitions.length === 1 && trans instanceof EpsilonTransition) {
                    const r = trans.target;
                    if (r instanceof BlockEndState || r instanceof PlusLoopbackState
                        || r instanceof StarLoopbackState) {
                        // Skip over q.
                        const t = p.transitions[0];
                        if (t instanceof RuleTransition) {
                            t.followState = r;
                        } else {
                            t.target = r;
                        }

                        this.atn.removeState(q);
                    }
                }
            }
        }
    }

    private doVisit(s: ATNState, visited: Set<number>): void {
        if (visited.has(s.stateNumber)) {
            return;
        }

        visited.add(s.stateNumber);

        this.visitState(s);
        for (const t of s.transitions) {
            this.doVisit(t.target, visited);
        }
    }
}
