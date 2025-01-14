/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { CommonTree } from "../../tree/CommonTree.js";

/**
 * This is identical to the {@link ParserRuleReturnScope} except that
 * the start property is a tree nodes not {@link Token} object
 * when you are parsing trees.
 */
export class TreeRuleReturnScope {
    /** First node or root node of tree matched for this rule. */
    public start: CommonTree | null = null;
    //public stop: CommonTree | null = null;
    public tree: CommonTree | null = null;
}
