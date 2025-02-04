/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { CharStream } from "antlr4ng";

import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";

import type { Tool } from "../Tool.js";
import { ToolParseErrorListener } from "./ToolParseErrorListener.js";

export class ToolANTLRLexer extends ANTLRv4Lexer {
    public constructor(input: CharStream, private tool: Tool) {
        super(input);

        this.removeErrorListeners();
        this.addErrorListener(new ToolParseErrorListener(tool));
    }
}
