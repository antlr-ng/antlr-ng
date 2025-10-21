/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

import * as OutputModelObjects from "../codegen/model/index.js";

import { GeneratorBase } from "../codegen/GeneratorBase.js";
import type { CodePoint, ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import type { Grammar } from "../tool/Grammar.js";
import type { Rule } from "../tool/Rule.js";

/** The constructor type of OutputModelObject class. Used in the source op lookup map. */
type OutputModelObjectConstructor = new (...args: unknown[]) => OutputModelObjects.OutputModelObject;
type SourceOpRenderFunction = (rcOp: OutputModelObjects.SrcOp, header: boolean) => Lines;

export class CppTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.cpp";
    public readonly version = "1.0.0";

    public readonly language = "Cpp";
    public readonly languageSpecifiers = ["cpp", "c++"];

    public override readonly codeFileExtension = ".cpp";
    public override readonly declarationFileExtension = ".h";
    public readonly needsDeclarationFile = true;
    public readonly contextNameSuffix = "Context";

    public readonly lexerRuleContext = "antlr4::RuleContext";

    /** The rule context name is the rule followed by a suffix, e.g. r becomes rContext. */
    public readonly ruleContextNameSuffix = "Context";

    public override readonly wantsBaseListener = true;
    public override readonly wantsBaseVisitor = true;
    public override readonly supportsOverloadedMethods = true;

    /**
     * C++ reserved words
     */
    public override readonly reservedWords = new Set([
        "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand",
        "bitor", "bool", "break", "case", "catch", "char", "char16_t",
        "char32_t", "class", "compl", "concept", "const", "constexpr",
        "const_cast", "continue", "decltype", "default", "delete", "do",
        "double", "dynamic_cast", "else", "enum", "explicit", "export",
        "extern", "false", "float", "for", "friend", "goto", "if",
        "inline", "int", "long", "mutable", "namespace", "new", "noexcept",
        "not", "not_eq", "nullptr", "operator", "or", "or_eq", "private",
        "protected", "public", "register", "reinterpret_cast", "requires",
        "return", "short", "signed", "sizeof", "static", "static_assert",
        "static_cast", "struct", "switch", "template", "this", "thread_local",
        "throw", "true", "try", "typedef", "typeid", "typename", "union",
        "unsigned", "using", "virtual", "void", "volatile", "wchar_t", "while",
        "xor", "xor_eq",
    ]);

    public readonly lexerCommandMap: Map<string, () => Lines>;
    public readonly lexerCallCommandMap: Map<string, (arg: string, grammar: Grammar) => Lines>;

    /**
     * Code blocks are at the heart of code generation. This map allows easy lookup of the correct render method for a
     * specific output model code object, named a `SrcOp`. Source ops are code snippets that are put together
     * to form the final code.
     */
    private readonly srcOpMap = new Map<OutputModelObjectConstructor, SourceOpRenderFunction>([
        [OutputModelObjects.AddToLabelList, (srcOp, header) => {
            return this.renderAddToLabelList(srcOp as OutputModelObjects.AddToLabelList, header);
        }],
        [OutputModelObjects.AttributeDecl, (srcOp, header) => {
            return this.renderAttributeDecl(srcOp as OutputModelObjects.AttributeDecl, header);
        }],
        [OutputModelObjects.CaptureNextToken, (srcOp, header) => {
            return this.renderCaptureNextToken(srcOp as OutputModelObjects.CaptureNextToken, header);
        }],
        [OutputModelObjects.CaptureNextTokenType, (srcOp, header) => {
            return this.renderCaptureNextTokenType(srcOp as OutputModelObjects.CaptureNextTokenType, header);
        }],
        [OutputModelObjects.CodeBlockForAlt, (srcOp, header) => {
            return this.renderCodeBlockForAlt(srcOp as OutputModelObjects.CodeBlockForAlt, header);
        }],
        [OutputModelObjects.CodeBlockForOuterMostAlt, (srcOp, header) => {
            return this.renderCodeBlockForOuterMostAlt(srcOp as OutputModelObjects.CodeBlockForOuterMostAlt, header);
        }],
        [OutputModelObjects.ContextRuleGetterDecl, (srcOp, header) => {
            return this.renderContextRuleGetterDecl(srcOp as OutputModelObjects.ContextRuleGetterDecl, header);
        }],
        [OutputModelObjects.ContextRuleListGetterDecl, (srcOp, header) => {
            return this.renderContextRuleListGetterDecl(srcOp as OutputModelObjects.ContextRuleListGetterDecl, header);
        }],
        [OutputModelObjects.ContextTokenGetterDecl, (srcOp, header) => {
            return this.renderContextTokenGetterDecl(srcOp as OutputModelObjects.ContextTokenGetterDecl, header);
        }],
        [OutputModelObjects.ContextTokenListGetterDecl, (srcOp, header) => {
            return this.renderContextTokenListGetterDecl(srcOp as OutputModelObjects.ContextTokenListGetterDecl,
                header);
        }],
        [OutputModelObjects.ContextTokenListIndexedGetterDecl, (srcOp, header) => {
            return this.renderContextTokenListIndexedGetterDecl(
                srcOp as OutputModelObjects.ContextTokenListIndexedGetterDecl, header);
        }],
        [OutputModelObjects.ExceptionClause, (srcOp, header) => {
            return this.renderExceptionClause(srcOp as OutputModelObjects.ExceptionClause, header);
        }],
        [OutputModelObjects.LL1AltBlock, (srcOp, header) => {
            return this.renderLL1AltBlock(srcOp as OutputModelObjects.LL1AltBlock,
                header);
        }],
        [OutputModelObjects.LL1OptionalBlock, (srcOp, header) => {
            return this.renderLL1OptionalBlock(srcOp as OutputModelObjects.LL1OptionalBlock, header);
        }],
        [OutputModelObjects.LL1OptionalBlockSingleAlt, (srcOp, header) => {
            return this.renderLL1OptionalBlockSingleAlt(srcOp as OutputModelObjects.LL1OptionalBlockSingleAlt, header);
        }],
        [OutputModelObjects.LL1StarBlockSingleAlt, (srcOp, header) => {
            return this.renderLL1StarBlockSingleAlt(srcOp as OutputModelObjects.LL1StarBlockSingleAlt, header);
        }],
        [OutputModelObjects.LL1PlusBlockSingleAlt, (srcOp, header) => {
            return this.renderLL1PlusBlockSingleAlt(srcOp as OutputModelObjects.LL1PlusBlockSingleAlt, header);
        }],
        [OutputModelObjects.MatchToken, (srcOp, header) => {
            return this.renderMatchToken(srcOp as OutputModelObjects.MatchToken, header);
        }],
        [OutputModelObjects.MatchSet, (srcOp, header) => {
            return this.renderMatchSet(srcOp as OutputModelObjects.MatchSet, header);
        }],
        [OutputModelObjects.MatchNotSet, (srcOp, header) => {
            return this.renderMatchNotSet(srcOp as OutputModelObjects.MatchNotSet, header);
        }],
        [OutputModelObjects.RuleContextDecl, (srcOp, header) => {
            return this.renderRuleContextDecl(srcOp as OutputModelObjects.RuleContextDecl, header);
        }],
        [OutputModelObjects.RuleContextListDecl, (srcOp, header) => {
            return this.renderRuleContextListDecl(srcOp as OutputModelObjects.RuleContextListDecl
                , header);
        }],
        [OutputModelObjects.StructDecl, (srcOp, header) => {
            return this.renderStructDecl(srcOp as OutputModelObjects.StructDecl,
                header);
        }],
        [OutputModelObjects.TestSetInline, (srcOp, header) => {
            return this.renderTestSetInline(srcOp as OutputModelObjects.TestSetInline, header);
        }],
        [OutputModelObjects.TokenDecl, (srcOp, header) => {
            return this.renderTokenDecl(srcOp as OutputModelObjects.TokenDecl, header);
        }],
        [OutputModelObjects.TokenTypeDecl, (srcOp, header) => {
            return this.renderTokenTypeDecl(srcOp as OutputModelObjects.TokenTypeDecl, header);
        }],
        [OutputModelObjects.TokenListDecl, (srcOp, header) => {
            return this.renderTokenListDecl(srcOp as OutputModelObjects.TokenListDecl, header);
        }],
        [OutputModelObjects.ThrowNoViableAlt, (srcOp, header) => {
            return this.renderThrowNoViableAlt(srcOp as OutputModelObjects.ThrowNoViableAlt, header);
        }],
        [OutputModelObjects.Wildcard, (srcOp, header) => {
            return this.renderWildcard(srcOp as OutputModelObjects.Wildcard, header);
        }],
        [OutputModelObjects.ContextRuleListIndexedGetterDecl, (srcOp, header) => {
            return this.renderContextRuleListIndexedGetterDecl(
                srcOp as OutputModelObjects.ContextRuleListIndexedGetterDecl, header);
        }],
        [OutputModelObjects.StarBlock, (srcOp, header) => {
            return this.renderStarBlock(srcOp as OutputModelObjects.StarBlock, header);
        }],
        [OutputModelObjects.PlusBlock, (srcOp, header) => {
            return this.renderPlusBlock(srcOp as OutputModelObjects.PlusBlock, header);
        }],
        [OutputModelObjects.OptionalBlock, (srcOp, header) => {
            return this.renderOptionalBlock(srcOp as OutputModelObjects.OptionalBlock, header);
        }],
        [OutputModelObjects.AltBlock, (srcOp, header) => {
            return this.renderAltBlock(srcOp as OutputModelObjects.AltBlock, header);
        }],
        [OutputModelObjects.InvokeRule, (srcOp, header) => {
            return this.renderInvokeRule(srcOp as OutputModelObjects.InvokeRule, header);
        }],
        [OutputModelObjects.SemPred, (srcOp, header) => {
            return this.renderSemPred(srcOp as OutputModelObjects.SemPred, header);
        }],
        [OutputModelObjects.Action, (srcOp, header) => {
            return this.renderAction(srcOp as OutputModelObjects.Action, header);
        }],
    ]);

    private escapeMap: Map<CodePoint, string>;

    /**
     * A couple of values used in certain (recursive) render methods.
     * Instead of passing them around, we keep them here.
     */
    private invariants: Record<string, string> = {};

    public constructor(protected defines?: Record<string, string>) {
        super();

        this.lexerCommandMap = new Map<string, () => Lines>([
            ["skip", this.renderLexerSkipCommand],
            ["more", this.renderLexerMoreCommand],
            ["popMode", this.renderLexerPopModeCommand],
        ]);

        this.lexerCallCommandMap = new Map<string, (arg: string, grammar: Grammar) => Lines>([
            ["type", this.renderLexerTypeCommand],
            ["channel", this.renderLexerChannelCommand],
            ["mode", this.renderLexerModeCommand],
            ["pushMode", this.renderLexerPushModeCommand],
        ]);

        this.escapeMap = new Map(GeneratorBase.defaultCharValueEscape);
        this.escapeMap.set(0x07, "a");
        this.escapeMap.set(0x08, "b");
        this.escapeMap.set(0x0B, "v");
        this.escapeMap.set(0x1B, "e");
        this.escapeMap.set(0x3F, "?"); // To prevent trigraphs.
    }

    public renderParserFile(parserFile: OutputModelObjects.ParserFile, declaration: boolean): string {
        this.invariants.recognizerName = parserFile.parser.name;
        this.invariants.grammarName = parserFile.grammarName;
        this.invariants.grammarFileName = parserFile.grammarFileName;
        this.invariants.tokenLabelType = parserFile.TokenLabelType ?? "Token";

        const className = parserFile.contextSuperClass
            ? this.renderActionChunks([parserFile.contextSuperClass]).join("") : "";
        this.invariants.contextSuperClass = className;

        const result: Lines = this.renderFileHeader(parserFile);
        result.push("");
        result.push(...this.renderAction(parserFile.namedActions.get("header"), true));

        if (declaration) {
            result.push(`#pragma once`, ``);

            result.push(...this.renderAction(parserFile.namedActions.get("preinclude"), true), "");

            result.push(`#include "antlr4-runtime.h"`, ``);
            result.push(...this.renderAction(parserFile.namedActions.get("postinclude"), true), "");

            if (parserFile.genPackage) {
                result.push(`namespace ${parserFile.genPackage} {`);
                result.push(``);
            }

            result.push(...this.renderParserHeader(parserFile.parser, parserFile.namedActions));
            result.push(``);

            if (parserFile.genPackage) {
                result.push(`}  // namespace ${parserFile.genPackage}`);
            }

            return result.join("\n");
        }

        result.push(...this.renderAction(parserFile.namedActions.get("preinclude"), declaration), "");

        if (parserFile.genListener) {
            result.push(`#include "${parserFile.grammarName}Listener.h"`);
        }

        if (parserFile.genVisitor) {
            result.push(`#include "${parserFile.grammarName}Visitor.h"`, "");
        }

        result.push(`#include "${parserFile.parser.name}.h"`, "");
        result.push(...this.renderAction(parserFile.namedActions.get("postinclude"), declaration), "");
        result.push(`using namespace antlrcpp;`);

        const namespaceName = parserFile.genPackage;
        if (namespaceName) {
            result.push(`using namespace ${namespaceName};`, "");
            result.push("");
        }

        result.push(...this.renderParser(parserFile, parserFile.namedActions, declaration), "");

        return result.join("\n");
    }

    public renderLexerFile(lexerFile: OutputModelObjects.LexerFile, header: boolean): string {
        this.invariants.recognizerName = lexerFile.lexer.name;
        this.invariants.grammarName = lexerFile.lexer.grammarName;
        this.invariants.grammarFileName = lexerFile.lexer.grammarFileName;
        this.invariants.tokenLabelType = lexerFile.TokenLabelType ?? "Token";

        if (header) {
            const result: Lines = this.renderFileHeader(lexerFile);
            result.push(...this.renderAction(lexerFile.namedActions.get("header"), header));

            result.push("#pragma once");
            result.push(...this.renderAction(lexerFile.namedActions.get("preinclude"), header));
            result.push("");
            result.push(`#include "antlr4-runtime.h"`);
            result.push(...this.renderAction(lexerFile.namedActions.get("postinclude"), header));
            result.push("");

            const namespaceName = lexerFile.genPackage;

            if (namespaceName) {
                result.push(`namespace ${namespaceName} {`);
                result.push("");
            }

            result.push(...this.renderLexerHeader(lexerFile.lexer, lexerFile.namedActions, header,
                this.defines?.exportMacro));

            if (namespaceName) {
                result.push(`} // namespace ${namespaceName}`);
                result.push("");
            }

            return result.join("\n");
        }

        const result: Lines = this.renderFileHeader(lexerFile);
        result.push(...this.renderAction(lexerFile.namedActions.get("header"), header));
        result.push(...this.renderAction(lexerFile.namedActions.get("preinclude"), header));
        result.push(``, ``);
        result.push(`#include "${lexerFile.lexer.name}.h"`);
        result.push("");
        result.push(...this.renderAction(lexerFile.namedActions.get("postinclude"), header));
        result.push("");
        result.push("using namespace antlr4;");
        result.push("");

        result.push(...this.renderLexer(lexerFile.lexer, lexerFile.namedActions, header, lexerFile.genPackage));

        return result.join("\n");
    }

    public renderBaseListenerFile(listenerFile: OutputModelObjects.ListenerFile, declaration: boolean): string {
        const result: Lines = this.renderFileHeader(listenerFile);
        result.push(...this.renderAction(listenerFile.namedActions.get("header"), declaration), ``);

        const namespaceName = listenerFile.genPackage;
        if (!declaration) {
            result.push(...this.renderAction(listenerFile.namedActions.get("baselistenerpreinclude"), declaration), ``);
            result.push(`#include "${listenerFile.grammarName}BaseListener.h"`, ``);
            result.push(...this.renderAction(listenerFile.namedActions.get("baselistenerpostinclude"), declaration)
                , ``);

            if (namespaceName) {
                result.push(`using namespace ${namespaceName};`, "");
            }

            result.push(``);
            result.push(...this.renderAction(listenerFile.namedActions.get("baselistenerdefinitions"), declaration));

            return result.join("\n");
        }

        result.push(`#pragma once`, ``);
        result.push(...this.renderAction(listenerFile.namedActions.get("baselistenerpreinclude"), declaration), ``);
        result.push(`#include "antlr4-runtime.h"`);
        result.push(`#include "${listenerFile.grammarName}Listener.h"`, ``);
        result.push(...this.renderAction(listenerFile.namedActions.get("baselistenerpostinclude"), declaration), ``);

        if (namespaceName) {
            result.push(`namespace ${namespaceName} {`);
        }

        result.push(``);

        result.push(`/**`);
        result.push(` * This class provides an empty implementation of ${listenerFile.grammarName}Listener,`);
        result.push(` * which can be extended to create a listener which only needs to handle a subset`);
        result.push(` * of the available methods.`);
        result.push(` */`);
        result.push(`class ${this.defines?.exportMacro ?? ""} ${listenerFile.grammarName}BaseListener : public ` +
            `${listenerFile.grammarName}Listener {`);
        result.push(`public:`);

        result.push(...this.renderAction(listenerFile.namedActions.get("baselistenerdeclarations"), declaration), ``);

        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            const parserName = listenerFile.parserName;
            result.push(`  virtual void enter${name}(${parserName}::${name}Context * /*ctx*/) override { }`);
            result.push(`  virtual void exit${name}(${parserName}::${name}Context * /*ctx*/) override { }`);
            result.push(``);
        }

        result.push(``);
        result.push(`  virtual void enterEveryRule(antlr4::ParserRuleContext * /*ctx*/) override { }`);
        result.push(`  virtual void exitEveryRule(antlr4::ParserRuleContext * /*ctx*/) override { }`);
        result.push(`  virtual void visitTerminal(antlr4::tree::TerminalNode * /*node*/) override { }`);
        result.push(`  virtual void visitErrorNode(antlr4::tree::ErrorNode * /*node*/) override { }`);
        result.push(``);

        if (listenerFile.namedActions.get("baselistenermembers")) {
            result.push(`private:`);
            result.push(...this.renderAction(listenerFile.namedActions.get("baselistenermembers"), declaration), ``);
        }

        result.push(`};`);
        result.push(``);

        if (namespaceName) {
            result.push(`}  // namespace ${namespaceName}`);
        }

        return result.join("\n");
    }

    public renderBaseVisitorFile(visitorFile: OutputModelObjects.VisitorFile, declaration: boolean): string {
        const result: Lines = this.renderFileHeader(visitorFile);
        result.push(...this.renderAction(visitorFile.namedActions.get("header"), declaration), ``);

        const namespaceName = visitorFile.genPackage;
        if (!declaration) {
            result.push(``);
            result.push(...this.renderAction(visitorFile.namedActions.get("basevisitorpreinclude"), declaration));
            result.push(`#include "${visitorFile.grammarName}BaseVisitor.h"`, ``);

            result.push(...this.renderAction(visitorFile.namedActions.get("basevisitorpostinclude"), declaration), ``);

            if (namespaceName) {
                result.push(`using namespace ${namespaceName};`, "");
            }

            result.push(...this.renderAction(visitorFile.namedActions.get("basevisitordefinitions"), declaration), ``);

            return result.join("\n");
        }

        result.push(`#pragma once`);
        result.push(``);
        result.push(...this.renderAction(visitorFile.namedActions.get("basevisitorpreinclude"), declaration), ``);
        result.push(`#include "antlr4-runtime.h"`);
        result.push(`#include "${visitorFile.grammarName}Visitor.h"`);
        result.push(``);
        result.push(...this.renderAction(visitorFile.namedActions.get("basevisitorpostinclude"), declaration), ``);

        if (namespaceName) {
            result.push(`namespace ${namespaceName} {`);
        }

        result.push(``);
        result.push(`/**`);
        result.push(` * This class provides an empty implementation of ${visitorFile.grammarName}Visitor, which ` +
            `can be`);
        result.push(` * extended to create a visitor which only needs to handle a subset of the available methods.`);
        result.push(` */`);
        result.push(`class ${this.defines?.exportMacro ?? ""} ${visitorFile.grammarName}BaseVisitor : public ` +
            `${visitorFile.grammarName}Visitor {`);
        result.push(`public:`);
        result.push(...this.renderAction(visitorFile.namedActions.get("basevisitordeclarations"), declaration), ``);

        for (const lname of visitorFile.visitorNames) {
            const name = this.toTitleCase(lname);
            const parserName = visitorFile.parserName;
            result.push(`  virtual std::any visit${name}(${parserName}::${name}Context *ctx) override {`);
            result.push(`    return visitChildren(ctx);`);
            result.push(`  }`);
            result.push(``);
        }

        result.push(``);

        if (visitorFile.namedActions.get("basevisitormembers")) {
            result.push(`private:`);
            result.push(...this.renderAction(visitorFile.namedActions.get("basevisitormembers"), declaration));
        }

        result.push(`};`);
        result.push(``);

        if (namespaceName) {
            result.push(`}  // namespace ${visitorFile.genPackage}`);
        }

        return result.join("\n");
    }

    public renderListenerFile(listenerFile: OutputModelObjects.ListenerFile, declaration: boolean): string {
        const result: Lines = this.renderFileHeader(listenerFile);
        result.push(...this.renderAction(listenerFile.namedActions.get("header"), declaration), ``);

        const namespaceName = listenerFile.genPackage;
        if (!declaration) {
            result.push(``);
            result.push(...this.renderAction(listenerFile.namedActions.get("listenerpreinclude"), declaration));
            result.push(`#include "${listenerFile.grammarName}Listener.h"`, ``);

            result.push(...this.renderAction(listenerFile.namedActions.get("listenerpostinclude"), declaration), ``);

            if (namespaceName) {
                result.push(`using namespace ${namespaceName};`, "");
            }

            result.push(...this.renderAction(listenerFile.namedActions.get("listenerdefinitions"), declaration), ``);

            return result.join("\n");
        }

        result.push(`#pragma once`, ``);

        result.push(...this.renderAction(listenerFile.namedActions.get("listenerpreinclude"), declaration), ``);

        result.push(`#include "antlr4-runtime.h"`);
        result.push(`#include "${listenerFile.parserName}.h"`, ``);

        result.push(...this.renderAction(listenerFile.namedActions.get("listenerpostinclude"), declaration), ``);

        if (namespaceName) {
            result.push(`namespace ${namespaceName} {`);
        }

        result.push(``);

        result.push(`/**`);
        result.push(` * This interface defines an abstract listener for a parse tree produced by ` +
            `${listenerFile.parserName}.`);
        result.push(` */`);

        result.push(`class ${this.defines?.exportMacro ?? ""} ${listenerFile.grammarName}Listener : public ` +
            `antlr4::tree::ParseTreeListener {`);
        result.push(`public:`);

        result.push(...this.renderAction(listenerFile.namedActions.get("listenerdeclarations"), declaration), ``);

        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            const parserName = listenerFile.parserName;
            result.push(`  virtual void enter${name}(${parserName}::${name}Context *ctx) = 0;`);
            result.push(`  virtual void exit${name}(${parserName}::${name}Context *ctx) = 0;`);
            result.push(``);
        }

        if (listenerFile.namedActions.get("listenermembers")) {
            result.push(`private:`);
            result.push(...this.renderAction(listenerFile.namedActions.get("listenermembers"), declaration));
        }

        result.push(``, `};`, ``);

        if (namespaceName) {
            result.push(`}  // namespace ${namespaceName}`);
        }

        return result.join(`\n`);
    }

    public renderVisitorFile(visitorFile: OutputModelObjects.VisitorFile, declaration: boolean): string {
        const result: Lines = this.renderFileHeader(visitorFile);
        result.push(...this.renderAction(visitorFile.namedActions.get("header"), declaration), ``);

        const namespaceName = visitorFile.genPackage;
        if (!declaration) {
            result.push(``);
            result.push(...this.renderAction(visitorFile.namedActions.get("visitorpreinclude"), declaration));
            result.push(`#include "${visitorFile.grammarName}Visitor.h"`, ``);

            result.push(...this.renderAction(visitorFile.namedActions.get("visitorpostinclude"), declaration), ``);

            if (namespaceName) {
                result.push(`using namespace ${namespaceName};`, "");
            }

            result.push(...this.renderAction(visitorFile.namedActions.get("visitordefinitions"), declaration), ``);

            return result.join("\n");
        } else {
            result.push(`#pragma once`, ``);

            result.push(...this.renderAction(visitorFile.namedActions.get("visitorpreinclude"), declaration), ``);

            result.push(`#include "antlr4-runtime.h"`);
            result.push(`#include "${visitorFile.parserName}.h"`, ``);

            result.push(...this.renderAction(visitorFile.namedActions.get("visitorpostinclude"), declaration), ``);

            if (namespaceName) {
                result.push(`namespace ${namespaceName} {`);
            }

            result.push(``);

            result.push(`/**`);
            result.push(` * This class defines an abstract visitor for a parse tree`);
            result.push(` * produced by ${visitorFile.parserName}.`);
            result.push(` */`);

            result.push(`class ${this.defines?.exportMacro ?? ""} ${visitorFile.grammarName}Visitor : public ` +
                `antlr4::tree::AbstractParseTreeVisitor {`);
            result.push(`public:`);

            result.push(...this.renderAction(visitorFile.namedActions.get("visitordeclarations"), declaration), ``);

            result.push(`  /**`);
            result.push(`   * Visit parse trees produced by ${visitorFile.parserName}.`);
            result.push(`   */`);

            for (const lname of visitorFile.visitorNames) {
                const name = this.toTitleCase(lname);
                const parserName = visitorFile.parserName;
                result.push(`  virtual std::any visit${name}(${parserName}::${name}Context *context) = 0;`, ``);
            }

            if (visitorFile.namedActions.get("visitormembers")) {
                result.push(`private:`);
                result.push(...this.renderAction(visitorFile.namedActions.get("visitormembers"), declaration));
            }

            result.push(``, `};`, ``);

            if (namespaceName) {
                result.push(`}  // namespace ${namespaceName}`);
            }

            return result.join(`\n`);
        }
    }

    public renderLexerRuleContext(): Lines {
        return ["antlr4::RuleContext"];
    }

    public getRuleFunctionContextStructName(r: Rule): string {
        if (r.g.isLexer()) {
            return this.renderLexerRuleContext().join("");
        }

        return this.toTitleCase(r.name) + this.ruleContextNameSuffix;
    }

    public renderRecRuleReplaceContext(ctxName: string): Lines {
        const result: Lines = [];

        result.push(`_localctx = _tracker.createInstance<${ctxName}Context>(_localctx);`);
        result.push(`_ctx = _localctx;`);
        result.push(`previousContext = _localctx;`);

        return result;
    }

    public renderRecRuleAltPredicate(ruleName: string, opPrec: number): Lines {
        return [`precpred(_ctx, ${opPrec})`];
    }

    public renderRecRuleSetReturnAction(src: string, name: string): Lines {
        return [`$${name} = $${src}->${name};`];
    }

    public renderRecRuleSetStopToken(): Lines {
        return [`_ctx->stop = _input->LT(-1);`];
    }

    public renderRecRuleSetPrevCtx(): Lines {
        return [
            "if (!_parseListeners.empty())",
            "    triggerExitRuleEvent();",
            "previousContext = _localctx;",
        ];
    }

    public renderRecRuleLabeledAltStartAction(parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines {

        const result: Lines = this.startRendering("RecRuleLabeledAltStartAction");

        result.push(`auto newContext = _tracker.createInstance<${this.toTitleCase(currentAltLabel)}Context>` +
            `(_tracker.createInstance<${this.toTitleCase(ruleName)}Context>(parentContext, parentState));`);
        result.push(`_localctx = newContext;`);

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`newContext->${label}.push_back(previousContext);`);
            } else {
                result.push(`newContext->${label} = previousContext;`);
            }
        }

        result.push(`pushNewRecursionContext(newContext, startState, Rule${this.toTitleCase(ruleName)});`);

        return this.endRendering("RecRuleLabeledAltStartAction", result);
    }

    public renderRecRuleAltStartAction(parserName: string, ruleName: string, ctxName: string, label: string | undefined,
        isListLabel: boolean): Lines {
        const result: Lines = this.startRendering("RecRuleAltStartAction");

        result.push(`_localctx = _tracker.createInstance<${this.toTitleCase(ctxName)}Context>(parentContext, ` +
            `parentState);`);

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`_localctx->${label}.push_back(previousContext);`);
            } else {
                result.push(`_localctx->${label} = previousContext;`);
            }
        }

        result.push(`pushNewRecursionContext(_localctx, startState, Rule${this.toTitleCase(ruleName)});`);

        return this.endRendering("RecRuleAltStartAction", result);
    }

    public renderTestFile(grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string {
        const result: Lines = [];

        result.push(`#include <iostream>`, ``);
        result.push(`#include "antlr4-runtime.h"`);
        result.push(`#include "<lexerName>.h"`);

        result.push(`<if(parserName)>`);
        result.push(`#include "<parserName>.h"`);
        result.push(`<endif>`);

        result.push(``);
        result.push(`using namespace antlr4;`, ``);

        if (parserName !== undefined) {
            result.push(`class TreeShapeListener : public tree::ParseTreeListener {`);
            result.push(`public:`);
            result.push(`  void visitTerminal(tree::TerminalNode *) override {}`);
            result.push(`  void visitErrorNode(tree::ErrorNode *) override {}`);
            result.push(`  void exitEveryRule(ParserRuleContext *) override {}`);
            result.push(`  void enterEveryRule(ParserRuleContext *ctx) override {`);
            result.push(`    for (auto child : ctx->children) {`);
            result.push(`      tree::ParseTree *parent = child->parent;`);
            result.push(`      ParserRuleContext *rule = dynamic_cast<ParserRuleContext *>(parent);`);
            result.push(`      if (rule != ctx) {`);
            result.push(`        throw "Invalid parse tree shape detected.";`);
            result.push(`      }`);
            result.push(`    }`);
            result.push(`  }`);
            result.push(`};`);
        }

        result.push(``);
        result.push(`int main(int argc, const char* argv[]) {`);
        result.push(`  ANTLRFileStream input;`);
        result.push(`  input.loadFromFile(argv[1]);`);
        result.push(`  ${lexerName} lexer(&input);`);
        result.push(`  CommonTokenStream tokens(&lexer);`);

        if (parserName !== undefined) {
            result.push(`  ${parserName} parser(&tokens);`);
            result.push(`  parser.getInterpreter<atn::ParserATNSimulator>()->setPredictionMode(antlr4::atn::` +
                `PredictionMode::${predictionMode});`);
            if (!buildParseTree) {
                result.push(`  parser.setBuildParseTree(false);`);
            }

            if (showDiagnosticErrors) {
                result.push(`  DiagnosticErrorListener errorListener;`);
                result.push(`  parser.addErrorListener(&errorListener);`);
            }

            result.push(`  tree::ParseTree *tree = parser.${parserStartRuleName}();`);
            result.push(`  TreeShapeListener listener;`);
            result.push(`  tree::ParseTreeWalker::DEFAULT.walk(&listener, tree);`);
        } else {
            result.push(`  tokens.fill();`);
            result.push(`  for (auto token : tokens.getTokens())`);
            result.push(`    std::cout << token->toString() << std::endl;`);

            if (showDFA) {
                result.push(`  std::cout << lexer.getInterpreter<atn::LexerATNSimulator>()->getDFA(` +
                    `Lexer::DEFAULT_MODE).toLexerString();`);
            }
        }

        result.push(`  return 0;`);
        result.push(`}`);

        return result.join("\n");
    }

    // Private helper methods for rendering different parts

    public override renderImplicitTokenLabel(tokenName: string): string {
        return `_t${tokenName}`;
    }

    public override renderImplicitRuleLabel(ruleName: string): string {
        return `_r${ruleName}`;
    }

    public override renderImplicitSetLabel(id: string): string {
        return `_tset${id}`;
    }

    public override renderListLabelName(label: string): string {
        return `_${label}_list`;
    }

    public override escapeIfNeeded(identifier: string): string {
        return this.reservedWords.has(identifier) ? this.escapeWord(identifier) : identifier;
    }

    public override get charValueEscapeMap(): Map<CodePoint, string> {
        return this.escapeMap;
    }

    public override getTargetStringLiteralFromString(s: string, quoted?: boolean): string {
        quoted ??= true;

        const sb: string[] = [];
        if (quoted) {
            sb.push('"');
        }

        for (let i = 0; i < s.length;) {
            const c = s.codePointAt(i)!;
            const escape = this.escapeMap.get(c);

            if (escape) {
                sb.push(`\\${escape}`);
            } else if (c < 0x20 || c > 0x7F) {
                sb.push(`\\u${c.toString(16).padStart(4, "0")}`);
            } else {
                sb.push(String.fromCodePoint(c));
            }

            i += c > 0xFFFF ? 2 : 1;
        }

        if (quoted) {
            sb.push('"');
        }

        return sb.join("");
    }

    public override getLoopLabel(ast: GrammarASTWithOptions): string {
        return `loop${ast.token?.tokenIndex ?? 0}`;
    }

    public override getSerializedATNSegmentLimit(): number {
        return 2 ^ 16 - 1; // 64K per segment for C++
    }

    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [];
    }

    protected override renderTypedContext(ctx: OutputModelObjects.StructDecl): string {
        return ctx.provideCopyFrom ? `dynamic_cast<${ctx.name}*>(_localctx.get())` : `_localctx`;
    }

    protected override shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint: number): boolean {
        // In addition to the default escaped code points, also escape ? to prevent trigraphs.
        // Ideally, we would escape ? with \?, but escaping as unicode \u003F works as well.
        return (codePoint == 0x3F) || super.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint);
    }

    private renderParser(parserFile: OutputModelObjects.ParserFile,
        namedActions: Map<string, OutputModelObjects.Action>, header: boolean): Lines {
        const parser = parserFile.parser;

        if (header) {
            return this.renderParserHeader(parser, namedActions);
        }

        const result: Lines = [];
        result.push(`namespace {`, "");

        const parserName = this.toTitleCase(this.invariants.recognizerName);
        result.push(`struct ${parserName}StaticData final {`);
        result.push(`  ${parserName}StaticData(std::vector<std::string> ruleNames,`);
        result.push(`                        std::vector<std::string> literalNames,`);
        result.push(`                        std::vector<std::string> symbolicNames)`);
        result.push(`      : ruleNames(std::move(ruleNames)), literalNames(std::move(literalNames)),`);
        result.push(`        symbolicNames(std::move(symbolicNames)),`);
        result.push(`        vocabulary(this->literalNames, this->symbolicNames) {}`);
        result.push(``);
        result.push(`  ${parserName}StaticData(const ${parserName}StaticData&) = delete;`);
        result.push(`  ${parserName}StaticData(${parserName}StaticData&&) = delete;`);
        result.push(`  ${parserName}StaticData& operator=(const ${parserName}StaticData&) = delete;`);
        result.push(`  ${parserName}StaticData& operator=(${parserName}StaticData&&) = delete;`);
        result.push(``);
        result.push(`  std::vector<antlr4::dfa::DFA> decisionToDFA;`);
        result.push(`  antlr4::atn::PredictionContextCache sharedContextCache;`);
        result.push(`  const std::vector<std::string> ruleNames;`);
        result.push(`  const std::vector<std::string> literalNames;`);
        result.push(`  const std::vector<std::string> symbolicNames;`);
        result.push(`  const antlr4::dfa::Vocabulary vocabulary;`);
        result.push(`  antlr4::atn::SerializedATNView serializedATN;`);
        result.push(`  std::unique_ptr<antlr4::atn::ATN> atn;`);
        result.push(`};`, "");

        const loweredGrammarName = parser.grammarName.toLowerCase();
        result.push(`::antlr4::internal::OnceFlag ${loweredGrammarName}ParserOnceFlag;`);
        result.push(`#if ANTLR4_USE_THREAD_LOCAL_CACHE`);
        result.push(`static thread_local`);
        result.push(`#endif`);
        result.push(`std::unique_ptr<${parserName}StaticData> ${loweredGrammarName}ParserStaticData = nullptr;`);
        result.push(``);

        result.push(`void ${loweredGrammarName}ParserInitialize() {`);
        result.push(`#if ANTLR4_USE_THREAD_LOCAL_CACHE`);
        result.push(`  if (${loweredGrammarName}ParserStaticData != nullptr) {`);
        result.push(`    return;`);
        result.push(`  }`);
        result.push(`#else`);
        result.push(`  assert(${loweredGrammarName}ParserStaticData == nullptr);`);
        result.push(`#endif`);
        result.push(`  auto staticData = std::make_unique<${parserName}StaticData>(`);
        result.push(`    std::vector<std::string>{`);

        result.push(...this.renderList(parser.ruleNames, { wrap: 65, indent: 6, quote: `"` }));

        result.push(`    },`);
        result.push(`    std::vector<std::string>{`);

        result.push(...this.renderList(parser.literalNames, { wrap: 65, indent: 6, null: `""` }));

        result.push(`    },`);
        result.push(`    std::vector<std::string>{`);

        result.push(...this.renderList(parser.symbolicNames, { wrap: 65, indent: 6, null: `""` }));

        result.push(`    }`);
        result.push(`  );`);

        result.push(... this.renderSerializedATN(parser.atn));

        result.push(`  ${loweredGrammarName}ParserStaticData = std::move(staticData);`);
        result.push(`}`, "");
        result.push(`}`, "");

        const recognizerName = this.invariants.recognizerName;
        const baseClass = parser.superClass ? this.renderActionChunks([parser.superClass]) : "Parser";
        result.push(`${this.invariants.recognizerName}::${recognizerName}(TokenStream *input) : ` +
            `${recognizerName}(input, antlr4::atn::ParserATNSimulatorOptions()) {}`, ``);
        result.push(`${recognizerName}::${recognizerName}(TokenStream *input, ` +
            `const antlr4::atn::ParserATNSimulatorOptions &options) : ${baseClass}(input) {`);
        result.push(`  ${recognizerName}::initialize();`);
        result.push(`  _interpreter = new atn::ParserATNSimulator(this, *${loweredGrammarName}ParserStaticData->atn, ` +
            `${loweredGrammarName}ParserStaticData->decisionToDFA, ${loweredGrammarName}ParserStaticData->` +
            `sharedContextCache, options);`);
        result.push(`}`, "");
        result.push(`${recognizerName}::~${recognizerName}() {`);
        result.push(`  delete _interpreter;`);
        result.push(`}`, "");
        result.push(`const atn::ATN& ${recognizerName}::getATN() const {`);
        result.push(`  return *${loweredGrammarName}ParserStaticData->atn;`);
        result.push(`}`, "");
        result.push(`std::string ${recognizerName}::getGrammarFileName() const {`);
        result.push(`  return "${parser.grammarFileName}";`);
        result.push(`}`, "");
        result.push(`const std::vector<std::string>& ${recognizerName}::getRuleNames() const {`);
        result.push(`  return ${loweredGrammarName}ParserStaticData->ruleNames;`);
        result.push(`}`, "");
        result.push(`const dfa::Vocabulary& ${recognizerName}::getVocabulary() const {`);
        result.push(`  return ${loweredGrammarName}ParserStaticData->vocabulary;`);
        result.push(`}`, "");
        result.push(`antlr4::atn::SerializedATNView ${recognizerName}::getSerializedATN() const {`);
        result.push(`  return ${loweredGrammarName}ParserStaticData->serializedATN;`);
        result.push(`}`, "");

        result.push(...this.renderAction(namedActions.get("definitions"), false), "");
        result.push(...this.renderRuleFunctions(parser.funcs, header));

        if (parser.sempredFuncs.size > 0) {
            result.push(`bool ${recognizerName}::sempred(RuleContext *context, size_t ruleIndex, ` +
                `size_t predicateIndex) {`);
            result.push(`  switch (ruleIndex) {`);

            parser.sempredFuncs.values().forEach((f) => {
                result.push(`  case ${f.ruleIndex}: return ${f.name}Sempred(antlrcpp::downCast<${f.ctxType} ` +
                    `*>(context), predicateIndex);`);
            });

            result.push(`  default:`);
            result.push(`    break;`);
            result.push(`  }`);
            result.push(`  return true;`);
            result.push(`}`, "");

            parser.sempredFuncs.values().forEach((f) => {
                result.push(...this.renderRuleSempredFunction(f, header));
            });
        }

        result.push(`void ${recognizerName}::initialize() {`);
        result.push(`#if ANTLR4_USE_THREAD_LOCAL_CACHE`);
        result.push(`  ${loweredGrammarName}ParserInitialize();`);
        result.push(`#else`);
        result.push(`  ::antlr4::internal::call_once(${loweredGrammarName}ParserOnceFlag, ${loweredGrammarName}` +
            `ParserInitialize);`);
        result.push(`#endif`);
        result.push(`}`);

        return result;
    }

    private renderParserHeader(parser: OutputModelObjects.Parser,
        namedActions: Map<string, OutputModelObjects.Action>): Lines {
        const result: Lines = [];

        const superClass = parser.superClass ? this.renderActionChunks([parser.superClass]) : "antlr4::Parser";

        result.push(...this.renderAction(namedActions.get("context"), true), ``);
        result.push(`class ${this.defines?.exportMacro ?? ""} ${parser.name} : public ${superClass} {`);
        result.push(`public:`);

        if (parser.tokens.size > 0) {
            const block: Lines = [];
            block.push(`enum {`);
            block.push(...this.renderList(this.renderMap(parser.tokens, 0, "${0} = ${1}"),
                { wrap: 67, indent: 2, separator: ", " }));
            block.push(`};`);

            result.push(...this.formatLines(block, 2));
        }

        result.push(``);

        if (parser.rules.length > 0) {
            const block: Lines = [];
            block.push(`enum {`);
            const listedModes: string[] = [];
            parser.rules.forEach((m, i) => {
                listedModes.push(`Rule${this.toTitleCase(m.name)} = ${i}`);
            });
            block.push(...this.renderList(listedModes, { wrap: 67, indent: 2, separator: ", " }));
            block.push(`};`);

            result.push(...this.formatLines(block, 2));
        }

        result.push(``);
        result.push(`  explicit ${parser.name}(antlr4::TokenStream *input);`);
        result.push(``);
        result.push(`  ${parser.name}(antlr4::TokenStream *input, const antlr4::atn::ParserATNSimulatorOptions ` +
            `&options);`);
        result.push(``);
        result.push(`  ~${parser.name}() override;`, ``);
        result.push(`  std::string getGrammarFileName() const override;`, ``);
        result.push(`  const antlr4::atn::ATN& getATN() const override;`, ``);
        result.push(`  const std::vector<std::string>& getRuleNames() const override;`, ``);
        result.push(`  const antlr4::dfa::Vocabulary& getVocabulary() const override;`, ``);
        result.push(`  antlr4::atn::SerializedATNView getSerializedATN() const override;`, ``);

        result.push(...this.renderAction(namedActions.get("members"), true), ``);

        for (const f of parser.funcs) {
            result.push(`  class ${this.toTitleCase(f.name)}Context;`);
        }

        result.push(``);
        result.push(...this.renderRuleFunctions(parser.funcs, true));

        if (parser.sempredFuncs.size > 0) {
            result.push(`  bool sempred(antlr4::RuleContext *_localctx, size_t ruleIndex, size_t predicateIndex) ` +
                `override;`);
            result.push(``);

            if (parser.sempredFuncs.size > 0) {
                parser.sempredFuncs.forEach((f) => {
                    result.push(`  bool ${f.name}Sempred(${f.ctxType} *_localctx, size_t predicateIndex);`);
                });
            }
        }

        result.push(``);
        result.push(`  // By default the static state used to implement the parser is lazily initialized during the ` +
            `first`);
        result.push(`  // call to the constructor. You can call this function if you wish to initialize the static ` +
            `state`);
        result.push(`  // ahead of time.`);
        result.push(`  static void initialize();`);
        result.push(``);
        result.push(`private:`);
        result.push(...this.formatLines(this.renderAction(namedActions.get("declaraions"), true), 2));
        result.push(`};`);

        return result;
    }

    private renderRuleFunctions(funcs: OutputModelObjects.RuleFunction[], header: boolean): Lines {
        const result: Lines = [];

        if (funcs.length > 0) {
            funcs.forEach((f) => {
                if (f instanceof OutputModelObjects.LeftRecursiveRuleFunction) {
                    result.push(...this.renderLeftRecursiveRuleFunction(f, header));
                } else {
                    result.push(...this.renderRuleFunction(f, header));
                }
            });
            result.push("");
        }

        return result;
    }

    private renderRuleFunction(currentRule: OutputModelObjects.RuleFunction, header: boolean): Lines {
        const result = this.startRendering("RuleFunction");

        result.push(...this.renderStructDecl(currentRule.ruleCtx, header));

        currentRule.altLabelCtxs?.forEach((ctx) => {
            result.push(...this.renderAltLabelStructDecl(currentRule, ctx, header));
        });

        const args = currentRule.args?.map((a) => {
            return `${a.type} ${a.escapedName}`;
        }).join(", ");

        if (header) {
            result.push(`${currentRule.ctxType}* ` + `${currentRule.escapedName}(${args ?? ""});`, ``);

            return this.endRendering("RuleFunction", this.formatLines(result, 2));
        }

        const ctorArgs = currentRule.args?.map((a) => {
            return a.escapedName;
        });

        result.push(`${this.invariants.recognizerName}::${currentRule.ctxType}* ${this.invariants.recognizerName}::` +
            currentRule.escapedName + `(${args ?? ""}) {`);

        const block: Lines = [];
        block.push(`${currentRule.ctxType} *_localctx = _tracker.createInstance<${currentRule.ctxType}>(_ctx, ` +
            `getState()${ctorArgs ? ", " + ctorArgs : ""});`);
        block.push(`enterRule(_localctx, ${currentRule.startState}, ${this.invariants.recognizerName}::Rule` +
            `${this.toTitleCase(currentRule.name)});`);

        block.push(...this.renderAction(currentRule.namedActions?.get("init"), false));

        for (const decl of currentRule.locals) {
            block.push(...this.renderTokenTypeDecl(decl, false));
        }

        result.push(...this.formatLines(block, 2));

        result.push(`#if __cplusplus > 201703L`);
        result.push(`  auto onExit = finally([=, this] {`);
        result.push(`#else`);
        result.push(`  auto onExit = finally([=] {`);
        result.push(`#endif`);

        if (currentRule.finallyAction) {
            result.push(`    ${this.renderAction(currentRule.finallyAction, false)}`);
        }

        result.push(`    exitRule();`);
        result.push(`  });`);
        result.push(`  try {`);

        if (currentRule.hasLookaheadBlock) {
            result.push(`    size_t alt;`);
        }

        block.length = 0;
        block.push(...this.renderSourceOps(currentRule.code, header));
        block.push(...this.renderSourceOps(currentRule.postamble, header));
        block.push(...this.renderAction(currentRule.namedActions?.get("after"), false));

        result.push(...this.formatLines(block, 4));
        result.push(`  }`);

        const exceptions = currentRule.exceptions ?? [];
        if (exceptions.length > 0) {
            for (const ex of exceptions) {
                result.push(`  catch (${this.renderAction(ex.catchArg, false)} &e) {`);
                result.push(...this.formatLines(this.renderAction(ex.catchAction, false), 2));
                result.push(`  }`);
            }
        } else {
            result.push(`  catch (RecognitionException &e) {`);
            result.push(`    _errHandler->reportError(this, e);`);
            result.push(`    _localctx->exception = std::current_exception();`);
            result.push(`    _errHandler->recover(this, _localctx->exception);`);
            result.push(`  }`);
        }

        result.push(``);
        result.push(`  return _localctx;`);
        result.push(`}`);

        return this.endRendering("RuleFunction", result);
    }

    private renderLeftRecursiveRuleFunction(currentRule: OutputModelObjects.LeftRecursiveRuleFunction,
        header: boolean): Lines {
        const result = this.startRendering("LeftRecursiveRuleFunction");

        result.push(...this.renderStructDecl(currentRule.ruleCtx, header));

        currentRule.altLabelCtxs?.forEach((ctx) => {
            result.push(...this.renderAltLabelStructDecl(currentRule, ctx, header));
        });

        const args = currentRule.args?.map((a) => {
            return `${a.type} ${a.escapedName}`;
        }).join(", ");

        if (header) {
            result.push(``, `${currentRule.ctxType}* ${currentRule.escapedName}(${args ?? ""});`);
            result.push(`${currentRule.ctxType}* ${currentRule.escapedName}(int ` +
                `precedence${args ? ", " + args : ""});`);

            return this.endRendering("LeftRecursiveRuleFunction", this.formatLines(result, 2));
        }

        result.push(`${this.invariants.recognizerName}::${currentRule.ctxType}* ${this.invariants.recognizerName}::` +
            currentRule.escapedName + `(${args ?? ""}) {`);

        let ruleCallArgs;
        if (currentRule.args) {
            ruleCallArgs = ", " + currentRule.args.map((a) => {
                return a.escapedName;
            });
        }

        result.push(`   return ${currentRule.escapedName}(0${ruleCallArgs ?? ""});`);
        result.push(`}`);
        result.push(``);
        result.push(`${this.invariants.recognizerName}::${currentRule.ctxType}* ${this.invariants.recognizerName}::` +
            `${currentRule.escapedName}(int precedence${ruleCallArgs ?? ""}) {`);
        result.push(`  ParserRuleContext *parentContext = _ctx;`);
        result.push(`  size_t parentState = getState();`);
        result.push(`  ${this.invariants.recognizerName}::${currentRule.ctxType} *_localctx = ` +
            `_tracker.createInstance<${currentRule.ctxType}>(_ctx, parentState${ruleCallArgs ?? ""});`);
        result.push(`  ${this.invariants.recognizerName}::${currentRule.ctxType} *previousContext = _localctx;`);
        result.push(`  (void)previousContext; // Silence compiler, in case the context is not used by generated code.`);
        result.push(`  size_t startState = ${currentRule.startState};`);
        result.push(`  enterRecursionRule(_localctx, ${currentRule.startState}, ${this.invariants.recognizerName}::` +
            `Rule${this.toTitleCase(currentRule.name)}, precedence);`);
        result.push(``);

        const block: Lines = [];
        block.push(...this.renderAction(currentRule.namedActions?.get("init"), header));

        for (const decl of currentRule.locals) {
            block.push(...this.renderTokenTypeDecl(decl, header));
        }

        result.push(...this.formatLines(block, 2));

        result.push(``);
        result.push(`#if __cplusplus > 201703L`);
        result.push(`  auto onExit = finally([=, this] {`);
        result.push(`#else`);
        result.push(`  auto onExit = finally([=] {`);
        result.push(`#endif`);

        if (currentRule.finallyAction) {
            result.push(`    ${this.renderAction(currentRule.finallyAction, header)}`);
        }

        result.push(`    unrollRecursionContexts(parentContext);`);
        result.push(`  });`);
        result.push(`  try {`);

        if (currentRule.hasLookaheadBlock) {
            result.push(`    size_t alt;`);
        }

        block.length = 0;
        block.push(...this.renderSourceOps(currentRule.code, header));
        block.push(...this.renderSourceOps(currentRule.postamble, header));
        block.push(...this.renderAction(currentRule.namedActions?.get("after"), header));

        // Getting the indentation right is really tricky. The old ST4 sometimes indented blocks and sometimes didn't.
        result.push("", ...this.formatLines(block, 4));
        result.push(`  }`);
        result.push(`  catch (RecognitionException &e) {`);
        result.push(`    _errHandler->reportError(this, e);`);
        result.push(`    _localctx->exception = std::current_exception();`);
        result.push(`    _errHandler->recover(this, _localctx->exception);`);
        result.push(`  }`);
        result.push(`  return _localctx;`);
        result.push(`}`);

        return this.endRendering("LeftRecursiveRuleFunction", result);
    }

    private renderSourceOps(srcOps: Array<OutputModelObjects.SrcOp | null> | undefined,
        header: boolean): Lines {
        const result: Lines = this.startRendering("SourceOps");

        srcOps?.forEach((srcOp) => {
            if (srcOp) {
                const method = this.srcOpMap.get(srcOp.constructor as OutputModelObjectConstructor);
                if (method) {
                    result.push(...method(srcOp, header));
                } else {
                    throw new Error(`Unhandled source op type: ${srcOp.constructor.name}`);
                }
            }
        });

        return this.endRendering("SourceOps", result);
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: Map<string, OutputModelObjects.Action>,
        header: boolean, namespaceName?: string): Lines {

        const result: Lines = [];

        if (namespaceName) {
            result.push(`using namespace ${namespaceName};`);
            result.push("");
        }

        result.push("namespace {", "");

        const lexerName = this.toTitleCase(lexer.name);
        result.push(`struct ${lexerName}StaticData final {`);
        result.push(`  ${lexerName}StaticData(std::vector<std::string> ruleNames,`);
        result.push(`                          std::vector<std::string> channelNames,`);
        result.push(`                          std::vector<std::string> modeNames,`);
        result.push(`                          std::vector<std::string> literalNames,`);
        result.push(`                          std::vector<std::string> symbolicNames)`);
        result.push(`      : ruleNames(std::move(ruleNames)), channelNames(std::move(channelNames)),`);
        result.push(`        modeNames(std::move(modeNames)), literalNames(std::move(literalNames)),`);
        result.push(`        symbolicNames(std::move(symbolicNames)),`);
        result.push(`        vocabulary(this->literalNames, this->symbolicNames) {}`);
        result.push(``);
        result.push(`  ${lexerName}StaticData(const ${lexerName}StaticData&) = delete;`);
        result.push(`  ${lexerName}StaticData(${lexerName}StaticData&&) = delete;`);
        result.push(`  ${lexerName}StaticData& operator=(const ${lexerName}StaticData&) = delete;`);
        result.push(`  ${lexerName}StaticData& operator=(${lexerName}StaticData&&) = delete;`);
        result.push(``);
        result.push(`  std::vector<antlr4::dfa::DFA> decisionToDFA;`);
        result.push(`  antlr4::atn::PredictionContextCache sharedContextCache;`);
        result.push(`  const std::vector<std::string> ruleNames;`);
        result.push(`  const std::vector<std::string> channelNames;`);
        result.push(`  const std::vector<std::string> modeNames;`);
        result.push(`  const std::vector<std::string> literalNames;`);
        result.push(`  const std::vector<std::string> symbolicNames;`);
        result.push(`  const antlr4::dfa::Vocabulary vocabulary;`);
        result.push(`  antlr4::atn::SerializedATNView serializedATN;`);
        result.push(`  std::unique_ptr<antlr4::atn::ATN> atn;`);
        result.push(`};`, ``);

        const loweredGrammarName = lexer.grammarName.toLowerCase();
        result.push(`::antlr4::internal::OnceFlag ${loweredGrammarName}LexerOnceFlag;`);
        result.push(`#if ANTLR4_USE_THREAD_LOCAL_CACHE`);
        result.push(`static thread_local`);
        result.push(`#endif`);
        result.push(`std::unique_ptr<${lexerName}StaticData> ${loweredGrammarName}LexerStaticData = nullptr;`);
        result.push(``);
        result.push(`void ${loweredGrammarName}LexerInitialize() {`);
        result.push(`#if ANTLR4_USE_THREAD_LOCAL_CACHE`);
        result.push(`  if (${loweredGrammarName}LexerStaticData != nullptr) {`);
        result.push(`    return;`);
        result.push(`  }`);
        result.push(`#else`);
        result.push(`  assert(${loweredGrammarName}LexerStaticData == nullptr);`);
        result.push(`#endif`);
        result.push(`  auto staticData = std::make_unique<${lexerName}StaticData>(`);
        result.push(`    std::vector<std::string>{`);

        result.push(...this.renderList(lexer.ruleNames, { wrap: 65, indent: 6, quote: `"` }));

        result.push(`    },`);
        result.push(`    std::vector<std::string>{`);
        result.push(`      "DEFAULT_TOKEN_CHANNEL", "HIDDEN"`);
        result.push(`    },`);

        if (lexer.channelNames.length > 0) {
            result.push(...this.renderList(lexer.channelNames, { wrap: 65, indent: 2, quote: `"` }));
        }

        result.push(`    std::vector<std::string>{`);
        result.push(...this.renderList(lexer.modes, { wrap: 65, indent: 6, quote: `"` }));

        result.push(`    },`);
        result.push(`    std::vector<std::string>{`);
        result.push(...this.renderList(lexer.literalNames, { wrap: 65, indent: 6, null: `""` }));

        result.push(`    },`);
        result.push(`    std::vector<std::string>{`);

        result.push(...this.renderList(lexer.symbolicNames, { wrap: 65, indent: 6, null: `""` }));
        result.push(`    }`);
        result.push(`);`);

        result.push(...this.renderSerializedATN(lexer.atn));
        result.push(`  ${loweredGrammarName}LexerStaticData = std::move(staticData);`);
        result.push(`}`, ``);
        result.push(`}`);

        const baseClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]) : "antlr4::Lexer";
        result.push(``);
        result.push(`${lexerName}::${lexerName}(CharStream *input) : ${baseClass}(input) {`);
        result.push(`  ${lexerName}::initialize();`);
        result.push(`  _interpreter = new atn::LexerATNSimulator(this, *${loweredGrammarName}LexerStaticData->atn, ` +
            `${loweredGrammarName}LexerStaticData->decisionToDFA, ` +
            `${loweredGrammarName}LexerStaticData->sharedContextCache);`);
        result.push(`}`, "");
        result.push(`${lexerName}::~${lexerName}() {`);
        result.push(`  delete _interpreter;`);
        result.push(`}`, "");
        result.push(`std::string ${lexerName}::getGrammarFileName() const {`);
        result.push(`  return "${lexer.grammarFileName}";`);
        result.push(`}`, "");
        result.push(`const std::vector<std::string>& ${lexerName}::getRuleNames() const {`);
        result.push(`  return ${loweredGrammarName}LexerStaticData->ruleNames;`);
        result.push(`}`, "");
        result.push(`const std::vector<std::string>& ${lexerName}::getChannelNames() const {`);
        result.push(`  return ${loweredGrammarName}LexerStaticData->channelNames;`);
        result.push(`}`, "");
        result.push(`const std::vector<std::string>& ${lexerName}::getModeNames() const {`);
        result.push(`  return ${loweredGrammarName}LexerStaticData->modeNames;`);
        result.push(`}`, "");
        result.push(`const dfa::Vocabulary& ${lexerName}::getVocabulary() const {`);
        result.push(`  return ${loweredGrammarName}LexerStaticData->vocabulary;`);
        result.push(`}`, "");
        result.push(`antlr4::atn::SerializedATNView ${lexerName}::getSerializedATN() const {`);
        result.push(`  return ${loweredGrammarName}LexerStaticData->serializedATN;`);
        result.push(`}`, "");
        result.push(`const atn::ATN& ${lexerName}::getATN() const {`);
        result.push(`  return *${loweredGrammarName}LexerStaticData->atn;`);
        result.push(`}`);

        result.push(...this.renderAction(namedActions.get("definitions"), header));

        if (lexer.actionFuncs.size > 0) {
            result.push(``, ``);
            result.push(`void ${lexer.name}::action(RuleContext *context, size_t ruleIndex, size_t actionIndex) {`);
            result.push(`    switch (ruleIndex) {`);

            lexer.actionFuncs.forEach((f) => {
                result.push(`      case ${f.ruleIndex}: ${f.name}Action(antlrcpp::downCast<${f.ctxType} *>(context), ` +
                    `actionIndex); break;`);
            });

            result.push(``);
            result.push(`    default:`);
            result.push(`      break;`);
            result.push(`    }`);
            result.push(`}`);
        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(``);
            result.push(`bool ${lexer.name}::sempred(RuleContext *context, size_t ruleIndex, size_t predicateIndex) {`);
            result.push(`    switch (ruleIndex) {`);

            lexer.sempredFuncs.forEach((f) => {
                result.push(`    case ${f.ruleIndex}: return ${f.name}Sempred(antlrcpp::downCast<${f.ctxType} *>` +
                    `(context), predicateIndex);`);
            });

            result.push(``);
            result.push(`    default:`);
            result.push(`      break;`);
            result.push(`    }`);
            result.push(`    return true;`);
            result.push(`}`);
        }

        result.push(``);

        for (const [_, func] of lexer.actionFuncs) {
            result.push(...this.renderRuleActionFunction(func, header));
        }

        result.push(``);

        for (const [_, func] of lexer.sempredFuncs) {
            result.push(...this.renderRuleSempredFunction(func, header));
        }

        result.push(``);

        result.push(`void ${lexer.name}::initialize() {`);
        result.push(`#if ANTLR4_USE_THREAD_LOCAL_CACHE`);
        result.push(`  ${lexer.name.toLowerCase()}LexerInitialize();`);
        result.push(`#else`);
        result.push(`  ::antlr4::internal::call_once(${loweredGrammarName}LexerOnceFlag, ` +
            `${loweredGrammarName}LexerInitialize);`);
        result.push(`#endif`);

        result.push("}");

        return result;
    }

    private renderLexerHeader(lexer: OutputModelObjects.Lexer, namedActions: Map<string, OutputModelObjects.Action>,
        header: boolean, exportMacro?: string): Lines {

        const result: Lines = this.renderAction(namedActions.get("context"), header);

        const baseClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]) : "antlr4::Lexer";
        result.push(`class ${exportMacro ?? ""} ${lexer.name} : public ${baseClass} {`);
        result.push(`public:`);

        const block: Lines = [];
        if (lexer.tokens.size > 0) {
            block.push(`enum {`);
            block.push(...this.renderList(this.renderMap(lexer.tokens, 0, "${0} = ${1}"),
                { wrap: 67, indent: 2, separator: ", " }));
            block.push(`};`);

            result.push(...this.formatLines(block, 2));
        }

        if (lexer.escapedChannels.size > 0) {
            block.push(`enum {`);
            block.push(...this.renderList(this.renderMap(lexer.escapedChannels, 0, "${0} = ${1}"),
                { wrap: 67, indent: 2, separator: ", " }));
            block.push(`};`);

            result.push(...this.formatLines(block, 2));
        }

        if (lexer.escapedModeNames.length > 1) {
            block.push(`enum {`);
            const listedModes: string[] = [];
            lexer.escapedModeNames.forEach((m, i) => {
                listedModes.push(`  ${m} = ${i},`);
            });
            block.push(...this.renderList(listedModes, { wrap: 67, indent: 2, separator: "\n" }));
            block.push(`};`);

            result.push(...this.formatLines(block, 2));
        }

        result.push(`  explicit ${lexer.name}(antlr4::CharStream *input);`);
        result.push(``);
        result.push(`  ~${lexer.name}() override;`);
        result.push(``);
        result.push(...this.renderAction(namedActions.get("members"), header));
        result.push(``);
        result.push(`  std::string getGrammarFileName() const override;`);
        result.push(``);
        result.push(`  const std::vector<std::string>& getRuleNames() const override;`);
        result.push(``);
        result.push(`  const std::vector<std::string>& getChannelNames() const override;`);
        result.push(``);
        result.push(`  const std::vector<std::string>& getModeNames() const override;`);
        result.push(``);
        result.push(`  const antlr4::dfa::Vocabulary& getVocabulary() const override;`);
        result.push(``);
        result.push(`  antlr4::atn::SerializedATNView getSerializedATN() const override;`);
        result.push(``);
        result.push(`  const antlr4::atn::ATN& getATN() const override;`);
        result.push(``);

        if (lexer.actionFuncs.size > 0) {
            result.push(`  void action(antlr4::RuleContext *context, size_t ruleIndex, size_t actionIndex) override;`);
            result.push(``);
        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(`  bool sempred(antlr4::RuleContext *_localctx, size_t ruleIndex, size_t predicateIndex) ` +
                `override;`, ``);
        }

        result.push(`  // By default the static state used to implement the lexer is lazily initialized during ` +
            `the first`);
        result.push(`  // call to the constructor. You can call this function if you wish to initialize the ` +
            `static state`);
        result.push(`  // ahead of time.`);
        result.push(`  static void initialize();`);
        result.push(``);
        result.push(`private:`);
        result.push(...this.formatLines(this.renderAction(namedActions.get("declarations"), header), 4));
        result.push(``);
        result.push(`  // Individual action functions triggered by action() above.`);

        if (lexer.actionFuncs.size > 0) {
            lexer.actionFuncs.forEach((f) => {
                result.push(`  void ${f.name}Action(antlr4::RuleContext *context, size_t actionIndex);`);
            });
        }

        result.push(``);
        result.push(`  // Individual semantic predicate functions triggered by sempred() above.`);

        if (lexer.sempredFuncs.size > 0) {
            lexer.sempredFuncs.forEach((f) => {
                result.push(`  bool ${f.name}Sempred(antlr4::RuleContext *_localctx, size_t predicateIndex);`);
            });
        }

        result.push(`};`);

        return result;
    }

    private renderAddToLabelList(srcOp: OutputModelObjects.AddToLabelList, header: boolean): Lines {
        if (header) {
            return [];
        }

        return [`${srcOp.label}.push_back(${srcOp.listName});`];
    }

    private renderVisitorDispatchMethod(struct: OutputModelObjects.StructDecl, header: boolean): Lines {
        const derivedFromName = this.toTitleCase(struct.derivedFromName);

        const result: Lines = [];
        if (header) {
            result.push(``, `virtual std::any accept(antlr4::tree::ParseTreeVisitor *visitor) override;`);

            return result;
        }

        result.push(`std::any ${this.invariants.recognizerName}::${struct.escapedName}::accept(tree::` +
            `ParseTreeVisitor *visitor) {`);
        result.push(`  if (auto parserVisitor = dynamic_cast<${this.invariants.grammarName}Visitor*>(visitor))`);
        result.push(`    return parserVisitor->visit${derivedFromName}(this);`);
        result.push(`  else`);
        result.push(`    return visitor->visitChildren(this);`);
        result.push(`}`, ``);

        return result;
    }

    private renderListenerDispatchMethod(struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod, header: boolean): Lines {
        const derivedFromName = this.toTitleCase(struct.derivedFromName);

        const result: Lines = [];

        if (header) {
            const enterExit = method.isEnter ? "enter" : "exit";
            result.push(`virtual void ${enterExit}Rule(antlr4::tree::ParseTreeListener *listener) override;`);

            return result;
        }

        const enterExit = method.isEnter ? "enter" : "exit";
        result.push(`void ${this.invariants.recognizerName}::${struct.escapedName}::${enterExit}Rule(tree::` +
            `ParseTreeListener *listener) {`);
        result.push(`  auto parserListener = dynamic_cast<${this.invariants.grammarName}Listener *>(listener);`);
        result.push(`  if (parserListener != nullptr)`);
        result.push(`    parserListener->${enterExit}${derivedFromName}(this);`);
        result.push(`}`, ``);

        return result;
    }

    private renderAttributeDecl(d: OutputModelObjects.AttributeDecl, header: boolean): Lines {
        if (header) {
            return [`${d.type} ${d.escapedName}${d.initValue ? " = " + d.initValue : ""}`];
        }

        return [`${d.type} ${d.escapedName}`];
    }

    private renderCaptureNextToken(d: OutputModelObjects.CaptureNextToken, header: boolean): Lines {
        return [`${d.varName} = _input->LT(1);`];
    }

    private renderCaptureNextTokenType(srcOp: OutputModelObjects.CaptureNextTokenType, header: boolean): Lines {
        return [`${srcOp.varName} = _input->LA(1);`];
    }

    private renderCodeBlockForAlt(currentAltCodeBlock: OutputModelObjects.CodeBlockForAlt, header: boolean): Lines {
        const result: Lines = this.startRendering("CodeBlockForAlt");

        result.push(...this.renderDecls(currentAltCodeBlock.locals, header));
        result.push(...this.renderSourceOps(currentAltCodeBlock.preamble, header));
        result.push(...this.renderSourceOps(currentAltCodeBlock.ops, header));

        return this.endRendering("CodeBlockForAlt", result);
    }

    private renderCodeBlockForOuterMostAlt(currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt,
        header: boolean): Lines {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(`_localctx = _tracker.createInstance<${this.invariants.recognizerName}::` +
                `${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context>(_localctx);`);
        }

        result.push(`enterOuterAlt(_localctx, ${currentOuterMostAltCodeBlock.alt.altNum});`);
        result.push(...this.renderCodeBlockForAlt(currentOuterMostAltCodeBlock, header));

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    }

    private renderContextRuleGetterDecl(r: OutputModelObjects.ContextRuleGetterDecl, header: boolean): Lines {
        const result = this.startRendering("ContextRuleGetterDecl");

        if (header) {
            result.push(`${r.ctxName} *${r.escapedName}();`);

            return this.endRendering("ContextRuleGetterDecl", result);
        }

        result.push(`${this.invariants.recognizerName}::${r.ctxName}* ${this.invariants.recognizerName}::` +
            `${r.ctx.name}::${r.escapedName}() {`);
        result.push(`  return getRuleContext<${this.invariants.recognizerName}::${r.ctxName}>(0);`);
        result.push(`}`, ``);

        return this.endRendering("ContextRuleGetterDecl", result);
    }

    private renderContextRuleListGetterDecl(r: OutputModelObjects.ContextRuleListGetterDecl, header: boolean): Lines {
        const result = this.startRendering("ContextRuleListGetterDecl");

        if (header) {
            result.push(`std::vector<${r.ctxName} *> ${r.escapedName}();`);

            return this.endRendering("ContextRuleListGetterDecl", result);
        }

        result.push(`std::vector<${this.invariants.recognizerName}::${r.ctxName} *> ` +
            `${this.invariants.recognizerName}::${r.ctx.name}::${r.escapedName}() {`);
        result.push(`  return getRuleContexts<${this.invariants.recognizerName}::${r.ctxName}>();`);
        result.push(`}`, ``);

        return this.endRendering("ContextRuleListGetterDecl", result);
    }

    private renderContextTokenGetterDecl(t: OutputModelObjects.ContextTokenGetterDecl,
        header: boolean): Lines {
        const result = this.startRendering("ContextTokenGetterDecl");

        if (header) {
            result.push(`antlr4::tree::TerminalNode *${t.escapedName}();`);

            return this.endRendering("ContextTokenGetterDecl", result);
        }

        result.push(`tree::TerminalNode* ${this.invariants.recognizerName}::${t.ctx.name}::${t.escapedName}() {`);
        result.push(`  return getToken(${this.invariants.recognizerName}::${t.escapedName}, 0);`);
        result.push(`}`, ``);

        return this.endRendering("ContextTokenGetterDecl", result);
    }

    private renderContextTokenListGetterDecl(t: OutputModelObjects.ContextTokenListGetterDecl,
        header: boolean): Lines {
        const result = this.startRendering("ContextTokenListGetterDecl");

        if (header) {
            result.push(`std::vector<antlr4::tree::TerminalNode *> ${t.escapedName}();`);

            return this.endRendering("ContextTokenListGetterDecl", result);
        }

        result.push(`std::vector<tree::TerminalNode *> ${this.invariants.recognizerName}::${t.ctx.name}::` +
            `${t.escapedName}() {`);
        result.push(`  return getTokens(${this.invariants.recognizerName}::${t.escapedName});`);
        result.push(`}`, ``);

        return this.endRendering("ContextTokenListGetterDecl", result);
    }

    private renderContextTokenListIndexedGetterDecl(t: OutputModelObjects.ContextTokenListIndexedGetterDecl,
        header: boolean): Lines {
        const result = this.startRendering("ContextTokenListIndexedGetterDecl");

        if (header) {
            result.push(`antlr4::tree::TerminalNode* ${t.escapedName}(size_t i);`);

            return this.endRendering("ContextTokenListIndexedGetterDecl", result);
        }

        result.push(`tree::TerminalNode* ${this.invariants.recognizerName}::${t.ctx.name}::` +
            `${t.escapedName}(size_t i) {`);
        result.push(`  return getToken(${this.invariants.recognizerName}::${t.escapedName}, i);`);
        result.push(`}`, ``);

        return this.endRendering("ContextTokenListIndexedGetterDecl", result);
    }

    private renderContextRuleListIndexedGetterDecl(r: OutputModelObjects.ContextRuleListIndexedGetterDecl,
        header: boolean): Lines {
        const result = this.startRendering("ContextRuleListIndexedGetterDecl");

        if (header) {
            result.push(`${r.ctxName}* ${r.escapedName}(size_t i);`);

            return this.endRendering("ContextRuleListIndexedGetterDecl", result);
        }

        result.push(`${this.invariants.recognizerName}::${r.ctxName}* ${this.invariants.recognizerName}::` +
            `${r.ctx.name}::${r.escapedName}(size_t i) {`);
        result.push(`  return getRuleContext<${this.invariants.recognizerName}::${r.ctxName}>(i);`);
        result.push(`}`, ``);

        return this.endRendering("ContextRuleListIndexedGetterDecl", result);
    }

    private renderExceptionClause(srcOp: OutputModelObjects.ExceptionClause, header: boolean): Lines {
        const result = this.startRendering("ExceptionClause");

        result.push(`catch (${this.renderActionChunks(srcOp.catchArg.chunks)}) {`);
        result.push(...this.formatLines(this.renderAction(srcOp.catchAction, header), 4));
        result.push("}");

        return this.endRendering("ExceptionClause", result);
    }

    private renderDecls(decls: Iterable<OutputModelObjects.Decl>, header: boolean): Lines {
        const result: Lines = this.startRendering("Decls");

        for (const decl of decls) {
            const method = this.srcOpMap.get(decl.constructor as OutputModelObjectConstructor);
            if (method) {
                result.push(...method(decl, header));
            } else {
                throw new Error(`Unhandled source op type: ${decl.constructor.name}`);
            }
        }

        return this.endRendering("Decls", result);
    }

    private renderLL1AltBlock(choice: OutputModelObjects.LL1AltBlock, header: boolean): Lines {
        const result = this.startRendering("LL1AltBlock");

        result.push(`setState(${choice.stateNumber});`);
        result.push(`_errHandler->sync(this);`);

        if (choice.label) {
            result.push(`LL1AltBlock(choice, preamble, alts, error) ${this.renderLabelref(choice.label)} = ` +
                `_input->LT(1);`);
        }

        result.push(...this.renderSourceOps(choice.preamble, header));
        result.push(`switch (_input->LA(1)) {`);

        const block: Lines = [];
        for (let i = 0; i < choice.alts.length; ++i) {
            const tokens = choice.altLook[i];
            block.push(...this.renderCases(tokens));
            block[block.length - 1] += " {";

            const alt = choice.alts[i] as OutputModelObjects.CodeBlockForAlt | undefined;
            if (alt) {
                if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                    block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 2));
                } else {
                    block.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
                }
            }

            block.push(`  break;`);
            block.push(`}`);
        }

        result.push(...this.formatLines(block, 4));
        result.push(`  default:`);
        result.push(...this.formatLines(this.renderThrowNoViableAlt(choice.error, header), 4));
        result.push(`}`);

        return this.endRendering("LL1AltBlock", result);
    }

    private renderLL1OptionalBlock(choice: OutputModelObjects.LL1OptionalBlock,
        header: boolean): Lines {
        const result: Lines = [];
        result.push(`setState(${choice.stateNumber});`);

        result.push(`_errHandler->sync(this);`);
        result.push(`switch (_input->LA(1)) {`);

        const block: Lines = [];
        for (let i = 0; i < choice.altLook.length; ++i) {
            const tokens = choice.altLook[i];
            block.push(...this.formatLines(this.renderCases(tokens), 4));
            block[block.length - 1] += " {";

            const alt = choice.alts[i] as OutputModelObjects.CodeBlockForAlt | undefined;
            if (alt) {
                if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                    block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 2));
                } else {
                    block.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
                }
            }

            block.push(`    break;`);
            block.push(`}`);
        }

        result.push(...this.formatLines(block, 4));
        result.push(`default:`);
        result.push(`  break;`);
        result.push(`}`);

        return result;
    }

    private renderLL1OptionalBlockSingleAlt(choice: OutputModelObjects.LL1OptionalBlockSingleAlt,
        header: boolean): Lines {
        const result: Lines = this.startRendering("LL1OptionalBlockSingleAlt");

        result.push(`setState(${choice.stateNumber});`);
        result.push(`_errHandler->sync(this);`, ``);
        result.push(...this.renderSourceOps(choice.preamble, header));

        result.push(`if (${this.renderSourceOps([choice.expr], header).join("")}) {`);
        choice.alts.forEach((alt, index) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 4));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 4));
            }
        });
        result.push(`}`);

        return this.endRendering("LL1OptionalBlockSingleAlt", result);

    }

    private renderLL1StarBlockSingleAlt(choice: OutputModelObjects.LL1StarBlockSingleAlt,
        header: boolean): Lines {
        const result: Lines = this.startRendering("LL1StarBlockSingleAlt");

        result.push(`setState(${choice.stateNumber});`);
        result.push(`_errHandler->sync(this);`);

        result.push(...this.renderSourceOps(choice.preamble, header));

        const srcOps = choice.loopExpr ? [choice.loopExpr] : undefined;
        const rendered = this.renderSourceOps(srcOps, header);
        if (rendered.length === 1) {
            result.push(`while (${rendered.shift()}) {`);
        } else {
            result.push(`while (${rendered.shift()}`);
            result.push(...rendered);
            result.push(`) {`);
        }

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 2));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
            }
        });

        result.push(`  setState(${choice.loopBackStateNumber});`);
        result.push(`  _errHandler->sync(this);`);
        result.push(...this.formatLines(this.renderSourceOps(choice.iteration, header), 2));
        result.push(`}`);

        return this.endRendering("LL1StarBlockSingleAlt", result);
    }

    private renderLL1PlusBlockSingleAlt(choice: OutputModelObjects.LL1PlusBlockSingleAlt,
        header: boolean): Lines {
        const result: Lines = this.startRendering("LL1PlusBlockSingleAlt");

        result.push(`setState(${choice.blockStartStateNumber});`); // Alt lbock decision.
        result.push(`_errHandler->sync(this);`);

        result.push(...this.renderSourceOps(choice.preamble, header));

        result.push(`do {`);

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 2));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
            }
        });

        result.push(`    setState(${choice.stateNumber});`); // Loop back/exit decision.
        result.push(`    _errHandler->sync(this);`);
        result.push(...this.formatLines(this.renderSourceOps(choice.iteration, header), 2));

        const srcOps = choice.loopExpr ? [choice.loopExpr] : undefined;
        result.push(`} while (${this.renderSourceOps(srcOps, header).join("")});`);

        return this.endRendering("LL1PlusBlockSingleAlt", result);
    }

    private renderMatchToken(m: OutputModelObjects.MatchToken, header: boolean): Lines {
        const result: Lines = this.startRendering("MatchToken");

        result.push(`setState(${m.stateNumber});`);

        let line = "";
        if (m.labels.length > 0) {
            for (const l of m.labels) {
                line += `${this.renderLabelref(l)} = `;
            }
        }
        result.push(`${line}match(${this.invariants.recognizerName}::${m.escapedName});`);

        return this.endRendering("MatchToken", result);
    }

    private renderMatchSet(m: OutputModelObjects.MatchSet, header: boolean): Lines {
        return this.renderCommonSetStuff(m, false, header);
    }

    private renderMatchNotSet(m: OutputModelObjects.MatchNotSet, header: boolean): Lines {
        return this.renderCommonSetStuff(m, true, header);
    }

    private renderCommonSetStuff(m: OutputModelObjects.MatchSet, invert: boolean,
        header: boolean): Lines {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`setState(${m.stateNumber});`);

        if (m.labels.length > 0) {
            let labels = "";
            for (const l of m.labels) {
                labels += `${this.renderLabelref(l)} = `;
            }
            result.push(`${labels}_input->LT(1);`);
        }

        if (m.capture instanceof OutputModelObjects.CaptureNextTokenType) {
            result.push(this.renderCaptureNextTokenType(m.capture, header)[0]);
        } else {
            result.push(this.renderCaptureNextToken(m.capture, header)[0]);
        }

        if (invert) {
            result.push(`if (${m.expr.varName} <= 0 || ` +
                `${this.renderTestSetInline(m.expr, header).join("")}) {`);
        } else {
            result.push(`if (!(${this.renderTestSetInline(m.expr, header).join("")})) {`);
        }

        let labels = "";
        if (m.labels.length > 0) {
            for (const l of m.labels) {
                labels += `${this.renderLabelref(l)} = `;
            }
        }
        result.push(`    ${labels}_errHandler->recoverInline(this);`);

        result.push(`}`, `else {`);
        result.push(`  _errHandler->reportMatch(this);`);
        result.push(`  consume();`);
        result.push(`}`);

        return this.endRendering("CommonSetStuff", result);
    }

    private renderRuleContextDecl(srcOp: OutputModelObjects.RuleContextDecl,
        header: boolean): Lines {

        if (header) {
            return [`${this.invariants.recognizerName}::${srcOp.ctxName} *${srcOp.escapedName} = nullptr;`];
        }

        return [];
    }

    private renderRuleContextListDecl(rdecl: OutputModelObjects.RuleContextListDecl,
        header: boolean): Lines {

        if (header) {
            return [`std::vector<${rdecl.ctxName} *> ${rdecl.escapedName}`];
        }

        return [];
    }

    private renderStructDecl(struct: OutputModelObjects.StructDecl, header: boolean): Lines {
        const result = this.startRendering("StructDecl");

        if (header) {
            const result: Lines = [];

            const contextSuperClass = this.invariants.contextSuperClass.length > 0
                ? this.invariants.contextSuperClass
                : "antlr4::ParserRuleContext";

            result.push(`class ${this.defines?.exportMacro ?? ""} ${struct.escapedName} : public ` +
                `${contextSuperClass} {`);
            result.push(`public:`);

            result.push(...this.renderDecls(struct.attrs, header));

            const ctorAttrs = struct.ctorAttrs.map((a) => {
                return a.escapedName;
            }).join(", ");

            if (ctorAttrs.length > 0) {
                result.push(`  ${struct.escapedName}(antlr4::ParserRuleContext *parent, size_t invokingState);`);
            }

            result.push(`  ${struct.escapedName}(antlr4::ParserRuleContext *parent, size_t ` +
                `invokingState${ctorAttrs.length > 0 ? ", " + ctorAttrs : ""});`);

            if (struct.provideCopyFrom) {
                result.push(``, `  ${struct.escapedName}() = default;`);
                result.push(`  void copyFrom(${struct.escapedName} *context);`);
                result.push(`  using antlr4::ParserRuleContext::copyFrom;`, ``);
            }

            result.push(`  virtual size_t getRuleIndex() const override;`);
            result.push(...this.formatLines(this.renderDecls(struct.getters, header), 2));
            result.push(``);
            result.push(...this.formatLines(this.renderDispatchMethods(struct, header), 2));
            result.push(``, `};`, ``);

            return result;
        }

        result.push(`//----------------- ${struct.escapedName} -----------------------------------------------------` +
            `-------------`, ``);

        const contextSuperClass = this.invariants.contextSuperClass.length > 0
            ? this.invariants.contextSuperClass
            : "ParserRuleContext";
        if (struct.ctorAttrs.length > 0) {
            const attrs: string[] = [", "];
            for (const a of struct.ctorAttrs) {
                attrs.push(this.renderAttributeDecl(a, header).join(" "));
            }
            result.push(`${this.invariants.recognizerName}::${struct.escapedName}::${struct.escapedName}` +
                `(ParserRuleContext *parent, size_t invokingState${attrs.join(", ")})`);
        } else {
            result.push(`${this.invariants.recognizerName}::${struct.escapedName}::${struct.escapedName}(` +
                `ParserRuleContext *parent, size_t invokingState)`);
        }

        result.push(`  : ${contextSuperClass}(parent, invokingState) {`);

        struct.ctorAttrs.forEach((a) => {
            result.push(`  this->${a.escapedName} = ${a.escapedName};`);
        });

        result.push(`}`, ``);

        result.push(...this.renderDecls(struct.getters, header));

        result.push(``, `size_t ${this.invariants.recognizerName}::${struct.escapedName}::getRuleIndex() const {`);
        result.push(`  return ${this.invariants.recognizerName}::Rule${this.toTitleCase(struct.derivedFromName)};`);
        result.push(`}`, ``);

        if (struct.provideCopyFrom) {
            result.push(`void ${this.invariants.recognizerName}::${struct.escapedName}::` +
                `copyFrom(${struct.escapedName} *ctx) {`);
            result.push(`  ${contextSuperClass}::copyFrom(ctx);`);

            struct.ctorAttrs.forEach((a) => {
                result.push(`  this->${a.escapedName} = ctx->${a.escapedName};`);
            });

            result.push(`}`);
        }

        result.push(...this.renderDispatchMethods(struct, header));

        return this.endRendering("StructDecl", result);
    }

    private renderAltLabelStructDecl(currentRule: OutputModelObjects.RuleFunction,
        struct: OutputModelObjects.AltLabelStructDecl, header: boolean): Lines {
        const result = this.startRendering("AltLabelStructDecl");

        if (header) {
            result.push(``, `class ${this.defines?.exportMacro ?? ""} ${struct.escapedName} : public ` +
                this.toTitleCase(currentRule.name) + `Context {`);
            result.push(`public:`);
            result.push(`  ${struct.escapedName}(${this.toTitleCase(currentRule.name)}Context *ctx);`);
            result.push(``);

            result.push(...this.formatLines(this.renderDecls(struct.attrs, header), 2));
            result.push(...this.formatLines(this.renderDecls(struct.getters, header), 2));
            result.push(...this.formatLines(this.renderDispatchMethods(struct, header), 2));
            result.push(`};`);

            return this.endRendering("AltLabelStructDecl", result);
        }

        result.push(`//----------------- ${struct.escapedName} ------------------------------------------------------` +
            `------------`);
        result.push(``);

        if (struct.attrs.size > 0) {
            for (const attr of struct.attrs) {
                const method = this.srcOpMap.get(attr.constructor as OutputModelObjectConstructor);
                if (method) {
                    result.push(...method(attr, header));
                } else {
                    throw new Error(`Unhandled source op type: ${attr.constructor.name}`);
                }
            }
        }

        result.push(...this.renderDecls(struct.getters, header));

        result.push(`${this.invariants.recognizerName}::${struct.escapedName}::${struct.escapedName}(` +
            `${this.toTitleCase(currentRule.name)}Context *ctx) { copyFrom(ctx); }`, "");

        result.push(...this.renderDispatchMethods(struct, header));

        return this.endRendering("AltLabelStructDecl", result);
    }

    private renderTestSetInline(s: OutputModelObjects.TestSetInline, header: boolean): Lines {
        const result = this.startRendering("TestSetInline");

        const localLines: Lines = [];
        s.bitsets.forEach((bits, index) => {
            const rest = bits.tokens.length > 2 ? bits.tokens.slice(2) : [];
            if (rest.length > 0) {
                const comparison = this.renderBitsetBitfieldComparison(s, bits);
                localLines.push(...comparison);
            } else {
                localLines.push(this.renderBitsetInlineComparison(s, bits));
            }
        });

        // Special case: render all lines on a single line.
        result.push(localLines.join(" || "));

        return this.endRendering("TestSetInline", result);
    }

    /** Produces smaller bytecode only when `bits.ttypes` contains more than two items. */
    private renderBitsetBitfieldComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): Lines {
        const result = this.startRendering("BitsetBitfieldComparison");

        // To stay close to the old generator's output, we render the two lines as one with embedded line break.
        result.push(`(${this.renderTestShiftInRange(this.renderOffsetShiftVar(s.varName, bits.shift))}) &&\n` +
            `          ((1ULL << ${this.renderOffsetShiftVar(s.varName, bits.shift)}) & ${bits.calculated}) != 0)`);

        return this.endRendering("BitsetBitfieldComparison", result);
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `${s.varName} == ${this.invariants.recognizerName}::${t.name}`;
        }).join("\n\n  || ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        return offset > 0 ? `(${shiftAmount} - ${offset})` : shiftAmount;
    }

    private renderTestShiftInRange(shiftAmount: string): string {
        return `((${shiftAmount} & ~ 0x3fULL) == 0`;
    }

    private renderTokenDecl(t: OutputModelObjects.TokenDecl, header: boolean): Lines {
        if (header) {
            return [`antlr4::${this.invariants.tokenLabelType} *${t.escapedName} = nullptr;`];
        }

        return [];
    }

    private renderTokenTypeDecl(srcOp: OutputModelObjects.TokenTypeDecl, header: boolean): Lines {
        if (header) {
            return [];
        }

        return [`size_t ${srcOp.escapedName} = 0;`];
    }

    private renderTokenListDecl(t: OutputModelObjects.TokenListDecl, header: boolean): Lines {
        if (header) {
            return [`std::vector<antlr4::Token *> ${t.escapedName};`];
        }

        return [];
    }

    private renderThrowNoViableAlt(srcOp: OutputModelObjects.ThrowNoViableAlt, header: boolean): Lines {
        return ["throw NoViableAltException(this);"];
    }

    private renderWildcard(w: OutputModelObjects.Wildcard, header: boolean): Lines {
        const result: Lines = this.startRendering("Wildcard");

        result.push(`setState(${w.stateNumber});`);

        let lables = "";
        if (w.labels.length > 0) {
            for (const l of w.labels) {
                lables += `${this.renderLabelref(l)} = `;
            }
        }
        result.push(`${lables}matchWildcard();`);

        return result;;
    }

    private renderStarBlock(choice: OutputModelObjects.StarBlock, header: boolean): Lines {
        const result: Lines = this.startRendering("StarBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(`setState(${choice.stateNumber});`);
        result.push(`_errHandler->sync(this);`);
        result.push(`alt = getInterpreter<atn::ParserATNSimulator>()->adaptivePredict(_input, ${choice.decision}, ` +
            `_ctx);`);
        result.push(`while (alt != ${choice.exitAlt} && alt != atn::ATN::INVALID_ALT_NUMBER) {`);

        const block: Lines = [];
        block.push(`if (alt == 1${!blockAST.greedy ? " + 1" : ""}) {`);
        block.push(...this.formatLines(this.renderSourceOps(choice.iteration, header), 2));

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 4));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
            }
        });

        block.push(`}`);
        block.push(`setState(${choice.loopBackStateNumber});`);
        block.push(`_errHandler->sync(this);`);
        block.push(`alt = getInterpreter<atn::ParserATNSimulator>()->adaptivePredict(_input, ${choice.decision}, ` +
            `_ctx);`);

        result.push(...this.formatLines(block, 2));
        result.push(`}`);

        return this.endRendering("StarBlock", result);
    }

    private renderPlusBlock(choice: OutputModelObjects.PlusBlock, header: boolean): Lines {
        const result: Lines = this.startRendering("PlusBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(`setState(${choice.blockStartStateNumber});`); //  Alt block decision.
        result.push(`_errHandler->sync(this);`);
        result.push(`alt = 1${!blockAST.greedy ? " + 1" : ""};`);
        result.push(`do {`);

        const switchBlock: Lines = [];
        switchBlock.push(`switch (alt) {`);
        const caseBlock: Lines = [];

        for (let i = 0; i < choice.alts.length; ++i) {
            const alt = choice.alts[i];

            // Alt numbers are 1-based, so we add 1 to the index.
            caseBlock.push(`case ${i + 1}${!blockAST.greedy ? " + 1" : ""}: {`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                caseBlock.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 2));
            } else {
                caseBlock.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
            }
            caseBlock.push(`  break;`);
            caseBlock.push(`}`);
        }

        caseBlock.push("");
        caseBlock.push(`default:`);
        caseBlock.push(...this.formatLines(this.renderThrowNoViableAlt(choice.error, header), 2));

        switchBlock.push(...this.formatLines(caseBlock, 2));
        switchBlock.push(`}`);

        switchBlock.push(`setState(${choice.loopBackStateNumber});`); // Loopback/exit decision.
        switchBlock.push(`_errHandler->sync(this);`);
        switchBlock.push(`alt = getInterpreter<atn::ParserATNSimulator>()->adaptivePredict(_input, ` +
            `${choice.decision}, _ctx);`);

        result.push(...this.formatLines(switchBlock, 4));
        result.push(`} while (alt != ${choice.exitAlt} && alt != atn::ATN::INVALID_ALT_NUMBER);`);

        return this.endRendering("PlusBlock", result);
    }

    private renderOptionalBlock(choice: OutputModelObjects.OptionalBlock,
        header: boolean): Lines {
        const result: Lines = this.startRendering("OptionalBlock");

        result.push(`setState(${choice.stateNumber});`);
        result.push(`_errHandler->sync(this);`, ``);
        result.push(`switch (getInterpreter<atn::ParserATNSimulator>()->adaptivePredict(_input, ${choice.decision}, ` +
            `_ctx)) {`);

        const block: Lines = [];
        const blockAST = choice.ast as OptionalBlockAST;
        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            block.push(`  case ${index + 1}${!blockAST.greedy ? " + 1" : ""}: {`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 2));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
            }
            block.push(`  break;`);
            block.push(`}`);
        });

        result.push(...this.formatLines(block, 2));
        result.push(`default:`, `  break;`, `}`);

        return this.endRendering("OptionalBlock", result);
    }

    private renderAltBlock(choice: OutputModelObjects.AltBlock, header: boolean): Lines {
        const result: Lines = this.startRendering("AltBlock");

        result.push(`setState(${choice.stateNumber});`);
        result.push(`_errHandler->sync(this);`);

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = _input->LT(1);`);
        }

        result.push(...this.renderSourceOps(choice.preamble, header));
        result.push(`switch (getInterpreter<atn::ParserATNSimulator>()->adaptivePredict(_input, ` +
            `${choice.decision}, _ctx)) {`);

        const block: Lines = [];
        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            block.push(`case ${index + 1}: {`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt, header), 2));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(alt, header), 2));
            }
            block.push(`  break;`);
            block.push(`}`);
        });
        block.push("", "default:", "  break;");

        result.push(...this.formatLines(block, 2));
        result.push(`}`);

        return this.endRendering("AltBlock", result);
    }

    private renderInvokeRule(r: OutputModelObjects.InvokeRule, header: boolean): Lines {
        const result: Lines = this.startRendering("InvokeRule");

        result.push(`setState(${r.stateNumber});`);

        let labels = "";
        if (r.labels.length > 0) {
            for (const l of r.labels) {
                labels += `${this.renderLabelref(l)} = `;
            }
        }

        let args = "";
        const ast = r.ast as GrammarASTWithOptions | undefined;
        const precedence = ast?.getOptionString("p");
        if (precedence) {
            args += precedence;

            if (r.argExprsChunks) {
                args += ", " + this.renderActionChunks(r.argExprsChunks);
            }
        }

        result.push(`${labels}${r.escapedName}(${args});`);

        return this.endRendering("InvokeRule", result);
    }

    private renderSemPred(p: OutputModelObjects.SemPred, header: boolean): Lines {
        const result: Lines = this.startRendering("SemPred");

        result.push(`setState(${p.stateNumber});`, ``);

        const chunks = this.renderActionChunks(p.chunks);
        const failChunks = this.renderActionChunks(p.failChunks);
        result.push(`if (!(${chunks})) throw FailedPredicateException(this, ` +
            `${p.predicate}${failChunks.length > 0 ? failChunks + ", " : (p.msg ? p.msg + ", " : "")});`);

        return this.endRendering("SemPred", result);
    }

    private renderAction(srcOp: OutputModelObjects.Action | undefined, header: boolean): Lines {
        if (!srcOp) {
            return [];
        }

        const result: Lines = [];
        result.push(...this.renderActionChunks(srcOp.chunks));

        return result;
    }

    private renderRuleActionFunction(r: OutputModelObjects.RuleActionFunction, header: boolean): Lines {
        const result = this.startRendering("RuleActionFunction");

        result.push(`void ${this.invariants.grammarName}::${r.name}Action(${r.ctxType} *context, size_t ` +
            `actionIndex) {`);
        result.push(`  switch (actionIndex) {`);

        for (const [index, action] of r.actions) {
            result.push(`    case ${index}: ${this.renderAction(action, header).join(" ")} break;`);
        }

        result.push(``);
        result.push(`  default:`);
        result.push(`    break;`);
        result.push(`  }`);
        result.push(`}`, ``);

        return this.endRendering("RuleActionFunction", result);
    }

    private renderRuleSempredFunction(r: OutputModelObjects.RuleSempredFunction, header: boolean): Lines {
        const result = this.startRendering("RuleSempredFunction");

        if (header) {
            result.push(`bool ${r.name}Sempred(${r.ctxType} *_localctx, size_t predicateIndex);`);

            return this.endRendering("RuleSempredFunction", result);
        }

        result.push(`bool ${this.invariants.recognizerName}::${r.name}Sempred(${r.ctxType} *_localctx, size_t ` +
            `predicateIndex) {`);
        result.push(`  switch (predicateIndex) {`);

        for (const [index, action] of r.actions) {
            result.push(`    case ${index}: return ${this.renderAction(action, header).join("").trimStart()};`);
        }

        result.push(``);
        result.push(`  default:`);
        result.push(`    break;`);
        result.push(`  }`);
        result.push(`  return true;`);
        result.push(`}`, ``);

        return this.endRendering("RuleSempredFunction", result);
    }

    private renderSerializedATN(model: OutputModelObjects.SerializedATN): Lines {
        const result = this.startRendering("SerializedATN");

        result.push(`  static const int32_t serializedATNSegment[] = {`);
        result.push(...this.renderList(model.serialized, { wrap: 68, indent: 4, separator: "," }));
        result.push(`  };`);
        result.push(`  staticData->serializedATN = antlr4::atn::SerializedATNView(serializedATNSegment, ` +
            `sizeof(serializedATNSegment) / sizeof(serializedATNSegment[0]));`);
        result.push(``);
        result.push(`  antlr4::atn::ATNDeserializer deserializer;`);
        result.push(`  staticData->atn = deserializer.deserialize(staticData->serializedATN);`);
        result.push(``);
        result.push(`  const size_t count = staticData->atn->getNumberOfDecisions();`);
        result.push(`  staticData->decisionToDFA.reserve(count);`);
        result.push(`  for (size_t i = 0; i < count; i++) {`);
        result.push(`    staticData->decisionToDFA.emplace_back(staticData->atn->getDecisionState(i), i);`);
        result.push(`  }`);

        return this.endRendering("SerializedATN", result);
    }

    /**
     * This method is part of the automated rendering of action chunks.
     *
     * @param t The ActionText chunk to render.
     *
     * @returns Lines representing the action text.
     */
    private renderActionText(t: OutputModelObjects.ActionText): Lines {
        return t.text ?? [];
    }

    /**
     * Watch out, we have two methods with the same name but different casing!
     * `renderLabelRef` renders LabelRef action chunks.
     *
     * @param t The LabelRef to render.
     *
     * @returns Lines representing the labelref.
     */
    private renderLabelRef(t: OutputModelObjects.LabelRef): Lines {
        const result = [this.renderContext(t) + `->${t.escapedName}`];

        return result;
    }

    /**
     * Watch out, we have two methods with the same name but different casing!
     * `renderLabelref` renders labels (actually Decls) which are not action chunks.
     *
     * @param t The Decl to render as labelref.
     *
     * @returns Lines representing the labelref.
     */
    private renderLabelref(t: OutputModelObjects.Decl): Lines {
        let line = "";
        if (!t.isLocal) {
            line = `antlrcpp::downCast<${t.ctx.name} *>(_localctx)->`;
        }

        return [line + t.escapedName];
    }

    private renderCases(tokens: OutputModelObjects.ITokenInfo[]): Lines {
        const result: Lines = this.startRendering("Cases");

        for (const t of tokens) {
            result.push(`case ${this.invariants.recognizerName}::${t.name}:`);
        }

        return this.endRendering("Cases", result);
    }

    private renderDispatchMethods(struct: OutputModelObjects.StructDecl, header: boolean): Lines {
        const result: Lines = [];

        for (const method of struct.dispatchMethods) {
            if (method instanceof OutputModelObjects.VisitorDispatchMethod) {
                result.push(...this.renderVisitorDispatchMethod(struct, header));
            } else if (method instanceof OutputModelObjects.ListenerDispatchMethod) {
                result.push(...this.renderListenerDispatchMethod(struct, method, header));
            }
        }

        return result;
    }

    // Lexer command methods
    private renderLexerSkipCommand = (): Lines => {
        return ["skip();"];
    };

    private renderLexerMoreCommand = (): Lines => {
        return ["more();"];
    };

    private renderLexerPopModeCommand = (): Lines => {
        return ["popMode();"];
    };

    private renderLexerTypeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`setType(${arg});`];
    };

    private renderLexerChannelCommand = (arg: string, grammar: Grammar): Lines => {
        return [`setChannel(${arg});`];
    };

    private renderLexerModeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`setMode(${arg});`];
    };

    private renderLexerPushModeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`pushMode(${arg});`];
    };

}
