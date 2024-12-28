/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

// cspell: disable

import { Token } from "antlr4ng";

import { Constants } from "../../Constants.js";
import type { CommonTree } from "../../tree/CommonTree.js";
import { FastQueue } from "../misc/FastQueue.js";
import { CommonTreeAdaptor } from "./CommonTreeAdaptor.js";

/**
 * Return a node stream from a doubly-linked tree whose nodes
 *  know what child index they are.  No remove() is supported.
 *
 *  Emit navigation nodes (DOWN, UP, and EOF) to let show tree structure.
 */
export class TreeIterator {

    // navigation nodes to return during walk and at end
    public up: CommonTree;
    public down: CommonTree;
    public eof: CommonTree;
    protected adaptor: CommonTreeAdaptor;
    protected root: CommonTree | null;
    protected tree: CommonTree | null;
    protected firstTime = true;

    /**
     * If we emit UP/DOWN nodes, we need to spit out multiple nodes per
     *  next() call.
     */
    protected nodes: FastQueue<CommonTree>;

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
        this.nodes = new FastQueue<CommonTree>();
        this.down = adaptor.create(Constants.DOWN, "DOWN");
        this.up = adaptor.create(Constants.UP, "UP");
        this.eof = adaptor.create(Token.EOF, "EOF");
    }

    public reset(): void {
        this.firstTime = true;
        this.tree = this.root;
        this.nodes.clear();
    }

    public hasNext(): boolean {
        if (this.firstTime) {
            return this.root !== null;
        }

        if (this.nodes.size > 0) {
            return true;
        }

        if (this.tree === null) {
            return false;
        }

        if (this.adaptor.getChildCount(this.tree) > 0) {
            return true;
        }

        return this.adaptor.getParent(this.tree) !== null; // back at root?
    }

    public nextTree(): CommonTree | null {
        if (this.firstTime) { // initial condition
            this.firstTime = false;
            if (this.adaptor.getChildCount(this.tree) === 0) { // single node tree (special)
                this.nodes.add(this.eof);

                return this.tree;
            }

            return this.tree;
        }
        // if any queued up, use those first
        if (this.nodes.size > 0) {
            return this.nodes.remove();
        }

        // no nodes left?
        if (this.tree === null) {
            return this.eof;
        }

        // next node will be child 0 if any children
        if (this.adaptor.getChildCount(this.tree) > 0) {
            this.tree = this.adaptor.getChild(this.tree, 0);
            this.nodes.add(this.tree!); // real node is next after DOWN

            return this.down;
        }

        // if no children, look for next sibling of tree or ancestor
        let parent = this.adaptor.getParent(this.tree);
        // while we're out of siblings, keep popping back up towards root
        while (parent !== null &&
            this.adaptor.getChildIndex(this.tree) + 1 >= this.adaptor.getChildCount(parent)) {
            this.nodes.add(this.up); // we're moving back up
            this.tree = parent;
            parent = this.adaptor.getParent(this.tree);
        }

        // no nodes left?
        if (parent === null) {
            this.tree = null; // back at root? nothing left then
            this.nodes.add(this.eof); // add to queue, might have UP nodes in there

            return this.nodes.remove();
        }

        // must have found a node with an unvisited sibling
        // move to it and return it
        const nextSiblingIndex = this.adaptor.getChildIndex(this.tree) + 1;
        this.tree = this.adaptor.getChild(parent, nextSiblingIndex);
        this.nodes.add(this.tree!); // add to queue, might have UP nodes in there

        return this.nodes.remove();
    }

    public remove(): void {
        throw new Error("Remove is unsupported");
    }
}
