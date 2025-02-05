/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/**
 * A lookahead queue that knows how to mark/release locations in the buffer for backtracking purposes.
 */
export abstract class LookaheadStream<T> {
    /** Absolute token index. It's the index of the symbol about to be read via `LT(1)`. */
    protected currentElementIndex = 0;

    /** Index of next element to fill. */
    protected p = 0;

    protected data: T[] = [];

    /** This is the `LT(-1)` element for the first element in {@link data}. */
    protected prevElement: T | null;

    /** Track object returned by nextElement upon end of stream. */
    private eof: T | null = null;

    /** Tracks how deep mark() calls are nested. */
    private markDepth = 0;

    public reset(): void {
        this.p = 0;
        this.data = [];
        this.currentElementIndex = 0;
        this.p = 0;
        this.prevElement = null;
    }

    /**
     * @returns the first element in the queue.
     */
    public remove(): T {
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

    /** Make sure we have at least one element to remove, even if EOF. */
    public consume(): void {
        this.syncAhead(1);
        this.remove();
        this.currentElementIndex++;
    }

    public lookAhead(k: number): T | null {
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

    /**
     * Seek to a 0-indexed absolute token index. Normally used to seek backwards in the buffer. Does not force
     * loading of nodes.
     *
     * To preserve backward compatibility, this method allows seeking past the end of the currently buffered data.
     * In this case, the input pointer will be moved but the data will only actually be loaded upon the next call to
     * {@link consume} or {@link lookAhead} for `k > 0`.
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

    private lookBack(k: number): T | null {
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
    private elementAt(i: number): T {
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

    /**
     * Implement nextElement to supply a stream of elements to this lookahead buffer. Return EOF upon end of the
     * stream we're pulling from.
     *
     * @see isEOF
     */
    protected abstract nextElement(): T;

    protected abstract isEOF(o: T): boolean;

}
