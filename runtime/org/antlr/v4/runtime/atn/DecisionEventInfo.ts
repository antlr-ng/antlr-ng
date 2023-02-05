/* java2ts: keep */

/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { JavaObject } from "jree";

import { ATNConfigSet } from "./ATNConfigSet";
import { TokenStream } from "../TokenStream";

/**
 * This is the base class for gathering detailed information about prediction
 * events which occur during parsing.
 *
 * Note that we could record the parser call stack at the time this event
 * occurred but in the presence of left recursive rules, the stack is kind of
 * meaningless. It's better to look at the individual configurations for their
 * individual stacks. Of course that is a {@link PredictionContext} object
 * not a parse tree node and so it does not have information about the extent
 * (start...stop) of the various subtrees. Examining the stack tops of all
 * configurations provide the return states for the rule invocations.
 * From there you can get the enclosing rule.
 *
 *
 */
export class DecisionEventInfo extends JavaObject {
    /**
     * The invoked decision number which this event is related to.
     *
     * @see ATN#decisionToState
     */
    public readonly decision: number;

    /**
     * The configuration set containing additional information relevant to the
     * prediction state when the current event occurred, or {@code null} if no
     * additional information is relevant or available.
     */
    public readonly configs: ATNConfigSet | null;

    /**
     * The input token stream which is being parsed.
     */
    public readonly input: TokenStream | null;

    /**
     * The token index in the input stream at which the current prediction was
     * originally invoked.
     */
    public readonly startIndex: number;

    /**
     * The token index in the input stream at which the current event occurred.
     */
    public readonly stopIndex: number;

    /**
     * {@code true} if the current event occurred during LL prediction;
     * otherwise, {@code false} if the input occurred during SLL prediction.
     */
    public readonly fullCtx: boolean;

    public constructor(decision: number,
        configs: ATNConfigSet | null,
        input: TokenStream | null, startIndex: number, stopIndex: number,
        fullCtx: boolean) {
        super();
        this.decision = decision;
        this.fullCtx = fullCtx;
        this.stopIndex = stopIndex;
        this.input = input;
        this.startIndex = startIndex;
        this.configs = configs;
    }
}
