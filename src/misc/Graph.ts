/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns */

/**
 * A generic graph with edges; Each node has a single Object payload.
 * This is only used to topologically sort a list of file dependencies at the moment.
 */
export class Graph {
    public static Node = class Node {
        public payload: string;

        public edges: Node[] = []; // points at which nodes?

        public constructor(payload: string) {
            this.payload = payload;
        }

        public addEdge(n: Node): void {
            if (!this.edges.includes(n)) {
                this.edges.push(n);
            }
        }

        public toString(): string {
            return String(this.payload);
        }
    };

    /** Map from node payload to node containing it */
    protected nodes = new Map<string, InstanceType<typeof Graph.Node>>();

    public addEdge(a: string, b: string): void {
        const aNode = this.getNode(a);
        const bNode = this.getNode(b);
        aNode.addEdge(bNode);
    }

    public getNode(a: string): InstanceType<typeof Graph.Node> {
        const existing = this.nodes.get(a);
        if (existing) {
            return existing;
        }

        const n = new Graph.Node(a);
        this.nodes.set(a, n);

        return n;
    };

    /**
     * DFS-based topological sort. A valid sort is the reverse of
     * the post-order DFA traversal.  Amazingly simple but true.
     * For sorting, I'm not following convention here since ANTLR
     * needs the opposite.  Here's what I assume for sorting:
     *
     * If there exists an edge u -> v then u depends on v and v must happen before u.
     *
     * So if this gives non-reversed post order traversal, I get the order I want.
     */
    public sort(): string[] {
        const visited = new Set<InstanceType<typeof Graph.Node>>();
        const sorted = new Array<string>();
        while (visited.size < this.nodes.size) {
            // pick any unvisited node, n
            let n = null;
            for (const tNode of this.nodes.values()) {
                n = tNode;
                if (!visited.has(n)) {
                    break;
                }
            }

            if (n !== null) { // if at least one unvisited
                this.dfs(n, visited, sorted);
            }
        }

        return sorted;
    }

    public dfs(n: InstanceType<typeof Graph.Node>, visited: Set<InstanceType<typeof Graph.Node>>,
        sorted: string[]): void {
        if (visited.has(n)) {
            return;
        }

        visited.add(n);
        for (const target of n.edges) {
            this.dfs(target, visited, sorted);
        }

        sorted.push(n.payload);
    }
}
