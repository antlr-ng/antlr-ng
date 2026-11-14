/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

export { type IToolParameters, useFileSystem } from "./tool-parameters.js";

export * from "./Tool.js";
export * from "./tool/Issue.js";
export * from "./tool/ast/GrammarAST.js";
export * from "./tool/ast/GrammarRootAST.js";
export * from "./tool/ErrorManager.js";
export * from "./tool/Grammar.js";
export * from "./tool/Issues.js";
export * from "./tool/LexerGrammar.js";
export * from "./tool/ToolListener.js";
export * from "./tree/CommonTree.js";

// The configuration and the API for target generators.
export * from "./config/config.js";
export type * from "./codegen/ITargetGenerator.js";
export * from "./codegen/GeneratorBase.js";
export * as OutputModelObjects from "./codegen/model/index.js";
export * from "./tool/Rule.js";
export * from "./tool/ast/GrammarASTWithOptions.js";
export * from "./tool/ast/OptionalBlockAST.js";
export * from "./support/Character.js";
export { antlrVersion } from "./version.js";
