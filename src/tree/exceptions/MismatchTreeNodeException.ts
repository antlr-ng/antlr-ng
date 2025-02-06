/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

export class MismatchedTreeNodeException extends RecognitionException {
    public expecting: number;

    public constructor(expecting: number) {
        super({
            message: "MismatchedTreeNodeException(" + expecting + ")",
            recognizer: null,
            input: null,
            ctx: null
        });
        this.expecting = expecting;
    }
}
