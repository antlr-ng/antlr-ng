/* java2ts: keep */

/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/**
 * This interface provides an abstract concept of object equality independent of
 * {@link Object#equals} (object equality) and the {@code ==} operator
 * (reference equality). It can be used to provide algorithm-specific unordered
 * comparisons without requiring changes to the object itself.
 *
 * @author Sam Harwell
 */
export interface EqualityComparator<T> {

    /**
     * This method returns a hash code for the specified object.
     *
     * @param obj The object.
     * @returns The hash code for {@code obj}.
     */
    hashCode: (obj: T) => number;

    /**
     * This method tests if two objects are equal.
     *
     * @param a The first object to compare.
     * @param b The second object to compare.
     *
     * @returns True if `a` equals `b`, otherwise false.
     */
    equals: (a: T, b: T) => boolean;

}
