/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/** Count how many of each key we have */
export class FrequencySet<T> extends Map<T, number> {
    public count(key: T): number {
        const value = this.get(key);
        if (value === undefined) {
            return 0;
        }

        return value;
    }

    public add(key: T): void {
        const value = this.get(key) ?? 0;
        this.set(key, value + 1);
    }
}
