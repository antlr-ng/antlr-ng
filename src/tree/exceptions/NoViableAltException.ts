/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

export class NoViableAltException extends RecognitionException {
    public decisionNumber: number;
    public stateNumber: number;

    public constructor(decisionNumber: number, stateNumber: number) {
        super({ message: `@[<no viable alt>]`, recognizer: null, input: null, ctx: null });
        this.decisionNumber = decisionNumber;
        this.stateNumber = stateNumber;
    }
}
