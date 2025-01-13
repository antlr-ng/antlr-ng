/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns */

import type { CommonTree } from "./CommonTree.js";
import { RewriteRuleElementStream } from "./RewriteRuleElementStream.js";

export class RewriteRuleSubtreeStream extends RewriteRuleElementStream {

    /**
     * Treat next element as a single node even if it's a subtree.
     *  This is used instead of next() when the result has to be a
     *  tree root node.  Also prevents us from duplicating recently-added
     *  children; e.g., ^(type ID)+ adds ID to type and then 2nd iteration
     *  must dup the type node, but ID has been added.
     *
     *  Referencing a rule result twice is ok; dup entire tree as
     *  we can't be adding trees as root; e.g., expr expr.
     *
     *  Hideous code duplication here with super.next().  Can't think of
     *  a proper way to refactor.  This needs to always call dup node
     *  and super.next() doesn't know which to call: dup node or dup tree.
     */
    public nextNode(): CommonTree {
        const n = this.size();
        if (this.dirty || (this.cursor >= n && n === 1)) {
            // if out of elements and size is 1, dup (at most a single node
            // since this is for making root nodes).
            const el = this._next();

            return this.adaptor.dupNode(el);
        }

        // test size above then fetch
        let tree = this._next();
        while (this.adaptor.isNil(tree) && this.adaptor.getChildCount(tree) === 1) {
            tree = this.adaptor.getChild(tree, 0)!;
        }

        const el = this.adaptor.dupNode(tree); // dup just the root (want node here)

        return el;
    }

    protected dup(el: CommonTree): CommonTree {
        return this.adaptor.dupTree(el);
    }
}
