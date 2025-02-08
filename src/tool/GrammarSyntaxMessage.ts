/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { RecognitionException } from "antlr4ng";

import { ANTLRMessage } from "./ANTLRMessage.js";
import { IssueCode } from "./Issues.js";

/** A problem with the syntax of your antlr grammar. */
export class GrammarSyntaxMessage extends ANTLRMessage {
    public constructor(type: IssueCode, fileName: string, line: number, column: number,
        antlrException: RecognitionException | null, ...args: unknown[]) {
        super(type, fileName, antlrException, line, column, ...args);
    }
}
