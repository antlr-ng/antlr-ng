/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
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
