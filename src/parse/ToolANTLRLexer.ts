/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { CharStream, RecognitionException, Token } from "antlr4ng";

import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";

import type { Tool } from "../Tool.js";
import { ErrorType } from "../tool/ErrorType.js";
import { ToolParseErrorListener } from "./ToolParseErrorListener.js";

export class ToolANTLRLexer extends ANTLRv4Lexer {
    public constructor(input: CharStream, private tool: Tool) {
        super(input);
        this.removeErrorListeners();
        this.addErrorListener(new ToolParseErrorListener(tool));
    }

    // TODO: this and the next method aren't used anymore. Remove them?
    public displayRecognitionError(tokenNames: string[], e: RecognitionException): void {
        const msg = e.message;
        const line = e.offendingToken!.line;
        const column = e.offendingToken!.column;
        this.tool.errorManager.syntaxError(ErrorType.SYNTAX_ERROR, this.sourceName, line, column, e, msg);
    }

    public grammarError(errorType: ErrorType, token: Token, ...args: unknown[]): void {
        this.tool.errorManager.grammarError(errorType, this.sourceName, token, args);
    }
}
