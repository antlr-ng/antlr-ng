/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { CharStream, CommonTokenStream, type ParseTree } from "antlr4ng";

import { ANTLRv4Lexer } from "../../src/generated/ANTLRv4Lexer.js";
import {
    ANTLRv4Parser, type AtomContext, type DelegateGrammarsContext, type EbnfContext, type ElementContext,
    type GrammarSpecContext, type LabeledElementContext, type LexerElementContext, type RulerefContext,
    type RuleSpecContext
} from "../../src/generated/ANTLRv4Parser.js";
import { ParseTreeToASTConverter } from "../../src/support/ParseTreeToASTConverter.js";
import { GrammarAST } from "../../src/tool/ast/GrammarAST.js";
import { ToolTestUtils } from "../ToolTestUtils.js";

describe("TestASTStructure", () => {
    const execParser = (ruleName: string, input: string, scriptLine: number): ParseTree => {
        const is = CharStream.fromString(input);
        const lexer = new ANTLRv4Lexer(is);
        // TODO: is.setLine(scriptLine);

        const tokens = new CommonTokenStream(lexer);

        /*tokens.fill();
        const t = tokens.getTokens();*/

        const parser = new ANTLRv4Parser(tokens);

        const result = ToolTestUtils.callParserMethod(parser, ruleName) as ParseTree;

        if (parser.numberOfSyntaxErrors > 0) {
            throw new Error("The grammar file contains syntax errors.");
        }

        return result;
    };

    it("grammarSpec1", () => {
        const input = "parser grammar P; a : A;";
        const context = execParser("grammarSpec", input, 15) as GrammarSpecContext;

        // Only for the grammar spec tests we need to create an own token stream here.
        const is = CharStream.fromString(input);
        const lexer = new ANTLRv4Lexer(is);
        const tokenStream = new CommonTokenStream(lexer);
        const ast = ParseTreeToASTConverter.convertGrammarSpecToAST(context, tokenStream);

        const actual = ast.toStringTree();
        const expecting = "(PARSER_GRAMMAR P (RULES (RULE a (BLOCK (ALT A)))))";
        expect(actual).toBe(expecting);
    });

    it("grammarSpec2", () => {
        const input = "\n    parser grammar P;\n    tokens { A, B }\n    @header {foo}\n    a : A;\n    ";
        const context = execParser("grammarSpec", input, 18) as GrammarSpecContext;

        const is = CharStream.fromString(input);
        const lexer = new ANTLRv4Lexer(is);
        const tokenStream = new CommonTokenStream(lexer);
        const ast = ParseTreeToASTConverter.convertGrammarSpecToAST(context, tokenStream);

        const actual = ast.toStringTree();
        const expecting = "(PARSER_GRAMMAR P (tokens { A B) (@ header {foo}) (RULES (RULE a (BLOCK (ALT A)))))";
        expect(actual).toBe(expecting);
    });

    it("grammarSpec3", () => {
        const input = "\n    parser grammar P;\n    @header {foo}\n    tokens { A,B }\n    a : A;\n    ";
        const context = execParser("grammarSpec", input, 30) as GrammarSpecContext;

        const is = CharStream.fromString(input);
        const lexer = new ANTLRv4Lexer(is);
        const tokenStream = new CommonTokenStream(lexer);
        const ast = ParseTreeToASTConverter.convertGrammarSpecToAST(context, tokenStream);

        const actual = ast.toStringTree();
        const expecting = "(PARSER_GRAMMAR P (@ header {foo}) (tokens { A B) (RULES (RULE a (BLOCK (ALT A)))))";
        expect(actual).toBe(expecting);
    });

    it("grammarSpec4", () => {
        const input = "\n    parser grammar P;\n    import A=B, C;\n    a : A;\n    ";
        const context = execParser("grammarSpec", input, 42) as GrammarSpecContext;

        const is = CharStream.fromString(input);
        const lexer = new ANTLRv4Lexer(is);
        const tokenStream = new CommonTokenStream(lexer);
        const ast = ParseTreeToASTConverter.convertGrammarSpecToAST(context, tokenStream);

        const actual = ast.toStringTree();
        const expecting = "(PARSER_GRAMMAR P (import (= A B) C) (RULES (RULE a (BLOCK (ALT A)))))";
        expect(actual).toBe(expecting);
    });

    it("delegateGrammars1", () => {
        const context = execParser("delegateGrammars", "import A;", 53) as DelegateGrammarsContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertDelegateGrammarsToAST(context, dummy);

        const actual = ast.toStringTree();
        const expecting = "(import A)";
        expect(actual).toBe(expecting);
    });

    it("rule1", () => {
        const context = execParser("ruleSpec", "a : A<X,Y=a.b.c>;", 56) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE a (BLOCK (ALT (A (ELEMENT_OPTIONS X (= Y a.b.c))))))";
        expect(actual).toBe(expecting);
    });

    it("rule2", () => {
        const context = execParser("ruleSpec", "A : B+;", 58) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE A (BLOCK (ALT (+ (BLOCK (ALT B))))))";
        expect(actual).toBe(expecting);
    });

    it("rule3", () => {
        const context = execParser("ruleSpec", "\n    a[int i] returns [int y]\n    @init {blah}\n      : ID ;" +
            "\n    ", 60) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE a int i (returns int y) (@ init {blah}) (BLOCK (ALT ID)))";
        expect(actual).toBe(expecting);
    });

    it("rule4", () => {
        const context = execParser("ruleSpec", "\n    a[int i] returns [int y]\n    @init {blah}\n    options " +
            "{backtrack=true;}\n      : ID;\n    ", 75) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE a int i (returns int y) (@ init {blah}) (OPTIONS (= backtrack true)) (BLOCK " +
            "(ALT ID)))";
        expect(actual).toBe(expecting);
    });

    it("rule5", () => {
        const context = execParser("ruleSpec", "\n    a : ID ;\n      catch[A b] {foo}\n      finally {bar}" +
            "\n    ", 88) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE a (BLOCK (ALT ID)) (catch A b {foo}) (finally {bar}))";
        expect(actual).toBe(expecting);
    });

    it("rule6", () => {
        const context = execParser("ruleSpec", "\n    a : ID ;\n      catch[A a] {foo}\n      catch[B b] {fu}" +
            "\n      finally {bar}\n    ", 97) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE a (BLOCK (ALT ID)) (catch A a {foo}) (catch B b {fu}) (finally {bar}))";
        expect(actual).toBe(expecting);
    });

    it("rule7", () => {
        const context = execParser("ruleSpec", "\n\ta[int i]\n\tlocals [int a, float b]\n\t\t:\tA\n\t\t;\n\t",
            107) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE a int i (locals int a, float b) (BLOCK (ALT A)))";
        expect(actual).toBe(expecting);
    });

    it("rule8", () => {
        const context = execParser("ruleSpec", "\n\ta[int i] throws a.b.c\n\t\t:\tA\n\t\t;\n\t",
            115) as RuleSpecContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRuleSpecToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(RULE a int i (throws a.b.c) (BLOCK (ALT A)))";
        expect(actual).toBe(expecting);
    });

    it("ebnf1", () => {
        const context = execParser("ebnf", "(A|B)", 123) as EbnfContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertEbnfToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(BLOCK (ALT A) (ALT B))";
        expect(actual).toBe(expecting);
    });

    it("ebnf2", () => {
        const context = execParser("ebnf", "(A|B)?", 124) as EbnfContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertEbnfToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(? (BLOCK (ALT A) (ALT B)))";
        expect(actual).toBe(expecting);
    });

    it("ebnf3", () => {
        const context = execParser("ebnf", "(A|B)*", 125) as EbnfContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertEbnfToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT A) (ALT B)))";
        expect(actual).toBe(expecting);
    });

    it("ebnf4", () => {
        const context = execParser("ebnf", "(A|B)+", 126) as EbnfContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertEbnfToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT A) (ALT B)))";
        expect(actual).toBe(expecting);
    });

    it("element1", () => {
        const context = execParser("atom", "~A", 129) as AtomContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertAtomToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(~ (SET A))";
        expect(actual).toBe(expecting);
    });

    it("element2", () => {
        const context = execParser("element", "b+", 130) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT b)))";
        expect(actual).toBe(expecting);
    });

    it("element3", () => {
        const context = execParser("element", "(b)+", 131) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT b)))";
        expect(actual).toBe(expecting);
    });

    it("element4", () => {
        const context = execParser("element", "b?", 132) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(? (BLOCK (ALT b)))";
        expect(actual).toBe(expecting);
    });

    it("element5", () => {
        const context = execParser("element", "(b)?", 133) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(? (BLOCK (ALT b)))";
        expect(actual).toBe(expecting);
    });

    it("element6", () => {
        const context = execParser("element", "(b)*", 134) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT b)))";
        expect(actual).toBe(expecting);
    });

    it("element7", () => {
        const context = execParser("element", "b*", 135) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT b)))";
        expect(actual).toBe(expecting);
    });

    it("element8", () => {
        const context = execParser("element", "'while'*", 136) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT 'while')))";
        expect(actual).toBe(expecting);
    });

    it("element9", () => {
        const context = execParser("element", "'a'+", 137) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT 'a')))";
        expect(actual).toBe(expecting);
    });

    it("element10", () => {
        const context = execParser("ruleref", "a[3]", 138) as RulerefContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertRulerefToAST(context, dummy);

        const actual = ast.toStringTree();
        const expecting = "(a 3)";
        expect(actual).toBe(expecting);
    });

    it("element11", () => {
        const context = execParser("lexerElement", "'a'..'z'+", 139) as LexerElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertLexerElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT (.. 'a' 'z'))))";
        expect(actual).toBe(expecting);
    });

    it("element12", () => {
        const context = execParser("labeledElement", "x=ID", 140) as LabeledElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertLabeledElementToAST(context, dummy);

        const actual = ast.toStringTree();
        const expecting = "(= x ID)";
        expect(actual).toBe(expecting);
    });

    it("element13", () => {
        const context = execParser("element", "x=ID?", 141) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(? (BLOCK (ALT (= x ID))))";
        expect(actual).toBe(expecting);
    });

    it("element14", () => {
        const context = execParser("element", "x=ID*", 142) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT (= x ID))))";
        expect(actual).toBe(expecting);
    });

    it("element15", () => {
        const context = execParser("labeledElement", "x=b", 143) as LabeledElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertLabeledElementToAST(context, dummy);

        const actual = ast.toStringTree();
        const expecting = "(= x b)";
        expect(actual).toBe(expecting);
    });

    it("element16", () => {
        const context = execParser("labeledElement", "x=(A|B)", 144) as LabeledElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertLabeledElementToAST(context, dummy);

        const actual = ast.toStringTree();
        const expecting = "(= x (BLOCK (ALT A) (ALT B)))";
        expect(actual).toBe(expecting);
    });

    it("element17", () => {
        const context = execParser("labeledElement", "x=~(A|B)", 145) as LabeledElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertLabeledElementToAST(context, dummy);

        const actual = ast.toStringTree();
        const expecting = "(= x (~ (SET A B)))";
        expect(actual).toBe(expecting);
    });

    it("element18", () => {
        const context = execParser("labeledElement", "x+=~(A|B)", 146) as LabeledElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertLabeledElementToAST(context, dummy);

        const actual = ast.toStringTree();
        const expecting = "(+= x (~ (SET A B)))";
        expect(actual).toBe(expecting);
    });

    it("element19", () => {
        const context = execParser("element", "x+=~(A|B)+", 147) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT (+= x (~ (SET A B))))))";
        expect(actual).toBe(expecting);
    });

    it("element20", () => {
        const context = execParser("element", "x=b+", 148) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT (= x b))))";
        expect(actual).toBe(expecting);
    });

    it("element21", () => {
        const context = execParser("element", "x+=ID*", 149) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT (+= x ID))))";
        expect(actual).toBe(expecting);
    });

    it("element22", () => {
        const context = execParser("element", "x+='int'*", 150) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT (+= x 'int'))))";
        expect(actual).toBe(expecting);
    });

    it("element23", () => {
        const context = execParser("element", "x+=b+", 151) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(+ (BLOCK (ALT (+= x b))))";
        expect(actual).toBe(expecting);
    });

    it("element24", () => {
        const context = execParser("element", "({blah} 'x')*", 152) as ElementContext;

        const dummy = new GrammarAST();
        const ast = ParseTreeToASTConverter.convertElementToAST(context, dummy);

        const actual = ast!.toStringTree();
        const expecting = "(* (BLOCK (ALT {blah} 'x')))";
        expect(actual).toBe(expecting);
    });
});
