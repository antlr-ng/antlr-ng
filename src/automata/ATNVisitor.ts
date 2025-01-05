/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ATNState } from "antlr4ng";

/**
 * A simple visitor that walks everywhere it can go starting from s,
 *  without going into an infinite cycle. Override and implement
 *  visitState() to provide functionality.
 */
export class ATNVisitor {
    public visit(s: ATNState): void {
        this.doVisit(s, new Set<number>());
    }

    public visitState(s: ATNState): void {
        // intentionally empty
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
