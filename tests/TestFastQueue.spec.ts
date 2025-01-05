/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { FastQueue } from "../src/antlr3/misc/FastQueue.js";

describe("TestFastQueue", () => {
    it("testQueueNoRemove", () => {
        const q = new FastQueue<string>();
        q.add("a");
        q.add("b");
        q.add("c");
        q.add("d");
        q.add("e");
        const expecting = "a b c d e";
        const found = q.toString();
        expect(found).toBe(expecting);
    });

    it("testQueueThenRemoveAll", () => {
        const q = new FastQueue<string>();
        q.add("a");
        q.add("b");
        q.add("c");
        q.add("d");
        q.add("e");

        let buf = "";
        while (q.size > 0) {
            const o = q.remove();
            buf += o;
            if (q.size > 0) {
                buf += " ";
            }
        }

        expect(q.size, "queue should be empty").toBe(0);

        const expecting = "a b c d e";
        const found = buf.toString();
        expect(found).toBe(expecting);
    });

    it("testQueueThenRemoveOneByOne", () => {
        let buf = "";
        const q = new FastQueue<string>();
        q.add("a");
        buf += q.remove();
        q.add("b");
        buf += q.remove();
        q.add("c");
        buf += q.remove();
        q.add("d");
        buf += q.remove();
        q.add("e");
        buf += q.remove();
        expect(q.size, "queue should be empty").toBe(0);

        const expecting = "abcde";
        const found = buf.toString();
        expect(found).toBe(expecting);
    });

    // E r r o r s

    it("testGetFromEmptyQueue", () => {
        const q = new FastQueue<string>();

        expect(() => {
            q.remove();
        }).toThrowError("queue index 0 > last index -1");
    });

    it("testGetFromEmptyQueueAfterSomeAdds", () => {
        const q = new FastQueue<string>();
        q.add("a");
        q.add("b");
        q.remove();
        q.remove();

        expect(() => {
            q.remove();
        }).toThrowError("queue index 0 > last index -1");
    });

    it("testGetFromEmptyQueueAfterClear", () => {
        const q = new FastQueue<string>();
        q.add("a");
        q.add("b");
        q.clear();

        expect(() => {
            q.remove();
        }).toThrowError("queue index 0 > last index -1");
    });
});
