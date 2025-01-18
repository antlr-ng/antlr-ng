/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { ParserATNFactory } from "./automata/ParserATNFactory.js";
import type { CodeBlockForOuterMostAlt } from "./codegen/model/CodeBlockForOuterMostAlt.js";
import type { GrammarASTAdaptor } from "./parse/GrammarASTAdaptor.js";
import type { Tool } from "./Tool.js";
import type { Alternative } from "./tool/Alternative.js";
import type { GrammarAST } from "./tool/ast/GrammarAST.js";
import type { GrammarRootAST } from "./tool/ast/GrammarRootAST.js";
import type { Grammar } from "./tool/Grammar.js";
import type { GrammarParserInterpreter } from "./tool/GrammarParserInterpreter.js";
import type { LexerGrammar } from "./tool/LexerGrammar.js";
import type { Rule } from "./tool/Rule.js";

export interface IAlternative extends Alternative { }

export interface IGrammar extends Grammar { }

export interface IGrammarAST extends GrammarAST { }

export interface IGrammarRootAST extends GrammarRootAST { }

export interface ILexerGrammar extends LexerGrammar { }

export interface ITool extends Tool { }

export interface IGrammarASTAdaptor extends GrammarASTAdaptor { }

export interface IRule extends Rule { }

export interface IParserATNFactory extends ParserATNFactory { }

export interface IGrammarParserInterpreter extends GrammarParserInterpreter { }

export interface ICodeBlockForOuterMostAlt extends CodeBlockForOuterMostAlt { }
