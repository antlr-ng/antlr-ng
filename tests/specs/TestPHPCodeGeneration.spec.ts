/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

await import("../../src/Tool.js"); // To kick off the loading of the tool

import { LexerATNFactory } from "../../src/automata/LexerATNFactory.js";
import { ParserATNFactory } from "../../src/automata/ParserATNFactory.js";
import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { PHPTargetGenerator } from "../../src/default-target-generators/PHPTargetGenerator.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";

const phpGenerator = new PHPTargetGenerator(false);
phpGenerator.setUp();

const createConfig = (outputDirectory: string, packageName?: string) => {
    return defineConfig({
        grammarFiles: [],
        generators: [phpGenerator],
        generationOptions: {
            outputDirectory,
            generateListener: true,
            generateVisitor: true,
            generateBaseListener: true,
            generateBaseVisitor: true,
            package: packageName ?? "",
        }
    });
};

const dummyParameters = createConfig("/tmp");

/**
 * Generates the parser code for a (combined or parser) grammar, without writing any files.
 *
 * @param grammarText The grammar to process.
 * @param packageName The PHP namespace to use (if any).
 *
 * @returns The generated parser code.
 */
const generateParser = (grammarText: string, packageName?: string): string => {
    const config = packageName ? createConfig("/tmp", packageName) : dummyParameters;
    const grammar = new Grammar(grammarText);
    grammar.tool.process(grammar, config, false);
    expect(grammar.ast.hasErrors).toBe(false);

    const factory = new ParserATNFactory(grammar);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, phpGenerator, config.generationOptions);

    return gen.generateParser(config.generationOptions);
};

/**
 * Generates the lexer code for a lexer grammar, without writing any files.
 *
 * @param grammarText The lexer grammar to process.
 *
 * @returns The generated lexer code.
 */
const generateLexer = (grammarText: string): string => {
    const grammar = new LexerGrammar(grammarText);
    grammar.tool.process(grammar, dummyParameters, false);
    expect(grammar.ast.hasErrors).toBe(false);

    const factory = new LexerATNFactory(grammar, phpGenerator);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, phpGenerator, dummyParameters.generationOptions);

    return gen.generateLexer(dummyParameters.generationOptions);
};

