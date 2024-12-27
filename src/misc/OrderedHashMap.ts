/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

export class OrderedHashMap<K, V> extends Map<K, V> {
    /** Track the elements as they are added to the set */
    private elements: K[] = [];

    public getKey(i: number): K {
        return this.elements[i];
    }

    public getElement(i: number): V | undefined {
        return super.get(this.elements[i]);
    }

    public override set(key: K, value: V): this {
        this.elements.push(key);

        return super.set(key, value);
    }
}
