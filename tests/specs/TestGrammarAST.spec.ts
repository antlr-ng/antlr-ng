/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { BitSet, CommonToken } from "antlr4ng";

import { ANTLRv4Parser } from "../../src/generated/ANTLRv4Parser.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";
import { GrammarAST } from "../../src/tool/ast/GrammarAST.js";
import { GrammarRootAST } from "../../src/tool/ast/GrammarRootAST.js";
import type { IGrammarASTVisitor } from "../../src/tool/ast/IGrammarASTVisitor.js";
import type { RuleAST } from "../../src/tool/ast/RuleAST.js";
import type { GrammarASTWithOptions } from "../../src/tool/ast/GrammarASTWithOptions.js";
import { dummyConfiguration } from "../support/GenerationHelper.js";

/** Collects the AST class names of all visited nodes. */
class TypeCollector implements IGrammarASTVisitor<string> {
    public readonly seen = new Set<string>();

    public visit(node: GrammarAST): string {
        this.seen.add(node.constructor.name);

        return node.constructor.name;
    }
}

const visitAll = (node: GrammarAST, visitor: TypeCollector): void => {
    expect(node.visit(visitor)).toBe(node.constructor.name);
    for (const child of node.children) {
        visitAll(child as GrammarAST, visitor);
    }
};

