/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import type { CommonTree } from "./CommonTree.js";
import { CommonTreeAdaptor } from "./CommonTreeAdaptor.js";
import { TreePattern } from "./TreePattern.js";

/** This adaptor creates TreePattern objects for use during scan(). */
export class TreePatternTreeAdaptor extends CommonTreeAdaptor {
    public override create(payload?: Token): CommonTree;
    public override create(tokenType: number, text: string): CommonTree;
    public override create(tokenType: number, fromToken: Token, text?: string): CommonTree;
    public override create(...args: unknown[]): CommonTree {
        if (args.length < 2) {
            return new TreePattern(args[0] as Token | undefined);
        }

        return super.create.apply(this, args) as CommonTree;
    }
};
