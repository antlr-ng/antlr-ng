/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

export class MismatchedSetException extends RecognitionException {
    public constructor() {
        super({ message: "", recognizer: null, input: null, ctx: null });
    }
}
