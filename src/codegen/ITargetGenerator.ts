/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Action } from "./model/Action.js";
import type { AddToLabelList } from "./model/AddToLabelList.js";
import type { AltBlock } from "./model/AltBlock.js";
import type { CaptureNextToken } from "./model/CaptureNextToken.js";
import type { CaptureNextTokenType } from "./model/CaptureNextTokenType.js";
import type { ActionTemplate } from "./model/chunk/ActionTemplate.js";
import type { ActionText } from "./model/chunk/ActionText.js";
import type { ArgRef } from "./model/chunk/ArgRef.js";
import type { LabelRef } from "./model/chunk/LabelRef.js";
import type { ListLabelRef } from "./model/chunk/ListLabelRef.js";
import type { LocalRef } from "./model/chunk/LocalRef.js";
import type { NonLocalAttrRef } from "./model/chunk/NonLocalAttrRef.js";
import type { QRetValueRef } from "./model/chunk/QRetValueRef.js";
import type { RetValueRef } from "./model/chunk/RetValueRef.js";
import type { RulePropertyRefCtx } from "./model/chunk/RulePropertyRefCtx.js";
import type { RulePropertyRefParser } from "./model/chunk/RulePropertyRefParser.js";
import type { RulePropertyRefStart } from "./model/chunk/RulePropertyRefStart.js";
import type { RulePropertyRefStop } from "./model/chunk/RulePropertyRefStop.js";
import type { RulePropertyRefText } from "./model/chunk/RulePropertyRefText.js";
import type { SetAttr } from "./model/chunk/SetAttr.js";
import type { SetNonLocalAttr } from "./model/chunk/SetNonLocalAttr.js";
import type { ThisRulePropertyRefCtx } from "./model/chunk/ThisRulePropertyRefCtx.js";
import type { ThisRulePropertyRefParser } from "./model/chunk/ThisRulePropertyRefParser.js";
import type { ThisRulePropertyRefStart } from "./model/chunk/ThisRulePropertyRefStart.js";
import type { ThisRulePropertyRefStop } from "./model/chunk/ThisRulePropertyRefStop.js";
import type { ThisRulePropertyRefText } from "./model/chunk/ThisRulePropertyRefText.js";
import type { TokenPropertyRefIndex } from "./model/chunk/TokenPropertyRefIndex.js";
import type { TokenPropertyRefInt } from "./model/chunk/TokenPropertyRefInt.js";
import type { TokenPropertyRefLine } from "./model/chunk/TokenPropertyRefLine.js";
import type { TokenPropertyRefPos } from "./model/chunk/TokenPropertyRefPos.js";
import type { TokenPropertyRefText } from "./model/chunk/TokenPropertyRefText.js";
import type { TokenPropertyRefType } from "./model/chunk/TokenPropertyRefType.js";
import type { TokenRef } from "./model/chunk/TokenRef.js";
import type { CodeBlockForAlt } from "./model/CodeBlockForAlt.js";
import type { CodeBlockForOuterMostAlt } from "./model/CodeBlockForOuterMostAlt.js";
import type { AltLabelStructDecl } from "./model/decl/AltLabelStructDecl.js";
import type { AttributeDecl } from "./model/decl/AttributeDecl.js";
import type { ContextRuleGetterDecl } from "./model/decl/ContextRuleGetterDecl.js";
import type { ContextRuleListGetterDecl } from "./model/decl/ContextRuleListGetterDecl.js";
import type { ContextRuleListIndexedGetterDecl } from "./model/decl/ContextRuleListIndexedGetterDecl.js";
import type { ContextTokenGetterDecl } from "./model/decl/ContextTokenGetterDecl.js";
import type { ContextTokenListGetterDecl } from "./model/decl/ContextTokenListGetterDecl.js";
import type { ContextTokenListIndexedGetterDecl } from "./model/decl/ContextTokenListIndexedGetterDecl.js";
import type { RuleContextDecl } from "./model/decl/RuleContextDecl.js";
import type { RuleContextListDecl } from "./model/decl/RuleContextListDecl.js";
import type { StructDecl } from "./model/decl/StructDecl.js";
import type { TokenDecl } from "./model/decl/TokenDecl.js";
import type { TokenListDecl } from "./model/decl/TokenListDecl.js";
import type { TokenTypeDecl } from "./model/decl/TokenTypeDecl.js";
import type { ExceptionClause } from "./model/ExceptionClause.js";
import type { InvokeRule } from "./model/InvokeRule.js";
import type { LeftRecursiveRuleFunction } from "./model/LeftRecursiveRuleFunction.js";
import type { Lexer } from "./model/Lexer.js";
import type { LexerFile } from "./model/LexerFile.js";
import type { ListenerDispatchMethod } from "./model/ListenerDispatchMethod.js";
import type { ListenerFile } from "./model/ListenerFile.js";
import type { LL1AltBlock } from "./model/LL1AltBlock.js";
import type { LL1OptionalBlock } from "./model/LL1OptionalBlock.js";
import type { LL1OptionalBlockSingleAlt } from "./model/LL1OptionalBlockSingleAlt.js";
import type { LL1PlusBlockSingleAlt } from "./model/LL1PlusBlockSingleAlt.js";
import type { LL1StarBlockSingleAlt } from "./model/LL1StarBlockSingleAlt.js";
import type { MatchNotSet } from "./model/MatchNotSet.js";
import type { MatchSet } from "./model/MatchSet.js";
import type { MatchToken } from "./model/MatchToken.js";
import type { OptionalBlock } from "./model/OptionalBlock.js";
import type { Parser } from "./model/Parser.js";
import type { ParserFile } from "./model/ParserFile.js";
import type { PlusBlock } from "./model/PlusBlock.js";
import type { RuleActionFunction } from "./model/RuleActionFunction.js";
import type { RuleFunction } from "./model/RuleFunction.js";
import type { RuleSempredFunction } from "./model/RuleSempredFunction.js";
import type { SemPred } from "./model/SemPred.js";
import type { SerializedATN } from "./model/SerializedATN.js";
import type { StarBlock } from "./model/StarBlock.js";
import type { TestSetInline } from "./model/TestSetInline.js";
import type { ThrowNoViableAlt } from "./model/ThrowNoViableAlt.js";
import type { VisitorDispatchMethod } from "./model/VisitorDispatchMethod.js";
import type { VisitorFile } from "./model/VisitorFile.js";
import type { Wildcard } from "./model/Wildcard.js";

