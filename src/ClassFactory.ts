/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ATN, TokenStream } from "antlr4ng";

import type { GrammarRootAST } from "./tool/ast/GrammarRootAST.js";
import type {
    IGrammar, IGrammarParserInterpreter, IGrammarRootAST, ILexerGrammar, IParserATNFactory, ITool
} from "./types.js";

/** A collection of factory methods for certain class instances in the tool, to break circular dependencies. */
export class ClassFactory {
    public static createGrammar: (tool: ITool, tree: GrammarRootAST) => IGrammar;
    public static createLexerGrammar: (tool: ITool, tree: GrammarRootAST) => ILexerGrammar;
    public static createGrammarRootAST: () => IGrammarRootAST;
    public static createParserATNFactory: (g: IGrammar) => IParserATNFactory;
    public static createGrammarParserInterpreter: (g: IGrammar, atn: ATN,
        input: TokenStream) => IGrammarParserInterpreter;
    public static createTool: () => ITool;
}
