/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore localctx sempred precpred

import { describe, expect, it } from "vitest";

await import("../../src/Tool.js"); // To kick off the loading of the tool

import { LexerATNFactory } from "../../src/automata/LexerATNFactory.js";
import { ParserATNFactory } from "../../src/automata/ParserATNFactory.js";
import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { Python3TargetGenerator } from "../../src/default-target-generators/Python3TargetGenerator.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";

const pythonGenerator = new Python3TargetGenerator(false);
pythonGenerator.setUp();

const createConfig = (outputDirectory: string, packageName?: string) => {
    return defineConfig({
        grammarFiles: [],
        generators: [pythonGenerator],
        generationOptions: {
            outputDirectory,
            generateListener: true,
            generateVisitor: true,
            generateBaseListener: false, // Python has no base listener/visitor classes.
            generateBaseVisitor: false,
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

    const gen = new CodeGenerator(grammar, pythonGenerator, dummyParameters.generationOptions);

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

    const factory = new LexerATNFactory(grammar, pythonGenerator);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, pythonGenerator, dummyParameters.generationOptions);

    return gen.generateLexer(dummyParameters.generationOptions);
};

describe("TestPython3CodeGeneration", () => {
    it("Generated files of a combined grammar", () => {
        const config = createConfig("/python3-spec-out", "my.pkg");
        const grammar = new Grammar(
            "grammar T;\n" +
            "a : ID ;\n" +
            "ID : [a-z]+ ;\n");
        grammar.fileName = "T.g4";
        grammar.tool.process(grammar, config, true);
        expect(grammar.tool.getNumErrors()).toBe(0);

        const files = fileSystem.readdirSync("/python3-spec-out") as string[];
        expect(files).toContain("TParser.py");
        expect(files).toContain("TLexer.py");
        expect(files).toContain("TListener.py");
        expect(files).toContain("TVisitor.py");

        const parser = fileSystem.readFileSync("/python3-spec-out/TParser.py", "utf-8") as string;
        expect(parser.startsWith("# Generated from T.g4 by antlr-ng")).toBe(true);
        expect(parser).toContain("# encoding: utf-8\nfrom antlr4 import *\n");
        expect(parser).toContain("def serializedATN():\n    return [\n");
        expect(parser).toContain("class TParser ( Parser ):\n");
        expect(parser).toContain("    grammarFileName = \"T.g4\"\n");
        expect(parser).toContain("    RULE_a = 0\n");
        expect(parser).toContain("    ruleNames =  [ \"a\" ]\n");
        expect(parser).toContain("    EOF = Token.EOF\n    ID=1\n");
        expect(parser).toContain("    def __init__(self, input:TokenStream, output:TextIO = sys.stdout):\n" +
            "        super().__init__(input, output)\n" +
            "        self.checkVersion(\"4.13.2\")\n");

        // The contexts are nested classes of the parser.
        expect(parser).toContain("    class AContext(ParserRuleContext):\n        __slots__ = 'parser'\n");
        expect(parser).toContain("        def ID(self):\n            return self.getToken(TParser.ID, 0)\n");
        expect(parser).toContain("        def getRuleIndex(self):\n            return TParser.RULE_a\n");
        expect(parser).toContain("        def enterRule(self, listener:ParseTreeListener):\n" +
            "            if hasattr( listener, \"enterA\" ):\n" +
            "                listener.enterA(self)\n");
        expect(parser).toContain("        def accept(self, visitor:ParseTreeVisitor):\n" +
            "            if hasattr( visitor, \"visitA\" ):\n" +
            "                return visitor.visitA(self)\n" +
            "            else:\n" +
            "                return visitor.visitChildren(self)\n");
        expect(parser).toContain("    def a(self):\n\n" +
            "        localctx = TParser.AContext(self, self._ctx, self.state)\n" +
            "        self.enterRule(localctx, 0, self.RULE_a)\n");
        expect(parser).toContain("        except RecognitionException as re:\n" +
            "            localctx.exception = re\n");
        expect(parser).toContain("        finally:\n            self.exitRule()\n        return localctx\n");

        const lexer = fileSystem.readFileSync("/python3-spec-out/TLexer.py", "utf-8") as string;
        expect(lexer).toContain("class TLexer(Lexer):\n");
        expect(lexer).toContain("    ID = 1\n");
        expect(lexer).toContain("    channelNames = [ u\"DEFAULT_TOKEN_CHANNEL\", u\"HIDDEN\" ]\n");
        expect(lexer).toContain("    modeNames = [ \"DEFAULT_MODE\" ]\n");
        expect(lexer).toContain("    grammarFileName = \"T.g4\"\n");
        expect(lexer).toContain("    def __init__(self, input=None, output:TextIO = sys.stdout):\n");
        expect(lexer).toContain("self._interp = LexerATNSimulator(self, self.atn, self.decisionsToDFA, " +
            "PredictionContextCache())\n");

        const listener = fileSystem.readFileSync("/python3-spec-out/TListener.py", "utf-8") as string;
        expect(listener).toContain("if \".\" in __name__:\n    from .TParser import TParser\nelse:\n" +
            "    from TParser import TParser\n");
        expect(listener).toContain("class TListener(ParseTreeListener):\n");
        expect(listener).toContain("    def enterA(self, ctx:TParser.AContext):\n        pass\n");
        expect(listener).toContain("    def exitA(self, ctx:TParser.AContext):\n        pass\n");
        expect(listener.endsWith("del TParser\n")).toBe(true);

        const visitor = fileSystem.readFileSync("/python3-spec-out/TVisitor.py", "utf-8") as string;
        expect(visitor).toContain("class TVisitor(ParseTreeVisitor):\n");
        expect(visitor).toContain("    def visitA(self, ctx:TParser.AContext):\n" +
            "        return self.visitChildren(ctx)\n");
        expect(visitor.endsWith("del TParser\n")).toBe(true);
    });

    it("Keywords and builtins are escaped", () => {
        const code = generateParser(
            "grammar T;\n" +
            "list : print (type | str)* class? None? ;\n" +
            "print : PRINT ;\n" +
            "type : TYPE ;\n" +
            "str : STR ;\n" +
            "class : CLASS id=ID? ;\n" +
            "None : NONE ;\n" +
            "PRINT : 'print' ;\n" +
            "TYPE : 'type' ;\n" +
            "STR : 'str' ;\n" +
            "CLASS : 'class' ;\n" +
            "NONE : 'None' ;\n" +
            "ID : [a-z]+ ;\n");

        // Rule names are kept in the rule name list and the rule index constants, but escaped as method names.
        expect(code).toContain("    RULE_list = 0\n");
        expect(code).toContain("    ruleNames =  [ \"list\", \"print\", \"type\", \"str\", \"class\" ]\n");
        expect(code).toContain("    None_=1\n");
        expect(code).toContain("    def list_(self):\n");
        expect(code).toContain("    def class_(self):\n");
        expect(code).toContain("            self.print_()\n");
        expect(code).toContain("                    self.type_()\n");
        expect(code).toContain("                    self.str_()\n");
        expect(code).toContain("                self.class_()\n");
        expect(code).toContain("                self.match(TParser.None_)\n");

        // Context classes and listener names are capitalized, so they don't need escaping.
        expect(code).toContain("    class ListContext(ParserRuleContext):\n");
        expect(code).toContain("        def print_(self):\n" +
            "            return self.getTypedRuleContext(TParser.PrintContext,0)\n");
        expect(code).toContain("        def type_(self, i:int=None):\n" +
            "            if i is None:\n" +
            "                return self.getTypedRuleContexts(TParser.TypeContext)\n" +
            "            else:\n" +
            "                return self.getTypedRuleContext(TParser.TypeContext,i)\n");
        expect(code).toContain("        def None_(self):\n            return self.getToken(TParser.None_, 0)\n");
        expect(code).toContain("            if hasattr( listener, \"enterList\" ):\n");

        // Labels are escaped as well.
        expect(code).toContain("            self.id_ = None # Token\n");
        expect(code).toContain("                localctx.id_ = self.match(TParser.ID)\n");
    });

    it("Left recursive rule", () => {
        const code = generateParser(
            "grammar T;\n" +
            "e : e '*' e # mul\n" +
            "  | e '+' e # add\n" +
            "  | INT     # int\n" +
            "  ;\n" +
            "INT : [0-9]+ ;\n");

        expect(code).toContain("    def e(self, _p:int=0):\n" +
            "        _parentctx = self._ctx\n" +
            "        _parentState = self.state\n" +
            "        localctx = TParser.EContext(self, self._ctx, _parentState)\n" +
            "        _prevctx = localctx\n" +
            "        _startState = 0\n" +
            "        self.enterRecursionRule(localctx, 0, self.RULE_e, _p)\n");

        // The primary alternative replaces the context with the labeled one.
        expect(code).toContain("            localctx = self.IntContext(self, localctx)\n" +
            "            self._ctx = localctx\n" +
            "            _prevctx = localctx\n");
        expect(code).toContain("            self._ctx.stop = self._input.LT(-1)\n");

        // The operator alternatives run in a star loop.
        expect(code).toContain("            while _alt!=2 and _alt!=ATN.INVALID_ALT_NUMBER:\n" +
            "                if _alt==1:\n" +
            "                    if self._parseListeners is not None:\n" +
            "                        self.triggerExitRuleEvent()\n" +
            "                    _prevctx = localctx\n");
        expect(code).toContain("                        localctx = TParser.MulContext(self, " +
            "TParser.EContext(self, _parentctx, _parentState))\n" +
            "                        self.pushNewRecursionContext(localctx, _startState, self.RULE_e)\n");
        expect(code).toContain("                        if not (self.precpred(self._ctx, 3)):\n" +
            "                            from antlr4.error.Errors import FailedPredicateException\n" +
            "                            raise FailedPredicateException(self, \"self.precpred(self._ctx, 3)\")\n");
        expect(code).toContain("                        self.e(4)\n");
        expect(code).toContain("        finally:\n            self.unrollRecursionContexts(_parentctx)\n");

        // Predicates are dispatched by rule index.
        expect(code).toContain("    def sempred(self, localctx:RuleContext, ruleIndex:int, predIndex:int):\n" +
            "        if self._predicates == None:\n" +
            "            self._predicates = dict()\n" +
            "            self._predicates[0] = self.e_sempred\n");
        expect(code).toContain("    def e_sempred(self, localctx:EContext, predIndex:int):\n" +
            "        if predIndex == 0:\n" +
            "            return self.precpred(self._ctx, 3)\n" +
            "        elif predIndex == 1:\n" +
            "            return self.precpred(self._ctx, 2)\n");

        // Alternative labels produce their own context classes.
        expect(code).toContain("    class MulContext(EContext):\n\n" +
            "        def __init__(self, parser, ctx:ParserRuleContext): # actually a TParser.EContext\n" +
            "            super().__init__(parser)\n" +
            "            self.copyFrom(ctx)\n");
        expect(code).toContain("        def copyFrom(self, ctx:ParserRuleContext):\n" +
            "            super().copyFrom(ctx)\n");
    });

    it("Rule arguments, return values and actions", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a[int depth] returns [int value] locals [bool seen]\n" +
            "@init { self.started = True }\n" +
            "@after {\n" +
            "    self.finished = True\n" +
            "}\n" +
            "  : {$depth < 10}? t=ID {\n" +
            "        $value = $depth + 1;\n" +
            "        x = [$t.channel, $t.int, $start, $text]\n" +
            "    }\n" +
            "  ;\n" +
            "  catch [RecognitionException as e] { self.caught = e }\n" +
            "  finally { self.cleaned = True }\n" +
            "ID : [a-z]+ ;\n");

        expect(code).toContain("    def a(self, depth:int):\n\n" +
            "        localctx = TParser.AContext(self, self._ctx, self.state, depth)\n" +
            "        self.enterRule(localctx, 0, self.RULE_a)\n" +
            "        self.started = True\n" +
            "        try:\n");
        expect(code).toContain("        def __init__(self, parser, parent:ParserRuleContext=None, " +
            "invokingState:int=-1, depth:int=None):\n" +
            "            super().__init__(parent, invokingState)\n" +
            "            self.parser = parser\n" +
            "            self.depth = None\n" +
            "            self.value = None\n" +
            "            self.seen = None\n" +
            "            self.t = None # Token\n" +
            "            self.depth = depth\n");

        // Predicates and attribute access go through the local context.
        expect(code).toContain("            if not (localctx.depth < 10):\n" +
            "                from antlr4.error.Errors import FailedPredicateException\n" +
            "                raise FailedPredicateException(self, \"$depth < 10\")\n");
        expect(code).toContain("            localctx.t = self.match(TParser.ID)\n");

        // Actions are re-indented to the surrounding code, token property references are None-safe.
        // The use of $text adds the postamble which sets the stop token before the after action.
        expect(code).toContain("            localctx.value = localctx.depth + 1\n" +
            "            x = [(0 if localctx.t is None else localctx.t.channel), " +
            "(0 if localctx.t is None else int(localctx.t.text)), localctx.start, " +
            "self._input.getText(localctx.start, self._input.LT(-1))]\n" +
            "            self._ctx.stop = self._input.LT(-1)\n" +
            "            self.finished = True\n");

        // Custom exception handling.
        expect(code).toContain("        except RecognitionException as e:\n            self.caught = e\n" +
            "        finally:\n            self.cleaned = True\n            self.exitRule()\n");
        expect(code).not.toContain("except RecognitionException as re:");
    });

    it("Lexer with modes, channels, actions and predicates", () => {
        const code = generateLexer(
            "lexer grammar L;\n" +
            "channels { COMMENTS, DIRECTIVES }\n" +
            "OPEN : '<' -> pushMode(TAG) ;\n" +
            "COMMENT : '//' ~[\\r\\n]* -> channel(COMMENTS) ;\n" +
            "NUMBER : [0-9]+ { print(\"number\") } ;\n" +
            "PRED : 'pred' { self.nesting == 0 }? ;\n" +
            "UNI : '\\u{1F600}' | 'é' ;\n" +
            "mode TAG;\n" +
            "CLOSE : '>' -> popMode ;\n" +
            "mode STR;\n" +
            "QUOTE : '\"' -> popMode ;\n");

        expect(code).toContain("class L(Lexer):\n");
        expect(code).toContain("    COMMENTS = 2\n    DIRECTIVES = 3\n");
        expect(code).toContain("    TAG = 1\n    STR = 2\n");
        expect(code).toContain("    OPEN = 1\n    COMMENT = 2\n");
        expect(code).toContain("    channelNames = [ u\"DEFAULT_TOKEN_CHANNEL\", u\"HIDDEN\", u\"COMMENTS\", " +
            "u\"DIRECTIVES\" ]\n");
        expect(code).toContain("    modeNames = [ \"DEFAULT_MODE\", \"TAG\", \"STR\" ]\n");

        // Literal names keep their position (token type = index), unicode is escaped.
        expect(code).toContain("    literalNames = [ \"<INVALID>\",\n" +
            "            \"'<'\", \"<INVALID>\", \"<INVALID>\", \"'pred'\", \"<INVALID>\", \"'>'\", \n" +
            "            \"'\\\"'\" ]\n");
        expect(code).toContain("    symbolicNames = [ \"<INVALID>\",\n" +
            "            \"OPEN\", \"COMMENT\", \"NUMBER\", \"PRED\", \"UNI\", \"CLOSE\", \"QUOTE\" ]\n");
        expect(code).toContain("    ruleNames = [ \"OPEN\", \"COMMENT\", \"NUMBER\", \"PRED\", \"UNI\", \"CLOSE\", " +
            "\"QUOTE\" ]\n");

        // Lexer actions and predicates are dispatched by rule index.
        expect(code).toContain("    def action(self, localctx:RuleContext, ruleIndex:int, actionIndex:int):\n" +
            "        if self._actions is None:\n" +
            "            actions = dict()\n" +
            "            actions[2] = self.NUMBER_action\n" +
            "            self._actions = actions\n");
        expect(code).toContain("    def NUMBER_action(self, localctx:RuleContext, actionIndex:int):\n" +
            "        if actionIndex == 0:\n" +
            "            print(\"number\")\n");
        expect(code).toContain("    def sempred(self, localctx:RuleContext, ruleIndex:int, predIndex:int):\n" +
            "        if self._predicates is None:\n" +
            "            preds = dict()\n" +
            "            preds[3] = self.PRED_sempred\n" +
            "            self._predicates = preds\n");
        expect(code).toContain("    def PRED_sempred(self, localctx:RuleContext, predIndex:int):\n" +
            "        if predIndex == 0:\n" +
            "            return self.nesting == 0\n");
    });

    it("Sets, lists and lookahead tests", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : (A | B | C | D)* ~(A | B) . ids+=ID (ids+=ID)* (E | F)? ;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n" +
            "D : 'd' ;\n" +
            "E : 'e' ;\n" +
            "F : 'f' ;\n" +
            "ID : [g-z]+ ;\n");

        // Local variables for lookahead tests.
        expect(code).toContain("        self._la = 0 # Token type\n");

        // More than two tokens in a set use a bit test. The set loop is a star block.
        expect(code).toContain("            while _alt!=2 and _alt!=ATN.INVALID_ALT_NUMBER:\n" +
            "                if _alt==1:\n");
        expect(code).toContain("                    if not((((_la) & ~0x3f) == 0 and ((1 << _la) & 30) != 0)):\n" +
            "                        self._errHandler.recoverInline(self)\n");

        // Inverted sets.
        expect(code).toContain("            if _la <= 0 or _la==1 or _la==2:\n" +
            "                self._errHandler.recoverInline(self)\n" +
            "            else:\n" +
            "                self._errHandler.reportMatch(self)\n" +
            "                self.consume()\n");

        // Wildcard and list labels.
        expect(code).toContain("            self.matchWildcard()\n");
        expect(code).toContain("            localctx._ID = self.match(TParser.ID)\n" +
            "            localctx.ids.append(localctx._ID)\n");
        expect(code).toContain("            self.ids = list() # of Tokens\n");
        expect(code).toContain("        def ID(self, i:int=None):\n" +
            "            if i is None:\n" +
            "                return self.getTokens(TParser.ID)\n" +
            "            else:\n" +
            "                return self.getToken(TParser.ID, i)\n");

        // Optional LL(1) block with a two token set.
        expect(code).toContain("            if _la==5 or _la==6:\n");
    });

    it("Empty alternatives and multi-line predicates", () => {
        const code = generateParser(
            "grammar T;\n" +
            "a : (A | )? B (C | {}) ;\n" +
            "b : A {\n" +
            "        self.x and\n" +
            "        self.y\n" +
            "    }? B ;\n" +
            "A : 'a' ;\n" +
            "B : 'b' ;\n" +
            "C : 'c' ;\n");

        // Empty alternatives get a pass statement, so the block is valid Python.
        expect(code).toContain("            la_ = self._interp.adaptivePredict(self._input,0,self._ctx)\n" +
            "            if la_ == 1:\n" +
            "                self.state = 4\n" +
            "                self.match(TParser.A)\n" +
            "            elif la_ == 2:\n" +
            "                pass\n");
        expect(code).toContain("            elif token in [-1]:\n" +
            "                pass\n");

        // Multi-line predicates are wrapped in parentheses.
        expect(code).toContain("            if not (self.x and\n" +
            "                self.y):\n");
        expect(code).toContain("    def b_sempred(self, localctx:BContext, predIndex:int):\n" +
            "        if predIndex == 0:\n" +
            "            return (self.x and\n" +
            "                self.y)\n");
    });
});
