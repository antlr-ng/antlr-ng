/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// C# target generator - based on CSharp.stg template

import * as OutputModelObjects from "../codegen/model/index.js";

import { GeneratorBase, type NamedActions } from "../codegen/GeneratorBase.js";
import type { CodePoint, ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { IGenerationOptions } from "../config/config.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import type { Rule } from "../tool/Rule.js";
import { antlrVersion } from "../version.js";

export class CSharpTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.csharp";
    public readonly version = "1.0.0";

    public readonly language = "CSharp";
    public readonly languageSpecifiers = ["csharp", "c#", "cs"];

    public override readonly codeFileExtension = ".cs";

    public override readonly lexerRuleContext = "RuleContext";

    public override readonly wantsBaseListener = true;
    public override readonly wantsBaseVisitor = true;
    public override readonly supportsOverloadedMethods = true;
    public override readonly isATNSerializedAsInts = true;
    public override readonly inlineTestSetWordSize = 64;

    /**
     * C# reserved words
     */
    public override readonly reservedWords = new Set([
        "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char", "checked", "class", "const",
        "continue", "decimal", "default", "delegate", "do", "double", "else", "enum", "event", "explicit", "extern",
        "false", "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit", "in", "int", "interface",
        "internal", "is", "lock", "long", "namespace", "new", "null", "object", "operator", "out", "override",
        "params", "private", "protected", "public", "readonly", "ref", "return", "sbyte", "sealed", "short", "sizeof",
        "stackalloc", "static", "string", "struct", "switch", "this", "throw", "true", "try", "typeof", "uint", "ulong",
        "unchecked", "unsafe", "ushort", "using", "virtual", "values", "void", "volatile", "while",
    ]);

    private escapeMap: Map<CodePoint, string>;

    public constructor(logRendering: boolean) {
        super(logRendering);

        // C# character escape sequences
        // https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/strings/#string-escape-sequences
        this.escapeMap = new Map(GeneratorBase.defaultCharValueEscape);
        this.escapeMap.set(0, "0");
        this.escapeMap.set(0x07, "a");
        this.escapeMap.set(0x08, "b");
        this.escapeMap.set(0x0B, "v");
        this.escapeMap.set(0x1B, "e");
        this.escapeMap.set(0x3F, "?");
    }

    public renderParserFile = (parserFile: OutputModelObjects.ParserFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.recognizerName = parserFile.parser.name;
        this.invariants.grammarName = parserFile.parser.grammarName;
        this.invariants.grammarFileName = parserFile.parser.grammarFileName;
        this.invariants.tokenLabelType = parserFile.TokenLabelType ?? "IToken";

        const className = parserFile.contextSuperClass
            ? this.renderActionChunks([parserFile.contextSuperClass]).join("") : undefined;
        this.invariants.contextSuperClass = className;

        const result: Lines = this.renderFileHeader(parserFile);

        if (options.package) {
            result.push(`namespace ${options.package} {`);
        }

        result.push(...this.renderAction(parserFile.namedActions.get("header")));
        result.push("using System;");
        result.push("using System.IO;");
        result.push("using System.Text;");
        result.push("using System.Diagnostics;");
        result.push("using System.Collections.Generic;");
        result.push("using Antlr4.Runtime;");
        result.push("using Antlr4.Runtime.Atn;");
        result.push("using Antlr4.Runtime.Misc;");
        result.push("using Antlr4.Runtime.Tree;");
        result.push("using DFA = Antlr4.Runtime.Dfa.DFA;");
        result.push("");

        result.push(...this.renderParser(parserFile, parserFile.namedActions));

        if (options.package) {
            result.push(`} // namespace ${options.package}`);
        }

        return result.join("\n");
    };

    public renderLexerFile = (lexerFile: OutputModelObjects.LexerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.recognizerName = lexerFile.lexer.name;
        this.invariants.grammarName = lexerFile.lexer.grammarName;
        this.invariants.grammarFileName = lexerFile.lexer.grammarFileName;
        this.invariants.tokenLabelType = lexerFile.TokenLabelType ?? "IToken";

        const result: Lines = this.renderFileHeader(lexerFile);

        if (options.package) {
            result.push(`namespace ${options.package} {`);
        }

        result.push(...this.renderAction(lexerFile.namedActions.get("header")));
        result.push("using System;");
        result.push("using System.IO;");
        result.push("using System.Text;");
        result.push("using Antlr4.Runtime;");
        result.push("using Antlr4.Runtime.Atn;");
        result.push("using Antlr4.Runtime.Misc;");
        result.push("using DFA = Antlr4.Runtime.Dfa.DFA;");
        result.push("");

        result.push(...this.renderLexer(lexerFile.lexer, lexerFile.namedActions, options.package));

        if (options.package) {
            result.push(`} // namespace ${options.package}`);
        }

        return result.join("\n");
    };

    public renderBaseListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = listenerFile.grammarName;
        this.invariants.grammarFileName = listenerFile.grammarFileName;
        this.invariants.tokenLabelType = listenerFile.TokenLabelType ?? "IToken";

        const result: Lines = this.renderFileHeader(listenerFile);

        if (options.package) {
            result.push(`namespace ${options.package} {`);
        }

        result.push(...this.renderAction(listenerFile.namedActions.get("header")));
        result.push(``);
        result.push(`using Antlr4.Runtime.Misc;`);
        result.push(`using IErrorNode = Antlr4.Runtime.Tree.IErrorNode;`);
        result.push(`using ITerminalNode = Antlr4.Runtime.Tree.ITerminalNode;`);
        result.push(`using IToken = Antlr4.Runtime.IToken;`);
        result.push(`using ParserRuleContext = Antlr4.Runtime.ParserRuleContext;`);
        result.push(``);
        result.push(`/// <summary>`);
        result.push(`/// This class provides an empty implementation of <see cref="` +
            `I${listenerFile.grammarName}Listener"/>,`);
        result.push(`/// which can be extended to create a listener which only needs to handle a subset`);
        result.push(`/// of the available methods.`);
        result.push(`/// </summary>`);
        result.push(`[System.CodeDom.Compiler.GeneratedCode("ANTLR", "${antlrVersion}")]`);
        result.push(`[System.Diagnostics.DebuggerNonUserCode]`);
        result.push(`[System.CLSCompliant(false)]`);
        result.push(`public partial class ${listenerFile.grammarName}BaseListener : ` +
            `I${listenerFile.grammarName}Listener {`);

        const parserName = listenerFile.parserName;
        const block: Lines = [];
        listenerFile.listenerNames.forEach((lname) => {
            block.push(`/// <summary>`);

            const listenerName = this.toTitleCase(lname);
            const ruleName = listenerFile.listenerLabelRuleNames.get(lname);
            if (ruleName) {
                block.push(`/// Enter a parse tree produced by the <c>${lname}</c>`);
                block.push(`/// labeled alternative in <see cref="${parserName}.${ruleName}"/>.`);

            } else {
                block.push(`/// Enter a parse tree produced by <see cref="${parserName}.${lname}"/>.`);
            }

            block.push(`/// <para>The default implementation does nothing.</para>`);
            block.push(`/// </summary>`);
            block.push(`/// <param name="context">The parse tree.</param>`);
            block.push(`public virtual void Enter${listenerName}([NotNull] ${parserName}.${listenerName}Context ` +
                `context) { }`);
            block.push(`/// <summary>`);

            if (ruleName) {
                block.push(`/// Exit a parse tree produced by the <c>${lname}</c>`);
                block.push(`/// labeled alternative in <see cref="${parserName}.${ruleName}"/>.`);
            } else {
                block.push(`/// Exit a parse tree produced by <see cref="${parserName}.${lname}"/>.`);
            }

            block.push(`/// <para>The default implementation does nothing.</para>`);
            block.push(`/// </summary>`);
            block.push(`/// <param name="context">The parse tree.</param>`);
            block.push(`public virtual void Exit${listenerName}([NotNull] ${parserName}.${listenerName}Context ` +
                `context) { }`);

        });

        result.push(...this.formatLines(block, 4));
        result.push(``);
        result.push(`    /// <inheritdoc/>`);
        result.push(`    /// <remarks>The default implementation does nothing.</remarks>`);
        result.push(`    public virtual void EnterEveryRule([NotNull] ParserRuleContext context) { }`);
        result.push(`    /// <inheritdoc/>`);
        result.push(`    /// <remarks>The default implementation does nothing.</remarks>`);
        result.push(`    public virtual void ExitEveryRule([NotNull] ParserRuleContext context) { }`);
        result.push(`    /// <inheritdoc/>`);
        result.push(`    /// <remarks>The default implementation does nothing.</remarks>`);
        result.push(`    public virtual void VisitTerminal([NotNull] ITerminalNode node) { }`);
        result.push(`    /// <inheritdoc/>`);
        result.push(`    /// <remarks>The default implementation does nothing.</remarks>`);
        result.push(`    public virtual void VisitErrorNode([NotNull] IErrorNode node) { }`);
        result.push(`}`);

        if (options.package) {
            result.push(`} // namespace ${options.package}`);
        }

        return result.join("\n");
    };

    public renderBaseVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;
        this.invariants.tokenLabelType = visitorFile.TokenLabelType ?? "IToken";

        const result: Lines = this.renderFileHeader(visitorFile);
        if (options.package) {
            result.push(`namespace ${options.package} {`);
        }

        result.push(...this.renderAction(visitorFile.namedActions.get("header")));

        result.push(`using Antlr4.Runtime.Misc;`);
        result.push(`using Antlr4.Runtime.Tree;`);
        result.push(`using IToken = Antlr4.Runtime.IToken;`);
        result.push(`using ParserRuleContext = Antlr4.Runtime.ParserRuleContext;`);
        result.push(``);

        const grammarName = visitorFile.grammarName;
        result.push(`/// <summary>`);
        result.push(`/// This class provides an empty implementation of <see cref="I${grammarName}Visitor{Result}"/>,`);
        result.push(`/// which can be extended to create a visitor which only needs to handle a subset`);
        result.push(`/// of the available methods.`);
        result.push(`/// </summary>`);
        result.push(`/// <typeparam name="Result">The return type of the visit operation.</typeparam>`);
        result.push(`[System.CodeDom.Compiler.GeneratedCode("ANTLR", "${antlrVersion}")]`);
        result.push(`[System.Diagnostics.DebuggerNonUserCode]`);
        result.push(`[System.CLSCompliant(false)]`);
        result.push(`public partial class ${grammarName}BaseVisitor<Result> : AbstractParseTreeVisitor<Result>, ` +
            `I${grammarName}Visitor<Result> {`);

        const parserName = visitorFile.parserName;
        const block: Lines = [];
        visitorFile.visitorNames.forEach((lname) => {
            block.push(`/// <summary>`);

            const labelRuleName = visitorFile.visitorLabelRuleNames.get(lname);
            if (labelRuleName) {
                block.push(`/// Visit a parse tree produced by the <c>${lname}</c>`);
                block.push(`/// labeled alternative in <see cref="${parserName}.${labelRuleName}"/>.`);
            } else {
                block.push(`/// Visit a parse tree produced by <see cref="${parserName}.${lname}"/>.`);
            }

            block.push(`/// <para>`);
            block.push(`/// The default implementation returns the result of calling <see cref=` +
                `"AbstractParseTreeVisitor{Result}.VisitChildren(IRuleNode)"/>`);
            block.push(`/// on <paramref name="context"/>.`);
            block.push(`/// </para>`);
            block.push(`/// </summary>`);
            block.push(`/// <param name="context">The parse tree.</param>`);
            block.push(`/// <return>The visitor result.</return>`);

            const listenerName = this.toTitleCase(lname);
            block.push(`public virtual Result Visit${listenerName}([NotNull] ${parserName}.${listenerName}Context ` +
                `context) { return VisitChildren(context); }`);
        });

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        if (options.package) {
            result.push(`} // namespace ${options.package}`);
        }

        return result.join("\n");
    };

    public renderListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = listenerFile.grammarName;
        this.invariants.grammarFileName = listenerFile.grammarFileName;
        this.invariants.tokenLabelType = listenerFile.TokenLabelType ?? "IToken";

        const result: Lines = this.renderFileHeader(listenerFile);
        if (options.package) {
            result.push(`namespace ${options.package} {`);
        }

        result.push(...this.renderAction(listenerFile.namedActions.get("header")));

        const parserName = listenerFile.parserName;
        result.push(`using Antlr4.Runtime.Misc;`);
        result.push(`using IParseTreeListener = Antlr4.Runtime.Tree.IParseTreeListener;`);
        result.push(`using IToken = Antlr4.Runtime.IToken;`);
        result.push(``);
        result.push(`/// <summary>`);
        result.push(`/// This interface defines a complete listener for a parse tree produced by`);
        result.push(`/// <see cref="${parserName}"/>.`);
        result.push(`/// </summary>`);
        result.push(`[System.CodeDom.Compiler.GeneratedCode("ANTLR", "${antlrVersion}")]`);
        result.push(`[System.CLSCompliant(false)]`);
        result.push(`public interface I${listenerFile.grammarName}Listener : IParseTreeListener {`);

        const block: Lines = [];
        listenerFile.listenerNames.forEach((lname) => {
            const listenerName = this.toTitleCase(lname);
            block.push(`/// <summary>`);

            const ruleName = listenerFile.listenerLabelRuleNames.get(lname);
            if (ruleName) {
                block.push(`/// Enter a parse tree produced by the <c>${lname}</c>`);
                block.push(`/// labeled alternative in <see cref="${parserName}.${ruleName}"/>.`);
            } else {
                block.push(`/// Enter a parse tree produced by <see cref="${parserName}.${lname}"/>.`);
            }

            block.push(`/// </summary>`);
            block.push(`/// <param name="context">The parse tree.</param>`);
            block.push(`void Enter${listenerName}([NotNull] ${parserName}.${listenerName}Context context);`);
            block.push(`/// <summary>`);

            if (ruleName) {
                block.push(`/// Exit a parse tree produced by the <c>${lname}</c>`);
                block.push(`/// labeled alternative in <see cref="${parserName}.${ruleName}"/>.`);
            } else {
                block.push(`/// Exit a parse tree produced by <see cref="${parserName}.${lname}"/>.`);
            }

            block.push(`/// </summary>`);
            block.push(`/// <param name="context">The parse tree.</param>`);
            block.push(`void Exit${listenerName}([NotNull] ${parserName}.${listenerName}Context context);`);
        });

        result.push(...this.formatLines(block, 4));
        if (options.package) {
            result.push(`} // namespace ${options.package}`);
        }

        return result.join(`\n`);
    };

    public renderVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;
        this.invariants.tokenLabelType = visitorFile.TokenLabelType ?? "IToken";

        const result: Lines = this.renderFileHeader(visitorFile);
        if (options.package) {
            result.push(`namespace ${options.package} {`);
        }

        result.push(...this.renderAction(visitorFile.namedActions.get("header")), ``);

        const parserName = visitorFile.parserName;
        result.push(`using Antlr4.Runtime.Misc;`);
        result.push(`using Antlr4.Runtime.Tree;`);
        result.push(`using IToken = Antlr4.Runtime.IToken;`);
        result.push(``);
        result.push(`/// <summary>`);
        result.push(`/// This interface defines a complete generic visitor for a parse tree produced`);
        result.push(`/// by <see cref="${parserName}"/>.`);
        result.push(`/// </summary>`);
        result.push(`/// <typeparam name="Result">The return type of the visit operation.</typeparam>`);
        result.push(`[System.CodeDom.Compiler.GeneratedCode("ANTLR", "${antlrVersion}")]`);
        result.push(`[System.CLSCompliant(false)]`);
        result.push(`public interface I${visitorFile.grammarName}Visitor<Result> : IParseTreeVisitor<Result> {`);

        const block: Lines = [];
        visitorFile.visitorNames.forEach((lname) => {
            const ruleName = visitorFile.visitorLabelRuleNames.get(lname);
            const visitorName = this.toTitleCase(lname);
            result.push(`/// <summary>`);

            if (ruleName) {
                result.push(`/// Visit a parse tree produced by the <c>${lname}</c>`);
                result.push(`/// labeled alternative in <see cref="${parserName}.${ruleName}"/>.`);
            } else {
                result.push(`/// Visit a parse tree produced by <see cref="${parserName}.${lname}"/>.`);
            }

            result.push(`/// </summary>`);
            result.push(`/// <param name="context">The parse tree.</param>`);
            result.push(`/// <return>The visitor result.</return>`);
            result.push(`Result Visit${visitorName}([NotNull] ${parserName}.${visitorName}Context context);`);
        });

        result.push(...this.formatLines(block, 4));
        if (options.package) {
            result.push(`} // namespace ${options.package}`);
        }

        return result.join("\n");
    };

    public renderLexerRuleContext(): Lines {
        return ["RuleContext"];
    }

    public override getRuleFunctionContextStructName(r: Rule): string {
        if (r.g.isLexer()) {
            return this.renderLexerRuleContext().join("");
        }

        return this.toTitleCase(r.name) + this.ruleContextNameSuffix;
    }

    public renderRecRuleReplaceContext = (ctxName: string): Lines => {
        const result: Lines = [];

        result.push(`_localctx = new ${ctxName}Context(_localctx);`);
        result.push(`Context = _localctx;`);
        result.push(`_prevctx = _localctx;`);

        return result;
    };

    public renderRecRuleAltPredicate = (ruleName: string, opPrec: number): Lines => {
        return [`Precpred(Context, ${opPrec})`];
    };

    public renderRecRuleSetReturnAction = (src: string, name: string): Lines => {
        return [`$${name} = $${src}.${name};`];
    };

    public renderRecRuleSetStopToken = (): Lines => {
        return [`Context.Stop = TokenStream.LT(-1);`];
    };

    public renderRecRuleSetPrevCtx = (): Lines => {
        return [
            "if ( ParseListeners!=null )",
            "    TriggerExitRuleEvent();",
            "_prevctx = _localctx;",
        ];
    };

    public renderRecRuleLabeledAltStartAction = (parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines => {

        const result: Lines = this.startRendering("RecRuleLabeledAltStartAction");

        result.push(`_localctx = new ${this.toTitleCase(currentAltLabel)}Context(new ` +
            `${this.toTitleCase(ruleName)}Context(_parentctx, _parentState));`);

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`((${this.toTitleCase(currentAltLabel)}Context)_localctx).${label}.Add(_prevctx);`);
            } else {
                result.push(`((${this.toTitleCase(currentAltLabel)}Context)_localctx).${label} = _prevctx;`);
            }
        }

        result.push(`PushNewRecursionContext(_localctx, _startState, RULE_${ruleName});`);

        return this.endRendering("RecRuleLabeledAltStartAction", result);
    };

    public renderRecRuleAltStartAction = (parserName: string, ruleName: string, ctxName: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = this.startRendering("RecRuleAltStartAction");

        result.push(`_localctx = new ${this.toTitleCase(ctxName)}Context(_parentctx, ` +
            `_parentState);`);

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`_localctx.${label}.Add(_prevctx);`);
            } else {
                result.push(`_localctx.${label} = _prevctx;`);
            }
        }

        result.push(`PushNewRecursionContext(_localctx, _startState, RULE_${ruleName});`);

        return this.endRendering("RecRuleAltStartAction", result);
    }
        ;
    public renderTestFile = (grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string => {
        const result: Lines = [];

        result.push(`#include <iostream>`, ``);
        result.push(`using antlr4-runtime.h"`);
        result.push(`using <lexerName>.h"`);

        result.push(`<if(parserName)>`);
        result.push(`using <parserName>.h"`);
        result.push(`<endif>`);

        result.push(``);
        result.push(``, ``);

        if (parserName !== undefined) {
            result.push(`class TreeShapeListener : tree::ParseTreeListener {`);
            result.push(`public:`);
            result.push(`  void visitTerminal(tree::TerminalNode *) override {}`);
            result.push(`  void visitErrorNode(tree::ErrorNode *) override {}`);
            result.push(`  void exitEveryRule(ParserRuleContext *) override {}`);
            result.push(`  void enterEveryRule(ParserRuleContext *ctx) override {`);
            result.push(`    for (auto child : ctx.children) {`);
            result.push(`      tree::ParseTree *parent = child.parent;`);
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
            result.push(`  parser.getInterpreter<atn::ParserATNSimulator>().setPredictionMode(atn::` +
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
            result.push(`    std::cout << token.toString() << std::endl;`);

            if (showDFA) {
                result.push(`  std::cout << lexer.getInterpreter<atn::LexerATNSimulator>().getDFA(` +
                    `Lexer::DEFAULT_MODE).toLexerString();`);
            }
        }

        result.push(`  return 0;`);
        result.push(`}`);

        return result.join("\n");
    };

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

    public override getLoopLabel(ast: GrammarASTWithOptions): string {
        return `loop${ast.token?.tokenIndex ?? 0}`;
    }

    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        const result: Lines = [];

        result.push(`//------------------------------------------------------------------------------`);
        result.push(`// <auto-generated>`);
        result.push(`//     This code was generated by a tool.`);
        result.push(`//     ANTLR Version: ${antlrVersion}`);
        result.push(`//`);
        result.push(`//     Changes to this file may cause incorrect behavior and will be lost if`);
        result.push(`//     the code is regenerated.`);
        result.push(`// </auto-generated>`);
        result.push(`//------------------------------------------------------------------------------`);
        result.push(``);
        result.push(`// Unreachable code detected`);
        result.push(`#pragma warning disable 0162`);
        result.push(`// The variable '...' is assigned but its value is never used`);
        result.push(`#pragma warning disable 0219`);
        result.push(`// Missing XML comment for publicly visible type or member '...'`);
        result.push(`#pragma warning disable 1591`);
        result.push(`// Ambiguous reference in cref attribute`);
        result.push(`#pragma warning disable 419`);
        result.push(``);

        return result;
    }

    protected override escapeWord(word: string): string {
        return "@" + word;
    }

    protected override escapeChar(v: number): string {
        return `\\x${v.toString(16).padStart(4, "0")}`;
    }

    protected override renderTypedContext = (ctx: OutputModelObjects.StructDecl): string => {
        return ctx.provideCopyFrom ? `((${ctx.name})_localctx)` : `_localctx`;
    };

    protected override renderRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.RuleFunction): Lines => {
        const result = this.startRendering("RuleFunction");

        result.push(...this.renderStructDecl(currentRule.ruleCtx));

        currentRule.altLabelCtxs?.forEach((ctx) => {
            result.push(...this.renderAltLabelStructDecl(currentRule, ctx));
        });

        const block: Lines = [``];

        block.push(`[RuleVersion(${namedActions.get("version") ?? "0"})]`);

        let modifiers = "public";
        if (currentRule.modifiers.length > 0) {
            modifiers = currentRule.modifiers.join(" ");
        }

        const args = currentRule.args?.map((a) => {
            return `${a.type} ${a.escapedName}`;
        }).join(", ") ?? "";
        block.push(`${modifiers} ${currentRule.ctxType} ${currentRule.escapedName}(${args}) {`);

        let ruleCallArgs = "";
        if (currentRule.args) {
            ruleCallArgs = ", " + currentRule.args.map((a) => {
                return a.escapedName;
            });
        }

        const innerBlock: Lines = [];
        innerBlock.push(`${currentRule.ctxType} _localctx = new ${currentRule.ctxType}(Context, ` +
            `State${ruleCallArgs});`);
        innerBlock.push(`EnterRule(_localctx, ${currentRule.startState}, RULE_${currentRule.name});`);
        innerBlock.push(...this.renderAction(currentRule.namedActions?.get("init")));

        for (const [_, decl] of currentRule.locals) {
            innerBlock.push(...this.renderTokenTypeDecl(decl));
        }

        innerBlock.push(`try {`);

        const codeBlock: Lines = [];
        if (currentRule.hasLookaheadBlock) {
            codeBlock.push(`int _alt;`);
        }

        codeBlock.push(...this.renderSourceOps(currentRule.code));
        codeBlock.push(...this.renderSourceOps(currentRule.postamble));
        codeBlock.push(...this.renderAction(currentRule.namedActions?.get("after")));

        innerBlock.push(...this.formatLines(codeBlock, 4));
        innerBlock.push(`}`);

        if (currentRule.exceptions && currentRule.exceptions.length > 0) {
            currentRule.exceptions.forEach((e) => {
                innerBlock.push(...this.renderExceptionClause(e));
            });
        } else {
            innerBlock.push(`catch (RecognitionException re) {`);
            innerBlock.push(`    _localctx.exception = re;`);
            innerBlock.push(`    ErrorHandler.ReportError(this, re);`);
            innerBlock.push(`    ErrorHandler.Recover(this, re);`);
            innerBlock.push(`}`);
        }

        innerBlock.push(`finally {`);
        if (currentRule.finallyAction) {
            innerBlock.push(`    ${this.renderAction(currentRule.finallyAction)[0]}`);
        }
        innerBlock.push(`    ExitRule();`);
        innerBlock.push(`}`);
        innerBlock.push(`return _localctx;`);

        block.push(...this.formatLines(innerBlock, 4));
        block.push(`}`);
        result.push(...this.formatLines(block, 4));

        return this.endRendering("RuleFunction", result);
    };

    protected override renderLeftRecursiveRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.LeftRecursiveRuleFunction): Lines => {
        const result = this.startRendering("LeftRecursiveRuleFunction");

        result.push(``, ...this.renderStructDecl(currentRule.ruleCtx));

        currentRule.altLabelCtxs?.forEach((ctx) => {
            result.push(...this.renderAltLabelStructDecl(currentRule, ctx));
        });
        result.push(``);

        const args = currentRule.args?.map((a) => {
            return `${a.type} ${a.escapedName}`;
        }).join(", ") ?? "";

        const block: Lines = [``];

        block.push(`[RuleVersion(${namedActions.get("version") ?? "0"})]`);

        let modifiers = "public";
        if (currentRule.modifiers.length > 0) {
            modifiers = currentRule.modifiers.join(" ");
        }

        let ruleCallArgs = "";
        if (currentRule.args) {
            ruleCallArgs = ", " + currentRule.args.map((a) => {
                return a.escapedName;
            });
        }

        const escapedName = currentRule.escapedName;
        block.push(`${modifiers} ${currentRule.ctxType} ${escapedName}(${args}) {`);
        block.push(`	return ${escapedName}(0${ruleCallArgs});`);
        block.push(`}`);
        block.push(``);
        block.push(`private ${currentRule.ctxType} ${escapedName}(int _p${ruleCallArgs}) {`);

        const innerBlock: Lines = [];
        innerBlock.push(`ParserRuleContext _parentctx = Context;`);
        innerBlock.push(`int _parentState = State;`);

        innerBlock.push(`${currentRule.ctxType} _localctx = new ${currentRule.ctxType}(Context, ` +
            `_parentState${ruleCallArgs.slice(2)});`);

        innerBlock.push(`${currentRule.ctxType} _prevctx = _localctx;`);

        innerBlock.push(`int _startState = ${currentRule.startState};`);
        innerBlock.push(`EnterRecursionRule(_localctx, ${currentRule.startState}, RULE_${currentRule.name}, _p);`);

        innerBlock.push(...this.renderAction(currentRule.namedActions?.get("init")));

        for (const [_, decl] of currentRule.locals) {
            innerBlock.push(...this.renderTokenTypeDecl(decl));
        }

        innerBlock.push(`try {`);

        const codeBlock: Lines = [];
        if (currentRule.hasLookaheadBlock) {
            codeBlock.push(`int _alt;`);
        }

        codeBlock.push(...this.renderSourceOps(currentRule.code));
        codeBlock.push(...this.renderSourceOps(currentRule.postamble));
        codeBlock.push(...this.renderAction(currentRule.namedActions?.get("after")));

        innerBlock.push(...this.formatLines(codeBlock, 4));
        innerBlock.push(`}`);

        innerBlock.push(`catch (RecognitionException re) {`);
        innerBlock.push(`   _localctx.exception = re;`);
        innerBlock.push(`    ErrorHandler.ReportError(this, re);`);
        innerBlock.push(`    ErrorHandler.Recover(this, re);`);
        innerBlock.push(`}`);
        innerBlock.push(`finally {`);

        if (currentRule.finallyAction) {
            innerBlock.push(`    ${this.renderAction(currentRule.finallyAction)[0]}`);
        }

        innerBlock.push(`    UnrollRecursionContexts(_parentctx);`);
        innerBlock.push(`    }`);
        innerBlock.push(`    return _localctx;`);
        innerBlock.push(`}`);

        block.push(...this.formatLines(innerBlock, 4));
        result.push(...this.formatLines(block, 4));

        return this.endRendering("LeftRecursiveRuleFunction", result);
    };

    protected override renderAddToLabelList = (srcOp: OutputModelObjects.AddToLabelList): Lines => {
        const ctx = this.renderContext(srcOp.label);

        return [`${ctx}.${srcOp.listName}.Add(${this.renderLabelref(srcOp.label)});`];
    };

    protected override renderVisitorDispatchMethod = (struct: OutputModelObjects.StructDecl): Lines => {
        const derivedFromName = this.toTitleCase(struct.derivedFromName);

        const result: Lines = [];

        result.push(`[System.Diagnostics.DebuggerNonUserCode]`);
        result.push(`public override TResult Accept<TResult>(IParseTreeVisitor<TResult> visitor) {`);
        result.push(`    I${this.invariants.grammarName}Visitor<TResult> typedVisitor = visitor as ` +
            `I${this.invariants.grammarName}Visitor<TResult>;`);
        result.push(`    if (typedVisitor != null) return typedVisitor.Visit${derivedFromName}(this);`);
        result.push(`    else return visitor.VisitChildren(this);`);
        result.push(`}`);

        return result;
    };

    protected override renderListenerDispatchMethod = (struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod): Lines => {
        const derivedFromName = this.toTitleCase(struct.derivedFromName);

        const result: Lines = [];

        const enterExit = method.isEnter ? "Enter" : "Exit";
        result.push(`[System.Diagnostics.DebuggerNonUserCode]`);
        result.push(`public override void ${enterExit}Rule(IParseTreeListener listener) {`);
        result.push(`    I${this.invariants.grammarName}Listener typedListener = listener as ` +
            `I${this.invariants.grammarName}Listener;`);
        result.push(`    if (typedListener != null) typedListener.${enterExit}${derivedFromName}(this);`);
        result.push(`}`);

        return result;
    };

    protected override renderAttributeDecl = (d: OutputModelObjects.AttributeDecl): Lines => {
        return [`${d.type} ${d.escapedName}` + (d.initValue ? ` = ${d.initValue};` : ``)];
    };

    protected override renderCaptureNextToken = (d: OutputModelObjects.CaptureNextToken): Lines => {
        return [`${d.varName} = TokenStream.LT(1);`];
    };

    protected override renderCaptureNextTokenType = (srcOp: OutputModelObjects.CaptureNextTokenType): Lines => {
        return [`${srcOp.varName} = TokenStream.LA(1);`];
    };

    protected override renderCodeBlockForAlt = (currentAltCodeBlock: OutputModelObjects.CodeBlockForAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForAlt");

        result.push("{");
        result.push(...this.renderDecls(currentAltCodeBlock.locals));
        result.push(...this.renderSourceOps(currentAltCodeBlock.preamble));
        result.push(...this.renderSourceOps(currentAltCodeBlock.ops));
        result.push("}");

        return this.endRendering("CodeBlockForAlt", result);
    };

    protected override renderCodeBlockForOuterMostAlt = (
        currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(`_localctx = new ${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context` +
                `(_localctx);`);
        }

        result.push(`EnterOuterAlt(_localctx, ${currentOuterMostAltCodeBlock.alt.altNum});`);
        result.push(...this.renderCodeBlockForAlt(currentOuterMostAltCodeBlock));

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    };

    protected override renderContextRuleGetterDecl = (r: OutputModelObjects.ContextRuleGetterDecl): Lines => {
        const result = this.startRendering("ContextRuleGetterDecl");

        result.push(`[System.Diagnostics.DebuggerNonUserCode] public ${r.ctxName} ${r.escapedName}() {`);
        result.push(`	return GetRuleContext<${r.ctxName}>(0);`);
        result.push(`}`);

        return this.endRendering("ContextRuleGetterDecl", result);
    };

    protected override renderContextRuleListGetterDecl = (r: OutputModelObjects.ContextRuleListGetterDecl): Lines => {
        const result = this.startRendering("ContextRuleListGetterDecl");

        result.push(`[System.Diagnostics.DebuggerNonUserCode] public ${r.ctxName}[] ${r.escapedName}() {`);
        result.push(`	return GetRuleContexts<${r.ctxName}>();`);
        result.push(`}`);

        return this.endRendering("ContextRuleListGetterDecl", result);
    };

    protected override renderContextTokenGetterDecl = (t: OutputModelObjects.ContextTokenGetterDecl): Lines => {
        const result = this.startRendering("ContextTokenGetterDecl");

        const tokenType = this.renderTokenTypeName(t.name);
        result.push(`[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode ` +
            `${tokenType}() { return GetToken(${this.invariants.recognizerName}.${tokenType}, 0); }`);

        return this.endRendering("ContextTokenGetterDecl", result);
    };

    protected override renderContextTokenListGetterDecl = (t: OutputModelObjects.ContextTokenListGetterDecl): Lines => {
        const result = this.startRendering("ContextTokenListGetterDecl");

        const tokenType = this.renderTokenTypeName(t.name);
        result.push(`[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode[] ` +
            `${tokenType}() { return GetTokens(${this.invariants.recognizerName}.${tokenType}); }`);

        return this.endRendering("ContextTokenListGetterDecl", result);
    };

    protected override renderContextTokenListIndexedGetterDecl = (
        t: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines => {
        const result = this.startRendering("ContextTokenListIndexedGetterDecl");

        const tokenType = this.renderTokenTypeName(t.name);
        result.push(`[System.Diagnostics.DebuggerNonUserCode] public ITerminalNode ${tokenType}(int i) {`);
        result.push(`	return GetToken(${this.invariants.recognizerName}.${tokenType}, i);`);
        result.push(`}`);

        return this.endRendering("ContextTokenListIndexedGetterDecl", result);
    };

    protected override renderContextRuleListIndexedGetterDecl = (
        r: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines => {
        const result = this.startRendering("ContextRuleListIndexedGetterDecl");

        result.push(`[System.Diagnostics.DebuggerNonUserCode] public ${r.ctxName} ${r.escapedName}(int i) {`);
        result.push(`	return GetRuleContext<${r.ctxName}>(i);`);
        result.push(`}`);

        return this.endRendering("ContextRuleListIndexedGetterDecl", result);
    };

    protected override renderExceptionClause = (srcOp: OutputModelObjects.ExceptionClause): Lines => {
        const result = this.startRendering("ExceptionClause");

        result.push(`catch (${this.renderActionChunks(srcOp.catchArg.chunks)}) {`);
        result.push(...this.formatLines(this.renderAction(srcOp.catchAction), 4));
        result.push("}");

        return this.endRendering("ExceptionClause", result);
    };

    protected override renderLL1AltBlock = (choice: OutputModelObjects.LL1AltBlock): Lines => {
        const result = this.startRendering("LL1AltBlock");

        result.push(`State = ${choice.stateNumber};`);
        result.push(`ErrorHandler.Sync(this);`);

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = TokenStream.LT(1);`);
        }

        result.push(...this.renderSourceOps(choice.preamble));
        result.push(`switch (TokenStream.LA(1)) {`);

        const block: Lines = [];
        for (let i = 0; i < choice.alts.length; ++i) {
            const tokens = choice.altLook[i];
            block.push(...this.renderCases(tokens));

            const alt = choice.alts[i] as OutputModelObjects.CodeBlockForAlt | undefined;
            if (alt) {
                if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                    block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
                } else {
                    block.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
                }
            }

            block.push(`    break;`);
        }

        result.push(...block);
        result.push(`    default:`);

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(...this.formatLines(this.renderThrowNoViableAlt(noViableAltObject), 4));
        result.push(`}`);

        return this.endRendering("LL1AltBlock", result);
    };

    protected override renderLL1OptionalBlock = (choice: OutputModelObjects.LL1OptionalBlock): Lines => {
        const result: Lines = [];
        result.push(`State = ${choice.stateNumber};`);

        result.push(`ErrorHandler.Sync(this);`);
        result.push(`switch (TokenStream.LA(1)) {`);

        const block: Lines = [];
        for (let i = 0; i < choice.altLook.length; ++i) {
            const tokens = choice.altLook[i];
            block.push(...this.renderCases(tokens));

            const alt = choice.alts[i] as OutputModelObjects.CodeBlockForAlt | undefined;
            if (alt) {
                if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                    block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
                } else {
                    block.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
                }
            }

            block.push(`    break;`);
        }

        result.push(...block);
        result.push(`default:`);
        result.push(`    break;`);
        result.push(`}`);

        return result;
    };

    protected override renderLL1OptionalBlockSingleAlt = (
        choice: OutputModelObjects.LL1OptionalBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1OptionalBlockSingleAlt");

        result.push(`State = ${choice.stateNumber};`);
        result.push(`ErrorHandler.Sync(this);`);
        result.push(...this.renderSourceOps(choice.preamble));

        result.push(`if (${this.renderSourceOps([choice.expr]).join("")}) {`);
        choice.alts.forEach((alt, index) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
            }
        });
        result.push(`}`, ``);

        return this.endRendering("LL1OptionalBlockSingleAlt", result);

    };

    protected override renderLL1StarBlockSingleAlt = (choice: OutputModelObjects.LL1StarBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1StarBlockSingleAlt");

        result.push(`State = ${choice.stateNumber};`);
        result.push(`ErrorHandler.Sync(this);`);

        result.push(...this.renderSourceOps(choice.preamble));

        const srcOps = choice.loopExpr ? [choice.loopExpr] : undefined;
        const rendered = this.renderSourceOps(srcOps);
        if (rendered.length === 1) {
            result.push(`while (${rendered.shift()}) {`);
        } else {
            result.push(`while (${rendered.shift()}`);
            result.push(...rendered);
            result.push(`) {`);
        }

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
            }
        });

        result.push(`    State = ${choice.loopBackStateNumber};`);
        result.push(`    ErrorHandler.Sync(this);`);
        result.push(...this.formatLines(this.renderSourceOps(choice.iteration), 4));
        result.push(`}`);

        return this.endRendering("LL1StarBlockSingleAlt", result);
    };

    protected override renderLL1PlusBlockSingleAlt = (choice: OutputModelObjects.LL1PlusBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1PlusBlockSingleAlt");

        result.push(`State = ${choice.blockStartStateNumber};`); // Alt left block decision.
        result.push(`ErrorHandler.Sync(this);`);

        result.push(...this.renderSourceOps(choice.preamble));

        result.push(`do {`);

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
            }
        });

        result.push(`    State = ${choice.stateNumber};`); // Loop back/exit decision.
        result.push(`    ErrorHandler.Sync(this);`);
        result.push(...this.formatLines(this.renderSourceOps(choice.iteration), 4));

        const srcOps = choice.loopExpr ? [choice.loopExpr] : undefined;
        result.push(`} while ( ${this.renderSourceOps(srcOps).join("")} );`);

        return this.endRendering("LL1PlusBlockSingleAlt", result);
    };

    protected override renderMatchToken = (m: OutputModelObjects.MatchToken): Lines => {
        const result: Lines = this.startRendering("MatchToken");

        result.push(`State = ${m.stateNumber};`);

        let line = "";
        if (m.labels.length > 0) {
            for (const l of m.labels) {
                line += `${this.renderLabelref(l)} = `;
            }
        }
        result.push(`${line}Match(${this.renderTokenTypeName(m.name!)});`);

        return this.endRendering("MatchToken", result);
    };

    protected override renderMatchSet = (m: OutputModelObjects.MatchSet): Lines => {
        return this.renderCommonSetStuff(m, false);
    };

    protected override renderMatchNotSet = (m: OutputModelObjects.MatchNotSet): Lines => {
        return this.renderCommonSetStuff(m, true);
    };

    protected override renderRuleContextDecl = (srcOp: OutputModelObjects.RuleContextDecl): Lines => {
        return [];
    };

    protected override renderRuleContextListDecl = (ruleDecl: OutputModelObjects.RuleContextListDecl): Lines => {
        return [];
    };

    protected override renderStructDecl = (struct: OutputModelObjects.StructDecl): Lines => {
        const result = this.startRendering("StructDecl");

        const escapedName = struct.escapedName;
        const superClass = this.invariants.contextSuperClass ?? "ParserRuleContext";

        let interfaces = "";
        if (struct.interfaces.length > 0) {
            interfaces = struct.interfaces.map((i) => {
                return this.renderAction(i as OutputModelObjects.Action).join("");
            }).join(", ");
        }

        result.push(``, `public partial class ${escapedName} : ${superClass}${interfaces} {`);

        const decls = this.renderDecls(struct.attrs);

        // Have to separate the first and last entries if logging is enabled, to avoid prefixing them with "public".
        let startLogEntry: string | undefined = undefined;
        let endLogEntry: string | undefined = undefined;

        if (this.logRendering && decls.length > 0) {
            startLogEntry = decls.shift();
            endLogEntry = decls.pop();
        }

        if (startLogEntry) {
            result.push(`    ${startLogEntry}`);
        }

        result.push(...decls.map((d) => {
            return `    public ${d}`;
        }));

        if (endLogEntry) {
            result.push(`    ${endLogEntry}`);
        }

        const block: Lines = [];
        block.push(...this.renderDecls(struct.getters));

        let attrs = "";
        if (struct.ctorAttrs.length > 0) {
            block.push(`public ${escapedName}(ParserRuleContext parent, int invokingState` +
                `) : base(parent, invokingState) { }`);

            attrs = ", " + struct.ctorAttrs.map((a) => {
                return this.renderAttributeDecl(a);
            }).join(", ");
        }

        block.push(`public ${escapedName}(ParserRuleContext parent, int invokingState${attrs})`);
        block.push(`    : base(parent, invokingState)`);
        block.push(`{`);

        struct.ctorAttrs.forEach((a) => {
            block.push(`    this.${a.escapedName} = ${a.escapedName};`);
        });

        block.push(`}`);

        block.push(`public override int RuleIndex { get { return RULE_${struct.derivedFromName}; } }`);

        // Don't need copy unless we have subclasses.
        if (struct.provideCopyFrom) {
            block.push(`public ${escapedName}() { }`);
            block.push(`public virtual void CopyFrom(${escapedName} context) {`);
            block.push(`    base.CopyFrom(context);`);
            struct.ctorAttrs.forEach((a) => {
                block.push(`    this.${a.escapedName} = ${a.escapedName};`);
            });

            block.push(`}`);
        }

        result.push(...this.formatLines(block, 4));

        result.push(...this.renderDispatchMethods(struct));

        struct.extensionMembers.forEach((e) => {
            result.push(this.renderAction(e as OutputModelObjects.Action).join(""));
        });

        result.push(`}`);

        return this.endRendering("StructDecl", this.formatLines(result, 4));
    };

    protected override renderAltLabelStructDecl = (currentRule: OutputModelObjects.RuleFunction,
        struct: OutputModelObjects.AltLabelStructDecl): Lines => {
        const result = this.startRendering("AltLabelStructDecl");

        const escapedName = struct.escapedName;
        result.push(`public partial class ${escapedName} : ${this.toTitleCase(currentRule.name)}Context {`);

        const decls = this.renderDecls(struct.attrs);

        // Have to separate the first and last entries if logging is enabled, to avoid prefixing them with "public".
        let startLogEntry: string | undefined = undefined;
        let endLogEntry: string | undefined = undefined;

        if (this.logRendering && decls.length > 0) {
            startLogEntry = decls.shift();
            endLogEntry = decls.pop();
        }

        if (startLogEntry) {
            result.push(`    ${startLogEntry}`);
        }

        result.push(...decls.map((d) => {
            return `    public ${d}`;
        }));

        if (endLogEntry) {
            result.push(`    ${endLogEntry}`);
        }

        result.push(...this.formatLines(this.renderDecls(struct.getters), 4));
        result.push(`	public ${escapedName}(${this.toTitleCase(currentRule.name)}Context context) ` +
            `{ CopyFrom(context); }`);
        result.push(...this.formatLines(this.renderDispatchMethods(struct), 4));
        result.push(`}`);
        result.push(``);

        return this.endRendering("AltLabelStructDecl", result);
    };

    protected override renderTestSetInline = (s: OutputModelObjects.TestSetInline): Lines => {
        const result = this.startRendering("TestSetInline");

        const localLines: Lines = [];
        s.bitsets.forEach((bits) => {
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
    };

    protected override renderTokenDecl = (t: OutputModelObjects.TokenDecl): Lines => {
        return [`${this.invariants.tokenLabelType} ${this.renderTokenTypeName(t.escapedName)};`];
    };

    protected override renderTokenTypeDecl = (srcOp: OutputModelObjects.TokenTypeDecl): Lines => {
        return [`int ${this.renderTokenTypeName(srcOp.escapedName)};`];
    };

    protected override renderTokenListDecl = (t: OutputModelObjects.TokenListDecl): Lines => {
        return [`IList<IToken> ${this.renderTokenTypeName(t.escapedName)} = new List<IToken>()`];
    };

    protected override renderThrowNoViableAlt = (srcOp: OutputModelObjects.ThrowNoViableAlt): Lines => {
        return ["throw new NoViableAltException(this);"];
    };

    protected override renderWildcard = (w: OutputModelObjects.Wildcard): Lines => {
        const result: Lines = this.startRendering("Wildcard");

        result.push(`State = ${w.stateNumber};`);

        let labels = "";
        if (w.labels.length > 0) {
            for (const l of w.labels) {
                labels += `${this.renderLabelref(l)} = `;
            }
        }
        result.push(`${labels}MatchWildcard();`);

        return result;;
    };

    protected override renderStarBlock = (choice: OutputModelObjects.StarBlock): Lines => {
        const result: Lines = this.startRendering("StarBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(`State = ${choice.stateNumber};`);
        result.push(`ErrorHandler.Sync(this);`);
        result.push(`_alt = Interpreter.AdaptivePredict(TokenStream,${choice.decision},Context);`);
        result.push(`while ( _alt!=${choice.exitAlt} && _alt!=global::Antlr4.Runtime.Atn.ATN.INVALID_ALT_NUMBER ) {`);

        const block: Lines = [];
        block.push(`if ( _alt==1${!blockAST.greedy ? "+1" : ""} ) {`);
        block.push(...this.formatLines(this.renderSourceOps(choice.iteration), 4));

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
            }
        });

        block.push(`}`);
        block.push(`State = ${choice.loopBackStateNumber};`);
        block.push(`ErrorHandler.Sync(this);`);
        block.push(`_alt = Interpreter.AdaptivePredict(TokenStream,${choice.decision},Context);`);

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        return this.endRendering("StarBlock", result);
    };

    protected override renderPlusBlock = (choice: OutputModelObjects.PlusBlock): Lines => {
        const result: Lines = this.startRendering("PlusBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(`State = ${choice.blockStartStateNumber};`); //  Alt block decision.
        result.push(`ErrorHandler.Sync(this);`);
        result.push(`_alt = 1${!blockAST.greedy ? "+1" : ""};`);
        result.push(`do {`);

        const switchBlock: Lines = [];
        switchBlock.push(`switch (_alt) {`);
        const caseBlock: Lines = [];

        for (let i = 0; i < choice.alts.length; ++i) {
            const alt = choice.alts[i];

            // Alt numbers are 1-based, so we add 1 to the index.
            caseBlock.push(`case ${i + 1}${!blockAST.greedy ? "+1" : ""}:`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                caseBlock.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
            } else {
                caseBlock.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
            }
            caseBlock.push(`    break;`);
        }

        caseBlock.push("");
        caseBlock.push(`default:`);

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        caseBlock.push(...this.formatLines(this.renderThrowNoViableAlt(noViableAltObject), 4));

        switchBlock.push(...caseBlock);
        switchBlock.push(`}`);

        switchBlock.push(`State = ${choice.loopBackStateNumber};`); // Loopback/exit decision.
        switchBlock.push(`ErrorHandler.Sync(this);`);
        switchBlock.push(`_alt = Interpreter.AdaptivePredict(TokenStream,${choice.decision},Context);`);

        result.push(...this.formatLines(switchBlock, 4));
        result.push(`} while ( _alt!=${choice.exitAlt} && _alt!=global::Antlr4.Runtime.Atn.ATN.INVALID_ALT_NUMBER );`);

        return this.endRendering("PlusBlock", result);
    };

    protected override renderOptionalBlock = (choice: OutputModelObjects.OptionalBlock): Lines => {
        const result: Lines = this.startRendering("OptionalBlock");

        result.push(`State = ${choice.stateNumber};`);
        result.push(`ErrorHandler.Sync(this);`);
        result.push(`switch ( Interpreter.AdaptivePredict(TokenStream,${choice.decision},Context) ) {`);

        const block: Lines = [];
        const blockAST = choice.ast as OptionalBlockAST;
        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            block.push(`case ${index + 1}${!blockAST.greedy ? "+1" : ""}:`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
            }
            block.push(`    break;`);
        });

        result.push(...block);
        result.push(`}`);

        return this.endRendering("OptionalBlock", result);
    };

    protected override renderAltBlock = (choice: OutputModelObjects.AltBlock): Lines => {
        const result: Lines = this.startRendering("AltBlock");

        result.push(`State = ${choice.stateNumber};`);
        result.push(`ErrorHandler.Sync(this);`);

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = TokenStream.LT(1);`);
        }

        result.push(...this.renderSourceOps(choice.preamble));
        result.push(`switch ( Interpreter.AdaptivePredict(TokenStream,${choice.decision},Context) ) {`);

        const block: Lines = [];
        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            block.push(`case ${index + 1}:`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(alt), 4));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(alt), 4));
            }
            block.push(`    break;`);
        });

        result.push(...block);
        result.push(`}`);

        return this.endRendering("AltBlock", result);
    };

    protected override renderInvokeRule = (r: OutputModelObjects.InvokeRule): Lines => {
        const result: Lines = this.startRendering("InvokeRule");

        result.push(`State = ${r.stateNumber};`);

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
    };

    protected override renderSemPred = (p: OutputModelObjects.SemPred): Lines => {
        const result: Lines = this.startRendering("SemPred");

        result.push(`State = ${p.stateNumber};`);

        const chunks = this.renderActionChunks(p.chunks);
        const failChunks = this.renderActionChunks(p.failChunks);
        result.push(`if (!(${chunks})) throw new FailedPredicateException(this, ` +
            `${p.predicate}${failChunks.length > 0 ? failChunks + ", " : (p.msg ? p.msg + ", " : "")});`);

        return this.endRendering("SemPred", result);
    };

    protected override renderAction = (srcOp: OutputModelObjects.Action | undefined): Lines => {
        if (!srcOp) {
            return [];
        }

        const result: Lines = [];
        result.push(...this.renderActionChunks(srcOp.chunks));

        return result;
    };

    protected renderRuleActionFunction(r: OutputModelObjects.RuleActionFunction): Lines {
        const result = this.startRendering("RuleActionFunction");

        result.push(`private void ${r.name}_action(${r.ctxType} _localctx, int ` +
            `actionIndex) {`);
        result.push(`    switch (actionIndex) {`);

        for (const [index, action] of r.actions) {
            result.push(`    case ${index}: ${this.renderAction(action).join(" ")} break;`);
        }

        result.push(`    }`);
        result.push(`}`);

        return this.endRendering("RuleActionFunction", result);
    }

    protected override renderRuleSempredFunction = (r: OutputModelObjects.RuleSempredFunction): Lines => {
        const result = this.startRendering("RuleSempredFunction");

        result.push(`private bool ${r.name}_sempred(${r.ctxType} _localctx, int predIndex) {`);
        result.push(`    switch (predIndex) {`);

        for (const [index, action] of r.actions) {
            result.push(`    case ${index}: return ${this.renderAction(action).join("").trimStart()};`);
        }

        result.push(`    }`);
        result.push(`    return true;`);
        result.push(`}`);

        return this.endRendering("RuleSempredFunction", result);
    };

    protected override renderSerializedATN = (model: OutputModelObjects.SerializedATN): Lines => {
        const result = this.startRendering("SerializedATN");

        result.push(``, `private static int[] _serializedATN = {`);
        result.push(...this.renderList(model.serialized, { wrap: 69, indent: 4, separator: "," }));
        result.push(`};`);
        result.push(``);
        result.push(`public static readonly ATN _ATN =`);
        result.push(`	new ATNDeserializer().Deserialize(_serializedATN);`);
        result.push(``, ``);

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
        const result = [this.renderContext(t) + `.${t.escapedName}`];

        return result;
    };

    /**
     * Watch out, we have two methods with the same name but different casing!
     * `renderLabelref` renders labels (actually Decls) which are not action chunks.
     *
     * @param t The Decl to render as labelref.
     *
     * @returns Lines representing the labelref.
     */
    protected renderLabelref(t: OutputModelObjects.Decl): Lines {
        let line = "";
        if (!t.isLocal) {
            line = `${this.renderTypedContext(t.ctx)}.`;
        }

        return [line + t.escapedName];
    }

    protected renderCases(tokens: OutputModelObjects.ITokenInfo[]): Lines {
        const result: Lines = this.startRendering("Cases");

        for (const t of tokens) {
            result.push(`case ${this.renderTokenTypeName(t.name)}:`);
        }

        return this.endRendering("Cases", result);
    }

    // Lexer command methods
    protected override renderLexerSkipCommand = (): Lines => {
        return ["Skip();"];
    };

    protected override renderLexerMoreCommand = (): Lines => {
        return ["More();"];
    };

    protected override renderLexerPopModeCommand = (): Lines => {
        return ["PopMode();"];
    };

    protected override renderLexerTypeCommand = (arg: string): Lines => {
        return [`_type = ${this.renderTokenTypeName(arg)};`];
    };

    protected override renderLexerChannelCommand = (arg: string): Lines => {
        return [`_channel = ${arg === "HIDDEN"
            ? "Hidden"
            : arg === "DEFAULT_TOKEN_CHANNEL"
                ? "DefaultTokenChannel" : arg};`
        ];
    };

    protected override renderLexerModeCommand = (arg: string): Lines => {
        return [`_mode = ${arg === "DEFAULT_MODE" ? "DefaultMode" : arg};`];
    };

    protected override renderLexerPushModeCommand = (arg: string): Lines => {
        return [`PushMode(${arg === "DEFAULT_MODE" ? "DefaultMode" : arg});`];
    };

    protected override renderArgRef = (t: OutputModelObjects.ArgRef): Lines => {
        return [`_localctx.${t.escapedName}`];
    };

    protected override renderListLabelRef = (t: OutputModelObjects.ListLabelRef): Lines => {
        const ctx = this.renderContext(t);
        const name = this.renderListLabelName(t.escapedName);

        return [`${ctx}?.${name}`];
    };

    protected override renderLocalRef = (a: OutputModelObjects.LocalRef): Lines => {
        return [`_localctx.${a.escapedName}`];
    };

    protected override renderNonLocalAttrRef = (s: OutputModelObjects.NonLocalAttrRef): Lines => {
        return [`((${this.toTitleCase(s.ruleName)}Context)getInvokingContext(${s.ruleIndex})).${s.escapedName}`];
    };

    protected override renderQRetValueRef = (a: OutputModelObjects.QRetValueRef): Lines => {
        const ctx = this.renderContext(a);

        return [`${ctx}.${a.dict}!.${a.escapedName}`];
    };

    protected override renderRetValueRef = (t: OutputModelObjects.RetValueRef): Lines => {
        return [`_localctx.${t.escapedName}`];
    };

    protected override renderRulePropertyRef = (t: OutputModelObjects.RulePropertyRef): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? (${ctx}.${t.label}.start) : null)`];
    };

    protected override renderRulePropertyRefCtx = (t: OutputModelObjects.RulePropertyRefCtx): Lines => {
        const ctx = this.renderContext(t);

        return [`${ctx}.${t.label}`];
    };

    protected override renderRulePropertyRefParser = (t: OutputModelObjects.RulePropertyRefParser): Lines => {
        return [`this`];
    };

    protected override renderRulePropertyRefStart = (t: OutputModelObjects.RulePropertyRefStart): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? (${ctx}.${t.label}.start) : null)`];
    };

    protected override renderRulePropertyRefStop = (t: OutputModelObjects.RulePropertyRefStop): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? (${ctx}.${t.label}.stop) : null)`];
    };

    protected override renderRulePropertyRefText = (t: OutputModelObjects.RulePropertyRefText): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? _input.getText(${ctx}.${t.label}.start, ` +
            `${ctx}.${t.label}.stop) : null)`];
    };

    protected override renderSetAttr = (t: OutputModelObjects.SetAttr): Lines => {
        const ctx = this.renderContext(t);

        return [`${ctx}.<s.escapedName> = <rhsChunks>;`];
    };

    protected override renderSetNonLocalAttr = (t: OutputModelObjects.SetNonLocalAttr): Lines => {
        return [`((${this.toTitleCase(t.ruleName)}Context)getInvokingContext(${t.ruleIndex})).${t.escapedName} = ` +
            `${t.rhsChunks};`];
    };

    protected override renderThisRulePropertyRefCtx = (t: OutputModelObjects.ThisRulePropertyRefCtx): Lines => {
        return ["_localctx"];
    };

    protected override renderThisRulePropertyRefParser = (t: OutputModelObjects.ThisRulePropertyRefParser): Lines => {
        return ["this"];
    };

    protected override renderThisRulePropertyRefStart = (t: OutputModelObjects.ThisRulePropertyRefStart): Lines => {
        return [`_localctx.start`];
    };

    protected override renderThisRulePropertyRefStop = (t: OutputModelObjects.ThisRulePropertyRefStop): Lines => {
        return [`_localctx.stop`];
    };

    protected override renderThisRulePropertyRefText = (t: OutputModelObjects.ThisRulePropertyRefText): Lines => {
        return [`_input.getText(_localctx.start, _input.LT(-1))`];
    };

    protected override renderTokenPropertyRefChannel = (t: OutputModelObjects.TokenPropertyRefPos): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? ${ctx}.${t.label}.getChannel() : 0)`];
    };

    protected override renderTokenPropertyRefIndex = (t: OutputModelObjects.TokenPropertyRefIndex): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? ${ctx}.${t.label}.getTokenIndex() : 0)`];
    };

    protected override renderTokenPropertyRefInt = (t: OutputModelObjects.TokenPropertyRefInt): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? std::stoi(${ctx}.${t.label}.getText()) : 0)`];
    };

    protected override renderTokenPropertyRefLine = (t: OutputModelObjects.TokenPropertyRefLine): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? ${ctx}.${t.label}.getLine() : 0)`];
    };

    protected override renderTokenPropertyRefPos = (t: OutputModelObjects.TokenPropertyRefPos): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? ${ctx}.${t.label}.getCharPositionInLine() : 0)`];
    };

    protected override renderTokenPropertyRefText = (t: OutputModelObjects.TokenPropertyRefText): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? ${ctx}.${t.label}.getText() : "")`];
    };

    protected override renderTokenPropertyRefType = (t: OutputModelObjects.TokenPropertyRefType): Lines => {
        const ctx = this.renderContext(t);

        return [`(${ctx}.${t.label} != null ? ${ctx}.${t.label}.getType() : 0)`];
    };

    protected override renderTokenRef = (t: OutputModelObjects.TokenRef): Lines => {
        const ctx = this.renderContext(t);

        return [`${ctx}.<t.escapedName>`];
    };

    private renderParser(parserFile: OutputModelObjects.ParserFile,
        namedActions: Map<string, OutputModelObjects.Action>): Lines {
        const parser = parserFile.parser;

        const result: Lines = [];

        const parserName = this.toTitleCase(this.invariants.recognizerName);
        const superClass = parser.superClass ? this.renderActionChunks([parser.superClass]) : "Parser";
        result.push(`[System.CodeDom.Compiler.GeneratedCode("ANTLR", "${antlrVersion}")]`);
        result.push(`[System.CLSCompliant(false)]`);
        result.push(`public partial class ${parserName} : ${superClass} {`);
        result.push(`    protected static DFA[] decisionToDFA;`);
        result.push(`    protected static PredictionContextCache sharedContextCache = new PredictionContextCache();`);

        if (parser.tokens.size > 0) {
            result.push(`    public const int`);
            result.push(...this.renderList(this.renderMap(parser.tokens, 0, "${0}=${1}"),
                { wrap: 69, indent: 8, separator: ", ", finalSeparator: ";" }));
        }

        if (parser.rules.length > 0) {
            result.push(`    public const int`);

            const ruleAssignments: string[] = [];
            parser.rules.forEach((m, i) => {
                ruleAssignments.push(`RULE_${m.name} = ${i}`);
            });
            result.push(...this.renderList(ruleAssignments,
                { wrap: 69, indent: 8, separator: ", ", finalSeparator: ";" }));
        }

        result.push(`    public static readonly string[] ruleNames = {`);
        result.push(...this.renderList(parser.ruleNames,
            { wrap: 69, indent: 8, quote: '"', separator: ", " }));
        result.push(`    };`, ``);

        result.push(...this.renderVocabulary(parser.literalNames, parser.symbolicNames), ``);

        result.push(`    public override string GrammarFileName { get { return "${parser.grammarFileName}"; } }`);
        result.push(``);
        result.push(`    public override string[] RuleNames { get { return ruleNames; } }`);
        result.push(``);
        result.push(`    public override int[] SerializedAtn { get { return _serializedATN; } }`);
        result.push(``);
        result.push(`    static ${parserName}() {`);
        result.push(`        decisionToDFA = new DFA[_ATN.NumberOfDecisions];`);
        result.push(`        for (int i = 0; i < _ATN.NumberOfDecisions; i++) {`);
        result.push(`            decisionToDFA[i] = new DFA(_ATN.GetDecisionState(i), i);`);
        result.push(`        }`);
        result.push(`    }`);
        result.push(``);

        result.push(...this.renderAction(namedActions.get("members")));
        result.push(`    public ${parserName}(ITokenStream input) : this(input, Console.Out, Console.Error) { }`);
        result.push(``);
        result.push(`    public ${parserName}(ITokenStream input, TextWriter output, TextWriter errorOutput)`);
        result.push(`    : base(input, output, errorOutput)`);
        result.push(`{`);
        result.push(`    Interpreter = new ParserATNSimulator(this, _ATN, decisionToDFA, sharedContextCache);`);
        result.push(`}`);

        result.push(...this.renderRuleFunctions(namedActions, parser.funcs));

        if (parser.sempredFuncs.size > 0) {
            result.push(`    public override bool Sempred(RuleContext _localctx, int ruleIndex, int predIndex) {`);
            result.push(`        switch (ruleIndex) {`);

            const funcs: Lines = [];
            const cases: Lines = [];
            parser.sempredFuncs.values().forEach((f) => {
                funcs.push(...this.renderRuleSempredFunction(f));
                let line = `case ${f.ruleIndex}: `;
                line += `return ${f.name}_sempred((${f.ctxType})_localctx, predIndex);`;
                cases.push(line);
            });

            result.push(...this.formatLines(cases, 8));

            result.push(`        }`);
            result.push(`        return true;`);
            result.push(`    }`);

            result.push(...this.formatLines(funcs, 8));
        }

        result.push(``);
        result.push(...this.renderSerializedATN(parser.atn));
        result.push(`}`);

        return result;
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: Map<string, OutputModelObjects.Action>,
        namespaceName?: string): Lines {

        const result: Lines = [];

        const baseClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]) : "Lexer";
        result.push(`[System.CodeDom.Compiler.GeneratedCode("ANTLR", "${antlrVersion}")]`);
        result.push(`[System.CLSCompliant(false)]`);
        result.push(`public partial class ${lexer.name} : ${baseClass} {`);
        result.push(`    protected static DFA[] decisionToDFA;`);
        result.push(`    protected static PredictionContextCache sharedContextCache = new PredictionContextCache();`);

        if (lexer.tokens.size > 0) {
            result.push(`    public const int`);
            result.push(...this.renderList(this.renderMap(lexer.tokens, 0, "${0}=${1}"),
                { wrap: 69, indent: 8, separator: ", ", finalSeparator: ";" }));
        }

        if (lexer.escapedChannels.size > 0) {
            result.push(`    public const int`);
            result.push(...this.renderList(this.renderMap(lexer.escapedChannels, 0, "${0} = ${1}"),
                { wrap: 69, indent: 8, separator: ", ", finalSeparator: ";" }));
        }

        if (lexer.escapedModeNames.length > 1) {
            result.push(`    public const int`);
            const listedModes: string[] = [];
            lexer.escapedModeNames.forEach((m, i) => {
                listedModes.push(`${m} = ${i},`);
            });
            result.push(...this.renderList(listedModes, { wrap: 69, indent: 8, separator: "\n" }));
        }

        result.push(`    public static string[] channelNames = {`);
        result.push(...this.renderList(["DEFAULT_TOKEN_CHANNEL", "HIDDEN", ...lexer.channelNames],
            { wrap: 69, quote: '"', indent: 8 }));
        result.push(`    };`);
        result.push(``);
        result.push(`    public static string[] modeNames = {`);
        result.push(...this.renderList(lexer.modes, { wrap: 69, quote: '"', indent: 8 }));
        result.push(`    };`);
        result.push(``);
        result.push(`    public static readonly string[] ruleNames = {`);
        result.push(...this.renderList(lexer.ruleNames, { wrap: 69, quote: '"', indent: 8 }));
        result.push(`    };`);
        result.push(``);

        result.push(...this.renderAction(namedActions.get("members")));

        result.push(``);
        result.push(`	public ${lexer.name}(ICharStream input)`);
        result.push(`	: this(input, Console.Out, Console.Error) { }`);
        result.push(``);
        result.push(`	public ${lexer.name}(ICharStream input, TextWriter output, TextWriter errorOutput)`);
        result.push(`	: base(input, output, errorOutput)`);
        result.push(`	{`);
        result.push(`		Interpreter = new LexerATNSimulator(this, _ATN, decisionToDFA, sharedContextCache);`);
        result.push(`	}`);
        result.push(``);

        result.push(...this.formatLines(this.renderVocabulary(lexer.literalNames, lexer.symbolicNames), 4));
        result.push(``);

        result.push(`	public override string GrammarFileName { get { return "${lexer.grammarFileName}"; } }`);
        result.push(``);
        result.push(`	public override string[] RuleNames { get { return ruleNames; } }`);
        result.push(``);
        result.push(`	public override string[] ChannelNames { get { return channelNames; } }`);
        result.push(``);
        result.push(`	public override string[] ModeNames { get { return modeNames; } }`);
        result.push(``);
        result.push(`	public override int[] SerializedAtn { get { return _serializedATN; } }`);
        result.push(``);
        result.push(`	static ${lexer.name}() {`);
        result.push(`		decisionToDFA = new DFA[_ATN.NumberOfDecisions];`);
        result.push(`		for (int i = 0; i < _ATN.NumberOfDecisions; i++) {`);
        result.push(`			decisionToDFA[i] = new DFA(_ATN.GetDecisionState(i), i);`);
        result.push(`		}`);
        result.push(`	}`);

        result.push(...this.formatLines(this.renderActionHandlers(lexer), 4));
        result.push(...this.formatLines(this.renderSerializedATN(lexer.atn), 4));
        result.push(`}`);

        return result;
    }

    private renderVocabulary(literalNames: Array<string | null>, symbolicNames: Array<string | null>): Lines {
        const result: Lines = this.startRendering("Vocabulary");

        result.push(`private static readonly string[] _LiteralNames = {`);
        result.push(...this.renderList(literalNames, { wrap: 69, indent: 4, null: "null", separator: ", " }));
        result.push(`};`);
        result.push(`private static readonly string[] _SymbolicNames = {`);
        result.push(...this.renderList(symbolicNames, { wrap: 69, indent: 4, null: "null", separator: ", " }));
        result.push(`};`);
        result.push(`public static readonly IVocabulary DefaultVocabulary = new Vocabulary(_LiteralNames, ` +
            `_SymbolicNames);`);
        result.push(``);
        result.push(`[NotNull]`);
        result.push(`public override IVocabulary Vocabulary`);
        result.push(`{`);
        result.push(`	get`);
        result.push(`	{`);
        result.push(`		return DefaultVocabulary;`);
        result.push(`	}`);
        result.push(`}`);

        return this.endRendering("Vocabulary", result);
    }

    private renderActionHandlers(lexer: OutputModelObjects.Lexer): Lines {
        const result: Lines = this.startRendering("actionHandlers");

        if (lexer.actionFuncs.size > 0) {
            result.push(`public override void Action(RuleContext _localctx, int ruleIndex, int actionIndex) {`);

            const block: Lines = [];
            block.push(`switch (ruleIndex) {`);

            for (const f of lexer.actionFuncs.values()) {
                let line = `case ${f.ruleIndex} : `;

                const cast = lexer.modes.length === 0 ? ` as ${f.ctxType}` : "";

                line += `${f.name}_action(_localctx${cast}, actionIndex); break;`;
                block.push(line);
            }

            block.push(`}`);

            result.push(...this.formatLines(block, 4));
            result.push("}");

            for (const [_, func] of lexer.actionFuncs) {
                result.push(...this.formatLines(this.renderRuleActionFunction(func), 0));
            }

        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(`public override bool Sempred(RuleContext _localctx, int ruleIndex, int predIndex) {`);
            result.push(`    switch (ruleIndex) {`);

            const funcs: Lines = [];
            lexer.sempredFuncs.forEach((f) => {
                let line = `case ${f.ruleIndex} : `;
                line += `return ${f.name}_sempred(_localctx${lexer.modes.length === 0 ? "as " + f.ctxType : ""}` +
                    `, predIndex);`;
                result.push(line);

                funcs.push(...this.renderRuleSempredFunction(f));
            });

            result.push(`    }`);
            result.push(`    return true;`);
            result.push(`}`);
            result.push(...funcs);
        }

        return this.endRendering("actionHandlers", result);
    }

    /**
     * Produces smaller bytecode only when `bits` contains more than two items.
     *
     * @param s The set of bits to test.
     * @param bits The bits to test in the set.
     *
     * @returns The lines of code implementing the test.
     */
    private renderBitsetBitfieldComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): Lines {
        const result = this.startRendering("BitsetBitfieldComparison");

        // To stay close to the old generator's output, we render the two lines as one with embedded line break.
        result.push(`(${this.renderTestShiftInRange(this.renderOffsetShiftVar(s.varName, bits.shift))} && ` +
            `((1L << ${this.renderOffsetShiftVar(s.varName, bits.shift)}) & ${bits.calculated}L) != 0)`);

        return this.endRendering("BitsetBitfieldComparison", result);
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `${s.varName}==${t.name}`;
        }).join(" || ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        return offset > 0 ? `(${shiftAmount} - ${offset})` : shiftAmount;
    }

    private renderTestShiftInRange(shiftAmount: string): string {
        return `((${shiftAmount}) & ~0x3f) == 0`;
    };

    private renderCommonSetStuff = (m: OutputModelObjects.MatchSet, invert: boolean): Lines => {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`State = ${m.stateNumber};`);

        if (m.labels.length > 0) {
            let labels = "";
            for (const l of m.labels) {
                labels += `${this.renderLabelref(l)} = `;
            }
            result.push(`${labels}TokenStream.LT(1);`);
        }

        if (m.capture instanceof OutputModelObjects.CaptureNextTokenType) {
            result.push(this.renderCaptureNextTokenType(m.capture)[0]);
        } else {
            result.push(this.renderCaptureNextToken(m.capture)[0]);
        }

        if (invert) {
            result.push(`if ( ${m.expr.varName} <= 0 || ` +
                `${this.renderTestSetInline(m.expr).join("")} ) {`);
        } else {
            result.push(`if ( !(${this.renderTestSetInline(m.expr).join("")}) ) {`);
        }

        let labels = "";
        if (m.labels.length > 0) {
            for (const l of m.labels) {
                labels += `${this.renderLabelref(l)} = `;
            }
        }
        result.push(`    ${labels}ErrorHandler.RecoverInline(this);`);

        result.push(`}`, `else {`);
        result.push(`    ErrorHandler.ReportMatch(this);`);
        result.push(`    Consume();`);
        result.push(`}`);

        return this.endRendering("CommonSetStuff", result);
    };

    private renderTokenTypeName(name: string): string {
        return name === "EOF" ? "Eof" : name;
    }
}
