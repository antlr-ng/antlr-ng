/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { Utils } from "../src/misc/Utils.js";
import { Interval } from "antlr4ng";

describe("TestUtils", () => {
    it("testStripFileExtension", () => {
        expect(Utils.stripFileExtension("foo")).toBe("foo");
        expect(Utils.stripFileExtension("foo.txt")).toBe("foo");
    });

    it("testSortLinesInString", () => {
        expect(Utils.sortLinesInString("foo\nbar\nbaz")).toBe("bar\nbaz\nfoo\n");
    });

    it("testCapitalize", () => {
        expect(Utils.capitalize("foo")).toBe("Foo");
    });

    it("testDecapitalize", () => {
        expect(Utils.decapitalize("FOO")).toBe("fOO");
    });

    it("testSelect", () => {
        const strings: string[] = [];
        strings.push("foo");
        strings.push("bar");

        const func1 = new class implements Utils.Func1<string, string> {
            public exec(arg1: string): string {
                return "baz";
            }
        }();

        const retval: string[] = [];
        retval.push("baz");
        retval.push("baz");

        expect(Utils.select(strings, func1)).toEqual(retval);
    });

    it("testFind", () => {
        const intervals: Interval[] = [];
        intervals.push(Interval.of(1, 2));
        intervals.push(Interval.of(3, 4));
        expect(Utils.find(intervals, Interval)).toEqual(expect.objectContaining({ start: 1, stop: 2 }));

        expect(Utils.find([], String)).toBeNull();
    });

    it("testIndexOf", () => {
        const strings: string[] = [];
        strings.push("foo");
        strings.push("bar");
        const filter = new class implements Utils.Filter<string> {
            public select(o: string): boolean {
                return true;
            }
        }();
        expect(Utils.indexOf(strings, filter)).toBe(0);
    });

    it("testLastIndexOf", () => {
        const strings: string[] = [];
        strings.push("foo");
        strings.push("bar");
        const filter = new class implements Utils.Filter<string> {
            public select(o: string): boolean {
                return true;
            }
        }();
        expect(Utils.lastIndexOf(strings, filter)).toBe(1);
    });

    it("testSetSize", () => {
        const strings: string[] = [];
        strings.push("foo");
        strings.push("bar");
        strings.push("baz");

        Utils.setSize(strings, 2);
        expect(strings.length).toBe(2);

        Utils.setSize(strings, 4);
        expect(strings.length).toBe(4);
    });
});
