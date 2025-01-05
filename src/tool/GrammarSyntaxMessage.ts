/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { RecognitionException } from "antlr4ng";

import { ANTLRMessage } from "./ANTLRMessage.js";
import { ErrorType } from "./ErrorType.js";

/**
 * A problem with the syntax of your antlr grammar such as
 *  "The '{' came as a complete surprise to me at this point in your program"
 */
export class GrammarSyntaxMessage extends ANTLRMessage {
    public constructor(type: ErrorType,
        fileName: string,
        line: number, column: number,
        antlrException: RecognitionException | null, ...args: unknown[]) {
        super(type, fileName, antlrException, line, column, ...args);
    }
}
