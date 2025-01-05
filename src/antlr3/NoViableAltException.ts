/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException, type IntStream } from "antlr4ng";

export class NoViableAltException extends RecognitionException {
    public grammarDecisionDescription: string;
    public decisionNumber: number;
    public stateNumber: number;

    public constructor(grammarDecisionDescription: string, decisionNumber: number, stateNumber: number,
        input?: IntStream) {
        super({ message: `@[${grammarDecisionDescription}]`, recognizer: null, input: null, ctx: null });
        this.grammarDecisionDescription = grammarDecisionDescription;
        this.decisionNumber = decisionNumber;
        this.stateNumber = stateNumber;
    }
}
