/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// PHP target generator - based on the PHP.stg template of ANTLR4.

// cspell: ignore endswitch endwhile insteadof

import * as OutputModelObjects from "../codegen/model/index.js";

import { GeneratorBase, type NamedActions } from "../codegen/GeneratorBase.js";
import type { CodePoint, ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { TokenPropertyRef } from "../codegen/model/chunk/TokenPropertyRef.js";
import type { IGenerationOptions } from "../config/config.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import { antlrVersion } from "../version.js";

export class PHPTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.php";
    public readonly version = "1.0.0";

    public readonly language = "PHP";
    public readonly languageSpecifiers = ["php"];

    public override readonly codeFileExtension = ".php";

    public override readonly lexerRuleContext = "RuleContext";

    public override readonly wantsBaseListener = true;
    public override readonly wantsBaseVisitor = true;
    public override readonly supportsOverloadedMethods = false;
    public override readonly isATNSerializedAsInts = true;
    public override readonly inlineTestSetWordSize = 64;

    public override readonly reservedWords = new Set([
        "abstract", "and", "array", "as",
        "break",
        "callable", "case", "catch", "class", "clone", "const", "continue",
        "declare", "default", "die", "do",
        "echo", "else", "elseif", "empty", "enddeclare", "endfor", "endforeach",
        "endif", "endswitch", "endwhile", "eval", "exit", "extends",
        "final", "finally", "for", "foreach", "function",
        "global", "goto",
        "if", "implements", "include", "include_once", "instanceof", "insteadof", "interface", "isset",
        "list",
        "namespace", "new",
        "or",
        "print", "private", "protected", "public",
        "require", "require_once", "return",
        "static", "switch",
        "throw", "trait", "try",
        "unset", "use",
        "var",
        "while",
        "xor",
        "yield",
        "__halt_compiler", "__CLASS__", "__DIR__", "__FILE__", "__FUNCTION__",
        "__LINE__", "__METHOD__", "__NAMESPACE__", "__TRAIT__",

        "rule", "parserRule",
    ]);

    /**
     * The ANTLR version the PHP runtime is checked against (`RuntimeMetaData::checkVersion`). The runtime prints
     * a warning when the major/minor version of the generating tool differs from its own, so we pass the ANTLR
     * version the runtime was built for, not the antlr-ng version.
     */
    private static readonly runtimeVersion = "4.13.2";

    private escapeMap: Map<CodePoint, string>;

    public constructor(logRendering = false) {
        super(logRendering);

        // https://www.php.net/manual/en/language.types.string.php
        this.escapeMap = new Map(GeneratorBase.defaultCharValueEscape);
        this.escapeMap.set(0x0B, "\\v");
        this.escapeMap.set(0x1B, "\\e");
        this.escapeMap.set(0x24, "\\$");
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
        this.append(result, this.renderParser(parser, parserFile.namedActions, options));

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
            ...this.renderNamespace(options),
            ...this.renderAction(listenerFile.header),
            `use Antlr\\Antlr4\\Runtime\\Tree\\ParseTreeListener;`,
            ``,
            `/**`,
            ` * This interface defines a complete listener for a parse tree produced by`,
            ` * {@see ${parserName}}.`,
            ` */`,
            `interface ${grammarName}Listener extends ParseTreeListener {`,
        );

        for (const lname of listenerFile.listenerNames) {
            const name = this.toTitleCase(lname);
            const ruleName = listenerFile.listenerLabelRuleNames.get(lname);
            const block: Lines = [`/**`];

            if (ruleName) {
                block.push(
                    ` * Enter a parse tree produced by the \`${lname}\``,
                    ` * labeled alternative in {@see ${parserName}::${ruleName}()}.`,
                );
            } else {
                block.push(` * Enter a parse tree produced by {@see ${parserName}::${lname}()}.`);
            }

            block.push(
                ` * @param $context The parse tree.`,
                ` */`,
                `public function enter${name}(Context\\${name}Context $context): void;`,
                `/**`,
            );

            if (ruleName) {
                block.push(
                    ` * Exit a parse tree produced by the \`${lname}\` labeled alternative`,
                    ` * in {@see ${parserName}::${ruleName}()}.`,
                );
            } else {
                block.push(` * Exit a parse tree produced by {@see ${parserName}::${lname}()}.`);
            }

            block.push(
                ` * @param $context The parse tree.`,
                ` */`,
                `public function exit${name}(Context\\${name}Context $context): void;`,
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

        const grammarName = listenerFile.grammarName;
        const result: Lines = this.renderFileHeader(listenerFile);

        result.push(
            ...this.renderNamespace(options),
            ...this.renderAction(listenerFile.header),
            ``,
            `use Antlr\\Antlr4\\Runtime\\ParserRuleContext;`,
            `use Antlr\\Antlr4\\Runtime\\Tree\\ErrorNode;`,
            `use Antlr\\Antlr4\\Runtime\\Tree\\TerminalNode;`,
            ``,
            `/**`,
            ` * This class provides an empty implementation of {@see ${grammarName}Listener},`,
            ` * which can be extended to create a listener which only needs to handle a subset`,
            ` * of the available methods.`,
            ` */`,
            `class ${grammarName}BaseListener implements ${grammarName}Listener`,
            `{`,
        );

        const names = Array.from(listenerFile.listenerNames);
        names.forEach((lname, index) => {
            const name = this.toTitleCase(lname);
            const block: Lines = [
                `/**`,
                ` * {@inheritdoc}`,
                ` *`,
                ` * The default implementation does nothing.`,
                ` */`,
                `public function enter${name}(Context\\${name}Context $context): void {}`,
                ``,
                `/**`,
                ` * {@inheritdoc}`,
                ` *`,
                ` * The default implementation does nothing.`,
                ` */`,
                `public function exit${name}(Context\\${name}Context $context): void {}`,
            ];

            result.push(...this.indent(block));
            if (index < names.length - 1) {
                result.push(``);
            }
        });

        result.push(
            ``,
            `    /**`,
            `     * {@inheritdoc}`,
            `     *`,
            `     * The default implementation does nothing.`,
            `     */`,
            `    public function enterEveryRule(ParserRuleContext $context): void {}`,
            ``,
            `    /**`,
            `     * {@inheritdoc}`,
            `     *`,
            `     * The default implementation does nothing.`,
            `     */`,
            `    public function exitEveryRule(ParserRuleContext $context): void {}`,
            ``,
            `    /**`,
            `     * {@inheritdoc}`,
            `     *`,
            `     * The default implementation does nothing.`,
            `     */`,
            `    public function visitTerminal(TerminalNode $node): void {}`,
            ``,
            `    /**`,
            `     * {@inheritdoc}`,
            `     *`,
            `     * The default implementation does nothing.`,
            `     */`,
            `    public function visitErrorNode(ErrorNode $node): void {}`,
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
            ...this.renderNamespace(options),
            ...this.renderAction(visitorFile.header),
            `use Antlr\\Antlr4\\Runtime\\Tree\\ParseTreeVisitor;`,
            ``,
            `/**`,
            ` * This interface defines a complete generic visitor for a parse tree produced by {@see ${parserName}}.`,
            ` */`,
            `interface ${grammarName}Visitor extends ParseTreeVisitor`,
            `{`,
        );

        const names = Array.from(visitorFile.visitorNames);
        names.forEach((lname, index) => {
            const name = this.toTitleCase(lname);
            const ruleName = visitorFile.visitorLabelRuleNames.get(lname);
            const block: Lines = [`/**`];

            if (ruleName) {
                block.push(
                    ` * Visit a parse tree produced by the \`${lname}\` labeled alternative`,
                    ` * in {@see ${parserName}::${ruleName}()}.`,
                );
            } else {
                block.push(` * Visit a parse tree produced by {@see ${parserName}::${lname}()}.`);
            }

            block.push(
                ` *`,
                ` * @param Context\\${name}Context $context The parse tree.`,
                ` *`,
                ` * @return mixed The visitor result.`,
                ` */`,
                `public function visit${name}(Context\\${name}Context $context);`,
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
            ...this.renderNamespace(options),
            ...this.renderAction(visitorFile.header),
            `use Antlr\\Antlr4\\Runtime\\Tree\\AbstractParseTreeVisitor;`,
            ``,
            `/**`,
            ` * This class provides an empty implementation of {@see ${grammarName}Visitor},`,
            ` * which can be extended to create a visitor which only needs to handle a subset`,
            ` * of the available methods.`,
            ` */`,
            `class ${grammarName}BaseVisitor extends AbstractParseTreeVisitor implements ${grammarName}Visitor`,
            `{`,
        );

        const names = Array.from(visitorFile.visitorNames);
        names.forEach((lname, index) => {
            const name = this.toTitleCase(lname);
            const block: Lines = [
                `/**`,
                ` * {@inheritdoc}`,
                ` *`,
                ` * The default implementation returns the result of calling`,
                ` * {@see self::visitChildren()} on \`context\`.`,
                ` */`,
                `public function visit${name}(Context\\${name}Context $context)`,
                `{`,
                `    return $this->visitChildren($context);`,
                `}`,
            ];

            result.push(...this.indent(block));
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
            `\\$localContext = new Context\\${this.toTitleCase(ctxName)}Context(\\$localContext);\n` +
            `\\$this->ctx = \\$localContext;\n` +
            `\\$previousContext = \\$localContext;`,
        ];
    };

    // The predicate and the return action are run through the action translator, so dollar signs which are
    // not attribute references must be escaped.
    public renderRecRuleAltPredicate = (ruleName: string, opPrec: number): Lines => {
        return [
            `\\$this->precpred(\\$this->ctx, ${opPrec})`,
        ];
    };

    public renderRecRuleSetReturnAction = (src: string, name: string): Lines => {
        return [
            `\\$${name} = \\$${src}->${name};`,
        ];
    };

    public renderRecRuleSetStopToken = (): Lines => {
        return [
            `\\$this->ctx->stop = \\$this->input->LT(-1);`,
        ];
    };

    public renderRecRuleSetPrevCtx = (): Lines => {
        return [
            `if (\\$this->getParseListeners() !== null) {\n` +
            `    \\$this->triggerExitRuleEvent();\n` +
            `}\n` +
            `\n` +
            `\\$previousContext = \\$localContext;`,
        ];
    };

    public renderRecRuleLabeledAltStartAction = (parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [
            `\\$localContext = new Context\\${this.toTitleCase(currentAltLabel)}Context(` +
            `new Context\\${this.toTitleCase(ruleName)}Context(\\$parentContext, \\$parentState));`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`\\$localContext->${label}[] = \\$previousContext;`);
            } else {
                result.push(`\\$localContext->${label} = \\$previousContext;`);
            }
        }

        result.push(
            ``,
            `\\$this->pushNewRecursionContext(\\$localContext, \\$startState, self::RULE_${ruleName});`,
        );

        return [result.join("\n")];
    };

    public renderRecRuleAltStartAction = (parserName: string, ruleName: string, ctxName: string,
        label: string | undefined, isListLabel: boolean): Lines => {
        const result: Lines = [
            `\\$localContext = new Context\\${this.toTitleCase(ctxName)}Context(\\$parentContext, \\$parentState);`,
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`\\$localContext->${label}[] = \\$previousContext;`);
            } else {
                result.push(`\\$localContext->${label} = \\$previousContext;`);
            }
        }

        result.push(
            ``,
            `\\$this->pushNewRecursionContext(\\$localContext, \\$startState, self::RULE_${ruleName});`,
        );

        return [result.join("\n")];
    };

    public renderTestFile = (grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string => {
        const result: Lines = [
            `<?php`,
            ``,
            `declare(strict_types=1);`,
            ``,
            `use Antlr\\Antlr4\\Runtime\\Atn\\ParserATNSimulator;`,
            `use Antlr\\Antlr4\\Runtime\\CommonTokenStream;`,
            `use Antlr\\Antlr4\\Runtime\\Error\\Listeners\\ConsoleErrorListener;`,
            `use Antlr\\Antlr4\\Runtime\\Error\\Listeners\\DiagnosticErrorListener;`,
            `use Antlr\\Antlr4\\Runtime\\InputStream;`,
            `use Antlr\\Antlr4\\Runtime\\Lexer;`,
            `use Antlr\\Antlr4\\Runtime\\ParserRuleContext;`,
            `use Antlr\\Antlr4\\Runtime\\Tree\\ErrorNode;`,
            `use Antlr\\Antlr4\\Runtime\\Tree\\ParseTreeListener;`,
            `use Antlr\\Antlr4\\Runtime\\Tree\\ParseTreeWalker;`,
            `use Antlr\\Antlr4\\Runtime\\Tree\\RuleNode;`,
            `use Antlr\\Antlr4\\Runtime\\Tree\\TerminalNode;`,
            `use Antlr\\Antlr4\\Runtime\\Atn\\PredictionMode;`,
            ``,
            `$runtime = \\getenv('RUNTIME');`,
            ``,
            `require_once $runtime . '/vendor/autoload.php';`,
            ``,
            `\\spl_autoload_register(function (string $class) use ($runtime) : void {`,
            `    $file = \\str_replace('\\\\', \\DIRECTORY_SEPARATOR, $class) . '.php';`,
            ``,
            `    if (\\file_exists($file)) {`,
            `        require_once $file;`,
            `    }`,
            `});`,
            ``,
        ];

        if (parserName !== undefined) {
            result.push(
                `final class TreeShapeListener implements ParseTreeListener {`,
                `    public function visitTerminal(TerminalNode $node) : void {}`,
                `    public function visitErrorNode(ErrorNode $node) : void {}`,
                `    public function exitEveryRule(ParserRuleContext $ctx) : void {}`,
                ``,
                `    public function enterEveryRule(ParserRuleContext $ctx) : void {`,
                `        for ($i = 0, $count = $ctx->getChildCount(); $i < $count; $i++) {`,
                `            $parent = $ctx->getChild($i)->getParent();`,
                ``,
                `            if (!($parent instanceof RuleNode) || $parent->getRuleContext() !== $ctx) {`,
                `                throw new RuntimeException('Invalid parse tree shape detected.');`,
                `            }`,
                `        }`,
                `    }`,
                `}`,
                ``,
            );
        }

        result.push(
            `$input = InputStream::fromPath($argv[1]);`,
            `$lexer = new ${lexerName}($input);`,
            `$lexer->addErrorListener(new ConsoleErrorListener());`,
            `$tokens = new CommonTokenStream($lexer);`,
        );

        if (parserName !== undefined) {
            result.push(
                `$parser = new ${parserName}($tokens);`,
                `$parser->getInterpreter()->setPredictionMode(PredictionMode::${predictionMode});`,
            );

            if (!buildParseTree) {
                result.push(`$parser->setBuildParseTree(false);`);
            }

            if (showDiagnosticErrors) {
                result.push(`$parser->addErrorListener(new DiagnosticErrorListener());`);
            }

            result.push(`$parser->addErrorListener(new ConsoleErrorListener());`);

            if (traceATN) {
                result.push(`ParserATNSimulator::$traceAtnSimulation = true;`);
            }

            result.push(
                `$tree = $parser->${parserStartRuleName ?? ""}();`,
                ``,
                `ParseTreeWalker::default()->walk(new TreeShapeListener(), $tree);`,
            );
        } else {
            result.push(
                `$tokens->fill();`,
                ``,
                `foreach ($tokens->getAllTokens() as $token) {`,
                `    echo $token . \\PHP_EOL;`,
                `}`,
            );

            if (showDFA) {
                result.push(`echo $lexer->getInterpreter()->getDFA(Lexer::DEFAULT_MODE)->toLexerString();`);
            }
        }

        return this.finish(result);
    };

    public override get charValueEscapeMap(): Map<CodePoint, string> {
        return this.escapeMap;
    }

    public override getTargetStringLiteralFromANTLRStringLiteral(literal: string, addQuotes: boolean,
        escapeSpecial?: boolean): string {
        const result = super.getTargetStringLiteralFromANTLRStringLiteral(literal, addQuotes, escapeSpecial);

        // Dollar signs would be interpreted as variable references in double quoted PHP strings.
        return result.replaceAll("$", "\\$");
    }

    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [
            `<?php`,
            ``,
            `// Generated from ${file.grammarFileName} by antlr-ng ${antlrVersion}. Do not edit!`,
        ];
    }

    protected override renderTypedContext = (ctx: OutputModelObjects.StructDecl): string => {
        return `$localContext`;
    };

    protected override renderRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.RuleFunction): Lines => {
        const result = this.startRendering("RuleFunction");

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") + " " : "";
        const args = this.renderArgs(currentRule.args);
        const callArgs = this.renderCallArgs(currentRule.args);
        const ctxType = `Context\\${currentRule.ctxType}`;

        result.push(
            `/**`,
            ` * @throws RecognitionException`,
            ` */`,
            `${modifiers}public function ${currentRule.name}(${args}): ${ctxType}`,
            `{`,
            `    $localContext = new ${ctxType}($this->ctx, $this->getState()${callArgs});`,
            ``,
            `    $this->enterRule($localContext, ${currentRule.startState.stateNumber}, ` +
            `self::RULE_${currentRule.name});`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ``,
            `    try {`,
            ...this.indent(this.renderRuleBody(currentRule), 2),
        );

        // The catch clauses continue the line with the closing brace of the try block.
        const handlers: Lines = [];
        if (currentRule.exceptions && currentRule.exceptions.length > 0) {
            for (const e of currentRule.exceptions) {
                handlers.push(...this.renderExceptionClause(e));
            }
        } else {
            handlers.push(
                `catch (RecognitionException $exception) {`,
                `    $localContext->exception = $exception;`,
                `    $this->errorHandler->reportError($this, $exception);`,
                `    $this->errorHandler->recover($this, $exception);`,
                `}`,
            );
        }

        handlers.push(
            `finally {`,
            ...this.indent(this.renderAction(currentRule.finallyAction)),
            `    $this->exitRule();`,
            `}`,
        );

        result.push(...this.indent(this.joinBraces(handlers)));
        result.push(
            ``,
            `    return $localContext;`,
            `}`,
            ``,
        );

        return this.endRendering("RuleFunction", result);
    };

    protected override renderLeftRecursiveRuleFunction = (namedActions: NamedActions,
        currentRule: OutputModelObjects.LeftRecursiveRuleFunction): Lines => {
        const result = this.startRendering("LeftRecursiveRuleFunction");

        const modifiers = currentRule.modifiers.length > 0 ? currentRule.modifiers.join(" ") + " " : "";
        const args = this.renderArgs(currentRule.args);
        const callArgs = this.renderCallArgs(currentRule.args);
        const ctxType = `Context\\${currentRule.ctxType}`;
        const name = this.toTitleCase(currentRule.name);

        result.push(
            `/**`,
            ` * @throws RecognitionException`,
            ` */`,
            `${modifiers}public function ${currentRule.name}(${args}): ${ctxType}`,
            `{`,
            `    return $this->recursive${name}(0${callArgs});`,
            `}`,
            ``,
            `/**`,
            ` * @throws RecognitionException`,
            ` */`,
            `private function recursive${name}(int $precedence${args.length > 0 ? ", " + args : ""}): ${ctxType}`,
            `{`,
            `    $parentContext = $this->ctx;`,
            `    $parentState = $this->getState();`,
            `    $localContext = new ${ctxType}($this->ctx, $parentState${callArgs});`,
            `    $previousContext = $localContext;`,
            `    $startState = ${currentRule.startState.stateNumber};`,
            `    $this->enterRecursionRule($localContext, ${currentRule.startState.stateNumber}, ` +
            `self::RULE_${currentRule.name}, $precedence);`,
            ...this.indent(this.renderAction(currentRule.namedActions?.get("init"))),
            ``,
            `    try {`,
            ...this.indent(this.renderRuleBody(currentRule), 2),
            `    } catch (RecognitionException $exception) {`,
            `        $localContext->exception = $exception;`,
            `        $this->errorHandler->reportError($this, $exception);`,
            `        $this->errorHandler->recover($this, $exception);`,
            `    } finally {`,
            ...this.indent(this.renderAction(currentRule.finallyAction), 2),
            `        $this->unrollRecursionContexts($parentContext);`,
            `    }`,
            ``,
            `    return $localContext;`,
            `}`,
            ``,
        );

        return this.endRendering("LeftRecursiveRuleFunction", result);
    };

    protected override renderAddToLabelList = (srcOp: OutputModelObjects.AddToLabelList): Lines => {
        return [
            `${this.renderContext(srcOp.label)}->${srcOp.listName}[] = ${this.renderLabelref(srcOp.label)};`,
        ];
    };

    protected override renderVisitorDispatchMethod = (struct: OutputModelObjects.StructDecl): Lines => {
        return [
            `public function accept(ParseTreeVisitor $visitor): mixed`,
            `{`,
            `    if ($visitor instanceof ${this.invariants.grammarName}Visitor) {`,
            `        return $visitor->visit${this.toTitleCase(struct.derivedFromName)}($this);`,
            `    }`,
            ``,
            `    return $visitor->visitChildren($this);`,
            `}`,
            ``,
        ];
    };

    protected override renderListenerDispatchMethod = (struct: OutputModelObjects.StructDecl,
        method: OutputModelObjects.ListenerDispatchMethod): Lines => {
        const enterExit = method.isEnter ? "enter" : "exit";

        return [
            `public function ${enterExit}Rule(ParseTreeListener $listener): void`,
            `{`,
            `    if ($listener instanceof ${this.invariants.grammarName}Listener) {`,
            `        $listener->${enterExit}${this.toTitleCase(struct.derivedFromName)}($this);`,
            `    }`,
            `}`,
            ``,
        ];
    };

    protected override renderAttributeDecl = (d: OutputModelObjects.AttributeDecl): Lines => {
        return [
            `${d.type} $${d.name}` + (d.initValue ? ` = ${d.initValue}` : ``),
        ];
    };

    protected override renderCaptureNextToken = (d: OutputModelObjects.CaptureNextToken): Lines => {
        return [
            `$${d.varName} = $this->input->LT(1);`,
        ];
    };

    protected override renderCaptureNextTokenType = (srcOp: OutputModelObjects.CaptureNextTokenType): Lines => {
        return [
            `$${srcOp.varName} = $this->input->LA(1);`,
        ];
    };

    protected override renderCodeBlockForOuterMostAlt = (
        currentOuterMostAltCodeBlock: OutputModelObjects.CodeBlockForOuterMostAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForOuterMostAlt");

        if (currentOuterMostAltCodeBlock.altLabel) {
            result.push(
                `$localContext = new Context\\${this.toTitleCase(currentOuterMostAltCodeBlock.altLabel)}Context(` +
                `$localContext);`,
            );
        }

        result.push(
            `$this->enterOuterAlt($localContext, ${currentOuterMostAltCodeBlock.alt.altNum});`,
            ...this.renderCodeBlockForAlt(currentOuterMostAltCodeBlock),
        );

        return this.endRendering("CodeBlockForOuterMostAlt", result);
    };

    protected override renderContextRuleGetterDecl = (r: OutputModelObjects.ContextRuleGetterDecl): Lines => {
        if (r.signature) {
            return [];
        }

        return [
            `public function ${r.name}(): ?${r.ctxName}`,
            `{`,
            `    return $this->getTypedRuleContext(${r.ctxName}::class, 0);`,
            `}`,
        ];
    };

    protected override renderContextRuleListGetterDecl = (r: OutputModelObjects.ContextRuleListGetterDecl): Lines => {
        // PHP has no overloaded methods. The indexed getter handles both cases.
        return [];
    };

    protected override renderContextRuleListIndexedGetterDecl = (
        r: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines => {
        if (r.signature) {
            return [];
        }

        return [
            `/**`,
            ` * @return array<${r.ctxName}>|${r.ctxName}|null`,
            ` */`,
            `public function ${r.name}(?int $index = null)`,
            `{`,
            `    if ($index === null) {`,
            `        return $this->getTypedRuleContexts(${r.ctxName}::class);`,
            `    }`,
            ``,
            `    return $this->getTypedRuleContext(${r.ctxName}::class, $index);`,
            `}`,
        ];
    };

    protected override renderContextTokenGetterDecl = (t: OutputModelObjects.ContextTokenGetterDecl): Lines => {
        if (t.signature) {
            return [];
        }

        return [
            `public function ${t.name}(): ?TerminalNode`,
            `{`,
            `    return $this->getToken(${this.invariants.recognizerName}::${t.name}, 0);`,
            `}`,
        ];
    };

    protected override renderContextTokenListGetterDecl = (t: OutputModelObjects.ContextTokenListGetterDecl): Lines => {
        // PHP has no overloaded methods. The indexed getter handles both cases.
        return [];
    };

    protected override renderContextTokenListIndexedGetterDecl = (
        t: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines => {
        if (t.signature) {
            return [];
        }

        const parserName = this.invariants.recognizerName;

        return [
            `/**`,
            ` * @return array<TerminalNode>|TerminalNode|null`,
            ` */`,
            `public function ${t.name}(?int $index = null)`,
            `{`,
            `    if ($index === null) {`,
            `        return $this->getTokens(${parserName}::${t.name});`,
            `    }`,
            ``,
            `    return $this->getToken(${parserName}::${t.name}, $index);`,
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
            result.push(`${this.renderLabelref(choice.label)} = $this->input->LT(1);`);
        }

        result.push(
            ...this.renderSourceOps(choice.preamble),
            ``,
            `switch ($this->input->LA(1)) {`,
        );

        choice.alts.forEach((alt, index) => {
            result.push(
                ...this.indent(this.renderCases(choice.altLook[index])),
                ...this.indent(this.renderAlt(alt), 2),
                `        break;`,
                ``,
            );
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(
            `    default:`,
            ...this.indent(this.renderThrowNoViableAlt(noViableAltObject), 2),
            `}`,
        );

        return this.endRendering("LL1AltBlock", result);
    };

    protected override renderLL1OptionalBlock = (choice: OutputModelObjects.LL1OptionalBlock): Lines => {
        const result = this.startRendering("LL1OptionalBlock");

        result.push(
            ...this.renderSync(choice.stateNumber),
            ``,
            `switch ($this->input->LA(1)) {`,
        );

        // The lookahead list has one more entry than the alternatives (the exit branch), which results in an
        // empty case.
        choice.altLook.forEach((look, index) => {
            const alt = choice.alts[index] as OutputModelObjects.CodeBlockForAlt | undefined;
            result.push(
                ...this.indent(this.renderCases(look)),
                ...this.indent(alt ? this.renderAlt(alt) : [], 2),
                `        break;`,
                ``,
            );
        });

        result.push(
            `    default:`,
            `        break;`,
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
            ``,
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
            ``,
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
            ``,
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
            `$this->setState(${m.stateNumber});`,
            `${this.renderLabelAssignments(m.labels)}$this->match(self::${m.name});`,
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
            `${srcOp.ctxName} $${srcOp.name}`,
        ];
    };

    protected override renderRuleContextListDecl = (ruleDecl: OutputModelObjects.RuleContextListDecl): Lines => {
        return [
            `array $${ruleDecl.name} = []`,
        ];
    };

    protected override renderStructDecl = (struct: OutputModelObjects.StructDecl): Lines => {
        const result = this.startRendering("StructDecl");

        const superClass = this.invariants.contextSuperClass ?? "ParserRuleContext";
        let interfaces = "";
        if (struct.interfaces.length > 0) {
            interfaces = " implements " + struct.interfaces.map((i) => {
                return this.renderAction(i as OutputModelObjects.Action).join("");
            }).join(", ");
        }

        const ctorArgs = struct.ctorAttrs.map((a) => {
            return `, ?${this.renderAttributeDecl(a).join("")} = null`;
        }).join("");

        result.push(
            `class ${struct.name} extends ${superClass}${interfaces}`,
            `{`,
            ...this.indent(this.renderProperties(struct)),
            `    public function __construct(?ParserRuleContext $parent, ?int $invokingState = null${ctorArgs})`,
            `    {`,
            `        parent::__construct($parent, $invokingState);`,
        );

        if (struct.ctorAttrs.length > 0) {
            result.push(``);
            for (const a of struct.ctorAttrs) {
                result.push(`        $this->${a.name} = $${a.name} ?? $this->${a.name};`);
            }
        }

        result.push(
            `    }`,
            ``,
            `    public function getRuleIndex(): int`,
            `    {`,
            `        return ${this.invariants.recognizerName}::RULE_${struct.derivedFromName};`,
            `    }`,
            ...this.renderGetters(struct),
        );

        // Don't need copy unless we have subclasses.
        if (struct.provideCopyFrom) {
            result.push(
                ``,
                `    public function copyFrom(ParserRuleContext $context): void`,
                `    {`,
                `        parent::copyFrom($context);`,
                ``,
            );

            for (const a of struct.attrs) {
                result.push(`        $this->${a.name} = $context->${a.name};`);
            }

            result.push(`    }`);
        }

        const dispatchMethods = this.renderDispatchMethods(struct);
        if (dispatchMethods.length > 0) {
            result.push(``, ...this.indent(dispatchMethods));
        }

        for (const e of struct.extensionMembers) {
            result.push(``, ...this.indent(this.renderAction(e as OutputModelObjects.Action)));
        }

        result.push(`}`, ``);

        return this.endRendering("StructDecl", result);
    };

    protected override renderAltLabelStructDecl = (currentRule: OutputModelObjects.RuleFunction,
        struct: OutputModelObjects.AltLabelStructDecl): Lines => {
        const result = this.startRendering("AltLabelStructDecl");

        const parentContext = `${this.toTitleCase(struct.parentRule)}Context`;

        result.push(
            `class ${struct.name} extends ${parentContext}`,
            `{`,
            ...this.indent(this.renderProperties(struct)),
            `    public function __construct(${parentContext} $context)`,
            `    {`,
            `        parent::__construct($context);`,
            ``,
            `        $this->copyFrom($context);`,
            `    }`,
            ...this.renderGetters(struct),
        );

        const dispatchMethods = this.renderDispatchMethods(struct);
        if (dispatchMethods.length > 0) {
            result.push(``, ...this.indent(dispatchMethods));
        }

        result.push(`}`, ``);

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
            `${this.invariants.tokenLabelType} $${t.name}`,
        ];
    };

    protected override renderTokenTypeDecl = (srcOp: OutputModelObjects.TokenTypeDecl): Lines => {
        // PHP needs no declaration for local variables.
        return [];
    };

    protected override renderTokenListDecl = (t: OutputModelObjects.TokenListDecl): Lines => {
        return [
            `array $${t.name} = []`,
        ];
    };

    protected override renderThrowNoViableAlt = (srcOp: OutputModelObjects.ThrowNoViableAlt): Lines => {
        return [
            `throw new NoViableAltException($this);`,
        ];
    };

    protected override renderWildcard = (w: OutputModelObjects.Wildcard): Lines => {
        const result: Lines = this.startRendering("Wildcard");

        result.push(
            `$this->setState(${w.stateNumber});`,
            `${this.renderLabelAssignments(w.labels)}$this->matchWildcard();`,
        );

        return this.endRendering("Wildcard", result);
    };

    protected override renderStarBlock = (choice: OutputModelObjects.StarBlock): Lines => {
        const result: Lines = this.startRendering("StarBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        const predict = this.renderAdaptivePredict(choice.decision);

        result.push(
            ...this.renderSync(choice.stateNumber),
            ``,
            `$alt = ${predict};`,
            ``,
            `while ($alt !== ${choice.exitAlt} && $alt !== ATN::INVALID_ALT_NUMBER) {`,
            `    if ($alt === 1${!blockAST.greedy ? "+1" : ""}) {`,
            ...this.indent(this.renderSourceOps(choice.iteration), 2),
        );

        choice.alts.forEach((alt) => {
            result.push(...this.indent(this.renderAlt(alt), 2));
        });

        result.push(
            `    }`,
            ``,
            ...this.indent(this.renderSync(choice.loopBackStateNumber)),
            ``,
            `    $alt = ${predict};`,
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
            ``,
            `$alt = 1${nonGreedy};`,
            ``,
            `do {`,
            `    switch ($alt) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `        case ${index + 1}${nonGreedy}:`,
                ...this.indent(this.renderAlt(alt), 3),
                `            break;`,
                ``,
            );
        });

        const noViableAltObject = choice.getThrowNoViableAlt(choice.factory!, choice.ast!,
            this.invariants.grammarFileName);
        result.push(
            `        default:`,
            ...this.indent(this.renderThrowNoViableAlt(noViableAltObject), 3),
            `    }`,
            ``,
            ...this.indent(this.renderSync(choice.loopBackStateNumber)), // Loop back/exit decision.
            ``,
            `    $alt = ${this.renderAdaptivePredict(choice.decision)};`,
            `} while ($alt !== ${choice.exitAlt} && $alt !== ATN::INVALID_ALT_NUMBER);`,
        );

        return this.endRendering("PlusBlock", result);
    };

    protected override renderOptionalBlock = (choice: OutputModelObjects.OptionalBlock): Lines => {
        const result: Lines = this.startRendering("OptionalBlock");

        const blockAST = choice.ast as OptionalBlockAST;
        result.push(
            ...this.renderSync(choice.stateNumber),
            ``,
            `switch (${this.renderAdaptivePredict(choice.decision)}) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `    case ${index + 1}${!blockAST.greedy ? "+1" : ""}:`,
                ...this.indent(this.renderAlt(alt), 2),
                `        break;`,
                ``,
            );
        });

        result.push(`}`);

        return this.endRendering("OptionalBlock", result);
    };

    protected override renderAltBlock = (choice: OutputModelObjects.AltBlock): Lines => {
        const result: Lines = this.startRendering("AltBlock");

        result.push(...this.renderSync(choice.stateNumber));

        if (choice.label) {
            result.push(`${this.renderLabelref(choice.label)} = $this->input->LT(1);`);
        }

        result.push(
            ...this.renderSourceOps(choice.preamble),
            ``,
            `switch (${this.renderAdaptivePredict(choice.decision)}) {`,
        );

        choice.alts.forEach((alt, index) => {
            // Alt numbers are 1-based, so we add 1 to the index.
            result.push(
                `    case ${index + 1}:`,
                ...this.indent(this.renderAlt(alt), 2),
                `        break;`,
                ``,
            );
        });

        result.push(`}`);

        return this.endRendering("AltBlock", result);
    };

    protected override renderInvokeRule = (r: OutputModelObjects.InvokeRule): Lines => {
        const result: Lines = this.startRendering("InvokeRule");

        const ast = r.ast as GrammarASTWithOptions | undefined;
        const precedence = ast?.getOptionString("p");
        const argExprs = this.renderActionChunks(r.argExprsChunks).join("");

        let call: string;
        if (precedence) {
            call = `$this->recursive${this.toTitleCase(r.name)}(${precedence}${argExprs.length > 0 ? "," : ""}` +
                `${argExprs});`;
        } else {
            call = `$this->${r.name}(${argExprs});`;
        }

        result.push(
            `$this->setState(${r.stateNumber});`,
            `${this.renderLabelAssignments(r.labels)}${call}`,
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
            `$this->setState(${p.stateNumber});`,
            ``,
            `if (!(${chunks})) {`,
            `    throw new FailedPredicateException($this, ${p.predicate}${message});`,
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
            `private function action${this.toTitleCase(r.name)}(?${r.ctxType} $localContext, int $actionIndex): void`,
            `{`,
            `    switch ($actionIndex) {`,
        );

        for (const [index, action] of r.actions) {
            result.push(
                `        case ${index}:`,
                ...this.indent(this.renderAction(action), 3),
                ``,
                `            break;`,
                ``,
            );
        }

        result.push(
            `    }`,
            `}`,
        );

        return this.endRendering("RuleActionFunction", result);
    }

    protected override renderRuleSempredFunction = (r: OutputModelObjects.RuleSempredFunction): Lines => {
        const result = this.startRendering("RuleSempredFunction");

        result.push(
            `private function sempred${this.toTitleCase(r.name)}(?${this.contextType(r.ctxType)} $localContext, ` +
            `int $predicateIndex): bool`,
            `{`,
            `    switch ($predicateIndex) {`,
        );

        for (const [index, action] of r.actions) {
            result.push(
                `        case ${index}:`,
                `            return ${this.renderAction(action).join("\n").trim()};`,
                ``,
            );
        }

        result.push(
            `    }`,
            ``,
            `    return true;`,
            `}`,
        );

        return this.endRendering("RuleSempredFunction", result);
    };

    protected override renderSerializedATN = (model: OutputModelObjects.SerializedATN): Lines => {
        const result = this.startRendering("SerializedATN");

        const list = this.renderList(model.serialized, { wrap: 70, separator: ", " });
        if (list.length > 0) {
            list[0] = `[${list[0]}`;
            list[list.length - 1] = `${list[list.length - 1]}];`;
        }

        result.push(
            `private const SERIALIZED_ATN =`,
            ...this.indent(list),
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
            `${this.renderContext(t)}->${t.name}`,
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
            return `$localContext->${t.name}`;
        }

        return t.name;
    }

    protected renderCases(tokens: OutputModelObjects.ITokenInfo[]): Lines {
        return tokens.map((t) => {
            return `case self::${t.name}:`;
        });
    }

    // Lexer command methods. These are only used for custom lexer commands, the standard commands are
    // handled by the lexer ATN directly.
    protected override renderLexerSkipCommand = (): Lines => {
        return [
            "$this->skip();",
        ];
    };

    protected override renderLexerMoreCommand = (): Lines => {
        return [
            "$this->more();",
        ];
    };

    protected override renderLexerPopModeCommand = (): Lines => {
        return [
            "$this->popMode();",
        ];
    };

    protected override renderLexerTypeCommand = (arg: string): Lines => {
        return [
            `$this->type = ${arg};`,
        ];
    };

    protected override renderLexerChannelCommand = (arg: string): Lines => {
        return [
            `$this->channel = ${arg};`,
        ];
    };

    protected override renderLexerModeCommand = (arg: string): Lines => {
        return [
            `$this->mode = ${arg};`,
        ];
    };

    protected override renderLexerPushModeCommand = (arg: string): Lines => {
        return [
            `$this->pushMode(${arg});`,
        ];
    };

    protected override renderArgRef = (t: OutputModelObjects.ArgRef): Lines => {
        return [
            `$localContext->${t.name}`,
        ];
    };

    protected override renderListLabelRef = (t: OutputModelObjects.ListLabelRef): Lines => {
        return [
            `${this.renderContext(t)}->${this.renderListLabelName(t.name)}`,
        ];
    };

    protected override renderLocalRef = (a: OutputModelObjects.LocalRef): Lines => {
        return [
            `$localContext->${a.name}`,
        ];
    };

    protected override renderNonLocalAttrRef = (s: OutputModelObjects.NonLocalAttrRef): Lines => {
        return [
            `$this->getInvokingContext(${s.ruleIndex})->${s.name}`,
        ];
    };

    protected override renderQRetValueRef = (a: OutputModelObjects.QRetValueRef): Lines => {
        return [
            `${this.renderContext(a)}->${a.dict}->${a.name}`,
        ];
    };

    protected override renderRetValueRef = (t: OutputModelObjects.RetValueRef): Lines => {
        return [
            `$localContext->${t.name}`,
        ];
    };

    protected override renderRulePropertyRef = (t: OutputModelObjects.RulePropertyRef): Lines => {
        return [
            `${this.renderContext(t)}->${t.label}`,
        ];
    };

    protected override renderRulePropertyRefCtx = (t: OutputModelObjects.RulePropertyRefCtx): Lines => {
        return [
            `${this.renderContext(t)}->${t.label}`,
        ];
    };

    protected override renderRulePropertyRefParser = (t: OutputModelObjects.RulePropertyRefParser): Lines => {
        return [
            `$this`,
        ];
    };

    protected override renderRulePropertyRefStart = (t: OutputModelObjects.RulePropertyRefStart): Lines => {
        const ref = `${this.renderContext(t)}->${t.label}`;

        return [
            `(${ref} !== null ? (${ref}->start) : null)`,
        ];
    };

    protected override renderRulePropertyRefStop = (t: OutputModelObjects.RulePropertyRefStop): Lines => {
        const ref = `${this.renderContext(t)}->${t.label}`;

        return [
            `(${ref} !== null ? (${ref}->stop) : null)`,
        ];
    };

    protected override renderRulePropertyRefText = (t: OutputModelObjects.RulePropertyRefText): Lines => {
        const ref = `${this.renderContext(t)}->${t.label}`;

        return [
            `(${ref} !== null ? $this->input->getTextByTokens(${ref}->start, ${ref}->stop) : null)`,
        ];
    };

    protected override renderSetAttr = (s: OutputModelObjects.SetAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        return [
            `${this.renderContext(s)}->${s.name} = ${rhs};`,
        ];
    };

    protected override renderSetNonLocalAttr = (s: OutputModelObjects.SetNonLocalAttr): Lines => {
        const rhs = this.renderActionChunks(s.rhsChunks).join("");

        return [
            `$this->getInvokingContext(${s.ruleIndex})->${s.name} = ${rhs};`,
        ];
    };

    protected override renderThisRulePropertyRefCtx = (t: OutputModelObjects.ThisRulePropertyRefCtx): Lines => {
        return [
            `$localContext`,
        ];
    };

    protected override renderThisRulePropertyRefParser = (t: OutputModelObjects.ThisRulePropertyRefParser): Lines => {
        return [
            `$this`,
        ];
    };

    protected override renderThisRulePropertyRefStart = (t: OutputModelObjects.ThisRulePropertyRefStart): Lines => {
        return [
            `$localContext->start`,
        ];
    };

    protected override renderThisRulePropertyRefStop = (t: OutputModelObjects.ThisRulePropertyRefStop): Lines => {
        return [
            `$localContext->stop`,
        ];
    };

    protected override renderThisRulePropertyRefText = (t: OutputModelObjects.ThisRulePropertyRefText): Lines => {
        return [
            `$this->input->getTextByTokens($localContext->start, $this->input->LT(-1))`,
        ];
    };

    protected override renderTokenPropertyRefChannel = (t: OutputModelObjects.TokenPropertyRefChannel): Lines => {
        return [this.renderTokenProperty(t, "getChannel()", "0")];
    };

    protected override renderTokenPropertyRefIndex = (t: OutputModelObjects.TokenPropertyRefIndex): Lines => {
        return [this.renderTokenProperty(t, "getTokenIndex()", "0")];
    };

    protected override renderTokenPropertyRefInt = (t: OutputModelObjects.TokenPropertyRefInt): Lines => {
        const ref = `${this.renderContext(t)}->${t.label}`;

        return [
            `(${ref} !== null ? (int) ${ref}->getText() : 0)`,
        ];
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
        return [
            `${this.renderContext(t)}->${t.name}`,
        ];
    };

    private renderParser(parser: OutputModelObjects.Parser, namedActions: NamedActions,
        options: IGenerationOptions): Lines {
        const result: Lines = [];

        const parserName = parser.name;
        const packageName = this.invariants.packageName as string;
        const superClass = parser.superClass ? this.renderActionChunks([parser.superClass]).join("") : "Parser";

        result.push(
            `namespace${packageName ? " " + packageName : ""} {`,
            ...this.renderAction(namedActions.get("header")),
            `    use Antlr\\Antlr4\\Runtime\\Atn\\ATN;`,
            `    use Antlr\\Antlr4\\Runtime\\Atn\\ATNDeserializer;`,
            `    use Antlr\\Antlr4\\Runtime\\Atn\\ParserATNSimulator;`,
            `    use Antlr\\Antlr4\\Runtime\\Dfa\\DFA;`,
            `    use Antlr\\Antlr4\\Runtime\\Error\\Exceptions\\FailedPredicateException;`,
            `    use Antlr\\Antlr4\\Runtime\\Error\\Exceptions\\NoViableAltException;`,
            `    use Antlr\\Antlr4\\Runtime\\PredictionContexts\\PredictionContextCache;`,
            `    use Antlr\\Antlr4\\Runtime\\Error\\Exceptions\\RecognitionException;`,
            `    use Antlr\\Antlr4\\Runtime\\RuleContext;`,
            `    use Antlr\\Antlr4\\Runtime\\Token;`,
            `    use Antlr\\Antlr4\\Runtime\\TokenStream;`,
            `    use Antlr\\Antlr4\\Runtime\\Vocabulary;`,
            `    use Antlr\\Antlr4\\Runtime\\VocabularyImpl;`,
            `    use Antlr\\Antlr4\\Runtime\\RuntimeMetaData;`,
            `    use Antlr\\Antlr4\\Runtime\\Parser;`,
            ...this.renderAction(namedActions.get("definitions")),
            ``,
            `    final class ${parserName} extends ${superClass}`,
            `    {`,
        );

        const body: Lines = [];
        if (parser.tokens.size > 0) {
            body.push(...this.renderConstants(Array.from(parser.tokens)), ``);
        }

        if (parser.rules.length > 0) {
            body.push(...this.renderConstants(parser.rules.map((r) => {
                return [`RULE_${r.name}`, r.index];
            })), ``);
        }

        body.push(
            `/**`,
            ` * @var array<string>`,
            ` */`,
            `public const RULE_NAMES = [`,
            ...this.renderList(parser.ruleNames, { wrap: 70, indent: 4, quote: "'", separator: ", " }),
            `];`,
            ``,
            ...this.renderVocabulary(parser.literalNames, parser.symbolicNames),
            ``,
            ...this.renderSerializedATN(parser.atn),
            `protected static $atn;`,
            `protected static $decisionToDFA;`,
            `protected static $sharedContextCache;`,
        );

        const members = namedActions.get("members");
        if (members) {
            body.push(``, ...this.renderAction(members));
        }

        body.push(
            ``,
            `public function __construct(TokenStream $input)`,
            `{`,
            `    parent::__construct($input);`,
            ``,
            `    self::initialize();`,
            ``,
            `    $this->interp = new ParserATNSimulator($this, self::$atn, self::$decisionToDFA, ` +
            `self::$sharedContextCache);`,
            `}`,
            ``,
            ...this.renderInitialize(),
            ``,
            `public function getGrammarFileName(): string`,
            `{`,
            `    return "${parser.grammarFileName}";`,
            `}`,
            ``,
            `public function getRuleNames(): array`,
            `{`,
            `    return self::RULE_NAMES;`,
            `}`,
            ``,
            `public function getSerializedATN(): array`,
            `{`,
            `    return self::SERIALIZED_ATN;`,
            `}`,
            ``,
            `public function getATN(): ATN`,
            `{`,
            `    return self::$atn;`,
            `}`,
            ``,
            `public function getVocabulary(): Vocabulary`,
            `{`,
            `    static $vocabulary;`,
            ``,
            `    return $vocabulary = $vocabulary ?? new VocabularyImpl(self::LITERAL_NAMES, self::SYMBOLIC_NAMES);`,
            `}`,
            ``,
        );

        this.append(body, this.renderRuleFunctions(namedActions, parser.funcs));

        if (parser.sempredFuncs.size > 0) {
            body.push(
                `public function sempred(?RuleContext $localContext, int $ruleIndex, int $predicateIndex): bool`,
                `{`,
                `    switch ($ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of parser.sempredFuncs.values()) {
                body.push(
                    `        case ${f.ruleIndex}:`,
                    `            return $this->sempred${this.toTitleCase(f.name)}($localContext, $predicateIndex);`,
                    ``,
                );

                funcs.push(...this.renderRuleSempredFunction(f), ``);
            }

            body.push(
                `        default:`,
                `            return true;`,
                `    }`,
                `}`,
                ``,
            );
            this.append(body, funcs);
        }

        this.append(result, this.indent(body, 2));
        result.push(
            `    }`,
            `}`,
            ``,
            `namespace ${packageName ? packageName + "\\" : ""}Context {`,
            `    use Antlr\\Antlr4\\Runtime\\ParserRuleContext;`,
            `    use Antlr\\Antlr4\\Runtime\\Token;`,
            `    use Antlr\\Antlr4\\Runtime\\Tree\\ParseTreeVisitor;`,
            `    use Antlr\\Antlr4\\Runtime\\Tree\\TerminalNode;`,
            `    use Antlr\\Antlr4\\Runtime\\Tree\\ParseTreeListener;`,
            `    use ${packageName ? packageName + "\\" : ""}${parserName};`,
        );

        if (options.generateVisitor) {
            result.push(`    use ${packageName ? packageName + "\\" : ""}${parser.grammarName}Visitor;`);
        }

        if (options.generateListener) {
            result.push(`    use ${packageName ? packageName + "\\" : ""}${parser.grammarName}Listener;`);
        }

        result.push(...this.indent(this.renderAction(namedActions.get("contexts"))), ``);

        const contexts: Lines = [];
        for (const func of parser.funcs) {
            contexts.push(...this.renderStructDecl(func.ruleCtx));
            func.altLabelCtxs?.forEach((ctx) => {
                contexts.push(...this.renderAltLabelStructDecl(func, ctx));
            });
        }

        this.append(result, this.indent(contexts));
        result.push(`}`);

        return result;
    }

    private renderLexer(lexer: OutputModelObjects.Lexer, namedActions: NamedActions): Lines {
        const result: Lines = [];

        const lexerName = lexer.name;
        const packageName = this.invariants.packageName as string;
        const superClass = lexer.superClass ? this.renderActionChunks([lexer.superClass]).join("") : "Lexer";

        result.push(
            `namespace${packageName ? " " + packageName : ""} {`,
            ...this.renderAction(namedActions.get("header")),
            `    use Antlr\\Antlr4\\Runtime\\Atn\\ATNDeserializer;`,
            `    use Antlr\\Antlr4\\Runtime\\Atn\\LexerATNSimulator;`,
            `    use Antlr\\Antlr4\\Runtime\\Lexer;`,
            `    use Antlr\\Antlr4\\Runtime\\CharStream;`,
            `    use Antlr\\Antlr4\\Runtime\\PredictionContexts\\PredictionContextCache;`,
            `    use Antlr\\Antlr4\\Runtime\\RuleContext;`,
            `    use Antlr\\Antlr4\\Runtime\\Atn\\ATN;`,
            `    use Antlr\\Antlr4\\Runtime\\Dfa\\DFA;`,
            `    use Antlr\\Antlr4\\Runtime\\Vocabulary;`,
            `    use Antlr\\Antlr4\\Runtime\\RuntimeMetaData;`,
            `    use Antlr\\Antlr4\\Runtime\\VocabularyImpl;`,
            ...this.renderAction(namedActions.get("definitions")),
            ``,
            `    final class ${lexerName} extends ${superClass}`,
            `    {`,
        );

        const body: Lines = [];
        if (lexer.tokens.size > 0) {
            body.push(...this.renderConstants(Array.from(lexer.tokens)), ``);
        }

        if (lexer.escapedChannels.size > 0) {
            body.push(...this.renderConstants(Array.from(lexer.escapedChannels)), ``);
        }

        // The first mode is always the default mode, which needs no constant.
        const modes = lexer.escapedModeNames.slice(1);
        if (modes.length > 0) {
            body.push(`public const ${modes.map((m, i) => {
                return `${m}=${i + 1}`;
            }).join(", ")};`, ``);
        }

        body.push(
            `/**`,
            ` * @var array<string>`,
            ` */`,
            `public const CHANNEL_NAMES = [`,
            ...this.renderList(["DEFAULT_TOKEN_CHANNEL", "HIDDEN", ...lexer.channelNames],
                { wrap: 70, indent: 4, quote: "'", separator: ", " }),
            `];`,
            ``,
            `/**`,
            ` * @var array<string>`,
            ` */`,
            `public const MODE_NAMES = [`,
            ...this.renderList(lexer.modes, { wrap: 70, indent: 4, quote: "'", separator: ", " }),
            `];`,
            ``,
            `/**`,
            ` * @var array<string>`,
            ` */`,
            `public const RULE_NAMES = [`,
            ...this.renderList(lexer.ruleNames, { wrap: 70, indent: 4, quote: "'", separator: ", " }),
            `];`,
            ``,
            ...this.renderVocabulary(lexer.literalNames, lexer.symbolicNames),
            ``,
            ...this.renderSerializedATN(lexer.atn),
            `protected static $atn;`,
            `protected static $decisionToDFA;`,
            `protected static $sharedContextCache;`,
        );

        const members = namedActions.get("members");
        if (members) {
            body.push(``, ...this.renderAction(members));
        }

        body.push(
            ``,
            `public function __construct(CharStream $input)`,
            `{`,
            `    parent::__construct($input);`,
            ``,
            `    self::initialize();`,
            ``,
            `    $this->interp = new LexerATNSimulator($this, self::$atn, self::$decisionToDFA, ` +
            `self::$sharedContextCache);`,
            `}`,
            ``,
            ...this.renderInitialize(),
            ``,
            `public static function vocabulary(): Vocabulary`,
            `{`,
            `    static $vocabulary;`,
            ``,
            `    return $vocabulary = $vocabulary ?? new VocabularyImpl(self::LITERAL_NAMES, self::SYMBOLIC_NAMES);`,
            `}`,
            ``,
            `public function getGrammarFileName(): string`,
            `{`,
            `    return '${lexer.grammarFileName}';`,
            `}`,
            ``,
            `public function getRuleNames(): array`,
            `{`,
            `    return self::RULE_NAMES;`,
            `}`,
            ``,
            `public function getSerializedATN(): array`,
            `{`,
            `    return self::SERIALIZED_ATN;`,
            `}`,
            ``,
            `/**`,
            ` * @return array<string>`,
            ` */`,
            `public function getChannelNames(): array`,
            `{`,
            `    return self::CHANNEL_NAMES;`,
            `}`,
            ``,
            `/**`,
            ` * @return array<string>`,
            ` */`,
            `public function getModeNames(): array`,
            `{`,
            `    return self::MODE_NAMES;`,
            `}`,
            ``,
            `public function getATN(): ATN`,
            `{`,
            `    return self::$atn;`,
            `}`,
            ``,
            `public function getVocabulary(): Vocabulary`,
            `{`,
            `    return self::vocabulary();`,
            `}`,
            ...this.renderActionHandlers(lexer),
        );

        this.append(result, this.indent(body, 2));
        result.push(
            `    }`,
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
                ``,
                `public function action(?RuleContext $localContext, int $ruleIndex, int $actionIndex): void`,
                `{`,
                `    switch ($ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of lexer.actionFuncs.values()) {
                result.push(
                    `        case ${f.ruleIndex}:`,
                    `            $this->action${this.toTitleCase(f.name)}($localContext, $actionIndex);`,
                    `            break;`,
                    ``,
                );

                funcs.push(...this.renderRuleActionFunction(f), ``);
            }

            result.push(
                `    }`,
                `}`,
                ``,
                ...funcs,
            );
        }

        if (lexer.sempredFuncs.size > 0) {
            result.push(
                ``,
                `public function sempred(?RuleContext $localContext, int $ruleIndex, int $predicateIndex): bool`,
                `{`,
                `    switch ($ruleIndex) {`,
            );

            const funcs: Lines = [];
            for (const f of lexer.sempredFuncs.values()) {
                result.push(
                    `        case ${f.ruleIndex}:`,
                    `            return $this->sempred${this.toTitleCase(f.name)}($localContext, $predicateIndex);`,
                    ``,
                );

                funcs.push(...this.renderRuleSempredFunction(f), ``);
            }

            result.push(
                `    }`,
                ``,
                `    return true;`,
                `}`,
                ``,
                ...funcs,
            );
        }

        return this.endRendering("actionHandlers", result);
    }

    /**
     * Renders the shared `initialize` method of parsers and lexers.
     *
     * @returns The rendered lines.
     */
    private renderInitialize(): Lines {
        return [
            `private static function initialize(): void`,
            `{`,
            `    if (self::$atn !== null) {`,
            `        return;`,
            `    }`,
            ``,
            `    RuntimeMetaData::checkVersion('${PHPTargetGenerator.runtimeVersion}', RuntimeMetaData::VERSION);`,
            ``,
            `    $atn = (new ATNDeserializer())->deserialize(self::SERIALIZED_ATN);`,
            ``,
            `    $decisionToDFA = [];`,
            `    for ($i = 0, $count = $atn->getNumberOfDecisions(); $i < $count; $i++) {`,
            `        $decisionToDFA[] = new DFA($atn->getDecisionState($i), $i);`,
            `    }`,
            ``,
            `    self::$atn = $atn;`,
            `    self::$decisionToDFA = $decisionToDFA;`,
            `    self::$sharedContextCache = new PredictionContextCache();`,
            `}`,
        ];
    }

    /**
     * Renders a `public const` declaration for the given name/value pairs, wrapped over multiple lines.
     *
     * @param entries The name/value pairs.
     *
     * @returns The rendered lines.
     */
    private renderConstants(entries: Array<[string, number]>): Lines {
        const items = entries.map(([name, value]) => {
            return `${name} = ${value}`;
        });

        const lines = this.renderList(items, { wrap: 70, separator: ", ", finalSeparator: ";" });
        if (lines.length > 0) {
            lines[0] = `public const ${lines[0]}`;
        }

        return [lines[0]!, ...this.indent(lines.slice(1), 3)];
    }

    private renderVocabulary(literalNames: Array<string | null>, symbolicNames: Array<string | null>): Lines {
        return [
            `/**`,
            ` * @var array<string|null>`,
            ` */`,
            `private const LITERAL_NAMES = [`,
            ...this.renderList(literalNames, { wrap: 70, indent: 4, null: "null", separator: ", " }),
            `];`,
            ``,
            `/**`,
            ` * @var array<string>`,
            ` */`,
            `private const SYMBOLIC_NAMES = [`,
            ...this.renderList(symbolicNames, { wrap: 70, indent: 4, null: "null", separator: ", " }),
            `];`,
        ];
    }

    private renderNamespace(options: IGenerationOptions): Lines {
        if (options.package) {
            return [`namespace ${options.package};`];
        }

        return [];
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
     * Renders the public properties of a context class, grouped by kind, each with a doc comment.
     *
     * @param struct The struct to render the properties for.
     *
     * @returns The rendered lines.
     */
    private renderProperties(struct: OutputModelObjects.StructDecl): Lines {
        const result: Lines = [];
        const tokenType = this.invariants.tokenLabelType;

        const addGroup = (decls: Iterable<OutputModelObjects.Decl>, type: (d: OutputModelObjects.Decl) => string,
            init?: (d: OutputModelObjects.Decl) => string | undefined) => {
            for (const d of decls) {
                const initValue = init?.(d);
                result.push(
                    `/**`,
                    ` * @var ${type(d)}${initValue ? "" : "|null"} $${d.name}`,
                    ` */`,
                    `public $${d.name}${initValue ? " = " + initValue : ""};`,
                    ``,
                );
            }
        };

        addGroup(struct.tokenListDecls, () => { return `array<${tokenType}>`; });
        addGroup(struct.tokenDecls, () => { return tokenType; });
        addGroup(struct.ruleContextDecls, (d) => {
            return (d as OutputModelObjects.RuleContextDecl).ctxName;
        });
        addGroup(struct.ruleContextListDecls, (d) => {
            return `array<${(d as OutputModelObjects.RuleContextDecl).ctxName}>`;
        });
        addGroup(struct.attributeDecls, (d) => {
            return (d as OutputModelObjects.AttributeDecl).type;
        }, (d) => {
            return (d as OutputModelObjects.AttributeDecl).initValue;
        });

        return result;
    }

    /**
     * Renders the context getter methods (e.g. `ID()`, `expr()`) of a struct.
     *
     * @param struct The struct to render the getters for.
     *
     * @returns The rendered lines, each getter preceded by an empty line.
     */
    private renderGetters(struct: OutputModelObjects.StructDecl): Lines {
        const result: Lines = [];

        for (const getter of struct.getters) {
            const lines = this.renderDecls([getter]);
            if (lines.length > 0) {
                result.push(``, ...this.indent(lines));
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

    /**
     * Qualifies a context type with the `Context` namespace, unless it is the lexer rule context (which is the
     * runtime class, not a generated one).
     *
     * @param ctxType The context type name.
     *
     * @returns The qualified type name.
     */
    private contextType(ctxType: string): string {
        return ctxType === this.lexerRuleContext ? ctxType : `Context\\${ctxType}`;
    }

    private renderAdaptivePredict(decision: number): string {
        return `$this->getInterpreter()->adaptivePredict($this->input, ${decision}, $this->ctx)`;
    }

    private renderSync(stateNumber: number): Lines {
        return [
            `$this->setState(${stateNumber});`,
            `$this->errorHandler->sync($this);`,
        ];
    }

    /**
     * Renders the assignment prefix for labeled elements, e.g. `$localContext->name = `.
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
     * @param accessor The method to call on the token.
     * @param defaultValue The value to return when the token is null.
     *
     * @returns The rendered expression.
     */
    private renderTokenProperty(t: TokenPropertyRef, accessor: string, defaultValue: string): string {
        const ref = `${this.renderContext(t)}->${t.label}`;

        return `(${ref} !== null ? ${ref}->${accessor} : ${defaultValue})`;
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

        return `(((${shiftVar}) & ~0x3f) === 0 && ((1 << ${shiftVar}) & ${bits.calculated}) !== 0)`;
    }

    private renderBitsetInlineComparison(s: OutputModelObjects.TestSetInline,
        bits: OutputModelObjects.Bitset): string {
        return bits.tokens.map((t) => {
            return `$${s.varName} === self::${t.name}`;
        }).join(" || ");
    }

    private renderOffsetShiftVar(shiftAmount: string, offset: bigint): string {
        return offset > 0 ? `($${shiftAmount} - ${offset})` : `$${shiftAmount}`;
    }

    private renderCommonSetStuff = (m: OutputModelObjects.MatchSet, invert: boolean): Lines => {
        const result: Lines = this.startRendering("CommonSetStuff");

        result.push(`$this->setState(${m.stateNumber});`, ``);

        if (m.labels.length > 0) {
            result.push(`${this.renderLabelAssignments(m.labels)}$this->input->LT(1);`);
        }

        result.push(...this.renderCaptureNextTokenType(m.capture), ``);

        const expr = this.renderTestSetInline(m.expr).join("");
        if (invert) {
            result.push(`if ($${m.expr.varName} <= 0 || (${expr})) {`);
        } else {
            result.push(`if (!(${expr})) {`);
        }

        result.push(
            `    ${this.renderLabelAssignments(m.labels)}$this->errorHandler->recoverInline($this);`,
            `} else {`,
            `    if ($this->input->LA(1) === Token::EOF) {`,
            `        $this->matchedEOF = true;`,
            `    }`,
            ``,
            `    $this->errorHandler->reportMatch($this);`,
            `    $this->consume();`,
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
            return `, $${a.name}`;
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
