/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { CommonTree } from "./CommonTree.js";

/** When using %label:TOKENNAME in a tree for parse(), we must track the label. */
export class TreePattern extends CommonTree {
    public label: string;
    public hasTextArg: boolean;

    public declare startIndex: number;
    public declare stopIndex: number;
    public declare node: CommonTree;

    public constructor(payload?: Token) {
        super(payload);
    }

    public override toString(): string {
        return "%" + this.label + ":" + super.toString();
    }
};
