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
import { GoTargetGenerator } from "../../src/default-target-generators/GoTargetGenerator.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";

const goGenerator = new GoTargetGenerator(false);
goGenerator.setUp();

const createConfig = (outputDirectory: string, packageName?: string) => {
    return defineConfig({
        grammarFiles: [],
        generators: [goGenerator],
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
 * @param packageName The Go package name to use (if any).
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

    const gen = new CodeGenerator(grammar, goGenerator, config.generationOptions);

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

    const factory = new LexerATNFactory(grammar, goGenerator);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, goGenerator, dummyParameters.generationOptions);

    return gen.generateLexer(dummyParameters.generationOptions);
};

describe("TestGoCodeGeneration", () => {
    it("File names", () => {
        expect(goGenerator.getRecognizerFileName(false, "MySQLParser")).toBe("mysql_parser.go");
        expect(goGenerator.getRecognizerFileName(false, "MySQLLexer")).toBe("mysql_lexer.go");
        expect(goGenerator.getRecognizerFileName(false, "ExprParser")).toBe("expr_parser.go");
        expect(goGenerator.getListenerFileName(false, "MySQLParser")).toBe("mysqlparser_listener.go");
        expect(goGenerator.getBaseListenerFileName(false, "MySQLParser")).toBe("mysqlparser_base_listener.go");
        expect(goGenerator.getVisitorFileName(false, "Expr")).toBe("expr_visitor.go");
        expect(goGenerator.getBaseVisitorFileName(false, "Expr")).toBe("expr_base_visitor.go");
    });

    it("Generated files of a combined grammar", () => {
        const config = createConfig("/go-spec-out", "mypkg");
        const grammar = new Grammar(
            "grammar T;\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n");
        grammar.fileName = "T.g4";
        grammar.tool.process(grammar, config, true);
        expect(grammar.tool.getNumErrors()).toBe(0);

        const files = fileSystem.readdirSync("/go-spec-out") as string[];
        expect(files).toContain("t_parser.go");
        expect(files).toContain("t_lexer.go");
        expect(files).toContain("t_listener.go");
        expect(files).toContain("t_base_listener.go");
        expect(files).toContain("t_visitor.go");
        expect(files).toContain("t_base_visitor.go");

        const parser = fileSystem.readFileSync("/go-spec-out/t_parser.go", "utf-8") as string;
        expect(parser.startsWith("// Code generated from T.g4 by antlr-ng")).toBe(true);
        expect(parser).toContain("package mypkg // T");
        expect(parser).toContain("func NewTParser(input antlr.TokenStream) *TParser {");
        expect(parser).toContain("func (p *TParser) A() (localctx IAContext) {");

        const lexer = fileSystem.readFileSync("/go-spec-out/t_lexer.go", "utf-8") as string;
        expect(lexer).toContain("package mypkg");
        expect(lexer).toContain("func NewTLexer(input antlr.CharStream) *TLexer {");
        expect(lexer).toContain("const TLexerID = 1");

        const listener = fileSystem.readFileSync("/go-spec-out/t_listener.go", "utf-8") as string;
        expect(listener).toContain("type TListener interface {");
        expect(listener).toContain("EnterA(c *AContext)");

        const baseVisitor = fileSystem.readFileSync("/go-spec-out/t_base_visitor.go", "utf-8") as string;
        expect(baseVisitor).toContain("func (v *BaseTVisitor) VisitA(ctx *AContext) interface{} {");
    });

    it("Default package name", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : 'a' ;\n");

        expect(code).toContain("package parser // T");
        expect(code).toContain("\t\"github.com/antlr4-go/antlr/v4\"");
    });

    it("Reserved words are escaped", () => {
        const code = generateParser(
            "grammar T;\n" +
            "type : start=ID stop=ID func=ID map ;\n" +
            "map : ID ;\n" +
            "ID : [a-z]+ ;\n");

        // Rule names which are Go keywords get an underscore suffix.
        expect(code).toContain("func (p *TParser) Type_() (localctx ITypeContext) {");
        expect(code).toContain("func (p *TParser) Map_() (localctx IMapContext) {");
        expect(code).toContain("TParserRULE_type = 0");

        // Labels named like methods of the rule context base type are escaped too.
        expect(code).toContain("start_ antlr.Token");
        expect(code).toContain("GetStart_() antlr.Token");
        expect(code).toContain("func_ antlr.Token");
        expect(code).toContain("localctx.(*TypeContext).stop_ = _m");
    });

    it("Left recursive rule", () => {
        const code = generateParser(
            "grammar T;\n" +
            "e : e '*' e # mul\n" +
            "  | e '+' e # add\n" +
            "  | INT     # int\n" +
            "  ;\n" +
            "INT : [0-9]+ ;\n");

        expect(code).toContain("func (p *TParser) E() (localctx IEContext) {");
        expect(code).toContain("\treturn p.e(0)");
        expect(code).toContain("func (p *TParser) e(_p int) (localctx IEContext) {");
        expect(code).toContain("p.EnterRecursionRule(localctx, 0, TParserRULE_e, _p)");
        expect(code).toContain("localctx = NewMulContext(p, NewEContext(p, _parentctx, _parentState))");
        expect(code).toContain("p.PushNewRecursionContext(localctx, _startState, TParserRULE_e)");
        expect(code).toContain("if !(p.Precpred(p.GetParserRuleContext(), 2)) {");
        expect(code).toContain("p.UnrollRecursionContexts(_parentctx)");
        expect(code).toContain("func (p *TParser) E_Sempred(localctx antlr.RuleContext, predIndex int) bool {");

        // Alternative labels produce their own context types.
        expect(code).toContain("type MulContext struct {\n\tEContext\n}");
        expect(code).toContain("func (s *MulContext) Accept(visitor antlr.ParseTreeVisitor) interface{} {");
    });

    it("Rule arguments, return values and actions", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a[int depth] returns [int value] locals [boolean seen]\n" +
            "  : {$depth < 10}? t=ID { $value = $depth + 1; } { _ = $t.channel }\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("func (p *TParser) A(depth int) (localctx IAContext) {");
        expect(code).toContain("localctx = NewAContext(p, p.GetParserRuleContext(), p.GetState(), depth)");
        expect(code).toContain("func NewAContext(parser antlr.Parser, parent antlr.ParserRuleContext, " +
            "invokingState int, depth int) *AContext {");
        expect(code).toContain("\tdepth int\n");
        expect(code).toContain("\tvalue int\n");

        // The "boolean" type is mapped to Go's "bool".
        expect(code).toContain("\tseen bool\n");
        expect(code).toContain("GetSeen() bool");

        // Predicates and attribute access go through the typed context.
        expect(code).toContain("if !(localctx.(*AContext).depth < 10) {");
        expect(code).toContain("localctx.(*AContext).SetValue(localctx.(*AContext).depth + 1)");

        // Token property references are nil-safe.
        expect(code).toContain("return localctx.(*AContext).GetT().GetChannel()");
    });

    it("Multi-line predicates are collapsed", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : {\n    true\n}? ID ;\n" +
            "ID : [a-z]+ ;\n");

        // Go inserts semicolons at line ends, so the predicate must end up on a single line in both places.
        expect(code).toContain("if !(true) {");
        expect(code).toContain("return true\n");
        expect(code).not.toContain("return \n");
    });

    it("Qualified return value references use the escaped label getter", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : type=b { _ = $type.value } ;\n" +
            "b returns [int value] : ID ;\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("GetType_() IBContext");
        expect(code).toContain("localctx.(*AContext).GetType_().GetValue()");
        expect(code).not.toContain("GetType().GetValue()");
    });

    it("Test driver escapes the start rule", () => {
        const code = goGenerator.renderTestFile("T", "TLexer", "TParser", "type", false, false, false, false, false,
            false, "LL", true);

        expect(code).toContain("tree := p.Type_()");
    });

    it("Lexer with modes and channels", () => {
        const code = generateLexer(
            "lexer grammar L;\n" +
            "channels { COMMENTS, DIRECTIVES }\n" +
            "OPEN : '<' -> pushMode(TAG) ;\n" +
            "COMMENT : '//' ~[\\r\\n]* -> channel(COMMENTS) ;\n" +
            "NUMBER : [0-9]+ { fmt.Println(\"number\") } ;\n" +
            "PRED : 'pred' { p.GetCharIndex() > 0 }? ;\n" +
            "mode TAG;\n" +
            "CLOSE : '>' -> popMode ;\n" +
            "mode STR;\n" +
            "QUOTE : '\"' -> popMode ;\n");

        expect(code).toContain("type L struct {\n\t*antlr.BaseLexer\n");
        expect(code).toContain("staticData.ChannelNames = []string{\n\t\t\"DEFAULT_TOKEN_CHANNEL\", \"HIDDEN\", " +
            "\"COMMENTS\", \"DIRECTIVES\",\n\t}");
        expect(code).toContain("staticData.ModeNames = []string{\n\t\t\"DEFAULT_MODE\", \"TAG\", \"STR\",\n\t}");
        expect(code).toContain("// L tokens.\nconst (\n\tLOPEN = 1\n\tLCOMMENT = 2\n");
        expect(code).toContain("// L escapedChannels.\nconst (\n\tLCOMMENTS = 2\n\tLDIRECTIVES = 3\n)");
        expect(code).toContain("// L modes.\nconst (\n\tLTAG = iota + 1\n\tLSTR\n)");

        // Lexer actions and predicates are dispatched by rule index.
        expect(code).toContain("func (l *L) Action(localctx antlr.RuleContext, ruleIndex, actionIndex int) {");
        expect(code).toContain("l.NUMBER_Action(localctx, actionIndex)");
        expect(code).toContain("func (l *L) NUMBER_Action(localctx antlr.RuleContext, actionIndex int) {");
        expect(code).toContain("func (l *L) Sempred(localctx antlr.RuleContext, ruleIndex, predIndex int) bool {");
        expect(code).toContain("return l.PRED_Sempred(localctx, predIndex)");
        expect(code).toContain("func (p *L) PRED_Sempred(localctx antlr.RuleContext, predIndex int) bool {");
    });

    it("Sets and lookahead tests", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : (A | B | C | D)* ~(A | B) . ;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n" +
            "D : 'd' ;\n");

        // More than two tokens in a set use a bit test.
        expect(code).toContain("if !(((int64(_la) & ^0x3f) == 0 && ((int64(1) << _la) & 30) != 0)) {");

        // Inverted sets.
        expect(code).toContain("if _la <= 0 || _la == TParserA || _la == TParserB {");
        expect(code).toContain("p.GetErrorHandler().RecoverInline(p)");

        // Wildcard.
        expect(code).toContain("p.MatchWildcard()");
    });
});
