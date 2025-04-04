/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GeneratorHelper } from "../codegen/GeneratorHelper.js";
import type { IGenerationVariables, ITargetGenerator } from "../codegen/ITargetGenerator.js";
import type { Action } from "../codegen/model/Action.js";
import { AddToLabelList } from "../codegen/model/AddToLabelList.js";
import { AltBlock } from "../codegen/model/AltBlock.js";
import { CaptureNextToken } from "../codegen/model/CaptureNextToken.js";
import { CaptureNextTokenType } from "../codegen/model/CaptureNextTokenType.js";
import { ActionTemplate } from "../codegen/model/chunk/ActionTemplate.js";
import { ActionText } from "../codegen/model/chunk/ActionText.js";
import { ArgRef } from "../codegen/model/chunk/ArgRef.js";
import { LabelRef } from "../codegen/model/chunk/LabelRef.js";
import { ListLabelRef } from "../codegen/model/chunk/ListLabelRef.js";
import { LocalRef } from "../codegen/model/chunk/LocalRef.js";
import { NonLocalAttrRef } from "../codegen/model/chunk/NonLocalAttrRef.js";
import { QRetValueRef } from "../codegen/model/chunk/QRetValueRef.js";
import { RetValueRef } from "../codegen/model/chunk/RetValueRef.js";
import { RulePropertyRefCtx } from "../codegen/model/chunk/RulePropertyRefCtx.js";
import { RulePropertyRefParser } from "../codegen/model/chunk/RulePropertyRefParser.js";
import { RulePropertyRefStart } from "../codegen/model/chunk/RulePropertyRefStart.js";
import { RulePropertyRefStop } from "../codegen/model/chunk/RulePropertyRefStop.js";
import { RulePropertyRefText } from "../codegen/model/chunk/RulePropertyRefText.js";
import { SetAttr } from "../codegen/model/chunk/SetAttr.js";
import { SetNonLocalAttr } from "../codegen/model/chunk/SetNonLocalAttr.js";
import { ThisRulePropertyRefCtx } from "../codegen/model/chunk/ThisRulePropertyRefCtx.js";
import { ThisRulePropertyRefParser } from "../codegen/model/chunk/ThisRulePropertyRefParser.js";
import { ThisRulePropertyRefStart } from "../codegen/model/chunk/ThisRulePropertyRefStart.js";
import { ThisRulePropertyRefStop } from "../codegen/model/chunk/ThisRulePropertyRefStop.js";
import { ThisRulePropertyRefText } from "../codegen/model/chunk/ThisRulePropertyRefText.js";
import { TokenPropertyRefIndex } from "../codegen/model/chunk/TokenPropertyRefIndex.js";
import { TokenPropertyRefInt } from "../codegen/model/chunk/TokenPropertyRefInt.js";
import { TokenPropertyRefLine } from "../codegen/model/chunk/TokenPropertyRefLine.js";
import type { TokenPropertyRefPos } from "../codegen/model/chunk/TokenPropertyRefPos.js";
import { TokenPropertyRefText } from "../codegen/model/chunk/TokenPropertyRefText.js";
import { TokenPropertyRefType } from "../codegen/model/chunk/TokenPropertyRefType.js";
import { TokenRef } from "../codegen/model/chunk/TokenRef.js";
import type { CodeBlockForAlt } from "../codegen/model/CodeBlockForAlt.js";
import type { CodeBlockForOuterMostAlt } from "../codegen/model/CodeBlockForOuterMostAlt.js";
import { AltLabelStructDecl } from "../codegen/model/decl/AltLabelStructDecl.js";
import { AttributeDecl } from "../codegen/model/decl/AttributeDecl.js";
import { ContextRuleGetterDecl } from "../codegen/model/decl/ContextRuleGetterDecl.js";
import { ContextRuleListGetterDecl } from "../codegen/model/decl/ContextRuleListGetterDecl.js";
import { ContextRuleListIndexedGetterDecl } from "../codegen/model/decl/ContextRuleListIndexedGetterDecl.js";
import { ContextTokenGetterDecl } from "../codegen/model/decl/ContextTokenGetterDecl.js";
import { ContextTokenListGetterDecl } from "../codegen/model/decl/ContextTokenListGetterDecl.js";
import { ContextTokenListIndexedGetterDecl } from "../codegen/model/decl/ContextTokenListIndexedGetterDecl.js";
import { RuleContextDecl } from "../codegen/model/decl/RuleContextDecl.js";
import { RuleContextListDecl } from "../codegen/model/decl/RuleContextListDecl.js";
import { StructDecl } from "../codegen/model/decl/StructDecl.js";
import { TokenDecl } from "../codegen/model/decl/TokenDecl.js";
import { TokenListDecl } from "../codegen/model/decl/TokenListDecl.js";
import { TokenTypeDecl } from "../codegen/model/decl/TokenTypeDecl.js";
import { ExceptionClause } from "../codegen/model/ExceptionClause.js";
import { InvokeRule } from "../codegen/model/InvokeRule.js";
import type { LeftRecursiveRuleFunction } from "../codegen/model/LeftRecursiveRuleFunction.js";
import type { Lexer } from "../codegen/model/Lexer.js";
import { LexerFile } from "../codegen/model/LexerFile.js";
import { ListenerDispatchMethod } from "../codegen/model/ListenerDispatchMethod.js";
import type { ListenerFile } from "../codegen/model/ListenerFile.js";
import type { LL1AltBlock } from "../codegen/model/LL1AltBlock.js";
import { LL1OptionalBlock } from "../codegen/model/LL1OptionalBlock.js";
import { LL1OptionalBlockSingleAlt } from "../codegen/model/LL1OptionalBlockSingleAlt.js";
import { LL1PlusBlockSingleAlt } from "../codegen/model/LL1PlusBlockSingleAlt.js";
import { LL1StarBlockSingleAlt } from "../codegen/model/LL1StarBlockSingleAlt.js";
import { MatchNotSet } from "../codegen/model/MatchNotSet.js";
import { MatchSet } from "../codegen/model/MatchSet.js";
import { MatchToken } from "../codegen/model/MatchToken.js";
import { OptionalBlock } from "../codegen/model/OptionalBlock.js";
import type { Parser } from "../codegen/model/Parser.js";
import type { ParserFile } from "../codegen/model/ParserFile.js";
import { PlusBlock } from "../codegen/model/PlusBlock.js";
import type { RuleActionFunction } from "../codegen/model/RuleActionFunction.js";
import type { RuleFunction } from "../codegen/model/RuleFunction.js";
import type { RuleSempredFunction } from "../codegen/model/RuleSempredFunction.js";
import { SemPred } from "../codegen/model/SemPred.js";
import type { SerializedATN } from "../codegen/model/SerializedATN.js";
import { StarBlock } from "../codegen/model/StarBlock.js";
import { TestSetInline } from "../codegen/model/TestSetInline.js";
import { ThrowNoViableAlt } from "../codegen/model/ThrowNoViableAlt.js";
import { VisitorDispatchMethod } from "../codegen/model/VisitorDispatchMethod.js";
import type { VisitorFile } from "../codegen/model/VisitorFile.js";
import { Wildcard } from "../codegen/model/Wildcard.js";

