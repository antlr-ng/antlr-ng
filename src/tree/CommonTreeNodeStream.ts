/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Token, type TokenStream } from "antlr4ng";

import type { CommonTree } from "./CommonTree.js";
import { TreeIterator } from "./TreeIterator.js";

export class CommonTreeNodeStream {
    /** If this tree (root) was created from a {@link TokenStream}, track it. */
    public tokens: TokenStream;

    /** Pull nodes from which tree? */
    private root: CommonTree;

    /** The {@link TreeIterator} we using. */
    private iterator: TreeIterator;

    /** Tree {@code (nil A B C)} trees like flat {@code A B C} streams */
    private hasNilRoot = false;

    /** Tracks tree depth.  Level=0 means we're at root node level. */
    private level = 0;

    /** Absolute token index. It's the index of the symbol about to be read via `LT(1)`. */
    private currentElementIndex = 0;

    /** Index of next element to fill. */
    private p = 0;

    private data: CommonTree[] = [];

    /** This is the `LT(-1)` element for the first element in {@link data}. */
    private prevElement: CommonTree | null;

    /** Track object returned by nextElement upon end of stream. */
    private eof: CommonTree | null = null;

    /** Tracks how deep mark() calls are nested. */
    private markDepth = 0;

    public constructor(tree: CommonTree) {
        this.root = tree;
        this.iterator = new TreeIterator(this.root);
    }

    public isEOF(o: CommonTree): boolean {
        return o.getType() === Token.EOF;
    }

    public lookaheadType(k: number): CommonTree | null {
        if (k === 0) {
            return null;
        }

        if (k < 0) {
            return this.lookBack(-k);
        }

        this.syncAhead(k);
        if ((this.p + k - 1) > this.data.length) {
            return this.eof;
        }

        return this.elementAt(k - 1);
    }

    public lookahead(i: number): number {
        const tree = this.lookaheadType(i);

        return tree ? tree.getType() : Token.INVALID_TYPE;
    }

    public get index(): number {
        return this.currentElementIndex;
    }

    public mark(): number {
        ++this.markDepth;

        return 0;
    }

    public release(marker: number): void {
        --this.markDepth;
    }

    /** Make sure we have at least one element to remove, even if EOF. */
    public consume(): void {
        this.syncAhead(1);
        this.remove();
        this.currentElementIndex++;
    }

    /**
     * Seek to a 0-indexed absolute token index. Normally used to seek backwards in the buffer. Does not force
     * loading of nodes.
     *
     * To preserve backward compatibility, this method allows seeking past the end of the currently buffered data.
     * In this case, the input pointer will be moved but the data will only actually be loaded upon the next call to
     * {@link consume} or {@link lookaheadType} for `k > 0`.
     *
     * @param index The absolute token index to seek to.
     */
    public seek(index: number): void {
        if (index < 0) {
            throw new Error("can't seek before the beginning of the input");
        }

        const delta = this.currentElementIndex - index;
        if (this.p - delta < 0) {
            throw new Error("can't seek before the beginning of this stream's buffer");
        }

        this.p -= delta;
        this.currentElementIndex = index;
    }

    private lookBack(k: number): CommonTree | null {
        const index = this.p - k;
        if (index === -1) {
            return this.prevElement;
        }

        if (index >= 0) {
            return this.data[index];
        }

        if (index < -1) {
            throw new Error("can't look more than one token before the beginning of this stream's buffer");
        }

        throw new Error("can't look past the end of this stream's buffer using LB(int)");
    }

    /**
     * @returns element `i` elements ahead of current element. `i == 0` gets current element. This is not an absolute
     * index into `data` since `p` defines the start of the real list.
     *
     * @param i The index for the element.
     */
    private elementAt(i: number): CommonTree {
        const absIndex = this.p + i;
        if (absIndex >= this.data.length) {
            throw new Error("queue index " + absIndex + " > last index " + (this.data.length - 1));
        }

        if (absIndex < 0) {
            throw new Error("queue index " + absIndex + " < 0");
        }

        return this.data[absIndex];
    }

    /**
     * Makes sure we have 'need' elements from current position p. Last valid p index is data.size()-1. `p + need - 1`
     * is the data index 'need' elements ahead. If we need 1 element, `(p + 1 - 1) == p` must be < data.length.
     *
     * @param need The number of elements to ensure are in the buffer.
     */
    private syncAhead(need: number): void {
        // How many more elements we need?
        const n = (this.p + need - 1) - this.data.length + 1;
        if (n > 0) {
            this.fill(n);
        }
    }

    /**
     * Adds n elements to buffer
     *
     * @param n The number of elements to add.
     */
    private fill(n: number): void {
        for (let i = 1; i <= n; i++) {
            const o = this.nextElement();
            if (this.isEOF(o)) {
                this.eof = o;
            }

            this.data.push(o);
        }
    }

    private nextElement(): CommonTree {
        let t = this.iterator.nextTree()!;

        if (t === TreeIterator.up) {
            this.level--;
            if (this.level === 0 && this.hasNilRoot) {
                return this.iterator.nextTree()!;
            }

            // Don't give last UP - get EOF.
        } else {
            if (t === TreeIterator.down) {
                this.level++;
            }
        }

        if (this.level === 0 && t.isNil()) { // if nil root, scarf nil, DOWN
            this.hasNilRoot = true;
            t = this.iterator.nextTree()!; // t is now DOWN, so get first real node next
            this.level++;
            t = this.iterator.nextTree()!;
        }

        return t;
    }
    /**
     * @returns the first element in the queue.
     */
    private remove(): CommonTree {
        const o = this.elementAt(0);
        this.p++;

        // Have we hit end of buffer and not backtracking?
        if (this.p === this.data.length && this.markDepth === 0) {
            this.prevElement = o;

            // If so, it's an opportunity to start filling at index 0 again.
            this.p = 0;
            this.data = [];
        }

        return o;
    }
}
