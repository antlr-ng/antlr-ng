/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { InterpreterRuleContext } from "antlr4ng";

/**
 * An {@link InterpreterRuleContext} that knows which alternative for a rule was matched.
 */
export class GrammarInterpreterRuleContext extends InterpreterRuleContext {
    private outerAltNum = 1;

    /**
     * The predicted outermost alternative for the rule associated with this context object. If this node left
     * recursive, the true original  outermost alternative is returned.
     *
     * @returns The outermost alternative for the rule associated with this context object.
     */
    public override getAltNumber(): number {
        return this.outerAltNum;
    }

    public override setAltNumber(altNumber: number): void {
        this.outerAltNum = altNumber;
    }
}
