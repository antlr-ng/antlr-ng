/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException, type IntStream } from "antlr4ng";

/**  The recognizer did not match anything for a (..)+ loop. */
export class EarlyExitException extends RecognitionException {
    public decisionNumber: number;

    public constructor(decisionNumber: number, input?: IntStream) {
        super({ message: `@[${decisionNumber}]`, recognizer: null, input: null, ctx: null });
        this.decisionNumber = decisionNumber;
    }
}