/** Variables set during a generation run to pass values around that can be used in the individual methods. */
export interface IGenerationVariables {
    [key: string]: string | boolean | number | undefined;
    declaration: boolean;
}

/**
 * This interface contains all callable members of the target generator, which generate code.
 * They all take an output model object (aka OMO) as first argument. The generator will use the information in
 * the model object to generate the target code.
 */
export interface ITargetGeneratorCallables {
    /**
     * Renders a `ParserFile` output model.
     *
     * @param file The model object for details.
     * @param variables Values passed down to sub generation methods.
     * @param parser The rendered code for a `Parser` output model.
     * @param namedActions A map of action names and their rendered code.
     * @param contextSuperClass The rendered code for the context super class.
     */
    renderParserFile(file: ParserFile, variables: IGenerationVariables, parser: string,
        namedActions: Record<string, string>, contextSuperClass: string): string;

    /**
     * Renders a `ListenerFile` output model.
     *
     * @param file The model object for details.
     * @param variables Values passed down to sub generation methods.
     * @param header The rendered code for the header.
     * @param namedActions A map of action names and their rendered code.
     */
    renderListenerFile(file: ListenerFile, variables: IGenerationVariables, header: string,
        namedActions: Record<string, string>): string;

    renderVisitorFile(file: VisitorFile, variables: IGenerationVariables, namedActions: string): string;

    renderParser(parser: Parser, variables: IGenerationVariables, funcs: string, atn: string, sempredFuncs: string,
        superClass: string): string;

    renderRuleActionFunction(r: RuleActionFunction, variables: IGenerationVariables, actions: string): string;

    renderRuleSempredFunction(r: RuleSempredFunction, variables: IGenerationVariables, actions: string): string;

    renderRuleFunction(currentRule: RuleFunction, variables: IGenerationVariables, args: string, code: string,
        locals: string, ruleCtx: string, altLabelCtxs: string, namedActions: string, finallyAction: string,
        postamble: string, exceptions: string): string;

    renderLeftRecursiveRuleFunction(currentRule: LeftRecursiveRuleFunction, variables: IGenerationVariables,
        args: string, code: string, locals: string, ruleCtx: string, altLabelCtxs: string, namedActions: string,
        finallyAction: string, postamble: string): string;

    renderCodeBlockForOuterMostAlt(currentOuterMostAltCodeBlock: CodeBlockForOuterMostAlt,
        variables: IGenerationVariables, locals: string, preamble: string, ops: string): string;

    renderCodeBlockForAlt(currentAltCodeBlock: CodeBlockForAlt, variables: IGenerationVariables, locals: string,
        preamble: string, ops: string): string;

    renderLL1AltBlock(choice: LL1AltBlock, variables: IGenerationVariables, preamble: string, alts: string,
        error: string): string;

    renderLL1OptionalBlock(choice: LL1OptionalBlock, variables: IGenerationVariables, alts: string,
        error: string): string;

