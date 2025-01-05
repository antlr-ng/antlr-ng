/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

import { FastQueue } from "./FastQueue.js";

/**
 * A lookahead queue that knows how to mark/release locations in the buffer for
 * backtracking purposes. Any markers force the {@link FastQueue} superclass to
 * keep all elements until no more markers; then can reset to avoid growing a
 * huge buffer.
 */
export abstract class LookaheadStream<T> extends FastQueue<T> {
    public static readonly UNINITIALIZED_EOF_ELEMENT_INDEX = Number.MAX_VALUE;

    /**
     * Track object returned by nextElement upon end of stream;
     *  Return it later when they ask for LT passed end of input.
     */
    public eof: T | null = null;

    /**
     * Absolute token index. It's the index of the symbol about to be
     *  read via {@code LT(1)}. Goes from 0 to numtokens.
     */
    protected currentElementIndex = 0;

    /**
     * This is the {@code LT(-1)} element for the first element in {@link #data}.
     */
    protected prevElement: T | null;

    /** Track the last mark() call result value for use in rewind(). */
    protected lastMarker: number;

    /** tracks how deep mark() calls are nested */
    protected markDepth = 0;

    public override reset(): void {
        super.reset();
        this.currentElementIndex = 0;
        this.p = 0;
        this.prevElement = null;
    }

    /**
     * Get and remove first element in queue; override
     * {@link FastQueue#remove()}; it's the same, just checks for backtracking.
     */
    public override remove(): T {
        const o = this.elementAt(0);
        this.p++;

        // have we hit end of buffer and not backtracking?
        if (this.p === this.data.length && this.markDepth === 0) {
            this.prevElement = o;
            // if so, it's an opportunity to start filling at index 0 again
            this.clear(); // size goes to 0, but retains memory
        }

        return o;
    }

    /** Make sure we have at least one element to remove, even if EOF */
    public consume(): void {
        this.syncAhead(1);
        this.remove();
        this.currentElementIndex++;
    }

    /** add n elements to buffer */
    public fill(n: number): void {
        for (let i = 1; i <= n; i++) {
            const o = this.nextElement();
            if (this.isEOF(o)) {
                this.eof = o;
            }

            this.data.push(o);
        }
    }

    /** Size of entire stream is unknown; we only know buffer size from FastQueue. */
    public override get size(): number {
        throw new Error("streams are of unknown size");
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public LT(k: number): T | null {
        if (k === 0) {
            return null;
        }

        if (k < 0) {
            return this.LB(-k);
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
        this.markDepth++;
        this.lastMarker = this.p; // track where we are in buffer not absolute token index

        return this.lastMarker;
    }

    public release(marker: number): void {
        // no resources to release
    }

    public rewind(marker?: number): void {
        if (marker === undefined) {
            // rewind but do not release marker
            const delta = this.p - this.lastMarker;
            this.currentElementIndex -= delta;
            this.p = this.lastMarker;
        } else {
            this.markDepth--;
            const delta = this.p - marker;
            this.currentElementIndex -= delta;
            this.p = marker;
        }
    }

    /**
     * Seek to a 0-indexed absolute token index. Normally used to seek backwards
     * in the buffer. Does not force loading of nodes.
     * <p>
     * To preserve backward compatibility, this method allows seeking past the
     * end of the currently buffered data. In this case, the input pointer will
     * be moved but the data will only actually be loaded upon the next call to
     * {@link #consume} or {@link #LT} for {@code k>0}.</p>
     *
     * @throws IllegalArgumentException if {@code index} is less than 0
     * @throws UnsupportedOperationException if {@code index} lies before the
     * beginning of the moving window buffer
     * ({@code index < }{@link #currentElementIndex currentElementIndex}<code> - </code>{@link #p p}).
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

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected LB(k: number): T | null {
        /* assert k > 0; */

        const index = this.p - k;
        if (index === -1) {
            return this.prevElement;
        }

        // if k>0 then we know index < data.size(). avoid the double-check for
        // performance.
        if (index >= 0 /*&& index < data.size()*/) {
            return this.data[index];
        }

        if (index < -1) {
            throw new Error("can't look more than one token before the beginning of this stream's buffer");
        }

        throw new Error("can't look past the end of this stream's buffer using LB(int)");
    }

    /**
     * Make sure we have 'need' elements from current position p. Last valid
     *  p index is data.size()-1.  p+need-1 is the data index 'need' elements
     *  ahead.  If we need 1 element, (p+1-1)==p must be &lt; data.size().
     */
    protected syncAhead(need: number): void {
        const n = (this.p + need - 1) - this.data.length + 1; // how many more elements we need?
        if (n > 0) {
            this.fill(n);
        }
        // out of elements?
    }

    /**
     * Implement nextElement to supply a stream of elements to this
     *  lookahead buffer.  Return EOF upon end of the stream we're pulling from.
     *
     * @see #isEOF
     */
    public abstract nextElement(): T;

    public abstract isEOF(o: T): boolean;

}
