/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: disable

import { describe, expect, it } from "vitest";

import {
    ArrayPredictionContext, createSingletonPredictionContext, EmptyPredictionContext, merge, PredictionContext,
    SingletonPredictionContext
} from "antlr4ng";

// TODO: this is a pure runtime test. It should be moved to the target runtime tests.

describe("TestGraphNodes", () => {
    const toDOTString = (context: PredictionContext, rootIsWildcard: boolean): string => {
        let nodes = "";
        let edges = "";

        const visited = new Map<PredictionContext, PredictionContext>();
        const contextIds = new Map<PredictionContext, number>();
        const workList: PredictionContext[] = [];

        visited.set(context, context);
        contextIds.set(context, contextIds.size);
        workList.push(context);
        while (workList.length > 0) {
            const current = workList.shift()!;
            nodes += "  s" + contextIds.get(current) + "[";

            if (current.length > 1) {
                nodes += "shape=record, ";
            }

            nodes += "label=\"";

            if (current.isEmpty()) {
                nodes += rootIsWildcard ? "*" : "$";
            } else {
                if (current.length > 1) {
                    for (let i = 0; i < current.length; i++) {
                        if (i > 0) {
                            nodes += "|";
                        }

                        nodes += "<p" + i + ">";
                        if (current.getReturnState(i) === PredictionContext.EMPTY_RETURN_STATE) {
                            nodes += rootIsWildcard ? "*" : "$";
                        }
                    }
                } else {
                    nodes += contextIds.get(current);
                }
            }

            nodes += "\"];\n";

            if (current.isEmpty()) {
                continue;
            }

            for (let i = 0; i < current.length; i++) {
                if (current.getReturnState(i) === PredictionContext.EMPTY_RETURN_STATE) {
                    continue;
                }

                if (!visited.has(current.getParent(i)!)) {
                    visited.set(current.getParent(i)!, current.getParent(i)!);
                    contextIds.set(current.getParent(i)!, contextIds.size);
                    workList.unshift(current.getParent(i)!);
                }

                edges += "  s" + contextIds.get(current);
                if (current.length > 1) {
                    edges += ":p" + i;
                }

                edges += "->";
                edges += "s" + contextIds.get(current.getParent(i)!);
                edges += "[label=\"" + current.getReturnState(i) + "\"]";
                edges += ";\n";
            }
        }

        let builder = "";
        builder += "digraph G {\n";
        builder += "rankdir=LR;\n";
        builder += nodes;
        builder += edges;
        builder += "}\n";

        return builder;
    };

    const arrayContext = (...nodes: SingletonPredictionContext[]): ArrayPredictionContext => {
        const parents: PredictionContext[] = [];
        const invokingStates: number[] = [];

        for (const node of nodes) {
            parents.push(node.parent!);
            invokingStates.push(node.returnState);
        }

        return new ArrayPredictionContext(parents, invokingStates);
    };

    const contextA = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 1);
    };

    const contextB = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 2);
    };

    const contextC = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 3);
    };

    const contextD = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 4);
    };

    const contextU = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 6);
    };

    const contextV = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 7);
    };

    const contextW = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 8);
    };

    const contextX = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 9);
    };

    const contextY = (): SingletonPredictionContext => {
        return createSingletonPredictionContext(EmptyPredictionContext.instance, 10);
    };

    it("test_$_$", () => {
        const r = merge(EmptyPredictionContext.instance, EmptyPredictionContext.instance, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"*\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_$_$_fullctx", () => {
        const r = merge(EmptyPredictionContext.instance, EmptyPredictionContext.instance, false, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"$\"];\n" +
            "}\n";
        expect(toDOTString(r, false)).toBe(expecting);
    });

    it("test_x_$", () => {
        const r = merge(contextX(), EmptyPredictionContext.instance, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"*\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_x_$_fullctx", () => {
        const r = merge(contextX(), EmptyPredictionContext.instance, false, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>$\"];\n" +
            "  s1[label=\"$\"];\n" +
            "  s0:p0->s1[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, false)).toBe(expecting);
    });

    it("test_$_x", () => {
        const r = merge(EmptyPredictionContext.instance, contextX(), true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"*\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_$_x_fullctx", () => {
        const r = merge(EmptyPredictionContext.instance, contextX(), false, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>$\"];\n" +
            "  s1[label=\"$\"];\n" +
            "  s0:p0->s1[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, false)).toBe(expecting);
    });

    it("test_a_a", () => {
        const r = merge(contextA(), contextA(), true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_a$_ax", () => {
        const a1 = contextA();
        const x = contextX();
        const a2 = createSingletonPredictionContext(x, 1);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_a$_ax_fullctx", () => {
        const a1 = contextA();
        const x = contextX();
        const a2 = createSingletonPredictionContext(x, 1);
        const r = merge(a1, a2, false, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[shape=record, label=\"<p0>|<p1>$\"];\n" +
            "  s2[label=\"$\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "  s1:p0->s2[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, false)).toBe(expecting);
    });

    it("test_ax$_a$", () => {
        const x = contextX();
        const a1 = createSingletonPredictionContext(x, 1);
        const a2 = contextA();
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_aa$_a$_$_fullCtx", () => {
        const empty = EmptyPredictionContext.instance;
        const child1 = createSingletonPredictionContext(empty, 8);
        const right = merge(empty, child1, false, null);
        const left = createSingletonPredictionContext(right, 8);
        const merged = merge(left, right, false, null);
        const actual = toDOTString(merged, false);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>$\"];\n" +
            "  s1[shape=record, label=\"<p0>|<p1>$\"];\n" +
            "  s2[label=\"$\"];\n" +
            "  s0:p0->s1[label=\"8\"];\n" +
            "  s1:p0->s2[label=\"8\"];\n" +
            "}\n";
        expect(actual).toBe(expecting);
    });

    it("test_ax$_a$_fullctx", () => {
        const x = contextX();
        const a1 = createSingletonPredictionContext(x, 1);
        const a2 = contextA();
        const r = merge(a1, a2, false, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[shape=record, label=\"<p0>|<p1>$\"];\n" +
            "  s2[label=\"$\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "  s1:p0->s2[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, false)).toBe(expecting);
    });

    it("test_a_b", () => {
        const r = merge(contextA(), contextB(), true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_ax_ax_same", () => {
        const x = contextX();
        const a1 = createSingletonPredictionContext(x, 1);
        const a2 = createSingletonPredictionContext(x, 1);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s2[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "  s1->s2[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_ax_ax", () => {
        const x1 = contextX();
        const x2 = contextX();
        const a1 = createSingletonPredictionContext(x1, 1);
        const a2 = createSingletonPredictionContext(x2, 1);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s2[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "  s1->s2[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_abx_abx", () => {
        const x1 = contextX();
        const x2 = contextX();
        const b1 = createSingletonPredictionContext(x1, 2);
        const b2 = createSingletonPredictionContext(x2, 2);
        const a1 = createSingletonPredictionContext(b1, 1);
        const a2 = createSingletonPredictionContext(b2, 1);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s3[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "  s1->s2[label=\"2\"];\n" +
            "  s2->s3[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_abx_acx", () => {
        const x1 = contextX();
        const x2 = contextX();
        const b = createSingletonPredictionContext(x1, 2);
        const c = createSingletonPredictionContext(x2, 3);
        const a1 = createSingletonPredictionContext(b, 1);
        const a2 = createSingletonPredictionContext(c, 1);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s3[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "  s1:p0->s2[label=\"2\"];\n" +
            "  s1:p1->s2[label=\"3\"];\n" +
            "  s2->s3[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_ax_bx_same", () => {
        const x = contextX();
        const a = createSingletonPredictionContext(x, 1);
        const b = createSingletonPredictionContext(x, 2);
        const r = merge(a, b, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s2[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "  s1->s2[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_ax_bx", () => {
        const x1 = contextX();
        const x2 = contextX();
        const a = createSingletonPredictionContext(x1, 1);
        const b = createSingletonPredictionContext(x2, 2);
        const r = merge(a, b, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s2[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "  s1->s2[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_ax_by", () => {
        const a = createSingletonPredictionContext(contextX(), 1);
        const b = createSingletonPredictionContext(contextY(), 2);
        const r = merge(a, b, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s3[label=\"*\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s2->s3[label=\"10\"];\n" +
            "  s1->s3[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_a$_bx", () => {
        const x2 = contextX();
        const a = contextA();
        const b = createSingletonPredictionContext(x2, 2);
        const r = merge(a, b, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s2->s1[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_a$_bx_fullctx", () => {
        const x2 = contextX();
        const a = contextA();
        const b = createSingletonPredictionContext(x2, 2);
        const r = merge(a, b, false, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s1[label=\"$\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s2->s1[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, false)).toBe(expecting);
    });

    // Skipped in Java for the reason: "Known inefficiency but deferring resolving the issue for now".
    it.skip("test_aex_bfx", () => {
        // TJP: this is inefficient as it leaves the top x nodes unmerged.
        const x1 = contextX();
        const x2 = contextX();
        const e = createSingletonPredictionContext(x1, 5);
        const f = createSingletonPredictionContext(x2, 6);
        const a = createSingletonPredictionContext(e, 1);
        const b = createSingletonPredictionContext(f, 2);
        const r = merge(a, b, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s3[label=\"3\"];\n" +
            "  s4[label=\"*\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s2->s3[label=\"6\"];\n" +
            "  s3->s4[label=\"9\"];\n" +
            "  s1->s3[label=\"5\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    // Array merges

    it("test_A$_A$_fullctx", () => {
        const a1 = arrayContext(EmptyPredictionContext.instance);
        const a2 = arrayContext(EmptyPredictionContext.instance);
        const r = merge(a1, a2, false, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"$\"];\n" +
            "}\n";
        expect(toDOTString(r, false)).toBe(expecting);
    });

    it("test_Aab_Ac", () => { // a,b + c
        const a = contextA();
        const b = contextB();
        const c = contextC();
        const a1 = arrayContext(a, b);
        const a2 = arrayContext(c);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "  s0:p2->s1[label=\"3\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aa_Aa", () => {
        const a1 = contextA();
        const a2 = contextA();
        const aa1 = arrayContext(a1);
        const aa2 = arrayContext(a2);
        const r = merge(aa1, aa2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aa_Abc", () => { // a + b,c
        const a = contextA();
        const b = contextB();
        const c = contextC();
        const a1 = arrayContext(a);
        const a2 = arrayContext(b, c);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "  s0:p2->s1[label=\"3\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aac_Ab", () => { // a,c + b
        const a = contextA();
        const b = contextB();
        const c = contextC();
        const a1 = arrayContext(a, c);
        const a2 = arrayContext(b);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "  s0:p2->s1[label=\"3\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aab_Aa", () => { // a,b + a
        const a1 = arrayContext(contextA(), contextB());
        const a2 = arrayContext(contextA());
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aab_Ab", () => { // a,b + b
        const a1 = arrayContext(contextA(), contextB());
        const a2 = arrayContext(contextB());
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s1[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aax_Aby", () => { // ax + by but in arrays
        const a = createSingletonPredictionContext(contextX(), 1);
        const b = createSingletonPredictionContext(contextY(), 2);
        const a1 = arrayContext(a);
        const a2 = arrayContext(b);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s3[label=\"*\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s2->s3[label=\"10\"];\n" +
            "  s1->s3[label=\"9\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aax_Aay", () => { // ax + ay -> merged singleton a, array parent
        const a1 = createSingletonPredictionContext(contextX(), 1);
        const a2 = createSingletonPredictionContext(contextY(), 1);
        const aa1 = arrayContext(a1);
        const aa2 = arrayContext(a2);
        const r = merge(aa1, aa2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[label=\"0\"];\n" +
            "  s1[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s2[label=\"*\"];\n" +
            "  s0->s1[label=\"1\"];\n" +
            "  s1:p0->s2[label=\"9\"];\n" +
            "  s1:p1->s2[label=\"10\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aaxc_Aayd", () => { // ax,c + ay,d -> merged a, array parent
        const a1 = createSingletonPredictionContext(contextX(), 1);
        const a2 = createSingletonPredictionContext(contextY(), 1);
        const aa1 = arrayContext(a1, contextC());
        const aa2 = arrayContext(a2, contextD());
        const r = merge(aa1, aa2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>\"];\n" +
            "  s2[label=\"*\"];\n" +
            "  s1[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"3\"];\n" +
            "  s0:p2->s2[label=\"4\"];\n" +
            "  s1:p0->s2[label=\"9\"];\n" +
            "  s1:p1->s2[label=\"10\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aaubv_Acwdx", () => { // au,bv + cw,dx -> [a,b,c,d]->[u,v,w,x]
        const a = createSingletonPredictionContext(contextU(), 1);
        const b = createSingletonPredictionContext(contextV(), 2);
        const c = createSingletonPredictionContext(contextW(), 3);
        const d = createSingletonPredictionContext(contextX(), 4);
        const a1 = arrayContext(a, b);
        const a2 = arrayContext(c, d);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>|<p3>\"];\n" +
            "  s4[label=\"4\"];\n" +
            "  s5[label=\"*\"];\n" +
            "  s3[label=\"3\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s0:p2->s3[label=\"3\"];\n" +
            "  s0:p3->s4[label=\"4\"];\n" +
            "  s4->s5[label=\"9\"];\n" +
            "  s3->s5[label=\"8\"];\n" +
            "  s2->s5[label=\"7\"];\n" +
            "  s1->s5[label=\"6\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aaubv_Abvdx", () => { // au,bv + bv,dx -> [a,b,d]->[u,v,x]
        const a = createSingletonPredictionContext(contextU(), 1);
        const b1 = createSingletonPredictionContext(contextV(), 2);
        const b2 = createSingletonPredictionContext(contextV(), 2);
        const d = createSingletonPredictionContext(contextX(), 4);
        const a1 = arrayContext(a, b1);
        const a2 = arrayContext(b2, d);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>\"];\n" +
            "  s3[label=\"3\"];\n" +
            "  s4[label=\"*\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s0:p2->s3[label=\"4\"];\n" +
            "  s3->s4[label=\"9\"];\n" +
            "  s2->s4[label=\"7\"];\n" +
            "  s1->s4[label=\"6\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aaubv_Abwdx", () => { // au,bv + bw,dx -> [a,b,d]->[u,[v,w],x]
        const a = createSingletonPredictionContext(contextU(), 1);
        const b1 = createSingletonPredictionContext(contextV(), 2);
        const b2 = createSingletonPredictionContext(contextW(), 2);
        const d = createSingletonPredictionContext(contextX(), 4);
        const a1 = arrayContext(a, b1);
        const a2 = arrayContext(b2, d);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>\"];\n" +
            "  s3[label=\"3\"];\n" +
            "  s4[label=\"*\"];\n" +
            "  s2[shape=record, label=\"<p0>|<p1>\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s0:p2->s3[label=\"4\"];\n" +
            "  s3->s4[label=\"9\"];\n" +
            "  s2:p0->s4[label=\"7\"];\n" +
            "  s2:p1->s4[label=\"8\"];\n" +
            "  s1->s4[label=\"6\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aaubv_Abvdu", () => { // au,bv + bv,du -> [a,b,d]->[u,v,u]; u,v shared
        const a = createSingletonPredictionContext(contextU(), 1);
        const b1 = createSingletonPredictionContext(contextV(), 2);
        const b2 = createSingletonPredictionContext(contextV(), 2);
        const d = createSingletonPredictionContext(contextU(), 4);
        const a1 = arrayContext(a, b1);
        const a2 = arrayContext(b2, d);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>\"];\n" +
            "  s2[label=\"2\"];\n" +
            "  s3[label=\"*\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s2[label=\"2\"];\n" +
            "  s0:p2->s1[label=\"4\"];\n" +
            "  s2->s3[label=\"7\"];\n" +
            "  s1->s3[label=\"6\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

    it("test_Aaubu_Acudu", () => { // au,bu + cu,du -> [a,b,c,d]->[u,u,u,u]
        const a = createSingletonPredictionContext(contextU(), 1);
        const b = createSingletonPredictionContext(contextU(), 2);
        const c = createSingletonPredictionContext(contextU(), 3);
        const d = createSingletonPredictionContext(contextU(), 4);
        const a1 = arrayContext(a, b);
        const a2 = arrayContext(c, d);
        const r = merge(a1, a2, true, null);

        const expecting =
            "digraph G {\n" +
            "rankdir=LR;\n" +
            "  s0[shape=record, label=\"<p0>|<p1>|<p2>|<p3>\"];\n" +
            "  s1[label=\"1\"];\n" +
            "  s2[label=\"*\"];\n" +
            "  s0:p0->s1[label=\"1\"];\n" +
            "  s0:p1->s1[label=\"2\"];\n" +
            "  s0:p2->s1[label=\"3\"];\n" +
            "  s0:p3->s1[label=\"4\"];\n" +
            "  s1->s2[label=\"6\"];\n" +
            "}\n";
        expect(toDOTString(r, true)).toBe(expecting);
    });

});
