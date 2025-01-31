/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { Utils } from "../src/misc/Utils.js";

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