export class TypeScriptTargetGenerator implements ITargetGenerator {
    private static readonly defaultValues: Record<string, string> = {
        "bool": "false",
        "int": "0",
        "float": "0.0",
        "string": "\"\"",
    };

    public readonly id = "generator.default.typescript";

    public readonly language = "TypeScript";
    public readonly languageSpecifiers = ["typescript", "ts"];

    public readonly codeFileExtension = ".ts";

    /**
     * https://github.com/microsoft/TypeScript/issues/2536
     */
    public readonly reservedWords = new Set([
        // Resrved words:
        "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum",
        "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "null",
        "return", "super", "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with",

        // Strict mode reserved words:
        "as", "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield",

        // Contextual keywords:
        "any", "boolean", "constructor", "declare", "get", "module", "require", "number", "set", "string", "symbol",
        "type", "from", "of",
    ]);

    public renderParserFile(parserFile: ParserFile, variables: IGenerationVariables, parser: string,
        namedActions?: Record<string, string>, contextSuperClass?: string): string {
        const result: Array<string | undefined> = [
            "import * as antlr from \"antlr4ng\";",
            "import { Token } from \"antlr4ng\"; "
        ];

        if (parserFile.genListener) {
            result.push(`import { ${parserFile.grammarName}Listener } from "./${parserFile.grammarName}Listener.js";`);
        }

        if (parserFile.genVisitor) {
            result.push(`import { ${parserFile.grammarName}Visitor } from "./${parserFile.grammarName}Visitor.js";`);
        }

        result.push(
            "// for running tests with parameters, TODO: discuss strategy for typed parameters in CI",
            "// eslint-disable-next-line no-unused-vars",
            "type int = number;",
        );

        const header = parserFile.namedActions.get("header");
        if (header) {
            result.push(this.renderAction(header, variables, "", ""));
        }

        result.push(this.renderParser(parserFile.parser, variables, "", "", "", ""));

        return GeneratorHelper.formatLines(result, 0);
    }

