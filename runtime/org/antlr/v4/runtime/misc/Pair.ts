/* java2ts: keep */

/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { java, S, JavaObject, MurmurHash } from "jree";
import { ObjectEqualityComparator } from "./ObjectEqualityComparator";

export class Pair<A, B> extends JavaObject implements java.io.Serializable {
    public readonly a: A | null;
    public readonly b: B | null;

    public constructor(a: A | null, b: B | null) {
        super();
        this.a = a;
        this.b = b;
    }

    public equals = (other: unknown): boolean => {
        if (other === this) {
            return true;
        }

        if (!(other instanceof Pair<A, B>)) {
            return false;
        }

        return ObjectEqualityComparator.INSTANCE.equals(this.a, other.a)
            && ObjectEqualityComparator.INSTANCE.equals(this.b, other.b);
    };

    public hashCode = (): number => {
        let hash: number = MurmurHash.initialize();
        hash = MurmurHash.update(hash, this.a);
        hash = MurmurHash.update(hash, this.b);

        return MurmurHash.finish(hash, 2);
    };

    public toString = (): java.lang.String => {
        return java.lang.String.format(S`(%s, %s)`, this.a, this.b);
    };
}
