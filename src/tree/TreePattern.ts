/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonTree } from "./CommonTree.js";

/** When using %label:TOKENNAME in a tree for parse(), we must track the label. */
export class TreePattern extends CommonTree {
    public label: string;
    public hasTextArg: boolean;

};