describe("Tool AST coverage", () => {
    it("every AST node type dispatches to the visitor", () => {
        const g = new Grammar(
            "grammar Ast;\n" +
            "options { x = y; }\n" +
            "a : b? c* d+ (A | B) ~A {act();} {pred()}? x=A # one\n" +
            "  | . # two\n" +
            "  ;\n" +
            "b : A ;\n" +
            "c : B ;\n" +
            "d : A B ;\n" +
            "A : 'a'..'c' ;\n" +
            "B : 'b' ;\n");
        g.tool.process(g, dummyConfiguration(), false);

        const collector = new TypeCollector();
        visitAll(g.ast, collector);

        // Lexer rules (with the range) have been moved to the implicit lexer.
        visitAll(g.implicitLexer!.ast, collector);

        expect([...collector.seen].sort()).toEqual([
            "ActionAST", "AltAST", "BlockAST", "GrammarAST", "GrammarRootAST", "NotAST", "OptionalBlockAST",
            "PlusBlockAST", "PredAST", "RangeAST", "RuleAST", "RuleRefAST", "SetAST", "StarBlockAST", "TerminalAST",
        ]);
    });

    it("root AST construction variants", () => {
        const g = new Grammar("grammar Root;\na : A ;");
        const root = g.ast;
        expect(root.getGrammarName()).toBe("Root");

        const copy = root.dupNode();
        expect(copy).toBeInstanceOf(GrammarRootAST);
        expect(copy.grammarType).toBe(root.grammarType);
        expect(copy.tokenStream).toBe(root.tokenStream);
        expect(copy.getText()).toBe(root.getText());

        const token = CommonToken.fromType(ANTLRv4Parser.GRAMMAR, "grammar");
        expect(new GrammarRootAST(token, root.tokenStream).getType()).toBe(ANTLRv4Parser.GRAMMAR);
        expect(new GrammarRootAST(ANTLRv4Parser.GRAMMAR, token, root.tokenStream).getType())
            .toBe(ANTLRv4Parser.GRAMMAR);

        const named = new GrammarRootAST(ANTLRv4Parser.GRAMMAR, token, "renamed", root.tokenStream);
        expect(named.getText()).toBe("renamed");

        // The token stream is mandatory.
        expect(() => {
            return new GrammarRootAST(token, undefined as never);
        }).toThrow("tokenStream");
        expect(() => {
            return new GrammarRootAST(ANTLRv4Parser.GRAMMAR, token, undefined as never);
        }).toThrow("tokenStream");
        expect(() => {
            return new GrammarRootAST(ANTLRv4Parser.GRAMMAR, token, "x", undefined as never);
        }).toThrow("tokenStream");
        expect(() => {
            return new (GrammarRootAST as unknown as new (...args: unknown[]) => GrammarRootAST)();
        }).toThrow("Invalid number of arguments");
    });

    it("root AST options come from the tool configuration first", () => {
        const g = new Grammar("grammar Opts;\noptions { superClass = Base; }\na : A ;");
        const root = g.ast;
        expect(root.getOptionString("superClass")).toBe("Base");
        expect(root.getNumberOfOptions()).toBe(1);

        root.toolConfiguration = { ...dummyConfiguration(), lib: "/my/lib" };
        expect(root.getOptionString("lib")).toBe("/my/lib");

        // Non-string configuration values are ignored.
        expect(root.getOptionString("forceAtn")).toBeUndefined();
        expect(root.getOptionString("superClass")).toBe("Base");
    });

    it("rule AST helpers", () => {
        const g = new LexerGrammar("lexer grammar RuleAst;\nA : 'a' {act();} ;\nfragment B : 'b' ;");
        g.tool.process(g, dummyConfiguration(), false);

        const rules = g.ast.getNodesWithType(ANTLRv4Parser.RULE) as RuleAST[];
        expect(rules).toHaveLength(2);
        expect(rules[0].getRuleName()).toBe("A");
        expect(rules[0].isLexerRule()).toBe(true);
        expect(rules[0].getLexerAction()).toBeNull();

        // Duplicating a node does not copy its children.
        const copy = rules[0].dupNode();
        expect(copy.getRuleName()).toBeNull();
        expect(copy.getText()).toBe("RULE");
        expect(copy.children).toHaveLength(0);
    });

    it("generic AST helpers: type changes, descendant lookup and options", () => {
        const g = new Grammar("grammar Generic;\na : A<tokenIndex=1> b ;\nb : B ;");
        const ruleA = g.ast.getNodesWithType(ANTLRv4Parser.RULE)[0];

        const terminal = ruleA.getFirstDescendantWithType(ANTLRv4Parser.TOKEN_REF)!;
        expect(terminal.getText()).toBe("A");
        expect((terminal as GrammarASTWithOptions).getNumberOfOptions()).toBe(1);

        // The first RULE_REF descendant of a rule is its name, the one inside the block is the reference.
        const set = new BitSet();
        set.set(ANTLRv4Parser.RULE_REF);
        expect(ruleA.getFirstDescendantWithType(set)!.getText()).toBe("a");
        expect(ruleA.getFirstDescendantWithType(ANTLRv4Parser.RULE_REF)!.getText()).toBe("a");

        const block = ruleA.getFirstChildWithType(ANTLRv4Parser.BLOCK) as GrammarAST;
        expect(block.getFirstDescendantWithType(set)!.getText()).toBe("b");
        expect(block.getFirstDescendantWithType(ANTLRv4Parser.RULE_REF)!.getText()).toBe("b");

        const missing = new BitSet();
        missing.set(ANTLRv4Parser.WILDCARD);
        expect(ruleA.getFirstDescendantWithType(missing)).toBeNull();
        expect(ruleA.getFirstDescendantWithType(ANTLRv4Parser.WILDCARD)).toBeNull();

        const node = new GrammarAST(CommonToken.fromType(ANTLRv4Parser.ID, "x"));
        node.setType(ANTLRv4Parser.RULE_REF);
        node.setText("y");
        expect(node.getType()).toBe(ANTLRv4Parser.RULE_REF);
        expect(node.getText()).toBe("y");
        expect(node.getFirstDescendantWithType(ANTLRv4Parser.RULE_REF)).toBe(node);
        expect(node.getFirstDescendantWithType(set)).toBe(node);

        // Delete a child by reference.
        const parent = new GrammarAST(CommonToken.fromType(ANTLRv4Parser.BLOCK, "BLOCK"));
        parent.addChild(node);
        expect(parent.deleteChild(node)).toBe(true);
        expect(parent.deleteChild(node)).toBe(false);
        expect(parent.children).toHaveLength(0);
    });

    it("alt labels are found through ancestors", () => {
        const g = new Grammar("grammar Labels;\na : A # first | B # second ;\nb : A ;");
        g.tool.process(g, dummyConfiguration(), false);

        const rules = g.ast.getNodesWithType(ANTLRv4Parser.RULE);
        const tokenRefs = rules[0].getNodesWithType(ANTLRv4Parser.TOKEN_REF);
        expect(tokenRefs[0].getAltLabel()).toBe("first");
        expect(tokenRefs[1].getAltLabel()).toBe("second");
        expect(rules[1].getNodesWithType(ANTLRv4Parser.TOKEN_REF)[0].getAltLabel()).toBeNull();
        expect(g.ast.getAltLabel()).toBeNull();
    });
});
