/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { ANTLRv4Parser } from "../../src/generated/ANTLRv4Parser.js";
import { GrammarAST } from "../../src/tool/ast/GrammarAST.js";
import type { RuleAST } from "../../src/tool/ast/RuleAST.js";
import { ErrorManager } from "../../src/tool/ErrorManager.js";
import { Grammar } from "../../src/tool/index.js";
import { CommonTreeNodeStream } from "../../src/tree/CommonTreeNodeStream.js";
import { GrammarTreeVisitor, isRuleModifier } from "../../src/tree/walkers/GrammarTreeVisitor.js";
import { LeftRecursiveRuleWalker } from "../../src/tree/walkers/LeftRecursiveRuleWalker.js";

/** Collects the modifiers of all parser rules. */
class ModifierCollector extends GrammarTreeVisitor {
    public readonly modifiers = new Map<string, number[]>();

    protected override discoverRule(rule: RuleAST | undefined, id: GrammarAST | undefined,
        modifiers: Array<GrammarAST | null>): void {
        this.modifiers.set(id!.getText(), modifiers.map((m) => {
            return m!.getType();
        }));
    }
}

/**
 * Parses a grammar and adds modifiers to its parser rules, like the parser would for `public a : ...;`.
 *
 * `ParseTreeToASTConverter` currently drops the modifiers of parser rules, so the tree is changed by hand.
 *
 * @param text The grammar text.
 * @param modifiers The modifier token types to add, per rule name.
 *
 * @returns The grammar.
 */
const parseWithModifiers = (text: string, modifiers: Record<string, number[]>): Grammar => {
    const g = new Grammar(text);
    const rules = g.ast.getFirstChildWithType(ANTLRv4Parser.RULES) as GrammarAST;
    for (const rule of rules.children as GrammarAST[]) {
        const types = modifiers[rule.children[0].getText()] ?? [];
        if (types.length > 0) {
            const node = new GrammarAST(ANTLRv4Parser.RULEMODIFIERS);
            for (const type of types) {
                node.addChild(new GrammarAST(type));
            }

            rule.insertChild(1, node);
        }
    }

    return g;
};

/**
 * @param g The grammar.
 * @param name The name of a rule.
 *
 * @returns The AST of the rule.
 */
const ruleAST = (g: Grammar, name: string): GrammarAST => {
    const rules = g.ast.getFirstChildWithType(ANTLRv4Parser.RULES) as GrammarAST;

    return (rules.children as GrammarAST[]).find((rule) => {
        return rule.children[0].getText() === name;
    })!;
};

describe("Tree walker token checks", () => {
    it("treat public, private and protected as rule modifiers", () => {
        // The tree walkers used the ANTLR3 token range PRIVATE..PUBLIC for this, which is empty in the ANTLRv4
        // token numbering (#119).
        expect(isRuleModifier(ANTLRv4Parser.PUBLIC)).toBe(true);
        expect(isRuleModifier(ANTLRv4Parser.PRIVATE)).toBe(true);
        expect(isRuleModifier(ANTLRv4Parser.PROTECTED)).toBe(true);
        expect(isRuleModifier(ANTLRv4Parser.FRAGMENT)).toBe(false);
        expect(isRuleModifier(ANTLRv4Parser.RULE_REF)).toBe(false);
    });

    it("use token ranges that cover exactly their tokens", () => {
        // The tree walkers still test `BLOCK..CLOSURE`, `OPTIONAL..POSITIVE_CLOSURE` and `SET..WILDCARD` as
        // ranges. That is only correct while each pair is adjacent in `src/grammars/predefined.tokens`.
        expect(ANTLRv4Parser.CLOSURE).toBe(ANTLRv4Parser.BLOCK + 1);
        expect(ANTLRv4Parser.POSITIVE_CLOSURE).toBe(ANTLRv4Parser.OPTIONAL + 1);
        expect(ANTLRv4Parser.WILDCARD).toBe(ANTLRv4Parser.SET + 1);
    });

    it("pass parser rule modifiers to discoverRule", () => {
        const g = parseWithModifiers("parser grammar T;\na : b ;\nb : 'x' ;\nc : 'y' ;\n", {
            a: [ANTLRv4Parser.PUBLIC],
            b: [ANTLRv4Parser.PRIVATE, ANTLRv4Parser.PROTECTED],
        });

        const errorManager = new ErrorManager();
        const collector = new ModifierCollector(errorManager);
        collector.visitGrammar(g.ast);

        expect(errorManager.errors).toBe(0);
        expect(collector.modifiers).toEqual(new Map([
            ["a", [ANTLRv4Parser.PUBLIC]],
            ["b", [ANTLRv4Parser.PRIVATE, ANTLRv4Parser.PROTECTED]],
            ["c", []],
        ]));
    });

    it("detect left recursive rules with modifiers", () => {
        const g = parseWithModifiers("parser grammar T;\ne : e '+' e | INT ;\n", {
            e: [ANTLRv4Parser.PUBLIC],
        });

        const errorManager = new ErrorManager();
        const walker = new LeftRecursiveRuleWalker(new CommonTreeNodeStream(ruleAST(g, "e")), errorManager);

        expect(walker.recursiveRule()).toBe(true);
        expect(errorManager.errors).toBe(0);
    });
});