    renderLL1OptionalBlockSingleAlt(choice: LL1OptionalBlockSingleAlt, variables: IGenerationVariables, expr: string,
        alts: string, preamble: string,
        error: string, followExpr: string): string;

    renderLL1StarBlockSingleAlt(choice: LL1StarBlockSingleAlt, variables: IGenerationVariables, loopExpr: string,
        alts: string, preamble: string,
        iteration: string): string;

    renderLL1PlusBlockSingleAlt(choice: LL1PlusBlockSingleAlt, variables: IGenerationVariables, loopExpr: string,
        alts: string, preamble: string,
        iteration: string): string;

    renderAltBlock(choice: AltBlock, variables: IGenerationVariables, preamble: string, alts: string,
        error: string): string;

    renderOptionalBlock(choice: OptionalBlock, variables: IGenerationVariables, alts: string, error: string): string;

    renderStarBlock(choice: StarBlock, variables: IGenerationVariables, alts: string, sync: string,
        iteration: string): string;

    renderPlusBlock(choice: PlusBlock, variables: IGenerationVariables, alts: string, error: string): string;

    renderThrowNoViableAlt(t: ThrowNoViableAlt, variables: IGenerationVariables): string;

    renderTestSetInline(s: TestSetInline, variables: IGenerationVariables): string;

    renderInvokeRule(r: InvokeRule, variables: IGenerationVariables, argExprsChunks: string): string;

    renderMatchToken(m: MatchToken, variables: IGenerationVariables): string;

    renderMatchSet(m: MatchSet, variables: IGenerationVariables, expr: string, capture: string): string;

    renderMatchNotSet(m: MatchNotSet, variables: IGenerationVariables, expr: string, capture: string): string;

    renderWildcard(w: Wildcard, variables: IGenerationVariables): string;

    renderAction(a: Action, variables: IGenerationVariables, foo: string, chunks: string): string;

    renderArgAction(a: Action, variables: IGenerationVariables, chunks: string): string;

    renderSemPred(p: SemPred, variables: IGenerationVariables, chunks: string, failChunks: string): string;

    renderExceptionClause(e: ExceptionClause, variables: IGenerationVariables, catchArg: string,
        catchAction: string): string;

    renderLexerSkipCommand(): string;

    renderLexerMoreCommand(): string;

    renderLexerPopModeCommand(): string;

    renderActionText(t: ActionText, variables: IGenerationVariables): string;

    renderActionTemplate(t: ActionTemplate, variables: IGenerationVariables): string;

    renderArgRef(a: ArgRef, variables: IGenerationVariables): string;

    renderLocalRef(a: LocalRef, variables: IGenerationVariables): string;

    renderRetValueRef(a: RetValueRef, variables: IGenerationVariables): string;

    renderQRetValueRef(a: QRetValueRef, variables: IGenerationVariables): string;

    renderTokenRef(t: TokenRef, variables: IGenerationVariables): string;

    renderLabelRef(t: LabelRef, variables: IGenerationVariables): string;

    renderListLabelRef(t: ListLabelRef, variables: IGenerationVariables): string;

    renderSetAttr(s: SetAttr, variables: IGenerationVariables, rhsChunks: string): string;

    renderTokenLabelType(): string;

    renderInputSymbolType(): string;

    renderTokenPropertyRefText(t: TokenPropertyRefText, variables: IGenerationVariables): string;

    renderTokenPropertyRefType(t: TokenPropertyRefType, variables: IGenerationVariables): string;

    renderTokenPropertyRefLine(t: TokenPropertyRefLine, variables: IGenerationVariables): string;

    renderTokenPropertyRefPos(t: TokenPropertyRefPos, variables: IGenerationVariables): string;

    renderTokenPropertyRefChannel(t: TokenPropertyRefPos, variables: IGenerationVariables): string;

    renderTokenPropertyRefIndex(t: TokenPropertyRefIndex, variables: IGenerationVariables): string;

    renderTokenPropertyRefInt(t: TokenPropertyRefInt, variables: IGenerationVariables): string;

    renderRulePropertyRefStart(r: RulePropertyRefStart, variables: IGenerationVariables): string;

    renderRulePropertyRefStop(r: RulePropertyRefStop, variables: IGenerationVariables): string;

    renderRulePropertyRefText(r: RulePropertyRefText, variables: IGenerationVariables): string;

    renderRulePropertyRefCtx(r: RulePropertyRefCtx, variables: IGenerationVariables): string;

    renderRulePropertyRefParser(r: RulePropertyRefParser, variables: IGenerationVariables): string;

    renderThisRulePropertyRefStart(r: ThisRulePropertyRefStart, variables: IGenerationVariables): string;

