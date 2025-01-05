/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, type Token } from "antlr4ng";

import { ActionSplitter } from "../generated/ActionSplitter.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";

import { ActionAST } from "../tool/ast/ActionAST.js";
import { Grammar } from "../tool/Grammar.js";
import { LexerGrammar } from "../tool/LexerGrammar.js";
import { Rule } from "../tool/Rule.js";
import { ActionSniffer } from "./ActionSniffer.js";
import { BlankActionSplitterListener } from "./BlankActionSplitterListener.js";

/** Look for errors and dead code stuff */
export class UseDefAnalyzer {
    // side-effect: updates Alternative with refs in actions
    public static trackTokenRuleRefsInActions(g: Grammar): void {
        for (const r of g.rules.values()) {
            for (let i = 1; i <= r.numberOfAlts; i++) {
                const alt = r.alt[i];
                for (const a of alt.actions) {
                    const sniffer = new ActionSniffer(g, r, alt, a, a.token!);
                    sniffer.examineAction();
                }
            }
        }
    }

    public static actionIsContextDependent(actionAST: ActionAST): boolean {
        const input = CharStream.fromString(actionAST.token!.text!);
        //input.setLine(actionAST.token.getLine());
        //input.setCharPositionInLine(actionAST.token.getCharPositionInLine());
        const dependent = [false]; // can't be simple bool with anon class
        const listener = new class extends BlankActionSplitterListener {
            public override nonLocalAttr(expr: string, x: Token, y: Token): void {
                dependent[0] = true;
            }

            public override qualifiedAttr(expr: string, x: Token, y: Token): void {
                dependent[0] = true;
            }

            public override setAttr(expr: string, x: Token, rhs: Token): void {
                dependent[0] = true;
            }

            public override setExprAttribute(expr: string): void {
                dependent[0] = true;
            }

            public override setNonLocalAttr(expr: string, x: Token, y: Token, rhs: string): void {
                dependent[0] = true;
            }

            public override attr(expr: string, x: Token): void {
                dependent[0] = true;
            }
        }();

        const splitter = new ActionSplitter(input);

        // forces eval, triggers listener methods
        splitter.getActionTokens(listener);

        return dependent[0];
    }

    /** Find all rules reachable from r directly or indirectly for all r in g */
    public static getRuleDependencies(g: Grammar): Map<Rule, Set<Rule>>;
    public static getRuleDependencies(g: LexerGrammar, modeName: string): Map<Rule, Set<Rule>>;
    public static getRuleDependencies(g: Grammar, rules: Rule[]): Map<Rule, Set<Rule>>;
    public static getRuleDependencies(...args: unknown[]): Map<Rule, Set<Rule>> {
        if (args.length === 1) {
            const g = args[0] as Grammar;

            return UseDefAnalyzer.getRuleDependencies(g, Array.from(g.rules.values()));
        }

        if (args[0] instanceof LexerGrammar) {
            const [g, modeName] = args as [LexerGrammar, string];

            return UseDefAnalyzer.getRuleDependencies(g, g.modes.get(modeName)!);
        } else {
            const [g, rules] = args as [Grammar, Rule[]];

            const dependencies = new Map<Rule, Set<Rule>>();

            for (const r of rules) {
                const tokenRefs = r.ast.getNodesWithType(ANTLRv4Parser.TOKEN_REF);
                for (const tref of tokenRefs) {
                    let calls = dependencies.get(r);
                    if (!calls) {
                        calls = new Set<Rule>();
                        dependencies.set(r, calls);
                    }
                    calls.add(g.getRule(tref.getText())!);
                }
            }

            return dependencies;
        }
    }

}