    public renderParser(parser: Parser, variables: IGenerationVariables, funcs: string, atn: string,
        sempredFuncs: string, superClass: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLexerFile(lexerFile: LexerFile, variables: IGenerationVariables, lexer: string,
        namedActions: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLexer(lexer: Lexer, variables: IGenerationVariables, atn: string,
        actionFuncs: string, sempredFuncs: string, superClass: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderListenerFile(file: ListenerFile, variables: IGenerationVariables, header?: string,
        namedActions?: Record<string, string>): string {

        const result: Array<string | undefined> = [
            "import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from \"antlr4ng\";",
            "",
            header,
        ];

        for (const lname of file.listenerNames) {
            result.push(`import { ${GeneratorHelper.toTitleCase(lname)}Context } from "./${file.parserName}.js";`);
        }

        if (namedActions?.beforeListener) {
            result.push(namedActions.beforeListener);
        }

        result.push(`
/**
 * This interface defines a complete listener for a parse tree produced by \`${file.parserName}\`.
 */
export class ${file.grammarName}Listener implements ParseTreeListener {`);

        for (const lname of file.listenerNames) {
            result.push("\n    /**");
            if (file.listenerLabelRuleNames.has(lname)) {
                result.push(`
    * Enter a parse tree produced by the \`${lname}\
    * labeled alternative in \`${file.parserName}.${file.listenerLabelRuleNames.get(lname)}\`.
                `);
            } else {
                result.push(`    * Enter a parse tree produced by \`${file.parserName}.${lname}\`.`);
            }

            result.push("    * @param ctx the parse tree\n    */");
            result.push(`    enter${GeneratorHelper.toTitleCase(lname)}?: ` +
                `(ctx: ${GeneratorHelper.toTitleCase(lname)}Context) => void;`);

            result.push("    /**");
            if (file.listenerLabelRuleNames.has(lname)) {
                result.push(`
    * Exit a parse tree produced by the \`${lname}\
    * labeled alternative in \`${file.parserName}.${file.listenerLabelRuleNames.get(lname)}\`.
                `);
            } else {
                result.push(`    * Exit a parse tree produced by \`${file.parserName}.${lname}\`.`);
            }
            result.push("    * @param ctx the parse tree\n    */");

            result.push(`    exit${GeneratorHelper.toTitleCase(lname)}?: ` +
                `(ctx: ${GeneratorHelper.toTitleCase(lname)}Context) => void;`);

            result.push(
                "",
                "    visitTerminal(node: TerminalNode): void {}",
                "    visitErrorNode(node: ErrorNode): void {}",
                "    enterEveryRule(node: ParserRuleContext): void {}",
                "    exitEveryRule(node: ParserRuleContext): void {}",
            );

            if (namedActions?.afterListener) {
                result.push("\n" + namedActions.afterListener);
            }
        }

        result.push("}");

        return GeneratorHelper.formatLines(result, 0);
    }

    public renderVisitorFile(file: VisitorFile, variables: IGenerationVariables, namedActions: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRuleActionFunction(r: RuleActionFunction, variables: IGenerationVariables, actions: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRuleSempredFunction(r: RuleSempredFunction, variables: IGenerationVariables, actions: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRuleFunction(currentRule: RuleFunction, variables: IGenerationVariables, args: string,
        code: string, locals: string, ruleCtx: string, altLabelCtxs: string, namedActions: string,
        finallyAction: string, postamble: string,
        exceptions: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLeftRecursiveRuleFunction(currentRule: LeftRecursiveRuleFunction, variables: IGenerationVariables,
        args: string, code: string, locals: string, ruleCtx: string, altLabelCtxs: string, namedActions: string,
        finallyAction: string, postamble: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderCodeBlockForOuterMostAlt(currentOuterMostAltCodeBlock: CodeBlockForOuterMostAlt,
        variables: IGenerationVariables, locals: string, preamble: string, ops: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderCodeBlockForAlt(currentAltCodeBlock: CodeBlockForAlt, variables: IGenerationVariables,
        locals: string, preamble: string, ops: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLL1AltBlock(choice: LL1AltBlock, variables: IGenerationVariables, preamble: string,
        alts: string, error: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLL1OptionalBlock(choice: LL1OptionalBlock, variables: IGenerationVariables, alts: string,
        error: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLL1OptionalBlockSingleAlt(choice: LL1OptionalBlockSingleAlt, variables: IGenerationVariables,
        expr: string, alts: string, preamble: string, error: string, followExpr: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLL1StarBlockSingleAlt(choice: LL1StarBlockSingleAlt, variables: IGenerationVariables,
        loopExpr: string, alts: string, preamble: string, iteration: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLL1PlusBlockSingleAlt(choice: LL1PlusBlockSingleAlt, variables: IGenerationVariables,
        loopExpr: string, alts: string, preamble: string, iteration: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderAltBlock(choice: AltBlock, variables: IGenerationVariables, preamble: string, alts: string,
        error: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderOptionalBlock(choice: OptionalBlock, variables: IGenerationVariables, alts: string,
        error: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderStarBlock(choice: StarBlock, variables: IGenerationVariables, alts: string, sync: string,
        iteration: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderPlusBlock(choice: PlusBlock, variables: IGenerationVariables, alts: string, error: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderThrowNoViableAlt(t: ThrowNoViableAlt, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTestSetInline(s: TestSetInline, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderInvokeRule(r: InvokeRule, variables: IGenerationVariables, argExprsChunks: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderMatchToken(m: MatchToken, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderMatchSet(m: MatchSet, variables: IGenerationVariables, expr: string, capture: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderMatchNotSet(m: MatchNotSet, variables: IGenerationVariables, expr: string, capture: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderWildcard(w: Wildcard, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderAction(a: Action, variables: IGenerationVariables, foo: string, chunks: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderArgAction(a: Action, variables: IGenerationVariables, chunks: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderSemPred(p: SemPred, variables: IGenerationVariables, chunks: string, failChunks: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderExceptionClause(e: ExceptionClause, variables: IGenerationVariables, catchArg: string,
        catchAction: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLexerSkipCommand(): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLexerMoreCommand(): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLexerPopModeCommand(): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderActionText(t: ActionText, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderActionTemplate(t: ActionTemplate, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderArgRef(a: ArgRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLocalRef(a: LocalRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRetValueRef(a: RetValueRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderQRetValueRef(a: QRetValueRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenRef(t: TokenRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLabelRef(t: LabelRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderListLabelRef(t: ListLabelRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderSetAttr(s: SetAttr, variables: IGenerationVariables, rhsChunks: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenLabelType(): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderInputSymbolType(): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenPropertyRefText(t: TokenPropertyRefText, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenPropertyRefType(t: TokenPropertyRefType, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenPropertyRefLine(t: TokenPropertyRefLine, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenPropertyRefPos(t: TokenPropertyRefPos, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenPropertyRefChannel(t: TokenPropertyRefPos, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenPropertyRefIndex(t: TokenPropertyRefIndex, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenPropertyRefInt(t: TokenPropertyRefInt, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRulePropertyRefStart(r: RulePropertyRefStart, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRulePropertyRefStop(r: RulePropertyRefStop, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRulePropertyRefText(r: RulePropertyRefText, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRulePropertyRefCtx(r: RulePropertyRefCtx, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRulePropertyRefParser(r: RulePropertyRefParser, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderThisRulePropertyRefStart(r: ThisRulePropertyRefStart, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderThisRulePropertyRefStop(r: ThisRulePropertyRefStop, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderThisRulePropertyRefText(r: ThisRulePropertyRefText, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderThisRulePropertyRefCtx(r: ThisRulePropertyRefCtx, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderThisRulePropertyRefParser(r: ThisRulePropertyRefParser, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderNonLocalAttrRef(s: NonLocalAttrRef, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderSetNonLocalAttr(s: SetNonLocalAttr, variables: IGenerationVariables, rhsChunks: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderAddToLabelList(a: AddToLabelList, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenDecl(t: TokenDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenTypeDecl(t: TokenTypeDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderTokenListDecl(t: TokenListDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRuleContextDecl(r: RuleContextDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRuleContextListDecl(rdecl: RuleContextListDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderContextTokenGetterDecl(t: ContextTokenGetterDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderContextTokenListGetterDecl(t: ContextTokenListGetterDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderContextTokenListIndexedGetterDecl(t: ContextTokenListIndexedGetterDecl,
        variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderContextRuleGetterDecl(r: ContextRuleGetterDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderContextRuleListGetterDecl(r: ContextRuleListGetterDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderContextRuleListIndexedGetterDecl(r: ContextRuleListIndexedGetterDecl,
        variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderLexerRuleContext(): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderRuleContextNameSuffix(): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderCaptureNextToken(d: CaptureNextToken, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderCaptureNextTokenType(d: CaptureNextTokenType, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderStructDecl(struct: StructDecl, variables: IGenerationVariables, ctorAttrs: string, attrs: string,
        getters: string, dispatchMethods: string, interfaces: string, extensionMembers: string,
        signatures: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderAltLabelStructDecl(struct: AltLabelStructDecl, variables: IGenerationVariables, attrs: string,
        getters: string, dispatchMethods: string): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderListenerDispatchMethod(method: ListenerDispatchMethod, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderVisitorDispatchMethod(method: VisitorDispatchMethod, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderAttributeDecl(d: AttributeDecl, variables: IGenerationVariables): string {
        const result: Array<string | undefined> = [];

        return GeneratorHelper.formatLines(result, 0);

    }

    public renderSerializedATN(model: SerializedATN, variables: IGenerationVariables): string {
        const className = variables.recognizerName;
        const result: string[] = [
            "public static readonly _serializedATN: number[] = [",
            `    ${GeneratorHelper.renderList(model.serialized, 120)} `,
            "];",
            "",
            "private static __ATN: antlr.ATN;",
            "public static get _ATN(): antlr.ATN {",
            `    if (!${className}.__ATN) {`,
            `        ${className}.__ATN = new antlr.ATNDeserializer().deserialize(${className}._serializedATN); `,
            "    }",
            "",
            `    return ${className}.__ATN; `,
            "}"
        ];

        return result.join("\n");
    }

    private initValue(typeName: string): string {
        const value = TypeScriptTargetGenerator.defaultValues[typeName] as string | undefined;

        return value ?? "{}";
    }
};
