/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// Java target generator - based on the Java.stg template of ANTLR4.

import * as OutputModelObjects from "../codegen/model/index.js";

import { GeneratorBase, type NamedActions } from "../codegen/GeneratorBase.js";
import type { ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { TokenPropertyRef } from "../codegen/model/chunk/TokenPropertyRef.js";
import type { IGenerationOptions } from "../config/config.js";
import { Character } from "../support/Character.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";

export class JavaTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.java";
    public readonly version = "1.0.0";

    public readonly language = "Java";
    public readonly languageSpecifiers = ["java"];

    public override readonly codeFileExtension = ".java";

    public override readonly lexerRuleContext = "RuleContext";

    public override readonly wantsBaseListener = true;
    public override readonly wantsBaseVisitor = true;
    public override readonly supportsOverloadedMethods = true;

    /**
     * Informational only (the core does not read this flag): the Java target keeps the serialized ATN in
     * (segmented) string literals, not in an int array. The string form is produced by `renderSerializedATN`.
     */
    public override readonly isATNSerializedAsInts = false;

    public override readonly inlineTestSetWordSize = 64;

    public override readonly reservedWords = new Set([
        "abstract", "assert", "boolean", "break", "byte", "case", "catch",
        "char", "class", "const", "continue", "default", "do", "double", "else",
        "enum", "extends", "false", "final", "finally", "float", "for", "goto",
        "if", "implements", "import", "instanceof", "int", "interface",
        "long", "native", "new", "null", "package", "private", "protected",
        "public", "return", "short", "static", "strictfp", "super", "switch",
        "synchronized", "this", "throw", "throws", "transient", "true", "try",
        "void", "volatile", "while",

        "rule", "parserRule",
    ]);

    /**
     * The ANTLR version the Java runtime is checked against (`RuntimeMetaData.checkVersion`). The runtime prints
     * a warning when the major/minor version of the generating tool differs from its own, so we pass the ANTLR
     * version the runtime was built for, not the antlr-ng version.
     */
    private static readonly runtimeVersion = "4.13.2";

    /** The line width used for wrapping lists and the serialized ATN (same as the old StringTemplate output). */
    private static readonly lineWidth = 72;

    public constructor(logRendering = false) {
        super(logRendering);
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
        this.append(result, this.renderPackage(options));
        this.append(result, this.renderAction(parserFile.namedActions.get("header")));
        result.push(
            `import org.antlr.v4.runtime.atn.*;`,
            `import org.antlr.v4.runtime.dfa.DFA;`,
            `import org.antlr.v4.runtime.*;`,
            `import org.antlr.v4.runtime.misc.*;`,
            `import org.antlr.v4.runtime.tree.*;`,
            `import java.util.List;`,
            `import java.util.Iterator;`,
            `import java.util.ArrayList;`,
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
        this.invariants.tokenLabelType = lexerFile.TokenLabelType ?? "Token";

        const result: Lines = this.renderFileHeader(lexerFile);
        this.append(result, this.renderPackage(options));
        this.append(result, this.renderAction(lexerFile.namedActions.get("header")));
        result.push(
            `import org.antlr.v4.runtime.Lexer;`,
            `import org.antlr.v4.runtime.CharStream;`,
            `import org.antlr.v4.runtime.Token;`,
            `import org.antlr.v4.runtime.TokenStream;`,
            `import org.antlr.v4.runtime.*;`,
            `import org.antlr.v4.runtime.atn.*;`,
            `import org.antlr.v4.runtime.dfa.DFA;`,
            `import org.antlr.v4.runtime.misc.*;`,
            ``,
        );
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
        this.append(result, this.renderPackage(options));
        this.append(result, this.renderAction(listenerFile.header));
        result.push(
            `import org.antlr.v4.runtime.tree.ParseTreeListener;`,
            ``,
            `/**`,
            ` * This interface defines a complete listener for a parse tree produced by`,
            ` * {@link ${parserName}}.`,
            ` */`,
            `public interface ${grammarName}Listener extends ParseTreeListener {`,
        );

        const block: Lines = [];
        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            const ruleName = listenerFile.listenerLabelRuleNames.get(lname);
            for (const prefix of ["enter", "exit"]) {
                const verb = prefix === "enter" ? "Enter" : "Exit";
                block.push(`/**`);
                if (ruleName) {
                    block.push(
                        ` * ${verb} a parse tree produced by the {@code ${lname}}`,
                        ` * labeled alternative in {@link ${parserName}#${ruleName}}.`,
                    );
                } else {
                    block.push(` * ${verb} a parse tree produced by {@link ${parserName}#${lname}}.`);
                }

                block.push(
                    ` * @param ctx the parse tree`,
                    ` */`,
                    `void ${prefix}${name}(${parserName}.${name}Context ctx);`,
                );
            }
        }

        this.append(result, this.indent(block));
        result.push(`}`);

        return this.finish(result);
    };

    public renderBaseListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = listenerFile.grammarName;
        this.invariants.grammarFileName = listenerFile.grammarFileName;

        const grammarName = listenerFile.grammarName;
        const parserName = listenerFile.parserName;
        const result: Lines = this.renderFileHeader(listenerFile);
        this.append(result, this.renderPackage(options));
        this.append(result, this.renderAction(listenerFile.header));
        result.push(
            ``,
            `import org.antlr.v4.runtime.ParserRuleContext;`,
            `import org.antlr.v4.runtime.tree.ErrorNode;`,
            `import org.antlr.v4.runtime.tree.TerminalNode;`,
            ``,
            `/**`,
            ` * This class provides an empty implementation of {@link ${grammarName}Listener},`,
            ` * which can be extended to create a listener which only needs to handle a subset`,
            ` * of the available methods.`,
            ` */`,
            `@SuppressWarnings("CheckReturnValue")`,
            `public class ${grammarName}BaseListener implements ${grammarName}Listener {`,
        );

        const block: Lines = [];
        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            for (const prefix of ["enter", "exit"]) {
                block.push(
                    `/**`,
                    ` * {@inheritDoc}`,
                    ` *`,
                    ` * <p>The default implementation does nothing.</p>`,
                    ` */`,
                    `@Override public void ${prefix}${name}(${parserName}.${name}Context ctx) { }`,
                );
            }
        }

        block.push(``);
        for (const [method, type] of [
            ["enterEveryRule", "ParserRuleContext ctx"],
            ["exitEveryRule", "ParserRuleContext ctx"],
            ["visitTerminal", "TerminalNode node"],
            ["visitErrorNode", "ErrorNode node"],
        ]) {
            block.push(
                `/**`,
                ` * {@inheritDoc}`,
                ` *`,
                ` * <p>The default implementation does nothing.</p>`,
                ` */`,
                `@Override public void ${method}(${type}) { }`,
            );
        }

        this.append(result, this.indent(block));
        result.push(`}`);

        return this.finish(result);
    };

    public renderVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;

        const grammarName = visitorFile.grammarName;
        const parserName = visitorFile.parserName;
        const result: Lines = this.renderFileHeader(visitorFile);
        this.append(result, this.renderPackage(options));
        this.append(result, this.renderAction(visitorFile.header));
        result.push(
            `import org.antlr.v4.runtime.tree.ParseTreeVisitor;`,
            ``,
            `/**`,
            ` * This interface defines a complete generic visitor for a parse tree produced`,
            ` * by {@link ${parserName}}.`,
            ` *`,
            ` * @param <T> The return type of the visit operation. Use {@link Void} for`,
            ` * operations with no return type.`,
            ` */`,
            `public interface ${grammarName}Visitor<T> extends ParseTreeVisitor<T> {`,
        );

        const block: Lines = [];
        for (const lname of visitorFile.visitorNames) {
            const name = this.toTitleCase(lname);
            const ruleName = visitorFile.visitorLabelRuleNames.get(lname);
            block.push(`/**`);
            if (ruleName) {
                block.push(
                    ` * Visit a parse tree produced by the {@code ${lname}}`,
                    ` * labeled alternative in {@link ${parserName}#${ruleName}}.`,
                );
            } else {
                block.push(` * Visit a parse tree produced by {@link ${parserName}#${lname}}.`);
            }

            block.push(
                ` * @param ctx the parse tree`,
                ` * @return the visitor result`,
                ` */`,
                `T visit${name}(${parserName}.${name}Context ctx);`,
            );
        }

        this.append(result, this.indent(block));
        result.push(`}`);

        return this.finish(result);
    };

    public renderBaseVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;

        const grammarName = visitorFile.grammarName;
        const parserName = visitorFile.parserName;
        const result: Lines = this.renderFileHeader(visitorFile);
        this.append(result, this.renderPackage(options));
        this.append(result, this.renderAction(visitorFile.header));
        result.push(
            `import org.antlr.v4.runtime.tree.AbstractParseTreeVisitor;`,
            ``,
            `/**`,
            ` * This class provides an empty implementation of {@link ${grammarName}Visitor},`,
            ` * which can be extended to create a visitor which only needs to handle a subset`,
            ` * of the available methods.`,
            ` *`,
            ` * @param <T> The return type of the visit operation. Use {@link Void} for`,
            ` * operations with no return type.`,
            ` */`,
            `@SuppressWarnings("CheckReturnValue")`,
            `public class ${grammarName}BaseVisitor<T> extends AbstractParseTreeVisitor<T> implements ` +
            `${grammarName}Visitor<T> {`,
        );

        const block: Lines = [];
        for (const lname of visitorFile.visitorNames) {
            const name = this.toTitleCase(lname);
            block.push(
                `/**`,
                ` * {@inheritDoc}`,
                ` *`,
                ` * <p>The default implementation returns the result of calling`,
                ` * {@link #visitChildren} on {@code ctx}.</p>`,
                ` */`,
                `@Override public T visit${name}(${parserName}.${name}Context ctx) { return visitChildren(ctx); }`,
            );
        }

        this.append(result, this.indent(block));
        result.push(`}`);

        return this.finish(result);
    };

    // Note: the rec rule helpers return a single line with embedded line breaks, because their result is
    // run through the action translator, which concatenates all lines.
    public renderRecRuleReplaceContext = (ctxName: string): Lines => {
        return [
            `_localctx = new ${ctxName}Context(_localctx);\n` +
            `_ctx = _localctx;\n` +
            `_prevctx = _localctx;`,
        ];
    };

    public renderRecRuleAltPredicate = (ruleName: string, opPrec: number): Lines => {
        return [`precpred(_ctx, ${opPrec})`];
    };

    public renderRecRuleSetReturnAction = (src: string, name: string): Lines => {
        return [`$${name}=$${src}.${name};`];
    };

    public renderRecRuleSetStopToken = (): Lines => {
        return [`_ctx.stop = _input.LT(-1);`];
    };

    public renderRecRuleSetPrevCtx = (): Lines => {
        return [
            `if ( _parseListeners!=null ) triggerExitRuleEvent();\n` +
            `_prevctx = _localctx;`,
        ];
    };

    public renderRecRuleLabeledAltStartAction = (parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const altContext = `${this.toTitleCase(currentAltLabel)}Context`;
        const result: Lines = [
            `_localctx = new ${altContext}(new ${this.toTitleCase(ruleName)}Context(_parentctx, _parentState));`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`((${altContext})_localctx).${this.escapeIfNeeded(label)}.add(_prevctx);`);
            } else {
                result.push(`((${altContext})_localctx).${this.escapeIfNeeded(label)} = _prevctx;`);
            }
        }

        result.push(`pushNewRecursionContext(_localctx, _startState, RULE_${ruleName});`);

        return [result.join("\n")];
    };

    public renderRecRuleAltStartAction = (parserName: string, ruleName: string, ctxName: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [`_localctx = new ${this.toTitleCase(ctxName)}Context(_parentctx, _parentState);`];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`_localctx.${this.escapeIfNeeded(label)}.add(_prevctx);`);
            } else {
                result.push(`_localctx.${this.escapeIfNeeded(label)} = _prevctx;`);
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
            `import org.antlr.v4.runtime.*;`,
            `import org.antlr.v4.runtime.tree.*;`,
            `import org.antlr.v4.runtime.atn.*;`,
            `import java.nio.file.Paths;`,
            `import java.util.Arrays;`,
            ``,
            `public class Test {`,
            `	public static void main(String[] args) throws Exception {`,
            `		CharStream input = CharStreams.fromPath(Paths.get(args[0]));`,
            `		${lexerName} lex = new ${lexerName}(input);`,
            `		CommonTokenStream tokens = new CommonTokenStream(lex);`,
        ];

        if (parserName !== undefined) {
            if (parserStartRuleName === undefined) {
                throw new Error("A parser start rule name is required to render the Java test file.");
            }

            result.push(
                `		${parserName} parser = new ${parserName}(tokens);`,
                `		parser.getInterpreter().setPredictionMode(PredictionMode.${predictionMode});`,
            );

            if (!buildParseTree) {
                result.push(`		parser.setBuildParseTree(false);`);
            }

            if (showDiagnosticErrors) {
                result.push(`		parser.addErrorListener(new DiagnosticErrorListener());`);
            }

            if (traceATN) {
                result.push(`		ParserATNSimulator.trace_atn_sim = true;`);
            }

            if (profile) {
                result.push(`		parser.setProfile(true);`);
            }

            result.push(`		ParserRuleContext tree = parser.${this.escapeIfNeeded(parserStartRuleName)}();`);

            if (profile) {
                result.push(`		System.out.println(Arrays.toString(parser.getParseInfo().getDecisionInfo()));`);
            }

            result.push(`		ParseTreeWalker.DEFAULT.walk(new TreeShapeListener(), tree);`);
        } else {
            result.push(
                `		tokens.fill();`,
                `		for (Object t : tokens.getTokens()) System.out.println(t);`,
            );

            if (showDFA) {
                result.push(
                    `		System.out.print(lex.getInterpreter().getDFA(Lexer.DEFAULT_MODE).toLexerString());`,
                );
            }
        }

        result.push(`	}`);

        if (parserName !== undefined) {
            result.push(
                ``,
                `	static class TreeShapeListener implements ParseTreeListener {`,
                `		@Override public void visitTerminal(TerminalNode node) { }`,
                `		@Override public void visitErrorNode(ErrorNode node) { }`,
                `		@Override public void exitEveryRule(ParserRuleContext ctx) { }`,
                ``,
                `		@Override`,
                `		public void enterEveryRule(ParserRuleContext ctx) {`,
                `			for (int i = 0; i < ctx.getChildCount(); i++) {`,
                `				ParseTree parent = ctx.getChild(i).getParent();`,
                `				if (!(parent instanceof RuleNode) || ((RuleNode)parent).getRuleContext() != ctx) {`,
                `					throw new IllegalStateException("Invalid parse tree shape detected.");`,
                `				}`,
                `			}`,
                `		}`,
                `	}`,
            );
        }

        result.push(`}`);

        return this.finish(result);
    };

    public override getSerializedATNSegmentLimit(): number {
        // 65535 is the class file format byte limit for a UTF-8 encoded string literal.
        // 3 is the maximum number of bytes it takes to encode a value in the range 0-0xFFFF.
        return Math.trunc(65535 / 3);
    }

    protected override renderTypedContext = (ctx: OutputModelObjects.StructDecl): string => {
        return `((${ctx.name})_localctx)`;
    };

    protected override renderRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.RuleFunction): Lines => {
        const result = this.startRendering("RuleFunction");

        result.push(``);
        this.append(result, this.renderStructDecl(currentRule.ruleCtx));
        currentRule.altLabelCtxs?.forEach((ctx) => {
            this.append(result, this.renderAltLabelStructDecl(currentRule, ctx));
        });
        result.push(``);

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") + " " : "public final ";
        const args = currentRule.args?.map((a) => {
            return this.renderAttributeDecl(a).join("");
        }).join(",") ?? "";
        const callArgs = this.renderCallArgs(currentRule.args);

        result.push(
            `${modifiers}${currentRule.ctxType} ${currentRule.escapedName}(${args}) throws RecognitionException {`,
            `	${currentRule.ctxType} _localctx = new ${currentRule.ctxType}(_ctx, getState()${callArgs});`,
            `	enterRule(_localctx, ${currentRule.startState.stateNumber}, RULE_${currentRule.name});`,
        );
        this.append(result, this.indent(this.renderAction(currentRule.namedActions?.get("init"))));
        this.append(result, this.indent(this.renderDecls(currentRule.locals.values())));
        result.push(`	try {`);
        this.append(result, this.indent(this.renderRuleBody(currentRule), 2));
        result.push(`	}`);

        if (currentRule.exceptions && currentRule.exceptions.length > 0) {
            for (const e of currentRule.exceptions) {
                this.append(result, this.indent(this.renderExceptionClause(e)));
            }
        } else {
            result.push(
                `	catch (RecognitionException re) {`,
                `		_localctx.exception = re;`,
                `		_errHandler.reportError(this, re);`,
                `		_errHandler.recover(this, re);`,
                `	}`,
            );
        }

        result.push(`	finally {`);
        this.append(result, this.indent(this.renderAction(currentRule.finallyAction), 2));
        result.push(
            `		exitRule();`,
            `	}`,
            `	return _localctx;`,
            `}`,
        );

        return this.endRendering("RuleFunction", result);
    };

    protected override renderLeftRecursiveRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.LeftRecursiveRuleFunction): Lines => {
        const result = this.startRendering("LeftRecursiveRuleFunction");

        result.push(``);
        this.append(result, this.renderStructDecl(currentRule.ruleCtx));
        currentRule.altLabelCtxs?.forEach((ctx) => {
            this.append(result, this.renderAltLabelStructDecl(currentRule, ctx));
        });
        result.push(``);

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") + " " : "public final ";
        const args = currentRule.args?.map((a) => {
            return this.renderAttributeDecl(a).join("");
        }).join(", ") ?? "";
        const callArgs = this.renderCallArgs(currentRule.args);
        const ctxType = currentRule.ctxType;
        const escapedName = currentRule.escapedName;
        const startState = currentRule.startState.stateNumber;

        result.push(
            `${modifiers}${ctxType} ${escapedName}(${args}) throws RecognitionException {`,
            `	return ${escapedName}(0${callArgs});`,
            `}`,
            ``,
            `private ${ctxType} ${escapedName}(int _p${args.length > 0 ? ", " + args : ""}) throws ` +
            `RecognitionException {`,
            `	ParserRuleContext _parentctx = _ctx;`,
            `	int _parentState = getState();`,
            `	${ctxType} _localctx = new ${ctxType}(_ctx, _parentState${callArgs});`,
            `	${ctxType} _prevctx = _localctx;`,
            `	int _startState = ${startState};`,
            `	enterRecursionRule(_localctx, ${startState}, RULE_${currentRule.name}, _p);`,
        );
        this.append(result, this.indent(this.renderAction(currentRule.namedActions?.get("init"))));
        this.append(result, this.indent(this.renderDecls(currentRule.locals.values())));
        result.push(`	try {`);
        this.append(result, this.indent(this.renderRuleBody(currentRule), 2));
        result.push(
            `	}`,
            `	catch (RecognitionException re) {`,
            `		_localctx.exception = re;`,
            `		_errHandler.reportError(this, re);`,
            `		_errHandler.recover(this, re);`,
            `	}`,
            `	finally {`,
        );
        this.append(result, this.indent(this.renderAction(currentRule.finallyAction), 2));
        result.push(
            `		unrollRecursionContexts(_parentctx);`,
            `	}`,
            `	return _localctx;`,
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
        const derivedFromName = this.toTitleCase(struct.derivedFromName);
        const grammarName = this.invariants.grammarName;

        return [
            `@Override`,
            `public <T> T accept(ParseTreeVisitor<? extends T> visitor) {`,
            `	if ( visitor instanceof ${grammarName}Visitor ) return ((${grammarName}Visitor<? extends T>)visitor)` +
            `.visit${derivedFromName}(this);`,
            `	else return visitor.visitChildren(this);`,
            `}`,
        ];
    };

    protected override renderListenerDispatchMethod = (struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod): Lines => {
        const derivedFromName = this.toTitleCase(struct.derivedFromName);
        const grammarName = this.invariants.grammarName;
        const prefix = method.isEnter ? "enter" : "exit";

        return [
            `@Override`,
            `public void ${prefix}Rule(ParseTreeListener listener) {`,
            `	if ( listener instanceof ${grammarName}Listener ) ((${grammarName}Listener)listener)` +
            `.${prefix}${derivedFromName}(this);`,
            `}`,
        ];
    };

    protected override renderAttributeDecl = (d: OutputModelObjects.AttributeDecl): Lines => {
        return [`${d.type} ${d.escapedName}${d.initValue ? ` = ${d.initValue}` : ""}`];
    };

    protected override renderCaptureNextToken = (d: OutputModelObjects.CaptureNextToken): Lines => {
        return [`${d.varName} = _input.LT(1);`];
    };

    protected override renderCaptureNextTokenType = (srcOp: OutputModelObjects.CaptureNextTokenType): Lines => {
        return [`${srcOp.varName} = _input.LA(1);`];
    };

    protected override renderCodeBlockForAlt = (currentAltCodeBlock: OutputModelObjects.CodeBlockForAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForAlt");

        result.push(`{`);
        this.append(result, this.renderDecls(currentAltCodeBlock.locals));
        this.append(result, this.renderSourceOps(currentAltCodeBlock.preamble));
        this.append(result, this.renderSourceOps(currentAltCodeBlock.ops));
        result.push(`}`);

        return this.endRendering("CodeBlockForAlt", result);
    };

    protected override renderCodeBlockForOuterMostAlt = (
        currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(
                `_localctx = new ${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context(_localctx);`,
            );
        }

        result.push(`enterOuterAlt(_localctx, ${currentOuterMostAltCodeBlock.alt.altNum});`);
        this.append(result, this.renderCodeBlockForAlt(currentOuterMostAltCodeBlock));

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    };

    protected override renderContextRuleGetterDecl = (r: OutputModelObjects.ContextRuleGetterDecl): Lines => {
        return [
            `public ${r.ctxName} ${r.escapedName}() {`,
            `	return getRuleContext(${r.ctxName}.class,0);`,
            `}`,
        ];
    };

    protected override renderContextRuleListGetterDecl = (r: OutputModelObjects.ContextRuleListGetterDecl): Lines => {
        return [
            `public List<${r.ctxName}> ${r.escapedName}() {`,
            `	return getRuleContexts(${r.ctxName}.class);`,
            `}`,
        ];
    };

    protected override renderContextRuleListIndexedGetterDecl = (
        r: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines => {
        return [
            `public ${r.ctxName} ${r.escapedName}(int i) {`,
            `	return getRuleContext(${r.ctxName}.class,i);`,
            `}`,
        ];
    };

    protected override renderContextTokenGetterDecl = (t: OutputModelObjects.ContextTokenGetterDecl): Lines => {
        return [
            `public TerminalNode ${t.name}() { return getToken(${this.invariants.recognizerName}.${t.name}, 0); }`,
        ];
    };

    protected override renderContextTokenListGetterDecl = (t: OutputModelObjects.ContextTokenListGetterDecl): Lines => {
        return [
            `public List<TerminalNode> ${t.name}() { return getTokens(${this.invariants.recognizerName}.${t.name}); }`,
        ];
    };

    protected override renderContextTokenListIndexedGetterDecl = (
        t: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines => {
        return [
            `public TerminalNode ${t.name}(int i) {`,
            `	return getToken(${this.invariants.recognizerName}.${t.name}, i);`,
            `}`,
        ];
    };

    protected override renderExceptionClause = (srcOp: OutputModelObjects.ExceptionClause): Lines => {
        const result = this.startRendering("ExceptionClause");

        result.push(`catch (${this.renderAction(srcOp.catchArg).join("")}) {`);
        this.append(result, this.indent(this.renderAction(srcOp.catchAction)));
        result.push(`}`);

        return this.endRendering("ExceptionClause", result);
    };

    protected override renderLL1AltBlock = (choice: OutputModelObjects.LL1AltBlock): Lines => {
        const result = this.startRendering("LL1AltBlock");

        result.push(
            `setState(${choice.stateNumber});`,
            `_errHandler.sync(this);`,
        );

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = _input.LT(1);`);
        }

        this.append(result, this.renderSourceOps(choice.preamble));
        result.push(`switch (_input.LA(1)) {`);

        choice.alts.forEach((alt, index) => {
            this.append(result, this.renderCases(choice.altLook[index]));
            this.append(result, this.indent(this.renderAlt(alt)));
            result.push(`	break;`);
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(`default:`);
        this.append(result, this.indent(this.renderThrowNoViableAlt(noViableAltObject)));
        result.push(`}`);

        return this.endRendering("LL1AltBlock", result);
    };

    protected override renderLL1OptionalBlock = (choice: OutputModelObjects.LL1OptionalBlock): Lines => {
        const result = this.startRendering("LL1OptionalBlock");

        result.push(
            `setState(${choice.stateNumber});`,
            `_errHandler.sync(this);`,
            `switch (_input.LA(1)) {`,
        );

        // The lookahead list has one more entry than the alternatives (the exit branch), which results in an
        // empty case.
        choice.altLook.forEach((look, index) => {
            const alt = choice.alts[index] as OutputModelObjects.CodeBlockForAlt | undefined;
            this.append(result, this.renderCases(look));
            if (alt) {
                this.append(result, this.indent(this.renderAlt(alt)));
            }
            result.push(`	break;`);
        });

        result.push(
            `default:`,
            `	break;`,
            `}`,
        );

        return this.endRendering("LL1OptionalBlock", result);
    };

    protected override renderLL1OptionalBlockSingleAlt = (
        choice: OutputModelObjects.LL1OptionalBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1OptionalBlockSingleAlt");

        result.push(
            `setState(${choice.stateNumber});`,
            `_errHandler.sync(this);`,
        );
        this.append(result, this.renderSourceOps(choice.preamble));
        result.push(`if (${this.renderSourceOps([choice.expr]).join("")}) {`);
        for (const alt of choice.alts) {
            this.append(result, this.indent(this.renderAlt(alt)));
        }
        result.push(`}`, ``);

        return this.endRendering("LL1OptionalBlockSingleAlt", result);
    };

    protected override renderLL1StarBlockSingleAlt = (choice: OutputModelObjects.LL1StarBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1StarBlockSingleAlt");

        result.push(
            `setState(${choice.stateNumber});`,
            `_errHandler.sync(this);`,
        );
        this.append(result, this.renderSourceOps(choice.preamble));
        result.push(`while (${this.renderSourceOps(choice.loopExpr ? [choice.loopExpr] : []).join("")}) {`);
        for (const alt of choice.alts) {
            this.append(result, this.indent(this.renderAlt(alt)));
        }
        result.push(
            `	setState(${choice.loopBackStateNumber});`,
            `	_errHandler.sync(this);`,
        );
        this.append(result, this.indent(this.renderSourceOps(choice.iteration)));
        result.push(`}`);

        return this.endRendering("LL1StarBlockSingleAlt", result);
    };

    protected override renderLL1PlusBlockSingleAlt = (choice: OutputModelObjects.LL1PlusBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1PlusBlockSingleAlt");

        result.push(
            `setState(${choice.blockStartStateNumber});`, // Alt block decision.
            `_errHandler.sync(this);`,
        );
        this.append(result, this.renderSourceOps(choice.preamble));
        result.push(`do {`);
        for (const alt of choice.alts) {
            this.append(result, this.indent(this.renderAlt(alt)));
        }
        result.push(
            `	setState(${choice.stateNumber});`, // Loopback/exit decision.
            `	_errHandler.sync(this);`,
        );
        this.append(result, this.indent(this.renderSourceOps(choice.iteration)));
        result.push(`} while ( ${this.renderSourceOps(choice.loopExpr ? [choice.loopExpr] : []).join("")} );`);

        return this.endRendering("LL1PlusBlockSingleAlt", result);
    };

    protected override renderMatchToken = (m: OutputModelObjects.MatchToken): Lines => {
        const result: Lines = this.startRendering("MatchToken");

        result.push(
            `setState(${m.stateNumber});`,
            `${this.renderLabelAssignments(m.labels)}match(${m.escapedName});`,
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
        return [`${srcOp.ctxName} ${srcOp.escapedName}`];
    };

    protected override renderRuleContextListDecl = (ruleDecl: OutputModelObjects.RuleContextListDecl): Lines => {
        return [`List<${ruleDecl.ctxName}> ${ruleDecl.escapedName} = new ArrayList<${ruleDecl.ctxName}>()`];
    };

    protected override renderStructDecl = (struct: OutputModelObjects.StructDecl): Lines => {
        const result = this.startRendering("StructDecl");

        const escapedName = struct.escapedName;
        const superClass = this.invariants.contextSuperClass ?? "ParserRuleContext";
        let interfaces = "";
        if (struct.interfaces.length > 0) {
            interfaces = " implements " + struct.interfaces.map((i) => {
                return this.renderAction(i as OutputModelObjects.Action).join("");
            }).join(", ");
        }

        result.push(
            `@SuppressWarnings("CheckReturnValue")`,
            `public static class ${escapedName} extends ${superClass}${interfaces} {`,
        );

        const body: Lines = this.renderAttrs(struct);
        for (const getter of struct.getters) {
            this.append(body, this.renderDecl(getter));
        }

        if (struct.ctorAttrs.length > 0) {
            body.push(
                `public ${escapedName}(ParserRuleContext parent, int invokingState) { super(parent, invokingState); }`,
            );
        }

        const ctorArgs = struct.ctorAttrs.map((a) => {
            return `, ${this.renderAttributeDecl(a).join("")}`;
        }).join("");

        body.push(
            `public ${escapedName}(ParserRuleContext parent, int invokingState${ctorArgs}) {`,
            `	super(parent, invokingState);`,
        );
        for (const a of struct.ctorAttrs) {
            body.push(`	this.${a.escapedName} = ${a.escapedName};`);
        }

        body.push(
            `}`,
            `@Override public int getRuleIndex() { return RULE_${struct.derivedFromName}; }`,
        );

        // Don't need copy unless we have subclasses.
        if (struct.provideCopyFrom) {
            body.push(
                ``,
                `public ${escapedName}() { }`,
                `public void copyFrom(${escapedName} ctx) {`,
                `	super.copyFrom(ctx);`,
            );
            for (const a of struct.attrs) {
                body.push(`	this.${a.escapedName} = ctx.${a.escapedName};`);
            }

            body.push(`}`);
        }

        this.append(body, this.renderDispatchMethods(struct));
        for (const e of struct.extensionMembers) {
            this.append(body, this.renderAction(e as OutputModelObjects.Action));
        }

        this.append(result, this.indent(body));
        result.push(`}`);

        return this.endRendering("StructDecl", result);
    };

    protected override renderAltLabelStructDecl = (currentRule: OutputModelObjects.RuleFunction,
        struct: OutputModelObjects.AltLabelStructDecl): Lines => {
        const result = this.startRendering("AltLabelStructDecl");

        const escapedName = struct.escapedName;
        const parentContext = `${this.toTitleCase(currentRule.name)}Context`;

        result.push(
            `@SuppressWarnings("CheckReturnValue")`,
            `public static class ${escapedName} extends ${parentContext} {`,
        );

        const body: Lines = this.renderAttrs(struct);
        for (const getter of struct.getters) {
            this.append(body, this.renderDecl(getter));
        }

        body.push(`public ${escapedName}(${parentContext} ctx) { copyFrom(ctx); }`);
        this.append(body, this.renderDispatchMethods(struct));

        this.append(result, this.indent(body));
        result.push(`}`);

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
        return [`${this.invariants.tokenLabelType} ${t.escapedName}`];
    };

    protected override renderTokenTypeDecl = (srcOp: OutputModelObjects.TokenTypeDecl): Lines => {
        return [`int ${srcOp.escapedName};`];
    };

    protected override renderTokenListDecl = (t: OutputModelObjects.TokenListDecl): Lines => {
        return [`List<Token> ${t.escapedName} = new ArrayList<Token>()`];
    };

    protected override renderThrowNoViableAlt = (srcOp: OutputModelObjects.ThrowNoViableAlt): Lines => {
        return [`throw new NoViableAltException(this);`];
    };

    protected override renderWildcard = (w: OutputModelObjects.Wildcard): Lines => {
        const result: Lines = this.startRendering("Wildcard");

        result.push(
            `setState(${w.stateNumber});`,
            `${this.renderLabelAssignments(w.labels)}matchWildcard();`,
        );

        return this.endRendering("Wildcard", result);
    };

    protected override renderStarBlock = (choice: OutputModelObjects.StarBlock): Lines => {
        const result: Lines = this.startRendering("StarBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const predict = `_alt = getInterpreter().adaptivePredict(_input,${choice.decision},_ctx);`;
        result.push(
            `setState(${choice.stateNumber});`,
            `_errHandler.sync(this);`,
            predict,
            `while ( _alt!=${choice.exitAlt} && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {`,
            `	if ( _alt==1${blockAST.greedy ? "" : "+1"} ) {`,
        );
        this.append(result, this.indent(this.renderSourceOps(choice.iteration), 2));
        for (const alt of choice.alts) { // Should only be one.
            this.append(result, this.indent(this.renderAlt(alt), 2));
        }

        result.push(
            `	}`,
            `	setState(${choice.loopBackStateNumber});`,
            `	_errHandler.sync(this);`,
            `	${predict}`,
            `}`,
        );

        return this.endRendering("StarBlock", result);
    };

    protected override renderPlusBlock = (choice: OutputModelObjects.PlusBlock): Lines => {
        const result: Lines = this.startRendering("PlusBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const nonGreedy = blockAST.greedy ? "" : "+1";
        result.push(
            `setState(${choice.blockStartStateNumber});`, // Alt block decision.
            `_errHandler.sync(this);`,
            `_alt = 1${nonGreedy};`,
            `do {`,
            `	switch (_alt) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(`	case ${index + 1}${nonGreedy}:`);
            this.append(result, this.indent(this.renderAlt(alt), 2));
            result.push(`		break;`);
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(`	default:`);
        this.append(result, this.indent(this.renderThrowNoViableAlt(noViableAltObject), 2));
        result.push(
            `	}`,
            `	setState(${choice.loopBackStateNumber});`, // Loopback/exit decision.
            `	_errHandler.sync(this);`,
            `	_alt = getInterpreter().adaptivePredict(_input,${choice.decision},_ctx);`,
            `} while ( _alt!=${choice.exitAlt} && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER );`,
        );

        return this.endRendering("PlusBlock", result);
    };

    protected override renderOptionalBlock = (choice: OutputModelObjects.OptionalBlock): Lines => {
        const result: Lines = this.startRendering("OptionalBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const nonGreedy = blockAST.greedy ? "" : "+1";
        result.push(
            `setState(${choice.stateNumber});`,
            `_errHandler.sync(this);`,
            `switch ( getInterpreter().adaptivePredict(_input,${choice.decision},_ctx) ) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(`case ${index + 1}${nonGreedy}:`);
            this.append(result, this.indent(this.renderAlt(alt)));
            result.push(`	break;`);
        });

        result.push(`}`);

        return this.endRendering("OptionalBlock", result);
    };

    protected override renderAltBlock = (choice: OutputModelObjects.AltBlock): Lines => {
        const result: Lines = this.startRendering("AltBlock");

        result.push(
            `setState(${choice.stateNumber});`,
            `_errHandler.sync(this);`,
        );

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = _input.LT(1);`);
        }

        this.append(result, this.renderSourceOps(choice.preamble));
        result.push(`switch ( getInterpreter().adaptivePredict(_input,${choice.decision},_ctx) ) {`);

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(`case ${index + 1}:`);
            this.append(result, this.indent(this.renderAlt(alt)));
            result.push(`	break;`);
        });

        result.push(`}`);

        return this.endRendering("AltBlock", result);
    };

    protected override renderInvokeRule = (r: OutputModelObjects.InvokeRule): Lines => {
        const result: Lines = this.startRendering("InvokeRule");

        const argExprs = this.renderActionChunks(r.argExprsChunks).join("");
        let args = "";
        const ast = r.ast as GrammarASTWithOptions | undefined;
        const precedence = ast?.getOptionString("p");
        if (precedence) {
            args = precedence + (argExprs.length > 0 ? "," : "");
        }
        args += argExprs;

        result.push(
            `setState(${r.stateNumber});`,
            `${this.renderLabelAssignments(r.labels)}${r.escapedName}(${args});`,
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

        const exception = `throw new FailedPredicateException(this, ${p.predicate}${message});`;
        result.push(
            `setState(${p.stateNumber});`,
            `if (!(${this.closeExpression(chunks, `)) ${exception}`)}`,
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
            `private void ${r.name}_action(${r.ctxType} _localctx, int actionIndex) {`,
            `	switch (actionIndex) {`,
        );

        for (const [index, action] of r.actions) {
            result.push(`	case ${index}:`);
            this.append(result, this.indent(this.renderAction(action), 2));
            result.push(`		break;`);
        }

        result.push(
            `	}`,
            `}`,
        );

        return this.endRendering("RuleActionFunction", result);
    }

    protected override renderRuleSempredFunction = (r: OutputModelObjects.RuleSempredFunction): Lines => {
        const result = this.startRendering("RuleSempredFunction");

        result.push(
            `private boolean ${r.name}_sempred(${r.ctxType} _localctx, int predIndex) {`,
            `	switch (predIndex) {`,
        );

        for (const [index, action] of r.actions) {
            result.push(`	case ${index}:`);

            // A predicate can span multiple lines. The first line gets the return keyword, the last the semicolon.
            const lines = this.renderAction(action);
            if (lines.length === 0) {
                lines.push("");
            }

            lines[0] = `return ${lines[0]}`;
            lines[lines.length - 1] = this.closeExpression(lines[lines.length - 1] ?? "", ";");
            this.append(result, this.indent(lines, 2));
        }

        result.push(
            `	}`,
            `	return true;`,
            `}`,
        );

        return this.endRendering("RuleSempredFunction", result);
    };

    /**
     * Renders the serialized ATN as Java string literal(s). Java limits the size of a string constant in the class
     * file, so the ATN is encoded in 16 bit words (values which don't fit in 15 bits take two words) and split into
     * segments, which are joined at runtime.
     *
     * @param model The serialized ATN (as integers).
     *
     * @returns The lines of the ATN declaration.
     */
    protected override renderSerializedATN = (model: OutputModelObjects.SerializedATN): Lines => {
        const result = this.startRendering("SerializedATN");

        const data = this.encodeIntsWith16BitWords(model.serialized);
        const segmentLimit = this.getSerializedATNSegmentLimit();
        const segments: string[][] = [];
        for (let i = 0; i < data.length; i += segmentLimit) {
            const segment: string[] = [];
            const end = Math.min(i + segmentLimit, data.length);
            for (let j = i; j < end; ++j) {
                segment.push(this.encodeInt16AsCharEscape(data[j]));
            }

            segments.push(segment);
        }

        if (segments.length > 1) {
            // Requires segmented representation.
            segments.forEach((segment, index) => {
                result.push(`private static final String _serializedATNSegment${index} =`);
                this.append(result, this.renderStringLiteral(segment));
            });

            result.push(
                `public static final String _serializedATN = Utils.join(`,
                `	new String[] {`,
            );
            segments.forEach((_, index) => {
                result.push(`		_serializedATNSegment${index}${index < segments.length - 1 ? "," : ""}`);
            });
            result.push(
                `	},`,
                `	""`,
                `);`,
            );
        } else {
            // Only one segment, can be inlined.
            result.push(`public static final String _serializedATN =`);
            this.append(result, this.renderStringLiteral(segments[0] ?? []));
        }

        result.push(
            `public static final ATN _ATN =`,
            `	new ATNDeserializer().deserialize(_serializedATN.toCharArray());`,
            `static {`,
            `	_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];`,
            `	for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {`,
            `		_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);`,
            `	}`,
            `}`,
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
        return [`${this.renderContext(t)}.${t.escapedName}`];
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

    protected renderCases(tokens: OutputModelObjects.ITokenInfo[]): Lines {
        return tokens.map((t) => {
            return `case ${t.name}:`;
        });
    }

    // Lexer command methods. Only used for custom commands, the standard ones are ATN actions.
    protected override renderLexerSkipCommand = (): Lines => {
        return ["skip();"];
    };

    protected override renderLexerMoreCommand = (): Lines => {
        return ["more();"];
    };

    protected override renderLexerPopModeCommand = (): Lines => {
        return ["popMode();"];
    };

    protected override renderLexerTypeCommand = (arg: string): Lines => {
        return [`_type = ${arg};`];
    };

    protected override renderLexerChannelCommand = (arg: string): Lines => {
        return [`_channel = ${arg};`];
    };

    protected override renderLexerModeCommand = (arg: string): Lines => {
        return [`_mode = ${arg};`];
    };

    protected override renderLexerPushModeCommand = (arg: string): Lines => {
        return [`pushMode(${arg});`];
    };

    protected override renderArgRef = (t: OutputModelObjects.ArgRef): Lines => {
        return [`_localctx.${t.escapedName}`];
    };

    protected override renderListLabelRef = (t: OutputModelObjects.ListLabelRef): Lines => {
        return [`${this.renderContext(t)}.${this.renderListLabelName(t.escapedName)}`];
    };

    protected override renderLocalRef = (a: OutputModelObjects.LocalRef): Lines => {
        return [`_localctx.${a.escapedName}`];
    };

    protected override renderNonLocalAttrRef = (s: OutputModelObjects.NonLocalAttrRef): Lines => {
        return [
            `((${this.toTitleCase(s.ruleName)}Context)getInvokingContext(${s.ruleIndex})).${s.escapedName}`,
        ];
    };

    protected override renderQRetValueRef = (a: OutputModelObjects.QRetValueRef): Lines => {
        return [`${this.renderContext(a)}.${this.escapeIfNeeded(a.dict)}.${a.escapedName}`];
    };

    protected override renderRetValueRef = (t: OutputModelObjects.RetValueRef): Lines => {
        return [`_localctx.${t.escapedName}`];
    };

    protected override renderRulePropertyRef = (t: OutputModelObjects.RulePropertyRef): Lines => {
        return this.renderRulePropertyRefStart(t);
    };

    protected override renderRulePropertyRefCtx = (t: OutputModelObjects.RulePropertyRefCtx): Lines => {
        return [`${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`];
    };

    protected override renderRulePropertyRefParser = (t: OutputModelObjects.RulePropertyRefParser): Lines => {
        return ["this"];
    };

    protected override renderRulePropertyRefStart = (t: OutputModelObjects.RulePropertyRefStart): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [`(${ref}!=null?(${ref}.start):null)`];
    };

    protected override renderRulePropertyRefStop = (t: OutputModelObjects.RulePropertyRefStop): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [`(${ref}!=null?(${ref}.stop):null)`];
    };

    protected override renderRulePropertyRefText = (t: OutputModelObjects.RulePropertyRefText): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [`(${ref}!=null?_input.getText(${ref}.start,${ref}.stop):null)`];
    };

    protected override renderSetAttr = (s: OutputModelObjects.SetAttr): Lines => {
        const rhsChunks = this.renderActionChunks(s.rhsChunks).join("");

        return [`${this.renderContext(s)}.${s.escapedName} = ${rhsChunks};`];
    };

    protected override renderSetNonLocalAttr = (s: OutputModelObjects.SetNonLocalAttr): Lines => {
        const rhsChunks = this.renderActionChunks(s.rhsChunks).join("");

        return [
            `((${this.toTitleCase(s.ruleName)}Context)getInvokingContext(${s.ruleIndex})).${s.escapedName} = ` +
            `${rhsChunks};`,
        ];
    };

    protected override renderThisRulePropertyRefCtx = (t: OutputModelObjects.ThisRulePropertyRefCtx): Lines => {
        return ["_localctx"];
    };

    protected override renderThisRulePropertyRefParser = (t: OutputModelObjects.ThisRulePropertyRefParser): Lines => {
        return ["this"];
    };

    protected override renderThisRulePropertyRefStart = (t: OutputModelObjects.ThisRulePropertyRefStart): Lines => {
        return ["_localctx.start"];
    };

    protected override renderThisRulePropertyRefStop = (t: OutputModelObjects.ThisRulePropertyRefStop): Lines => {
        return ["_localctx.stop"];
    };

    protected override renderThisRulePropertyRefText = (t: OutputModelObjects.ThisRulePropertyRefText): Lines => {
        return ["_input.getText(_localctx.start, _input.LT(-1))"];
    };

    protected override renderTokenPropertyRefChannel = (t: OutputModelObjects.TokenPropertyRefChannel): Lines => {
        return [this.renderTokenProperty(t, "getChannel()", "0")];
    };

    protected override renderTokenPropertyRefIndex = (t: OutputModelObjects.TokenPropertyRefIndex): Lines => {
        return [this.renderTokenProperty(t, "getTokenIndex()", "0")];
    };

    protected override renderTokenPropertyRefInt = (t: OutputModelObjects.TokenPropertyRefInt): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [`(${ref}!=null?Integer.valueOf(${ref}.getText()):0)`];
    };

    protected override renderTokenPropertyRefLine = (t: OutputModelObjects.TokenPropertyRefLine): Lines => {
        return [this.renderTokenProperty(t, "getLine()", "0")];
    };

    protected override renderTokenPropertyRefPos = (t: OutputModelObjects.TokenPropertyRefPos): Lines => {
        return [this.renderTokenProperty(t, "getCharPositionInLine()", "0")];
    };

    protected override renderTokenPropertyRefText = (t: OutputModelObjects.TokenPropertyRefText): Lines => {
        return [this.renderTokenProperty(t, "getText()", "null")];
    };

    protected override renderTokenPropertyRefType = (t: OutputModelObjects.TokenPropertyRefType): Lines => {
        return [this.renderTokenProperty(t, "getType()", "0")];
    };

    protected override renderTokenRef = (t: OutputModelObjects.TokenRef): Lines => {
        return [`${this.renderContext(t)}.${t.escapedName}`];
    };

    private renderParser(parser: OutputModelObjects.Parser, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const superClass = parser.superClass ? this.renderActionChunks([parser.superClass]).join("") : "Parser";
        result.push(
            `@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast", "CheckReturnValue"})`,
            `public class ${parser.name} extends ${superClass} {`,
        );

        const body: Lines = [];
        body.push(
            `static { RuntimeMetaData.checkVersion("${JavaTargetGenerator.runtimeVersion}", ` +
            `RuntimeMetaData.VERSION); }`,
            ``,
            `protected static final DFA[] _decisionToDFA;`,
            `protected static final PredictionContextCache _sharedContextCache =`,
            `	new PredictionContextCache();`,
        );

        if (parser.tokens.size > 0) {
            body.push(`public static final int`);
            this.append(body, this.renderConstants(Array.from(parser.tokens), "="));
        }

        if (parser.rules.length > 0) {
            body.push(`public static final int`);
            this.append(body, this.renderConstants(parser.rules.map((r) => {
                return [`RULE_${r.name}`, r.index];
            }), " = "));
        }

        body.push(
            `private static String[] makeRuleNames() {`,
            `	return new String[] {`,
            ...this.indent(this.renderList(parser.ruleNames, { wrap: this.wrapWidth(3), quote: '"' }), 2),
            `	};`,
            `}`,
            `public static final String[] ruleNames = makeRuleNames();`,
            ``,
            ...this.renderVocabulary(parser.literalNames, parser.symbolicNames),
            ``,
            `@Override`,
            `public String getGrammarFileName() { return "${parser.grammarFileName}"; }`,
            ``,
            `@Override`,
            `public String[] getRuleNames() { return ruleNames; }`,
            ``,
            `@Override`,
            `public String getSerializedATN() { return _serializedATN; }`,
            ``,
            `@Override`,
            `public ATN getATN() { return _ATN; }`,
            ``,
            ...this.renderAction(namedActions.get("members")),
            `public ${parser.name}(TokenStream input) {`,
            `	super(input);`,
            `	_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);`,
            `}`,
        );

        this.append(body, this.renderRuleFunctions(namedActions, parser.funcs));

        if (parser.sempredFuncs.size > 0) {
            this.append(body, this.renderSempredDispatch(parser.sempredFuncs.values()));
            body.push(``);
        }

        this.append(body, this.renderSerializedATN(parser.atn));

        this.append(result, this.indent(body));
        result.push(`}`);

        return result;
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const superClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]).join("") : "Lexer";
        result.push(
            `@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast", "CheckReturnValue", "this-escape"})`,
            `public class ${lexer.name} extends ${superClass} {`,
        );

        const body: Lines = [];
        body.push(
            `static { RuntimeMetaData.checkVersion("${JavaTargetGenerator.runtimeVersion}", ` +
            `RuntimeMetaData.VERSION); }`,
            ``,
            `protected static final DFA[] _decisionToDFA;`,
            `protected static final PredictionContextCache _sharedContextCache =`,
            `	new PredictionContextCache();`,
        );

        if (lexer.tokens.size > 0) {
            body.push(`public static final int`);
            this.append(body, this.renderConstants(Array.from(lexer.tokens), "="));
        }

        if (lexer.escapedChannels.size > 0) {
            body.push(`public static final int`);
            this.append(body, this.renderConstants(Array.from(lexer.escapedChannels), "="));
        }

        if (lexer.escapedModeNames.length > 1) {
            body.push(`public static final int`);
            this.append(body, this.renderConstants(lexer.escapedModeNames.slice(1).map((m, i) => {
                return [m, i + 1];
            }), "="));
        }

        // The channel names continue the line with the two predefined channels, and the wrapped lines are
        // aligned to the start of the list.
        const predefinedChannels = `"DEFAULT_TOKEN_CHANNEL", "HIDDEN"`;
        body.push(`public static String[] channelNames = {`);
        if (lexer.channelNames.length > 0) {
            const prefix = `${predefinedChannels}, `;
            const channels = this.renderList(lexer.channelNames, { wrap: this.wrapWidth(2 + prefix.length),
                quote: '"' });
            channels.forEach((line, index) => {
                body.push(index === 0 ? `	${prefix}${line}` : `	${" ".repeat(prefix.length)}${line}`);
            });
        } else {
            body.push(`	${predefinedChannels}`);
        }

        body.push(
            `};`,
            ``,
            `public static String[] modeNames = {`,
            ...this.indent(this.renderList(lexer.modes, { wrap: this.wrapWidth(2), quote: '"' })),
            `};`,
            ``,
            `private static String[] makeRuleNames() {`,
            `	return new String[] {`,
            ...this.indent(this.renderList(lexer.ruleNames, { wrap: this.wrapWidth(3), quote: '"' }), 2),
            `	};`,
            `}`,
            `public static final String[] ruleNames = makeRuleNames();`,
            ``,
            ...this.renderVocabulary(lexer.literalNames, lexer.symbolicNames),
            ``,
            ...this.renderAction(namedActions.get("members")),
            ``,
            `public ${lexer.name}(CharStream input) {`,
            `	super(input);`,
            `	_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);`,
            `}`,
            ``,
            `@Override`,
            `public String getGrammarFileName() { return "${lexer.grammarFileName}"; }`,
            ``,
            `@Override`,
            `public String[] getRuleNames() { return ruleNames; }`,
            ``,
            `@Override`,
            `public String getSerializedATN() { return _serializedATN; }`,
            ``,
            `@Override`,
            `public String[] getChannelNames() { return channelNames; }`,
            ``,
            `@Override`,
            `public String[] getModeNames() { return modeNames; }`,
            ``,
            `@Override`,
            `public ATN getATN() { return _ATN; }`,
            ``,
        );

        const actionHandlers = this.renderActionHandlers(lexer);
        if (actionHandlers.length > 0) {
            this.append(body, actionHandlers);
            body.push(``);
        }

        this.append(body, this.renderSerializedATN(lexer.atn));

        this.append(result, this.indent(body));
        result.push(`}`);

        return result;
    }

    private renderActionHandlers(lexer: OutputModelObjects.Lexer): Lines {
        const result: Lines = this.startRendering("ActionHandlers");

        if (lexer.actionFuncs.size > 0) {
            result.push(
                `@Override`,
                `public void action(RuleContext _localctx, int ruleIndex, int actionIndex) {`,
                `	switch (ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of lexer.actionFuncs.values()) {
                result.push(
                    `	case ${f.ruleIndex}:`,
                    `		${f.name}_action((${f.ctxType})_localctx, actionIndex);`,
                    `		break;`,
                );
                this.append(funcs, this.renderRuleActionFunction(f));
            }

            result.push(
                `	}`,
                `}`,
            );
            this.append(result, funcs);
        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(`@Override`);
            this.append(result, this.renderSempredDispatch(lexer.sempredFuncs.values()));
        }

        return this.endRendering("ActionHandlers", result);
    }

    /**
     * Renders the `sempred` method, which dispatches to the per-rule predicate methods, followed by these methods.
     *
     * @param sempredFuncs The predicate functions of the recognizer.
     *
     * @returns The rendered lines.
     */
    private renderSempredDispatch(sempredFuncs: Iterable<OutputModelObjects.RuleSempredFunction>): Lines {
        const result: Lines = [
            `public boolean sempred(RuleContext _localctx, int ruleIndex, int predIndex) {`,
            `	switch (ruleIndex) {`,
        ];

        const funcs: Lines = [];
        for (const f of sempredFuncs) {
            result.push(
                `	case ${f.ruleIndex}:`,
                `		return ${f.name}_sempred((${f.ctxType})_localctx, predIndex);`,
            );
            this.append(funcs, this.renderRuleSempredFunction(f));
        }

        result.push(
            `	}`,
            `	return true;`,
            `}`,
        );
        this.append(result, funcs);

        return result;
    }

    /**
     * Renders a list of `name=value` constants, wrapped like the old template did (relative to an indentation of
     * two tabs).
     *
     * @param entries The name/value pairs.
     * @param assignment The text between name and value.
     *
     * @returns The rendered lines.
     */
    private renderConstants(entries: Array<[string, number]>, assignment: string): Lines {
        const items = entries.map(([name, value]) => {
            return `${name}${assignment}${value}`;
        });

        return this.indent(this.renderList(items, { wrap: this.wrapWidth(2), finalSeparator: ";" }));
    }

    private renderVocabulary(literalNames: Array<string | null>, symbolicNames: Array<string | null>): Lines {
        const result: Lines = this.startRendering("Vocabulary");

        result.push(
            `private static String[] makeLiteralNames() {`,
            `	return new String[] {`,
            ...this.indent(this.renderList(literalNames, { wrap: this.wrapWidth(3), null: "null" }), 2),
            `	};`,
            `}`,
            `private static final String[] _LITERAL_NAMES = makeLiteralNames();`,
            `private static String[] makeSymbolicNames() {`,
            `	return new String[] {`,
            ...this.indent(this.renderList(symbolicNames, { wrap: this.wrapWidth(3), null: "null" }), 2),
            `	};`,
            `}`,
            `private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();`,
            `public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);`,
            ``,
            `/**`,
            ` * @deprecated Use {@link #VOCABULARY} instead.`,
            ` */`,
            `@Deprecated`,
            `public static final String[] tokenNames;`,
            `static {`,
            `	tokenNames = new String[_SYMBOLIC_NAMES.length];`,
            `	for (int i = 0; i < tokenNames.length; i++) {`,
            `		tokenNames[i] = VOCABULARY.getLiteralName(i);`,
            `		if (tokenNames[i] == null) {`,
            `			tokenNames[i] = VOCABULARY.getSymbolicName(i);`,
            `		}`,
            ``,
            `		if (tokenNames[i] == null) {`,
            `			tokenNames[i] = "<INVALID>";`,
            `		}`,
            `	}`,
            `}`,
            ``,
            `@Override`,
            `@Deprecated`,
            `public String[] getTokenNames() {`,
            `	return tokenNames;`,
            `}`,
            ``,
            `@Override`,
            `public Vocabulary getVocabulary() {`,
            `	return VOCABULARY;`,
            `}`,
        );

        return this.endRendering("Vocabulary", result);
    }

    private renderPackage(options: IGenerationOptions): Lines {
        if (options.package) {
            return [`package ${options.package};`];
        }

        return [];
    }

    /**
     * Renders the body of a rule function (the content of the try block).
     *
     * @param currentRule The rule function to render.
     *
     * @returns The rendered lines.
     */
    private renderRuleBody(currentRule: OutputModelObjects.RuleFunction): Lines {
        const result: Lines = [];

        if (currentRule.hasLookaheadBlock) {
            result.push(`int _alt;`);
        }

        this.append(result, this.renderSourceOps(currentRule.code));
        this.append(result, this.renderSourceOps(currentRule.postamble));
        this.append(result, this.renderAction(currentRule.namedActions?.get("after")));

        return result;
    }

    /**
     * Renders the attributes (fields) of a rule context class.
     *
     * @param struct The context class.
     *
     * @returns The rendered lines.
     */
    private renderAttrs(struct: OutputModelObjects.StructDecl): Lines {
        const result: Lines = [];

        for (const a of struct.attrs) {
            for (const line of this.renderDecl(a)) {
                result.push(`public ${line};`);
            }
        }

        return result;
    }

    /**
     * Renders a single declaration without the rendering log markers.
     *
     * @param decl The declaration to render.
     *
     * @returns The rendered lines.
     */
    private renderDecl(decl: OutputModelObjects.Decl): Lines {
        return this.renderDecls([decl]).filter((line) => {
            return line !== undefined && !line.startsWith("/* Start rendering ")
                && !line.startsWith("/* End rendering ");
        });
    }

    private renderAlt(alt: OutputModelObjects.CodeBlockForAlt): Lines {
        if (alt instanceof OutputModelObjects.CodeBlockForOuterMostAlt) {
            return this.renderCodeBlockForOuterMostAlt(alt);
        }

        return this.renderCodeBlockForAlt(alt);
    }

    private renderLabelAssignments(labels: OutputModelObjects.Decl[]): string {
        return labels.map((l) => {
            return `${this.renderLabelref(l)} = `;
        }).join("");
    }

    private renderCallArgs(args?: OutputModelObjects.AttributeDecl[]): string {
        return args?.map((a) => {
            return `, ${a.escapedName}`;
        }).join("") ?? "";
    }

    private renderTokenProperty(t: TokenPropertyRef, accessor: string, defaultValue: string): string {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return `(${ref}!=null?${ref}.${accessor}:${defaultValue})`;
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

        // Java language spec 15.19 - shift operators mask operands rather than overflow to 0... need range test.
        return `(((${shiftVar}) & ~0x3f) == 0 && ((1L << ${shiftVar}) & ${bits.calculated}L) != 0)`;
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `${s.varName}==${t.name}`;
        }).join(" || ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        // The offset is negative when the set contains EOF (-1), so it must be applied as well.
        return offset !== 0n ? `(${shiftAmount} - ${offset})` : shiftAmount;
    }

    /**
     * Appends the closing part to an expression from a grammar action. If the last line of the expression contains
     * a `//` (which can start a trailing comment), the closing part is put on a line of its own instead, so it is
     * not swallowed by the comment.
     *
     * @param expression The expression, possibly spanning multiple lines.
     * @param closing The text to append.
     *
     * @returns The expression with the closing part.
     */
    private closeExpression(expression: string, closing: string): string {
        const lastLine = expression.substring(expression.lastIndexOf("\n") + 1);

        return lastLine.includes("//") ? `${expression}\n${closing}` : expression + closing;
    }

    private renderCommonSetStuff = (m: OutputModelObjects.MatchSet, invert: boolean): Lines => {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`setState(${m.stateNumber});`);

        if (m.labels.length > 0) {
            result.push(`${this.renderLabelAssignments(m.labels)}_input.LT(1);`);
        }

        result.push(this.renderCaptureNextTokenType(m.capture).join(""));

        const expr = this.renderTestSetInline(m.expr).join("");
        if (invert) {
            result.push(`if ( ${m.expr.varName} <= 0 || (${expr}) ) {`);
        } else {
            result.push(`if ( !(${expr}) ) {`);
        }

        const labels = m.labels.map((l) => {
            return `${this.renderLabelref(l)} = (Token)`;
        }).join("");

        result.push(
            `	${labels}_errHandler.recoverInline(this);`,
            `}`,
            `else {`,
            `	if ( _input.LA(1)==Token.EOF ) matchedEOF = true;`,
            `	_errHandler.reportMatch(this);`,
            `	consume();`,
            `}`,
        );

        return this.endRendering("CommonSetStuff", result);
    };

    /**
     * Renders the (escaped) characters of a string literal, wrapped over multiple lines which are concatenated
     * with `+`. The lines are indented by two tabs, which is where the literal ends up in the generated class.
     *
     * @param chars The escaped characters.
     *
     * @returns The rendered lines.
     */
    private renderStringLiteral(chars: string[]): Lines {
        const result: Lines = [];

        // The first column after the tabs and the opening quote.
        const startColumn = 3;
        let line = "";
        let column = startColumn;
        for (const c of chars) {
            if (column >= JavaTargetGenerator.lineWidth) {
                result.push(`	"${line}"+`);
                line = "";
                column = startColumn;
            }

            line += c;
            column += c.length;
        }

        result.push(`	"${line}";`);

        return result;
    }

    /**
     * Computes the `wrap` value for `renderList` which corresponds to the line width of the old template, when the
     * list starts at the given column (tabs count as one character).
     *
     * @param startColumn The column at which the list starts.
     *
     * @returns The value for the `wrap` option.
     */
    private wrapWidth(startColumn: number): number {
        return JavaTargetGenerator.lineWidth - 1 - startColumn;
    }

    /**
     * Given a list of integers representing a serialized ATN, encode values too large to fit into 15 bits
     * as two 16-bit values. We use the high bit (0x8000_0000) to indicate values requiring two 16-bit words.
     * If the high bit is set, we grab the next value and combine them to get a 31-bit value. The possible
     * input int values are [-1,0x7FFF_FFFF].
     *
     * ```markdown
     *      | compression/encoding                         | uint16 count | type            |
     *      | -------------------------------------------- | ------------ | --------------- |
     *      | 0xxxxxxx xxxxxxxx                            | 1            | uint (15 bit)   |
     *      | 1xxxxxxx xxxxxxxx yyyyyyyy yyyyyyyy          | 2            | uint (16+ bits) |
     *      | 11111111 11111111 11111111 11111111          | 2            | int value -1    |
     * ```
     *
     * @param data The serialized ATN.
     *
     * @returns The encoded data.
     */
    private encodeIntsWith16BitWords(data: number[]): number[] {
        const data16: number[] = [];

        for (let i = 0; i < data.length; i++) {
            let v = data[i];
            if (v === -1) {
                // Use two max uint16 for -1.
                data16.push(0xFFFF, 0xFFFF);
            } else if (v <= 0x7FFF) {
                data16.push(v);
            } else { // v > 0x7FFF or v < -1
                if (v < -1 || v >= 0x7FFF_FFFF) {
                    // Too big to fit in 15 bits + 16 bits? (+1 would be 8000_0000 which is bad encoding).
                    // Negative values other than -1 cannot be represented either.
                    throw new Error(`Serialized ATN data element[${i}] = ${v} doesn't fit in 31 bits`);
                }

                // Strip high bit (sentinel) if set.
                v = v & 0x7FFF_FFFF;

                // Store high 15-bit word first and set high bit to say word follows, then the lower 16-bit word.
                data16.push((v >> 16) | 0x8000, v & 0xFFFF);
            }
        }

        return data16;
    }

    /**
     * Encodes a 16-bit char value as it has to appear in a Java string literal.
     *
     * @param v The value to encode.
     *
     * @returns The encoded value.
     */
    private encodeInt16AsCharEscape(v: number): string {
        if (v < Character.MIN_VALUE || v > Character.MAX_VALUE) {
            throw new Error(`Cannot encode the specified value: ${v}`);
        }

        const escaped = this.charValueEscapeMap.get(v);
        if (escaped) {
            return escaped;
        }

        switch (Character.getType(v)) {
            case Character.CONTROL:
            case Character.LINE_SEPARATOR:
            case Character.PARAGRAPH_SEPARATOR: {
                return `\\u${v.toString(16).padStart(4, "0")}`;
            }

            default: {
                if (v <= 127) {
                    return String.fromCodePoint(v); // ASCII chars can be as-is, no encoding.
                }

                // Else we use hex encoding to ensure pure ascii chars generated.
                return `\\u${v.toString(16).padStart(4, "0")}`;
            }
        }
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
