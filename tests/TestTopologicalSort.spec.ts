/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";
import { Graph } from "../src/misc/Graph.js";
import { convertArrayToString } from "../src/support/helpers.js";

/** Test topology sort in GraphNode. */
describe("TestTopologicalSort", () => {
    it("testFairlyLargeGraph", () => {
        const g = new Graph();
        g.addEdge("C", "F");
        g.addEdge("C", "G");
        g.addEdge("C", "A");
        g.addEdge("C", "B");
        g.addEdge("A", "D");
        g.addEdge("A", "E");
        g.addEdge("B", "E");
        g.addEdge("D", "E");
        g.addEdge("D", "F");
        g.addEdge("F", "H");
        g.addEdge("E", "F");

        const expecting = "[H, F, G, E, D, A, B, C]";
        const nodes = g.sort();
        const result = convertArrayToString(nodes);
        expect(result).toBe(expecting);
    });

    it("testCyclicGraph", () => {
        const g = new Graph();
        g.addEdge("A", "B");
        g.addEdge("B", "C");
        g.addEdge("C", "A");
        g.addEdge("C", "D");

        const expecting = "[D, C, B, A]";
        const nodes = g.sort();
        const result = convertArrayToString(nodes);
        expect(result).toBe(expecting);
    });

    it("testRepeatedEdges", () => {
        const g = new Graph();
        g.addEdge("A", "B");
        g.addEdge("B", "C");
        g.addEdge("A", "B"); // dup
        g.addEdge("C", "D");

        const expecting = "[D, C, B, A]";
        const nodes = g.sort();
        const result = convertArrayToString(nodes);
        expect(result).toBe(expecting);
    });

    it("testSimpleTokenDependence", () => {
        const g = new Graph();
        g.addEdge("Java.g4", "MyJava.tokens"); // Java feeds off manual token file
        g.addEdge("Java.tokens", "Java.g4");
        g.addEdge("Def.g4", "Java.tokens"); // walkers feed off generated tokens
        g.addEdge("Ref.g4", "Java.tokens");

        const expecting = "[MyJava.tokens, Java.g4, Java.tokens, Def.g4, Ref.g4]";
        const nodes = g.sort();
        const result = convertArrayToString(nodes);
        expect(result).toBe(expecting);
    });

    it("testParserLexerCombo", () => {
        const g = new Graph();
        g.addEdge("JavaLexer.tokens", "JavaLexer.g4");
        g.addEdge("JavaParser.g4", "JavaLexer.tokens");
        g.addEdge("Def.g4", "JavaLexer.tokens");
        g.addEdge("Ref.g4", "JavaLexer.tokens");

        const expecting = "[JavaLexer.g4, JavaLexer.tokens, JavaParser.g4, Def.g4, Ref.g4]";
        const nodes = g.sort();
        const result = convertArrayToString(nodes);
        expect(result).toBe(expecting);
    });
});