describe("TestPHPCodeGeneration", () => {
    it("Generated files of a combined grammar", () => {
        const config = createConfig("/php-spec-out", "My\\Pkg");
        const grammar = new Grammar(
            "grammar T;\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n");
        grammar.fileName = "T.g4";
        grammar.tool.process(grammar, config, true);
        expect(grammar.tool.getNumErrors()).toBe(0);

        const files = fileSystem.readdirSync("/php-spec-out") as string[];
        expect(files).toContain("TParser.php");
        expect(files).toContain("TLexer.php");
        expect(files).toContain("TListener.php");
        expect(files).toContain("TBaseListener.php");
        expect(files).toContain("TVisitor.php");
        expect(files).toContain("TBaseVisitor.php");

        const parser = fileSystem.readFileSync("/php-spec-out/TParser.php", "utf-8") as string;
        expect(parser.startsWith("<?php\n")).toBe(true);
        expect(parser).toContain("// Generated from T.g4 by antlr-ng");
        expect(parser).toContain("namespace My\\Pkg {");
        expect(parser).toContain("final class TParser extends Parser");
        expect(parser).toContain("public function a(): Context\\AContext");

        // The contexts live in a sub namespace and import the listener and visitor interfaces.
        expect(parser).toContain("namespace My\\Pkg\\Context {");
        expect(parser).toContain("use My\\Pkg\\TParser;");
        expect(parser).toContain("use My\\Pkg\\TVisitor;");
        expect(parser).toContain("use My\\Pkg\\TListener;");
        expect(parser).toContain("class AContext extends ParserRuleContext");

        const lexer = fileSystem.readFileSync("/php-spec-out/TLexer.php", "utf-8") as string;
        expect(lexer).toContain("namespace My\\Pkg {");
        expect(lexer).toContain("final class TLexer extends Lexer");
        expect(lexer).toContain("public const ID = 1;");
        expect(lexer).toContain("RuntimeMetaData::checkVersion('4.13.2', RuntimeMetaData::VERSION);");

        const listener = fileSystem.readFileSync("/php-spec-out/TListener.php", "utf-8") as string;
        expect(listener).toContain("namespace My\\Pkg;");
        expect(listener).toContain("interface TListener extends ParseTreeListener {");
        expect(listener).toContain("public function enterA(Context\\AContext $context): void;");

        const baseVisitor = fileSystem.readFileSync("/php-spec-out/TBaseVisitor.php", "utf-8") as string;
        expect(baseVisitor).toContain("class TBaseVisitor extends AbstractParseTreeVisitor implements TVisitor");
        expect(baseVisitor).toContain("public function visitA(Context\\AContext $context)");
    });

    it("Global namespace without a package", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : 'a' ;\n");

        expect(code).toContain("namespace {");
        expect(code).toContain("namespace Context {");
        expect(code).toContain("use TParser;");
    });

    it("Left recursive rule", () => {
        const code = generateParser(
            "grammar T;\n" +
            "e : e '*' e # mul\n" +
            "  | e '+' e # add\n" +
            "  | INT     # int\n" +
            "  ;\n" +
            "INT : [0-9]+ ;\n");

        expect(code).toContain("public function e(): Context\\EContext");
        expect(code).toContain("return $this->recursiveE(0);");
        expect(code).toContain("private function recursiveE(int $precedence): Context\\EContext");
        expect(code).toContain("$this->enterRecursionRule($localContext, 0, self::RULE_e, $precedence);");
        expect(code).toContain("$localContext = new Context\\MulContext(new Context\\EContext($parentContext, " +
            "$parentState));");
        expect(code).toContain("$this->pushNewRecursionContext($localContext, $startState, self::RULE_e);");
        expect(code).toContain("if (!($this->precpred($this->ctx, 2))) {");
        expect(code).toContain("$this->unrollRecursionContexts($parentContext);");
        expect(code).toContain("private function sempredE(?Context\\EContext $localContext, " +
            "int $predicateIndex): bool");
        expect(code).toContain("return $this->precpred($this->ctx, 2);");

        // Alternative labels produce their own context classes.
        expect(code).toContain("class MulContext extends EContext");
        expect(code).toContain("public function accept(ParseTreeVisitor $visitor): mixed");
        expect(code).toContain("return $visitor->visitMul($this);");
    });

    it("Rule arguments, return values and actions", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a[int depth] returns [int value] locals [bool seen]\n" +
            "  : {$depth < 10}? t=ID { $value = $depth + 1; } { \\$x = $t.channel; }\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("public function a(int $depth): Context\\AContext");
        expect(code).toContain("$localContext = new Context\\AContext($this->ctx, $this->getState(), $depth);");
        expect(code).toContain("public function __construct(?ParserRuleContext $parent, ?int $invokingState = null, " +
            "?int $depth = null)");
        expect(code).toContain("$this->depth = $depth ?? $this->depth;");
        expect(code).toContain("public $value;");
        expect(code).toContain("public $seen;");

        // Predicates and attribute access go through the local context.
        expect(code).toContain("if (!($localContext->depth < 10)) {");
        expect(code).toContain("$localContext->value = $localContext->depth + 1;");

        // Token property references are null-safe, escaped dollars are passed through.
        expect(code).toContain("$x = ($localContext->t !== null ? $localContext->t->getChannel() : 0);");

        // The predicate text is escaped, so PHP doesn't interpolate it.
        expect(code).toContain("throw new FailedPredicateException($this, \"\\$depth < 10\");");
    });

    it("Rule argument with an initializer", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a[int depth = 1] : ID ;\n" +
            "ID : [a-z]+ ;\n");

        // The initializer stays on the property and is not repeated in the constructor signature.
        expect(code).toContain("public function __construct(?ParserRuleContext $parent, ?int $invokingState = null, " +
            "?int $depth = null)");
        expect(code).toContain("public $depth = 1;");
        expect(code).toContain("$this->depth = $depth ?? $this->depth;");
        expect(code).not.toContain("= 1 = null");
    });

    it("Exception clauses", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : ID ;\n" +
            "  catch [RecognitionException \\$e] { \\$handled = true; }\n" +
            "  finally { \\$done = true; }\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("} catch (RecognitionException $e) {");
        expect(code).toContain("$handled = true;");
        expect(code).toContain("} finally {");
        expect(code).toContain("$done = true;");
        expect(code).toContain("$this->exitRule();");
        expect(code).not.toContain("catch (RecognitionException $exception)");
    });

    it("Lexer with modes and channels", () => {
        const code = generateLexer(
            "lexer grammar L;\n" +
            "channels { COMMENTS, DIRECTIVES }\n" +
            "OPEN : '<' -> pushMode(TAG) ;\n" +
            "COMMENT : '//' ~[\\r\\n]* -> channel(COMMENTS) ;\n" +
            "NUMBER : [0-9]+ { echo \"number\"; } ;\n" +
            "PRED : 'pred' { \\$this->nesting === 0 }? ;\n" +
            "DOLLAR : '$' ;\n" +
            "mode TAG;\n" +
            "CLOSE : '>' -> popMode ;\n" +
            "mode STR;\n" +
            "QUOTE : '\"' -> popMode ;\n");

        expect(code).toContain("final class L extends Lexer");
        expect(code).toContain("public const COMMENTS = 2, DIRECTIVES = 3;");
        expect(code).toContain("public const TAG=1, STR=2;");
        expect(code).toContain("'DEFAULT_TOKEN_CHANNEL', 'HIDDEN', 'COMMENTS', 'DIRECTIVES'");
        expect(code).toContain("'DEFAULT_MODE', 'TAG', 'STR'");

        // Dollar signs in literal names are escaped.
        expect(code).toContain("\"'\\$'\"");

        // Lexer actions and predicates are dispatched by rule index.
        expect(code).toContain("public function action(?RuleContext $localContext, int $ruleIndex, " +
            "int $actionIndex): void");
        expect(code).toContain("$this->actionNUMBER($localContext, $actionIndex);");
        expect(code).toContain("private function actionNUMBER(?RuleContext $localContext, int $actionIndex): void");
        expect(code).toContain("echo \"number\";");
        expect(code).toContain("public function sempred(?RuleContext $localContext, int $ruleIndex, " +
            "int $predicateIndex): bool");
        expect(code).toContain("return $this->sempredPRED($localContext, $predicateIndex);");
        expect(code).toContain("return $this->nesting === 0;");
    });

    it("Sets, lists and lookahead tests", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : (A | B | C | D)* ~(A | B) . ids+=ID (ids+=ID)* ;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n" +
            "D : 'd' ;\n" +
            "ID : [e-z]+ ;\n");

        // More than two tokens in a set use a bit test.
        expect(code).toContain("if (!(((($_la) & ~0x3f) === 0 && ((1 << $_la) & 30) !== 0))) {");

        // Inverted sets.
        expect(code).toContain("if ($_la <= 0 || ($_la === self::A || $_la === self::B)) {");
        expect(code).toContain("$this->errorHandler->recoverInline($this);");
        expect(code).toContain("$this->matchedEOF = true;");

        // Wildcard and list labels.
        expect(code).toContain("$this->matchWildcard();");
        expect(code).toContain("$localContext->ids[] = $localContext->ID;");
        expect(code).toContain("public function ID(?int $index = null)");
        expect(code).toContain("return $this->getTokens(TParser::ID);");
    });

    it("Set containing EOF", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : (EOF | A | B) ;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n");

        // EOF (-1) gives the bitset a negative offset, which must be applied to the token type.
        expect(code).toContain("(((($_la - -1)) & ~0x3f) === 0 && ((1 << ($_la - -1)) & 13) !== 0)");
    });
});
