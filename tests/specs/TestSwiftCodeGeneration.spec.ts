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
import { SwiftTargetGenerator } from "../../src/default-target-generators/SwiftTargetGenerator.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";

const swiftGenerator = new SwiftTargetGenerator(false);
swiftGenerator.setUp();

const createConfig = (outputDirectory: string, packageName?: string) => {
    return defineConfig({
        grammarFiles: [],
        generators: [swiftGenerator],
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
 *
 * @returns The generated parser code.
 */
const generateParser = (grammarText: string): string => {
    const grammar = new Grammar(grammarText);
    grammar.tool.process(grammar, dummyParameters, false);
    expect(grammar.ast.hasErrors).toBe(false);

    const factory = new ParserATNFactory(grammar);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, swiftGenerator, dummyParameters.generationOptions);

    return gen.generateParser(dummyParameters.generationOptions);
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

    const factory = new LexerATNFactory(grammar, swiftGenerator);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, swiftGenerator, dummyParameters.generationOptions);

    return gen.generateLexer(dummyParameters.generationOptions);
};

describe("TestSwiftCodeGeneration", () => {
    it("Generated files of a combined grammar", () => {
        const config = createConfig("/swift-spec-out", "MyPkg");
        const grammar = new Grammar(
            "grammar T;\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n");
        grammar.fileName = "T.g4";
        grammar.tool.process(grammar, config, true);
        expect(grammar.tool.getNumErrors()).toBe(0);

        const files = fileSystem.readdirSync("/swift-spec-out") as string[];
        expect(files).toContain("TParser.swift");
        expect(files).toContain("TLexer.swift");
        expect(files).toContain("TListener.swift");
        expect(files).toContain("TBaseListener.swift");
        expect(files).toContain("TVisitor.swift");
        expect(files).toContain("TBaseVisitor.swift");

        const parser = fileSystem.readFileSync("/swift-spec-out/TParser.swift", "utf-8") as string;
        expect(parser).toContain("// Generated from T.g4 by antlr-ng");
        expect(parser).toContain("import Antlr4");
        expect(parser).toContain("open class TParser: Parser {");
        expect(parser).toContain("case EOF = -1, ID = 1");
        expect(parser).toContain("static let RULE_a = 0");
        expect(parser).toContain("public class AContext: ParserRuleContext {");
        expect(parser).toContain("open func a() throws -> AContext {");
        expect(parser).toContain("RuntimeMetaData.checkVersion(\"4.13.2\", RuntimeMetaData.VERSION)");

        // Swift has no packages, the option is ignored.
        expect(parser).not.toContain("MyPkg");

        const lexer = fileSystem.readFileSync("/swift-spec-out/TLexer.swift", "utf-8") as string;
        expect(lexer).toContain("open class TLexer: Lexer {");
        expect(lexer).toContain("static let ID=1");
        expect(lexer).toContain("required init(_ input: CharStream) {");

        const listener = fileSystem.readFileSync("/swift-spec-out/TListener.swift", "utf-8") as string;
        expect(listener).toContain("public protocol TListener: ParseTreeListener {");
        expect(listener).toContain("func enterA(_ ctx: TParser.AContext)");

        const baseListener = fileSystem.readFileSync("/swift-spec-out/TBaseListener.swift", "utf-8") as string;
        expect(baseListener).toContain("open class TBaseListener: TListener {");
        expect(baseListener).toContain("open func exitA(_ ctx: TParser.AContext) { }");

        const visitor = fileSystem.readFileSync("/swift-spec-out/TVisitor.swift", "utf-8") as string;
        expect(visitor).toContain("open class TVisitor<T>: ParseTreeVisitor<T> {");
        expect(visitor).toContain("open func visitA(_ ctx: TParser.AContext) -> T {");

        const baseVisitor = fileSystem.readFileSync("/swift-spec-out/TBaseVisitor.swift", "utf-8") as string;
        expect(baseVisitor).toContain("open class TBaseVisitor<T>: AbstractParseTreeVisitor<T> {");
        expect(baseVisitor).toContain("open func visitA(_ ctx: TParser.AContext) -> T? { return visitChildren(ctx) }");
    });

    it("Keyword escaping and access level", () => {
        const code = generateParser(
            "grammar T;\n" +
            "options { accessLevel=internal; }\n" +
            "func : class (let | var)* ;\n" +
            "class : CLASS ;\n" +
            "let : LET ;\n" +
            "var : VAR Type? ;\n" +
            "CLASS : 'class' ;\n" +
            "LET : 'let' ;\n" +
            "VAR : 'var' ;\n" +
            "Type : 'Type' ;\n");

        // Rules and tokens named like keywords are escaped with backticks, context classes are not.
        expect(code).toContain("internal func `func`() throws -> FuncContext {");
        expect(code).toContain("try `class`()");
        expect(code).toContain("func `let`() -> [LetContext] {");
        expect(code).toContain("func `Type`() -> TerminalNode? {");
        expect(code).toContain("return getToken(TParser.Tokens.`Type`.rawValue, 0)");
        expect(code).toContain("`Type` = 4");
        expect(code).toContain("static let RULE_func = 0, RULE_class = 1, RULE_let = 2, RULE_var = 3");

        // The access level option replaces open and public.
        expect(code).toContain("internal class TParser: Parser {");
        expect(code).toContain("internal class FuncContext: ParserRuleContext {");
        expect(code).toContain("override internal\n\tfunc getGrammarFileName()");
        expect(code).not.toContain("open ");
        expect(code).not.toContain("public ");
    });

    it("Left recursive rule", () => {
        const code = generateParser(
            "grammar T;\n" +
            "e : e '*' e # mul\n" +
            "  | e '+' e # add\n" +
            "  | INT     # int\n" +
            "  ;\n" +
            "INT : [0-9]+ ;\n");

        expect(code).toContain("public final func e() throws -> EContext {");
        expect(code).toContain("return try e(0)");
        expect(code).toContain("private func e(_ _p: Int) throws -> EContext {");
        expect(code).toContain("try enterRecursionRule(_localctx, 0, TParser.RULE_e, _p)");
        expect(code).toContain("_localctx = MulContext(EContext(_parentctx, _parentState))");
        expect(code).toContain("try pushNewRecursionContext(_localctx, _startState, TParser.RULE_e)");
        expect(code).toContain("if (!(precpred(_ctx, 3))) {");
        expect(code).toContain("throw ANTLRException.recognition(e: FailedPredicateException(self, " +
            "\"precpred(_ctx, 3)\"))");
        expect(code).toContain("try! unrollRecursionContexts(_parentctx)");
        expect(code).toContain("private func e_sempred(_ _localctx: EContext!, _ predIndex: Int) throws -> Bool {");
        expect(code).toContain("case 0: return precpred(_ctx, 3)");
        expect(code).toContain("case 1: return precpred(_ctx, 2)");
        expect(code).toContain("return try e_sempred(_localctx?.castdown(EContext.self), predIndex)");

        // Alternative labels produce their own context classes.
        expect(code).toContain("public class MulContext: EContext {");
        expect(code).toContain("init(_ ctx: EContext) {");
        expect(code).toContain("return visitor.visitMul(self)");
        expect(code).toContain("listener.enterMul(self)");
    });

    it("Rule arguments, return values and actions", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a[int depth] returns [int value] locals [bool seen]\n" +
            "  : {$depth < 10}? t=ID { $value = $depth + 1; let x = $t.channel; let y = $t.text }\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("open func a(_ depth: Int!) throws -> AContext {");
        expect(code).toContain("_localctx = AContext(_ctx, getState(), depth)");
        expect(code).toContain("public convenience init(_ parent: ParserRuleContext?, _ invokingState: Int, " +
            "_ depth: Int!) {");
        expect(code).toContain("self.depth = depth");
        expect(code).toContain("open var depth: Int!");
        expect(code).toContain("open var value: Int!");
        expect(code).toContain("open var seen: Bool!");
        expect(code).toContain("open var t: Token!");

        // Predicates and attribute access go through the local context.
        expect(code).toContain("if (!(_localctx.depth < 10)) {");
        expect(code).toContain("_localctx.castdown(AContext.self).value = _localctx.depth + 1");

        // Labeled matches are assigned in a closure.
        expect(code).toContain("let assignmentValue = try match(TParser.Tokens.ID.rawValue)");
        expect(code).toContain("_localctx.castdown(AContext.self).t = assignmentValue");

        // Token property references are nil-safe.
        expect(code).toContain("let x = (_localctx.castdown(AContext.self).t != nil ? " +
            "_localctx.castdown(AContext.self).t!.getChannel() : 0)");
        expect(code).toContain("let y = (_localctx.castdown(AContext.self).t != nil ? " +
            "_localctx.castdown(AContext.self).t!.getText()! : \"\")");
    });

    it("Token int and rule start/stop references", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : n=INT r=b { let next = $n.int + 1; let first: Token? = $r.start; let last: Token? = $r.stop } ;\n" +
            "b : INT ;\n" +
            "INT : [0-9]+ ;\n");

        // Int(String) is optional, so the conversion needs a fallback to produce an Int.
        expect(code).toContain("let next = (_localctx.castdown(AContext.self).n != nil ? " +
            "(Int(_localctx.castdown(AContext.self).n!.getText()!) ?? 0) : 0) + 1");

        // Start and stop references are tokens, not strings.
        expect(code).toContain("let first: Token? = _localctx.castdown(AContext.self).r?.start");
        expect(code).toContain("let last: Token? = _localctx.castdown(AContext.self).r?.stop");
    });

    it("Exception clauses and rule actions", () => {
        const code = generateParser(
            "grammar T;\n" +
            "@parser::members { public var counter = 0 }\n" +
            "a\n" +
            "@init { counter += 1 }\n" +
            "@after { counter -= 1 }\n" +
            "  : ID ;\n" +
            "  catch [ANTLRException.recognition(let e)] { print(e) }\n" +
            "  finally { counter = 0 }\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("public var counter = 0");
        expect(code).toContain("try enterRule(_localctx, 0, TParser.RULE_a)\n\t\t counter += 1 \n");
        expect(code).toContain("catch (ANTLRException.recognition(let e)) {\n\t\t\t print(e) \n\t\t}");
        expect(code).toContain("defer {\n\t\t\t counter = 0 \n\t\t\ttry! exitRule()\n\t\t}");
        expect(code).toContain("_ctx!.stop = try _input.LT(-1)\n\t\t\t counter -= 1 \n");
        expect(code).not.toContain("catch ANTLRException.recognition(let re)");
    });

    it("Lexer with modes and channels", () => {
        const code = generateLexer(
            "lexer grammar L;\n" +
            "channels { COMMENTS, DIRECTIVES }\n" +
            "@lexer::members { public var nesting = 0 }\n" +
            "OPEN : '<' -> pushMode(TAG) ;\n" +
            "COMMENT : '//' ~[\\r\\n]* -> channel(COMMENTS) ;\n" +
            "NUMBER : [0-9]+ { print(\"number\") } ;\n" +
            "PRED : 'pred' { nesting == 0 }? ;\n" +
            "EACUTE : 'é' ;\n" +
            "SMILE : '\\u{1F600}' ;\n" +
            "DOLLAR : '$' ;\n" +
            "mode TAG;\n" +
            "CLOSE : '>' -> popMode ;\n" +
            "mode STR;\n" +
            "QUOTE : '\"' -> popMode ;\n");

        expect(code).toContain("open class L: Lexer {");
        // Long constant lists are wrapped at 72 columns.
        expect(code).toContain("static let OPEN=1, COMMENT=2, NUMBER=3, PRED=4, EACUTE=5, SMILE=6, DOLLAR=7,\n" +
            "            CLOSE=8, QUOTE=9");
        expect(code).toContain("static let COMMENTS=2, DIRECTIVES=3");
        expect(code).toContain("static let TAG=1, STR=2");
        expect(code).toContain("\"DEFAULT_TOKEN_CHANNEL\", \"HIDDEN\", \"COMMENTS\", \"DIRECTIVES\"");
        expect(code).toContain("\"DEFAULT_MODE\", \"TAG\", \"STR\"");
        expect(code).toContain("public var nesting = 0");

        // Non-ASCII literal names are rendered with (escaped) Swift unicode escapes, so error messages show
        // them in a readable form. Dollar signs need no escaping.
        expect(code).toContain("\"'\\\\u{00E9}'\", \"'\\\\u{1F600}'\", \"'$'\"");

        // Lexer actions and predicates are dispatched by rule index.
        expect(code).toContain("func action(_ _localctx: RuleContext?, _ ruleIndex: Int, _ actionIndex: Int) " +
            "throws {");
        expect(code).toContain("try NUMBER_action((_localctx as RuleContext?), actionIndex)");
        expect(code).toContain("private func NUMBER_action(_ _localctx: RuleContext?, _ actionIndex: Int) throws {");
        expect(code).toContain("case 0:\n\t\t\t print(\"number\") \n\t\t\tbreak");
        expect(code).toContain("func sempred(_ _localctx: RuleContext?, _ ruleIndex: Int, _ predIndex: Int) " +
            "throws -> Bool {");
        expect(code).toContain("return try PRED_sempred(_localctx?.castdown(RuleContext.self), predIndex)");
        expect(code).toContain("case 0: return nesting == 0");
    });

    it("Empty lexer action", () => {
        const code = generateLexer(
            "lexer grammar L;\n" +
            "EMPTY : 'x' {} ;\n" +
            "BLANK : 'y' {  } ;\n");

        // Swift requires at least one statement per case, so empty actions get a break.
        expect(code).toContain("private func EMPTY_action(_ _localctx: RuleContext?, _ actionIndex: Int) throws {");
        expect(code).toContain("\t\tcase 0:\n\t\t\tbreak\n\t\tdefault: break");
        expect(code).toContain("private func BLANK_action(_ _localctx: RuleContext?, _ actionIndex: Int) throws {");
        expect(code).toContain("\t\tcase 1:\n\t\t\t  \n\t\t\tbreak\n\t\tdefault: break");
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
        expect(code).toContain("if (!(((Int64(_la) & ~0x3f) == 0 && ((Int64(1) << _la) & 30) != 0))) {");

        // The loop is an LL(*) star block.
        expect(code).toContain("while (_alt != 2 && _alt != ATN.INVALID_ALT_NUMBER) {");
        expect(code).toContain("_alt = try getInterpreter().adaptivePredict(_input, 0, _ctx)");

        // Inverted sets.
        expect(code).toContain("if (_la <= 0 || (_la == TParser.Tokens.A.rawValue || " +
            "_la == TParser.Tokens.B.rawValue)) {");
        expect(code).toContain("try _errHandler.recoverInline(self)");
        expect(code).toContain("_errHandler.reportMatch(self)");

        // Wildcard and list labels.
        expect(code).toContain("try matchWildcard()");
        expect(code).toContain("open var ids: [Token] = [Token]()");
        expect(code).toContain("_localctx.castdown(AContext.self).ids.append(_localctx.castdown(AContext.self)._ID)");
        expect(code).toContain("func ID() -> [TerminalNode] {");
        expect(code).toContain("return getTokens(TParser.Tokens.ID.rawValue)");
        expect(code).toContain("func ID(_ i: Int) -> TerminalNode? {");
    });

    it("Set containing EOF", () => {
        const code = generateParser(
            "grammar T;\n" +
            "s : A (EOF | B | C) ;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");

        // EOF (-1) gives the bitset an offset of -1, which must be applied to the token type.
        expect(code).toContain("if (!(((Int64((_la - -1)) & ~0x3f) == 0 && ((Int64(1) << (_la - -1)) & 25) != 0))) {");
    });
});
