/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { CommonTree } from "./CommonTree.js";

/**
 * A generic list of elements tracked in an alternative to be used in a -> rewrite rule. We need to subclass to fill
 * in the next() method, which returns either an AST node wrapped around a token payload or an existing subtree.
 *
 * Once you start next()ing, do not try to add more elements. It will break the cursor tracking I believe.
 */
export abstract class RewriteRuleElementStream {
    /**
     * Cursor 0..n-1.  If singleElement!=null, cursor is 0 until you next(), which bumps it to 1 meaning no more
     * elements.
     */
    protected cursor = 0;

    /** The list of tokens or subtrees we are tracking */
    protected elements: GrammarAST[];

    /**
     * Once a node / subtree has been used in a stream, it must be dup'd from then on. Streams are reset after
     * subrules so that the streams can be reused in future subrules.  So, reset must set a dirty bit. If dirty,
     * then next() always returns a dup.
     *
     * I wanted to use "naughty bit" here, but couldn't think of a way to use "naughty".
     */
    protected dirty = false;

    /**
     * The element or stream description; usually has name of the token or rule reference that this list tracks. Can
     * include rule name too, but the exception would track that info.
     */
    protected elementDescription: string;

    public constructor(elementDescription: string, elements?: GrammarAST[]) {
        this.elementDescription = elementDescription;
        this.elements = elements ?? [];
    }

    /**
     * Reset the condition of this stream so that it appears we have not consumed any of its elements. Elements
     * themselves are untouched. Once we reset the stream, any future use will need duplicates. Set the dirty bit.
     */
    public reset(): void {
        this.cursor = 0;
        this.dirty = true;
    }

    public add(el: GrammarAST | null): void {
        if (el) {
            this.elements.push(el);
        }
    }

    /**
     * Return the next element in the stream. If out of elements, throw an exception unless size() == 1. If size is 1,
     * then return elements[0].
     *
     * @returns a duplicate node/subtree if stream is out of elements and size == 1. If we've already used the element,
     * dup (dirty bit set).
     */
    public nextTree(): CommonTree {
        const n = this.size();
        if (this.dirty || (this.cursor >= n && n === 1)) {
            // If out of elements and size is 1, duplicate.
            const el = this.getNext();

            return this.dup(el);
        }

        // Test size above then fetch.
        return this.getNext();
    }

    public hasNext(): boolean {
        return this.cursor < this.elements.length;
    }

    public size(): number {
        return this.elements.length;
    }

    public getDescription(): string {
        return this.elementDescription;
    }

    /**
     * Does the work of getting the next element, making sure that it's a tree node or subtree. Throws an exception
     * if the stream is empty or we're out of elements and size > 1.
     *
     * @returns the next element in the stream.
     */
    protected getNext(): GrammarAST {
        const n = this.size();
        if (n === 0) {
            throw new Error(this.elementDescription);
        }

        // Out of elements?
        if (this.cursor >= n) {
            // If size is 1, it's ok; return and we'll dup.
            if (n === 1) {
                return this.toTree(this.elements[0]);
            }

            // Out of elements and size was not 1, so we can't dup.
            throw new Error(this.elementDescription);
        }

        if (n === 1) {
            // Move cursor even for single element list.
            this.cursor++;

            return this.toTree(this.elements[0]);
        }

        // Must have more than one in list, pull from elements.
        const o = this.toTree(this.elements[this.cursor]);
        this.cursor++;

        return o;
    }

    /**
     * Ensures stream emits trees. Tokens must be converted to AST nodes. AST nodes can be passed through unmolested.
     *
     * @param el The element to convert.
     *
     * @returns the element unaltered.
     */
    protected toTree(el: GrammarAST): GrammarAST {
        return el;
    }

    /**
     * When constructing trees, sometimes we need to dup a token or AST	subtree. Duplicating a token means just
     * creating another AST node around it. For trees, you must call the dupTree() unless the element is for a tree
     * root. Then it must be a node duplicate.
     */
    protected abstract dup(el: CommonTree): CommonTree;

}
