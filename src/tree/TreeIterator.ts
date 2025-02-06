/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonToken, Token } from "antlr4ng";

import { Constants } from "../Constants.js";
import { CommonTree } from "./CommonTree.js";

/**
 * Return a node stream from a doubly-linked tree whose nodes know what child index they are. No remove() is supported.
 *
 * Emit navigation nodes (DOWN, UP, and EOF) to let show tree structure.
 */
export class TreeIterator {

    /** Navigation nodes to return during walk and at end. */
    public static readonly up = new CommonTree(CommonToken.fromType(Constants.UP, "UP"));
    public static readonly down = new CommonTree(CommonToken.fromType(Constants.DOWN, "DOWN"));
    public static readonly eof = new CommonTree(CommonToken.fromType(Token.EOF, "EOF"));

    protected root: CommonTree | undefined;
    protected tree: CommonTree | undefined;
    protected firstTime = true;

    /** If we emit UP/DOWN nodes, we need to spit out multiple nodes per next() call. */
    protected nodes: CommonTree[] = [];

    public constructor(tree: CommonTree) {
        this.tree = tree;
        this.root = tree;
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

        if (this.tree.children.length > 0) {
            return true;
        }

        return this.tree.parent !== null; // back at root?
    }

    public nextTree(): CommonTree | undefined {
        if (this.firstTime) { // initial condition
            this.firstTime = false;
            if (this.tree?.children.length === 0) { // single node tree (special)
                this.nodes.push(TreeIterator.eof);

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
            return TreeIterator.eof;
        }

        // next node will be child 0 if any children
        if (this.tree.children.length > 0) {
            this.tree = this.tree.children[0];
            this.nodes.push(this.tree); // real node is next after DOWN

            return TreeIterator.down;
        }

        // if no children, look for next sibling of tree or ancestor
        let parent = this.tree.parent;
        // while we're out of siblings, keep popping back up towards root
        while (parent !== null &&
            this.tree.childIndex + 1 >= parent.children.length) {
            this.nodes.push(TreeIterator.up); // we're moving back up
            this.tree = parent;
            parent = this.tree.parent;
        }

        // no nodes left?
        if (parent === null) {
            this.tree = undefined; // back at root? nothing left then
            this.nodes.push(TreeIterator.eof); // add to queue, might have UP nodes in there

            return this.nodes.shift();
        }

        // must have found a node with an unvisited sibling
        // move to it and return it
        const nextSiblingIndex = this.tree.childIndex + 1;
        this.tree = parent.children[nextSiblingIndex];
        this.nodes.push(this.tree); // add to queue, might have UP nodes in there

        return this.nodes.shift();
    }

    public remove(): void {
        throw new Error("Remove is unsupported");
    }
}
