/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException, type BitSet, type IntStream } from "antlr4ng";

export class MismatchedSetException extends RecognitionException {
    public expecting: BitSet | null;

    public constructor(expecting: BitSet | null, input?: IntStream) {
        super({ message: "", recognizer: null, input: null, ctx: null });
        this.expecting = expecting;
    }
}
