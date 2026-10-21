/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { IssueCode } from "../../../src/tool/Issues.js";
import { generate, parserOf } from "./GenerationHelper.js";

/**
 * Grammar driven tests for the left-recursion elimination (LeftRecursiveRuleWalker + LeftRecursiveRuleAnalyzer).
 * Every test checks the generated TypeScript parser code for the precedence climbing structure.
 */
describe("Left recursion coverage", () => {
    it("binary, ternary, suffix, prefix and primary alternatives with labels and actions", () => {
        const grammar =
            "grammar LR;\n" +
            "e locals [int x]\n" +
            "  @init {let i = 0;}\n" +
            "  @after {i = 1;}\n" +
            "  : <assoc=right> l=e '^' r=e        # pow\n" +
            "  | e op=('*' | '/') e               # mulDiv\n" +
            "  | e '?' e ':' e                    # ternary\n" +
            "  | e '++' {console.log(\"post\");}    # postInc\n" +
            "  | '-' e                            # neg\n" +
            "  | '(' e ')'                        # parens\n" +
            "  | ids+=ID ('.' ID)*                # ref\n" +
            "  | INT {console.log(\"int\");}        # int\n" +
            "  | {true}? f[1] ~('*'|'/')? .       # misc\n" +
            "  ;\n" +
            "f[int k] : ID ;\n" +
            "ID : [a-z]+ ;\n" +
            "INT : [0-9]+ ;\n" +
            "WS : [ \\t\\r\\n]+ -> skip ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR");

        // Rule entry with init action and recursion setup.
        expect(parser).toContain("public e(_p?: number): EContext {");
        expect(parser).toContain("this.enterRecursionRule(localContext, 0, LRParser.RULE_e, _p);");
        expect(parser).toContain("let i = 0;");
        expect(parser).toContain("this.unrollRecursionContexts(parentContext);");

        // Precedence predicates: 4 operator alternatives, numbered from the top.
        for (const precedence of [9, 8, 7, 6]) {
            expect(parser).toContain(`this.precpred(this.context, ${precedence})`);
        }

        // Right associative alternative recurses with the same precedence, left associative with +1.
        expect(parser).toContain("(localContext as PowContext)._r = this.e(9);");
        expect(parser).toContain("(localContext as PowContext)._l = previousContext;");
        expect(parser).toContain("localContext = new MulDivContext(new EContext(parentContext, parentState));");
        expect(parser).toContain("(localContext as MulDivContext)._op = this.tokenStream.LT(1);");

        // Ternary and suffix alternatives.
        expect(parser).toContain("localContext = new TernaryContext(new EContext(parentContext, parentState));");
        expect(parser).toContain("localContext = new PostIncContext(new EContext(parentContext, parentState));");
        expect(parser).toContain("console.log(\"post\");");

        // Primary alternatives keep their labels, list labels and actions.
        expect(parser).toContain("((localContext as RefContext)._ids.push((localContext as RefContext)._ID!));");
        expect(parser).toContain("console.log(\"int\");");
        expect(parser).toContain("export class NegContext extends EContext {");
        expect(parser).toContain("export class ParensContext extends EContext {");
        expect(parser).toContain("export class MiscContext extends EContext {");

        // The predicate dispatcher contains all precedence predicates.
        expect(parser).toContain("private e_sempred(localContext: EContext, predIndex: number): boolean {");
        expect(parser).toContain("return this.precpred(this.context, 9);");
        expect(parser).toContain("return this.precpred(this.context, 6);");
    });

    it("list labels on the recursive rule reference and the right operand", () => {
        const grammar =
            "grammar LR5;\n" +
            "e : l+=e '+' r+=e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR5");
        expect(parser).toContain("localContext._l.push(previousContext);");
        expect(parser).toContain("localContext._e = this.e(3);");
        expect(parser).toContain("(localContext._r.push(localContext._e!));");
        expect(parser).toContain("this.precpred(this.context, 2)");
    });

    it("alternative level assoc option controls the precedence of the right operand", () => {
        const grammar =
            "grammar LR6;\n" +
            "e : e '+' e | <assoc=right> e '^' e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR6");

        // alt 1 (prec 3, left): recurse with 4; alt 2 (prec 2, right): recurse with 2.
        expect(parser).toContain("this.precpred(this.context, 3)");
        expect(parser).toContain("this.e(4);");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("this.e(2);");
    });

    it("token level assoc option is reported as unrecognized and ignored", () => {
        const grammar =
            "grammar LR7;\n" +
            "e : e '+' e | e '^'<assoc=right> e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);
        expect(result.queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.UnrecognizedAssocOption);

        const parser = parserOf(result, "LR7");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("this.e(3);");
        expect(parser).not.toContain("this.e(2);");
    });

    it("invalid assoc option value is reported and left associativity is used", () => {
        const grammar =
            "grammar LR8;\n" +
            "e : <assoc=middle> e '^' e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);
        expect(result.queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.IllegalOptionValue);

        const parser = parserOf(result, "LR8");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("this.e(3);");
    });

    it("mixing labeled and unlabeled alternatives is an error", () => {
        const grammar =
            "grammar LR9;\n" +
            "e : e '*' e # mul | e '+' e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        const codes = result.queue.errors.map((e) => { return e.code; });
        expect(codes).toContain(IssueCode.RuleWithTooFewAltLabels);
        expect(result.files.has("LR9Parser.ts")).toBe(false);
    });

    it("actions and predicates in all alternative positions", () => {
        const grammar =
            "grammar LR10;\n" +
            "e : e '*'<assoc=left> e {a();} {b()}?\n" +
            "  | e '--' {c();} {d()}?\n" +
            "  | '!' e {f();}\n" +
            "  | {g()}? ID {h();}\n" +
            "  | ID<tokenIndex=5>\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR10");
        expect(parser).toContain("this.precpred(this.context, 5)");
        expect(parser).toContain("this.precpred(this.context, 4)");

        // Binary alt: trailing action and predicate after the right operand.
        expect(parser).toContain("a();");
        expect(parser).toContain("throw this.createFailedPredicateException(\"b()\", );");

        // Suffix alt with action + predicate.
        expect(parser).toContain("c();");
        expect(parser).toContain("throw this.createFailedPredicateException(\"d()\", );");

        // Prefix alt and primary alts.
        expect(parser).toContain("this.e(0);\n                    f();");
        expect(parser).toContain("throw this.createFailedPredicateException(\"g()\", );");
        expect(parser).toContain("h();");

        // All predicates are dispatched through the sempred method.
        expect(parser).toContain("return g();");
        expect(parser).toContain("return b();");
        expect(parser).toContain("return d();");
    });

    it("EBNF sub rules and blocks inside left-recursive alternatives", () => {
        const grammar =
            "grammar LR11;\n" +
            "e : e '[' (e (',' e)*)? ']'\n" +
            "  | e ('.' ID)+\n" +
            "  | ('-'|'+') e\n" +
            "  | '(' e ')' e\n" +
            "  | ID ('(' ')')*\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR11");

        // Two suffix alternatives (prec 5 and 4).
        expect(parser).toContain("this.precpred(this.context, 5)");
        expect(parser).toContain("this.precpred(this.context, 4)");

        // The prefix alternatives recurse with their own precedence (3 and 2).
        expect(parser).toContain("this.e(3);");
        expect(parser).toContain("this.e(2);");

        // Nested references inside the suffix alt are unrestricted.
        expect(parser).toContain("this.e(0);");
        expect(parser).toContain("this.match(LR11Parser.T__0);");
    });

    it("rule options, locals, an epsilon primary alternative and rule references with arguments", () => {
        const grammar =
            "grammar LR12;\n" +
            "e locals [int n] options { k=1; } : e '+' e | f[1] | ;\n" +
            "f[int k] : ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);
        expect(result.queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.IllegalOption);

        const parser = parserOf(result, "LR12");
        expect(parser).toContain("this.precpred(this.context, 3)");
        expect(parser).toContain("this.e(4);");
        expect(parser).toContain("this.f(");
        expect(parser).toContain("public n: int");
    });

    it("exception handlers on a left-recursive rule", () => {
        const grammar =
            "grammar LR13;\n" +
            "e : e '+' e | ID ; catch [re] { console.log(re); } finally { console.log(\"done\"); }\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR13");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("this.e(3);");
    });

    it("rule modifiers on a left-recursive rule", () => {
        const grammar =
            "grammar LR14;\n" +
            "public e : e '+' e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR14");
        expect(parser).toContain("this.precpred(this.context, 2)");
    });

    it("left recursion through a labeled recursive reference in a prefix position is not binary", () => {
        const grammar =
            "grammar LR15;\n" +
            "e : x=e '!' | '-' y=e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR15");
        expect(parser).toContain("localContext._x = previousContext;");
        expect(parser).toContain("localContext._y = this.e(2);");
        expect(parser).toContain("this.precpred(this.context, 3)");
    });

    it("sets, not-sets and wildcards in operator alternatives", () => {
        const grammar =
            "grammar LR16;\n" +
            "e : e ('*'|'/') e\n" +
            "  | e ~('*'|'/') e\n" +
            "  | e . e\n" +
            "  | ID\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR16");
        expect(parser).toContain("this.precpred(this.context, 4)");
        expect(parser).toContain("if (!(_la === 1 || _la === 2)) {");
        expect(parser).toContain("this.precpred(this.context, 3)");
        expect(parser).toContain("if (_la <= 0 || _la === 1 || _la === 2) {");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("this.matchWildcard();");
        expect(parser).toContain("this.e(5);");
        expect(parser).toContain("this.e(4);");
        expect(parser).toContain("this.e(3);");
    });

    it("element options with values on operator tokens", () => {
        const grammar =
            "grammar LR19;\n" +
            "e : e '/'<x='s'> e | e '%'<tokenIndex=7> e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);
        expect(result.queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.IllegalOption);

        const parser = parserOf(result, "LR19");
        expect(parser).toContain("this.precpred(this.context, 3)");
        expect(parser).toContain("this.match(LR19Parser.T__0);");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("this.match(LR19Parser.T__1);");
    });

    it("set elements with options in operator alternatives", () => {
        const grammar =
            "grammar LR20;\n" +
            "e : e ('+'<tokenIndex=1> | '-'<assoc=left>) e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);
        expect(result.queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.UnrecognizedAssocOption);

        const parser = parserOf(result, "LR20");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("if (!(_la === 1 || _la === 2)) {");
        expect(parser).toContain("this.e(3);");
    });

    it("plain sub block between the operands", () => {
        const grammar =
            "grammar LR21;\n" +
            "e : e (ID ID | INT) e | ID ;\n" +
            "ID : [a-z]+ ;\n" +
            "INT : [0-9]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR21");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser).toContain("this.match(LR21Parser.INT);");
        expect(parser).toContain("this.e(3);");
    });

    it("labeled non-recursive rule reference and wildcards in suffix alternatives", () => {
        const grammar =
            "grammar LR22;\n" +
            "e : e '.' x=f | e '!' .<tokenIndex=2> | e '?' . | ID ;\n" +
            "f : ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR22");
        expect(parser).toContain("this.precpred(this.context, 4)");
        expect(parser).toContain("localContext._x = this.f();");
        expect(parser).toContain("this.precpred(this.context, 3)");
        expect(parser).toContain("this.precpred(this.context, 2)");
        expect(parser.match(/this\.matchWildcard\(\);/g)).toHaveLength(2);
    });

    it("predicates with fail options after the right operand", () => {
        const grammar =
            "grammar LR23;\n" +
            "e : e '+' e {p()}?<fail={act()}> | e '-' e {q()}?<fail='msg'> | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR23");
        expect(parser).toContain("throw this.createFailedPredicateException(\"p()\", act());");
        expect(parser).toContain("throw this.createFailedPredicateException(\"q()\", \"msg\");");
        expect(parser).toContain("return p();");
        expect(parser).toContain("return q();");
    });

    it("non left-recursive rule referencing itself in a non-leading position is left alone", () => {
        const grammar =
            "grammar LR17;\n" +
            "e : ID e | ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors).toHaveLength(0);

        const parser = parserOf(result, "LR17");
        expect(parser).not.toContain("precpred");
        expect(parser).toContain("this.e();");
    });

    it("indirect left recursion is detected", () => {
        const grammar =
            "grammar LR18;\n" +
            "a : b ID | ID ;\n" +
            "b : a ID ;\n" +
            "ID : [a-z]+ ;\n";

        const result = generate(grammar);
        expect(result.queue.errors.map((e) => { return e.code; })).toContain(IssueCode.LeftRecursionCycles);
    });
});
