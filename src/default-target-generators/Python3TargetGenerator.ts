/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// Python 3 target generator - based on the Python3.stg template of ANTLR4.

// cspell: ignore bytearray classmethod delattr divmod frozenset getattr hasattr isinstance issubclass memoryview
// cspell: ignore setattr repr staticmethod unichr localctx prevctx parentctx sempred precpred

import * as OutputModelObjects from "../codegen/model/index.js";

import { GeneratorBase, type NamedActions } from "../codegen/GeneratorBase.js";
import type { CodePoint, ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { TokenPropertyRef } from "../codegen/model/chunk/TokenPropertyRef.js";
import type { IGenerationOptions } from "../config/config.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import { antlrVersion } from "../version.js";

export class Python3TargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.python3";
    public readonly version = "1.0.0";

    public readonly language = "Python3";
    public readonly languageSpecifiers = ["python3", "python", "py"];

    public override readonly codeFileExtension = ".py";

    public override readonly lexerRuleContext = "RuleContext";

    public override readonly wantsBaseListener = false;
    public override readonly wantsBaseVisitor = false;
    public override readonly supportsOverloadedMethods = false;
    public override readonly isATNSerializedAsInts = true;
    public override readonly inlineTestSetWordSize = 64;

    public override readonly reservedWords = new Set([
        "abs", "all", "and", "any", "apply", "as", "assert",
        "bin", "bool", "break", "buffer", "bytearray",
        "callable", "chr", "class", "classmethod", "coerce", "compile", "complex", "continue",
        "def", "del", "delattr", "dict", "dir", "divmod",
        "elif", "else", "enumerate", "eval", "execfile", "except",
        "file", "filter", "finally", "float", "for", "format", "from", "frozenset",
        "getattr", "global", "globals",
        "hasattr", "hash", "help", "hex",
        "id", "if", "import", "in", "input", "int", "intern", "is", "isinstance", "issubclass", "iter",
        "lambda", "len", "list", "locals",
        "map", "max", "min", "memoryview",
        "next", "nonlocal", "not",
        "object", "oct", "open", "or", "ord",
        "pass", "pow", "print", "property",
        "raise", "range", "raw_input", "reduce", "reload", "repr", "return", "reversed", "round",
        "set", "setattr", "slice", "sorted", "staticmethod", "str", "sum", "super",
        "try", "tuple", "type",
        "unichr", "unicode",
        "vars",
        "with", "while",
        "yield",
        "zip",
        "__import__",
        "True", "False", "None",

        // misc
        "rule", "parserRule",
    ]);

    /**
     * The ANTLR version the Python runtime is checked against (`checkVersion`). The runtime prints a warning when
     * the version of the generating tool differs from its own, so we pass the ANTLR version the runtime was built
     * for, not the antlr-ng version.
     */
    private static readonly runtimeVersion = "4.13.2";

    /** The line width used for wrapping long lists (same value as the old StringTemplate based generator). */
    private static readonly lineWidth = 72;

    private escapeMap: Map<CodePoint, string>;

    public constructor(logRendering = false) {
        super(logRendering);

        // https://docs.python.org/3/reference/lexical_analysis.html#string-and-bytes-literals
        this.escapeMap = new Map(GeneratorBase.defaultCharValueEscape);
        this.escapeMap.set(0x07, "\\a");
        this.escapeMap.set(0x0B, "\\v");
    }

    public renderParserFile = (parserFile: OutputModelObjects.ParserFile, declaration: boolean,
        options: IGenerationOptions): string => {
        const parser = parserFile.parser;
        this.invariants.recognizerName = parser.name;
        this.invariants.grammarName = parser.grammarName;
        this.invariants.grammarFileName = parser.grammarFileName;
        this.invariants.tokenLabelType = parserFile.TokenLabelType ?? "Token";
        this.invariants.packageName = options.package;
        this.invariants.contextSuperClass = parserFile.contextSuperClass
            ? this.renderActionChunks([parserFile.contextSuperClass]).join("") : undefined;

        const result: Lines = this.renderFileHeader(parserFile);
        result.push(
            `# encoding: utf-8`,
            ...this.renderImports(),
            ``,
            ...this.renderAction(parserFile.namedActions.get("header")),
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
        this.invariants.packageName = options.package;

        const result: Lines = this.renderFileHeader(lexerFile);
        result.push(
            ...this.renderImports(),
            ``,
            ...this.renderAction(lexerFile.namedActions.get("header")),
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

        result.push(
            ...this.renderParserImport(parserName),
            ...this.renderAction(listenerFile.header),
            ``,
            `# This class defines a complete listener for a parse tree produced by ${parserName}.`,
            `class ${grammarName}Listener(ParseTreeListener):`,
            ``,
        );

        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            result.push(
                `    # Enter a parse tree produced by ${parserName}#${lname}.`,
                `    def enter${name}(self, ctx:${parserName}.${name}Context):`,
                `        pass`,
                ``,
                `    # Exit a parse tree produced by ${parserName}#${lname}.`,
                `    def exit${name}(self, ctx:${parserName}.${name}Context):`,
                `        pass`,
                ``,
                ``,
            );
        }

        result.push(
            ``,
            `del ${parserName}`,
        );

        return this.finish(result);
    };

    public renderBaseListenerFile = (listenerFile: OutputModelObjects.ListenerFile, declaration: boolean,
        options: IGenerationOptions): string => {
        // Python has no separate base listener. The listener class is already a complete implementation.
        return "";
    };

    public renderVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        this.invariants.grammarName = visitorFile.grammarName;
        this.invariants.grammarFileName = visitorFile.grammarFileName;

        const grammarName = visitorFile.grammarName;
        const parserName = visitorFile.parserName;
        const result: Lines = this.renderFileHeader(visitorFile);

        result.push(
            ...this.renderParserImport(parserName),
            ...this.renderAction(visitorFile.header),
            ``,
            `# This class defines a complete generic visitor for a parse tree produced by ${parserName}.`,
            ``,
            `class ${grammarName}Visitor(ParseTreeVisitor):`,
            ``,
        );

        for (const lname of visitorFile.visitorNames) {
            const name = this.toTitleCase(lname);
            result.push(
                `    # Visit a parse tree produced by ${parserName}#${lname}.`,
                `    def visit${name}(self, ctx:${parserName}.${name}Context):`,
                `        return self.visitChildren(ctx)`,
                ``,
                ``,
            );
        }

        result.push(
            ``,
            `del ${parserName}`,
        );

        return this.finish(result);
    };

    public renderBaseVisitorFile = (visitorFile: OutputModelObjects.VisitorFile, declaration: boolean,
        options: IGenerationOptions): string => {
        // Python has no separate base visitor. The visitor class is already a complete implementation.
        return "";
    };

    // Note: the rec rule helpers return a single line with embedded line breaks, because their result is
    // run through the action translator, which concatenates all lines.
    //
    // This method is called while the output model is built, when the parser name is not known yet (the
    // invariants are only set when a file is rendered). The context classes are nested in the parser class,
    // so they are reached through `self` instead of the parser class name.
    public renderRecRuleReplaceContext = (ctxName: string): Lines => {
        return [
            `localctx = self.${this.toTitleCase(ctxName)}Context(self, localctx)\n` +
            `self._ctx = localctx\n` +
            `_prevctx = localctx`,
        ];
    };

    public renderRecRuleAltPredicate = (ruleName: string, opPrec: number): Lines => {
        return [
            `self.precpred(self._ctx, ${opPrec})`,
        ];
    };

    public renderRecRuleSetReturnAction = (src: string, name: string): Lines => {
        return [
            `$${name}=$${src}.${name}`,
        ];
    };

    public renderRecRuleSetStopToken = (): Lines => {
        return [
            `self._ctx.stop = self._input.LT(-1)`,
        ];
    };

    public renderRecRuleSetPrevCtx = (): Lines => {
        return [
            `if self._parseListeners is not None:\n` +
            `    self.triggerExitRuleEvent()\n` +
            `_prevctx = localctx`,
        ];
    };

    public renderRecRuleLabeledAltStartAction = (parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [
            `localctx = ${parserName}.${this.toTitleCase(currentAltLabel)}Context(self, ` +
            `${parserName}.${this.toTitleCase(ruleName)}Context(self, _parentctx, _parentState))`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`localctx.${label}.append(_prevctx)`);
            } else {
                result.push(`localctx.${label} = _prevctx`);
            }
        }

        result.push(`self.pushNewRecursionContext(localctx, _startState, self.RULE_${ruleName})`);

        return [result.join("\n")];
    };

    public renderRecRuleAltStartAction = (parserName: string, ruleName: string, ctxName: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [
            `localctx = ${parserName}.${this.toTitleCase(ctxName)}Context(self, _parentctx, _parentState)`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`localctx.${label}.append(_prevctx)`);
            } else {
                result.push(`localctx.${label} = _prevctx`);
            }
        }

        result.push(`self.pushNewRecursionContext(localctx, _startState, self.RULE_${ruleName})`);

        return [result.join("\n")];
    };

    public renderTestFile = (grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string => {
        const result: Lines = [
            `import sys`,
            `import codecs`,
            `from antlr4 import *`,
            `from ${lexerName} import ${lexerName}`,
        ];

        if (parserName !== undefined) {
            result.push(`from ${parserName} import ${parserName}`);

            if (useListener) {
                result.push(`from ${grammarName}Listener import ${grammarName}Listener`);
            }

            if (useVisitor) {
                result.push(`from ${grammarName}Visitor import ${grammarName}Visitor`);
            }

            result.push(
                ``,
                `class TreeShapeListener(ParseTreeListener):`,
                ``,
                `    def visitTerminal(self, node:TerminalNode):`,
                `        pass`,
                ``,
                `    def visitErrorNode(self, node:ErrorNode):`,
                `        pass`,
                ``,
                `    def exitEveryRule(self, ctx:ParserRuleContext):`,
                `        pass`,
                ``,
                `    def enterEveryRule(self, ctx:ParserRuleContext):`,
                `        for child in ctx.getChildren():`,
                `            parent = child.parentCtx`,
                `            if not isinstance(parent, RuleNode) or parent.getRuleContext() != ctx:`,
                `                raise IllegalStateException("Invalid parse tree shape detected.")`,
            );
        }

        result.push(
            ``,
            `def main(argv):`,
        );

        if (traceATN) {
            result.push(
                `    ParserATNSimulator.trace_atn_sim = True`,
                `    PredictionContext._trace_atn_sim = True`,
            );
        }

        result.push(
            `    input = FileStream(argv[1], encoding='utf-8', errors='replace')`,
            `    lexer = ${lexerName}(input)`,
            `    stream = CommonTokenStream(lexer)`,
        );

        if (parserName !== undefined) {
            result.push(
                `    parser = ${parserName}(stream)`,
                `    parser._interp.predictionMode = PredictionMode.${predictionMode}`,
            );

            if (!buildParseTree) {
                result.push(`    parser.buildParseTrees = False`);
            }

            if (showDiagnosticErrors) {
                result.push(`    parser.addErrorListener(DiagnosticErrorListener())`);
            }

            result.push(
                `    tree = parser.${parserStartRuleName ?? ""}()`,
                `    ParseTreeWalker.DEFAULT.walk(TreeShapeListener(), tree)`,
            );
        } else {
            result.push(
                `    stream.fill()`,
                `    [ print(t) for t in stream.tokens ]`,
            );

            if (showDFA) {
                result.push(`    print(lexer._interp.decisionToDFA[Lexer.DEFAULT_MODE].toLexerString(), end='')`);
            }
        }

        result.push(
            ``,
            `if __name__ == '__main__':`,
            `    main(sys.argv)`,
        );

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

    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [
            `# Generated from ${file.grammarFileName} by antlr-ng ${antlrVersion}. Do not edit!`,
        ];
    }

    protected override renderTypedContext = (ctx: OutputModelObjects.StructDecl): string => {
        return `localctx`;
    };

    protected override renderRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.RuleFunction): Lines => {
        const result = this.startRendering("RuleFunction");

        this.append(result, this.renderRuleContexts(currentRule));

        result.push(
            `def ${currentRule.escapedName}(self${this.renderArgs(currentRule.args)}):`,
            ``,
            `    localctx = ${this.invariants.recognizerName}.${currentRule.ctxType}(self, self._ctx, self.state` +
            `${this.renderCallArgs(currentRule.args)})`,
            `    self.enterRule(localctx, ${currentRule.startState.stateNumber}, self.RULE_${currentRule.name})`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ...this.indent(this.renderDecls(currentRule.locals.values())),
            `    try:`,
            ...this.indent(this.renderRuleBody(currentRule), 2),
        );

        if (currentRule.exceptions && currentRule.exceptions.length > 0) {
            for (const e of currentRule.exceptions) {
                result.push(...this.indent(this.renderExceptionClause(e)));
            }
        } else {
            result.push(
                `    except RecognitionException as re:`,
                `        localctx.exception = re`,
                `        self._errHandler.reportError(self, re)`,
                `        self._errHandler.recover(self, re)`,
            );
        }

        result.push(
            `    finally:`,
            ...this.indent(this.renderAction(currentRule.finallyAction), 2),
            `        self.exitRule()`,
            `    return localctx`,
            ``,
            ``,
        );

        return this.endRendering("RuleFunction", result);
    };

    protected override renderLeftRecursiveRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.LeftRecursiveRuleFunction): Lines => {
        const result = this.startRendering("LeftRecursiveRuleFunction");

        this.append(result, this.renderRuleContexts(currentRule));

        result.push(
            `def ${currentRule.escapedName}(self, _p:int=0${this.renderArgs(currentRule.args)}):`,
            `    _parentctx = self._ctx`,
            `    _parentState = self.state`,
            `    localctx = ${this.invariants.recognizerName}.${currentRule.ctxType}(self, self._ctx, _parentState` +
            `${this.renderCallArgs(currentRule.args)})`,
            `    _prevctx = localctx`,
            `    _startState = ${currentRule.startState.stateNumber}`,
            `    self.enterRecursionRule(localctx, ${currentRule.startState.stateNumber}, ` +
            `self.RULE_${currentRule.name}, _p)`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ...this.indent(this.renderDecls(currentRule.locals.values())),
            `    try:`,
            ...this.indent(this.renderRuleBody(currentRule), 2),
            `    except RecognitionException as re:`,
            `        localctx.exception = re`,
            `        self._errHandler.reportError(self, re)`,
            `        self._errHandler.recover(self, re)`,
            `    finally:`,
            ...this.indent(this.renderAction(currentRule.finallyAction), 2),
            `        self.unrollRecursionContexts(_parentctx)`,
            `    return localctx`,
            ``,
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

        return [
            `def accept(self, visitor:ParseTreeVisitor):`,
            `    if hasattr( visitor, "visit${name}" ):`,
            `        return visitor.visit${name}(self)`,
            `    else:`,
            `        return visitor.visitChildren(self)`,
            ``,
        ];
    };

    protected override renderListenerDispatchMethod = (struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod): Lines => {
        const enterExit = method.isEnter ? "enter" : "exit";
        const name = this.toTitleCase(struct.derivedFromName);

        return [
            `def ${enterExit}Rule(self, listener:ParseTreeListener):`,
            `    if hasattr( listener, "${enterExit}${name}" ):`,
            `        listener.${enterExit}${name}(self)`,
            ``,
        ];
    };

    protected override renderAttributeDecl = (d: OutputModelObjects.AttributeDecl): Lines => {
        return [
            `self.${d.escapedName} = ${d.initValue ?? "None"}`,
        ];
    };

    protected override renderCaptureNextToken = (d: OutputModelObjects.CaptureNextToken): Lines => {
        return [
            `${d.varName} = self._input.LT(1)`,
        ];
    };

    protected override renderCaptureNextTokenType = (srcOp: OutputModelObjects.CaptureNextTokenType): Lines => {
        return [
            `${srcOp.varName} = self._input.LA(1)`,
        ];
    };

    protected override renderCodeBlockForOuterMostAlt = (
        currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(
                `localctx = ${this.invariants.recognizerName}.` +
                `${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context(self, localctx)`,
            );
        }

        result.push(
            `self.enterOuterAlt(localctx, ${currentOuterMostAltCodeBlock.alt.altNum})`,
            ...this.renderCodeBlockForAlt(currentOuterMostAltCodeBlock),
        );

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    };

    protected override renderContextRuleGetterDecl = (r: OutputModelObjects.ContextRuleGetterDecl): Lines => {
        if (r.signature) {
            return [];
        }

        return [
            `def ${r.escapedName}(self):`,
            `    return self.getTypedRuleContext(${this.invariants.recognizerName}.${r.ctxName},0)`,
            ``,
        ];
    };

    protected override renderContextRuleListGetterDecl = (r: OutputModelObjects.ContextRuleListGetterDecl): Lines => {
        // Python has no overloaded methods. The indexed getter handles both cases.
        return [];
    };

    protected override renderContextRuleListIndexedGetterDecl = (
        r: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines => {
        if (r.signature) {
            return [];
        }

        const parserName = this.invariants.recognizerName;

        return [
            `def ${r.escapedName}(self, i:int=None):`,
            `    if i is None:`,
            `        return self.getTypedRuleContexts(${parserName}.${r.ctxName})`,
            `    else:`,
            `        return self.getTypedRuleContext(${parserName}.${r.ctxName},i)`,
            ``,
        ];
    };

    protected override renderContextTokenGetterDecl = (t: OutputModelObjects.ContextTokenGetterDecl): Lines => {
        if (t.signature) {
            return [];
        }

        return [
            `def ${t.escapedName}(self):`,
            `    return self.getToken(${this.invariants.recognizerName}.${t.escapedName}, 0)`,
        ];
    };

    protected override renderContextTokenListGetterDecl = (t: OutputModelObjects.ContextTokenListGetterDecl): Lines => {
        // Python has no overloaded methods. The indexed getter handles both cases.
        return [];
    };

    protected override renderContextTokenListIndexedGetterDecl = (
        t: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines => {
        if (t.signature) {
            return [];
        }

        const parserName = this.invariants.recognizerName;

        return [
            `def ${t.escapedName}(self, i:int=None):`,
            `    if i is None:`,
            `        return self.getTokens(${parserName}.${t.escapedName})`,
            `    else:`,
            `        return self.getToken(${parserName}.${t.escapedName}, i)`,
        ];
    };

    protected override renderExceptionClause = (srcOp: OutputModelObjects.ExceptionClause): Lines => {
        const result = this.startRendering("ExceptionClause");

        result.push(
            `except ${this.renderAction(srcOp.catchArg).join(" ").trim()}:`,
            ...this.indent(this.renderBlockBody(this.renderAction(srcOp.catchAction))),
        );

        return this.endRendering("ExceptionClause", result);
    };

    protected override renderLL1AltBlock = (choice: OutputModelObjects.LL1AltBlock): Lines => {
        const result = this.startRendering("LL1AltBlock");

        result.push(...this.renderSync(choice.stateNumber));

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = self._input.LT(1)`);
        }

        result.push(
            ...this.renderSourceOps(choice.preamble),
            `token = self._input.LA(1)`,
        );

        choice.alts.forEach((alt, index) => {
            result.push(
                `${index === 0 ? "if" : "elif"} ${this.renderCases(choice.altLook[index])}:`,
                ...this.indent(this.renderAlt(alt)),
                `    pass`,
            );
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(
            `else:`,
            ...this.indent(this.renderThrowNoViableAlt(noViableAltObject)),
            ``,
        );

        return this.endRendering("LL1AltBlock", result);
    };

    protected override renderLL1OptionalBlock = (choice: OutputModelObjects.LL1OptionalBlock): Lines => {
        const result = this.startRendering("LL1OptionalBlock");

        result.push(
            ...this.renderSync(choice.stateNumber),
            `token = self._input.LA(1)`,
        );

        // The lookahead list has one more entry than the alternatives (the exit branch), which results in an
        // empty branch.
        choice.altLook.forEach((look, index) => {
            const alt = choice.alts[index] as OutputModelObjects.CodeBlockForAlt | undefined;
            result.push(
                `${index === 0 ? "if" : "elif"} ${this.renderCases(look)}:`,
                ...this.indent(alt ? this.renderAlt(alt) : []),
                `    pass`,
            );
        });

        result.push(
            `else:`,
            `    pass`,
        );

        return this.endRendering("LL1OptionalBlock", result);
    };

    protected override renderLL1OptionalBlockSingleAlt = (
        choice: OutputModelObjects.LL1OptionalBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1OptionalBlockSingleAlt");

        result.push(
            ...this.renderSync(choice.stateNumber),
            ...this.renderSourceOps(choice.preamble),
            `if ${this.renderSourceOps(choice.expr ? [choice.expr] : undefined).join("")}:`,
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt)));
        });

        result.push(``);

        return this.endRendering("LL1OptionalBlockSingleAlt", result);
    };

    protected override renderLL1StarBlockSingleAlt = (choice: OutputModelObjects.LL1StarBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1StarBlockSingleAlt");

        result.push(
            ...this.renderSync(choice.stateNumber),
            ...this.renderSourceOps(choice.preamble),
            `while ${this.renderSourceOps(choice.loopExpr ? [choice.loopExpr] : undefined).join("")}:`,
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt)));
        });

        result.push(
            ...this.indent(this.renderSync(choice.loopBackStateNumber)),
            ...this.indent(this.renderSourceOps(choice.iteration)),
            ``,
        );

        return this.endRendering("LL1StarBlockSingleAlt", result);
    };

    protected override renderLL1PlusBlockSingleAlt = (choice: OutputModelObjects.LL1PlusBlockSingleAlt): Lines => {
        const result: Lines = this.startRendering("LL1PlusBlockSingleAlt");

        result.push(
            ...this.renderSync(choice.blockStartStateNumber), // Alt block decision.
            ...this.renderSourceOps(choice.preamble),
            `while True:`,
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt)));
        });

        result.push(
            ...this.indent(this.renderSync(choice.stateNumber)), // Loop back/exit decision.
            ...this.indent(this.renderSourceOps(choice.iteration)),
            `    if not (${this.renderSourceOps(choice.loopExpr ? [choice.loopExpr] : undefined).join("")}):`,
            `        break`,
            ``,
        );

        return this.endRendering("LL1PlusBlockSingleAlt", result);
    };

    protected override renderMatchToken = (m: OutputModelObjects.MatchToken): Lines => {
        const result: Lines = this.startRendering("MatchToken");

        result.push(
            `self.state = ${m.stateNumber}`,
            `${this.renderLabelAssignments(m.labels)}self.match(${this.invariants.recognizerName}.${m.name})`,
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
            `self.${srcOp.escapedName} = None # ${srcOp.ctxName}`,
        ];
    };

    protected override renderRuleContextListDecl = (ruleDecl: OutputModelObjects.RuleContextListDecl): Lines => {
        return [
            `self.${ruleDecl.escapedName} = list() # of ${ruleDecl.ctxName}s`,
        ];
    };

    protected override renderStructDecl = (struct: OutputModelObjects.StructDecl): Lines => {
        const result = this.startRendering("StructDecl");

        const superClass = this.invariants.contextSuperClass ?? "ParserRuleContext";
        const ctorArgs = struct.ctorAttrs.map((a) => {
            return `, ${a.escapedName}${a.type ? ":" + a.type : ""}=None`;
        }).join("");

        result.push(
            `class ${struct.escapedName}(${superClass}):`,
            `    __slots__ = 'parser'`,
            ``,
            `    def __init__(self, parser, parent:ParserRuleContext=None, invokingState:int=-1${ctorArgs}):`,
            `        super().__init__(parent, invokingState)`,
            `        self.parser = parser`,
            ...this.indent(this.renderDecls(struct.attrs), 2),
        );

        for (const a of struct.ctorAttrs) {
            result.push(`        self.${a.escapedName} = ${a.escapedName}`);
        }

        result.push(
            ``,
            ...this.renderGetters(struct),
            `    def getRuleIndex(self):`,
            `        return ${this.invariants.recognizerName}.RULE_${struct.derivedFromName}`,
            ``,
        );

        // Don't need copy unless we have subclasses.
        if (struct.provideCopyFrom) {
            result.push(
                `    def copyFrom(self, ctx:ParserRuleContext):`,
                `        super().copyFrom(ctx)`,
            );

            for (const a of struct.attrs) {
                result.push(`        self.${a.escapedName} = ctx.${a.escapedName}`);
            }

            result.push(``);
        }

        result.push(...this.indent(this.renderDispatchMethods(struct)));

        for (const e of struct.extensionMembers) {
            result.push(...this.indent(this.renderAction(e as OutputModelObjects.Action)), ``);
        }

        result.push(``);

        return this.endRendering("StructDecl", result);
    };

    protected override renderAltLabelStructDecl = (currentRule: OutputModelObjects.RuleFunction,
        struct: OutputModelObjects.AltLabelStructDecl): Lines => {
        const result = this.startRendering("AltLabelStructDecl");

        const parentContext = `${this.toTitleCase(currentRule.name)}Context`;

        result.push(
            `class ${struct.escapedName}(${parentContext}):`,
            ``,
            `    def __init__(self, parser, ctx:ParserRuleContext): # actually a ` +
            `${this.invariants.recognizerName}.${parentContext}`,
            `        super().__init__(parser)`,
            ...this.indent(this.renderDecls(struct.attrs), 2),
            `        self.copyFrom(ctx)`,
            ``,
            ...this.renderGetters(struct),
            ...this.indent(this.renderDispatchMethods(struct)),
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

        result.push(parts.join(" or "));

        return this.endRendering("TestSetInline", result);
    };

    protected override renderTokenDecl = (t: OutputModelObjects.TokenDecl): Lines => {
        return [
            `self.${t.escapedName} = None # ${this.invariants.tokenLabelType}`,
        ];
    };

    protected override renderTokenTypeDecl = (srcOp: OutputModelObjects.TokenTypeDecl): Lines => {
        return [
            `self.${srcOp.escapedName} = 0 # ${this.invariants.tokenLabelType} type`,
        ];
    };

    protected override renderTokenListDecl = (t: OutputModelObjects.TokenListDecl): Lines => {
        return [
            `self.${t.escapedName} = list() # of ${this.invariants.tokenLabelType}s`,
        ];
    };

    protected override renderThrowNoViableAlt = (srcOp: OutputModelObjects.ThrowNoViableAlt): Lines => {
        return [
            `raise NoViableAltException(self)`,
        ];
    };

    protected override renderWildcard = (w: OutputModelObjects.Wildcard): Lines => {
        const result: Lines = this.startRendering("Wildcard");

        result.push(
            `self.state = ${w.stateNumber}`,
            `${this.renderLabelAssignments(w.labels)}self.matchWildcard()`,
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
            `while _alt!=${choice.exitAlt} and _alt!=ATN.INVALID_ALT_NUMBER:`,
            `    if _alt==1${!blockAST.greedy ? "+1" : ""}:`,
            ...this.indent(this.renderSourceOps(choice.iteration), 2),
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt), 2));
        });

        result.push(
            ...this.indent(this.renderSync(choice.loopBackStateNumber)),
            `    _alt = ${predict}`,
            ``,
        );

        return this.endRendering("StarBlock", result);
    };

    protected override renderPlusBlock = (choice: OutputModelObjects.PlusBlock): Lines => {
        const result: Lines = this.startRendering("PlusBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const nonGreedy = !blockAST.greedy ? "+1" : "";

        result.push(
            ...this.renderSync(choice.blockStartStateNumber), // Alt block decision.
            `_alt = 1${nonGreedy}`,
            `while _alt!=${choice.exitAlt} and _alt!=ATN.INVALID_ALT_NUMBER:`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `    ${index === 0 ? "if" : "elif"} _alt == ${index + 1}${nonGreedy}:`,
                ...this.indent(this.renderAlt(alt), 2),
            );
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(
            `    else:`,
            ...this.indent(this.renderThrowNoViableAlt(noViableAltObject), 2),
            ...this.indent(this.renderSync(choice.loopBackStateNumber)), // Loop back/exit decision.
            `    _alt = ${this.renderAdaptivePredict(choice.decision)}`,
            ``,
        );

        return this.endRendering("PlusBlock", result);
    };

    protected override renderOptionalBlock = (choice: OutputModelObjects.OptionalBlock): Lines => {
        const result: Lines = this.startRendering("OptionalBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(
            ...this.renderSync(choice.stateNumber),
            `la_ = ${this.renderAdaptivePredict(choice.decision)}`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `${index === 0 ? "if" : "elif"} la_ == ${index + 1}${!blockAST.greedy ? "+1" : ""}:`,
                ...this.indent(this.renderAlt(alt)),
            );
        });

        result.push(``);

        return this.endRendering("OptionalBlock", result);
    };

    protected override renderAltBlock = (choice: OutputModelObjects.AltBlock): Lines => {
        const result: Lines = this.startRendering("AltBlock");

        result.push(...this.renderSync(choice.stateNumber));

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = self._input.LT(1)`);
        }

        result.push(
            ...this.renderSourceOps(choice.preamble),
            `la_ = ${this.renderAdaptivePredict(choice.decision)}`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `${index === 0 ? "if" : "elif"} la_ == ${index + 1}:`,
                ...this.indent(this.renderAlt(alt)),
                `    pass`,
            );
        });

        result.push(``);

        return this.endRendering("AltBlock", result);
    };

    protected override renderInvokeRule = (r: OutputModelObjects.InvokeRule): Lines => {
        const result: Lines = this.startRendering("InvokeRule");

        const ast = r.ast as GrammarASTWithOptions | undefined;
        const precedence = ast?.getOptionString("p");
        const argExprs = this.renderActionChunks(r.argExprsChunks).join("").trim();

        let args = argExprs;
        if (precedence) {
            args = `${precedence}${argExprs.length > 0 ? "," : ""}${argExprs}`;
        }

        result.push(
            `self.state = ${r.stateNumber}`,
            `${this.renderLabelAssignments(r.labels)}self.${r.escapedName}(${args})`,
        );

        return this.endRendering("InvokeRule", result);
    };

    protected override renderSemPred = (p: OutputModelObjects.SemPred): Lines => {
        const result: Lines = this.startRendering("SemPred");

        const chunks = this.renderActionChunks(p.chunks).join("").trim();
        const failChunks = this.renderActionChunks(p.failChunks).join("").trim();

        let message = "";
        if (failChunks.length > 0) {
            message = `, ${failChunks}`;
        } else if (p.msg) {
            message = `, ${p.msg}`;
        }

        result.push(
            `self.state = ${p.stateNumber}`,
            `if not (${chunks}):`,
            `    from antlr4.error.Errors import FailedPredicateException`,
            `    raise FailedPredicateException(self, ${p.predicate}${message})`,
        );

        return this.endRendering("SemPred", result);
    };

    /**
     * Renders an action (a code block from the grammar). The text is split into lines and the common indentation
     * of all lines is removed, so that the action can be indented to the level of the surrounding code.
     * Leading and trailing blank lines are dropped.
     *
     * @param srcOp The action to render.
     *
     * @returns The rendered lines.
     */
    protected override renderAction = (srcOp?: OutputModelObjects.Action): Lines => {
        if (!srcOp) {
            return [];
        }

        const text = this.renderActionChunks(srcOp.chunks).join("");
        if (text.trim().length === 0) {
            return [];
        }

        return this.dedent(text.split("\n"));
    };

    protected renderRuleActionFunction(r: OutputModelObjects.RuleActionFunction): Lines {
        const result = this.startRendering("RuleActionFunction");

        result.push(
            `def ${r.escapedName}_action(self, localctx:${r.ctxType}, actionIndex:int):`,
        );

        let first = true;
        for (const [index, action] of r.actions) {
            result.push(
                `    ${first ? "if" : "elif"} actionIndex == ${index}:`,
                ...this.indent(this.renderBlockBody(this.renderAction(action)), 2),
            );
            first = false;
        }

        result.push(``);

        return this.endRendering("RuleActionFunction", result);
    }

    protected override renderRuleSempredFunction = (r: OutputModelObjects.RuleSempredFunction): Lines => {
        const result = this.startRendering("RuleSempredFunction");

        result.push(
            `def ${r.escapedName}_sempred(self, localctx:${r.ctxType}, predIndex:int):`,
        );

        let first = true;
        for (const [index, action] of r.actions) {
            const lines = this.renderAction(action);
            if (lines.length > 0) {
                lines[0] = `return ${lines[0]}`;
            }

            result.push(
                `    ${first ? "if" : "elif"} predIndex == ${index}:`,
                ...this.indent(lines, 2),
            );
            first = false;
        }

        result.push(``);

        return this.endRendering("RuleSempredFunction", result);
    };

    protected override renderSerializedATN = (model: OutputModelObjects.SerializedATN): Lines => {
        const result = this.startRendering("SerializedATN");

        result.push(
            `def serializedATN():`,
            `    return [`,
        );
        this.append(result, this.renderAnchoredList("        ", model.serialized.map(String), ","));
        result.push(
            `    ]`,
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
            return `localctx.${t.escapedName}`;
        }

        return t.escapedName;
    }

    protected renderCases(tokens: OutputModelObjects.ITokenInfo[]): string {
        const types = tokens.map((t) => {
            return String(t.type);
        });

        return `token in [${types.join(", ")}]`;
    }

    // Lexer command methods. These are only used for custom lexer commands, the standard commands are
    // handled by the lexer ATN directly.
    protected override renderLexerSkipCommand = (): Lines => {
        return [
            "self.skip()",
        ];
    };

    protected override renderLexerMoreCommand = (): Lines => {
        return [
            "self.more()",
        ];
    };

    protected override renderLexerPopModeCommand = (): Lines => {
        return [
            "self.popMode()",
        ];
    };

    protected override renderLexerTypeCommand = (arg: string): Lines => {
        return [
            `self._type = ${arg}`,
        ];
    };

    protected override renderLexerChannelCommand = (arg: string): Lines => {
        return [
            `self._channel = ${arg}`,
        ];
    };

    protected override renderLexerModeCommand = (arg: string): Lines => {
        return [
            `self._mode = ${arg}`,
        ];
    };

    protected override renderLexerPushModeCommand = (arg: string): Lines => {
        return [
            `self.pushMode(${arg})`,
        ];
    };

    protected override renderArgRef = (t: OutputModelObjects.ArgRef): Lines => {
        return [
            `localctx.${t.escapedName}`,
        ];
    };

    protected override renderListLabelRef = (t: OutputModelObjects.ListLabelRef): Lines => {
        return [
            `${this.renderContext(t)}.${this.renderListLabelName(t.escapedName)}`,
        ];
    };

    protected override renderLocalRef = (a: OutputModelObjects.LocalRef): Lines => {
        return [
            `localctx.${a.escapedName}`,
        ];
    };

    protected override renderNonLocalAttrRef = (s: OutputModelObjects.NonLocalAttrRef): Lines => {
        return [
            `self.getInvokingContext(${s.ruleIndex}).${s.escapedName}`,
        ];
    };

    protected override renderQRetValueRef = (a: OutputModelObjects.QRetValueRef): Lines => {
        return [
            `${this.renderContext(a)}.${a.dict}.${a.escapedName}`,
        ];
    };

    protected override renderRetValueRef = (t: OutputModelObjects.RetValueRef): Lines => {
        return [
            `localctx.${t.escapedName}`,
        ];
    };

    protected override renderRulePropertyRef = (t: OutputModelObjects.RulePropertyRef): Lines => {
        return [
            `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`,
        ];
    };

    protected override renderRulePropertyRefCtx = (t: OutputModelObjects.RulePropertyRefCtx): Lines => {
        return [
            `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`,
        ];
    };

    protected override renderRulePropertyRefParser = (t: OutputModelObjects.RulePropertyRefParser): Lines => {
        return [
            `self`,
        ];
    };

    protected override renderRulePropertyRefStart = (t: OutputModelObjects.RulePropertyRefStart): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [
            `(None if ${ref} is None else ${ref}.start)`,
        ];
    };

    protected override renderRulePropertyRefStop = (t: OutputModelObjects.RulePropertyRefStop): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [
            `(None if ${ref} is None else ${ref}.stop)`,
        ];
    };

    protected override renderRulePropertyRefText = (t: OutputModelObjects.RulePropertyRefText): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [
            `(None if ${ref} is None else self._input.getText(${ref}.start,${ref}.stop))`,
        ];
    };

    protected override renderSetAttr = (s: OutputModelObjects.SetAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        return [
            `${this.renderContext(s)}.${s.escapedName} = ${rhs}`,
        ];
    };

    protected override renderSetNonLocalAttr = (s: OutputModelObjects.SetNonLocalAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        return [
            `self.getInvokingContext(${s.ruleIndex}).${s.escapedName} = ${rhs}`,
        ];
    };

    protected override renderThisRulePropertyRefCtx = (t: OutputModelObjects.ThisRulePropertyRefCtx): Lines => {
        return [
            `localctx`,
        ];
    };

    protected override renderThisRulePropertyRefParser = (t: OutputModelObjects.ThisRulePropertyRefParser): Lines => {
        return [
            `self`,
        ];
    };

    protected override renderThisRulePropertyRefStart = (t: OutputModelObjects.ThisRulePropertyRefStart): Lines => {
        return [
            `localctx.start`,
        ];
    };

    protected override renderThisRulePropertyRefStop = (t: OutputModelObjects.ThisRulePropertyRefStop): Lines => {
        return [
            `localctx.stop`,
        ];
    };

    protected override renderThisRulePropertyRefText = (t: OutputModelObjects.ThisRulePropertyRefText): Lines => {
        return [
            `self._input.getText(localctx.start, self._input.LT(-1))`,
        ];
    };

    protected override renderTokenPropertyRefChannel = (t: OutputModelObjects.TokenPropertyRefChannel): Lines => {
        return [this.renderTokenProperty(t, "channel", "0")];
    };

    protected override renderTokenPropertyRefIndex = (t: OutputModelObjects.TokenPropertyRefIndex): Lines => {
        return [this.renderTokenProperty(t, "tokenIndex", "0")];
    };

    protected override renderTokenPropertyRefInt = (t: OutputModelObjects.TokenPropertyRefInt): Lines => {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return [
            `(0 if ${ref} is None else int(${ref}.text))`,
        ];
    };

    protected override renderTokenPropertyRefLine = (t: OutputModelObjects.TokenPropertyRefLine): Lines => {
        return [this.renderTokenProperty(t, "line", "0")];
    };

    protected override renderTokenPropertyRefPos = (t: OutputModelObjects.TokenPropertyRefPos): Lines => {
        return [this.renderTokenProperty(t, "column", "0")];
    };

    protected override renderTokenPropertyRefText = (t: OutputModelObjects.TokenPropertyRefText): Lines => {
        return [this.renderTokenProperty(t, "text", "None")];
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
        const superClass = parser.superClass ? this.renderActionChunks([parser.superClass]).join("") : undefined;

        if (superClass) {
            result.push(...this.renderSuperClassImport(superClass));
        }

        result.push(
            ...this.renderSerializedATN(parser.atn),
            ``,
            `class ${parserName} ( ${superClass ?? "Parser"} ):`,
            ``,
            `    grammarFileName = "${parser.grammarFileName}"`,
            ``,
            `    atn = ATNDeserializer().deserialize(serializedATN())`,
            ``,
            `    decisionsToDFA = [ DFA(ds, i) for i, ds in enumerate(atn.decisionToState) ]`,
            ``,
            `    sharedContextCache = PredictionContextCache()`,
            ``,
            ...this.renderAnchoredList(`    literalNames = [ `, this.renderNames(parser.literalNames), ", ", " ]"),
            ``,
            ...this.renderAnchoredList(`    symbolicNames = [ `, this.renderNames(parser.symbolicNames), ", ",
                " ]"),
            ``,
        );

        for (const r of parser.rules) {
            result.push(`    RULE_${r.name} = ${r.index}`);
        }

        result.push(
            ``,
            ...this.renderAnchoredList(`    ruleNames =  [ `, Array.from(parser.ruleNames, (r) => {
                return `"${r}"`;
            }), ", ", " ]"),
            ``,
            `    EOF = ${this.invariants.tokenLabelType}.EOF`,
        );

        for (const [name, type] of parser.tokens) {
            result.push(`    ${name}=${type}`);
        }

        result.push(
            ``,
            `    def __init__(self, input:TokenStream, output:TextIO = sys.stdout):`,
            `        super().__init__(input, output)`,
            `        self.checkVersion("${Python3TargetGenerator.runtimeVersion}")`,
            `        self._interp = ParserATNSimulator(self, self.atn, self.decisionsToDFA, ` +
            `self.sharedContextCache)`,
            `        self._predicates = None`,
            ``,
            ``,
        );

        const members = namedActions.get("members");
        if (members) {
            result.push(...this.indent(this.renderAction(members)), ``);
        }

        this.append(result, this.indent(this.renderRuleFunctions(namedActions, parser.funcs)));

        if (parser.sempredFuncs.size > 0) {
            result.push(
                `    def sempred(self, localctx:RuleContext, ruleIndex:int, predIndex:int):`,
                `        if self._predicates == None:`,
                `            self._predicates = dict()`,
            );

            const funcs: Lines = [];
            for (const f of parser.sempredFuncs.values()) {
                result.push(`            self._predicates[${f.ruleIndex}] = self.${f.escapedName}_sempred`);
                funcs.push(...this.renderRuleSempredFunction(f), ``);
            }

            result.push(
                `        pred = self._predicates.get(ruleIndex, None)`,
                `        if pred is None:`,
                `            raise Exception("No predicate with index:" + str(ruleIndex))`,
                `        else:`,
                `            return pred(localctx, predIndex)`,
                ``,
            );
            this.append(result, this.indent(funcs));
        }

        return result;
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const lexerName = lexer.name;
        const superClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]).join("") : undefined;

        if (superClass) {
            result.push(...this.renderSuperClassImport(superClass));
        }

        result.push(
            ...this.renderSerializedATN(lexer.atn),
            ``,
            `class ${lexerName}(${superClass ?? "Lexer"}):`,
            ``,
            `    atn = ATNDeserializer().deserialize(serializedATN())`,
            ``,
            `    decisionsToDFA = [ DFA(ds, i) for i, ds in enumerate(atn.decisionToState) ]`,
            ``,
        );

        if (lexer.escapedChannels.size > 0) {
            for (const [name, value] of lexer.escapedChannels) {
                result.push(`    ${name} = ${value}`);
            }

            result.push(``);
        }

        // The first mode is always the default mode, which needs no constant.
        const modes = lexer.escapedModeNames.slice(1);
        if (modes.length > 0) {
            modes.forEach((m, i) => {
                result.push(`    ${m} = ${i + 1}`);
            });

            result.push(``);
        }

        for (const [name, type] of lexer.tokens) {
            result.push(`    ${name} = ${type}`);
        }

        const channelNames = ["DEFAULT_TOKEN_CHANNEL", "HIDDEN", ...lexer.channelNames].map((c) => {
            return `u"${c}"`;
        });

        result.push(
            ``,
            ...this.renderAnchoredList(`    channelNames = [ `, channelNames, ", ", " ]"),
            ``,
            ...this.renderAnchoredList(`    modeNames = [ `, lexer.modes.map((m) => {
                return `"${m}"`;
            }), ", ", " ]"),
            ``,
            `    literalNames = [ "<INVALID>",`,
            ...this.renderAnchoredList(`            `, this.renderNames(lexer.literalNames).slice(1), ", ", " ]"),
            ``,
            `    symbolicNames = [ "<INVALID>",`,
            ...this.renderAnchoredList(`            `, this.renderNames(lexer.symbolicNames).slice(1), ", ", " ]"),
            ``,
            ...this.renderAnchoredList(`    ruleNames = [ `, Array.from(lexer.ruleNames, (r) => {
                return `"${r}"`;
            }), ", ", " ]"),
            ``,
            `    grammarFileName = "${lexer.grammarFileName}"`,
            ``,
            `    def __init__(self, input=None, output:TextIO = sys.stdout):`,
            `        super().__init__(input, output)`,
            `        self.checkVersion("${Python3TargetGenerator.runtimeVersion}")`,
            `        self._interp = LexerATNSimulator(self, self.atn, self.decisionsToDFA, PredictionContextCache())`,
            `        self._actions = None`,
            `        self._predicates = None`,
            ``,
        );

        const members = namedActions.get("members");
        if (members) {
            result.push(...this.indent(this.renderAction(members)), ``);
        }

        this.append(result, this.indent(this.renderActionHandlers(lexer)));

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
                `def action(self, localctx:RuleContext, ruleIndex:int, actionIndex:int):`,
                `    if self._actions is None:`,
                `        actions = dict()`,
            );

            const funcs: Lines = [];
            for (const f of lexer.actionFuncs.values()) {
                result.push(`        actions[${f.ruleIndex}] = self.${f.escapedName}_action`);
                funcs.push(...this.renderRuleActionFunction(f));
            }

            result.push(
                `        self._actions = actions`,
                `    action = self._actions.get(ruleIndex, None)`,
                `    if action is not None:`,
                `        action(localctx, actionIndex)`,
                `    else:`,
                `        raise Exception("No registered action for:" + str(ruleIndex))`,
                ``,
                ...funcs,
            );
        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(
                `def sempred(self, localctx:RuleContext, ruleIndex:int, predIndex:int):`,
                `    if self._predicates is None:`,
                `        preds = dict()`,
            );

            const funcs: Lines = [];
            for (const f of lexer.sempredFuncs.values()) {
                result.push(`        preds[${f.ruleIndex}] = self.${f.escapedName}_sempred`);
                funcs.push(...this.renderRuleSempredFunction(f));
            }

            result.push(
                `        self._predicates = preds`,
                `    pred = self._predicates.get(ruleIndex, None)`,
                `    if pred is not None:`,
                `        return pred(localctx, predIndex)`,
                `    else:`,
                `        raise Exception("No registered predicate for:" + str(ruleIndex))`,
                ``,
                ...funcs,
            );
        }

        return this.endRendering("actionHandlers", result);
    }

    /**
     * Renders the import block which is shared by parser and lexer files.
     *
     * @returns The rendered lines.
     */
    private renderImports(): Lines {
        return [
            `from antlr4 import *`,
            `from io import StringIO`,
            `import sys`,
            `if sys.version_info[1] > 5:`,
            `    from typing import TextIO`,
            `else:`,
            `    from typing.io import TextIO`,
        ];
    }

    /**
     * Renders the import of the parser class in listener and visitor files, which works both when the files are
     * part of a package and when they are used standalone.
     *
     * @param parserName The name of the parser class.
     *
     * @returns The rendered lines.
     */
    private renderParserImport(parserName: string): Lines {
        return [
            `from antlr4 import *`,
            `if "." in __name__:`,
            `    from .${parserName} import ${parserName}`,
            `else:`,
            `    from ${parserName} import ${parserName}`,
        ];
    }

    private renderSuperClassImport(superClass: string): Lines {
        return [
            `if "." in __name__:`,
            `    from .${superClass} import ${superClass}`,
            `else:`,
            `    from ${superClass} import ${superClass}`,
            ``,
        ];
    }

    /**
     * Renders the rule context class and the alt label context classes of a rule.
     *
     * @param currentRule The rule to render the contexts for.
     *
     * @returns The rendered lines.
     */
    private renderRuleContexts(currentRule: OutputModelObjects.RuleFunction): Lines {
        const result: Lines = [];

        result.push(...this.renderStructDecl(currentRule.ruleCtx));
        currentRule.altLabelCtxs?.forEach((ctx) => {
            result.push(...this.renderAltLabelStructDecl(currentRule, ctx));
        });

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
        return [
            ...this.renderSourceOps(currentRule.code),
            ...this.renderSourceOps(currentRule.postamble),
            ...this.renderAction(currentRule.namedActions?.get("after")),
        ];
    }

    /**
     * Renders the context getter methods (e.g. `ID()`, `expr()`) of a struct.
     *
     * @param struct The struct to render the getters for.
     *
     * @returns The rendered lines, each getter followed by an empty line.
     */
    private renderGetters(struct: OutputModelObjects.StructDecl): Lines {
        const result: Lines = [];

        for (const getter of struct.getters) {
            const lines = this.renderDecls([getter]);
            if (lines.length > 0) {
                result.push(...this.indent(lines), ``);
            }
        }

        return result;
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
        return `self._interp.adaptivePredict(self._input,${decision},self._ctx)`;
    }

    private renderSync(stateNumber: number): Lines {
        return [
            `self.state = ${stateNumber}`,
            `self._errHandler.sync(self)`,
        ];
    }

    /**
     * Renders the assignment prefix for labeled elements, e.g. `localctx.name = `.
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
     * @param defaultValue The value to return when the token is None.
     *
     * @returns The rendered expression.
     */
    private renderTokenProperty(t: TokenPropertyRef, property: string, defaultValue: string): string {
        const ref = `${this.renderContext(t)}.${this.escapeIfNeeded(t.label)}`;

        return `(${defaultValue} if ${ref} is None else ${ref}.${property})`;
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

        return `(((${shiftVar}) & ~0x3f) == 0 and ((1 << ${shiftVar}) & ${bits.calculated}) != 0)`;
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `${s.varName}==${t.type}`;
        }).join(" or ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        return offset > 0 ? `(${shiftAmount} - ${offset})` : shiftAmount;
    }

    private renderCommonSetStuff = (m: OutputModelObjects.MatchSet, invert: boolean): Lines => {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`self.state = ${m.stateNumber}`);

        if (m.labels.length > 0) {
            result.push(`${this.renderLabelAssignments(m.labels)}self._input.LT(1)`);
        }

        result.push(...this.renderCaptureNextTokenType(m.capture));

        const expr = this.renderTestSetInline(m.expr).join("");
        if (invert) {
            result.push(`if ${m.expr.varName} <= 0 or ${expr}:`);
        } else {
            result.push(`if not(${expr}):`);
        }

        result.push(
            `    ${this.renderLabelAssignments(m.labels)}self._errHandler.recoverInline(self)`,
            `else:`,
            `    self._errHandler.reportMatch(self)`,
            `    self.consume()`,
        );

        return this.endRendering("CommonSetStuff", result);
    };

    /**
     * Renders the vocabulary entries (literal or symbolic names). Missing entries are rendered as `"<INVALID>"`,
     * to keep the token type as index into the list.
     *
     * @param names The names to render.
     *
     * @returns The rendered names.
     */
    private renderNames(names: Array<string | null>): string[] {
        return names.map((name) => {
            return name ?? `"<INVALID>"`;
        });
    }

    /**
     * Renders the parameter list for a rule function (each parameter prefixed with a comma).
     *
     * @param args The rule arguments.
     *
     * @returns The rendered parameter list.
     */
    private renderArgs(args?: OutputModelObjects.AttributeDecl[]): string {
        return args?.map((a) => {
            return `, ${a.escapedName}${a.type ? ":" + a.type : ""}`;
        }).join("") ?? "";
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
     * Renders a list of items with wrapping, in the style of the old StringTemplate output: the first line starts
     * with the given prefix and continuation lines are indented to the length of the prefix (anchor).
     * A line break is inserted before an item when the current line has reached the line width.
     *
     * @param prefix The text which starts the first line.
     * @param items The items to render.
     * @param separator The separator between items.
     * @param suffix The text to append to the last line.
     *
     * @returns The rendered lines.
     */
    private renderAnchoredList(prefix: string, items: string[], separator: string, suffix = ""): Lines {
        const result: Lines = [];
        const anchor = " ".repeat(prefix.length);

        let line = prefix;
        for (let i = 0; i < items.length; ++i) {
            if (i > 0) {
                line += separator;
                if (line.length >= Python3TargetGenerator.lineWidth) {
                    result.push(line);
                    line = anchor;
                }
            }

            line += items[i];
        }

        result.push(line + suffix);

        return result;
    }

    /**
     * Makes sure a block body is not empty (which is a syntax error in Python).
     *
     * @param lines The rendered body.
     *
     * @returns The body, or a `pass` statement if the body is empty.
     */
    private renderBlockBody(lines: Lines): Lines {
        if (lines.length === 0) {
            return [`pass`];
        }

        return lines;
    }

    /**
     * Removes leading and trailing blank lines, trailing whitespace and the common indentation of all remaining
     * lines.
     *
     * @param lines The lines to process.
     *
     * @returns The processed lines.
     */
    private dedent(lines: string[]): Lines {
        lines = lines.map((line) => {
            return line.trimEnd();
        });

        while (lines.length > 0 && lines[0].length === 0) {
            lines.shift();
        }

        while (lines.length > 0 && lines[lines.length - 1].length === 0) {
            lines.pop();
        }

        let common = Number.MAX_SAFE_INTEGER;
        for (const line of lines) {
            if (line.length > 0) {
                const indentation = /^[ \t]*/.exec(line)![0].length;
                common = Math.min(common, indentation);
            }
        }

        return lines.map((line) => {
            return line.length === 0 ? "" : line.substring(common);
        });
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
     * Prefixes all non-empty lines with the given number of indentation levels (4 spaces each). Undefined
     * lines are removed.
     *
     * @param lines The lines to indent.
     * @param levels The number of levels to indent.
     *
     * @returns The indented lines.
     */
    private indent(lines: Lines, levels = 1): Lines {
        const prefix = "    ".repeat(levels);
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
