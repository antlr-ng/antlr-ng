/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Token } from "antlr4ng";

import { Constants } from "../Constants.js";
import type { CommonTree } from "./CommonTree.js";
import { CommonTreeAdaptor } from "./CommonTreeAdaptor.js";

/**
 * Return a node stream from a doubly-linked tree whose nodes know what child index they are. No remove() is supported.
 *
 * Emit navigation nodes (DOWN, UP, and EOF) to let show tree structure.
 */
export class TreeIterator {

    /** Navigation nodes to return during walk and at end. */
    public up: CommonTree;
    public down: CommonTree;
    public eof: CommonTree;

    protected adaptor: CommonTreeAdaptor;
    protected root: CommonTree | undefined;
    protected tree: CommonTree | undefined;
    protected firstTime = true;

    /** If we emit UP/DOWN nodes, we need to spit out multiple nodes per next() call. */
    protected nodes: CommonTree[] = [];

    public constructor(tree: CommonTree);
    public constructor(adaptor: CommonTreeAdaptor, tree: CommonTree);
    public constructor(...args: unknown[]) {
        let tree;
        let adaptor;

        if (args.length === 1) {
            [tree] = args as [CommonTree];

            adaptor = new CommonTreeAdaptor();
        } else {
            [adaptor, tree] = args as [CommonTreeAdaptor, CommonTree];
        }

        this.adaptor = adaptor;
        this.tree = tree;
        this.root = tree;
        this.down = adaptor.create(Constants.DOWN, "DOWN");
        this.up = adaptor.create(Constants.UP, "UP");
        this.eof = adaptor.create(Token.EOF, "EOF");
    }

    public reset(): void {
        this.firstTime = true;
        this.tree = this.root;
        this.nodes.length = 0;
    }

    public hasNext(): boolean {
        if (this.firstTime) {
            return this.root !== undefined;
        }

        if (this.nodes.length > 0) {
            return true;
        }

        if (this.tree === undefined) {
            return false;
        }

        if (this.adaptor.getChildCount(this.tree) > 0) {
            return true;
        }

        return this.adaptor.getParent(this.tree) !== null; // back at root?
    }

    public nextTree(): CommonTree | undefined {
        if (this.firstTime) { // initial condition
            this.firstTime = false;
            if (this.adaptor.getChildCount(this.tree ?? null) === 0) { // single node tree (special)
                this.nodes.push(this.eof);

                return this.tree;
            }

            return this.tree;
        }

        // If any queued up, use those first.
        if (this.nodes.length > 0) {
            return this.nodes.shift();
        }

        // no nodes left?
        if (this.tree === undefined) {
            return this.eof;
        }

        // next node will be child 0 if any children
        if (this.adaptor.getChildCount(this.tree) > 0) {
            this.tree = this.adaptor.getChild(this.tree, 0)!;
            this.nodes.push(this.tree); // real node is next after DOWN

            return this.down;
        }

        // if no children, look for next sibling of tree or ancestor
        let parent = this.adaptor.getParent(this.tree);
        // while we're out of siblings, keep popping back up towards root
        while (parent !== null &&
            this.adaptor.getChildIndex(this.tree) + 1 >= this.adaptor.getChildCount(parent)) {
            this.nodes.push(this.up); // we're moving back up
            this.tree = parent;
            parent = this.adaptor.getParent(this.tree);
        }

        // no nodes left?
        if (parent === null) {
            this.tree = undefined; // back at root? nothing left then
            this.nodes.push(this.eof); // add to queue, might have UP nodes in there

            return this.nodes.shift();
        }

        // must have found a node with an unvisited sibling
        // move to it and return it
        const nextSiblingIndex = this.adaptor.getChildIndex(this.tree) + 1;
        this.tree = this.adaptor.getChild(parent, nextSiblingIndex)!;
        this.nodes.push(this.tree); // add to queue, might have UP nodes in there

        return this.nodes.shift();
    }

    public remove(): void {
        throw new Error("Remove is unsupported");
    }
}
