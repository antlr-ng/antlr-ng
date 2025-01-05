/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns */

import { InterpreterRuleContext, ParserRuleContext } from "antlr4ng";

/**
 * An {@link InterpreterRuleContext} that knows which alternative for a rule was matched.
 *
 *  @see GrammarParserInterpreter
 */
export class GrammarInterpreterRuleContext extends InterpreterRuleContext {
    #outerAltNum = 1;

    public constructor(parent: ParserRuleContext, invokingStateNumber: number, ruleIndex: number) {
        super(ruleIndex, parent, invokingStateNumber);
    }

    /**
     * The predicted outermost alternative for the rule associated
     *  with this context object.  If this node left recursive, the true original
     *  outermost alternative is returned.
     */
    public get outerAltNum(): number {
        return this.#outerAltNum;
    }

    public set outerAltNum(outerAltNum: number) {
        this.#outerAltNum = outerAltNum;
    }

    public override getAltNumber(): number {
        // override here and called old functionality; makes it backward compatible vs changing names
        return this.#outerAltNum;
    }

    public override setAltNumber(altNumber: number): void {
        this.outerAltNum = altNumber;
    }
}
