/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// Swift target generator - based on the Swift.stg template of ANTLR4.

// cspell: ignore associatedtype deinit typealias nonmutating castdown precpred sempred

import * as OutputModelObjects from "../codegen/model/index.js";

import { GeneratorBase, type NamedActions } from "../codegen/GeneratorBase.js";
import type { CodePoint, ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { TokenPropertyRef } from "../codegen/model/chunk/TokenPropertyRef.js";
import type { IGenerationOptions } from "../config/config.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import { antlrVersion } from "../version.js";

export class SwiftTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.swift";
    public readonly version = "1.0.0";

    public readonly language = "Swift";
    public readonly languageSpecifiers = ["swift"];

    public override readonly codeFileExtension = ".swift";

    public override readonly lexerRuleContext = "RuleContext";

    public override readonly wantsBaseListener = true;
    public override readonly wantsBaseVisitor = true;
    public override readonly supportsOverloadedMethods = true;
    public override readonly isATNSerializedAsInts = true;
    public override readonly inlineTestSetWordSize = 64;

    public override readonly reservedWords = new Set([
        "associatedtype", "class", "deinit", "enum", "extension", "func", "import", "init", "inout", "internal",
        "let", "operator", "private", "protocol", "public", "static", "struct", "subscript", "typealias", "var",
        "break", "case", "continue", "default", "defer", "do", "else", "fallthrough", "for", "guard", "if",
        "in", "repeat", "return", "switch", "where", "while",
        "as", "catch", "dynamicType", "false", "is", "nil", "rethrows", "super", "self", "Self", "throw", "throws",
        "true", "try", "__COLUMN__", "__FILE__", "__FUNCTION__", "__LINE__", "#column", "#file", "#function", "#line",
        "_", "#available", "#else", "#elseif", "#endif", "#if", "#selector",
        "associativity", "convenience", "dynamic", "didSet", "final", "get", "infix", "indirect", "lazy",
        "left", "mutating", "none", "nonmutating", "optional", "override", "postfix", "precedence",
        "prefix", "Protocol", "required", "right", "set", "Type", "unowned", "weak", "willSet",

        "rule", "parserRule",
    ]);

    /**
     * The ANTLR version the Swift runtime is checked against (`RuntimeMetaData.checkVersion`). The runtime prints
     * a warning when the major/minor version of the generating tool differs from its own, so we pass the ANTLR
     * version the runtime was built for, not the antlr-ng version.
     */
    private static readonly runtimeVersion = "4.13.2";

    /** The line width used for wrapping long lists (tokens, rule names, serialized ATN). */
    private static readonly lineWidth = 72;

    /** Maps the ANTLR attribute types to Swift types. Unknown types are used as they are. */
    private static readonly typeMap = new Map<string, string>([
        ["int", "Int"],
        ["float", "Float"],
        ["long", "Int64"],
        ["double", "Double"],
        ["bool", "Bool"],
        ["boolean", "Bool"],
    ]);

    private escapeMap: Map<CodePoint, string>;

    /** The value of the `accessLevel` grammar option of the file currently being rendered (if any). */
    private accessLevel?: string;

    public constructor(logRendering = false) {
        super(logRendering);

        // https://docs.swift.org/swift-book/documentation/the-swift-programming-language/stringsandcharacters/
        this.escapeMap = new Map(GeneratorBase.defaultCharValueEscape);
        this.escapeMap.set(0, "\\0");
    }

    public renderParserFile = (parserFile: OutputModelObjects.ParserFile, declaration: boolean,
        options: IGenerationOptions): string => {
        const parser = parserFile.parser;
        this.invariants.recognizerName = parser.name;
        this.invariants.grammarName = parser.grammarName;
        this.invariants.grammarFileName = parser.grammarFileName;
        this.invariants.tokenLabelType = this.mapType(parserFile.TokenLabelType ?? "Token");
        this.invariants.packageName = options.package;
        this.invariants.contextSuperClass = parserFile.contextSuperClass
            ? this.renderActionChunks([parserFile.contextSuperClass]).join("") : undefined;
        this.accessLevel = parserFile.accessLevel ?? parser.accessLevel;

        const result: Lines = this.renderFileHeader(parserFile);
        result.push(
            ...this.renderAction(parserFile.namedActions.get("header")),
            `import Antlr4`,
            ``,
        );

        this.append(result, this.renderParser(parser, parserFile.namedActions));

        return this.finish(result);
    };

    public renderLexerFile = (lexerFile: OutputModelObjects.LexerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        const lexer = lexerFile.lexer;
        this.invariants.recognizerName = lexer.name;
        this.invariants.grammarName = lexer.grammarName;
        this.invariants.grammarFileName = lexer.grammarFileName;
        this.invariants.tokenLabelType = this.mapType(lexerFile.TokenLabelType ?? "Token");
        this.invariants.packageName = options.package;
        this.accessLevel = lexerFile.accessLevel ?? lexer.accessLevel;

        const result: Lines = this.renderFileHeader(lexerFile);
        result.push(
            ...this.renderAction(lexerFile.namedActions.get("header")),
            `import Antlr4`,
            ``,
        );

        this.append(result, this.renderLexer(lexer, lexerFile.namedActions));

        return this.finish(result);
    };

    public renderListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = listenerFile.grammarName;
        this.invariants.grammarFileName = listenerFile.grammarFileName;
        this.accessLevel = listenerFile.accessLevel;

        const grammarName = listenerFile.grammarName;
        const parserName = listenerFile.parserName;
        const result: Lines = this.renderFileHeader(listenerFile);

        result.push(
            ...this.renderAction(listenerFile.header),
            `import Antlr4`,
            ``,
            `/**`,
            ` * This interface defines a complete listener for a parse tree produced by`,
            ` * {@link ${parserName}}.`,
            ` */`,
            `${this.publicLevel} protocol ${grammarName}Listener: ParseTreeListener {`,
        );

        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            const ruleName = listenerFile.listenerLabelRuleNames.get(lname);
            const block: Lines = [`/**`];

            if (ruleName) {
                block.push(
                    ` * Enter a parse tree produced by the {@code ${lname}}`,
                    ` * labeled alternative in {@link ${parserName}#${ruleName}}.`,
                );
            } else {
                block.push(` * Enter a parse tree produced by {@link ${parserName}#${lname}}.`);
            }

            block.push(
                ` - Parameters:`,
                `   - ctx: the parse tree`,
                ` */`,
                `func enter${name}(_ ctx: ${parserName}.${name}Context)`,
                `/**`,
            );

            if (ruleName) {
                block.push(
                    ` * Exit a parse tree produced by the {@code ${lname}}`,
                    ` * labeled alternative in {@link ${parserName}#${ruleName}}.`,
                );
            } else {
                block.push(` * Exit a parse tree produced by {@link ${parserName}#${lname}}.`);
            }

            block.push(
                ` - Parameters:`,
                `   - ctx: the parse tree`,
                ` */`,
                `func exit${name}(_ ctx: ${parserName}.${name}Context)`,
            );

            result.push(...this.indent(block));
        }

        result.push(`}`);

        return this.finish(result);
    };

    public renderBaseListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = listenerFile.grammarName;
        this.invariants.grammarFileName = listenerFile.grammarFileName;
        this.accessLevel = listenerFile.accessLevel;

        const grammarName = listenerFile.grammarName;
        const parserName = listenerFile.parserName;
        const result: Lines = this.renderFileHeader(listenerFile);

        result.push(
            ...this.renderAction(listenerFile.header),
            ``,
            `import Antlr4`,
            ``,
            ``,
            `/**`,
            ` * This class provides an empty implementation of {@link ${grammarName}Listener},`,
            ` * which can be extended to create a listener which only needs to handle a subset`,
            ` * of the available methods.`,
            ` */`,
            `${this.openLevel} class ${grammarName}BaseListener: ${grammarName}Listener {`,
            `\t${this.publicLevel} init() { }`,
        );

        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            const block: Lines = [
                ``,
                `/**`,
                ` * {@inheritDoc}`,
                ` *`,
                ` * <p>The default implementation does nothing.</p>`,
                ` */`,
                `${this.openLevel} func enter${name}(_ ctx: ${parserName}.${name}Context) { }`,
                `/**`,
                ` * {@inheritDoc}`,
                ` *`,
                ` * <p>The default implementation does nothing.</p>`,
                ` */`,
                `${this.openLevel} func exit${name}(_ ctx: ${parserName}.${name}Context) { }`,
            ];

            result.push(...this.indent(block));
        }

        const inheritDoc = [
            `/**`,
            ` * {@inheritDoc}`,
            ` *`,
            ` * <p>The default implementation does nothing.</p>`,
            ` */`,
        ];

        result.push(
            ``,
            ...this.indent([
                ...inheritDoc,
                `${this.openLevel} func enterEveryRule(_ ctx: ParserRuleContext) throws { }`,
                ...inheritDoc,
                `${this.openLevel} func exitEveryRule(_ ctx: ParserRuleContext) throws { }`,
                ...inheritDoc,
                `${this.openLevel} func visitTerminal(_ node: TerminalNode) { }`,
                ...inheritDoc,
                `${this.openLevel} func visitErrorNode(_ node: ErrorNode) { }`,
            ]),
            `}`,
        );

        return this.finish(result);
    };

    public renderVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;
        this.accessLevel = visitorFile.accessLevel;

        const grammarName = visitorFile.grammarName;
        const parserName = visitorFile.parserName;
        const result: Lines = this.renderFileHeader(visitorFile);

        result.push(
            ...this.renderAction(visitorFile.header),
            `import Antlr4`,
            ``,
            `/**`,
            ` * This interface defines a complete generic visitor for a parse tree produced`,
            ` * by {@link ${parserName}}.`,
            ` *`,
            ` * @param <T> The return type of the visit operation. Use {@link Void} for`,
            ` * operations with no return type.`,
            ` */`,
            `${this.openLevel} class ${grammarName}Visitor<T>: ParseTreeVisitor<T> {`,
        );

        const names = Array.from(visitorFile.visitorNames);
        names.forEach((lname, index) => {
            const name = this.toTitleCase(lname);
            const ruleName = visitorFile.visitorLabelRuleNames.get(lname);
            const block: Lines = [`/**`];

            if (ruleName) {
                block.push(
                    ` * Visit a parse tree produced by the {@code ${lname}}`,
                    ` * labeled alternative in {@link ${parserName}#${ruleName}}.`,
                );
            } else {
                block.push(` * Visit a parse tree produced by {@link ${parserName}#${lname}}.`);
            }

            block.push(
                `- Parameters:`,
                `  - ctx: the parse tree`,
                `- returns: the visitor result`,
                ` */`,
                `${this.openLevel} func visit${name}(_ ctx: ${parserName}.${name}Context) -> T {`,
                `\tfatalError(#function + " must be overridden")`,
                `}`,
            );

            result.push(...this.indent(block));
            if (index < names.length - 1) {
                result.push(``);
            }
        });

        result.push(`}`);

        return this.finish(result);
    };

    public renderBaseVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;
        this.accessLevel = visitorFile.accessLevel;

        const grammarName = visitorFile.grammarName;
        const parserName = visitorFile.parserName;
        const result: Lines = this.renderFileHeader(visitorFile);

        result.push(
            ...this.renderAction(visitorFile.header),
            `import Antlr4`,
            ``,
            `/**`,
            ` * This class provides an empty implementation of {@link ${grammarName}Visitor},`,
            ` * which can be extended to create a visitor which only needs to handle a subset`,
            ` * of the available methods.`,
            ` *`,
            ` * @param <T> The return type of the visit operation. Use {@link Void} for`,
            ` * operations with no return type.`,
            ` */`,
            `${this.openLevel} class ${grammarName}BaseVisitor<T>: AbstractParseTreeVisitor<T> {`,
        );

        for (const lname of visitorFile.visitorNames) {
            const name = this.toTitleCase(lname);
            const block: Lines = [
                `/**`,
                ` * {@inheritDoc}`,
                ` *`,
                ` * <p>The default implementation returns the result of calling`,
                ` * {@link #visitChildren} on {@code ctx}.</p>`,
                ` */`,
                `${this.openLevel} func visit${name}(_ ctx: ${parserName}.${name}Context) -> T? ` +
                `{ return visitChildren(ctx) }`,
            ];

            result.push(...this.indent(block));
        }

        result.push(`}`);

        return this.finish(result);
    };

    // Note: the rec rule helpers return a single line with embedded line breaks, because their result is
    // run through the action translator, which concatenates all lines.
    public renderRecRuleReplaceContext = (ctxName: string): Lines => {
        return [
            `_localctx = ${ctxName}Context(_localctx)\n` +
            `_ctx = _localctx\n` +
            `_prevctx = _localctx`,
        ];
    };

    public renderRecRuleAltPredicate = (ruleName: string, opPrec: number): Lines => {
        return [
            `precpred(_ctx, ${opPrec})`,
        ];
    };

    public renderRecRuleSetReturnAction = (src: string, name: string): Lines => {
        return [
            `$${name} = $${src}.${name}`,
        ];
    };

    public renderRecRuleSetStopToken = (): Lines => {
        return [
            `_ctx!.stop = try _input.LT(-1)`,
        ];
    };

    public renderRecRuleSetPrevCtx = (): Lines => {
        return [
            `if _parseListeners != nil {\n` +
            `\ttry triggerExitRuleEvent()\n` +
            `}\n` +
            `_prevctx = _localctx`,
        ];
    };

    public renderRecRuleLabeledAltStartAction = (parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const altContext = `${this.toTitleCase(currentAltLabel)}Context`;
        const result: Lines = [
            `_localctx = ${altContext}(${this.toTitleCase(ruleName)}Context(_parentctx, _parentState))`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`(_localctx as! ${altContext}).${label}.append(_prevctx)`);
            } else {
                result.push(`(_localctx as! ${altContext}).${label} = _prevctx`);
            }
        }

        result.push(`try pushNewRecursionContext(_localctx, _startState, ${parserName}.RULE_${ruleName})`);

        return [result.join("\n")];
    };

    public renderRecRuleAltStartAction = (parserName: string, ruleName: string, ctxName: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [
            `_localctx = ${this.toTitleCase(ctxName)}Context(_parentctx, _parentState)`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`_localctx.${label}.append(_prevctx)`);
            } else {
                result.push(`_localctx.${label} = _prevctx`);
            }
        }

        result.push(`try pushNewRecursionContext(_localctx, _startState, ${parserName}.RULE_${ruleName})`);

        return [result.join("\n")];
    };

    public renderTestFile = (grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string => {
        const result: Lines = [
            `import Antlr4`,
            `import Foundation`,
            ``,
        ];

        if (parserName !== undefined) {
            result.push(
                `class TreeShapeListener: ParseTreeListener {`,
                `    func visitTerminal(_ node: TerminalNode) { }`,
                `    func visitErrorNode(_ node: ErrorNode) { }`,
                `    func enterEveryRule(_ ctx: ParserRuleContext) throws { }`,
                `    func exitEveryRule(_ ctx: ParserRuleContext) throws {`,
                `        for i in 0..<ctx.getChildCount() {`,
                `            let parent = ctx.getChild(i)?.getParent()`,
                `            if (!(parent is RuleNode) || (parent as! RuleNode).getRuleContext() !== ctx) {`,
                `                throw ANTLRError.illegalState(msg: "Invalid parse tree shape detected.")`,
                `            }`,
                `        }`,
                `    }`,
                `}`,
                ``,
            );
        }

        result.push(
            `let args = CommandLine.arguments`,
            `let input = try ANTLRFileStream(args[1])`,
            `let lex = ${lexerName}(input)`,
            `let tokens = CommonTokenStream(lex)`,
        );

        if (parserName !== undefined) {
            result.push(`let parser = try ${parserName}(tokens)`);

            if (showDiagnosticErrors) {
                result.push(`parser.addErrorListener(DiagnosticErrorListener())`);
            }

            if (profile) {
                result.push(
                    `let profiler = ProfilingATNSimulator(parser)`,
                    `parser.setInterpreter(profiler)`,
                );
            }

            result.push(`parser.getInterpreter().setPredictionMode(PredictionMode.${predictionMode})`);

            if (!buildParseTree) {
                result.push(`parser.setBuildParseTree(false)`);
            }

            result.push(`let tree = try parser.${parserStartRuleName ?? ""}()`);

            if (profile) {
                result.push(`print(profiler.getDecisionInfo().description)`);
            }

            result.push(`try ParseTreeWalker.DEFAULT.walk(TreeShapeListener(), tree)`);
        } else {
            result.push(
                `try tokens.fill()`,
                `for t in tokens.getTokens() {`,
                `    print(t)`,
                `}`,
            );

            if (showDFA) {
                result.push(`print(lex.getInterpreter().getDFA(Lexer.DEFAULT_MODE).toLexerString(), terminator: "")`);
            }
        }

        return this.finish(result);
    };

    public override get charValueEscapeMap(): Map<CodePoint, string> {
        return this.escapeMap;
    }

    public override renderImplicitTokenLabel(tokenName: string): string {
        return `_${tokenName}`;
    }

    public override renderImplicitRuleLabel(ruleName: string): string {
        return `_${ruleName}`;
    }

    protected override escapeWord(word: string): string {
        return "`" + word + "`";
    }

    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [
            `// Generated from ${file.grammarFileName} by antlr-ng ${antlrVersion}. Do not edit!`,
            ``,
        ];
    }

    protected override renderTypedContext = (ctx: OutputModelObjects.StructDecl): string => {
        return `_localctx.castdown(${ctx.name}.self)`;
    };

    protected override renderRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.RuleFunction): Lines => {
        const result = this.startRendering("RuleFunction");

        this.append(result, this.renderStructDecl(currentRule.ruleCtx));
        currentRule.altLabelCtxs?.forEach((ctx) => {
            this.append(result, this.renderAltLabelStructDecl(currentRule, ctx));
        });

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") : this.openLevel;
        const ctxType = currentRule.ctxType;
        const parserName = this.invariants.recognizerName;

        result.push(
            `@discardableResult`,
            `${modifiers} func ${currentRule.escapedName}(${this.renderArgs(currentRule.args)}) throws -> ` +
            `${ctxType} {`,
            `\tvar _localctx: ${ctxType}`,
            `\t_localctx = ${ctxType}(_ctx, getState()${this.renderCallArgs(currentRule.args)})`,
            `\ttry enterRule(_localctx, ${currentRule.startState.stateNumber}, ${parserName}.RULE_` +
            `${currentRule.name})`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ...this.indent(this.renderLocals(currentRule)),
            `\tdefer {`,
            ...this.indent(this.renderAction(currentRule.finallyAction), 2),
            `\t\ttry! exitRule()`,
            `\t}`,
            `\tdo {`,
        );

        if (currentRule.hasLookaheadBlock) {
            result.push(`\t\tvar _alt: Int`);
        }

        result.push(
            ...this.indent(this.renderRuleBody(currentRule), 2),
            `\t}`,
        );

        if (currentRule.exceptions && currentRule.exceptions.length > 0) {
            for (const e of currentRule.exceptions) {
                result.push(...this.indent(this.renderExceptionClause(e)));
            }
        } else {
            result.push(
                `\tcatch ANTLRException.recognition(let re) {`,
                `\t\t_localctx.exception = re`,
                `\t\t_errHandler.reportError(self, re)`,
                `\t\ttry _errHandler.recover(self, re)`,
                `\t}`,
            );
        }

        result.push(
            ``,
            `\treturn _localctx`,
            `}`,
            ``,
        );

        return this.endRendering("RuleFunction", result);
    };

    protected override renderLeftRecursiveRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.LeftRecursiveRuleFunction): Lines => {
        const result = this.startRendering("LeftRecursiveRuleFunction");

        this.append(result, this.renderStructDecl(currentRule.ruleCtx));
        currentRule.altLabelCtxs?.forEach((ctx) => {
            this.append(result, this.renderAltLabelStructDecl(currentRule, ctx));
        });

        const modifiers = currentRule.modifiers.length > 0
            ? currentRule.modifiers.join(" ")
            : `${this.publicLevel} final`;
        const ctxType = currentRule.ctxType;
        const parserName = this.invariants.recognizerName;
        const args = this.renderArgs(currentRule.args);
        const callArgs = this.renderCallArgs(currentRule.args);
        const startState = currentRule.startState.stateNumber;

        result.push(
            ``,
            `${modifiers} func ${currentRule.escapedName}(${args}) throws -> ${ctxType} {`,
            `\treturn try ${currentRule.escapedName}(0${callArgs})`,
            `}`,
            `@discardableResult`,
            `private func ${currentRule.escapedName}(_ _p: Int${args.length > 0 ? ", " + args : ""}) throws -> ` +
            `${ctxType} {`,
            `\tlet _parentctx: ParserRuleContext? = _ctx`,
            `\tlet _parentState: Int = getState()`,
            `\tvar _localctx: ${ctxType}`,
            `\t_localctx = ${ctxType}(_ctx, _parentState${callArgs})`,
            `\tvar _prevctx: ${ctxType} = _localctx`,
            `\tlet _startState: Int = ${startState}`,
            `\ttry enterRecursionRule(_localctx, ${startState}, ${parserName}.RULE_${currentRule.name}, _p)`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ...this.indent(this.renderLocals(currentRule)),
            `\tdefer {`,
            ...this.indent(this.renderAction(currentRule.finallyAction), 2),
            `\t\ttry! unrollRecursionContexts(_parentctx)`,
            `\t}`,
            `\tdo {`,
        );

        if (currentRule.hasLookaheadBlock) {
            result.push(`\t\tvar _alt: Int`);
        }

        result.push(
            ...this.indent(this.renderRuleBody(currentRule), 2),
            `\t}`,
            `\tcatch ANTLRException.recognition(let re) {`,
            `\t\t_localctx.exception = re`,
            `\t\t_errHandler.reportError(self, re)`,
            `\t\ttry _errHandler.recover(self, re)`,
            `\t}`,
            ``,
            `\treturn _localctx`,
            `}`,
            ``,
        );

        return this.endRendering("LeftRecursiveRuleFunction", result);
    };

    protected override renderAddToLabelList = (srcOp: OutputModelObjects.AddToLabelList): Lines => {
        return [
            `${this.renderContext(srcOp.label)}.${srcOp.listName}.append(${this.renderLabelref(srcOp.label)})`,
        ];
    };

    protected override renderVisitorDispatchMethod = (struct: OutputModelObjects.StructDecl): Lines => {
        const name = this.toTitleCase(struct.derivedFromName);
        const grammarName = this.invariants.grammarName;

        return [
            `override ${this.openLevel}`,
            `func accept<T>(_ visitor: ParseTreeVisitor<T>) -> T? {`,
            `\tif let visitor = visitor as? ${grammarName}Visitor {`,
            `\t\treturn visitor.visit${name}(self)`,
            `\t}`,
            `\telse if let visitor = visitor as? ${grammarName}BaseVisitor {`,
            `\t\treturn visitor.visit${name}(self)`,
            `\t}`,
            `\telse {`,
            `\t\treturn visitor.visitChildren(self)`,
            `\t}`,
            `}`,
        ];
    };

    protected override renderListenerDispatchMethod = (struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod): Lines => {
        const enterExit = method.isEnter ? "enter" : "exit";
        const grammarName = this.invariants.grammarName;

        return [
            `override ${this.openLevel}`,
            `func ${enterExit}Rule(_ listener: ParseTreeListener) {`,
            `\tif let listener = listener as? ${grammarName}Listener {`,
            `\t\tlistener.${enterExit}${this.toTitleCase(struct.derivedFromName)}(self)`,
            `\t}`,
            `}`,
        ];
    };

    protected override renderAttributeDecl = (d: OutputModelObjects.AttributeDecl): Lines => {
        return [
            `${d.escapedName}: ${this.mapType(d.type)}` + (d.initValue ? ` = ${d.initValue}` : `!`),
        ];
    };

    protected override renderCaptureNextToken = (d: OutputModelObjects.CaptureNextToken): Lines => {
        return [
            `${d.varName} = try _input.LT(1)`,
        ];
    };

    protected override renderCaptureNextTokenType = (srcOp: OutputModelObjects.CaptureNextTokenType): Lines => {
        return [
            `${srcOp.varName} = try _input.LA(1)`,
        ];
    };

    protected override renderCodeBlockForOuterMostAlt = (
        currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(
                `_localctx = ${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context(_localctx)`,
            );
        }

        result.push(
            `try enterOuterAlt(_localctx, ${currentOuterMostAltCodeBlock.alt.altNum})`,
            ...this.renderCodeBlockForAlt(currentOuterMostAltCodeBlock),
        );

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    };

    protected override renderContextRuleGetterDecl = (r: OutputModelObjects.ContextRuleGetterDecl): Lines => {
        if (r.signature) {
            return [];
        }

        return [
            this.openLevel,
            `func ${r.escapedName}() -> ${r.ctxName}? {`,
            `\treturn getRuleContext(${r.ctxName}.self, 0)`,
            `}`,
        ];
    };

    protected override renderContextRuleListGetterDecl = (r: OutputModelObjects.ContextRuleListGetterDecl): Lines => {
        if (r.signature) {
            return [];
        }

        return [
            this.openLevel,
            `func ${r.escapedName}() -> [${r.ctxName}] {`,
            `\treturn getRuleContexts(${r.ctxName}.self)`,
            `}`,
        ];
    };

    protected override renderContextRuleListIndexedGetterDecl = (
        r: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines => {
        if (r.signature) {
            return [];
        }

        return [
            this.openLevel,
            `func ${r.escapedName}(_ i: Int) -> ${r.ctxName}? {`,
            `\treturn getRuleContext(${r.ctxName}.self, i)`,
            `}`,
        ];
    };

    protected override renderContextTokenGetterDecl = (t: OutputModelObjects.ContextTokenGetterDecl): Lines => {
        if (t.signature) {
            return [];
        }

        return [
            this.openLevel,
            `func ${t.escapedName}() -> TerminalNode? {`,
            `\treturn getToken(${this.invariants.recognizerName}.Tokens.${t.escapedName}.rawValue, 0)`,
            `}`,
        ];
    };

    protected override renderContextTokenListGetterDecl = (t: OutputModelObjects.ContextTokenListGetterDecl): Lines => {
        if (t.signature) {
            return [];
        }

        return [
            this.openLevel,
            `func ${t.escapedName}() -> [TerminalNode] {`,
            `\treturn getTokens(${this.invariants.recognizerName}.Tokens.${t.escapedName}.rawValue)`,
            `}`,
        ];
    };

    protected override renderContextTokenListIndexedGetterDecl = (
        t: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines => {
        if (t.signature) {
            return [];
        }

        return [
            this.openLevel,
            `func ${t.escapedName}(_ i: Int) -> TerminalNode? {`,
            `\treturn getToken(${this.invariants.recognizerName}.Tokens.${t.escapedName}.rawValue, i)`,
            `}`,
        ];
    };

    protected override renderExceptionClause = (srcOp: OutputModelObjects.ExceptionClause): Lines => {
        const result = this.startRendering("ExceptionClause");

        result.push(
            `catch (${this.renderAction(srcOp.catchArg).join(" ")}) {`,
            ...this.indent(this.renderAction(srcOp.catchAction)),
            `}`,
        );

        return this.endRendering("ExceptionClause", result);
    };

    protected override renderLL1AltBlock = (choice: OutputModelObjects.LL1AltBlock): Lines => {
        const result = this.startRendering("LL1AltBlock");

        result.push(...this.renderSync(choice.stateNumber));

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = try _input.LT(1)`);
        }

        result.push(
            ...this.renderSourceOps(choice.preamble),
            `switch (${this.invariants.recognizerName}.Tokens(rawValue: try _input.LA(1))!) {`,
        );

        choice.alts.forEach((alt, index) => {
            result.push(
                ...this.renderCases(choice.altLook[index]),
                ...this.indent(this.renderAlt(alt)),
                `\tbreak`,
            );
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(
            `default:`,
            ...this.indent(this.renderThrowNoViableAlt(noViableAltObject)),
            `}`,
        );

        return this.endRendering("LL1AltBlock", result);
    };

    protected override renderLL1OptionalBlock = (choice: OutputModelObjects.LL1OptionalBlock): Lines => {
        const result = this.startRendering("LL1OptionalBlock");

        result.push(
            ...this.renderSync(choice.stateNumber),
            `switch (${this.invariants.recognizerName}.Tokens(rawValue: try _input.LA(1))!) {`,
        );

        // The lookahead list has one more entry than the alternatives (the exit branch), which results in an
        // empty case.
        choice.altLook.forEach((look, index) => {
            const alt = choice.alts[index] as OutputModelObjects.CodeBlockForAlt | undefined;
            result.push(
                ...this.renderCases(look),
                ...this.indent(alt ? this.renderAlt(alt) : []),
                `\tbreak`,
            );
        });

        result.push(
            `default:`,
            `\tbreak`,
            `}`,
        );

        return this.endRendering("LL1OptionalBlock", result);
    };

    protected override renderLL1OptionalBlockSingleAlt = (
        choice: OutputModelObjects.LL1OptionalBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1OptionalBlockSingleAlt");

        result.push(
            ...this.renderSync(choice.stateNumber),
            ...this.renderSourceOps(choice.preamble),
            `if (${this.renderSourceOps(choice.expr ? [choice.expr] : undefined).join("")}) {`,
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt)));
        });

        result.push(`}`);

        return this.endRendering("LL1OptionalBlockSingleAlt", result);
    };

    protected override renderLL1StarBlockSingleAlt = (choice: OutputModelObjects.LL1StarBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1StarBlockSingleAlt");

        result.push(
            ...this.renderSync(choice.stateNumber),
            ...this.renderSourceOps(choice.preamble),
            `while (${this.renderSourceOps(choice.loopExpr ? [choice.loopExpr] : undefined).join("")}) {`,
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt)));
        });

        result.push(
            ...this.indent(this.renderSync(choice.loopBackStateNumber)),
            ...this.indent(this.renderSourceOps(choice.iteration)),
            `}`,
        );

        return this.endRendering("LL1StarBlockSingleAlt", result);
    };

    protected override renderLL1PlusBlockSingleAlt = (choice: OutputModelObjects.LL1PlusBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1PlusBlockSingleAlt");

        result.push(
            ...this.renderSync(choice.blockStartStateNumber), // Alt block decision.
            ...this.renderSourceOps(choice.preamble),
            `repeat {`,
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt)));
        });

        result.push(
            ...this.indent(this.renderSync(choice.stateNumber)), // Loop back/exit decision.
            ...this.indent(this.renderSourceOps(choice.iteration)),
            `} while (${this.renderSourceOps(choice.loopExpr ? [choice.loopExpr] : undefined).join("")})`,
        );

        return this.endRendering("LL1PlusBlockSingleAlt", result);
    };

    protected override renderMatchToken = (m: OutputModelObjects.MatchToken): Lines => {
        const result: Lines = this.startRendering("MatchToken");

        const call = `try match(${this.invariants.recognizerName}.Tokens.${m.escapedName}.rawValue)`;
        result.push(
            `setState(${m.stateNumber})`,
            ...this.renderLabeledCall(m.labels, call),
        );

        return this.endRendering("MatchToken", result);
    };

    protected override renderMatchSet = (m: OutputModelObjects.MatchSet): Lines => {
        return this.renderCommonSetStuff(m, false);
    };

    protected override renderMatchNotSet = (m: OutputModelObjects.MatchNotSet): Lines => {
        return this.renderCommonSetStuff(m, true);
    };

    protected override renderRuleContextDecl = (srcOp: OutputModelObjects.RuleContextDecl): Lines => {
        return [
            `${srcOp.escapedName}: ${srcOp.ctxName}!`,
        ];
    };

    protected override renderRuleContextListDecl = (ruleDecl: OutputModelObjects.RuleContextListDecl): Lines => {
        return [
            `${ruleDecl.escapedName}: [${ruleDecl.ctxName}] = [${ruleDecl.ctxName}]()`,
        ];
    };

    protected override renderStructDecl = (struct: OutputModelObjects.StructDecl): Lines => {
        const result = this.startRendering("StructDecl");

        const superClass = this.invariants.contextSuperClass ?? "ParserRuleContext";
        let interfaces = "";
        if (struct.interfaces.length > 0) {
            interfaces = ", " + struct.interfaces.map((i) => {
                return this.renderAction(i as OutputModelObjects.Action).join("");
            }).join(", ");
        }

        result.push(
            `${this.publicLevel} class ${struct.escapedName}: ${superClass}${interfaces} {`,
            ...this.indent(this.renderDecls(struct.attrs).map((a) => {
                return `${this.openLevel} var ${a}`;
            })),
            ...this.indent(this.renderDecls(struct.getters)),
        );

        if (struct.ctorAttrs.length > 0) {
            const ctorArgs = struct.ctorAttrs.map((a) => {
                return `, _ ${this.renderAttributeDecl(a).join("")}`;
            }).join("");

            result.push(
                `\t${this.publicLevel} convenience init(_ parent: ParserRuleContext?, _ invokingState: Int` +
                `${ctorArgs}) {`,
                `\t\tself.init(parent, invokingState)`,
            );

            for (const a of struct.ctorAttrs) {
                result.push(`\t\tself.${a.escapedName} = ${a.escapedName}`);
            }

            result.push(`\t}`);
        }

        result.push(
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getRuleIndex() -> Int {`,
            `\t\treturn ${this.invariants.recognizerName}.RULE_${struct.derivedFromName}`,
            `\t}`,
        );

        // Don't need copy unless we have subclasses.
        if (struct.provideCopyFrom && struct.attrs.size > 0) {
            result.push(
                `\t${this.openLevel}`,
                `\toverride func copyFrom(_ ctx_: ParserRuleContext) {`,
                `\t\tsuper.copyFrom(ctx_)`,
                `\t\tlet ctx = ctx_ as! ${struct.escapedName}`,
            );

            for (const a of struct.attrs) {
                result.push(`\t\tself.${a.escapedName} = ctx.${a.escapedName}`);
            }

            result.push(`\t}`);
        }

        result.push(...this.indent(this.renderDispatchMethods(struct)));

        for (const e of struct.extensionMembers) {
            result.push(...this.indent(this.renderAction(e as OutputModelObjects.Action)));
        }

        result.push(`}`);

        return this.endRendering("StructDecl", result);
    };

    protected override renderAltLabelStructDecl = (currentRule: OutputModelObjects.RuleFunction,
        struct: OutputModelObjects.AltLabelStructDecl): Lines => {
        const result = this.startRendering("AltLabelStructDecl");

        const parentContext = `${this.toTitleCase(currentRule.name)}Context`;

        result.push(
            `${this.publicLevel} class ${struct.escapedName}: ${parentContext} {`,
            ...this.indent(this.renderDecls(struct.attrs).map((a) => {
                return `${this.publicLevel} var ${a}`;
            })),
            ...this.indent(this.renderDecls(struct.getters)),
            ``,
            `\t${this.publicLevel}`,
            `\tinit(_ ctx: ${parentContext}) {`,
            `\t\tsuper.init()`,
            `\t\tcopyFrom(ctx)`,
            `\t}`,
            ...this.indent(this.renderDispatchMethods(struct)),
            `}`,
        );

        return this.endRendering("AltLabelStructDecl", result);
    };

    protected override renderTestSetInline = (s: OutputModelObjects.TestSetInline): Lines => {
        const result = this.startRendering("TestSetInline");

        const parts: string[] = [];
        for (const bits of s.bitsets) {
            if (bits.tokens.length > 2) {
                parts.push(this.renderBitsetBitfieldComparison(s, bits));
            } else {
                parts.push(this.renderBitsetInlineComparison(s, bits));
            }
        }

        result.push(parts.join(" || "));

        return this.endRendering("TestSetInline", result);
    };

    protected override renderTokenDecl = (t: OutputModelObjects.TokenDecl): Lines => {
        return [
            `${t.escapedName}: ${this.invariants.tokenLabelType}!`,
        ];
    };

    protected override renderTokenTypeDecl = (srcOp: OutputModelObjects.TokenTypeDecl): Lines => {
        return [
            `var ${srcOp.escapedName}: Int = 0`,
        ];
    };

    protected override renderTokenListDecl = (t: OutputModelObjects.TokenListDecl): Lines => {
        const tokenType = this.invariants.tokenLabelType;

        return [
            `${t.escapedName}: [${tokenType}] = [${tokenType}]()`,
        ];
    };

    protected override renderThrowNoViableAlt = (srcOp: OutputModelObjects.ThrowNoViableAlt): Lines => {
        return [
            `throw ANTLRException.recognition(e: NoViableAltException(self))`,
        ];
    };

    protected override renderWildcard = (w: OutputModelObjects.Wildcard): Lines => {
        const result: Lines = this.startRendering("Wildcard");

        result.push(
            `setState(${w.stateNumber})`,
            `${this.renderLabelAssignments(w.labels)}try matchWildcard()`,
        );

        return this.endRendering("Wildcard", result);
    };

    protected override renderStarBlock = (choice: OutputModelObjects.StarBlock): Lines => {
        const result: Lines = this.startRendering("StarBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const predict = this.renderAdaptivePredict(choice.decision);

        result.push(
            ...this.renderSync(choice.stateNumber),
            `_alt = ${predict}`,
            `while (_alt != ${choice.exitAlt} && _alt != ATN.INVALID_ALT_NUMBER) {`,
            `\tif (_alt == 1${!blockAST.greedy ? " + 1" : ""}) {`,
            ...this.indent(this.renderSourceOps(choice.iteration), 2),
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt), 2));
        });

        result.push(
            `\t}`,
            ...this.indent(this.renderSync(choice.loopBackStateNumber)),
            `\t_alt = ${predict}`,
            `}`,
        );

        return this.endRendering("StarBlock", result);
    };

    protected override renderPlusBlock = (choice: OutputModelObjects.PlusBlock): Lines => {
        const result: Lines = this.startRendering("PlusBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const nonGreedy = !blockAST.greedy ? " + 1" : "";

        result.push(
            ...this.renderSync(choice.blockStartStateNumber), // Alt block decision.
            `_alt = 1${nonGreedy}`,
            `repeat {`,
            `\tswitch (_alt) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `\tcase ${index + 1}${nonGreedy}:`,
                ...this.indent(this.renderAlt(alt), 2),
                `\t\tbreak`,
            );
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(
            `\tdefault:`,
            ...this.indent(this.renderThrowNoViableAlt(noViableAltObject), 2),
            `\t}`,
            ...this.indent(this.renderSync(choice.loopBackStateNumber)), // Loop back/exit decision.
            `\t_alt = ${this.renderAdaptivePredict(choice.decision)}`,
            `} while (_alt != ${choice.exitAlt} && _alt != ATN.INVALID_ALT_NUMBER)`,
        );

        return this.endRendering("PlusBlock", result);
    };

    protected override renderOptionalBlock = (choice: OutputModelObjects.OptionalBlock): Lines => {
        const result: Lines = this.startRendering("OptionalBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(
            ...this.renderSync(choice.stateNumber),
            `switch (${this.renderAdaptivePredict(choice.decision)}) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `case ${index + 1}${!blockAST.greedy ? " + 1" : ""}:`,
                ...this.indent(this.renderAlt(alt)),
                `\tbreak`,
            );
        });

        result.push(
            `default: break`,
            `}`,
        );

        return this.endRendering("OptionalBlock", result);
    };

    protected override renderAltBlock = (choice: OutputModelObjects.AltBlock): Lines => {
        const result: Lines = this.startRendering("AltBlock");

        result.push(...this.renderSync(choice.stateNumber));

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = try _input.LT(1)`);
        }

        result.push(
            ...this.renderSourceOps(choice.preamble),
            `switch (${this.renderAdaptivePredict(choice.decision)}) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `case ${index + 1}:`,
                ...this.indent(this.renderAlt(alt)),
                `\tbreak`,
            );
        });

        result.push(
            `default: break`,
            `}`,
        );

        return this.endRendering("AltBlock", result);
    };

    protected override renderInvokeRule = (r: OutputModelObjects.InvokeRule): Lines => {
        const result: Lines = this.startRendering("InvokeRule");

        const ast = r.ast as GrammarASTWithOptions | undefined;
        const precedence = ast?.getOptionString("p");
        const argExprs = this.renderActionChunks(r.argExprsChunks).join("");

        let args = argExprs;
        if (precedence) {
            args = precedence + (argExprs.length > 0 ? ", " : "") + argExprs;
        }

        result.push(
            `setState(${r.stateNumber})`,
            ...this.renderLabeledCall(r.labels, `try ${r.escapedName}(${args})`),
        );

        return this.endRendering("InvokeRule", result);
    };

    protected override renderSemPred = (p: OutputModelObjects.SemPred): Lines => {
        const result: Lines = this.startRendering("SemPred");

        const chunks = this.renderActionChunks(p.chunks).join("");
        const failChunks = this.renderActionChunks(p.failChunks).join("");

        let message = "";
        if (failChunks.length > 0) {
            message = `, ${failChunks}`;
        } else if (p.msg) {
            message = `, ${p.msg}`;
        }

        result.push(
            `setState(${p.stateNumber})`,
            `if (!(${chunks})) {`,
            `\tthrow ANTLRException.recognition(e: FailedPredicateException(self, ${p.predicate}${message}))`,
            `}`,
        );

        return this.endRendering("SemPred", result);
    };

    protected override renderAction = (srcOp?: OutputModelObjects.Action): Lines => {
        if (!srcOp) {
            return [];
        }

        const text = this.renderActionChunks(srcOp.chunks).join("");
        if (text.length === 0) {
            return [];
        }

        return text.split("\n");
    };

    protected renderRuleActionFunction(r: OutputModelObjects.RuleActionFunction): Lines {
        const result = this.startRendering("RuleActionFunction");

        result.push(
            `private func ${r.name}_action(_ _localctx: ${r.ctxType}?, _ actionIndex: Int) throws {`,
            `\tswitch (actionIndex) {`,
        );

        // Every case needs at least one statement in Swift, which the break guarantees for empty actions.
        for (const [index, action] of r.actions) {
            result.push(
                `\tcase ${index}:`,
                ...this.indent(this.renderAction(action), 2),
                `\t\tbreak`,
            );
        }

        result.push(
            `\tdefault: break`,
            `\t}`,
            `}`,
        );

        return this.endRendering("RuleActionFunction", result);
    }

    protected override renderRuleSempredFunction = (r: OutputModelObjects.RuleSempredFunction): Lines => {
        const result = this.startRendering("RuleSempredFunction");

        result.push(
            `private func ${r.name}_sempred(_ _localctx: ${r.ctxType}!, _ predIndex: Int) throws -> Bool {`,
            `\tswitch (predIndex) {`,
        );

        for (const [index, action] of r.actions) {
            result.push(`\tcase ${index}: return ${this.renderAction(action).join("\n").trim()}`);
        }

        result.push(
            `\tdefault: return true`,
            `\t}`,
            `}`,
        );

        return this.endRendering("RuleSempredFunction", result);
    };

    protected override renderSerializedATN = (model: OutputModelObjects.SerializedATN): Lines => {
        const result = this.startRendering("SerializedATN");

        result.push(`\tstatic let _serializedATN: [Int] = [`);
        this.append(result, this.wrapList(model.serialized.map(String), ",", "\t\t", "\t\t"));
        result.push(`\t]`);

        return this.endRendering("SerializedATN", result);
    };

    /**
     * This method is part of the automated rendering of action chunks.
     *
     * @param t The ActionText chunk to render.
     *
     * @returns Lines representing the action text.
     */
    protected override renderActionText = (t: OutputModelObjects.ActionText): Lines => {
        return t.text ?? [];
    };

    /**
     * Watch out, we have two methods with the same name but different casing!
     * `renderLabelRef` renders LabelRef action chunks.
     *
     * @param t The LabelRef to render.
     *
     * @returns Lines representing the labelref.
     */
    protected override renderLabelRef = (t: OutputModelObjects.LabelRef): Lines => {
        return [
            `${this.renderContext(t)}.${t.escapedName}`,
        ];
    };

    /**
     * Watch out, we have two methods with the same name but different casing!
     * `renderLabelref` renders labels (actually Decls) which are not action chunks.
     *
     * @param t The Decl to render as labelref.
     *
     * @returns The rendered labelref.
     */
    protected renderLabelref(t: OutputModelObjects.Decl): string {
        if (!t.isLocal) {
            return `${this.renderTypedContext(t.ctx)}.${t.escapedName}`;
        }

        return t.escapedName;
    }

    /**
     * Renders the case labels for a list of tokens. All but the last one fall through to the next label.
     *
     * @param tokens The tokens to render.
     *
     * @returns The rendered lines.
     */
    protected renderCases(tokens: OutputModelObjects.ITokenInfo[]): Lines {
        return tokens.map((t, index) => {
            return `case .${t.name}:${index < tokens.length - 1 ? "fallthrough" : ""}`;
        });
    }

    // Lexer command methods. These are only used for custom lexer commands, the standard commands are
    // handled by the lexer ATN directly.
    protected override renderLexerSkipCommand = (): Lines => {
        return [
            "skip()",
        ];
    };

    protected override renderLexerMoreCommand = (): Lines => {
        return [
            "more()",
        ];
    };

    protected override renderLexerPopModeCommand = (): Lines => {
        return [
            "popMode()",
        ];
    };

    protected override renderLexerTypeCommand = (arg: string): Lines => {
        return [
            `_type = ${arg}`,
        ];
    };

    protected override renderLexerChannelCommand = (arg: string): Lines => {
        return [
            `_channel = ${arg}`,
        ];
    };

    protected override renderLexerModeCommand = (arg: string): Lines => {
        return [
            `_mode = ${arg}`,
        ];
    };

    protected override renderLexerPushModeCommand = (arg: string): Lines => {
        return [
            `pushMode(${arg})`,
        ];
    };

    protected override renderArgRef = (t: OutputModelObjects.ArgRef): Lines => {
        return [
            `_localctx.${t.escapedName}`,
        ];
    };

    protected override renderListLabelRef = (t: OutputModelObjects.ListLabelRef): Lines => {
        return [
            `${this.renderContext(t)}.${this.renderListLabelName(t.escapedName)}`,
        ];
    };

    protected override renderLocalRef = (a: OutputModelObjects.LocalRef): Lines => {
        return [
            `_localctx.${a.escapedName}`,
        ];
    };

    protected override renderNonLocalAttrRef = (s: OutputModelObjects.NonLocalAttrRef): Lines => {
        return [
            `(getInvokingContext(${s.ruleIndex}) as! ${this.toTitleCase(s.ruleName)}Context).${s.escapedName}`,
        ];
    };

    protected override renderQRetValueRef = (a: OutputModelObjects.QRetValueRef): Lines => {
        return [
            `${this.renderContext(a)}.${a.dict}.${a.escapedName}`,
        ];
    };

    protected override renderRetValueRef = (t: OutputModelObjects.RetValueRef): Lines => {
        return [
            `_localctx.${t.escapedName}`,
        ];
    };

    protected override renderRulePropertyRef = (t: OutputModelObjects.RulePropertyRef): Lines => {
        return [
            `${this.renderContext(t)}.${t.label}`,
        ];
    };

    protected override renderRulePropertyRefCtx = (t: OutputModelObjects.RulePropertyRefCtx): Lines => {
        return [
            `${this.renderContext(t)}.${t.label}`,
        ];
    };

    protected override renderRulePropertyRefParser = (t: OutputModelObjects.RulePropertyRefParser): Lines => {
        return [
            `self`,
        ];
    };

    protected override renderRulePropertyRefStart = (t: OutputModelObjects.RulePropertyRefStart): Lines => {
        const ref = `${this.renderContext(t)}.${t.label}`;

        return [`${ref}?.start`];
    };

    protected override renderRulePropertyRefStop = (t: OutputModelObjects.RulePropertyRefStop): Lines => {
        const ref = `${this.renderContext(t)}.${t.label}`;

        return [`${ref}?.stop`];
    };

    protected override renderRulePropertyRefText = (t: OutputModelObjects.RulePropertyRefText): Lines => {
        const ref = `${this.renderContext(t)}.${t.label}`;

        return [this.renderNilSafeAccess(ref, `try _input.getText(${ref}!.start, ${ref}!.stop)`, `""`)];
    };

    protected override renderSetAttr = (s: OutputModelObjects.SetAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        // The action splitter consumes the semicolon of the assignment, so it has to be re-added here.
        return [
            `${this.renderContext(s)}.${s.escapedName} = ${rhs};`,
        ];
    };

    protected override renderSetNonLocalAttr = (s: OutputModelObjects.SetNonLocalAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        const ctx = `(getInvokingContext(${s.ruleIndex}) as! ${this.toTitleCase(s.ruleName)}Context)`;

        return [
            `${ctx}.${s.escapedName} = ${rhs};`,
        ];
    };

    protected override renderThisRulePropertyRefCtx = (t: OutputModelObjects.ThisRulePropertyRefCtx): Lines => {
        return [
            `_localctx`,
        ];
    };

    protected override renderThisRulePropertyRefParser = (t: OutputModelObjects.ThisRulePropertyRefParser): Lines => {
        return [
            `self`,
        ];
    };

    protected override renderThisRulePropertyRefStart = (t: OutputModelObjects.ThisRulePropertyRefStart): Lines => {
        return [
            `_localctx.start`,
        ];
    };

    protected override renderThisRulePropertyRefStop = (t: OutputModelObjects.ThisRulePropertyRefStop): Lines => {
        return [
            `_localctx.stop`,
        ];
    };

    protected override renderThisRulePropertyRefText = (t: OutputModelObjects.ThisRulePropertyRefText): Lines => {
        return [
            `(try _input.getText(_localctx.start, try _input.LT(-1)))`,
        ];
    };

    protected override renderTokenPropertyRefChannel = (t: OutputModelObjects.TokenPropertyRefChannel): Lines => {
        return [this.renderTokenProperty(t, "getChannel()", "0")];
    };

    protected override renderTokenPropertyRefIndex = (t: OutputModelObjects.TokenPropertyRefIndex): Lines => {
        return [this.renderTokenProperty(t, "getTokenIndex()", "0")];
    };

    protected override renderTokenPropertyRefInt = (t: OutputModelObjects.TokenPropertyRefInt): Lines => {
        const ref = `${this.renderContext(t)}.${t.label}`;

        // Int(String) returns an optional, so fall back to 0 for text that is not a number.
        return [this.renderNilSafeAccess(ref, `(Int(${ref}!.getText()!) ?? 0)`, "0")];
    };

    protected override renderTokenPropertyRefLine = (t: OutputModelObjects.TokenPropertyRefLine): Lines => {
        return [this.renderTokenProperty(t, "getLine()", "0")];
    };

    protected override renderTokenPropertyRefPos = (t: OutputModelObjects.TokenPropertyRefPos): Lines => {
        return [this.renderTokenProperty(t, "getCharPositionInLine()", "0")];
    };

    protected override renderTokenPropertyRefText = (t: OutputModelObjects.TokenPropertyRefText): Lines => {
        return [this.renderTokenProperty(t, "getText()!", `""`)];
    };

    protected override renderTokenPropertyRefType = (t: OutputModelObjects.TokenPropertyRefType): Lines => {
        return [this.renderTokenProperty(t, "getType()", "0")];
    };

    protected override renderTokenRef = (t: OutputModelObjects.TokenRef): Lines => {
        return [
            `${this.renderContext(t)}.${t.escapedName}`,
        ];
    };

    /** @returns The access level for members which may be overridden (`open` unless the grammar says otherwise). */
    private get openLevel(): string {
        return this.accessLevel ?? "open";
    }

    /** @returns The access level for members which cannot be `open` (`public` unless the grammar says otherwise). */
    private get publicLevel(): string {
        return this.accessLevel ?? "public";
    }

    private renderParser(parser: OutputModelObjects.Parser, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const parserName = parser.name;
        const superClass = parser.superClass ? this.renderActionChunks([parser.superClass]).join("") : "Parser";

        result.push(
            `${this.openLevel} class ${parserName}: ${superClass} {`,
            ``,
            ...this.renderDecisionToDFA(parserName),
            ``,
            `\tinternal static let _sharedContextCache = PredictionContextCache()`,
            ``,
        );

        if (parser.tokens.size > 0) {
            const tokens = Array.from(parser.tokens).map(([name, value]) => {
                return `${name} = ${value}`;
            });

            result.push(
                `\t${this.publicLevel}`,
                `\tenum Tokens: Int {`,
                ...this.wrapList(["EOF = -1", ...tokens], ", ", "\t\tcase ", " ".repeat(17)),
                `\t}`,
                ``,
            );
        }

        if (parser.rules.length > 0) {
            const rules = parser.rules.map((r) => {
                return `RULE_${r.name} = ${r.index}`;
            });

            result.push(
                `\t${this.publicLevel}`,
                ...this.wrapList(rules, ", ", "\tstatic let ", " ".repeat(12)),
                ``,
            );
        }

        result.push(
            `\t${this.publicLevel}`,
            `\tstatic let ruleNames: [String] = [`,
            ...this.wrapList(this.quote(parser.ruleNames), ", ", "\t\t", "\t\t"),
            `\t]`,
            ``,
            ...this.renderVocabulary(parser.literalNames, parser.symbolicNames),
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getGrammarFileName() -> String { return "${parser.grammarFileName}" }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getRuleNames() -> [String] { return ${parserName}.ruleNames }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getSerializedATN() -> [Int] { return ${parserName}._serializedATN }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getATN() -> ATN { return ${parserName}._ATN }`,
            ``,
            ...this.indent(this.renderAction(namedActions.get("members"))),
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getVocabulary() -> Vocabulary {`,
            `\t\treturn ${parserName}.VOCABULARY`,
            `\t}`,
            ``,
            `\toverride ${this.publicLevel}`,
            `\tinit(_ input: TokenStream) throws {`,
            `\t\tRuntimeMetaData.checkVersion("${SwiftTargetGenerator.runtimeVersion}", RuntimeMetaData.VERSION)`,
            `\t\ttry super.init(input)`,
            `\t\t_interp = ParserATNSimulator(self, ${parserName}._ATN, ${parserName}._decisionToDFA, ` +
            `${parserName}._sharedContextCache)`,
            `\t}`,
            ``,
        );

        this.append(result, this.indent(this.renderRuleFunctions(namedActions, parser.funcs)));
        this.append(result, this.indent(this.renderSempredDispatch(parser.sempredFuncs.values())));

        result.push(``);
        this.append(result, this.renderSerializedATN(parser.atn));
        result.push(
            ``,
            `\t${this.publicLevel}`,
            `\tstatic let _ATN = try! ATNDeserializer().deserialize(_serializedATN)`,
            `}`,
        );

        return result;
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const lexerName = lexer.name;
        const superClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]).join("") : "Lexer";

        result.push(
            `${this.openLevel} class ${lexerName}: ${superClass} {`,
            ``,
            ...this.renderDecisionToDFA(lexerName),
            ``,
            `\tinternal static let _sharedContextCache = PredictionContextCache()`,
            ``,
        );

        if (lexer.tokens.size > 0) {
            result.push(
                `\t${this.publicLevel}`,
                ...this.renderConstants(Array.from(lexer.tokens)),
                ``,
            );
        }

        if (lexer.escapedChannels.size > 0) {
            result.push(
                `\t${this.publicLevel}`,
                ...this.renderConstants(Array.from(lexer.escapedChannels)),
                ``,
            );
        }

        // The first mode is always the default mode, which needs no constant.
        const modes = lexer.escapedModeNames.slice(1);
        if (modes.length > 0) {
            result.push(
                `\t${this.publicLevel}`,
                ...this.renderConstants(modes.map((m, i) => {
                    return [m, i + 1];
                })),
                ``,
            );
        }

        result.push(
            `\t${this.publicLevel}`,
            `\tstatic let channelNames: [String] = [`,
            ...this.wrapList(this.quote(["DEFAULT_TOKEN_CHANNEL", "HIDDEN", ...lexer.channelNames]), ", ", "\t\t",
                "\t\t"),
            `\t]`,
            ``,
            `\t${this.publicLevel}`,
            `\tstatic let modeNames: [String] = [`,
            ...this.wrapList(this.quote(lexer.modes), ", ", "\t\t", "\t\t"),
            `\t]`,
            ``,
            `\t${this.publicLevel}`,
            `\tstatic let ruleNames: [String] = [`,
            ...this.wrapList(this.quote(lexer.ruleNames), ", ", "\t\t", "\t\t"),
            `\t]`,
            ``,
            ...this.renderVocabulary(lexer.literalNames, lexer.symbolicNames),
            ``,
            ...this.indent(this.renderAction(namedActions.get("members"))),
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getVocabulary() -> Vocabulary {`,
            `\t\treturn ${lexerName}.VOCABULARY`,
            `\t}`,
            ``,
            `\t${this.publicLevel}`,
            `\trequired init(_ input: CharStream) {`,
            `\t\tRuntimeMetaData.checkVersion("${SwiftTargetGenerator.runtimeVersion}", RuntimeMetaData.VERSION)`,
            `\t\tsuper.init(input)`,
            `\t\t_interp = LexerATNSimulator(self, ${lexerName}._ATN, ${lexerName}._decisionToDFA, ` +
            `${lexerName}._sharedContextCache)`,
            `\t}`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getGrammarFileName() -> String { return "${lexer.grammarFileName}" }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getRuleNames() -> [String] { return ${lexerName}.ruleNames }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getSerializedATN() -> [Int] { return ${lexerName}._serializedATN }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getChannelNames() -> [String] { return ${lexerName}.channelNames }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getModeNames() -> [String] { return ${lexerName}.modeNames }`,
            ``,
            `\toverride ${this.openLevel}`,
            `\tfunc getATN() -> ATN { return ${lexerName}._ATN }`,
            ``,
            ...this.indent(this.renderActionHandlers(lexer)),
        );

        this.append(result, this.renderSerializedATN(lexer.atn));
        result.push(
            ``,
            `\t${this.publicLevel}`,
            `\tstatic let _ATN: ATN = try! ATNDeserializer().deserialize(_serializedATN)`,
            `}`,
        );

        return result;
    }

    /**
     * Renders the lazily initialized DFA array shared by parsers and lexers.
     *
     * @param name The recognizer name.
     *
     * @returns The rendered lines (indented for the class body).
     */
    private renderDecisionToDFA(name: string): Lines {
        return [
            `\tinternal static var _decisionToDFA: [DFA] = {`,
            `\t\tvar decisionToDFA = [DFA]()`,
            `\t\tlet length = ${name}._ATN.getNumberOfDecisions()`,
            `\t\tfor i in 0..<length {`,
            `\t\t\tdecisionToDFA.append(DFA(${name}._ATN.getDecisionState(i)!, i))`,
            `\t\t}`,
            `\t\treturn decisionToDFA`,
            `\t}()`,
        ];
    }

    /**
     * Renders the `action` and `sempred` dispatch methods of a lexer, together with the rule specific
     * action and predicate functions.
     *
     * @param lexer The lexer model object.
     *
     * @returns The rendered lines.
     */
    private renderActionHandlers(lexer: OutputModelObjects.Lexer): Lines {
        const result: Lines = this.startRendering("actionHandlers");

        if (lexer.actionFuncs.size > 0) {
            result.push(
                `override ${this.openLevel}`,
                `func action(_ _localctx: RuleContext?, _ ruleIndex: Int, _ actionIndex: Int) throws {`,
                `\tswitch (ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of lexer.actionFuncs.values()) {
                result.push(
                    `\tcase ${f.ruleIndex}:`,
                    `\t\ttry ${f.name}_action((_localctx as ${f.ctxType}?), actionIndex)`,
                );

                funcs.push(...this.renderRuleActionFunction(f));
            }

            result.push(
                `\tdefault: break`,
                `\t}`,
                `}`,
                ...funcs,
            );
        }

        result.push(...this.renderSempredDispatch(lexer.sempredFuncs.values()));

        return this.endRendering("actionHandlers", result);
    }

    /**
     * Renders the `sempred` dispatch method of a recognizer, together with the rule specific predicate functions.
     *
     * @param sempredFuncs The predicate functions of the recognizer.
     *
     * @returns The rendered lines (empty if there are no predicates).
     */
    private renderSempredDispatch(sempredFuncs: Iterable<OutputModelObjects.RuleSempredFunction>): Lines {
        const funcs = Array.from(sempredFuncs);
        if (funcs.length === 0) {
            return [];
        }

        const result: Lines = [
            `override ${this.openLevel}`,
            `func sempred(_ _localctx: RuleContext?, _ ruleIndex: Int, _ predIndex: Int) throws -> Bool {`,
            `\tswitch (ruleIndex) {`,
        ];

        for (const f of funcs) {
            result.push(
                `\tcase ${f.ruleIndex}:`,
                `\t\treturn try ${f.name}_sempred(_localctx?.castdown(${f.ctxType}.self), predIndex)`,
            );
        }

        result.push(
            `\tdefault: return true`,
            `\t}`,
            `}`,
        );

        for (const f of funcs) {
            result.push(...this.renderRuleSempredFunction(f));
        }

        return result;
    }

    /**
     * Renders a `static let` declaration for the given name/value pairs, wrapped over multiple lines.
     *
     * @param entries The name/value pairs.
     *
     * @returns The rendered lines (indented for the class body).
     */
    private renderConstants(entries: Array<[string, number]>): Lines {
        const items = entries.map(([name, value]) => {
            return `${name}=${value}`;
        });

        return this.wrapList(items, ", ", "\tstatic let ", " ".repeat(12));
    }

    private renderVocabulary(literalNames: Array<string | null>, symbolicNames: Array<string | null>): Lines {
        const toSwift = (names: Array<string | null>): string[] => {
            return names.map((name) => {
                return name ?? "nil";
            });
        };

        return [
            `\tprivate static let _LITERAL_NAMES: [String?] = [`,
            ...this.wrapList(toSwift(literalNames), ", ", "\t\t", "\t\t"),
            `\t]`,
            `\tprivate static let _SYMBOLIC_NAMES: [String?] = [`,
            ...this.wrapList(toSwift(symbolicNames), ", ", "\t\t", "\t\t"),
            `\t]`,
            `\t${this.publicLevel}`,
            `\tstatic let VOCABULARY = Vocabulary(_LITERAL_NAMES, _SYMBOLIC_NAMES)`,
        ];
    }

    /**
     * Renders the local variable declarations of a rule function.
     *
     * @param currentRule The rule to render the locals for.
     *
     * @returns The rendered lines.
     */
    private renderLocals(currentRule: OutputModelObjects.RuleFunction): Lines {
        const result: Lines = [];
        for (const decl of currentRule.locals.values()) {
            result.push(...this.renderTokenTypeDecl(decl));
        }

        return result;
    }

    /**
     * Renders the body of a rule function (the part inside the do block).
     *
     * @param currentRule The rule to render.
     *
     * @returns The rendered lines.
     */
    private renderRuleBody(currentRule: OutputModelObjects.RuleFunction): Lines {
        return [
            ...this.renderSourceOps(currentRule.code),
            ...this.renderSourceOps(currentRule.postamble),
            ...this.renderAction(currentRule.namedActions?.get("after")),
        ];
    }

    /**
     * Renders a single alternative of a choice block.
     *
     * @param alt The alternative to render.
     *
     * @returns The rendered lines.
     */
    private renderAlt(alt: OutputModelObjects.CodeBlockForAlt): Lines {
        if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
            return this.renderCodeBlockForOuterMostAlt(alt);
        }

        return this.renderCodeBlockForAlt(alt);
    }

    private renderAdaptivePredict(decision: number): string {
        return `try getInterpreter().adaptivePredict(_input, ${decision}, _ctx)`;
    }

    private renderSync(stateNumber: number): Lines {
        return [
            `setState(${stateNumber})`,
            `try _errHandler.sync(self)`,
        ];
    }

    /**
     * Renders the assignment prefix for labeled elements, e.g. `_localctx.castdown(AContext.self).name = `.
     *
     * @param labels The labels of the element.
     *
     * @returns The rendered prefix (empty if there are no labels).
     */
    private renderLabelAssignments(labels: OutputModelObjects.Decl[]): string {
        return labels.map((l) => {
            return `${this.renderLabelref(l)} = `;
        }).join("");
    }

    /**
     * Renders a call whose result is assigned to the given labels (if any). The assignment happens in an
     * immediately executed closure, so the call can throw.
     *
     * @param labels The labels to assign the result to.
     * @param call The call expression (including the `try`).
     *
     * @returns The rendered lines.
     */
    private renderLabeledCall(labels: OutputModelObjects.Decl[], call: string): Lines {
        if (labels.length === 0) {
            return [call];
        }

        const result: Lines = [
            `try {`,
            `\tlet assignmentValue = ${call}`,
        ];

        for (const l of labels) {
            result.push(`\t${this.renderLabelref(l)} = assignmentValue`);
        }

        result.push(`}()`);

        return result;
    }

    /**
     * Renders a nil-safe access to a token property, like `$t.line`.
     *
     * @param t The token property reference.
     * @param accessor The method to call on the token.
     * @param defaultValue The value to return when the token is nil.
     *
     * @returns The rendered expression.
     */
    private renderTokenProperty(t: TokenPropertyRef, accessor: string, defaultValue: string): string {
        const ref = `${this.renderContext(t)}.${t.label}`;

        return this.renderNilSafeAccess(ref, `${ref}!.${accessor}`, defaultValue);
    }

    /**
     * Renders an expression which is only evaluated when the given reference is not nil.
     *
     * @param ref The (optional) reference to check.
     * @param expression The expression to evaluate when the reference is not nil.
     * @param defaultValue The value to use when the reference is nil.
     *
     * @returns The rendered conditional expression.
     */
    private renderNilSafeAccess(ref: string, expression: string, defaultValue: string): string {
        return `(${ref} != nil ? ${expression} : ${defaultValue})`;
    }

    /**
     * Produces smaller bytecode only when `bits` contains more than two items.
     *
     * @param s The set of bits to test.
     * @param bits The bits to test in the set.
     *
     * @returns The expression implementing the test.
     */
    private renderBitsetBitfieldComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        const shiftVar = this.renderOffsetShiftVar(s.varName, bits.shift);

        return `((Int64(${shiftVar}) & ~0x3f) == 0 && ((Int64(1) << ${shiftVar}) & ${bits.calculated}) != 0)`;
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `${s.varName} == ${this.invariants.recognizerName}.Tokens.${t.name}.rawValue`;
        }).join(" || ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        // The offset is negative when the set contains EOF (-1), so it must be applied as well.
        return offset !== 0n ? `(${shiftAmount} - ${offset})` : shiftAmount;
    }

    private renderCommonSetStuff = (m: OutputModelObjects.MatchSet, invert: boolean): Lines => {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`setState(${m.stateNumber})`);

        const labels = this.renderLabelAssignments(m.labels);
        if (m.labels.length > 0) {
            result.push(`${labels}try _input.LT(1)`);
        }

        result.push(...this.renderCaptureNextTokenType(m.capture));

        const expr = this.renderTestSetInline(m.expr).join("");
        if (invert) {
            result.push(`if (${m.expr.varName} <= 0 || (${expr})) {`);
        } else {
            result.push(`if (!(${expr})) {`);
        }

        result.push(
            `\t${labels}try _errHandler.recoverInline(self)${m.labels.length > 0 ? " as Token" : ""}`,
            `}`,
            `else {`,
            `\t_errHandler.reportMatch(self)`,
            `\ttry consume()`,
            `}`,
        );

        return this.endRendering("CommonSetStuff", result);
    };

    /**
     * Renders the parameter list for a rule function.
     *
     * @param args The rule arguments.
     *
     * @returns The rendered parameter list (without parentheses).
     */
    private renderArgs(args?: OutputModelObjects.AttributeDecl[]): string {
        return args?.map((a) => {
            return `_ ${this.renderAttributeDecl(a).join("")}`;
        }).join(", ") ?? "";
    }

    /**
     * Renders the arguments of a rule function for passing them on (e.g. to the context constructor).
     *
     * @param args The rule arguments.
     *
     * @returns The rendered arguments, each prefixed with a comma.
     */
    private renderCallArgs(args?: OutputModelObjects.AttributeDecl[]): string {
        return args?.map((a) => {
            return `, ${a.escapedName}`;
        }).join("") ?? "";
    }

    /**
     * Maps an ANTLR attribute type to the Swift type.
     *
     * @param type The type as written in the grammar.
     *
     * @returns The Swift type.
     */
    private mapType(type: string): string {
        return SwiftTargetGenerator.typeMap.get(type) ?? type;
    }

    /**
     * Wraps the given items in double quotes.
     *
     * @param items The items to quote.
     *
     * @returns The quoted items.
     */
    private quote(items: Iterable<string>): string[] {
        return Array.from(items).map((item) => {
            return `"${item}"`;
        });
    }

    /**
     * Renders a list of items over multiple lines. A line is wrapped before an item, if it already reached the
     * line width (counting each tab as a single character). This is the same strategy used by StringTemplate.
     *
     * @param items The items to render.
     * @param separator The separator between the items.
     * @param prefix The text before the first item (including the indentation).
     * @param continuation The indentation of the wrapped lines.
     *
     * @returns The rendered lines.
     */
    private wrapList(items: Iterable<string>, separator: string, prefix: string, continuation: string): Lines {
        const result: Lines = [];

        let line = prefix;
        let first = true;
        for (const item of items) {
            if (!first) {
                line += separator;
            }
            first = false;

            if (line.length >= SwiftTargetGenerator.lineWidth) {
                result.push(line.trimEnd());
                line = continuation;
            }

            line += item;
        }

        result.push(line);

        return result;
    }

    /**
     * Appends all lines to the target list. Unlike the spread operator this works for very large lists too.
     *
     * @param target The list to append to.
     * @param lines The lines to append.
     */
    private append(target: Lines, lines: Lines): void {
        for (const line of lines) {
            target.push(line);
        }
    }

    /**
     * Prefixes all non-empty lines with the given number of tabs. Undefined lines are removed.
     *
     * @param lines The lines to indent.
     * @param levels The number of levels to indent.
     *
     * @returns The indented lines.
     */
    private indent(lines: Lines, levels = 1): Lines {
        const prefix = "\t".repeat(levels);
        const result: Lines = [];

        for (const line of lines) {
            if (line === undefined) {
                continue;
            }

            result.push(line.length === 0 ? line : prefix + line);
        }

        return result;
    }

    /**
     * Joins the given lines to the final file content, making sure there's exactly one newline at the end.
     *
     * @param lines The lines of the file.
     *
     * @returns The file content.
     */
    private finish(lines: Lines): string {
        let text = lines.filter((line) => {
            return line !== undefined;
        }).join("\n");

        text = text.replace(/\n+$/, "");

        return text + "\n";
    }
}
