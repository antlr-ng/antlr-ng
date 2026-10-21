/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// Dart target generator - based on the Dart.stg template of ANTLR4.

// cspell: ignore localctx, prevctx, parentctx, precpred, sempred

import * as OutputModelObjects from "../codegen/model/index.js";

import { GeneratorBase, type NamedActions } from "../codegen/GeneratorBase.js";
import type { CodePoint, ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { TokenPropertyRef } from "../codegen/model/chunk/TokenPropertyRef.js";
import type { IGenerationOptions } from "../config/config.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import { antlrVersion } from "../version.js";

export class DartTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.dart";
    public readonly version = "1.0.0";

    public readonly language = "Dart";
    public readonly languageSpecifiers = ["dart"];

    public override readonly codeFileExtension = ".dart";

    public override readonly lexerRuleContext = "RuleContext";

    public override readonly wantsBaseListener = true;
    public override readonly wantsBaseVisitor = true;
    public override readonly supportsOverloadedMethods = true;
    public override readonly isATNSerializedAsInts = true;
    public override readonly inlineTestSetWordSize = 64;

    public override readonly reservedWords = new Set([
        "abstract", "dynamic", "implements", "show", "as", "else", "import", "static", "assert", "enum", "in", "super",
        "async", "export", "interface", "switch", "await", "extends", "is", "sync", "break", "external", "library",
        "this", "case", "factory", "mixin", "throw", "catch", "false", "new", "true", "class", "final", "null", "try",
        "const", "finally", "on", "typedef", "continue", "for", "operator", "var", "covariant", "Function", "part",
        "void", "default", "get", "rethrow", "while", "deferred", "hide", "return", "with", "do", "if", "set", "yield",
        "rule", "parserRule",
    ]);

    /**
     * The ANTLR version the Dart runtime is checked against (`RuntimeMetaData.checkVersion`). The runtime prints
     * a warning when the major/minor version of the generating tool differs from its own, so we pass the ANTLR
     * version the runtime was built for, not the antlr-ng version.
     */
    private static readonly runtimeVersion = "4.13.2";

    /** The line width used to wrap long lists (the old StringTemplate based generator used 72). */
    private static readonly lineWidth = 72;

    private escapeMap: Map<CodePoint, string>;

    public constructor(logRendering = false) {
        super(logRendering);

        // Dollar signs start an interpolation in Dart strings and must be escaped.
        this.escapeMap = new Map(GeneratorBase.defaultCharValueEscape);
        this.escapeMap.set(0x24, "\\$");
    }

    public renderParserFile = (parserFile: OutputModelObjects.ParserFile, declaration: boolean,
        options: IGenerationOptions): string => {
        const parser = parserFile.parser;
        this.invariants.recognizerName = parser.name;
        this.invariants.grammarName = parser.grammarName;
        this.invariants.grammarFileName = parser.grammarFileName;
        this.invariants.tokenLabelType = parserFile.TokenLabelType ?? "Token";
        this.invariants.contextSuperClass = parserFile.contextSuperClass
            ? this.renderActionChunks([parserFile.contextSuperClass]).join("") : undefined;

        const result: Lines = this.renderFileHeader(parserFile);
        result.push(`import 'package:antlr4/antlr4.dart';`, ``);

        const grammarName = parser.grammarName;
        if (options.generateListener) {
            result.push(`import '${grammarName}Listener.dart';`);
            if (options.generateBaseListener) {
                result.push(`import '${grammarName}BaseListener.dart';`);
            }
        }

        if (options.generateVisitor) {
            result.push(`import '${grammarName}Visitor.dart';`);
            if (options.generateBaseVisitor) {
                result.push(`import '${grammarName}BaseVisitor.dart';`);
            }
        }

        if (parser.superClass) {
            result.push(`import '${this.renderActionChunks([parser.superClass]).join("")}.dart';`);
        }

        result.push(``, ...this.renderAction(parserFile.namedActions.get("header")));
        this.append(result, this.renderParser(parser, parserFile.namedActions));

        return this.finish(result);
    };

    public renderLexerFile = (lexerFile: OutputModelObjects.LexerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        const lexer = lexerFile.lexer;
        this.invariants.recognizerName = lexer.name;
        this.invariants.grammarName = lexer.grammarName;
        this.invariants.grammarFileName = lexer.grammarFileName;
        this.invariants.tokenLabelType = lexerFile.TokenLabelType ?? "Token";

        const result: Lines = this.renderFileHeader(lexerFile);
        result.push(`import 'package:antlr4/antlr4.dart';`);

        if (lexer.superClass) {
            result.push(`import '${this.renderActionChunks([lexer.superClass]).join("")}.dart';`);
        }

        result.push(...this.renderAction(lexerFile.namedActions.get("header")), ``);
        this.append(result, this.renderLexer(lexer, lexerFile.namedActions));

        return this.finish(result);
    };

    public renderListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = listenerFile.grammarName;
        this.invariants.grammarFileName = listenerFile.grammarFileName;

        const grammarName = listenerFile.grammarName;
        const parserName = listenerFile.parserName;
        const result: Lines = this.renderFileHeader(listenerFile);

        result.push(
            `import 'package:antlr4/antlr4.dart';`,
            ``,
            `import '${parserName}.dart';`,
            ...this.renderAction(listenerFile.header),
            ``,
            `/// This abstract class defines a complete listener for a parse tree produced by`,
            `/// [${parserName}].`,
            `abstract class ${grammarName}Listener extends ParseTreeListener {`,
        );

        const names = Array.from(listenerFile.listenerNames);
        names.forEach((lname, index) => {
            const name = this.toTitleCase(lname);
            const ruleName = listenerFile.listenerLabelRuleNames.get(lname);
            const block: Lines = [];

            if (ruleName) {
                block.push(
                    `/// Enter a parse tree produced by the [${lname}]`,
                    `/// labeled alternative in [${parserName}.${ruleName}].`,
                );
            } else {
                block.push(`/// Enter a parse tree produced by [${parserName}.${lname}].`);
            }

            block.push(
                `/// [ctx] the parse tree`,
                `void enter${name}(${name}Context ctx);`,
            );

            if (ruleName) {
                block.push(
                    `/// Exit a parse tree produced by the [${lname}]`,
                    `/// labeled alternative in [${parserName}.${ruleName}].`,
                );
            } else {
                block.push(`/// Exit a parse tree produced by [${parserName}.${lname}].`);
            }

            block.push(
                `/// [ctx] the parse tree`,
                `void exit${name}(${name}Context ctx);`,
            );

            result.push(...this.indent(block));
            if (index < names.length - 1) {
                result.push(``);
            }
        });

        result.push(`}`);

        return this.finish(result);
    };

    public renderBaseListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = listenerFile.grammarName;
        this.invariants.grammarFileName = listenerFile.grammarFileName;

        const grammarName = listenerFile.grammarName;
        const result: Lines = this.renderFileHeader(listenerFile);

        result.push(
            `import 'package:antlr4/antlr4.dart';`,
            ``,
            `import '${listenerFile.parserName}.dart';`,
            `import '${grammarName}Listener.dart';`,
            ``,
            ...this.renderAction(listenerFile.header),
            ``,
            `/// This class provides an empty implementation of [${grammarName}Listener],`,
            `/// which can be extended to create a listener which only needs to handle`,
            `/// a subset of the available methods.`,
            `class ${grammarName}BaseListener implements ${grammarName}Listener {`,
        );

        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            result.push(
                `  /// The default implementation does nothing.`,
                `  @override`,
                `  void enter${name}(${name}Context ctx) {}`,
                ``,
                `  /// The default implementation does nothing.`,
                `  @override`,
                `  void exit${name}(${name}Context ctx) {}`,
                ``,
            );
        }

        result.push(
            `  /// The default implementation does nothing.`,
            `  @override`,
            `  void enterEveryRule(ParserRuleContext ctx) {}`,
            ``,
            `  /// The default implementation does nothing.`,
            `  @override`,
            `  void exitEveryRule(ParserRuleContext ctx) {}`,
            ``,
            `  /// The default implementation does nothing.`,
            `  @override`,
            `  void visitTerminal(TerminalNode node) {}`,
            ``,
            `  /// The default implementation does nothing.`,
            `  @override`,
            `  void visitErrorNode(ErrorNode node) {}`,
            `}`,
        );

        return this.finish(result);
    };

    public renderVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;

        const grammarName = visitorFile.grammarName;
        const parserName = visitorFile.parserName;
        const result: Lines = this.renderFileHeader(visitorFile);

        result.push(
            `import 'package:antlr4/antlr4.dart';`,
            ``,
            `import '${parserName}.dart';`,
            ...this.renderAction(visitorFile.header),
            ``,
            `/// This abstract class defines a complete generic visitor for a parse tree`,
            `/// produced by [${parserName}].`,
            `///`,
            `/// [T] is the return type of the visit operation. Use \`void\` for`,
            `/// operations with no return type.`,
            `abstract class ${grammarName}Visitor<T> extends ParseTreeVisitor<T> {`,
        );

        const names = Array.from(visitorFile.visitorNames);
        names.forEach((lname, index) => {
            const name = this.toTitleCase(lname);
            const ruleName = visitorFile.visitorLabelRuleNames.get(lname);
            const block: Lines = [];

            if (ruleName) {
                block.push(
                    `/// Visit a parse tree produced by the [${lname}]`,
                    `/// labeled alternative in [${parserName}.${ruleName}].`,
                );
            } else {
                block.push(`/// Visit a parse tree produced by [${parserName}.${lname}].`);
            }

            block.push(
                `/// [ctx] the parse tree.`,
                `/// Return the visitor result.`,
                `T? visit${name}(${name}Context ctx);`,
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

        const grammarName = visitorFile.grammarName;
        const result: Lines = this.renderFileHeader(visitorFile);

        result.push(
            `import 'package:antlr4/antlr4.dart';`,
            ``,
            `import '${visitorFile.parserName}.dart';`,
            `import '${grammarName}Visitor.dart';`,
            ...this.renderAction(visitorFile.header),
            ``,
            `/// This class provides an empty implementation of [${grammarName}Visitor],`,
            `/// which can be extended to create a visitor which only needs to handle`,
            `/// a subset of the available methods.`,
            `///`,
            `/// [T] is the return type of the visit operation. Use \`void\` for`,
            `/// operations with no return type.`,
            `class ${grammarName}BaseVisitor<T> extends ParseTreeVisitor<T> implements ${grammarName}Visitor<T> {`,
        );

        const names = Array.from(visitorFile.visitorNames);
        names.forEach((lname, index) => {
            const name = this.toTitleCase(lname);
            result.push(
                `  /// The default implementation returns the result of calling`,
                `  /// [visitChildren] on [ctx].`,
                `  @override`,
                `  T? visit${name}(${name}Context ctx) => visitChildren(ctx);`,
            );

            if (index < names.length - 1) {
                result.push(``);
            }
        });

        result.push(`}`);

        return this.finish(result);
    };

    // Note: the rec rule helpers return a single line with embedded line breaks, because their result is
    // run through the action translator, which concatenates all lines.
    public renderRecRuleReplaceContext = (ctxName: string): Lines => {
        return [
            `_localctx = ${this.toTitleCase(ctxName)}Context(_localctx);\n` +
            `context = _localctx;\n` +
            `_prevctx = _localctx;`,
        ];
    };

    public renderRecRuleAltPredicate = (ruleName: string, opPrec: number): Lines => {
        return [
            `precpred(context, ${opPrec})`,
        ];
    };

    public renderRecRuleSetReturnAction = (src: string, name: string): Lines => {
        return [
            `$${name} = $${src}.${name};`,
        ];
    };

    public renderRecRuleSetStopToken = (): Lines => {
        return [
            `context!.stop = tokenStream.LT(-1);`,
        ];
    };

    public renderRecRuleSetPrevCtx = (): Lines => {
        return [
            `if (parseListeners != null) triggerExitRuleEvent();\n` +
            `_prevctx = _localctx;`,
        ];
    };

    public renderRecRuleLabeledAltStartAction = (parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [
            `_localctx = ${this.toTitleCase(currentAltLabel)}Context(` +
            `${this.toTitleCase(ruleName)}Context(_parentctx, _parentState));`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`_localctx.${label}.add(_prevctx);`);
            } else {
                result.push(`_localctx.${label} = _prevctx;`);
            }
        }

        result.push(`pushNewRecursionContext(_localctx, _startState, RULE_${ruleName});`);

        return [result.join("\n")];
    };

    public renderRecRuleAltStartAction = (parserName: string, ruleName: string, ctxName: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [
            `_localctx = ${this.toTitleCase(ctxName)}Context(_parentctx, _parentState);`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`_localctx.${label}.add(_prevctx);`);
            } else {
                result.push(`_localctx.${label} = _prevctx;`);
            }
        }

        result.push(`pushNewRecursionContext(_localctx, _startState, RULE_${ruleName});`);

        return [result.join("\n")];
    };

    public renderTestFile = (grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string => {
        const result: Lines = [
            `import 'dart:io';`,
            `import 'package:antlr4/antlr4.dart';`,
            ``,
            `import '${lexerName}.dart';`,
        ];

        if (parserName !== undefined) {
            result.push(`import '${parserName}.dart';`);
        }

        result.push(
            ``,
            `void main(List<String> args) async {`,
            `  CharStream input = await InputStream.fromPath(args[0]);`,
            `  final lex = ${lexerName}(input);`,
            `  final tokens = CommonTokenStream(lex);`,
        );

        if (parserName !== undefined) {
            result.push(`  final parser = ${parserName}(tokens);`);

            if (showDiagnosticErrors) {
                result.push(`  parser.addErrorListener(DiagnosticErrorListener());`);
            }

            if (profile) {
                result.push(
                    `  ProfilingATNSimulator profiler = ProfilingATNSimulator(parser);`,
                    `  parser.setInterpreter(profiler);`,
                );
            }

            result.push(`  parser.interpreter!.predictionMode = PredictionMode.${predictionMode};`);

            if (!buildParseTree) {
                result.push(`  parser.buildParseTree = false;`);
            }

            result.push(`  ParserRuleContext tree = parser.${parserStartRuleName ?? ""}();`);

            if (profile) {
                result.push(`  print('[\${profiler.getDecisionInfo().join(', ')}]');`);
            }

            result.push(`  ParseTreeWalker.DEFAULT.walk(TreeShapeListener(), tree);`);
        } else {
            result.push(
                `  tokens.fill();`,
                `  for (Object t in tokens.getTokens()!)`,
                `    print(t);`,
            );

            if (showDFA) {
                result.push(`  stdout.write(lex.interpreter!.getDFA(Lexer.DEFAULT_MODE).toLexerString());`);
            }
        }

        result.push(`}`);

        if (parserName !== undefined) {
            result.push(
                ``,
                `class TreeShapeListener implements ParseTreeListener {`,
                `  @override void visitTerminal(TerminalNode node) {}`,
                ``,
                `  @override void visitErrorNode(ErrorNode node) {}`,
                ``,
                `  @override void exitEveryRule(ParserRuleContext ctx) {}`,
                ``,
                `  @override`,
                `  void enterEveryRule(ParserRuleContext ctx) {`,
                `    for (var i = 0; i < ctx.childCount; i++) {`,
                `      final parent = ctx.getChild(i)?.parent;`,
                `      if (!(parent is RuleNode) || (parent as RuleNode).ruleContext != ctx) {`,
                `        throw StateError('Invalid parse tree shape detected.');`,
                `      }`,
                `    }`,
                `  }`,
                `}`,
            );
        }

        return this.finish(result);
    };

    public override get charValueEscapeMap(): Map<CodePoint, string> {
        return this.escapeMap;
    }

    public override getTargetStringLiteralFromANTLRStringLiteral(literal: string, addQuotes: boolean,
        escapeSpecial?: boolean): string {
        const result = super.getTargetStringLiteralFromANTLRStringLiteral(literal, addQuotes, escapeSpecial);

        // Dollar signs would start an interpolation in Dart strings.
        return result.replaceAll("$", "\\$");
    }

    public override renderImplicitTokenLabel(tokenName: string): string {
        return `_${tokenName}`;
    }

    public override renderImplicitRuleLabel(ruleName: string): string {
        return `_${ruleName}`;
    }

    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [
            `// Generated from ${file.grammarFileName} by antlr-ng ${antlrVersion}. Do not edit!`,
            `// ignore_for_file: unused_import, unused_local_variable, prefer_single_quotes`,
        ];
    }

    protected override renderTypedContext = (ctx: OutputModelObjects.StructDecl): string => {
        return `_localctx`;
    };

    protected override renderRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.RuleFunction): Lines => {
        const result = this.startRendering("RuleFunction");

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") + " " : "";
        const args = this.renderArgs(currentRule.args);
        const callArgs = this.renderCallArgs(currentRule.args);

        result.push(
            ``,
            `${modifiers}${currentRule.ctxType} ${currentRule.escapedName}(${args}) {`,
            `  dynamic _localctx = ${currentRule.ctxType}(context, state${callArgs});`,
            `  enterRule(_localctx, ${currentRule.startState.stateNumber}, RULE_${currentRule.name});`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ...this.indent(this.renderLocals(currentRule)),
            `  try {`,
            ...this.indent(this.renderRuleBody(currentRule), 2),
        );

        // The catch clauses continue the line with the closing brace of the try block.
        const handlers: Lines = [];
        if (currentRule.exceptions && currentRule.exceptions.length > 0) {
            for (const e of currentRule.exceptions) {
                handlers.push(...this.renderExceptionClause(e));
            }
        } else {
            handlers.push(...this.renderDefaultExceptionHandler());
        }

        handlers.push(
            `finally {`,
            ...this.indent(this.renderAction(currentRule.finallyAction)),
            `  exitRule();`,
            `}`,
        );

        result.push(
            ...this.indent(this.joinBraces(handlers)),
            `  return _localctx;`,
            `}`,
        );

        return this.endRendering("RuleFunction", result);
    };

    protected override renderLeftRecursiveRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.LeftRecursiveRuleFunction): Lines => {
        const result = this.startRendering("LeftRecursiveRuleFunction");

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") + " " : "";
        const args = this.renderArgs(currentRule.args);
        const callArgs = this.renderCallArgs(currentRule.args);
        const startState = currentRule.startState.stateNumber;

        // The precedence is an optional parameter, which must come last in Dart.
        result.push(
            ``,
            `${modifiers}${currentRule.ctxType} ${currentRule.escapedName}(${args.length > 0 ? args + ", " : ""}` +
            `[int _p = 0]) {`,
            `  final _parentctx = context;`,
            `  final _parentState = state;`,
            `  dynamic _localctx = ${currentRule.ctxType}(context, _parentState${callArgs});`,
            `  var _prevctx = _localctx;`,
            `  var _startState = ${startState};`,
            `  enterRecursionRule(_localctx, ${startState}, RULE_${currentRule.name}, _p);`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ...this.indent(this.renderLocals(currentRule)),
            `  try {`,
            ...this.indent(this.renderRuleBody(currentRule), 2),
            ...this.indent(this.joinBraces([
                ...this.renderDefaultExceptionHandler(),
                `finally {`,
                ...this.indent(this.renderAction(currentRule.finallyAction)),
                `  unrollRecursionContexts(_parentctx);`,
                `}`,
            ])),
            `  return _localctx;`,
            `}`,
        );

        return this.endRendering("LeftRecursiveRuleFunction", result);
    };

    protected override renderAddToLabelList = (srcOp: OutputModelObjects.AddToLabelList): Lines => {
        return [
            `${this.renderContext(srcOp.label)}.${srcOp.listName}.add(${this.renderLabelref(srcOp.label)});`,
        ];
    };

    protected override renderVisitorDispatchMethod = (struct: OutputModelObjects.StructDecl): Lines => {
        return [
            `@override`,
            `T? accept<T>(ParseTreeVisitor<T> visitor) {`,
            `  if (visitor is ${this.invariants.grammarName}Visitor<T>) {`,
            `    return visitor.visit${this.toTitleCase(struct.derivedFromName)}(this);`,
            `  } else {`,
            `    return visitor.visitChildren(this);`,
            `  }`,
            `}`,
        ];
    };

    protected override renderListenerDispatchMethod = (struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod): Lines => {
        const enterExit = method.isEnter ? "enter" : "exit";
        const grammarName = this.invariants.grammarName;

        return [
            `@override`,
            `void ${enterExit}Rule(ParseTreeListener listener) {`,
            `  if (listener is ${grammarName}Listener) ` +
            `listener.${enterExit}${this.toTitleCase(struct.derivedFromName)}(this);`,
            `}`,
        ];
    };

    protected override renderAttributeDecl = (d: OutputModelObjects.AttributeDecl): Lines => {
        if (d.initValue) {
            return [`${d.type} ${d.escapedName} = ${d.initValue}`];
        }

        return [`${d.type}? ${d.escapedName}`];
    };

    protected override renderCaptureNextToken = (d: OutputModelObjects.CaptureNextToken): Lines => {
        return [
            `${d.varName} = tokenStream.LT(1);`,
        ];
    };

    protected override renderCaptureNextTokenType = (srcOp: OutputModelObjects.CaptureNextTokenType): Lines => {
        return [
            `${srcOp.varName} = tokenStream.LA(1)!;`,
        ];
    };

    protected override renderCodeBlockForOuterMostAlt = (
        currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(
                `_localctx = ${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context(_localctx);`,
            );
        }

        result.push(
            `enterOuterAlt(_localctx, ${currentOuterMostAltCodeBlock.alt.altNum});`,
            ...this.renderCodeBlockForAlt(currentOuterMostAltCodeBlock),
        );

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    };

    protected override renderContextRuleGetterDecl = (r: OutputModelObjects.ContextRuleGetterDecl): Lines => {
        return [
            `${r.ctxName}? ${r.escapedName}() => getRuleContext<${r.ctxName}>(0);`,
        ];
    };

    protected override renderContextRuleListGetterDecl = (r: OutputModelObjects.ContextRuleListGetterDecl): Lines => {
        return [
            `List<${r.ctxName}> ${r.name}s() => getRuleContexts<${r.ctxName}>();`,
        ];
    };

    protected override renderContextRuleListIndexedGetterDecl = (
        r: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines => {
        return [
            `${r.ctxName}? ${r.escapedName}(int i) => getRuleContext<${r.ctxName}>(i);`,
        ];
    };

    protected override renderContextTokenGetterDecl = (t: OutputModelObjects.ContextTokenGetterDecl): Lines => {
        return [
            `TerminalNode? ${t.escapedName}() => getToken(${this.invariants.recognizerName}.TOKEN_${t.name}, 0);`,
        ];
    };

    protected override renderContextTokenListGetterDecl = (t: OutputModelObjects.ContextTokenListGetterDecl): Lines => {
        return [
            `List<TerminalNode> ${t.name}s() => getTokens(${this.invariants.recognizerName}.TOKEN_${t.name});`,
        ];
    };

    protected override renderContextTokenListIndexedGetterDecl = (
        t: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines => {
        return [
            `TerminalNode? ${t.escapedName}(int i) => getToken(${this.invariants.recognizerName}.TOKEN_${t.name}, i);`,
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
            result.push(`${this.renderLabelref(choice.label)} = tokenStream.LT(1);`);
        }

        result.push(
            ...this.renderSourceOps(choice.preamble),
            `switch (tokenStream.LA(1)!) {`,
        );

        choice.alts.forEach((alt, index) => {
            result.push(
                ...this.renderCases(choice.altLook[index]),
                ...this.indent(this.renderAlt(alt)),
                `  break;`,
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
            `switch (tokenStream.LA(1)!) {`,
        );

        // The lookahead list has one more entry than the alternatives (the exit branch), which results in an
        // empty case.
        choice.altLook.forEach((look, index) => {
            const alt = choice.alts[index] as OutputModelObjects.CodeBlockForAlt | undefined;
            result.push(
                ...this.renderCases(look),
                ...this.indent(alt ? this.renderAlt(alt) : []),
                `  break;`,
            );
        });

        result.push(
            `default:`,
            `  break;`,
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

        result.push(`}`, ``);

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
            `do {`,
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt)));
        });

        result.push(
            ...this.indent(this.renderSync(choice.stateNumber)), // Loop back/exit decision.
            ...this.indent(this.renderSourceOps(choice.iteration)),
            `} while (${this.renderSourceOps(choice.loopExpr ? [choice.loopExpr] : undefined).join("")});`,
        );

        return this.endRendering("LL1PlusBlockSingleAlt", result);
    };

    protected override renderMatchToken = (m: OutputModelObjects.MatchToken): Lines => {
        const result: Lines = this.startRendering("MatchToken");

        result.push(
            `state = ${m.stateNumber};`,
            `${this.renderLabelAssignments(m.labels)}match(TOKEN_${m.name});`,
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
            `${srcOp.ctxName}? ${srcOp.escapedName}`,
        ];
    };

    protected override renderRuleContextListDecl = (ruleDecl: OutputModelObjects.RuleContextListDecl): Lines => {
        return [
            `var ${ruleDecl.escapedName} = <${ruleDecl.ctxName}>[]`,
        ];
    };

    protected override renderStructDecl = (struct: OutputModelObjects.StructDecl): Lines => {
        const result = this.startRendering("StructDecl");

        const name = struct.escapedName;
        const superClass = this.invariants.contextSuperClass ?? "ParserRuleContext";
        let interfaces = "";
        if (struct.interfaces.length > 0) {
            interfaces = " implements " + struct.interfaces.map((i) => {
                return this.renderAction(i as OutputModelObjects.Action).join("");
            }).join(", ");
        }

        const ctorArgs = struct.ctorAttrs.map((a) => {
            return `, ${this.renderAttributeDecl(a).join("")}`;
        }).join("");

        result.push(
            `class ${name} extends ${superClass}${interfaces} {`,
            ...this.indent(this.renderAttributes(struct)),
            ...this.indent(this.renderDecls(struct.getters)),
        );

        const ctor = `${name}([ParserRuleContext? parent, int? invokingState${ctorArgs}]) : ` +
            `super(parent, invokingState)`;
        if (struct.ctorAttrs.length > 0) {
            result.push(`  ${ctor} {`);
            for (const a of struct.ctorAttrs) {
                result.push(`    this.${a.escapedName} = ${a.escapedName};`);
            }
            result.push(`  }`);
        } else {
            result.push(`  ${ctor};`);
        }

        result.push(
            `  @override`,
            `  int get ruleIndex => RULE_${struct.derivedFromName};`,
        );

        // Don't need copy unless we have subclasses.
        if (struct.provideCopyFrom) {
            result.push(
                ``,
                `  @override`,
                `  void copyFrom(${superClass} ctx) {`,
                `    super.copyFrom(ctx);`,
            );

            for (const a of struct.attrs) {
                result.push(
                    `    if ((ctx as ${name}).${a.escapedName} != null) ` +
                    `this.${a.escapedName} = (ctx as ${name}).${a.escapedName};`,
                );
            }

            result.push(`  }`);
        }

        result.push(...this.indent(this.renderDispatchMethods(struct)));

        for (const e of struct.extensionMembers) {
            result.push(...this.indent(this.renderAction(e as OutputModelObjects.Action)));
        }

        result.push(`}`, ``);

        return this.endRendering("StructDecl", result);
    };

    protected override renderAltLabelStructDecl = (currentRule: OutputModelObjects.RuleFunction,
        struct: OutputModelObjects.AltLabelStructDecl): Lines => {
        const result = this.startRendering("AltLabelStructDecl");

        const parentContext = `${this.toTitleCase(struct.parentRule)}Context`;

        result.push(
            `class ${struct.escapedName} extends ${parentContext} {`,
            ...this.indent(this.renderAttributes(struct)),
            ...this.indent(this.renderDecls(struct.getters)),
            `  ${struct.escapedName}(${parentContext} ctx) { copyFrom(ctx); }`,
            ...this.indent(this.renderDispatchMethods(struct)),
            `}`,
            ``,
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
            `${this.invariants.tokenLabelType}? ${t.escapedName}`,
        ];
    };

    protected override renderTokenTypeDecl = (srcOp: OutputModelObjects.TokenTypeDecl): Lines => {
        return [
            `int ${srcOp.escapedName};`,
        ];
    };

    protected override renderTokenListDecl = (t: OutputModelObjects.TokenListDecl): Lines => {
        return [
            `var ${t.escapedName} = <${this.invariants.tokenLabelType}>[]`,
        ];
    };

    protected override renderThrowNoViableAlt = (srcOp: OutputModelObjects.ThrowNoViableAlt): Lines => {
        return [
            `throw NoViableAltException(this);`,
        ];
    };

    protected override renderWildcard = (w: OutputModelObjects.Wildcard): Lines => {
        const result: Lines = this.startRendering("Wildcard");

        result.push(
            `state = ${w.stateNumber};`,
            `${this.renderLabelAssignments(w.labels)}matchWildcard();`,
        );

        return this.endRendering("Wildcard", result);
    };

    protected override renderStarBlock = (choice: OutputModelObjects.StarBlock): Lines => {
        const result: Lines = this.startRendering("StarBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const predict = this.renderAdaptivePredict(choice.decision);

        result.push(
            ...this.renderSync(choice.stateNumber),
            `_alt = ${predict};`,
            `while (_alt != ${choice.exitAlt} && _alt != ATN.INVALID_ALT_NUMBER) {`,
            `  if (_alt == 1${!blockAST.greedy ? " + 1" : ""}) {`,
            ...this.indent(this.renderSourceOps(choice.iteration), 2),
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt), 2));
        });

        result.push(
            `  }`,
            ...this.indent(this.renderSync(choice.loopBackStateNumber)),
            `  _alt = ${predict};`,
            `}`,
        );

        return this.endRendering("StarBlock", result);
    };

    protected override renderPlusBlock = (choice: OutputModelObjects.PlusBlock): Lines => {
        const result: Lines = this.startRendering("PlusBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const nonGreedy = !blockAST.greedy ? "+1" : "";

        result.push(
            ...this.renderSync(choice.blockStartStateNumber), // Alt block decision.
            `_alt = 1${nonGreedy};`,
            `do {`,
            `  switch (_alt) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `  case ${index + 1}${!blockAST.greedy ? " + 1" : ""}:`,
                ...this.indent(this.renderAlt(alt), 2),
                `    break;`,
            );
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(
            `  default:`,
            ...this.indent(this.renderThrowNoViableAlt(noViableAltObject), 2),
            `  }`,
            ...this.indent(this.renderSync(choice.loopBackStateNumber)), // Loop back/exit decision.
            `  _alt = ${this.renderAdaptivePredict(choice.decision)};`,
            `} while (_alt != ${choice.exitAlt} && _alt != ATN.INVALID_ALT_NUMBER);`,
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
                `case ${index + 1}${!blockAST.greedy ? "+1" : ""}:`,
                ...this.indent(this.renderAlt(alt)),
                `  break;`,
            );
        });

        result.push(`}`);

        return this.endRendering("OptionalBlock", result);
    };

    protected override renderAltBlock = (choice: OutputModelObjects.AltBlock): Lines => {
        const result: Lines = this.startRendering("AltBlock");

        result.push(...this.renderSync(choice.stateNumber));

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = tokenStream.LT(1);`);
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
                `  break;`,
            );
        });

        result.push(`}`);

        return this.endRendering("AltBlock", result);
    };

    protected override renderInvokeRule = (r: OutputModelObjects.InvokeRule): Lines => {
        const result: Lines = this.startRendering("InvokeRule");

        const ast = r.ast as GrammarASTWithOptions | undefined;
        const precedence = ast?.getOptionString("p");
        const args: string[] = [];

        const argExprs = this.renderActionChunks(r.argExprsChunks).join("");
        if (argExprs.length > 0) {
            args.push(argExprs);
        }

        // The precedence is the (optional) last parameter of a left recursive rule function.
        if (precedence) {
            args.push(precedence);
        }

        result.push(
            `state = ${r.stateNumber};`,
            `${this.renderLabelAssignments(r.labels)}${r.escapedName}(${args.join(", ")});`,
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
            `state = ${p.stateNumber};`,
            `if (!(${chunks})) {`,
            `  throw FailedPredicateException(this, ${p.predicate}${message});`,
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
            `void _${r.name}_action(${r.ctxType}? _localctx, int actionIndex) {`,
            `  switch (actionIndex) {`,
        );

        for (const [index, action] of r.actions) {
            const lines = this.renderAction(action);
            if (lines.length <= 1) {
                result.push(`    case ${index}: ${lines.join("").trim()} break;`);
            } else {
                result.push(
                    `    case ${index}:`,
                    ...this.indent(lines, 3),
                    `      break;`,
                );
            }
        }

        result.push(
            `  }`,
            `}`,
        );

        return this.endRendering("RuleActionFunction", result);
    }

    protected override renderRuleSempredFunction = (r: OutputModelObjects.RuleSempredFunction): Lines => {
        const result = this.startRendering("RuleSempredFunction");

        result.push(
            `bool _${r.name}_sempred(dynamic _localctx, int predIndex) {`,
            `  switch (predIndex) {`,
        );

        for (const [index, action] of r.actions) {
            result.push(`    case ${index}: return ${this.renderAction(action).join("\n").trim()};`);
        }

        result.push(
            `  }`,
            `  return true;`,
            `}`,
        );

        return this.endRendering("RuleSempredFunction", result);
    };

    protected override renderSerializedATN = (model: OutputModelObjects.SerializedATN): Lines => {
        const result = this.startRendering("SerializedATN");

        // The ATN is rendered inside the recognizer class, so the list is indented by 6 columns in total.
        result.push(
            `static const List<int> _serializedATN = [`,
            ...this.renderList(model.serialized, { wrap: this.wrapWidth(6), indent: 4, separator: "," }),
            `];`,
            ``,
            `static final ATN _ATN =`,
            `    ATNDeserializer().deserialize(_serializedATN);`,
        );

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
            return `_localctx.${t.escapedName}`;
        }

        return t.escapedName;
    }

    protected renderCases(tokens: OutputModelObjects.ITokenInfo[]): Lines {
        return tokens.map((t) => {
            return `case TOKEN_${t.name}:`;
        });
    }

    // Lexer command methods. These are only used for custom lexer commands, the standard commands are
    // handled by the lexer ATN directly.
    protected override renderLexerSkipCommand = (): Lines => {
        return [
            "skip();",
        ];
    };

    protected override renderLexerMoreCommand = (): Lines => {
        return [
            "more();",
        ];
    };

    protected override renderLexerPopModeCommand = (): Lines => {
        return [
            "popMode();",
        ];
    };

    protected override renderLexerTypeCommand = (arg: string): Lines => {
        return [
            `type = ${arg};`,
        ];
    };

    protected override renderLexerChannelCommand = (arg: string): Lines => {
        return [
            `channel = ${arg};`,
        ];
    };

    protected override renderLexerModeCommand = (arg: string): Lines => {
        return [
            `mode_ = ${arg};`,
        ];
    };

    protected override renderLexerPushModeCommand = (arg: string): Lines => {
        return [
            `pushMode(${arg});`,
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
            `(getInvokingContext(${s.ruleIndex}) as ${this.toTitleCase(s.ruleName)}Context).${s.escapedName}`,
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
            `this`,
        ];
    };

    protected override renderRulePropertyRefStart = (t: OutputModelObjects.RulePropertyRefStart): Lines => {
        return [
            `${this.renderContext(t)}.${t.label}.start`,
        ];
    };

    protected override renderRulePropertyRefStop = (t: OutputModelObjects.RulePropertyRefStop): Lines => {
        return [
            `${this.renderContext(t)}.${t.label}.stop`,
        ];
    };

    protected override renderRulePropertyRefText = (t: OutputModelObjects.RulePropertyRefText): Lines => {
        const ref = `${this.renderContext(t)}.${t.label}`;

        return [
            `(${ref} != null ? tokenStream.getTextRange(${ref}.start, ${ref}.stop) : null)`,
        ];
    };

    protected override renderSetAttr = (s: OutputModelObjects.SetAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        return [
            `${this.renderContext(s)}.${s.escapedName} = ${rhs};`,
        ];
    };

    protected override renderSetNonLocalAttr = (s: OutputModelObjects.SetNonLocalAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        return [
            `(getInvokingContext(${s.ruleIndex}) as ${this.toTitleCase(s.ruleName)}Context).${s.escapedName} = ` +
            `${rhs};`,
        ];
    };

    protected override renderThisRulePropertyRefCtx = (t: OutputModelObjects.ThisRulePropertyRefCtx): Lines => {
        return [
            `_localctx`,
        ];
    };

    protected override renderThisRulePropertyRefParser = (t: OutputModelObjects.ThisRulePropertyRefParser): Lines => {
        return [
            `this`,
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
            `tokenStream.getTextRange(_localctx.start, tokenStream.LT(-1))`,
        ];
    };

    protected override renderTokenPropertyRefChannel = (t: OutputModelObjects.TokenPropertyRefChannel): Lines => {
        return [this.renderTokenProperty(t, "channel", "0")];
    };

    protected override renderTokenPropertyRefIndex = (t: OutputModelObjects.TokenPropertyRefIndex): Lines => {
        return [this.renderTokenProperty(t, "tokenIndex", "0")];
    };

    protected override renderTokenPropertyRefInt = (t: OutputModelObjects.TokenPropertyRefInt): Lines => {
        const ref = `${this.renderContext(t)}.${t.label}`;

        return [
            `${ref} != null ? int.parse(${ref}.text) : 0`,
        ];
    };

    protected override renderTokenPropertyRefLine = (t: OutputModelObjects.TokenPropertyRefLine): Lines => {
        return [this.renderTokenProperty(t, "line", "0")];
    };

    protected override renderTokenPropertyRefPos = (t: OutputModelObjects.TokenPropertyRefPos): Lines => {
        return [this.renderTokenProperty(t, "charPositionInLine", "0")];
    };

    protected override renderTokenPropertyRefText = (t: OutputModelObjects.TokenPropertyRefText): Lines => {
        return [
            `${this.renderContext(t)}.${t.label}.text`,
        ];
    };

    protected override renderTokenPropertyRefType = (t: OutputModelObjects.TokenPropertyRefType): Lines => {
        return [this.renderTokenProperty(t, "type", "0")];
    };

    protected override renderTokenRef = (t: OutputModelObjects.TokenRef): Lines => {
        return [
            `${this.renderContext(t)}.${t.escapedName}`,
        ];
    };

    private renderParser(parser: OutputModelObjects.Parser, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const parserName = parser.name;
        const superClass = parser.superClass ? this.renderActionChunks([parser.superClass]).join("") : "Parser";

        result.push(...this.renderAction(namedActions.get("definitions")));

        if (parser.rules.length > 0) {
            const rules = parser.rules.map((r) => {
                return `RULE_${r.name} = ${r.index}`;
            });
            result.push(...this.renderAnchoredList("const int ", rules, ";"));
        }

        result.push(
            `class ${parserName} extends ${superClass} {`,
            `  ${this.renderCheckVersion()}`,
            `  static const int TOKEN_EOF = IntStream.EOF;`,
            ``,
            `  static final List<DFA> _decisionToDFA = List.generate(`,
            `      _ATN.numberOfDecisions, (i) => DFA(_ATN.getDecisionState(i), i));`,
            `  static final PredictionContextCache _sharedContextCache = PredictionContextCache();`,
        );

        if (parser.tokens.size > 0) {
            result.push(...this.renderAnchoredList("  static const int ", this.renderTokenConstants(parser), ";"));
        }

        result.push(
            ``,
            `  @override`,
            `  final List<String> ruleNames = [`,
            ...this.renderList(parser.ruleNames, { wrap: this.wrapWidth(4), indent: 4, quote: "'" }),
            `  ];`,
            ``,
            ...this.indent(this.renderVocabulary(parser.literalNames, parser.symbolicNames)),
            ``,
            `  @override`,
            `  String get grammarFileName => '${parser.grammarFileName}';`,
            ``,
            `  @override`,
            `  List<int> get serializedATN => _serializedATN;`,
            ``,
            `  @override`,
            `  ATN getATN() {`,
            `    return _ATN;`,
            `  }`,
            ``,
            ...this.indent(this.renderAction(namedActions.get("members"))),
            `  ${parserName}(TokenStream input) : super(input) {`,
            `    interpreter = ParserATNSimulator(this, _ATN, _decisionToDFA, _sharedContextCache);`,
            `  }`,
        );

        this.append(result, this.indent(this.renderRuleFunctions(namedActions, parser.funcs)));

        if (parser.sempredFuncs.size > 0) {
            result.push(
                `  @override`,
                `  bool sempred(RuleContext? _localctx, int ruleIndex, int predIndex) {`,
                `    switch (ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of parser.sempredFuncs.values()) {
                result.push(
                    `    case ${f.ruleIndex}:`,
                    `      return _${f.name}_sempred(_localctx as ${f.ctxType}?, predIndex);`,
                );

                funcs.push(...this.renderRuleSempredFunction(f));
            }

            result.push(
                `    }`,
                `    return true;`,
                `  }`,
                ...this.indent(funcs),
            );
        }

        result.push(
            ``,
            ...this.indent(this.renderSerializedATN(parser.atn)),
            `}`,
        );

        // The rule contexts, followed by the contexts of the labeled alternatives.
        for (const func of parser.funcs) {
            this.append(result, this.renderStructDecl(func.ruleCtx));
        }

        for (const func of parser.funcs) {
            func.altLabelCtxs?.forEach((ctx) => {
                this.append(result, this.renderAltLabelStructDecl(func, ctx));
            });
        }

        return result;
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const lexerName = lexer.name;
        const superClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]).join("") : "Lexer";

        result.push(
            ...this.renderAction(namedActions.get("definitions")),
            ``,
            `class ${lexerName} extends ${superClass} {`,
            `  ${this.renderCheckVersion()}`,
            ``,
            `  static final List<DFA> _decisionToDFA = List.generate(`,
            `        _ATN.numberOfDecisions, (i) => DFA(_ATN.getDecisionState(i), i));`,
            `  static final PredictionContextCache _sharedContextCache = PredictionContextCache();`,
        );

        if (lexer.tokens.size > 0) {
            result.push(
                `  static const int`,
                ...this.renderList(this.renderTokenConstants(lexer),
                    { wrap: this.wrapWidth(4), indent: 4, finalSeparator: ";" }),
            );
        }

        if (lexer.escapedChannels.size > 0) {
            const channels = Array.from(lexer.escapedChannels).map(([name, value]) => {
                return `${name} = ${value}`;
            });
            result.push(
                `  static const int`,
                ...this.renderList(channels, { wrap: this.wrapWidth(4), indent: 4, finalSeparator: ";" }),
            );
        }

        // The first mode is always the default mode, which needs no constant.
        const modes = lexer.escapedModeNames.slice(1).map((m, i) => {
            return `${m} = ${i + 1}`;
        });
        if (modes.length > 0) {
            result.push(
                `  static const int`,
                ...this.renderList(modes, { wrap: this.wrapWidth(4), indent: 4, finalSeparator: ";" }),
            );
        }

        result.push(
            ``,
            `  @override`,
            `  final List<String> channelNames = [`,
            ...this.renderList(["DEFAULT_TOKEN_CHANNEL", "HIDDEN", ...lexer.channelNames],
                { wrap: this.wrapWidth(4), indent: 4, quote: "'" }),
            `  ];`,
            ``,
            `  @override`,
            `  final List<String> modeNames = [`,
            ...this.renderList(lexer.modes, { wrap: this.wrapWidth(4), indent: 4, quote: "'" }),
            `  ];`,
            ``,
            `  @override`,
            `  final List<String> ruleNames = [`,
            ...this.renderList(lexer.ruleNames, { wrap: this.wrapWidth(4), indent: 4, quote: "'" }),
            `  ];`,
            ``,
            ...this.indent(this.renderVocabulary(lexer.literalNames, lexer.symbolicNames)),
            ``,
            ...this.indent(this.renderAction(namedActions.get("members"))),
            ``,
            `  ${lexerName}(CharStream input) : super(input) {`,
            `    interpreter = LexerATNSimulator(_ATN, _decisionToDFA, _sharedContextCache, recog: this);`,
            `  }`,
            ``,
            `  @override`,
            `  List<int> get serializedATN => _serializedATN;`,
            ``,
            `  @override`,
            `  String get grammarFileName => '${lexer.grammarFileName}';`,
            ``,
            `  @override`,
            `  ATN getATN() { return _ATN; }`,
            ``,
            ...this.indent(this.renderActionHandlers(lexer)),
            ...this.indent(this.renderSerializedATN(lexer.atn)),
            `}`,
        );

        return result;
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
                `@override`,
                `void action(RuleContext? _localctx, int ruleIndex, int actionIndex) {`,
                `  switch (ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of lexer.actionFuncs.values()) {
                result.push(
                    `  case ${f.ruleIndex}:`,
                    `    _${f.name}_action(_localctx, actionIndex);`,
                    `    break;`,
                );

                funcs.push(...this.renderRuleActionFunction(f));
            }

            result.push(
                `  }`,
                `}`,
                ...funcs,
            );
        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(
                `@override`,
                `bool sempred(RuleContext? _localctx, int ruleIndex, int predIndex) {`,
                `  switch (ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of lexer.sempredFuncs.values()) {
                result.push(
                    `  case ${f.ruleIndex}:`,
                    `    return _${f.name}_sempred(_localctx, predIndex);`,
                );

                funcs.push(...this.renderRuleSempredFunction(f));
            }

            result.push(
                `  }`,
                `  return true;`,
                `}`,
                ...funcs,
            );
        }

        if (result.length > 0) {
            result.push(``);
        }

        return this.endRendering("actionHandlers", result);
    }

    /**
     * Renders the static runtime version check of a recognizer class.
     *
     * @returns The rendered line.
     */
    private renderCheckVersion(): string {
        return `static final checkVersion = () => RuntimeMetaData.checkVersion(` +
            `'${DartTargetGenerator.runtimeVersion}', RuntimeMetaData.VERSION);`;
    }

    private renderVocabulary(literalNames: Array<string | null>, symbolicNames: Array<string | null>): Lines {
        return [
            `static final List<String?> _LITERAL_NAMES = [`,
            ...this.renderList(literalNames, { wrap: this.wrapWidth(6), indent: 4, null: "null" }),
            `];`,
            `static final List<String?> _SYMBOLIC_NAMES = [`,
            ...this.renderList(symbolicNames, { wrap: this.wrapWidth(6), indent: 4, null: "null" }),
            `];`,
            `static final Vocabulary VOCABULARY = VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);`,
            ``,
            `@override`,
            `Vocabulary get vocabulary {`,
            `  return VOCABULARY;`,
            `}`,
        ];
    }

    /**
     * Renders the token type constants (`TOKEN_<name> = <type>`) of a recognizer.
     *
     * @param recognizer The parser or lexer model object.
     *
     * @returns The rendered constant definitions (without separators).
     */
    private renderTokenConstants(recognizer: OutputModelObjects.Recognizer): string[] {
        return Array.from(recognizer.tokens).map(([name, type]) => {
            return `TOKEN_${name} = ${type}`;
        });
    }

    /**
     * Renders a comma separated list which starts on the same line as the given prefix. Continuation lines are
     * indented to the end of the prefix (like the `anchor` option of StringTemplate).
     *
     * @param prefix The text to render before the first item.
     * @param items The items to render.
     * @param finalSeparator The text to render after the last item.
     *
     * @returns The rendered lines.
     */
    private renderAnchoredList(prefix: string, items: string[], finalSeparator: string): Lines {
        const lines = this.renderList(items, { wrap: this.wrapWidth(prefix.length), finalSeparator });
        const anchor = " ".repeat(prefix.length);

        return lines.map((line, index) => {
            return (index === 0 ? prefix : anchor) + line;
        });
    }

    /**
     * Determines the `wrap` value for `renderList`, which breaks a line once its length exceeds that value. The
     * old generator broke a line before an element, when the current column (including the indentation) had
     * reached the line width.
     *
     * @param indentation The number of columns before the list items start.
     *
     * @returns The wrap value to use.
     */
    private wrapWidth(indentation: number): number {
        return DartTargetGenerator.lineWidth - indentation - 1;
    }

    /**
     * Renders the local variable declarations of a rule function.
     *
     * @param currentRule The rule to render.
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
     * Renders the body of a rule function (the part inside the try block).
     *
     * @param currentRule The rule to render.
     *
     * @returns The rendered lines.
     */
    private renderRuleBody(currentRule: OutputModelObjects.RuleFunction): Lines {
        const result: Lines = [];
        if (currentRule.hasLookaheadBlock) {
            result.push(`int _alt;`);
        }

        result.push(
            ...this.renderSourceOps(currentRule.code),
            ...this.renderSourceOps(currentRule.postamble),
            ...this.renderAction(currentRule.namedActions?.get("after")),
        );

        return result;
    }

    private renderDefaultExceptionHandler(): Lines {
        return [
            `on RecognitionException catch (re) {`,
            `  _localctx.exception = re;`,
            `  errorHandler.reportError(this, re);`,
            `  errorHandler.recover(this, re);`,
            `}`,
        ];
    }

    /**
     * Renders the fields of a context class (one per attribute, token or rule reference).
     *
     * @param struct The struct to render the fields for.
     *
     * @returns The rendered lines.
     */
    private renderAttributes(struct: OutputModelObjects.StructDecl): Lines {
        const result: Lines = [];
        for (const a of struct.attrs) {
            result.push(`${this.renderDecl(a)};`);
        }

        return result;
    }

    /**
     * Renders a single declaration of a context class field.
     *
     * @param d The declaration to render.
     *
     * @returns The rendered declaration (without a trailing semicolon).
     */
    private renderDecl(d: OutputModelObjects.Decl): string {
        if (d instanceof OutputModelObjects.TokenListDecl) {
            return this.renderTokenListDecl(d).join("");
        }

        if (d instanceof OutputModelObjects.TokenDecl) {
            return this.renderTokenDecl(d).join("");
        }

        if (d instanceof OutputModelObjects.RuleContextListDecl) {
            return this.renderRuleContextListDecl(d).join("");
        }

        if (d instanceof OutputModelObjects.RuleContextDecl) {
            return this.renderRuleContextDecl(d).join("");
        }

        if (d instanceof OutputModelObjects.AttributeDecl) {
            return this.renderAttributeDecl(d).join("");
        }

        throw new Error(`Unhandled declaration type: ${d.constructor.name}`);
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
        return `interpreter!.adaptivePredict(tokenStream, ${decision}, context)`;
    }

    private renderSync(stateNumber: number): Lines {
        return [
            `state = ${stateNumber};`,
            `errorHandler.sync(this);`,
        ];
    }

    /**
     * Renders the assignment prefix for labeled elements, e.g. `_localctx.name = `.
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
     * Renders a null-safe access to a token property, like `$t.line`.
     *
     * @param t The token property reference.
     * @param property The property to read from the token.
     * @param defaultValue The value to return when the token is null.
     *
     * @returns The rendered expression.
     */
    private renderTokenProperty(t: TokenPropertyRef, property: string, defaultValue: string): string {
        const ref = `${this.renderContext(t)}.${t.label}`;

        return `${ref} != null ? ${ref}.${property} : ${defaultValue}`;
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

        return `(((${shiftVar}) & ~0x3f) == 0 && ((1 << ${shiftVar}) & ${bits.calculated}) != 0)`;
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `${s.varName} == TOKEN_${t.name}`;
        }).join(" || ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        return offset > 0 ? `(${shiftAmount} - ${offset})` : shiftAmount;
    }

    private renderCommonSetStuff = (m: OutputModelObjects.MatchSet, invert: boolean): Lines => {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`state = ${m.stateNumber};`);

        if (m.labels.length > 0) {
            result.push(`${this.renderLabelAssignments(m.labels)}tokenStream.LT(1);`);
        }

        result.push(...this.renderCaptureNextTokenType(m.capture));

        const expr = this.renderTestSetInline(m.expr).join("");
        if (invert) {
            result.push(`if (${m.expr.varName} <= 0 || (${expr})) {`);
        } else {
            result.push(`if (!(${expr})) {`);
        }

        result.push(
            `  ${this.renderLabelAssignments(m.labels)}errorHandler.recoverInline(this);`,
            `} else {`,
            `  if ( tokenStream.LA(1)! == IntStream.EOF ) matchedEOF = true;`,
            `  errorHandler.reportMatch(this);`,
            `  consume();`,
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
            return this.renderAttributeDecl(a).join("");
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
     * Joins a sequence of blocks (e.g. `catch` and `finally` clauses) so that each clause starts on the line of
     * the closing brace of the previous block (`} catch (...) {`). The first line gets a leading `}` as well.
     *
     * @param blocks The lines of all blocks.
     *
     * @returns The joined lines.
     */
    private joinBraces(blocks: Lines): Lines {
        const result: Lines = [];
        let pendingBrace = true;

        for (const line of blocks) {
            if (line === undefined) {
                continue;
            }

            if (pendingBrace) {
                result.push(`} ${line}`);
                pendingBrace = false;
            } else if (line === "}") {
                pendingBrace = true;
            } else {
                result.push(line);
            }
        }

        if (pendingBrace) {
            result.push(`}`);
        }

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
     * Prefixes all non-empty lines with the given number of indentation levels (2 spaces each). Undefined
     * lines are removed.
     *
     * @param lines The lines to indent.
     * @param levels The number of levels to indent.
     *
     * @returns The indented lines.
     */
    private indent(lines: Lines, levels = 1): Lines {
        const prefix = "  ".repeat(levels);
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