    renderThisRulePropertyRefStop(r: ThisRulePropertyRefStop, variables: IGenerationVariables): string;

    renderThisRulePropertyRefText(r: ThisRulePropertyRefText, variables: IGenerationVariables): string;

    renderThisRulePropertyRefCtx(r: ThisRulePropertyRefCtx, variables: IGenerationVariables): string;

    renderThisRulePropertyRefParser(r: ThisRulePropertyRefParser, variables: IGenerationVariables): string;

    renderNonLocalAttrRef(s: NonLocalAttrRef, variables: IGenerationVariables): string;

    renderSetNonLocalAttr(s: SetNonLocalAttr, variables: IGenerationVariables, rhsChunks: string): string;

    renderAddToLabelList(a: AddToLabelList, variables: IGenerationVariables): string;

    renderTokenDecl(t: TokenDecl, variables: IGenerationVariables): string;

    renderTokenTypeDecl(t: TokenTypeDecl, variables: IGenerationVariables): string;

    renderTokenListDecl(t: TokenListDecl, variables: IGenerationVariables): string;

    renderRuleContextDecl(r: RuleContextDecl, variables: IGenerationVariables): string;

    renderRuleContextListDecl(rdecl: RuleContextListDecl, variables: IGenerationVariables): string;

    renderContextTokenGetterDecl(t: ContextTokenGetterDecl, variables: IGenerationVariables): string;

    renderContextTokenListGetterDecl(t: ContextTokenListGetterDecl, variables: IGenerationVariables): string;

    renderContextTokenListIndexedGetterDecl(t: ContextTokenListIndexedGetterDecl,
        variables: IGenerationVariables): string;

    renderContextRuleGetterDecl(r: ContextRuleGetterDecl, variables: IGenerationVariables): string;

    renderContextRuleListGetterDecl(r: ContextRuleListGetterDecl, variables: IGenerationVariables): string;

    renderContextRuleListIndexedGetterDecl(r: ContextRuleListIndexedGetterDecl,
        variables: IGenerationVariables): string;

    renderLexerRuleContext(): string;

    renderRuleContextNameSuffix(): string;

    renderCaptureNextToken(d: CaptureNextToken, variables: IGenerationVariables): string;

    renderCaptureNextTokenType(d: CaptureNextTokenType, variables: IGenerationVariables): string;

    renderStructDecl(struct: StructDecl, variables: IGenerationVariables, ctorAttrs: string, attrs: string,
        getters: string, dispatchMethods: string, interfaces: string, extensionMembers: string,
        signatures: string): string;

    renderAltLabelStructDecl(struct: AltLabelStructDecl, variables: IGenerationVariables, attrs: string,
        getters: string, dispatchMethods: string): string;

    renderListenerDispatchMethod(method: ListenerDispatchMethod, variables: IGenerationVariables): string;

    renderVisitorDispatchMethod(method: VisitorDispatchMethod, variables: IGenerationVariables): string;

    renderAttributeDecl(d: AttributeDecl, variables: IGenerationVariables): string;

    renderLexerFile(lexerFile: LexerFile, variables: IGenerationVariables, lexer: string, namedActions: string): string;

    renderLexer(lexer: Lexer, variables: IGenerationVariables, atn: string, actionFuncs: string, sempredFuncs: string,
        superClass: string): string;

    /**
     * Renders a `SerializedATN` output model.
     *
     * @param model The model object for details.
     * @param variables Values passed down to sub generation methods.
     *
     * @returns The rendered code.
     */
    renderSerializedATN(model: SerializedATN, variables: IGenerationVariables): string;
}

/** Defines the structure for a target generator. */
export interface ITargetGenerator extends ITargetGeneratorCallables {
    /** A unique identifier for the generator. */
    id: string;

    /** The human readably language name for the generator. */
    language: string;

    /** A list of specifiers that can be used to identify this language (not case sensitive). */
    languageSpecifiers: string[];

    /** Does this target need a declaration file (e.g. a C/C++ header file or type definitions for JavaScript)? */
    needsDeclarationFile?: boolean;

    /** The extension to be used for generate files which contain code (including the dot). */
    codeFileExtension: string;

    /** The extension to be used for generated files which contain type definitions (including the dot). */
    declarationFileExtension?: string;

    /** Reserved words of this language. */
    reservedWords: Set<string>;

    /** Allows to alter a grammar text before it is processed by antlr-ng. */
    inputFilter?: (grammar: string) => string;

    /**
     * Allows to alter the output of antlr-ng before it is processed by the generator
     * (e.g. to remove unwanted parts). This is called once per generated file, right before it is written to
     * the file system.
     */
    outputFilter?: (code: string) => string;
}
