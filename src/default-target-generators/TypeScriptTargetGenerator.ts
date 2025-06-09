/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable max-len, jsdoc/require-returns, jsdoc/require-param */

import * as OutputModelObjects from "src/codegen/model/index.js";
import { GeneratorBase } from "../codegen/GeneratorBase.js";
import type { ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { IndexedObject } from "../support/helpers.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import type { Grammar } from "../tool/Grammar.js";
import type { Rule } from "../tool/Rule.js";
import { antlrVersion } from "../version.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";

/** For debugging: when set to true includes start and end markers for each part. */
// eslint-disable-next-line prefer-const
let logRendering = false;

/** The constructor type of OutputModelObject class. Used the source op lookup map. */
type OutputModelObjectConstructor = new (...args: unknown[]) => OutputModelObjects.OutputModelObject;

export class TypeScriptTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.typescript";

    public readonly language = "TypeScript";
    public readonly languageSpecifiers = ["typescript", "ts"];

    public readonly codeFileExtension = ".ts";
    public readonly contextNameSuffix = "Context";
    public readonly lexerRuleContext = "antlr.ParserRuleContext";

    /** The rule context name is the rule followed by a suffix, e.g. r becomes rContext. */
    public readonly ruleContextNameSuffix = "Context";

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

    public readonly lexerCommandMap: Map<string, () => Lines>;
    public readonly lexerCallCommandMap: Map<string, (arg: string, grammar: Grammar) => Lines>;

    private static readonly defaultValues: Record<string, string> = {
        "bool": "false",
        "int": "0",
        "float": "0.0",
        "string": "\"\"",
    };

    /**
     * Code blocks are at the heart of code generation. This map allows easy lookup of the correct render method for a
     * specific output model code object, named a `SrcOp`. Source ops are code snippets that are put together
     * to form the final code.
     */
    private readonly srcOpMap = new Map<OutputModelObjectConstructor,
        (outputFile: OutputModelObjects.OutputFile, recognizerName: string, srcOp: OutputModelObjects.SrcOp) => Lines>([
            [OutputModelObjects.AddToLabelList, (outputFile, recognizerName, srcOp) => {
                return this.renderAddToLabelList(srcOp as OutputModelObjects.AddToLabelList);
            }],
            [OutputModelObjects.AttributeDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderAttributeDecl(srcOp as OutputModelObjects.AttributeDecl);
            }],
            [OutputModelObjects.CaptureNextToken, (outputFile, recognizerName, srcOp) => {
                return this.renderCaptureNextToken(srcOp as OutputModelObjects.CaptureNextToken);
            }],
            [OutputModelObjects.CaptureNextTokenType, (outputFile, recognizerName, srcOp) => {
                return this.renderCaptureNextTokenType(srcOp as OutputModelObjects.CaptureNextTokenType);
            }],
            [OutputModelObjects.CodeBlockForAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderCodeBlockForAlt(outputFile, recognizerName, srcOp as OutputModelObjects.CodeBlockForAlt);
            }],
            [OutputModelObjects.CodeBlockForOuterMostAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, srcOp as OutputModelObjects.CodeBlockForOuterMostAlt);
            }],
            [OutputModelObjects.ContextRuleGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextRuleGetterDecl(srcOp as OutputModelObjects.ContextRuleGetterDecl);
            }],
            [OutputModelObjects.ContextRuleListGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextRuleListGetterDecl(srcOp as OutputModelObjects.ContextRuleListGetterDecl);
            }],
            [OutputModelObjects.ContextTokenGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextTokenGetterDecl(recognizerName, srcOp as OutputModelObjects.ContextTokenGetterDecl);
            }],
            [OutputModelObjects.ContextTokenListGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextTokenListGetterDecl(srcOp as OutputModelObjects.ContextTokenListGetterDecl);
            }],
            [OutputModelObjects.ContextTokenListIndexedGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextTokenListIndexedGetterDecl(recognizerName, srcOp as OutputModelObjects.ContextTokenListIndexedGetterDecl);
            }],
            [OutputModelObjects.ExceptionClause, (outputFile, recognizerName, srcOp) => {
                return this.renderExceptionClause(srcOp as OutputModelObjects.ExceptionClause);
            }],
            [OutputModelObjects.LL1AltBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1AltBlock(outputFile, recognizerName, srcOp as OutputModelObjects.LL1AltBlock);
            }],
            [OutputModelObjects.LL1OptionalBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1OptionalBlock(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1OptionalBlock);
            }],
            [OutputModelObjects.LL1OptionalBlockSingleAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1OptionalBlockSingleAlt(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1OptionalBlockSingleAlt);
            }],
            [OutputModelObjects.LL1StarBlockSingleAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1StarBlockSingleAlt(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1StarBlockSingleAlt);
            }],
            [OutputModelObjects.LL1PlusBlockSingleAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1PlusBlockSingleAlt(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1PlusBlockSingleAlt);
            }],
            [OutputModelObjects.MatchToken, (outputFile, recognizerName, srcOp) => {
                return this.renderMatchToken(recognizerName, srcOp as OutputModelObjects.MatchToken);
            }],
            [OutputModelObjects.MatchSet, (outputFile, recognizerName, srcOp) => {
                return this.renderMatchSet(srcOp as OutputModelObjects.MatchSet);
            }],
            [OutputModelObjects.MatchNotSet, (outputFile, recognizerName, srcOp) => {
                return this.renderMatchNotSet(srcOp as OutputModelObjects.MatchNotSet);
            }],
            [OutputModelObjects.RuleContextDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderRuleContextDecl(srcOp as OutputModelObjects.RuleContextDecl);
            }],
            [OutputModelObjects.RuleContextListDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderRuleContextListDecl(srcOp as OutputModelObjects.RuleContextListDecl);
            }],
            [OutputModelObjects.StructDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderStructDecl(outputFile, recognizerName, srcOp as OutputModelObjects.StructDecl);
            }],
            [OutputModelObjects.TestSetInline, (outputFile, recognizerName, srcOp) => {
                return this.renderTestSetInline(srcOp as OutputModelObjects.TestSetInline);
            }],
            [OutputModelObjects.TokenDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderTokenDecl(outputFile, recognizerName, srcOp as OutputModelObjects.TokenDecl);
            }],
            [OutputModelObjects.TokenTypeDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderTokenTypeDecl(srcOp as OutputModelObjects.TokenTypeDecl);
            }],
            [OutputModelObjects.TokenListDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderTokenListDecl(srcOp as OutputModelObjects.TokenListDecl);
            }],
            [OutputModelObjects.ThrowNoViableAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderThrowNoViableAlt(srcOp as OutputModelObjects.ThrowNoViableAlt);
            }],
            [OutputModelObjects.Wildcard, (outputFile, recognizerName, srcOp) => {
                return this.renderWildcard(srcOp as OutputModelObjects.Wildcard);
            }],
            [OutputModelObjects.ContextRuleListIndexedGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextRuleListIndexedGetterDecl(
                    srcOp as OutputModelObjects.ContextRuleListIndexedGetterDecl);
            }],
            [OutputModelObjects.StarBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderStarBlock(outputFile, recognizerName, srcOp as OutputModelObjects.StarBlock);
            }],
            [OutputModelObjects.PlusBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderPlusBlock(outputFile, recognizerName, srcOp as OutputModelObjects.PlusBlock);
            }],
            [OutputModelObjects.OptionalBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderOptionalBlock(outputFile, recognizerName, srcOp as OutputModelObjects.OptionalBlock);
            }],
            [OutputModelObjects.AltBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderAltBlock(outputFile, recognizerName, srcOp as OutputModelObjects.AltBlock);
            }],
            [OutputModelObjects.InvokeRule, (outputFile, recognizerName, srcOp) => {
                return this.renderInvokeRule(srcOp as OutputModelObjects.InvokeRule);
            }],
            [OutputModelObjects.SemPred, (outputFile, recognizerName, srcOp) => {
                return this.renderSemPred(srcOp as OutputModelObjects.SemPred);
            }],
            [OutputModelObjects.Action, (outputFile, recognizerName, srcOp) => {
                return this.renderAction(srcOp as OutputModelObjects.Action);
            }],
        ]);

    public constructor() {
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
    }

    public renderParserFile(parserFile: OutputModelObjects.ParserFile): string {
        const result: Lines = [
            ...this.renderFileHeader(parserFile),
            "",
            "import * as antlr from \"antlr4ng\";",
            "import { Token } from \"antlr4ng\";",
            "",
        ];

        if (parserFile.genListener) {
            result.push(`import { ${parserFile.grammarName}Listener } from "./${parserFile.grammarName}Listener.js";`);
        }

        if (parserFile.genVisitor) {
            result.push(`import { ${parserFile.grammarName}Visitor } from "./${parserFile.grammarName}Visitor.js";`);
        }

        result.push("");
        result.push(
            "// for running tests with parameters, TODO: discuss strategy for typed parameters in CI",
            "// eslint-disable-next-line no-unused-vars",
            "type int = number;",
            "",
        );

        result.push(...this.renderAction(parserFile.namedActions.get("header")));
        result.push(...this.renderParser(parserFile));

        return result.join("\n");
    }

    public renderLexerFile(lexerFile: OutputModelObjects.LexerFile): string {
        const result: Lines = this.renderFileHeader(lexerFile);
        result.push("");
        result.push(`import * as antlr from "antlr4ng";`);
        result.push(`import { Token } from "antlr4ng";`);
        result.push("");

        result.push(...this.renderAction(lexerFile.namedActions.get("header")));
        result.push(...this.renderLexer(lexerFile.lexer, lexerFile.namedActions));

        return result.join("\n");
    }

    public renderBaseListenerFile(file: OutputModelObjects.ListenerFile, declaration: boolean): string {
        return "";
    }

    public renderListenerFile(listenerFile: OutputModelObjects.ListenerFile): string {
        const result: Lines = [
            ...this.renderFileHeader(listenerFile),
            "",
            "import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from \"antlr4ng\";",
            "",
        ];

        if (listenerFile.header) {
            result.push(...this.renderAction(listenerFile.header));
        }

        for (const lname of listenerFile.listenerNames) {
            result.push(`import { ${this.toTitleCase(lname)}Context } from "./${listenerFile.parserName}.js";`);
        }

        const beforeListener = listenerFile.namedActions.get("beforeListener");
        if (beforeListener) {
            result.push(...this.renderAction(beforeListener));
        }

        result.push("");
        result.push(`/**`);
        result.push(` * This interface defines a complete listener for a parse tree produced by ` +
            `\`${listenerFile.parserName}\`.`);
        result.push(` */`);
        result.push(`export class ${listenerFile.grammarName}Listener implements ParseTreeListener {`);

        const block: Lines = [];
        for (const lname of listenerFile.listenerNames) {
            block.push("");
            block.push("/**");
            if (listenerFile.listenerLabelRuleNames.has(lname)) {
                block.push(` * Enter a parse tree produced by the \`${lname}\``);
                block.push(` * labeled alternative in \`${listenerFile.parserName}.${listenerFile.listenerLabelRuleNames.get(lname)}\`.`);
            } else {
                block.push(` * Enter a parse tree produced by \`${listenerFile.parserName}.${lname}\`.`);
            }

            block.push(" * @param ctx the parse tree");
            block.push(" */");
            block.push(`enter${this.toTitleCase(lname)}?: (ctx: ${this.toTitleCase(lname)}` +
                `Context) => void;`);
            block.push("");

            block.push("/**");
            if (listenerFile.listenerLabelRuleNames.has(lname)) {
                block.push(` * Exit a parse tree produced by the \`${lname}\``);
                block.push(` * labeled alternative in \`${listenerFile.parserName}.${listenerFile.listenerLabelRuleNames.get(lname)}\`.`);
            } else {
                block.push(` * Exit a parse tree produced by \`${listenerFile.parserName}.${lname}\`.`);
            }
            block.push(" * @param ctx the parse tree");
            block.push(" */");

            block.push(`exit${this.toTitleCase(lname)}?: ` +
                `(ctx: ${this.toTitleCase(lname)}Context) => void;`);

            block.push(
                "",
                "visitTerminal(node: TerminalNode): void {}",
                "visitErrorNode(node: ErrorNode): void {}",
                "enterEveryRule(node: ParserRuleContext): void {}",
                "exitEveryRule(node: ParserRuleContext): void {}",
            );

            const afterListener = listenerFile.namedActions.get("afterListener");
            if (afterListener) {
                result.push("");
                result.push(...this.renderAction(afterListener));
            }
        }

        result.push(...this.formatLines(block, 4));
        result.push("}");
        result.push("");

        return result.join("\n");
    }

    public renderBaseVisitorFile(file: OutputModelObjects.VisitorFile, declaration: boolean): string {
        return "";
    }

    public renderVisitorFile(visitorFile: OutputModelObjects.VisitorFile, declaration: boolean): string {
        const result: Lines = [
            ...this.renderFileHeader(visitorFile),
            "",
            `import { AbstractParseTreeVisitor } from "antlr4ng";`,
        ];

        const action = this.renderAction(visitorFile.header);
        if (action.length > 0) {
            result.push("");
            result.push(...action);
        }

        if (visitorFile.visitorNames.size > 0) {
            result.push("");
            for (const lname of visitorFile.visitorNames) {
                result.push(`import { ${this.toTitleCase(lname)}Context } from ` +
                    `"./${visitorFile.parserName}.js";`);
            }
        }

        const beforeVisitor = visitorFile.namedActions.get("beforeVisitor");
        if (beforeVisitor) {
            result.push("");
            result.push(...this.renderAction(beforeVisitor));
        }

        result.push("");
        result.push(`/**`);
        result.push(` * This interface defines a complete generic visitor for a parse tree produced`);
        result.push(` * by \`${visitorFile.parserName}\`.`);
        result.push(` *`);
        result.push(` * @param <Result> The return type of the visit operation. Use \`void\` for`);
        result.push(` * operations with no return type.`);
        result.push(` */`);
        result.push(`export class ${visitorFile.grammarName}Visitor<Result> extends AbstractParseTreeVisitor<Result> {`);

        for (const lname of visitorFile.visitorNames) {
            result.push("");
            result.push("    /**");
            if (visitorFile.visitorLabelRuleNames.has(lname)) {
                result.push(`     * Visit a parse tree produced by the \`${lname}\``);
                result.push(`     * labeled alternative in \`${visitorFile.parserName}.${visitorFile.visitorLabelRuleNames.get(lname)}\`.`);
            } else {
                result.push(`     * Visit a parse tree produced by \`${visitorFile.parserName}.${lname}\`.`);
            }
            result.push("     * @param ctx the parse tree");
            result.push("     * @return the visitor result");
            result.push("     */");
            result.push(`    visit${this.toTitleCase(lname)}?: (ctx: ${this.toTitleCase(lname)}Context) => Result;`);
        }

        const afterVisitor = visitorFile.namedActions.get("afterVisitor");
        if (afterVisitor) {
            result.push(...this.renderAction(afterVisitor));
        }

        result.push("}");
        result.push("");

        return result.join("\n");
    }

    public renderLexerRuleContext(): Lines {
        return ["antlr.ParserRuleContext"];
    }

    public getRuleFunctionContextStructName(r: Rule): string {
        if (r.g.isLexer()) {
            return this.renderLexerRuleContext().join("");
        }

        return this.toTitleCase(r.name) + this.ruleContextNameSuffix;
    }

    public renderRecRuleReplaceContext(ctxName: string): Lines {
        return [
            `localContext = new ${ctxName}Context(localContext);`,
            "this.context = localContext;",
            "previousContext = localContext;"
        ];
    }

    public renderRecRuleAltPredicate(ruleName: string, opPrec: number): Lines {
        return [`this.precpred(this.context, ${opPrec})`];
    };

    public renderRecRuleSetReturnAction(src: string, name: string): Lines {
        return [`$${name} = $${src}.${name};`];
    };

    public renderRecRuleSetStopToken(): Lines {
        return [`this.context!.stop = this.tokenStream.LT(-1);`];
    };

    public renderRecRuleSetPrevCtx(): Lines {
        return [
            "if (this.parseListeners != null) {",
            "    this.triggerExitRuleEvent();",
            "}",
            "",
            "previousContext = localContext;",
        ];
    }

    public renderRecRuleLabeledAltStartAction(parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines {

        const altLabelClass = this.toTitleCase(currentAltLabel);
        const ruleNameClass = this.toTitleCase(ruleName);

        const result: Lines = [
            `localContext = new ${altLabelClass}Context(new ${ruleNameClass}Context(parentContext, parentState));`
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`(localContext as ${altLabelClass}Context)._${label}.push(previousContext);`);
            } else {
                result.push(`(localContext as ${altLabelClass}Context)._${label} = previousContext;`);
            }
        }

        result.push(`this.pushNewRecursionContext(localContext, _startState, ${parserName}.RULE_${ruleName});`);

        return result;
    }

    public renderRecRuleAltStartAction(parserName: string, ruleName: string, ctxName: string, label: string | undefined,
        isListLabel: boolean): Lines {

        const contextClass = this.toTitleCase(ctxName);
        const result: Lines = [`localContext = new ${contextClass}Context(parentContext, parentState);`];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`localContext._${label}.push(previousContext);`);
            } else {
                result.push(`localContext._${label} = previousContext;`);
            }
        }

        result.push(`this.pushNewRecursionContext(localContext, _startState, ${parserName}.RULE_${ruleName});`);

        return result;
    }

    public renderTestFile(grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string {
        const lines: Lines = [
            `import fs from "node:fs";`,
            `import {`,
            `	CharStream,	CommonTokenStream, DiagnosticErrorListener, Lexer, ParseTreeListener, ParseTreeWalker,`,
            `    ParserRuleContext, PredictionMode, TerminalNode, ErrorNode, PredictionContext`,
            `} from 'antlr4ng';`,
            `import { ${lexerName} } from './${lexerName}.js';`
        ];

        if (parserName) {
            lines.push(`import { ${parserName} } from './${parserName}.js';`);

            if (useListener) {
                lines.push(`import { ${grammarName}Listener } from './${grammarName}Listener.js';`);
            }

            if (useVisitor) {
                lines.push(`import { ${grammarName}Visitor } from './${grammarName}Visitor.js';`);
            }

            lines.push(
                `class TreeShapeListener implements ParseTreeListener {`,
                `    public enterEveryRule(ctx: ParserRuleContext) {`,
                `        for (let i = 0; i < ctx.getChildCount(); i++) {`,
                `            const child = ctx.getChild(i) as ParserRuleContext;`,
                `            const parent = child.parent;`,
                `            if (parent!.ruleContext !== ctx || !(parent instanceof ParserRuleContext)) {`,
                `                throw "Invalid parse tree shape detected.";`,
                `            }`,
                `        }`,
                `    }`,
                ``,
                `   public visitTerminal(node: TerminalNode): void { }`,
                `	public visitErrorNode(node: ErrorNode): void { }`,
                `	public exitEveryRule(ctx: ParserRuleContext): void { }`,
                `}`,
            );
        }

        lines.push(
            `export const main = (text: string): void => {`,
            ``,
            `    const input = CharStream.fromString(text);`,
            `    input.name = "input";`,
            `    const lexer = new ${lexerName}(input);`,
            `    const stream = new CommonTokenStream(lexer);`,
        );

        if (parserName) {
            lines.push(`    const parser = new ${parserName}(stream);`);

            if (showDiagnosticErrors) {
                lines.push(`parser.addErrorListener(new DiagnosticErrorListener());`);
            }

            lines.push(
                `    parser.printer = {`,
                `        println : function(s: string) { console.log(s); },`,
                `        print : function(s: string) { process.stdout.write(s); }`,
                `    };`,
            );

            if (profile) {
                lines.push(`    parser.setProfile(true);`);
            }

            lines.push(`    parser.interpreter.predictionMode = PredictionMode.${predictionMode};`);
            lines.push(`    parser.buildParseTree = ${buildParseTree};`);
            lines.push(`    parser.interpreter.traceATNSimulator = ${traceATN};`);
            lines.push(`    PredictionContext.traceATNSimulator = ${traceATN};`);

            lines.push(`    const tree = parser.${parserStartRuleName}();`);

            if (profile) {
                lines.push(
                    `    const decisionInfo = parser.getParseInfo()!.getDecisionInfo();`,
                    `    console.log(\`[\${ decisionInfo.join(', ') }]\`);`,
                );
            }

            lines.push(`    ParseTreeWalker.DEFAULT.walk(new TreeShapeListener(), tree);`);
        } else {
            lines.push(
                `    stream.fill();`,
                `    for(let i = 0; i < stream.tokens.length; ++i) {`,
                `        console.log(stream.tokens[i].toString());`,
                `    }`,
            );

            if (showDFA) {
                lines.push(`    process.stdout.write(lexer.interpreter.decisionToDFA[antlr4.Lexer.DEFAULT_MODE].` +
                    `toLexerString());`,
                );
            }
        }

        lines.push("}");

        return lines.join("\n");
    }

    private renderParser(parserFile: OutputModelObjects.ParserFile): Lines {
        const parser = parserFile.parser;

        const baseClass = parser.superClass ? this.renderActionChunks([parser.superClass]) : "antlr.Parser";
        const result: Lines = [
            `export class ${parser.name} extends ${baseClass} {`
        ];

        const block: Lines = [];
        result.push(...this.renderMap(parser.tokens, 4, "public static readonly ${0} = ${1};"));
        result.push(...this.renderTemplatedObjectList(parser.rules, 4, "public static readonly RULE_${0} = ${1};",
            "name", "index"));

        block.push("");
        block.push("public static readonly literalNames = [");
        block.push(...this.renderList(parser.literalNames, { wrap: 63, indent: 4 }));
        block.push("];");

        block.push("");
        block.push("public static readonly symbolicNames = [");
        block.push(...this.renderList(parser.symbolicNames, { wrap: 63, indent: 4 }));
        block.push("];");

        block.push("");
        block.push("public static readonly ruleNames = [");
        block.push(...this.renderList(parser.ruleNames, { wrap: 63, indent: 4, quote: '"' }));
        block.push("];");

        block.push("");
        block.push(`public get grammarFileName(): string { return "${parser.grammarFileName}"; }`);
        block.push(`public get literalNames(): (string | null)[] { return ${parser.name}.literalNames; }`);
        block.push(`public get symbolicNames(): (string | null)[] { return ${parser.name}.symbolicNames; }`);
        block.push(`public get ruleNames(): string[] { return ${parser.name}.ruleNames; }`);
        block.push(`public get serializedATN(): number[] { return ${parser.name}._serializedATN; }`);

        block.push("");
        block.push(`protected createFailedPredicateException(predicate?: string, message?: string):` +
            ` antlr.FailedPredicateException {`);
        block.push(`    return new antlr.FailedPredicateException(this, predicate, message);`);
        block.push(`}`);

        if (parserFile.namedActions.has("members")) {
            block.push(...this.renderAction(parserFile.namedActions.get("members")));
        }

        block.push("");
        block.push(`public constructor(input: antlr.TokenStream) {`);
        block.push(`    super(input);`);
        block.push(`    this.interpreter = new antlr.ParserATNSimulator(this, ${parser.name}._ATN, ` +
            `${parser.name}.decisionsToDFA, new antlr.PredictionContextCache());`);
        block.push(`}`);

        if (parser.funcs.length > 0) {
            block.push("");
            parser.funcs.forEach((f) => {
                if (f instanceof OutputModelObjects.LeftRecursiveRuleFunction) {
                    block.push(...this.renderLeftRecursiveRuleFunction(parserFile, f));
                } else {
                    block.push(...this.renderRuleFunction(parserFile, f));
                }
            });
        }

        if (parser.sempredFuncs.size > 0) {
            block.push(`public override sempred(localContext: antlr.ParserRuleContext | null, ruleIndex: number, ` +
                `predIndex: number): boolean {`);
            block.push(`    switch (ruleIndex) {`);

            const funcs: Lines = [];
            const cases: Lines = [];
            parser.sempredFuncs.values().forEach((f) => {
                funcs.push(...this.renderRuleSempredFunction(f));
                cases.push(`case ${f.ruleIndex}: {`);
                cases.push(`    return this.${f.name}_sempred(localContext as ${f.ctxType}, predIndex);`);
                cases.push(`}`);
                cases.push("");
            });

            block.push(...this.formatLines(cases, 8));
            block.push(`        default:`);
            block.push(`    }`);
            block.push("");
            block.push(`    return true;`);
            block.push(`}`);
            block.push("");

            block.push(...funcs);
        }

        block.push("");
        block.push(...this.renderSerializedATN(parser.atn, parser.name));

        block.push("");
        block.push(`private static readonly vocabulary = new antlr.Vocabulary(${parser.name}.literalNames, ` +
            `${parser.name}.symbolicNames, []);`);
        block.push(`public override get vocabulary(): antlr.Vocabulary {`);
        block.push(`    return ${parser.name}.vocabulary;`);
        block.push(`}`);

        block.push(`private static readonly decisionsToDFA = ${parser.name}._ATN.decisionToState.map((ds: ` +
            `antlr.DecisionState, index: number) => { return new antlr.DFA(ds, index); });`);

        result.push(...this.formatLines(block, 4));
        result.push("}");
        result.push("");

        parser.funcs.forEach((currentRule) => {
            result.push(...this.renderStructDecl(parserFile, parser.name, currentRule.ruleCtx));

            if (currentRule.altLabelCtxs && currentRule.altLabelCtxs.size > 0) {
                result.push("");
                currentRule.altLabelCtxs.forEach((ctx) => {
                    result.push(...this.renderAltLabelStructDecl(parserFile, parser.name, currentRule, ctx));
                });
            }
        });

        return result;
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: Map<string, OutputModelObjects.Action>): Lines {
        const result: Lines = [];

        const baseClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]) : "antlr.Lexer";
        result.push(`export class ${lexer.name} extends ${baseClass} {`);

        const block: Lines = [];
        for (const [key, value] of lexer.tokens) {
            block.push(`public static readonly ${key} = ${value};`);
        }

        for (let i = 1; i < lexer.modes.length; ++i) {
            block.push(`public static readonly ${lexer.modes[i]} = ${i};`);
        }
        block.push("");

        block.push(`public static readonly channelNames = [`);
        block.push(...this.renderList(["DEFAULT_TOKEN_CHANNEL", "HIDDEN", ...lexer.channelNames],
            { wrap: 60, quote: '"', indent: 4 }));
        block.push(`];`);
        block.push("");

        block.push(`public static readonly literalNames = [`);
        block.push(...this.renderList(lexer.literalNames, { wrap: 63, indent: 4 }));
        block.push(`];`);
        block.push("");

        block.push(`public static readonly symbolicNames = [`);
        block.push(...this.renderList(lexer.symbolicNames, { wrap: 63, indent: 4 }));
        block.push(`];`);
        block.push("");

        block.push(`public static readonly modeNames = [`);
        block.push(...this.renderList(lexer.escapedModeNames, { wrap: 63, quote: '"', indent: 4 }));
        block.push(`];`);
        block.push("");

        block.push(`public static readonly ruleNames = [`);
        block.push(...this.renderList(lexer.ruleNames, { wrap: 63, quote: '"', indent: 4 }));
        block.push(`];`);
        block.push("");

        block.push(...this.renderAction(namedActions.get("members")));

        block.push(`public constructor(input: antlr.CharStream) {`);
        block.push(`    super(input);`);
        block.push(`    this.interpreter = new antlr.LexerATNSimulator(this, ${lexer.name}._ATN, ${lexer.name}.` +
            `decisionsToDFA, new antlr.PredictionContextCache());`);
        block.push(`}`);
        block.push("");

        block.push(`public get grammarFileName(): string { return "${lexer.grammarFileName}"}`);
        block.push(`public get literalNames(): (string | null)[] { return ${lexer.name}.literalNames; }`);
        block.push(`public get symbolicNames(): (string | null)[] { return ${lexer.name}.symbolicNames; }`);
        block.push(`public get ruleNames(): string[] { return ${lexer.name}.ruleNames; }`);
        block.push("");
        block.push(`public get serializedATN(): number[] { return ${lexer.name}._serializedATN; }`);
        block.push("");
        block.push(`public get channelNames(): string[] { return ${lexer.name}.channelNames; }`);
        block.push("");
        block.push(`public get modeNames(): string[] { return ${lexer.name}.modeNames; }`);
        block.push("");

        block.push(...this.renderActionHandlers(lexer));
        block.push(...this.renderSerializedATN(lexer.atn, lexer.name));
        block.push("");
        block.push(`private static readonly vocabulary = new antlr.Vocabulary(${lexer.name}.literalNames, ` +
            `${lexer.name}.symbolicNames, []);`);
        block.push("");
        block.push(`public override get vocabulary(): antlr.Vocabulary {`);
        block.push(`    return ${lexer.name}.vocabulary;`);
        block.push(`}`);
        block.push("");
        block.push(`private static readonly decisionsToDFA = ${lexer.name}._ATN.decisionToState.map((ds: antlr.DecisionState,`);
        block.push(`    index: number) => { return new antlr.DFA(ds, index); })`);
        block.push(`;`);

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        return result;
    }

    private renderActionHandlers(lexer: OutputModelObjects.Lexer): Lines {
        const result: Lines = this.startRendering("actionHandlers");

        if (lexer.actionFuncs.size > 0) {
            result.push(`public override action(localContext: antlr.ParserRuleContext | null, ruleIndex: number, ` +
                `actionIndex: number): void {`);

            const block: Lines = [];
            block.push(`switch (ruleIndex) {`);

            for (const f of lexer.actionFuncs.values()) {
                block.push(`    case ${f.ruleIndex}:`);

                const cast = lexer.modes.length === 0 ? ` as ${f.ctxType}` : "";
                block.push(`        this.${f.name}_action(localContext${cast}, actionIndex);`);
                block.push(`        break;`);
            }

            block.push(`}`);

            result.push(...this.formatLines(block, 4));
            result.push("}");

            for (const [_, func] of lexer.actionFuncs) {
                result.push("");
                result.push(...this.formatLines(this.renderRuleActionFunction(func), 0));
            }

        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(`public override sempred(localContext: antlr.ParserRuleContext | null, ruleIndex: number, predIndex: number): boolean {`);
            result.push(`    switch (ruleIndex) {`);

            const funcs: Lines = [];
            lexer.sempredFuncs.forEach((f) => {
                /*result.push(`        case ${f.ruleIndex}: {`);
                result.push(`            return this.${f.name}_sempred(localContext${lexer.modes.length === 0 ? "as " + f.ctxType : ""}, predIndex);`);
                result.push(`        }`);
                result.push("");*/
                result.push(`        case ${f.ruleIndex}:`);
                result.push(`            return this.${f.name}_sempred(localContext${lexer.modes.length === 0 ? "as " + f.ctxType : ""}, predIndex);`);

                funcs.push(...this.renderRuleSempredFunction(f));
            });

            result.push("");
            result.push("        default:");
            result.push("    }");
            result.push("");
            result.push(`    return true;`);
            result.push(`}`);
            result.push("");
            result.push(...funcs);
        }

        return this.endRendering("actionHandlers", result);
    }

    private renderRuleActionFunction(r: OutputModelObjects.RuleActionFunction): Lines {
        const result: Lines = this.startRendering("ruleActionFunction");

        result.push(`private ${r.name}_action(localContext: ${r.ctxType}, actionIndex: number): void {`);
        result.push(`    switch (actionIndex) {`);

        for (const [index, action] of r.actions) {
            result.push(`        case ${index}:`);
            result.push(...this.formatLines(this.renderAction(action), 8));
            result.push(`            break;`);
        }
        result.push(`    }`);
        result.push(`}`);

        return this.endRendering("ruleActionFunction", result);
    }

    /**
     * This generates a private method since the predIndex is generated, making an overriding implementation
     * impossible to maintain.
     */
    private renderRuleSempredFunction(r: OutputModelObjects.RuleSempredFunction): Lines {
        const result: Lines = this.startRendering("ruleSempredFunction");

        result.push(`private ${r.name}_sempred(localContext: ${r.ctxType}, predIndex: number): boolean {`);
        result.push(`    switch (predIndex) {`);

        for (const [index, action] of r.actions) {
            result.push(`        case ${index}: {`);

            const actionText = this.renderAction(action).join("");

            // No line breaks between `return` and the action.
            result.push(`            return ${actionText.trimStart()};`);
            result.push(`        }`);
            result.push("");
        }
        result.push(`        default:`);
        result.push(`    }`);
        result.push("");
        result.push(`    return true;`);
        result.push(`}`);
        result.push("");

        return this.endRendering("ruleSempredFunction", result);
    }

    private renderRuleFunction(parserFile: OutputModelObjects.ParserFile, currentRule: OutputModelObjects.RuleFunction): Lines {
        const parser = parserFile.parser;
        const result = this.startRendering("ruleFunction");

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") : undefined;

        const args = currentRule.args?.map((a) => {
            return `${a.escapedName}: ${a.type}`;
        });

        const ctorArgs = currentRule.args?.map((a) => {
            return a.escapedName;
        });

        result.push(`${modifiers ?? "public"} ${currentRule.escapedName}(${args ? args.join(", ") : ""}): ${currentRule.ctxType} {`);

        const block: Lines = [];
        block.push(`let localContext = new ${currentRule.ctxType}(this.context, this.state${ctorArgs ? ", " + ctorArgs.join(", ") : ""});`);
        block.push(`this.enterRule(localContext, ${currentRule.startState}, ${parser.name}.RULE_${currentRule.name});`);
        block.push(...this.renderAction(currentRule.namedActions?.get("init")));

        for (const decl of currentRule.locals) {
            block.push(...this.renderTokenTypeDecl(decl));
        }

        block.push("");
        block.push(`try {`);
        if (currentRule.hasLookaheadBlock) {
            block.push(`    let alternative: number;`);
        }

        block.push(...this.formatLines(this.renderSourceOps(parserFile, parser.name, currentRule.code), 4));
        block.push(...this.formatLines(this.renderSourceOps(parserFile, parser.name, currentRule.postamble), 4));
        block.push(...this.formatLines(this.renderAction(parserFile.namedActions.get("after")), 4));

        if (currentRule.exceptions && currentRule.exceptions.length > 0) {
            currentRule.exceptions.forEach((e) => {
                block.push(...this.renderExceptionClause(e));
            });
        } else {
            block.push(`} catch (re) {`);
            block.push(`    if (re instanceof antlr.RecognitionException) {`);
            block.push(`        this.errorHandler.reportError(this, re);`);
            block.push(`        this.errorHandler.recover(this, re);`);
            block.push(`    } else {`);
            block.push(`        throw re;`);
            block.push(`    }`);
            block.push(`}`);
        }

        block[block.length - 1] += ` finally {`;
        if (currentRule.finallyAction) {
            block.push(`    ${this.renderAction(currentRule.finallyAction)}`);
        }
        block.push(`    this.exitRule();`);
        block.push(`}`);
        block.push("");
        block.push(`return localContext;`);

        result.push(...this.formatLines(block, 4));
        result.push(`}`);
        result.push("");

        return this.endRendering("ruleFunction", result);
    }

    private renderSourceOps(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOps?: Array<OutputModelObjects.SrcOp | null>): Lines {
        const result: Lines = this.startRendering("SourceOps");

        srcOps?.forEach((srcOp) => {
            if (srcOp) {
                const method = this.srcOpMap.get(srcOp.constructor as OutputModelObjectConstructor);
                if (method) {
                    result.push(...method(outputFile, recognizerName, srcOp));
                } else {
                    throw new Error(`Unhandled source op type: ${srcOp.constructor.name}`);
                }
            }
        });

        return this.endRendering("SourceOps", result);
    }

    private renderLeftRecursiveRuleFunction(parserFile: OutputModelObjects.ParserFile,
        currentRule: OutputModelObjects.LeftRecursiveRuleFunction): Lines {
        const result: Lines = this.startRendering("leftRecursiveRuleFunction");

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") : "public";
        const args = currentRule.args?.map((a) => {
            return a.escapedName;
        });
        const argList = args?.join(", ") ?? "";

        result.push(`${modifiers} ${currentRule.escapedName}(${argList}): ${currentRule.ctxType};`);
        result.push(`${modifiers} ${currentRule.escapedName}(${argList}${args ? ", " : ""}_p: number): ${currentRule.ctxType};`);
        result.push(`${modifiers} ${currentRule.escapedName}(${argList}${args ? ", " : ""}_p?: number): ${currentRule.ctxType} {`);

        const block: Lines = [];
        block.push(`if (_p === undefined) {`);
        block.push(`    _p = 0;`);
        block.push(`}`);

        block.push(``);
        block.push(`let parentContext = this.context;`);
        block.push(`let parentState = this.state;`);
        block.push(`let localContext = new ${currentRule.ctxType}(this.context, parentState${argList});`);
        block.push(`let previousContext = localContext;`);
        block.push(`let _startState = ${currentRule.startState};`);
        block.push(`this.enterRecursionRule(localContext, ${currentRule.startState}, ${parserFile.parser.name}.` +
            `RULE_${currentRule.name}, _p);`);

        block.push(...this.renderAction(currentRule.namedActions?.get("init")));

        for (const decl of currentRule.locals) {
            block.push(...this.renderTokenTypeDecl(decl));
        }

        block.push(`try {`);

        if (currentRule.hasLookaheadBlock) {
            block.push(`    let alternative: number;`);
        }

        block.push(...this.formatLines(this.renderSourceOps(parserFile, parserFile.parser.name,
            currentRule.code), 4));

        block.push(...this.formatLines(this.renderSourceOps(parserFile, parserFile.parser.name,
            currentRule.postamble), 4));
        block.push(...this.formatLines(this.renderAction(parserFile.namedActions.get("after")), 4));

        block.push(`} catch (re) {`);
        block.push(`    if (re instanceof antlr.RecognitionException) {`);
        block.push(`        this.errorHandler.reportError(this, re);`);
        block.push(`        this.errorHandler.recover(this, re);`);
        block.push(`    } else {`);
        block.push(`        throw re;`);
        block.push(`    }`);
        block.push(`} finally {`);

        if (currentRule.finallyAction) {
            block.push(`    ${this.renderAction(currentRule.finallyAction)}`);
        }

        block.push(`    this.unrollRecursionContexts(parentContext);`);
        block.push(`}`);
        block.push("");
        block.push(`return localContext;`);

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        return this.endRendering("leftRecursiveRuleFunction", result);
    }

    private renderCodeBlockForOuterMostAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt): Lines {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(`localContext = new ${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context(localContext);`);
        }

        result.push(`this.enterOuterAlt(localContext, ${currentOuterMostAltCodeBlock.alt.altNum});`);
        result.push(...this.renderCodeBlockForAlt(outputFile, recognizerName, currentOuterMostAltCodeBlock));

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    }

    private renderCodeBlockForAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        currentAltCodeBlock: OutputModelObjects.CodeBlockForAlt): Lines {
        const result: Lines = this.startRendering("CodeBlockForAlt");

        if (currentAltCodeBlock.locals.size === 0 && currentAltCodeBlock.preamble.length === 0
            && currentAltCodeBlock.ops.length === 0) {
            result.push("// tslint:disable-next-line:no-empty");
        }

        result.push(...this.renderDecls(outputFile, recognizerName, currentAltCodeBlock.locals));
        result.push(...this.renderSourceOps(outputFile, recognizerName, currentAltCodeBlock.preamble));
        result.push(...this.renderSourceOps(outputFile, recognizerName, currentAltCodeBlock.ops));

        return this.endRendering("CodeBlockForAlt", result);
    }

    private renderDecls(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        decls: Iterable<OutputModelObjects.Decl>): Lines {
        const result: Lines = this.startRendering("Decls");

        for (const decl of decls) {
            const method = this.srcOpMap.get(decl.constructor as OutputModelObjectConstructor);
            if (method) {
                result.push(...method(outputFile, recognizerName, decl));
            } else {
                throw new Error(`Unhandled source op type: ${decl.constructor.name}`);
            }
        }

        return this.endRendering("Decls", result);
    }

    private renderLL1AltBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.LL1AltBlock): Lines {
        const result: Lines = this.startRendering("LL1AltBlock");

        result.push(`this.state = ${choice.stateNumber};`);
        result.push(`this.errorHandler.sync(this);`);

        if (choice.label) {
            result.push(`${this.renderLabelRef(choice.label)} = this.tokenStream.LT(1);`);
        }

        result.push(...this.renderSourceOps(outputFile, recognizerName, choice.preamble));

        result.push(`switch (this.tokenStream.LA(1)) {`);

        const block: Lines = [];
        for (let i = 0; i < choice.alts.length; ++i) {
            const tokens = choice.altLook[i];
            block.push(...this.renderCases(recognizerName, tokens));
            block[block.length - 1] += " {";

            const alt = choice.alts[i] as OutputModelObjects.CodeBlockForAlt | undefined;
            if (alt) {
                if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                    block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                        4));
                } else {
                    block.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
                }
            }

            block.push(`    break;`);
            block.push(`}`);
        }

        result.push(...this.formatLines(block, 4));
        result.push(`    default:`);
        result.push(...this.formatLines(this.renderThrowNoViableAlt(choice.error), 8));

        result.push(`}`);
        result.push("");

        return this.endRendering("LL1AltBlock", result);
    }

    private renderLL1OptionalBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.LL1OptionalBlock): Lines {
        const result: Lines = this.startRendering("LL1OptionalBlock");

        result.push(`this.state = ${choice.stateNumber};`);
        result.push(`this.errorHandler.sync(this);`);
        result.push(`switch (this.tokenStream.LA(1)) {`);

        const block: Lines = [];
        for (let i = 0; i < choice.altLook.length; ++i) {
            const tokens = choice.altLook[i];
            block.push(...this.formatLines(this.renderCases(recognizerName, tokens), 4));
            block[block.length - 1] += " {";

            const alt = choice.alts[i] as OutputModelObjects.CodeBlockForAlt | undefined;
            if (alt) {
                if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                    block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                        4));
                } else {
                    block.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
                }
            }

            block.push(`    break;`);
            block.push(`}`);
        }

        result.push(...this.formatLines(block, 4));
        result.push(`    default:`);
        result.push(`        break;`);
        result.push(`}`);

        return this.endRendering("LL1OptionalBlock", result);
    }

    private renderLL1OptionalBlockSingleAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.LL1OptionalBlockSingleAlt): Lines {
        const result: Lines = this.startRendering("LL1OptionalBlockSingleAlt");

        result.push(`this.state = ${choice.stateNumber};`);
        result.push(`this.errorHandler.sync(this);`);
        result.push(...this.renderSourceOps(outputFile, recognizerName, choice.preamble));

        result.push(`if (${this.renderSourceOps(outputFile, recognizerName, [choice.expr]).join("")}) {`);
        choice.alts.forEach((alt, index) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                    4));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
            }
        });
        result.push(`}`);
        result.push("");

        return this.endRendering("LL1OptionalBlockSingleAlt", result);
    }

    private renderLL1StarBlockSingleAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.LL1StarBlockSingleAlt): Lines {
        const result: Lines = this.startRendering("LL1StarBlockSingleAlt");

        result.push(`this.state = ${choice.stateNumber};`);
        result.push(`this.errorHandler.sync(this);`);

        result.push(...this.renderSourceOps(outputFile, recognizerName, choice.preamble));

        const srcOps = choice.loopExpr ? [choice.loopExpr] : undefined;
        result.push(`while (${this.renderSourceOps(outputFile, recognizerName, srcOps).join("")}) {`);

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                    4));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
            }
        });

        result.push(`    this.state = ${choice.loopBackStateNumber};`);
        result.push(`    this.errorHandler.sync(this);`);
        result.push(...this.formatLines(this.renderSourceOps(outputFile, recognizerName, choice.iteration), 4));
        result.push(`}`);

        return this.endRendering("LL1StarBlockSingleAlt", result);
    }

    private renderLL1PlusBlockSingleAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.LL1PlusBlockSingleAlt): Lines {
        const result: Lines = this.startRendering("LL1PlusBlockSingleAlt");

        result.push(`this.state = ${choice.blockStartStateNumber};`);
        result.push(`this.errorHandler.sync(this);`);

        result.push(...this.renderSourceOps(outputFile, recognizerName, choice.preamble));

        result.push(`do {`);

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                result.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                    4));
            } else {
                result.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
            }
        });

        result.push(`    this.state = ${choice.stateNumber};`); // Loop back/exit decision.
        result.push(`    this.errorHandler.sync(this);`);
        result.push(...this.formatLines(this.renderSourceOps(outputFile, recognizerName, choice.iteration), 4));

        const srcOps = choice.loopExpr ? [choice.loopExpr] : undefined;
        result.push(`} while (${this.renderSourceOps(outputFile, recognizerName, srcOps).join("")});`);

        return this.endRendering("LL1PlusBlockSingleAlt", result);
    }

    /**
     * Renders the decision block for multiple alternatives. It starts by rendering some management code
     * and then renders the switch statement with the alternatives (as case branches).
     *
     * @param outputFile The current output file (lexer, parser etc.).
     * @param recognizerName The name of the recognizer (parser or lexer).
     * @param choice The choice to render.
     *
     * @returns The rendered lines of code.
     */
    private renderAltBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.AltBlock): Lines {
        const result: Lines = this.startRendering("AltBlock");

        result.push(`this.state = ${choice.stateNumber};`);
        result.push(`this.errorHandler.sync(this);`);

        if (choice.label) {
            result.push(`${this.renderLabelRef(choice.label)} = this.tokenStream.LT(1);`);
        }

        result.push(...this.renderSourceOps(outputFile, recognizerName, choice.preamble));
        result.push(`switch (this.interpreter.adaptivePredict(this.tokenStream, ${choice.decision}, this.context) ) {`);

        const block: Lines = [];
        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            block.push(`case ${index + 1}: {`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                    4));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
            }
            block.push(`    break;`);
            block.push(`}`);
        });

        result.push(...this.formatLines(block, 4));
        result.push(`}`);
        result.push("");

        return this.endRendering("AltBlock", result);
    }

    private renderOptionalBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.OptionalBlock): Lines {
        const result: Lines = this.startRendering("OptionalBlock");

        result.push(`this.state = ${choice.stateNumber};`);
        result.push(`this.errorHandler.sync(this);`);
        result.push(`switch (this.interpreter.adaptivePredict(this.tokenStream, ${choice.decision}, this.context) ) {`);

        const block: Lines = [];
        const blockAST = choice.ast as OptionalBlockAST;
        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            block.push(`case ${index + 1}${!blockAST.greedy ? " + 1" : ""}: {`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                    4));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
            }
            block.push(`    break;`);
            block.push(`}`);
        });

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        return this.endRendering("OptionalBlock", result);
    }

    private renderStarBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.StarBlock): Lines {
        const result: Lines = this.startRendering("StarBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(`this.state = ${choice.stateNumber};`);
        result.push(`this.errorHandler.sync(this);`);
        result.push(`alternative = this.interpreter.adaptivePredict(this.tokenStream, ${choice.decision}, this.context);`);
        result.push(`while (alternative !== ${choice.exitAlt} && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {`);

        const block: Lines = [];
        block.push(`if (alternative === 1${!blockAST.greedy ? " + 1" : ""}) {`);
        block.push(...this.formatLines(this.renderSourceOps(outputFile, recognizerName, choice.iteration), 4));

        choice.alts.forEach((alt) => {
            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                block.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                    4));
            } else {
                block.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
            }
        });

        block.push(`}`);
        block.push(`this.state = ${choice.loopBackStateNumber};`);
        block.push(`this.errorHandler.sync(this);`);
        block.push(`alternative = this.interpreter.adaptivePredict(this.tokenStream, ${choice.decision}, this.context);`);

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        return this.endRendering("StarBlock", result);
    }

    private renderPlusBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        choice: OutputModelObjects.PlusBlock): Lines {
        const result: Lines = this.startRendering("PlusBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(`this.state = ${choice.blockStartStateNumber};`); //  Alt block decision.
        result.push(`this.errorHandler.sync(this);`);
        result.push(`alternative = 1${!blockAST.greedy ? " + 1" : ""};`);
        result.push(`do {`);

        const switchBlock: Lines = [];
        switchBlock.push(`switch (alternative) {`);
        const caseBlock: Lines = [];

        for (let i = 0; i < choice.alts.length; ++i) {
            const alt = choice.alts[i];

            // Alt numbers are 1-based, so we add 1 to the index.
            caseBlock.push(`case ${i + 1}${!blockAST.greedy ? " + 1" : ""}: {`);

            if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
                caseBlock.push(...this.formatLines(this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, alt),
                    4));
            } else {
                caseBlock.push(...this.formatLines(this.renderCodeBlockForAlt(outputFile, recognizerName, alt), 4));
            }
            caseBlock.push(`    break;`);
            caseBlock.push(`}`);
        }

        caseBlock.push("");
        caseBlock.push(`default: {`);
        caseBlock.push(...this.formatLines(this.renderThrowNoViableAlt(choice.error), 4));
        caseBlock.push(`}`);

        switchBlock.push(...this.formatLines(caseBlock, 4));
        switchBlock.push(`}`);
        switchBlock.push("");

        switchBlock.push(`this.state = ${choice.loopBackStateNumber};`); // Loopback/exit decision.
        switchBlock.push(`this.errorHandler.sync(this);`);
        switchBlock.push(`alternative = this.interpreter.adaptivePredict(this.tokenStream, ${choice.decision}, this.context);`);

        result.push(...this.formatLines(switchBlock, 4));
        result.push(`} while (alternative !== ${choice.exitAlt} && alternative !== antlr.ATN.INVALID_ALT_NUMBER);`);

        return this.endRendering("PlusBlock", result);
    }

    private renderThrowNoViableAlt(t: OutputModelObjects.ThrowNoViableAlt): Lines {
        return ["throw new antlr.NoViableAltException(this);"];
    }

    private renderTestSetInline(s: OutputModelObjects.TestSetInline): Lines {
        const result: Lines = [];

        s.bitsets.forEach((bits, index) => {
            const or = index > 0 ? " || " : "";

            const rest = bits.tokens.length > 2 ? bits.tokens.slice(2) : [];
            if (rest.length > 0) {
                result.push(or + this.renderBitsetBitfieldComparison(s, bits));
            } else {
                result.push(or + this.renderBitsetInlineComparison(s, bits));
            }
        });

        return result;
    }

    /** Produces smaller bytecode only when `bits.ttypes` contains more than two items. */
    private renderBitsetBitfieldComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return `(${this.renderTestShiftInRange(this.renderOffsetShiftVar(s.varName, bits.shift))}` +
            `&& ((1 << ${this.renderOffsetShiftVar(s.varName, bits.shift)}) & ${bits.calculated}) !== 0)`;
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline, bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `${s.varName} === ${t.type}`;
        }).join(" || ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        return offset > 0 ? `(${shiftAmount} - ${offset})` : shiftAmount;
    }

    /** Javascript language spec - shift operators are 32 bits long max. */
    private renderTestShiftInRange(shiftAmount: string): string {
        return `((${shiftAmount}) & ~0x1F) === 0`;
    }

    private renderCases(recognizerName: string, tokens: OutputModelObjects.ITokenInfo[]): Lines {
        const result: Lines = this.startRendering("Cases");

        for (const t of tokens) {
            result.push(`case ${recognizerName}.${t.name}:`);
        }

        return this.endRendering("Cases", result);
    }

    private renderInvokeRule(r: OutputModelObjects.InvokeRule): Lines {
        const result: Lines = this.startRendering("InvokeRule");

        result.push(`this.state = ${r.stateNumber};`);

        let labels = "";
        if (r.labels.length > 0) {
            for (const l of r.labels) {
                labels += `${this.renderLabelRef(l)} = `;
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

        result.push(`${labels}this.${r.escapedName}(${args});`);

        return this.endRendering("InvokeRule", result);
    }

    private renderMatchToken(parserName: string, m: OutputModelObjects.MatchToken): Lines {
        const result: Lines = this.startRendering("MatchToken");

        result.push(`this.state = ${m.stateNumber};`);

        let line = "";
        if (m.labels.length > 0) {
            for (const l of m.labels) {
                line += `${this.renderLabelRef(l)} = `;
            }
        }
        result.push(`${line}this.match(${parserName}.${m.name});`);

        return this.endRendering("MatchToken", result);
    }

    private renderMatchSet(m: OutputModelObjects.MatchSet): Lines {
        return this.renderCommonSetStuff(m, false);
    }

    private renderMatchNotSet(m: OutputModelObjects.MatchNotSet): Lines {
        return this.renderCommonSetStuff(m, true);
    }

    private renderCommonSetStuff(m: OutputModelObjects.MatchSet, invert: boolean): Lines {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`this.state = ${m.stateNumber};`);

        if (m.labels.length > 0) {
            let labels = "";
            for (const l of m.labels) {
                labels += `${this.renderLabelRef(l)} = `;
            }
            result.push(`${labels}this.tokenStream.LT(1);`);
        }

        if (m.capture instanceof OutputModelObjects.CaptureNextTokenType) {
            result.push(this.renderCaptureNextTokenType(m.capture)[0]);
        } else {
            result.push(this.renderCaptureNextToken(m.capture)[0]);
        }

        if (invert) {
            result.push(`if (${m.expr.varName} <= 0 || ${this.renderTestSetInline(m.expr).join("")}) {`);
        } else {
            result.push(`if (!(${this.renderTestSetInline(m.expr).join("")})) {`);
        }

        let labels = "";
        if (m.labels.length > 0) {
            for (const l of m.labels) {
                labels += `${this.renderLabelRef(l)} = `;
            }
        }
        result.push(`    ${labels}this.errorHandler.recoverInline(this);`);

        result.push(`} else {`);
        result.push(`    this.errorHandler.reportMatch(this);`);
        result.push(`    this.consume();`);
        result.push(`}`);

        return this.endRendering("CommonSetStuff", result);
    }

    private renderWildcard(w: OutputModelObjects.Wildcard): Lines {
        const result: Lines = this.startRendering("Wildcard");

        result.push(`this.state = ${w.stateNumber};`);

        let lables = "";
        if (w.labels.length > 0) {
            for (const l of w.labels) {
                lables += `${this.renderLabelRef(l)} = `;
            }
        }
        result.push(`${lables}this.matchWildcard();`);

        return this.endRendering("Wildcard", result);
    }

    private renderAction(a?: OutputModelObjects.Action): Lines {
        if (!a) {
            return [];
        }

        return [this.renderActionChunks(a.chunks)];
    }

    private renderSemPred(p: OutputModelObjects.SemPred): Lines {
        const result: Lines = this.startRendering("SemPred");

        result.push(`this.state = ${p.stateNumber};`);

        const chunks = this.renderActionChunks(p.chunks);
        result.push(`if (!(${chunks})) {`);

        const failChunks = this.renderActionChunks(p.failChunks);
        result.push(`    throw this.createFailedPredicateException` +
            `(${p.predicate}, ${failChunks.length > 0 ? failChunks : (p.msg ? p.msg : "")});`);
        result.push(`}`);

        return this.endRendering("SemPred", result);
    }

    private renderExceptionClause(e: OutputModelObjects.ExceptionClause): Lines {
        const result: Lines = this.startRendering("ExceptionClause");

        result.push(`} catch (<catchArg>) {`);
        result.push(`    ${this.renderAction(e.catchAction)}`);
        result.push(`}`);

        return this.endRendering("ExceptionClause", result);
    }

    private renderActionText(t: OutputModelObjects.ActionText): Lines {
        return t.text ?? [];
    }

    private renderArgRef(a: OutputModelObjects.ArgRef): Lines {
        return [`localContext?.${a.escapedName}!`];
    }

    private renderLabelRef(t: OutputModelObjects.LabelRef): string {
        const ctx = this.renderContext(t);

        return `${ctx}._${t.escapedName}`;
    }

    private renderListLabelRef(t: OutputModelObjects.ListLabelRef): Lines {
        const ctx = this.renderContext(t);
        const name = this.renderListLabelName(t.escapedName);

        return [`${ctx}?._${name}`];
    }

    private renderLocalRef(a: OutputModelObjects.LocalRef): Lines {
        return [`localContext.${a.escapedName}`];
    }

    private renderNonLocalAttrRef(s: OutputModelObjects.NonLocalAttrRef): Lines {
        return [`(this.getInvokingContext(${s.ruleIndex}) as ` +
            `${this.toTitleCase(s.ruleName)}Context).${s.escapedName}`];
    }

    private renderQRetValueRef(a: OutputModelObjects.QRetValueRef): Lines {
        const ctx = this.renderContext(a);

        return [`${ctx}._${a.dict}!.${a.escapedName}`];
    }

    private renderRetValueRef(a: OutputModelObjects.RetValueRef): Lines {
        return [`localContext.${a.escapedName}`];
    }

    private renderRulePropertyRef(r: OutputModelObjects.RulePropertyRef): Lines {
        const ctx = this.renderContext(r);

        return [`(${ctx}._${r.label}!.start)`];
    }

    private renderRulePropertyRefCtx(r: OutputModelObjects.RulePropertyRefCtx): Lines {
        const ctx = this.renderContext(r);

        return [`(${ctx}._${r.label}`];
    }

    private renderRulePropertyRefParser(r: OutputModelObjects.RulePropertyRefParser): Lines {
        return ["this"];
    }

    private renderRulePropertyRefStart(r: OutputModelObjects.RulePropertyRefStart): Lines {
        const ctx = this.renderContext(r);

        return [`(${ctx}._${r.label}!.start)`];
    }

    private renderRulePropertyRefStop(r: OutputModelObjects.RulePropertyRefStop): Lines {
        const ctx = this.renderContext(r);

        return [`(${ctx}._${r.label}!.stop)`];
    }

    private renderRulePropertyRefText(r: OutputModelObjects.RulePropertyRefText): Lines {
        const ctx = this.renderContext(r);

        return [`(${ctx}._${r.label} != null ? this.tokenStream.getTextFromRange(${ctx}._${r.label}.start, ` +
            `${ctx}._${r.label}.stop) : '')`];
    }

    private renderSetAttr(s: OutputModelObjects.SetAttr): Lines {
        const ctx = this.renderContext(s);
        const rhsChunks = s.rhsChunks.map((c) => {
            return this.renderActionChunks([c]);
        }).join("");

        return [`(${ctx}!._${s.escapedName} = ${rhsChunks})`];
    }

    private renderSetNonLocalAttr(s: OutputModelObjects.SetNonLocalAttr): Lines {
        const rhsChunks = s.rhsChunks.map((c) => {
            return this.renderActionChunks([c]);
        }).join("");

        return [`(this.getInvokingContext(${s.ruleIndex}) as ${this.toTitleCase(s.ruleName)}Context).` +
            `${s.escapedName} = ${rhsChunks};`];
    }

    private renderThisRulePropertyRefCtx(r: OutputModelObjects.ThisRulePropertyRefCtx): Lines {
        return ["localContext"];
    }

    private renderThisRulePropertyRefParser(r: OutputModelObjects.ThisRulePropertyRefParser): Lines {
        return ["this"];
    }

    private renderThisRulePropertyRefStart(r: OutputModelObjects.ThisRulePropertyRefStart): Lines {
        return ["loclalContext.start"];
    }

    private renderThisRulePropertyRefStop(r: OutputModelObjects.ThisRulePropertyRefStop): Lines {
        return ["localContext.stop"];
    }

    private renderThisRulePropertyRefText(r: OutputModelObjects.ThisRulePropertyRefText): Lines {
        return ["this.tokenStream.getTextFromRange(localContext.start, this.tokenStream.LT(-1))"];
    }

    private renderTokenLabelType(file: OutputModelObjects.OutputFile): Lines { return [file.TokenLabelType ?? "Token"]; }

    private renderTokenPropertyRefChannel(t: OutputModelObjects.TokenPropertyRefPos): Lines {
        const ctx = this.renderContext(t);

        return [`${ctx}._${t.label}?.channel ?? 0`];
    }

    private renderTokenPropertyRefIndex(t: OutputModelObjects.TokenPropertyRefIndex): Lines {
        const ctx = this.renderContext(t);

        return [`(${ctx}._${t.label}?.tokenIndex ?? 0)`];
    }

    private renderTokenPropertyRefInt(t: OutputModelObjects.TokenPropertyRefInt): Lines {
        const ctx = this.renderContext(t);

        return [`Number(${ctx}._${t.label}?.text ?? '0')`];
    }

    private renderTokenPropertyRefLine(t: OutputModelObjects.TokenPropertyRefLine): Lines {
        const ctx = this.renderContext(t);

        return [`(${ctx}._${t.label}?.line ?? 0)`];
    }

    private renderTokenPropertyRefPos(t: OutputModelObjects.TokenPropertyRefPos): Lines {
        const ctx = this.renderContext(t);

        return [`(${ctx}._${t.label}?.column ?? 0)`];

    }

    private renderTokenPropertyRefText(t: OutputModelObjects.TokenPropertyRefText): Lines {
        const ctx = this.renderContext(t);

        return [`(${ctx}._${t.label}?.text ?? '')`];
    }

    private renderTokenPropertyRefType(t: OutputModelObjects.TokenPropertyRefType): Lines {
        const ctx = this.renderContext(t);

        return [`(${ctx}._${t.label}?.type ?? 0)`];
    }

    /** How to translate $tokenLabel */
    private renderTokenRef(t: OutputModelObjects.TokenRef): Lines {
        const ctx = this.renderContext(t);

        return [`${ctx}?._${t.escapedName}!`];
    }

    private renderInputSymbolType(file: OutputModelObjects.LexerFile): Lines {
        return [file.inputSymbolType ?? "Token"];
    }

    private renderAddToLabelList = (a: OutputModelObjects.AddToLabelList): Lines => {
        const ctx = this.renderContext(a.label);

        return [`(${ctx}._${a.listName}.push(${this.renderLabelRef(a.label)}!));`];
    };

    private renderTokenDecl(file: OutputModelObjects.OutputFile, recognizerName: string, t: OutputModelObjects.TokenDecl): Lines {
        return [`_${t.escapedName}: ${this.renderTokenLabelType(file)} | null = null;`];
    }

    private renderTokenTypeDecl(t: OutputModelObjects.TokenTypeDecl): Lines {
        return [`let ${t.escapedName}: number;`];
    }

    private renderTokenListDecl(t: OutputModelObjects.TokenListDecl): Lines {
        return [`_${t.escapedName}: antlr.Token[] = [];`];
    }

    private renderRuleContextDecl(r: OutputModelObjects.RuleContextDecl): Lines {
        return [`_${r.escapedName}?: ${r.ctxName};`];
    }

    private renderRuleContextListDecl(rdecl: OutputModelObjects.RuleContextListDecl): Lines {
        return [`_${rdecl.escapedName}: ${rdecl.ctxName} [] = [];`];
    }

    private renderContextTokenGetterDecl(recognizerName: string, t: OutputModelObjects.ContextTokenGetterDecl): Lines {
        return [
            "",
            `public ${t.escapedName}(): antlr.TerminalNode${t.optional ? " | null" : ""} {`,
            `    return this.getToken(${recognizerName}.${t.name}, 0)${t.optional ? "" : "!"};`,
            `}`,
        ];
    }

    private renderContextTokenListGetterDecl(t: OutputModelObjects.ContextTokenListGetterDecl): Lines {
        return [`public ${t.name} (): antlr.TerminalNode[];`];
    }

    private renderContextTokenListIndexedGetterDecl(recognizerName: string,
        t: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines {
        const result: Lines = this.startRendering("ContextTokenListIndexedGetterDecl");

        result.push(`public ${t.name} (i: number): antlr.TerminalNode | null;`);
        result.push(`public ${t.name} (i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {`);
        result.push(`    if (i === undefined) {`);
        result.push(`        return this.getTokens(${recognizerName}.${t.name});`);
        result.push(`    } else {`);
        result.push(`        return this.getToken(${recognizerName}.${t.name}, i);`);
        result.push(`    }`);
        result.push(`}`);

        return this.endRendering("ContextTokenListIndexedGetterDecl", result);
    }

    private renderContextRuleGetterDecl(r: OutputModelObjects.ContextRuleGetterDecl): Lines {
        return [
            "",
            `public ${r.name} (): ${r.ctxName}${r.optional ? "| null" : ""} {`,
            `    return this.getRuleContext(0, ${r.ctxName})${!r.optional ? "!" : ""};`,
            `}`
        ];
    }

    private renderContextRuleListGetterDecl(r: OutputModelObjects.ContextRuleListGetterDecl): Lines {
        return [`public ${r.escapedName} (): ${r.ctxName}[];`];
    }

    private renderContextRuleListIndexedGetterDecl(r: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines {
        const result: Lines = this.startRendering("ContextRuleListIndexedGetterDecl");

        result.push(`public ${r.escapedName}(i: number): ${r.ctxName} | null;`);
        result.push(`public ${r.escapedName}(i?: number): ${r.ctxName}[] | ${r.ctxName} | null {`);
        result.push(`    if (i === undefined) {`);
        result.push(`        return this.getRuleContexts(${r.ctxName});`);
        result.push(`    }`);
        result.push(``);
        result.push(`    return this.getRuleContext(i, ${r.ctxName});`);
        result.push(`}`);

        return this.endRendering("ContextRuleListIndexedGetterDecl", result);
    }

    private renderCaptureNextToken(d: OutputModelObjects.CaptureNextToken): Lines {
        return [`${d.varName} = this.tokenStream.LT(1);`];
    }

    private renderCaptureNextTokenType(d: OutputModelObjects.CaptureNextTokenType): Lines {
        return [`${d.varName} = this.tokenStream.LA(1);`];
    }

    private renderStructDecl(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        struct: OutputModelObjects.StructDecl): Lines {
        const result: Lines = this.startRendering("StructDecl");

        const contextSuperClass = (outputFile as OutputModelObjects.ParserFile).contextSuperClass;
        let superClass = "antlr.ParserRuleContext";
        if (contextSuperClass) {
            superClass = this.renderActionChunks([contextSuperClass]);
        }

        let interfaces = "";
        if (struct.interfaces.length > 0) {
            interfaces = " implements " + struct.interfaces.map((i) => {
                return `, ${i}`; // TODO: it's not clear if that is even used, let alone what it should be.
            }).join(", ");
        }

        result.push(`export class ${struct.escapedName} extends ${superClass}${interfaces} {`);

        const decls = this.renderDecls(outputFile, struct.name, struct.attrs);
        let startLogEntry: string | undefined = undefined;
        let endLogEntry: string | undefined = undefined;

        if (logRendering && decls.length > 0) {
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

        result.push("");

        const block: Lines = [];
        if (struct.ctorAttrs.length > 0) {
            block.push(`public constructor(parent: antlr.ParserRuleContext | null, invokingState: number<struct.ctorAttrs:{a |, <a.escapedName>: <a.type>}>) {`);
            block.push(`    super(parent, invokingState);`);

            struct.ctorAttrs.forEach((a) => {
                block.push(`    this.${a.escapedName} = ${a.escapedName};`);
            });

            block.push(`}`);
        } else {
            block.push(`public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {`);
            block.push(`    super(parent, invokingState);`);
            block.push(`}`);
        }

        block.push(...this.renderDecls(outputFile, recognizerName, struct.getters));

        const parser = (outputFile as OutputModelObjects.ParserFile).parser;
        block.push(`public override get ruleIndex(): number {`);
        block.push(`    return ${parser.name}.RULE_${struct.derivedFromName};`);
        block.push(`}`);

        // Don't need copy unless we have subclasses.
        if (struct.provideCopyFrom) {
            block.push("");
            block.push(`public override copyFrom(ctx: ${struct.name}): void {`);
            block.push(`    super.copyFrom(ctx);`);

            for (const a of struct.attrs) {
                block.push(`    this.${a.escapedName} = ctx.${a.escapedName};`);
            }
            block.push(`}`);
        }

        for (const method of struct.dispatchMethods) {
            if (method instanceof OutputModelObjects.VisitorDispatchMethod) {
                block.push(...this.renderVisitorDispatchMethod(parser.grammarName, struct));
            } else if (method instanceof OutputModelObjects.ListenerDispatchMethod) {
                block.push(...this.renderListenerDispatchMethod(parser.grammarName, struct, method));
            }
        }
        // block.push(`<extensionMembers; separator="\n">`); Don't see where this is actually used.

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        return this.endRendering("StructDecl", result);
    }

    private renderAltLabelStructDecl(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        currentRule: OutputModelObjects.RuleFunction, struct: OutputModelObjects.AltLabelStructDecl): Lines {
        const result: Lines = this.startRendering("AltLabelStructDecl");

        result.push(`export class ${struct.escapedName} extends ${this.toTitleCase(struct.parentRule)}Context {`);

        const block: Lines = [];

        for (const attr of struct.attrs) {
            const method = this.srcOpMap.get(attr.constructor as OutputModelObjectConstructor);
            let lines: Lines;
            if (method) {
                lines = method(outputFile, recognizerName, attr);
            } else {
                throw new Error(`Unhandled source op type: ${attr.constructor.name}`);
            }

            lines.forEach((line) => {
                block.push(`public ${line}`);
            });
        }

        block.push(`public constructor(ctx: ${this.toTitleCase(currentRule.name)}Context) {`);

        const attrs = currentRule.ruleCtx.ctorAttrs.map((a) => {
            return `ctx.${a.escapedName}`;
        }).join(", ");
        block.push(`    super(ctx.parent, ctx.invokingState${attrs});`);
        block.push(`    super.copyFrom(ctx);`);
        block.push(`}`);

        block.push(...this.renderDecls(outputFile, recognizerName, struct.getters));

        const parser = (outputFile as OutputModelObjects.ParserFile).parser;
        for (const method of struct.dispatchMethods) {
            if (method instanceof OutputModelObjects.VisitorDispatchMethod) {
                block.push(...this.renderVisitorDispatchMethod(parser.grammarName, struct));
            } else if (method instanceof OutputModelObjects.ListenerDispatchMethod) {
                block.push(...this.renderListenerDispatchMethod(parser.grammarName, struct, method));
            }
        }

        result.push(...this.formatLines(block, 4));
        result.push(`}`);

        return this.endRendering("AltLabelStructDecl", result);
    }

    private renderListenerDispatchMethod(grammarName: string, struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod): Lines {
        const derivedFromName = this.toTitleCase(struct.derivedFromName);
        const enterExit = method.isEnter ? "enter" : "exit";

        return [
            "",
            `public override ${enterExit}Rule(listener: ${grammarName}Listener): void {`,
            `    listener.${enterExit}${derivedFromName}?.(this);`,
            `}`,
        ];
    }

    private renderVisitorDispatchMethod(grammarName: string, struct: OutputModelObjects.StructDecl): Lines {
        const derivedFromName = this.toTitleCase(struct.derivedFromName);

        return [
            "",
            `public override accept<Result>(visitor: ${grammarName}Visitor<Result>): Result | null {`,
            `    if (visitor.visit${derivedFromName}) {`,
            `        return visitor.visit${derivedFromName}(this);`,
            `    } else {`,
            `        return visitor.visitChildren(this);`,
            `    }`,
            `}`
        ];
    }

    private renderAttributeDecl(d: OutputModelObjects.AttributeDecl): Lines {
        const result: Lines = [];

        if (d.initValue !== undefined) {
            result.push(`${d.escapedName} = ${d.initValue}`);
        } else {
            result.push(`${d.escapedName}: ${d.type}`);
        }

        return result;
    }

    private renderSerializedATN(model: OutputModelObjects.SerializedATN, className: string): Lines {
        const result: Lines = [
            "public static readonly _serializedATN: number[] = [",
            ...this.renderList(model.serialized, { wrap: 63, indent: 4, separator: "," }),
            "];",
            "",
            "private static __ATN: antlr.ATN;",
            "public static get _ATN(): antlr.ATN {",
            `    if (!${className}.__ATN) {`,
            `        ${className}.__ATN = new antlr.ATNDeserializer().deserialize(${className}._serializedATN);`,
            "    }",
            "",
            `    return ${className}.__ATN;`,
            "}"
        ];

        return result;
    }

    private renderLexerSkipCommand = (): Lines => {
        return ["this.skip();"];
    };

    private renderLexerMoreCommand = (): Lines => {
        return ["this.more();"];
    };

    private renderLexerPopModeCommand = (): Lines => {
        return ["this.popMode();"];
    };

    private renderLexerTypeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`this.type = ${arg};`];
    };

    private renderLexerChannelCommand = (arg: string, grammar: Grammar): Lines => {
        return [`this.channel = ${arg};`];
    };

    private renderLexerModeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`this.mode = ${arg};`];
    };

    private renderLexerPushModeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`this.pushMode(${arg});`];
    };

    private renderActionChunks(chunks?: OutputModelObjects.ActionChunk[]): string {
        const result: Lines = [];

        if (chunks) {
            for (const chunk of chunks) {
                const methodName = `render${chunk.constructor.name}`;
                const executor = this as IndexedObject<TypeScriptTargetGenerator>;
                const method = executor[methodName] as (chunk: OutputModelObjects.ActionChunk) => Lines;
                result.push(...method.call(executor, chunk) as Lines);
            }
        }

        return result.join("");
    }

    private renderImplicitTokenLabel(tokenName: string): Lines { return [tokenName]; }
    private renderImplicitRuleLabel(ruleName: string): Lines { return [ruleName]; };
    private renderImplicitSetLabel(id: string): Lines { return [`_tset${id}`]; };
    private renderListLabelName(label: string): Lines { return [label]; }

    /** For any action chunk, what is correctly-typed context struct ptr? */
    private renderContext(actionChunk: OutputModelObjects.ActionChunk): string {
        if (!actionChunk.ctx) {
            return "";
        }

        return this.renderTypedContext(actionChunk.ctx);
    }

    /** Only casts localContext to the type when the cast isn't redundant (i.e. to a sub-context for a labeled alt) */
    private renderTypedContext(ctx: OutputModelObjects.StructDecl): string {
        return ctx.provideCopyFrom ? `(localContext as ${ctx.name})` : `localContext`;
    }

    private renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [`// Generated from ${file.grammarFileName} by antlr-ng ${antlrVersion}. Do not edit!`];
    }

    private initValue(typeName: string): Lines {
        const value = TypeScriptTargetGenerator.defaultValues[typeName] as string | undefined;

        return [value ?? "{}"];
    }

    private startRendering(section: string): Lines {
        if (logRendering) {
            return [`/* Start rendering ${section} */`];
        }

        return [];
    }

    private endRendering(section: string, lines: Lines): Lines {
        if (logRendering) {
            if (lines.length === 1) {
                // Don't render log lines if the section is empty.
                return [];
            }

            lines.push(`/* End rendering ${section} */`);
        }

        return lines;
    }
}
