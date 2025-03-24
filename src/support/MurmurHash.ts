/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

const c1 = 0xCC9E2D51;
const c2 = 0x1B873593;
const r1 = 15;
const r2 = 13;
const m = 5;
const n = 0xE6546B64;

/**
 * A stripped down MurmurHash 3 implementation for hashing values. This is used to compute hash codes for objects
 * that are used in sets and maps with object identity semantics.
 */
export class MurmurHash {

    private static readonly defaultSeed = 701;

    private constructor() { /**/ }

    /**
     * Initialize the hash using the specified `seed`.
     *
     * @param seed the seed
     *
     * @returns the intermediate hash value
     */
    public static initialize(seed = MurmurHash.defaultSeed): number {
        return seed;
    }

    /**
     * Update the intermediate hash value for the next input `value`.
     *
     * @param hash The intermediate hash value.
     * @param value the value to add to the current hash.
     *
     * @returns the updated intermediate hash value
     */
    public static update(hash: number, value: string): number {
        let actualValue = this.hashString(hash, value);

        actualValue = Math.imul(actualValue, c1);
        actualValue = (actualValue << r1) | (actualValue >>> (32 - r1));
        actualValue = Math.imul(actualValue, c2);

        hash = hash ^ actualValue;
        hash = (hash << r2) | (hash >>> (32 - r2));
        hash = Math.imul(hash, m) + n;

        return hash;
    }

    /**
     * Apply the final computation steps to the intermediate value `hash` to form the final result of the
     * MurmurHash 3 hash function.
     *
     * @param hash The intermediate hash value.
     * @param entryCount The number of (32 bit) values added to the hash.
     *
     * @returns the final hash result
     */
    public static finish = (hash: number, entryCount: number): number => {
        hash ^= entryCount * 4;
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x85EBCA6B);
        hash ^= hash >>> 13;
        hash = Math.imul(hash, 0xC2B2AE35);
        hash ^= hash >>> 16;

        return hash;
    };

    /**
     * An all-in-one convenience method to compute a hash for a single value.
     *
     * @param value The value to hash.
     * @param seed The seed for the hash value.
     *
     * @returns The computed hash.
     */
    public static hashCode = (value: string, seed?: number): number => {
        return MurmurHash.finish(MurmurHash.update(seed ?? MurmurHash.defaultSeed, value), 1);
    };

    /**
     * Function to hash a string. Based on the implementation found here:
     * https://stackoverflow.com/a/52171480/1137174
     *
     * @param hash The intermediate hash value.
     * @param str The string to hash.
     *
     * @returns The computed hash.
     */
    private static hashString(hash = 0, str: string): number {
        let h1 = 0xdeadbeef ^ hash;
        let h2 = 0x41c6ce57 ^ hash;
        for (const c of str) { // Correctly iterate over surrogate pairs.
            const ch = c.charCodeAt(0);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

        return Math.imul(4294967296, (2097151 & h2)) + (h1 >>> 0);
    }
}
