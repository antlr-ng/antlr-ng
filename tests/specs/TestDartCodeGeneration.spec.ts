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
import { DartTargetGenerator } from "../../src/default-target-generators/DartTargetGenerator.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";

const dartGenerator = new DartTargetGenerator(false);
dartGenerator.setUp();

const createConfig = (outputDirectory: string, generateBaseClasses: boolean) => {
    return defineConfig({
        grammarFiles: [],
        generators: [dartGenerator],
        generationOptions: {
            outputDirectory,
            generateListener: true,
            generateVisitor: true,
            generateBaseListener: generateBaseClasses,
            generateBaseVisitor: generateBaseClasses,
            package: "",
        }
    });
};

const dummyParameters = createConfig("/tmp", true);

/**
 * Generates the parser code for a (combined or parser) grammar, without writing any files.
 *
 * @param grammarText The grammar to process.
 * @param config The configuration to use.
 *
 * @returns The generated parser code.
 */
const generateParser = (grammarText: string, config = dummyParameters): string => {
    const grammar = new Grammar(grammarText);
    grammar.tool.process(grammar, config, false);
    expect(grammar.ast.hasErrors).toBe(false);

    const factory = new ParserATNFactory(grammar);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, dartGenerator, config.generationOptions);

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

    const factory = new LexerATNFactory(grammar, dartGenerator);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, dartGenerator, dummyParameters.generationOptions);

    return gen.generateLexer(dummyParameters.generationOptions);
};

