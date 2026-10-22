/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { CppTargetGenerator } from "../../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../../src/default-target-generators/CSharpTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { IssueCode } from "../../src/tool/Issues.js";
import { generate, lexerOf, parserOf } from "../support/GenerationHelper.js";

/**
 * Grammar driven tests for the code generation triggers (SourceGenTriggers + OutputModelController + ParserFactory)
 * using the TypeScript target. Each test checks fragments of the generated code.
 */
describe("Code generation triggers coverage", () => {
    const parserGrammar =
        "grammar CG;\n" +
        "options { superClass = MyBase; contextSuperClass = MyCtx; TokenLabelType = MyToken; }\n" +
        "tokens { EXTRA }\n" +
        "@header { import { MyBase } from \"./MyBase.js\"; }\n" +
        "@parser::members { private member = 1; }\n" +
        "@lexer::members { private lexMember = 2; }\n" +
        "main : tok=ID toks+=ID* r=rule1[1] rs+=rule1[2] s=('a'|'b') ns=~('a'|'b') .\n" +
        "        {action();} {pred()}? {pred2()}?<fail='fail msg'> {pred3()}?<fail={failAction()}>\n" +
        "        ID? ID* ID+ (ID|INT)?? (ID|INT)*? (ID|INT)+? (ID INT)? (ID INT)* (ID INT)+ EOF ;\n" +
        "rule1[int x] returns [int y] locals [int z] @init {init();} @after {after();} : ID {$y = $x + $z;} ;\n" +
        "rule2 : ID # labelA | INT # labelB ;\n" +
        "rule3 : (ID | INT) ;\n" +
        "rule4 : ID<tokenIndex=3> ;\n" +
        "rule5 : ID ; catch [e] { handle(); } finally { fin(); }\n" +
        "rule6 : {pred()}? ID | INT ;\n" +
        "rule7 : ID ID | ID INT ;\n" +
        "rule8 : (ID ID | ID INT)* ;\n" +
        "rule9 : (ID ID | ID INT)+ ;\n" +
        "rule10 : (ID ID | ID INT)? ;\n" +
        "rule11 : ID? ;\n" +
        "rule12 : (ID|INT)? ;\n" +
        "rule13 : x=ID y=ID xs+=rule1[0] ys+=INT ;\n" +
        "rule14 : ~ID ;\n" +
        "rule15 : t=~ID ;\n" +
        "rule16 : . ;\n" +
        "rule17 : {ctx($ctx, $start, $stop, $text)} ID " +
        "{tok($ID.text, $ID.line, $ID.pos, $ID.index, $ID.type, $ID.int)} ;\n" +
        "rule18 : a=rule1[0] {use($a.y, $a.text, $a.start, $a.stop, $a.ctx)} ;\n" +
        "rule19 : EXTRA 'lit' ;\n" +
        "rule20 : (ID | INT)* ;\n" +
        "rule21 : (ID | INT)+ ;\n" +
        "rule22 : ID (',' ID)* ;\n" +
        "rule23 : ids+=ID (',' ids+=ID)* ;\n" +
        "rule24 : ('a' | 'b' | 'c')+ ;\n" +
        "rule25 : {$rule1::z = 1; $rule1::y;} ID ;\n" +
        "rule26 : <assoc=left> ID ;\n" +
        "rule27 : {use($ctx.foo)} ID ;\n" +
        "ID : [a-z]+ ;\n" +
        "INT : [0-9]+ ;\n" +
        "WS : [ \\t\\r\\n]+ -> channel(HIDDEN) ;\n";

    const lexerGrammar =
        "lexer grammar CGL;\n" +
        "options { superClass = MyLexerBase; caseInsensitive = true; }\n" +
        "tokens { EXTRA }\n" +
        "channels { COMMENTS }\n" +
        "@header { import { MyLexerBase } from \"./MyLexerBase.js\"; }\n" +
        "@members { private lexMember = 2; }\n" +
        "ID : [a-z]+ ;\n" +
        "INT : [0-9]+ ;\n" +
        "WS : [ \\t\\r\\n]+ -> channel(HIDDEN) ;\n" +
        "COMMENT : '//' ~[\\r\\n]* -> channel(COMMENTS) ;\n" +
        "SKIPME : '#' -> skip ;\n" +
        "MOREME : '$' -> more ;\n" +
        "PUSH : '{' -> pushMode(INNER) ;\n" +
        "TYPED : '!' -> type(ID) ;\n" +
        "ACT : '%' { lexAction(); } ;\n" +
        "PRED : '&' {lexPred()}? ;\n" +
        "MULTI : '@' -> type(INT), channel(HIDDEN) ;\n" +
        "fragment DIGIT : [0-9] ;\n" +
        "HEX : '0x' HEXDIGIT+ ;\n" +
        "fragment HEXDIGIT : [0-9a-f] ;\n" +
        "CS options { caseInsensitive = false; } : 'cs' ;\n" +
        "RANGE : 'a'..'c' 'x'? ;\n" +
        "UNI : '\\u00E9' | [\\p{Emoji}] | '\\u{1F600}' ;\n" +
        "NOTSET : ~('a' | 'b' | [c-d]) ;\n" +
        "EOFRULE : 'eof' EOF ;\n" +
        "mode INNER;\n" +
        "POP : '}' -> popMode ;\n" +
        "INNER_TEXT : ~[}]+ -> more, mode(DEFAULT_MODE) ;\n";

    it("parser with all element kinds", () => {
        const result = generate(parserGrammar, { generateListener: true, generateVisitor: true });
        expect(result.queue.errors).toHaveLength(0);
        expect(result.success).toBe(true);

        const parser = parserOf(result, "CG");

        // Grammar options and named actions.
        expect(parser).toContain("export class CGParser extends MyBase {");
        expect(parser).toContain("import { MyBase } from \"./MyBase.js\";");
        expect(parser).toContain("private member = 1;");
        expect(parser).toContain("public _tok: MyToken | null = null;");

        // Token refs with labels and list labels.
        expect(parser).toContain("localContext._tok = this.match(CGParser.ID);");
        expect(parser).toContain("(localContext._toks.push(localContext._ID!));");

        // Rule refs with labels and list labels.
        expect(parser).toContain("localContext._r = this.rule1(");
        expect(parser).toContain("(localContext._rs.push(localContext._rule1!));");

        // Labeled set and labeled not-set.
        expect(parser).toContain("localContext._s = this.tokenStream.LT(1);");
        expect(parser).toContain("localContext._s = this.errorHandler.recoverInline(this);");
        expect(parser).toContain("localContext._ns = this.tokenStream.LT(1);");
        expect(parser).toContain("if (_la <= 0 || _la === 1 || _la === 2) {");

        // Wildcard, actions and predicates with fail messages / fail actions.
        expect(parser).toContain("this.matchWildcard();");
        expect(parser).toContain("action();");
        expect(parser).toContain("throw this.createFailedPredicateException(\"pred()\", );");
        expect(parser).toContain("throw this.createFailedPredicateException(\"pred2()\", \"fail msg\");");
        expect(parser).toContain("throw this.createFailedPredicateException(\"pred3()\", failAction());");

        // Optional/star/plus with single alternatives (LL(1) and adaptive).
        expect(parser).toContain("} while (_la === 6);");
        expect(parser).toContain("while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {");
        expect(parser).toContain("this.match(CGParser.EOF);");

        // Non-greedy blocks exit first (alternative "1 + 1").
        expect(parser).toContain("case 1 + 1: {");
        expect(parser).toContain("while (alternative !== 1 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {");

        // Rule with args, return values, locals and init/after actions.
        expect(parser).toContain("public rule1(x: int): Rule1Context {");
        expect(parser).toContain("init();");
        expect(parser).toContain("(localContext!._y = localContext?.x! + localContext.z)");
        expect(parser).toContain("this.context!.stop = this.tokenStream.LT(-1);");

        // Alternative labels.
        expect(parser).toContain("localContext = new LabelAContext(localContext);");
        expect(parser).toContain("export class LabelBContext extends Rule2Context {");

        // Exception handlers.
        expect(parser).toContain("} catch (e) {\n             handle(); ");
        expect(parser).toContain("fin();");

        // Labels on tokens, rule refs and list labels in the context class.
        expect(parser).toContain("public _xs: Rule1Context [] = [];");
        expect(parser).toContain("public _ys: antlr.Token[] = [];");
        expect(parser).toContain("(localContext._xs.push(localContext._rule1!));");

        // Not-token with and without label.
        expect(parser).toContain("localContext._t = this.tokenStream.LT(1);");
        expect(parser).toContain("if (_la <= 0 || _la === 6) {");

        // Attribute references.
        expect(parser).toContain("ctx(localContext, localContext.start, localContext.stop, " +
            "this.tokenStream.getTextFromRange(localContext.start, this.tokenStream.LT(-1)))");
        expect(parser).toContain("tok((localContext._ID?.text ?? ''), (localContext._ID?.line ?? 0), " +
            "(localContext._ID?.column ?? 0), (localContext._ID?.tokenIndex ?? 0), (localContext._ID?.type ?? 0), " +
            "Number(localContext._ID?.text ?? '0'))");
        expect(parser).toContain("use(localContext._a!.y, (localContext._a != null ? " +
            "this.tokenStream.getTextFromRange(localContext._a.start, localContext._a.stop) : ''), " +
            "(localContext._a!.start), (localContext._a!.stop), (localContext._a)");
        expect(parser).toContain("(this.getInvokingContext(1) as Rule1Context).z = 1; " +
            "(this.getInvokingContext(1) as Rule1Context).y;");
        expect(parser).toContain("use(localContext.foo)");

        // Tokens block and implicit literal tokens.
        expect(parser).toContain("this.match(CGParser.EXTRA);");
        expect(parser).toContain("this.match(CGParser.T__2);");
        expect(parser).toContain("(localContext._ids.push(localContext._ID!));");

        // Listener and visitor files.
        const listener = result.files.get("CGListener.ts")!;
        expect(listener).toContain("enterLabelA?: (ctx: LabelAContext) => void;");
        expect(listener).toContain("exitRule27?: (ctx: Rule27Context) => void;");

        const visitor = result.files.get("CGVisitor.ts")!;
        expect(visitor).toContain("visitLabelB?: (ctx: LabelBContext) => Result;");

        // Vocabulary files.
        expect(result.files.get("CG.tokens")).toMatch(/EXTRA\s+= 9\n/);
        expect(result.files.get("CGLexer.tokens")).toMatch(/'lit'\s+= 3\n/);
    });

    it("lexer with commands, modes, channels, actions and predicates", () => {
        const result = generate(lexerGrammar, { generateInterpreterData: true });
        expect(result.queue.errors).toHaveLength(0);

        const lexer = lexerOf(result, "CGL");
        expect(lexer).toContain("export class CGL extends MyLexerBase {");
        expect(lexer).toContain("import { MyLexerBase } from \"./MyLexerBase.js\";");
        expect(lexer).toContain("private lexMember = 2;");
        expect(lexer).toContain("public static readonly INNER = 1;");
        expect(lexer).toContain("\"DEFAULT_TOKEN_CHANNEL\", \"HIDDEN\", \"COMMENTS\"");
        expect(lexer).toContain("\"DEFAULT_MODE\", \"INNER\"");
        expect(lexer).toContain("\"ID\", \"INT\", \"WS\", \"COMMENT\", \"SKIPME\", \"MOREME\", \"PUSH\", \"TYPED\", ");

        // Custom actions and predicates are dispatched by rule index.
        expect(lexer).toContain("this.ACT_action(localContext, actionIndex);");
        expect(lexer).toContain("lexAction();");
        expect(lexer).toContain("return this.PRED_sempred(localContext, predIndex);");
        expect(lexer).toContain("return lexPred();");

        // Fragment rules are not tokens, but the types for the tokens block entry and commands are allocated.
        expect(lexer).toContain("public static readonly EXTRA = 1;");
        expect(lexer).not.toContain("public static readonly DIGIT");
        expect(lexer).toContain("public static readonly TYPED = 18;");

        // Interpreter data.
        const interp = result.files.get("CGL.interp")!;
        expect(interp).toContain("rule names:\nID\nINT\nWS\nCOMMENT\nSKIPME\nMOREME\nPUSH\nTYPED\nACT\nPRED\n" +
            "MULTI\nDIGIT\nHEX\nHEXDIGIT\nCS\nRANGE\nUNI\nNOTSET\nEOFRULE\nPOP\nINNER_TEXT\n");
        expect(interp).toContain("channel names:\nDEFAULT_TOKEN_CHANNEL\nHIDDEN\n");
        expect(interp).toContain("COMMENTS\nmode names:\nDEFAULT_MODE\nINNER\n");
        expect(interp).toContain("atn:\n");
    });

    it("base listener and base visitor generation", () => {
        const grammar =
            "grammar Base;\n" +
            "a : b # one | ID # two ;\n" +
            "b : ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar, {
            generateListener: true,
            generateVisitor: true,
            generateBaseListener: true,
            generateBaseVisitor: true,
            generateInterpreterData: true,
            package: "my.pkg",
        });
        expect(result.queue.errors).toHaveLength(0);
        expect([...result.files.keys()].sort()).toEqual([
            "Base.g4", "Base.interp", "Base.tokens", "BaseBaseListener.ts", "BaseBaseVisitor.ts", "BaseLexer.interp",
            "BaseLexer.tokens", "BaseLexer.ts", "BaseListener.ts", "BaseParser.ts", "BaseVisitor.ts",
        ]);

        // The TypeScript target has no content for base listeners/visitors (listener methods are optional).
        expect(result.files.get("BaseBaseListener.ts")).toBe("");
        expect(result.files.get("BaseBaseVisitor.ts")).toBe("");
        expect(result.files.get("BaseListener.ts")).toContain("enterOne?: (ctx: OneContext) => void;");
        expect(result.files.get("BaseVisitor.ts")).toContain("visitTwo?: (ctx: TwoContext) => Result;");
        expect(result.files.get("Base.interp")).toContain("rule names:\na\nb\n");
        expect(result.files.get("Base.interp")).not.toContain("channel names:");
    });

    it("ATN dot files are generated for all rules when requested", () => {
        const grammar =
            "grammar Dot;\n" +
            "a : b+ (ID | INT)? {true}? {act();} ~ID . EOF ;\n" +
            "b : ID (',' ID)* ;\n" +
            "e : e '+' e | ID ;\n" +
            "ID : [a-z]+ ;\n" +
            "INT : [0-9]+ ;\n" +
            "fragment F : 'f' ;\n" +
            "G : F 'a'..'z' [0-9] ~[a] -> skip ;\n";

        const result = generate(grammar, { atn: true });
        expect(result.queue.errors).toHaveLength(0);

        const parserDot = result.files.get("Dot.a.dot")!;
        expect(parserDot).toContain("digraph ATN {");
        expect(parserDot).toContain("rankdir=LR;");
        expect(parserDot).toContain("label = \"<b>\"");
        expect(parserDot).toContain("label = \"pred_0:0\"");
        expect(parserDot).toContain("label = \"action_0:-1\"");
        expect(parserDot).toContain("label = \"~ID\"");
        expect(parserDot).toContain("label = \".\"");
        expect(parserDot).toContain("label = \"EOF\"");
        expect(parserDot).toContain("shape=record");

        expect(result.files.get("Dot.e.dot")).toContain("label = \"<e[3]>\"");

        const lexerDot = result.files.get("DotLexer.G.dot")!;
        expect(lexerDot).toContain("label = \"<F>\"");
        expect(lexerDot).toContain("label = \"'a'..'z'\"");
        expect(lexerDot).toContain("label = \"{'0'..'9'}\"");
        expect(lexerDot).toContain("label = \"action_5:0\"");
        expect(lexerDot).toContain("label = \"~'a'\"");
        expect(lexerDot).toContain("shape=doublecircle");
    });

    it("throws clauses, bare element options, wildcards with options and sub blocks with options", () => {
        const grammar =
            "grammar Edge;\n" +
            "a throws Foo, Bar : A<foo> .<tokenIndex=3> ;\n" +
            "b : (options{foo=bar;}: A A | B) ;\n" +
            "c : (A<tokenIndex=1> | B<x='s'> | 'lit'<y>) ;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);
        expect(result.queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.IllegalOption);

        const parser = parserOf(result, "Edge");
        expect(parser).toMatch(
            /this\.match\(EdgeParser\.A\);\s+this\.state = \d+;\s+this\.matchWildcard\(\);/);
        expect(parser).toMatch(
            /this\.match\(EdgeParser\.A\);\s+this\.state = \d+;\s+this\.match\(EdgeParser\.A\);/);
        expect(parser).toContain("if (!((((_la) & ~0x1F) === 0&& ((1 << _la) & 14) !== 0))) {");
    });

    it("lexer predicates, epsilon alternatives, set element options and wildcard options", () => {
        const grammar =
            "lexer grammar LexEdge;\n" +
            "A : 'a' {p()}? ;\n" +
            "B : 'b' | ;\n" +
            "C : ('c'<x> | 'd'<y='z'>) ;\n" +
            "D : .<tokenIndex=1> ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);
        const codes = result.queue.warnings.map((w) => { return w.code; });
        expect(codes).toContain(IssueCode.EpsilonToken);
        expect(codes).toContain(IssueCode.IllegalOption);

        const lexer = lexerOf(result, "LexEdge");
        expect(lexer).toContain("return p();");
        expect(lexer).toContain("\"A\", \"B\", \"C\", \"D\"");
    });

    it("C# and C++ generators render the same grammars", () => {
        const csGenerator = new CSharpTargetGenerator(false);
        csGenerator.setUp();
        const cppGenerator = new CppTargetGenerator(false, { exportMacro: "MY_EXPORT" });
        cppGenerator.setUp();

        const options = {
            generateListener: true,
            generateVisitor: true,
            generateBaseListener: true,
            generateBaseVisitor: true,
            generateDeclarationFile: true,
            generateInterpreterData: true,
            package: "my.pkg",
        };

        const csParser = generate(parserGrammar, options, (config) => {
            config.generators = [csGenerator];
        });
        expect(csParser.queue.errors).toHaveLength(0);
        const csCode = csParser.files.get("CGParser.cs")!;
        expect(csCode).toContain("namespace my.pkg {");
        expect(csCode).toContain("public partial class CGParser : MyBase {");
        expect(csCode).toContain("public partial class LabelAContext : Rule2Context {");
        expect(csCode).toContain("if (!(pred2())) throw new FailedPredicateException(this, \"pred2()\"");
        expect(csCode).toContain("case 1: return pred2();");
        expect(csParser.files.get("CGLexer.cs")).toContain("public partial class CGLexer : Lexer {");
        expect(csParser.files.get("CGListener.cs"))
            .toContain("void EnterLabelA([NotNull] CGParser.LabelAContext context);");
        expect(csParser.files.get("CGBaseVisitor.cs")).toContain("public virtual Result VisitLabelB(");

        const csLexer = generate(lexerGrammar, options, (config) => {
            config.generators = [csGenerator];
        });
        expect(csLexer.queue.errors).toHaveLength(0);
        const csLexerCode = csLexer.files.get("CGL.cs")!;
        expect(csLexerCode).toContain("public partial class CGL : MyLexerBase {");
        expect(csLexerCode).toContain("\"DEFAULT_TOKEN_CHANNEL\", \"HIDDEN\", \"COMMENTS\"");
        expect(csLexerCode).toContain("case 0: return lexPred();");

        const cppParser = generate(parserGrammar, options, (config) => {
            config.generators = [cppGenerator];
        });
        expect(cppParser.queue.errors).toHaveLength(0);
        expect([...cppParser.files.keys()].filter((name) => { return name.endsWith(".h"); }).sort()).toEqual([
            "CGBaseListener.h", "CGBaseVisitor.h", "CGLexer.h", "CGListener.h", "CGParser.h", "CGVisitor.h",
        ]);
        const cppHeader = cppParser.files.get("CGParser.h")!;
        expect(cppHeader).toContain("namespace my.pkg {");
        expect(cppHeader).toContain("class MY_EXPORT CGParser : public MyBase {");
        expect(cppHeader).toContain("class MY_EXPORT LabelAContext : public Rule2Context {");
        const cppCode = cppParser.files.get("CGParser.cpp")!;
        expect(cppCode)
            .toContain("CGParser::LabelAContext::LabelAContext(Rule2Context *ctx) { copyFrom(ctx); }");
        expect(cppCode).toContain("if (!(pred2())) throw FailedPredicateException(this, \"pred2()\"");
        expect(cppCode).toContain("bool CGParser::mainSempred(MainContext *_localctx, size_t predicateIndex) {");
        expect(cppParser.files.get("CGLexer.cpp"))
            .toContain("CGLexer::CGLexer(CharStream *input) : antlr4::Lexer(input) {");
        expect(cppParser.files.get("CGBaseListener.h"))
            .toContain("virtual void enterLabelA(CGParser::LabelAContext * /*ctx*/) override { }");

        const cppLexer = generate(lexerGrammar, options, (config) => {
            config.generators = [cppGenerator];
        });
        expect(cppLexer.queue.errors).toHaveLength(0);
        const cppLexerCode = cppLexer.files.get("CGL.cpp")!;
        expect(cppLexerCode).toContain("CGL::CGL(CharStream *input) : MyLexerBase(input) {");
        expect(cppLexerCode)
            .toContain("void CGL::ACTAction(antlr4::RuleContext *context, size_t actionIndex) {");
        expect(cppLexerCode).toContain("bool CGL::PREDSempred(");
        expect(cppLexerCode).toContain("case 0: return lexPred();");
    });

    it("attribute references and left recursion in all built-in generators", () => {
        const actions =
            "grammar Act;\n" +
            "r[int arg] returns [int ret] locals [int loc]\n" +
            "  : x=ID ids+=ID* {use($x, $ids, $ret, $arg, $loc, $parser, $ctx.foo, $start, $stop, $text)} ;\n" +
            "s : t=r[1] {use($t.ret, $t.text, $t.start, $t.stop, $t.ctx)} ;\n" +
            "ID : [a-z]+ ;\n";

        const leftRecursive =
            "grammar LR;\n" +
            "e : <assoc=right> l=e '^' r=e # pow\n" +
            "  | e op=('*' | '/') e        # mulDiv\n" +
            "  | e '++' {post();}          # postInc\n" +
            "  | '-' e                     # neg\n" +
            "  | INT                       # int\n" +
            "  ;\n" +
            "INT : [0-9]+ ;\n";

        // TypeScript.
        const tsActions = generate(actions);
        expect(tsActions.queue.errors).toHaveLength(0);
        const tsCode = parserOf(tsActions, "Act");
        expect(tsCode).toContain("use(localContext?._x!, localContext?._ids, localContext.ret, localContext?.arg!, " +
            "localContext.loc, this, localContext.foo, localContext.start, localContext.stop, " +
            "this.tokenStream.getTextFromRange(localContext.start, this.tokenStream.LT(-1)))");
        expect(tsCode).toContain("use(localContext._t!.ret, (localContext._t != null ? " +
            "this.tokenStream.getTextFromRange(localContext._t.start, localContext._t.stop) : ''), " +
            "(localContext._t!.start), (localContext._t!.stop), (localContext._t)");

        // C#.
        const csGenerator = new CSharpTargetGenerator(false);
        csGenerator.setUp();
        const csActions = generate(actions, {}, (config) => { config.generators = [csGenerator]; });
        expect(csActions.queue.errors).toHaveLength(0);
        const csCode = csActions.files.get("ActParser.cs")!;
        expect(csCode).toContain("_localctx.x\n");
        expect(csCode).toContain("_localctx.ret\n");
        expect(csCode).toContain("_localctx.t!.ret\n");
        expect(csCode)
            .toContain("(_localctx.t != null ? TokenStream.GetText(_localctx.t.Start, _localctx.t.Stop) : null)");

        const csLr = generate(leftRecursive, {}, (config) => { config.generators = [csGenerator]; });
        expect(csLr.queue.errors).toHaveLength(0);
        const csLrCode = csLr.files.get("LRParser.cs")!;
        expect(csLrCode).toContain("EnterRecursionRule(_localctx, 0, RULE_e, _p);");
        expect(csLrCode).toContain("PushNewRecursionContext(_localctx, _startState, RULE_e);");
        expect(csLrCode).toContain("if (!(Precpred(Context, 5))) throw new FailedPredicateException(this, " +
            "\"Precpred(Context, 5)\");");
        expect(csLrCode).toContain("public partial class PowContext : EContext {");
        expect(csLrCode).toContain("case 0: return Precpred(Context, 5);");

        const csTest = csGenerator.renderTestFile("LR", "LRLexer", "LRParser", "e", true, false, true, false, true,
            true, "LL", true);
        expect(csTest).toContain("using Antlr4.Runtime;");
        expect(csTest).toContain("var lex = new LRLexer(input);");

        // C++.
        const cppGenerator = new CppTargetGenerator(false);
        cppGenerator.setUp();
        const cppActions = generate(actions, { generateDeclarationFile: true },
            (config) => { config.generators = [cppGenerator]; });
        expect(cppActions.queue.errors).toHaveLength(0);
        const cppCode = cppActions.files.get("ActParser.cpp")!;
        expect(cppCode).toContain("_localctx->ret\n");
        expect(cppCode).toContain("_localctx->t!->ret\n");
        expect(cppCode).toContain("(_localctx->t != nullptr ? _input->getText(_localctx->t->start, " +
            "_localctx->t->stop) : nullptr)");

        const cppLr = generate(leftRecursive, { generateDeclarationFile: true },
            (config) => { config.generators = [cppGenerator]; });
        expect(cppLr.queue.errors).toHaveLength(0);
        const cppLrCode = cppLr.files.get("LRParser.cpp")!;
        expect(cppLrCode).toContain("enterRecursionRule(_localctx, 0, LRParser::RuleE, precedence);");
        expect(cppLrCode).toContain("unrollRecursionContexts(parentContext);");
        expect(cppLrCode).toContain("newContext->l = previousContext;");
        expect(cppLrCode).toContain("antlrcpp::downCast<PowContext *>(_localctx)->r = e(5);");
        expect(cppLrCode)
            .toContain("if (!(precpred(_ctx, 5))) throw FailedPredicateException(this, \"precpred(_ctx, 5)\");");
        expect(cppLr.files.get("LRParser.h")).toContain("class  PowContext : public EContext {");

        const cppTest = cppGenerator.renderTestFile("LR", "LRLexer", "LRParser", "e", true, false, true, false, true,
            true, "LL", true);
        expect(cppTest).toContain("int main(int argc, const char* argv[]) {");
        expect(cppTest).toContain("LRLexer lexer(&input);");
        expect(cppTest).toContain("LRParser parser(&tokens);");
        expect(cppTest).toContain("tree::ParseTree *tree = parser.e();");
    });

    it("non-ASCII and supplementary code points in literals are escaped", () => {
        const result = generate("grammar Uni;\na : '\\u{1F600}' '\\u00E9' 'x' ;\n");
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "Uni");
        expect(parser).toContain("\\\\uD83D");
        expect(parser).toMatch(/"'\\\\u00E9'", "'x'"/);
        expect(parser).toContain("this.match(UniParser.T__0);");
        expect(result.files.get("UniLexer.tokens")).toContain("'x'");
    });

    it("rendering log markers can be enabled on a generator", () => {
        const loggingGenerator = new TypeScriptTargetGenerator(true);
        loggingGenerator.setUp();

        const result = generate("grammar Log;\na : A? b ;\nb : A ;\nA : 'a' ;\n", { generateListener: true },
            (config) => { config.generators = [loggingGenerator]; });
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "Log");
        expect(parser).toContain("/* Start rendering ruleFunction */");
        expect(parser).toContain("/* End rendering ruleFunction */");
        expect(parser).toContain("/* Start rendering InvokeRule */");
        expect(parser).toContain("/* Start rendering MatchToken */");
        expect(parser).toContain("/* Start rendering OptionalBlock */");
        expect(parser).toContain("public a(): AContext {");
    });

    it("label on a block which is not a set is an error", () => {
        const grammar =
            "grammar Bad;\n" +
            "a : x=(ID ID | INT) ;\n" +
            "ID : [a-z]+ ;\n" +
            "INT : [0-9]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors.map((e) => { return e.code; })).toContain(IssueCode.LabelBlockNotASet);
    });

    it("conflicting label types are reported", () => {
        const grammar =
            "grammar Bad2;\n" +
            "a : zs+=ID zs+=b ;\n" +
            "b : INT ;\n" +
            "ID : [a-z]+ ;\n" +
            "INT : [0-9]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors.map((e) => { return e.code; })).toContain(IssueCode.LabelTypeConflict);
    });

    it("channels in combined grammars are reported", () => {
        const grammar =
            "grammar Bad4;\n" +
            "channels { C }\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors.map((e) => { return e.code; })).toContain(IssueCode.ChannelsBlockInCombinedGrammar);
    });

    it("combined grammar with lexer modes is an error", () => {
        const grammar =
            "grammar Bad3;\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n" +
            "mode M;\n" +
            "X : 'x' ;\n";

        const result = generate(grammar);
        expect(result.queue.errors.map((e) => { return e.code; })).toContain(IssueCode.ModeNotInLexer);
    });

    it("lexer and parser grammars with token vocabulary", () => {
        const lexer =
            "lexer grammar VLexer;\n" +
            "ID : [a-z]+ ;\n" +
            "INT : [0-9]+ ;\n" +
            "PLUS : '+' ;\n";
        const parser =
            "parser grammar VParser;\n" +
            "options { tokenVocab = VLexer; }\n" +
            "expr : expr PLUS expr | ID | INT ;\n";

        const result = generate([{ name: "VLexer.g4", content: lexer }, { name: "VParser.g4", content: parser }]);
        expect(result.queue.errors).toHaveLength(0);

        const parserCode = result.files.get("VParser.ts")!;
        expect(parserCode).toContain("public static readonly PLUS = 3;");
        expect(parserCode).toContain("this.match(VParser.PLUS);");
        expect(parserCode).toContain("this.precpred(this.context, 3)");
    });

    it("no grammar files is reported", () => {
        const result = generate([]);
        expect(result.success).toBe(false);
        expect(result.queue.errors.map((e) => { return e.code; })).toEqual([IssueCode.NoGrammarsFound]);
    });
});
