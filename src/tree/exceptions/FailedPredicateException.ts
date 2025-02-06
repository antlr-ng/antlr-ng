/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RecognitionException } from "antlr4ng";

/**
 * A semantic predicate failed during validation.  Validation of predicates
 *  occurs when normally parsing the alternative just like matching a token.
 *  Disambiguating predicate evaluation occurs when we hoist a predicate into
 *  a prediction decision.
 */
export class FailedPredicateException extends RecognitionException {
    public ruleName: string;

    public constructor(ruleName: string) {
        super({ message: "", recognizer: null, input: null, ctx: null });
        this.ruleName = ruleName;
    }
}
