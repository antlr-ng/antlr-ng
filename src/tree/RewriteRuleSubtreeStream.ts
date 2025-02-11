/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { dupTree } from "../support/helpers.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { CommonTree } from "./CommonTree.js";
import { RewriteRuleElementStream } from "./RewriteRuleElementStream.js";

export class RewriteRuleSubtreeStream extends RewriteRuleElementStream {

    /**
     * Treats next element as a single node even if it's a subtree. This is used instead of next() when the result has
     * to be a tree root node. Also prevents us from duplicating recently-added children; e.g., ^(type ID)+ adds ID
     * to type and then 2nd iteration must dup the type node, but ID has been added.
     *
     * Referencing a rule result twice is ok. Dup entire tree as we can't be adding trees as root, e.g., expr expr.
     *
     * Hideous code duplication here with super.next().  Can't think of a proper way to refactor. This needs to always
     * call dup node and super.next() doesn't know which to call: dup node or dup tree.
     *
     * @returns The next node in the stream.
     */
    public nextNode(): GrammarAST {
        const n = this.size();
        if (this.dirty || (this.cursor >= n && n === 1)) {
            // If out of elements and size is 1, dup (at most a single node since this is for making root nodes).
            const el = this.getNext();

            return el.dupNode();
        }

        // Test size above then fetch.
        let tree = this.getNext();
        while (tree.isNil() && tree.children.length === 1) {
            tree = tree.children[0] as GrammarAST;
        }

        return tree.dupNode(); // dup just the root (want node here)
    }

    protected dup(el: CommonTree): CommonTree {
        return dupTree(el);
    }
}
