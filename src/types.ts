/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ParserATNFactory } from "./automata/ParserATNFactory.js";
import type { CodeBlockForOuterMostAlt } from "./codegen/model/CodeBlockForOuterMostAlt.js";
import type { Tool } from "./Tool.js";
import type { Alternative } from "./tool/Alternative.js";
import type { GrammarAST } from "./tool/ast/GrammarAST.js";
import type { GrammarRootAST } from "./tool/ast/GrammarRootAST.js";
import type { Grammar } from "./tool/Grammar.js";
import type { GrammarParserInterpreter } from "./tool/GrammarParserInterpreter.js";
import type { LexerGrammar } from "./tool/LexerGrammar.js";
import type { Rule } from "./tool/Rule.js";

// The interfaces declared here are used to avoid circular dependencies between the classes in the tool package.
// They are not meant to be used in the actual code.

/** @internal */
export interface IAlternative extends Alternative { }

/** @internal */
export interface IGrammar extends Grammar { }

/** @internal */
export interface IGrammarAST extends GrammarAST { }

/** @internal */
export interface IGrammarRootAST extends GrammarRootAST { }

/** @internal */
export interface ILexerGrammar extends LexerGrammar { }

/** @internal */
export interface ITool extends Tool { }

/** @internal */
export interface IRule extends Rule { }

/** @internal */
export interface IParserATNFactory extends ParserATNFactory { }

/** @internal */
export interface IGrammarParserInterpreter extends GrammarParserInterpreter { }

/** @internal */
export interface ICodeBlockForOuterMostAlt extends CodeBlockForOuterMostAlt { }
