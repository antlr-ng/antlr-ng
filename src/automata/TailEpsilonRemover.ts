/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import {
    ATN, ATNState, BlockEndState, EpsilonTransition, PlusLoopbackState, RuleTransition, StarLoopbackState
} from "antlr4ng";

import { ATNVisitor } from "./ATNVisitor.js";

export class TailEpsilonRemover extends ATNVisitor {

    private readonly _atn: ATN;

    public constructor(atn: ATN) {
        super();
        this._atn = atn;
    }

    public override visitState(p: ATNState): void {
        if ((p.constructor as typeof ATNState).stateType === ATNState.BASIC && p.transitions.length === 1) {
            const transition = p.transitions[0];
            let q = transition.target;
            if (transition instanceof RuleTransition) {
                q = transition.followState;
            }

            if ((q.constructor as typeof ATNState).stateType === ATNState.BASIC) {
                // we have p-x->q for x in {rule, action, pred, token, ...}
                // if edge out of q is single epsilon to block end
                // we can strip epsilon p-x->q-eps->r
                const trans = q.transitions[0];
                if (q.transitions.length === 1 && trans instanceof EpsilonTransition) {
                    const r = trans.target;
                    if (r instanceof BlockEndState || r instanceof PlusLoopbackState
                        || r instanceof StarLoopbackState) {
                        // skip over q
                        const t = p.transitions[0];
                        if (t instanceof RuleTransition) {
                            t.followState = r;
                        } else {
                            t.target = r;
                        }
                        this._atn.removeState(q);
                    }
                }
            }
        }
    }
}
