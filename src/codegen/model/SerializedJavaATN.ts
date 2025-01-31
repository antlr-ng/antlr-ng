/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { ATN, ATNSerializer } from "antlr4ng";

import { OutputModelFactory } from "../OutputModelFactory.js";
import { SerializedATN } from "./SerializedATN.js";

/** A serialized ATN for the java target, which requires we use strings and 16-bit unicode values. */
export class SerializedJavaATN extends SerializedATN {
    private readonly serializedAsString: string[];
    private readonly segments: string[][];

    public constructor(factory: OutputModelFactory, atn: ATN) {
        super(factory);
        let data = ATNSerializer.getSerialized(atn);
        data = this.encodeIntsWith16BitWords(data);

        const size = data.length;
        const target = factory.getGenerator()!.getTarget();
        const segmentLimit = target.getSerializedATNSegmentLimit();
        this.segments = new Array<string[]>(Math.trunc((size + segmentLimit - 1) / segmentLimit));
        let segmentIndex = 0;

        for (let i = 0; i < size; i += segmentLimit) {
            const segmentSize = Math.min(i + segmentLimit, size) - i;
            const segment = new Array<string>(segmentSize);
            this.segments[segmentIndex++] = segment;
            for (let j = 0; j < segmentSize; j++) {
                segment[j] = target.encodeInt16AsCharEscape(data[i + j]);
            }
        }

        this.serializedAsString = this.segments[0]; // serializedAsString is valid if only one segment
    }

    public override getSerialized(): object {
        return this.serializedAsString;
    }

    public getSegments(): string[][] {
        return this.segments;
    }

    /**
     * Given a list of integers representing a serialized ATN, encode values too large to fit into 15 bits
     * as two 16-bit values. We use the high bit (0x8000_0000) to indicate values requiring two 16-bit words.
     * If the high bit is set, we grab the next value and combine them to get a 31-bit value. The possible
     * input int values are [-1,0x7FFF_FFFF].
     *
     *      | compression/encoding                         | uint16 count | type            |
     *      | -------------------------------------------- | ------------ | --------------- |
     *      | 0xxxxxxx xxxxxxxx                            | 1            | uint (15 bit)   |
     *      | 1xxxxxxx xxxxxxxx yyyyyyyy yyyyyyyy          | 2            | uint (16+ bits) |
     *      | 11111111 11111111 11111111 11111111          | 2            | int value -1    |
     *
     * This is only used (other than for testing) by {@link org.antlr.v4.codegen.model.SerializedJavaATN}
     * to encode ints as char values for the java target, but it is convenient to combine it with the
     * #decodeIntsEncodedAs16BitWords that follows as they are a pair (I did not want to introduce a new class
     * into the runtime). Used only for Java Target.
     */
    private encodeIntsWith16BitWords(data: number[]): number[] {
        const data16 = new Array<number>(Math.ceil(data.length * 1.5));
        let index = 0;

        for (let i = 0; i < data.length; i++) {
            let v = data[i];
            if (v === -1) {
                // Use two max uint16 for -1.
                data16[index++] = 0xFFFF;
                data16[index++] = 0xFFFF;
            } else if (v <= 0x7FFF) {
                data16[index++] = v;
            } else { // v > 0x7FFF
                if (v >= 0x7FFF_FFFF) {
                    // Too big to fit in 15 bits + 16 bits? (+1 would be 8000_0000 which is bad encoding).
                    throw new Error(`Serialized ATN data element[${i}] = ${v} doesn't fit in 31 bits`);
                }

                // Strip high bit (sentinel) if set.
                v = v & 0x7FFF_FFFF;

                // Store high 15-bit word first and set high bit to say word follows.
                data16[index++] = (v >> 16) | 0x8000;

                // Then store lower 16-bit word.
                data16[index++] = (v & 0xFFFF);
            }
        }

        // Return the filled portion of the array.
        return data16.slice(0, index);
    }
}
