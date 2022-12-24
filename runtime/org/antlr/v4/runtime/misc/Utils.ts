/* java2ts: keep */

/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/*
 eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/naming-convention, no-redeclare,
 max-classes-per-file, jsdoc/check-tag-names, @typescript-eslint/no-empty-function,
 @typescript-eslint/restrict-plus-operands, @typescript-eslint/unified-signatures, @typescript-eslint/member-ordering,
 no-underscore-dangle, max-len
*/

/* cspell: disable */

/* eslint-disable jsdoc/require-returns */

import * as fs from "fs";

import { java } from "../../../../../../lib/java/java";
import { S } from "../../../../../../lib/templates";

import { BitSet } from "../support";
import { IntegerList } from "./IntegerList";
import { IntervalSet } from "./IntervalSet";

export class Utils {
    public static escapeWhitespace = (input: java.lang.String, escapeSpaces: boolean): java.lang.String => {
        const buf = new java.lang.StringBuilder();
        const s = input.valueOf();
        for (const c of s) {
            if (c === " " && escapeSpaces) {
                buf.append("\u00B7");
            } else {
                if (c === "\t") {
                    buf.append("\\t");
                } else {
                    if (c === "\n") {
                        buf.append("\\n");
                    } else {
                        if (c === "\r") {
                            buf.append("\\r");
                        } else {
                            buf.append(c);
                        }
                    }
                }
            }
        }

        return buf.toString();
    };

    public static writeFile(fileName: java.lang.String, content: java.lang.String, encoding?: BufferEncoding): void {
        fs.writeFileSync(fileName.valueOf(), content.valueOf(), encoding);
    }

    public static readFile(fileName: java.lang.String, encoding?: BufferEncoding): java.lang.String {
        return new java.lang.String(fs.readFileSync(fileName.valueOf(), encoding) as string);
    }

    /**
     * Convert array of strings to string&rarr;index map. Useful for
     *  converting rulenames to name&rarr;ruleindex map.
     *
     * @param keys tbd
     */
    public static toMap = (keys: string[]): java.util.Map<string, number> => {
        const m = new java.util.HashMap<string, number>();
        for (let i = 0; i < keys.length; i++) {
            m.put(keys[i], i);
        }

        return m;
    };

    public static toCharArray = (data: IntegerList): Uint32Array | undefined => {
        if (data === undefined) {
            return undefined;
        }

        return data.toCharArray();
    };

    public static toSet = (bits: BitSet): IntervalSet => {
        const s: IntervalSet = new IntervalSet();
        let i: number = bits.nextSetBit(0);
        while (i >= 0) {
            s.add(i);
            i = bits.nextSetBit(i + 1);
        }

        return s;
    };

    public static expandTabs = (input: java.lang.String, tabSize: number): java.lang.String => {
        const buf = new java.lang.StringBuilder();
        let col = 0;
        const s = input.valueOf();
        for (const c of s) {
            switch (c) {
                case "\n": {
                    col = 0;
                    buf.append(c);
                    break;
                }

                case "\t": {
                    const n: number = tabSize - col % tabSize;
                    col += n;
                    buf.append(Utils.spaces(n));
                    break;
                }

                default: {
                    col++;
                    buf.append(c);
                    break;
                }
            }
        }

        return buf.toString();
    };

    public static spaces = (n: number): java.lang.String => {
        return S`${" ".repeat(n)}`;
    };

    public static newlines = (n: number): java.lang.String => {
        return S`${"\n".repeat(n)}`;
    };

    public static sequence = (n: number, s: java.lang.String): java.lang.String => {
        return S`${s.valueOf().repeat(n)}`;
    };

    public static count = (s: string, x: java.lang.char): number => {
        let n = 0;
        for (const c of s) {
            if (c.codePointAt(0) === x) {
                n++;
            }
        }

        return n;
    };
}
