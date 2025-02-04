/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import {
    BaseErrorListener, type ATNSimulator, type RecognitionException, type Recognizer, type Token
} from "antlr4ng";

import type { Tool } from "../Tool.js";
import { ErrorType } from "../tool/ErrorType.js";

export class ToolParseErrorListener extends BaseErrorListener {
    public constructor(private tool: Tool) {
        super();
    }

    public override syntaxError<S extends Token, T extends ATNSimulator>(recognizer: Recognizer<T>,
        offendingSymbol: S | null, line: number, charPositionInLine: number, msg: string,
        e: RecognitionException | null): void {
        const sourceName = recognizer.inputStream?.getSourceName() ?? "<unknown>";
        this.tool.errorManager.syntaxError(ErrorType.SYNTAX_ERROR, sourceName, line, charPositionInLine, e, msg);
    }
}
