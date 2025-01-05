/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

/**
 * A queue that can dequeue and get(i) in O(1) and grow arbitrarily large.
 *  A linked list is fast at dequeue but slow at get(i).  An array is
 *  the reverse.  This is O(1) for both operations.
 *
 *  List grows until you dequeue last element at end of buffer. Then
 *  it resets to start filling at 0 again.  If adds/removes are balanced, the
 *  buffer will not grow too large.
 *
 *  No iterator stuff as that's not how we'll use it.
 */
export class FastQueue<T> {
    /** dynamically-sized buffer of elements */
    protected data = new Array<T>();

    /** index of next element to fill */
    protected p = 0;
    #range = -1; // how deep have we gone?

    public reset(): void {
        this.clear();
    }

    public clear(): void {
        this.p = 0;
        this.data.splice(0);
    }

    /** Get and remove first element in queue */
    public remove(): T {
        const o = this.elementAt(0);
        this.p++;

        // have we hit end of buffer?
        if (this.p === this.data.length) {
            // if so, it's an opportunity to start filling at index 0 again
            this.clear(); // size goes to 0, but retains memory
        }

        return o;
    }

    public add(o: T): void {
        this.data.push(o);
    }

    public get size(): number {
        return this.data.length - this.p;
    }

    public range(): number {
        return this.#range;
    }

    public head(): T {
        return this.elementAt(0);
    }

    /**
     * Return element {@code i} elements ahead of current element. {@code i==0}
     * gets current element. This is not an absolute index into {@link #data}
     * since {@code p} defines the start of the real list.
     */
    public elementAt(i: number): T {
        const absIndex = this.p + i;
        if (absIndex >= this.data.length) {
            throw new Error("queue index " + absIndex + " > last index " + (this.data.length - 1));
        }

        if (absIndex < 0) {
            throw new Error("queue index " + absIndex + " < 0");
        }

        if (absIndex > this.#range) {
            this.#range = absIndex;
        }

        return this.data[absIndex];
    }

    /** Return string of current buffer contents; non-destructive */
    public toString(): string {
        let buf = "";
        const n = this.size;
        for (let i = 0; i < n; i++) {
            buf += this.elementAt(i);
            if ((i + 1) < n) {
                buf += " ";
            }

        }

        return buf;
    }
}
