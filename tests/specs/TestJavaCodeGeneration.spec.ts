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
import { JavaTargetGenerator } from "../../src/default-target-generators/JavaTargetGenerator.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";

const javaGenerator = new JavaTargetGenerator(false);
javaGenerator.setUp();

const createConfig = (outputDirectory: string, packageName?: string) => {
    return defineConfig({
        grammarFiles: [],
        generators: [javaGenerator],
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
 * @param packageName The Java package to use (if any).
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

    const gen = new CodeGenerator(grammar, javaGenerator, config.generationOptions);

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

    const factory = new LexerATNFactory(grammar, javaGenerator);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, javaGenerator, dummyParameters.generationOptions);

    return gen.generateLexer(dummyParameters.generationOptions);
};

describe("TestJavaCodeGeneration", () => {
    it("Generated files of a combined grammar", () => {
        const config = createConfig("/java-spec-out", "org.example.pkg");
        const grammar = new Grammar(
            "grammar T;\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n");
        grammar.fileName = "T.g4";
        grammar.tool.process(grammar, config, true);
        expect(grammar.tool.getNumErrors()).toBe(0);

        const files = fileSystem.readdirSync("/java-spec-out") as string[];
        expect(files).toContain("TParser.java");
        expect(files).toContain("TLexer.java");
        expect(files).toContain("TListener.java");
        expect(files).toContain("TBaseListener.java");
        expect(files).toContain("TVisitor.java");
        expect(files).toContain("TBaseVisitor.java");

        const parser = fileSystem.readFileSync("/java-spec-out/TParser.java", "utf-8") as string;
        expect(parser).toContain("// Generated from T.g4 by antlr-ng");
        expect(parser).toContain("package org.example.pkg;");
        expect(parser).toContain("import org.antlr.v4.runtime.*;");
        expect(parser).toContain("public class TParser extends Parser {");
        expect(parser).toContain("static { RuntimeMetaData.checkVersion(\"4.13.2\", RuntimeMetaData.VERSION); }");
        expect(parser).toContain("public final AContext a() throws RecognitionException {");
        expect(parser).toContain("public static class AContext extends ParserRuleContext {");
        expect(parser).toContain("public TerminalNode ID() { return getToken(TParser.ID, 0); }");
        expect(parser).toContain("if ( listener instanceof TListener ) ((TListener)listener).enterA(this);");
        expect(parser).toContain("public ATN getATN() { return _ATN; }");

        const lexer = fileSystem.readFileSync("/java-spec-out/TLexer.java", "utf-8") as string;
        expect(lexer).toContain("package org.example.pkg;");
        expect(lexer).toContain("public class TLexer extends Lexer {");
        expect(lexer).toContain("ID=1;");
        expect(lexer).toContain("public TLexer(CharStream input) {");

        const listener = fileSystem.readFileSync("/java-spec-out/TListener.java", "utf-8") as string;
        expect(listener).toContain("package org.example.pkg;");
        expect(listener).toContain("public interface TListener extends ParseTreeListener {");
        expect(listener).toContain("void enterA(TParser.AContext ctx);");

        const baseListener = fileSystem.readFileSync("/java-spec-out/TBaseListener.java", "utf-8") as string;
        expect(baseListener).toContain("public class TBaseListener implements TListener {");
        expect(baseListener).toContain("@Override public void exitA(TParser.AContext ctx) { }");
        expect(baseListener).toContain("@Override public void visitErrorNode(ErrorNode node) { }");

        const visitor = fileSystem.readFileSync("/java-spec-out/TVisitor.java", "utf-8") as string;
        expect(visitor).toContain("public interface TVisitor<T> extends ParseTreeVisitor<T> {");
        expect(visitor).toContain("T visitA(TParser.AContext ctx);");

        const baseVisitor = fileSystem.readFileSync("/java-spec-out/TBaseVisitor.java", "utf-8") as string;
        expect(baseVisitor).toContain("public class TBaseVisitor<T> extends AbstractParseTreeVisitor<T> " +
            "implements TVisitor<T> {");
        expect(baseVisitor).toContain("@Override public T visitA(TParser.AContext ctx) { return visitChildren(ctx); }");
    });

    it("Serialized ATN as string", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : 'a' ;\n");

        // The ATN is a string literal of \\uXXXX escapes (plain ASCII chars are kept as they are).
        expect(code).toContain("public static final String _serializedATN =");
        expect(code).toMatch(/\t\t"\\u0004\\u0001\\u0001/);
        expect(code).toContain("new ATNDeserializer().deserialize(_serializedATN.toCharArray());");
        expect(code).toContain("public String getSerializedATN() { return _serializedATN; }");
        expect(code).not.toContain("_serializedATNSegment");
    });

    it("Keyword escaping", () => {
        const code = generateParser(
            "grammar T;\n" +
            "int : class rule ;\n" +
            "class : CLASS ;\n" +
            "rule : ID ;\n" +
            "CLASS : 'class' ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("RULE_int = 0, RULE_class = 1, RULE_rule = 2;");
        expect(code).toContain("public final IntContext int_() throws RecognitionException {");
        expect(code).toContain("public ClassContext class_() {");
        expect(code).toContain("public final RuleContext rule_() throws RecognitionException {");
        expect(code).toContain("class_();");
        expect(code).toContain("rule_();");
    });

    it("Left recursive rule", () => {
        const code = generateParser(
            "grammar T;\n" +
            "e : e '*' e # mul\n" +
            "  | e '+' e # add\n" +
            "  | INT     # int\n" +
            "  ;\n" +
            "INT : [0-9]+ ;\n");

        expect(code).toContain("public final EContext e() throws RecognitionException {");
        expect(code).toContain("return e(0);");
        expect(code).toContain("private EContext e(int _p) throws RecognitionException {");
        expect(code).toContain("enterRecursionRule(_localctx, 0, RULE_e, _p);");
        expect(code).toContain("_localctx = new IntContext(_localctx);");
        expect(code).toContain("_localctx = new MulContext(new EContext(_parentctx, _parentState));");
        expect(code).toContain("pushNewRecursionContext(_localctx, _startState, RULE_e);");
        expect(code).toContain("if (!(precpred(_ctx, 2))) throw new FailedPredicateException(this, " +
            "\"precpred(_ctx, 2)\");");
        expect(code).toContain("if ( _parseListeners!=null ) triggerExitRuleEvent();");
        expect(code).toContain("unrollRecursionContexts(_parentctx);");
        expect(code).toContain("private boolean e_sempred(EContext _localctx, int predIndex) {");
        expect(code).toContain("return precpred(_ctx, 2);");

        // Alternative labels produce their own context classes.
        expect(code).toContain("public static class MulContext extends EContext {");
        expect(code).toContain("public MulContext(EContext ctx) { copyFrom(ctx); }");
        expect(code).toContain("public void copyFrom(EContext ctx) {");
        expect(code).toContain("return ((TVisitor<? extends T>)visitor).visitMul(this);");
    });

    it("Rule arguments, return values and actions", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a[int depth] returns [int value] locals [boolean seen]\n" +
            "  : {$depth < 10}? t=ID { $value = $depth + 1; } { int x = $t.channel + $t.line; }\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("public final AContext a(int depth) throws RecognitionException {");
        expect(code).toContain("AContext _localctx = new AContext(_ctx, getState(), depth);");
        expect(code).toContain("public AContext(ParserRuleContext parent, int invokingState) " +
            "{ super(parent, invokingState); }");
        expect(code).toContain("public AContext(ParserRuleContext parent, int invokingState, int depth) {");
        expect(code).toContain("this.depth = depth;");
        expect(code).toContain("public int value;");
        expect(code).toContain("public boolean seen;");
        expect(code).toContain("public Token t;");

        // Predicates and attribute access go through the local context.
        expect(code).toContain("if (!(_localctx.depth < 10)) throw new FailedPredicateException(this, " +
            "\"$depth < 10\");");
        expect(code).toContain("((AContext)_localctx).value = _localctx.depth + 1;");
        expect(code).toContain("((AContext)_localctx).t = match(ID);");

        // Token property references are null-safe.
        expect(code).toContain("int x = (((AContext)_localctx).t!=null?((AContext)_localctx).t.getChannel():0) + " +
            "(((AContext)_localctx).t!=null?((AContext)_localctx).t.getLine():0);");
    });

    it("Exception clauses", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : ID ;\n" +
            "  catch [RecognitionException e] { handled = true; }\n" +
            "  finally { done = true; }\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("catch (RecognitionException e) {");
        expect(code).toContain("handled = true;");
        expect(code).toContain("finally {");
        expect(code).toContain("done = true;");
        expect(code).toContain("exitRule();");
        expect(code).not.toContain("catch (RecognitionException re)");
    });

    it("Lexer with modes and channels", () => {
        const code = generateLexer(
            "lexer grammar L;\n" +
            "channels { COMMENTS, DIRECTIVES }\n" +
            "OPEN : '<' -> pushMode(TAG) ;\n" +
            "COMMENT : '//' ~[\\r\\n]* -> channel(COMMENTS) ;\n" +
            "NUMBER : [0-9]+ { System.out.println(\"number\"); } ;\n" +
            "PRED : 'pred' { nesting == 0 }? ;\n" +
            "mode TAG;\n" +
            "CLOSE : '>' -> popMode ;\n" +
            "mode STR;\n" +
            "QUOTE : '\"' -> popMode ;\n");

        expect(code).toContain("public class L extends Lexer {");
        expect(code).toContain("OPEN=1, COMMENT=2, NUMBER=3, PRED=4, CLOSE=5, QUOTE=6;");
        expect(code).toContain("COMMENTS=2, DIRECTIVES=3;");
        expect(code).toContain("TAG=1, STR=2;");
        expect(code).toContain("\"DEFAULT_TOKEN_CHANNEL\", \"HIDDEN\", \"COMMENTS\", \"DIRECTIVES\"");
        expect(code).toContain("\"DEFAULT_MODE\", \"TAG\", \"STR\"");
        expect(code).toContain("null, \"'<'\", null, null, \"'pred'\", \"'>'\", \"'\\\"'\"");

        // Lexer actions and predicates are dispatched by rule index.
        expect(code).toContain("public void action(RuleContext _localctx, int ruleIndex, int actionIndex) {");
        expect(code).toContain("NUMBER_action((RuleContext)_localctx, actionIndex);");
        expect(code).toContain("private void NUMBER_action(RuleContext _localctx, int actionIndex) {");
        expect(code).toContain("System.out.println(\"number\");");
        expect(code).toContain("public boolean sempred(RuleContext _localctx, int ruleIndex, int predIndex) {");
        expect(code).toContain("return PRED_sempred((RuleContext)_localctx, predIndex);");
        expect(code).toContain("return  nesting == 0 ;");
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
        expect(code).toContain("if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & 30L) != 0)) ) {");

        // Inverted sets.
        expect(code).toContain("if ( _la <= 0 || (_la==A || _la==B) ) {");
        expect(code).toContain("_errHandler.recoverInline(this);");
        expect(code).toContain("if ( _input.LA(1)==Token.EOF ) matchedEOF = true;");

        // Wildcard and list labels.
        expect(code).toContain("matchWildcard();");
        expect(code).toContain("public List<Token> ids = new ArrayList<Token>();");
        expect(code).toContain("((AContext)_localctx).ids.add(((AContext)_localctx).ID);");
        expect(code).toContain("public List<TerminalNode> ID() { return getTokens(TParser.ID); }");
        expect(code).toContain("public TerminalNode ID(int i) {");
    });
});
