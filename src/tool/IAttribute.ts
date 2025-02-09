/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { AttributeDict } from "./AttributeDict.js";

/** Track the names of attributes defined in arg lists, return values,scope blocks etc... */
export interface IAttribute {
    /** The entire declaration such as "String foo" or "x:int" */
    decl?: string;

    /** The type; might be empty such as for Python which has no static typing */
    type?: string;

    /** The name of the attribute "foo" */
    name: string;

    /** A {@link Token} giving the position of the name of this attribute in the grammar. */
    token?: Token;

    /** The optional attribute initialization expression */
    initValue?: string;

    /** Who contains us? */
    dict?: AttributeDict;
}

export namespace IAttribute {
    export const toString = (attribute: IAttribute): string => {
        if (attribute.initValue !== undefined) {
            return attribute.name + ":" + attribute.type + "=" + attribute.initValue;
        }

        if (attribute.type !== undefined) {
            return attribute.name + ":" + attribute.type;
        }

        return attribute.name;
    };

}
