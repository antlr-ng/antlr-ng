/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Character } from "../support/Character.js";

export class Utils {
    public static stripFileExtension(name: string): string {
        const lastDot = name.lastIndexOf(".");
        if (lastDot < 0) {
            return name;
        }

        return name.substring(0, lastDot);
    }

    public static sortLinesInString(s: string): string {
        const lines = s.split("\n");
        lines.sort();

        return lines.join("\n") + "\n";
    }

    public static capitalize(s: string): string {
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    public static decapitalize(s: string): string {
        return Character.toLowerCase(s.charAt(0)) + s.substring(1);
    }

    public static setSize(list: unknown[], size: number): void {
        const oldLength = list.length;
        list.length = size;
        if (oldLength < size) {
            list.fill(null, oldLength, size);
        }
    }

    /**
     * Type guard for accessing a member in an object without an index signature.
     *
     * @param obj The object to check.
     * @param key The key to check.
     *
     * @returns True if the key is a member of the object.
     */
    public static hasKey = <T extends object>(obj: T, key: PropertyKey): key is keyof T => {
        return key in obj;
    };
}
