/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { IntervalSet, Token } from "antlr4ng";

// TODO: this is a pure runtime test. It should be moved to the target runtime tests.

describe("TestIntervalSet", () => {
    it("testSingleElement", () => {
        const s = IntervalSet.of(99, 99);
        const expecting = "99";
        expect(s.toString(), expecting);
    });

    it("testIsolatedElements", () => {
        const s = new IntervalSet();
        s.addOne(1);
        s.addOne("z".codePointAt(0)!);
        s.addOne("\uFFF0".codePointAt(0)!);
        const expecting = "{1, 122, 65520}";
        expect(s.toString()).toBe(expecting);
    });

    it("testMixedRangesAndElements", () => {
        const s = new IntervalSet();
        s.addOne(1);
        s.addRange("a".codePointAt(0)!, "z".codePointAt(0)!);
        s.addRange("0".codePointAt(0)!, "9".codePointAt(0)!);
        const expecting = "{1, 48..57, 97..122}";
        expect(s.toString()).toBe(expecting);
    });

    it("testSimpleAnd", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(13, 15);
        const expecting = "{13..15}";
        const result = (s.and(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testRangeAndIsolatedElement", () => {
        const s = IntervalSet.of("a".codePointAt(0)!, "z".codePointAt(0)!);
        const s2 = IntervalSet.of("d".codePointAt(0)!, "d".codePointAt(0)!);
        const expecting = "100";
        const result = (s.and(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testEmptyIntersection", () => {
        const s = IntervalSet.of("a".codePointAt(0)!, "z".codePointAt(0)!);
        const s2 = IntervalSet.of("0".codePointAt(0)!, "9".codePointAt(0)!);
        const expecting = "{}";
        const result = (s.and(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testEmptyIntersectionSingleElements", () => {
        const s = IntervalSet.of("a".codePointAt(0)!, "a".codePointAt(0)!);
        const s2 = IntervalSet.of("d".codePointAt(0)!, "d".codePointAt(0)!);
        const expecting = "{}";
        const result = (s.and(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testNotSingleElement", () => {
        const vocabulary = IntervalSet.of(1, 1000);
        vocabulary.addRange(2000, 3000);
        const s = IntervalSet.of(50, 50);
        const expecting = "{1..49, 51..1000, 2000..3000}";
        const result = (s.complementWithVocabulary(vocabulary)).toString();
        expect(result).toBe(expecting);
    });

    it("testNotSet", () => {
        const vocabulary = IntervalSet.of(1, 1000);
        const s = IntervalSet.of(50, 60);
        s.addOne(5);
        s.addRange(250, 300);
        const expecting = "{1..4, 6..49, 61..249, 301..1000}";
        const result = (s.complementWithVocabulary(vocabulary)).toString();
        expect(result).toBe(expecting);
    });

    it("testNotEqualSet", () => {
        const vocabulary = IntervalSet.of(1, 1000);
        const s = IntervalSet.of(1, 1000);
        const expecting = "{}";
        const result = (s.complementWithVocabulary(vocabulary)).toString();
        expect(result).toBe(expecting);
    });

    it("testNotSetEdgeElement", () => {
        const vocabulary = IntervalSet.of(1, 2);
        const s = IntervalSet.of(1, 1);
        const expecting = "2";
        const result = (s.complementWithVocabulary(vocabulary)).toString();
        expect(result).toBe(expecting);
    });

    it("testNotSetFragmentedVocabulary", () => {
        const vocabulary = IntervalSet.of(1, 255);
        vocabulary.addRange(1000, 2000);
        vocabulary.addOne(9999);
        const s = IntervalSet.of(50, 60);
        s.addOne(3);
        s.addRange(250, 300);
        s.addOne(10000); // this is outside range of vocab and should be ignored
        const expecting = "{1..2, 4..49, 61..249, 1000..2000, 9999}";
        const result = (s.complementWithVocabulary(vocabulary)).toString();
        expect(result).toBe(expecting);
    });

    it("testSubtractOfCompletelyContainedRange", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(12, 15);
        const expecting = "{10..11, 16..20}";
        const result = (s.subtract(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testSubtractFromSetWithEOF", () => {
        const s = IntervalSet.of(10, 20);
        s.addOne(Token.EOF);
        const s2 = IntervalSet.of(12, 15);
        const expecting = "{<EOF>, 10..11, 16..20}";
        const result = (s.subtract(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testSubtractOfOverlappingRangeFromLeft", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(5, 11);
        let expecting = "{12..20}";
        let result = (s.subtract(s2)).toString();
        expect(result).toBe(expecting);

        const s3 = IntervalSet.of(5, 10);
        expecting = "{11..20}";
        result = (s.subtract(s3)).toString();
        expect(result).toBe(expecting);
    });

    it("testSubtractOfOverlappingRangeFromRight", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(15, 25);
        let expecting = "{10..14}";
        let result = (s.subtract(s2)).toString();
        expect(result).toBe(expecting);

        const s3 = IntervalSet.of(20, 25);
        expecting = "{10..19}";
        result = (s.subtract(s3)).toString();
        expect(result).toBe(expecting);
    });

    it("testSubtractOfCompletelyCoveredRange", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(1, 25);
        const expecting = "{}";
        const result = (s.subtract(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testSubtractOfRangeSpanningMultipleRanges", () => {
        const s = IntervalSet.of(10, 20);
        s.addRange(30, 40);
        s.addRange(50, 60); // s has 3 ranges now: 10..20, 30..40, 50..60
        const s2 = IntervalSet.of(5, 55); // covers one and touches 2nd range
        let expecting = "{56..60}";
        let result = (s.subtract(s2)).toString();
        expect(result).toBe(expecting);

        const s3 = IntervalSet.of(15, 55); // touches both
        expecting = "{10..14, 56..60}";
        result = (s.subtract(s3)).toString();
        expect(result).toBe(expecting);
    });

    /**
           The following was broken:
          {0..113, 115..65534}-{0..115, 117..65534}=116..65534
     */
    it("testSubtractOfWackyRange", () => {
        const s = IntervalSet.of(0, 113);
        s.addRange(115, 200);
        const s2 = IntervalSet.of(0, 115);
        s2.addRange(117, 200);
        const expecting = "116";
        const result = (s.subtract(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testSimpleEquals", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(10, 20);
        expect(s).toEqual(s2);

        const s3 = IntervalSet.of(15, 55);
        expect(s).not.toBe(s3);
    });

    it("testEquals", () => {
        const s = IntervalSet.of(10, 20);
        s.addOne(2);
        s.addRange(499, 501);
        const s2 = IntervalSet.of(10, 20);
        s2.addOne(2);
        s2.addRange(499, 501);
        expect(s).toEqual(s2);

        const s3 = IntervalSet.of(10, 20);
        s3.addOne(2);
        expect(s).not.toBe(s3);
    });

    it("testSingleElementMinusDisjointSet", () => {
        const s = IntervalSet.of(15, 15);
        const s2 = IntervalSet.of(1, 5);
        s2.addRange(10, 20);
        const expecting = "{}"; // 15 - {1..5, 10..20} = {}
        const result = s.subtract(s2).toString();
        expect(result).toBe(expecting);
    });

    it("testMembership", () => {
        const s = IntervalSet.of(15, 15);
        s.addRange(50, 60);
        expect(!s.contains(0)).toBe(true);
        expect(!s.contains(20)).toBe(true);
        expect(!s.contains(100)).toBe(true);
        expect(s.contains(15)).toBe(true);
        expect(s.contains(55)).toBe(true);
        expect(s.contains(50)).toBe(true);
        expect(s.contains(60)).toBe(true);
    });

    // {2,15,18} & 10..20
    it("testIntersectionWithTwoContainedElements", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(2, 2);
        s2.addOne(15);
        s2.addOne(18);
        const expecting = "{15, 18}";
        const result = (s.and(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testIntersectionWithTwoContainedElementsReversed", () => {
        const s = IntervalSet.of(10, 20);
        const s2 = IntervalSet.of(2, 2);
        s2.addOne(15);
        s2.addOne(18);
        const expecting = "{15, 18}";
        const result = (s2.and(s)).toString();
        expect(result).toBe(expecting);
    });

    it("testComplement", () => {
        const s = IntervalSet.of(100, 100);
        s.addRange(101, 101);
        const s2 = IntervalSet.of(100, 102);
        const expecting = "102";
        const result = (s.complementWithVocabulary(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testComplement2", () => {
        const s = IntervalSet.of(100, 101);
        const s2 = IntervalSet.of(100, 102);
        const expecting = "102";
        const result = (s.complementWithVocabulary(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testComplement3", () => {
        const s = IntervalSet.of(1, 96);
        s.addRange(99, 0x10FFFF);
        const expecting = "{97..98}";
        const result = (s.complement(1, 0x10FFFF)).toString();
        expect(result).toBe(expecting);
    });

    it("testMergeOfRangesAndSingleValues", () => {
        // {0..41, 42, 43..65534}
        const s = IntervalSet.of(0, 41);
        s.addOne(42);
        s.addRange(43, 65534);
        const expecting = "{0..65534}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    it("testMergeOfRangesAndSingleValuesReverse", () => {
        const s = IntervalSet.of(43, 65534);
        s.addOne(42);
        s.addRange(0, 41);
        const expecting = "{0..65534}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    it("testMergeWhereAdditionMergesTwoExistingIntervals", () => {
        // 42, 10, {0..9, 11..41, 43..65534}
        const s = IntervalSet.of(42, 42);
        s.addOne(10);
        s.addRange(0, 9);
        s.addRange(43, 65534);
        s.addRange(11, 41);
        const expecting = "{0..65534}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    /**
     * This case is responsible for antlr/antlr4#153.
     * https://github.com/antlr/antlr4/issues/153
     */
    it("testMergeWhereAdditionMergesThreeExistingIntervals", () => {
        const s = new IntervalSet();
        s.addOne(0);
        s.addOne(3);
        s.addOne(5);
        s.addRange(0, 7);
        const expecting = "{0..7}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    it("testMergeWithDoubleOverlap", () => {
        const s = IntervalSet.of(1, 10);
        s.addRange(20, 30);
        s.addRange(5, 25); // overlaps two!
        const expecting = "{1..30}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    it("testSize", () => {
        const s = IntervalSet.of(20, 30);
        s.addRange(50, 55);
        s.addRange(5, 19);
        expect(s.length).toBe(32);
    });

    it("testToArray", () => {
        const s = IntervalSet.of(20, 25);
        s.addRange(50, 55);
        s.addRange(5, 5);
        const expecting = "5,20,21,22,23,24,25,50,51,52,53,54,55";
        expect(s.toArray().toString()).toBe(expecting);
    });

    /**
         The following was broken:
        {'\u0000'..'s', 'u'..'\uFFFE'} & {'\u0000'..'q', 's'..'\uFFFE'}=
        {'\u0000'..'q', 's'}!!!! broken...
          'q' is 113 ascii
          'u' is 117
     */
    it("testNotRIntersectionNotT", () => {
        const s = IntervalSet.of(0, "s".codePointAt(0)!);
        s.addRange("u".codePointAt(0)!, 200);
        const s2 = IntervalSet.of(0, "q".codePointAt(0)!);
        s2.addRange("s".codePointAt(0)!, 200);
        const expecting = "{0..113, 115, 117..200}";
        const result = (s.and(s2)).toString();
        expect(result).toBe(expecting);
    });

    it("testRmSingleElement", () => {
        const s = IntervalSet.of(1, 10);
        s.addRange(-3, -3);
        s.removeOne(-3);
        const expecting = "{1..10}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    it("testRmLeftSide", () => {
        const s = IntervalSet.of(1, 10);
        s.addRange(-3, -3);
        s.removeOne(1);
        const expecting = "{-3, 2..10}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    it("testRmRightSide", () => {
        const s = IntervalSet.of(1, 10);
        s.addRange(-3, -3);
        s.removeOne(10);
        const expecting = "{-3, 1..9}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });

    it("testRmMiddleRange", () => {
        const s = IntervalSet.of(1, 10);
        s.addRange(-3, -3);
        s.removeOne(5);
        const expecting = "{-3, 1..4, 6..10}";
        const result = s.toString();
        expect(result).toBe(expecting);
    });
});