describe("TestDartCodeGeneration", () => {
    it("Generated files of a combined grammar", () => {
        const config = createConfig("/dart-spec-out", true);
        const grammar = new Grammar(
            "grammar T;\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n");
        grammar.fileName = "T.g4";
        grammar.tool.process(grammar, config, true);
        expect(grammar.tool.getNumErrors()).toBe(0);

        const files = fileSystem.readdirSync("/dart-spec-out") as string[];
        expect(files).toContain("TParser.dart");
        expect(files).toContain("TLexer.dart");
        expect(files).toContain("TListener.dart");
        expect(files).toContain("TBaseListener.dart");
        expect(files).toContain("TVisitor.dart");
        expect(files).toContain("TBaseVisitor.dart");

        const parser = fileSystem.readFileSync("/dart-spec-out/TParser.dart", "utf-8") as string;
        expect(parser.startsWith("// Generated from T.g4 by antlr-ng")).toBe(true);
        expect(parser).toContain("// ignore_for_file: unused_import, unused_local_variable, prefer_single_quotes");
        expect(parser).toContain("import 'package:antlr4/antlr4.dart';");
        expect(parser).toContain("import 'TListener.dart';");
        expect(parser).toContain("import 'TBaseListener.dart';");
        expect(parser).toContain("import 'TVisitor.dart';");
        expect(parser).toContain("import 'TBaseVisitor.dart';");
        expect(parser).toContain("const int RULE_a = 0;");
        expect(parser).toContain("class TParser extends Parser {");
        expect(parser).toContain("RuntimeMetaData.checkVersion('4.13.2', RuntimeMetaData.VERSION);");
        expect(parser).toContain("static const int TOKEN_EOF = IntStream.EOF;");
        expect(parser).toContain("static const int TOKEN_ID = 1;");
        expect(parser).toContain("AContext a() {");
        expect(parser).toContain("dynamic _localctx = AContext(context, state);");
        expect(parser).toContain("enterRule(_localctx, 0, RULE_a);");
        expect(parser).toContain("match(TOKEN_ID);");
        expect(parser).toContain("} on RecognitionException catch (re) {");
        expect(parser).toContain("static const List<int> _serializedATN = [");

        // The rule contexts follow the parser class in the same file.
        expect(parser).toContain("class AContext extends ParserRuleContext {");
        expect(parser).toContain("TerminalNode? ID() => getToken(TParser.TOKEN_ID, 0);");
        expect(parser).toContain("AContext([ParserRuleContext? parent, int? invokingState]) : " +
            "super(parent, invokingState);");
        expect(parser).toContain("int get ruleIndex => RULE_a;");
        expect(parser).toContain("if (listener is TListener) listener.enterA(this);");
        expect(parser).toContain("if (visitor is TVisitor<T>) {");
        expect(parser).toContain("return visitor.visitA(this);");

        const lexer = fileSystem.readFileSync("/dart-spec-out/TLexer.dart", "utf-8") as string;
        expect(lexer).toContain("class TLexer extends Lexer {");
        expect(lexer).toContain("TOKEN_ID = 1;");
        expect(lexer).toContain("'DEFAULT_TOKEN_CHANNEL', 'HIDDEN'");
        expect(lexer).toContain("'DEFAULT_MODE'");
        expect(lexer).toContain("interpreter = LexerATNSimulator(_ATN, _decisionToDFA, _sharedContextCache, " +
            "recog: this);");

        const listener = fileSystem.readFileSync("/dart-spec-out/TListener.dart", "utf-8") as string;
        expect(listener).toContain("import 'TParser.dart';");
        expect(listener).toContain("abstract class TListener extends ParseTreeListener {");
        expect(listener).toContain("/// Enter a parse tree produced by [TParser.a].");
        expect(listener).toContain("void enterA(AContext ctx);");

        const baseListener = fileSystem.readFileSync("/dart-spec-out/TBaseListener.dart", "utf-8") as string;
        expect(baseListener).toContain("class TBaseListener implements TListener {");
        expect(baseListener).toContain("void exitA(AContext ctx) {}");
        expect(baseListener).toContain("void visitErrorNode(ErrorNode node) {}");

        const visitor = fileSystem.readFileSync("/dart-spec-out/TVisitor.dart", "utf-8") as string;
        expect(visitor).toContain("abstract class TVisitor<T> extends ParseTreeVisitor<T> {");
        expect(visitor).toContain("T? visitA(AContext ctx);");

        const baseVisitor = fileSystem.readFileSync("/dart-spec-out/TBaseVisitor.dart", "utf-8") as string;
        expect(baseVisitor).toContain("class TBaseVisitor<T> extends ParseTreeVisitor<T> implements TVisitor<T> {");
        expect(baseVisitor).toContain("T? visitA(AContext ctx) => visitChildren(ctx);");
    });

    it("Base classes are only imported when generated", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : 'a' ;\n", createConfig("/tmp", false));

        expect(code).toContain("import 'TListener.dart';");
        expect(code).toContain("import 'TVisitor.dart';");
        expect(code).not.toContain("import 'TBaseListener.dart';");
        expect(code).not.toContain("import 'TBaseVisitor.dart';");
    });

    it("Keyword escaping", () => {
        const code = generateParser(
            "grammar T;\n" +
            "class : var (switch | set)* ;\n" +
            "var : VAR ;\n" +
            "switch : SWITCH ;\n" +
            "set : SET static=ID ;\n" +
            "VAR : 'var' ;\n" +
            "SWITCH : 'switch' ;\n" +
            "SET : 'set' ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("const int RULE_class = 0, RULE_var = 1, RULE_switch = 2, RULE_set = 3;");
        expect(code).toContain("'class', 'var', 'switch', 'set'");
        expect(code).toContain("ClassContext class_() {");
        expect(code).toContain("enterRule(_localctx, 0, RULE_class);");
        expect(code).toContain("var_();");
        expect(code).toContain("switch_();");
        expect(code).toContain("set_();");
        expect(code).toContain("_localctx.static_ = match(TOKEN_ID);");

        // Context classes and their getters.
        expect(code).toContain("class ClassContext extends ParserRuleContext {");
        expect(code).toContain("VarContext? var_() => getRuleContext<VarContext>(0);");
        expect(code).toContain("List<SwitchContext> switchs() => getRuleContexts<SwitchContext>();");
        expect(code).toContain("SwitchContext? switch_(int i) => getRuleContext<SwitchContext>(i);");
        expect(code).toContain("Token? static_;");
        expect(code).toContain("TerminalNode? SET() => getToken(TParser.TOKEN_SET, 0);");
        expect(code).toContain("listener.enterClass(this);");
    });

    it("Left recursive rule", () => {
        const code = generateParser(
            "grammar T;\n" +
            "e : e '*' e # mul\n" +
            "  | e '+' e # add\n" +
            "  | INT     # int\n" +
            "  ;\n" +
            "INT : [0-9]+ ;\n");

        expect(code).toContain("EContext e([int _p = 0]) {");
        expect(code).toContain("final _parentctx = context;");
        expect(code).toContain("final _parentState = state;");
        expect(code).toContain("dynamic _localctx = EContext(context, _parentState);");
        expect(code).toContain("var _prevctx = _localctx;");
        expect(code).toContain("var _startState = 0;");
        expect(code).toContain("enterRecursionRule(_localctx, 0, RULE_e, _p);");
        expect(code).toContain("_localctx = IntContext(_localctx);");
        expect(code).toContain("context = _localctx;");
        expect(code).toContain("_prevctx = _localctx;");
        expect(code).toContain("context!.stop = tokenStream.LT(-1);");
        expect(code).toContain("if (parseListeners != null) triggerExitRuleEvent();");
        expect(code).toContain("_localctx = MulContext(EContext(_parentctx, _parentState));");
        expect(code).toContain("pushNewRecursionContext(_localctx, _startState, RULE_e);");
        expect(code).toContain("if (!(precpred(context, 2))) {");
        expect(code).toContain("throw FailedPredicateException(this, \"precpred(context, 2)\");");
        expect(code).toContain("e(3);");
        expect(code).toContain("unrollRecursionContexts(_parentctx);");

        // Predicate dispatching.
        expect(code).toContain("bool sempred(RuleContext? _localctx, int ruleIndex, int predIndex) {");
        expect(code).toContain("return _e_sempred(_localctx as EContext?, predIndex);");
        expect(code).toContain("bool _e_sempred(dynamic _localctx, int predIndex) {");
        expect(code).toContain("case 0: return precpred(context, 3);");
        expect(code).toContain("case 1: return precpred(context, 2);");

        // Alternative labels produce their own context classes.
        expect(code).toContain("void copyFrom(ParserRuleContext ctx) {");
        expect(code).toContain("class MulContext extends EContext {");
        expect(code).toContain("MulContext(EContext ctx) { copyFrom(ctx); }");
        expect(code).toContain("List<EContext> es() => getRuleContexts<EContext>();");
        expect(code).toContain("EContext? e(int i) => getRuleContext<EContext>(i);");
        expect(code).toContain("return visitor.visitMul(this);");
    });

    it("Rule arguments, return values and actions", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a[int depth] returns [int value] locals [bool seen]\n" +
            "  : {$depth < 10}? t=ID { $value = $depth + 1; } { var x = [$t.channel, $t.text, $text]; }\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("AContext a(int? depth) {");
        expect(code).toContain("dynamic _localctx = AContext(context, state, depth);");
        expect(code).toContain("AContext([ParserRuleContext? parent, int? invokingState, int? depth]) : " +
            "super(parent, invokingState) {");
        expect(code).toContain("this.depth = depth;");
        expect(code).toContain("int? value;");
        expect(code).toContain("bool? seen;");
        expect(code).toContain("Token? t;");

        // Predicates and attribute access go through the local context.
        expect(code).toContain("if (!(_localctx.depth < 10)) {");
        expect(code).toContain("_localctx.value = _localctx.depth + 1;");
        expect(code).toContain("var x = [_localctx.t != null ? _localctx.t.channel : 0, _localctx.t.text, " +
            "tokenStream.getTextRange(_localctx.start, tokenStream.LT(-1))];");

        // Dollar signs in the predicate text are escaped, so Dart doesn't interpolate them.
        expect(code).toContain("throw FailedPredicateException(this, \"\\$depth < 10\");");
    });

    it("Exception clauses", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : ID ;\n" +
            "  catch [e] { handled = true; }\n" +
            "  finally { done = true; }\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("} catch (e) {");
        expect(code).toContain("handled = true;");
        expect(code).toContain("} finally {");
        expect(code).toContain("done = true;");
        expect(code).toContain("exitRule();");
        expect(code).not.toContain("on RecognitionException catch (re)");
    });

    it("Lexer with modes and channels", () => {
        const code = generateLexer(
            "lexer grammar L;\n" +
            "channels { COMMENTS, DIRECTIVES }\n" +
            "OPEN : '<' -> pushMode(TAG) ;\n" +
            "COMMENT : '//' ~[\\r\\n]* -> channel(COMMENTS) ;\n" +
            "NUMBER : [0-9]+ { print('number'); } ;\n" +
            "PRED : 'pred' { nesting == 0 }? ;\n" +
            "DOLLAR : '$' ;\n" +
            "mode TAG;\n" +
            "CLOSE : '>' -> popMode ;\n" +
            "mode STR;\n" +
            "QUOTE : '\"' -> popMode ;\n");

        expect(code).toContain("class L extends Lexer {");
        expect(code).toContain("TOKEN_OPEN = 1, TOKEN_COMMENT = 2, TOKEN_NUMBER = 3, TOKEN_PRED = 4, ");
        expect(code).toContain("COMMENTS = 2, DIRECTIVES = 3;");
        expect(code).toContain("TAG = 1, STR = 2;");
        expect(code).toContain("'DEFAULT_TOKEN_CHANNEL', 'HIDDEN', 'COMMENTS', 'DIRECTIVES'");
        expect(code).toContain("'DEFAULT_MODE', 'TAG', 'STR'");

        // Dollar signs in literal names are escaped.
        expect(code).toContain("\"'\\$'\"");

        // Lexer actions and predicates are dispatched by rule index.
        expect(code).toContain("void action(RuleContext? _localctx, int ruleIndex, int actionIndex) {");
        expect(code).toContain("_NUMBER_action(_localctx, actionIndex);");
        expect(code).toContain("void _NUMBER_action(RuleContext? _localctx, int actionIndex) {");
        expect(code).toContain("case 0: print('number'); break;");
        expect(code).toContain("bool sempred(RuleContext? _localctx, int ruleIndex, int predIndex) {");
        expect(code).toContain("return _PRED_sempred(_localctx, predIndex);");
        expect(code).toContain("bool _PRED_sempred(dynamic _localctx, int predIndex) {");
        expect(code).toContain("case 0: return nesting == 0;");
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

        expect(code).toContain("int _la;");
        expect(code).toContain("_la = tokenStream.LA(1)!;");

        // More than two tokens in a set use a bit test.
        expect(code).toContain("if (!((((_la) & ~0x3f) == 0 && ((1 << _la) & 30) != 0))) {");

        // Inverted sets.
        expect(code).toContain("if (_la <= 0 || (_la == TOKEN_A || _la == TOKEN_B)) {");
        expect(code).toContain("errorHandler.recoverInline(this);");
        expect(code).toContain("if ( tokenStream.LA(1)! == IntStream.EOF ) matchedEOF = true;");

        // Wildcard and list labels.
        expect(code).toContain("matchWildcard();");
        expect(code).toContain("_localctx._ID = match(TOKEN_ID);");
        expect(code).toContain("_localctx.ids.add(_localctx._ID);");
        expect(code).toContain("var ids = <Token>[];");
        expect(code).toContain("List<TerminalNode> IDs() => getTokens(TParser.TOKEN_ID);");
        expect(code).toContain("TerminalNode? ID(int i) => getToken(TParser.TOKEN_ID, i);");
    });
});
