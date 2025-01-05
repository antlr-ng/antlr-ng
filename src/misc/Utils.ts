/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CommonToken, Token } from "antlr4ng";

import { Character } from "../support/Character.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const InvalidToken = CommonToken.fromType(Token.INVALID_TYPE);

export type Constructor<T> = new (...args: unknown[]) => T;

export class Utils {
    public static readonly INTEGER_POOL_MAX_VALUE = 1000;

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

    /**
     * apply methodName to list and return list of results. method has
     *  no args.  This pulls data out of a list essentially.
     */
    public static select<From, To>(list: From[], selector: Utils.Func1<From, To>): To[] {
        const b = new Array<To>();
        for (const f of list) {
            b.push(selector.exec(f));
        }

        return b;
    }

    /** Find exact object type or subclass of cl in list */
    public static find<T>(ops: unknown[], cl: Constructor<T>): T | null {
        for (const o of ops) {
            if (o instanceof cl) {
                return o;
            }
        }

        return null;
    }

    public static indexOf<T>(elements: T[], filter: Utils.Filter<T>): number {
        for (let i = 0; i < elements.length; i++) {
            if (filter.select(elements[i])) {
                return i;
            }
        }

        return -1;
    }

    public static lastIndexOf<T>(elements: T[], filter: Utils.Filter<T>): number {
        for (let i = elements.length - 1; i >= 0; i--) {
            if (filter.select(elements[i])) {
                return i;
            }
        }

        return -1;
    }

    public static setSize(list: unknown[], size: number): void {
        const fills = size - list.length;
        if (fills < 0) {
            list.length = size;
        } else {
            for (let i = 0; i < fills; i++) {
                list.push(null);
            }
        }
    }

    /** Type guard for accessing a member in an object without an index signature. */
    public static hasKey = <T extends object>(obj: T, key: PropertyKey): key is keyof T => {
        return key in obj;
    };
}

export namespace Utils {
    export interface Filter<T> {
        select(t: T): boolean;
    }

    export interface Func0<TResult> {
        exec(): TResult;
    }

    export interface Func1<T1, TResult> {
        exec(arg1: T1): TResult;
    }

}
