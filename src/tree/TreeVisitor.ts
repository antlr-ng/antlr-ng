/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CommonTree } from "./CommonTree.js";
import type { TreeVisitorAction } from "./TreeVisitorAction.js";

/**
 * Do a depth first walk of a tree, applying pre() and post() actions as we discover and finish nodes.
 */
export class TreeVisitor {
    /**
     * Visit every node in tree t and trigger an action for each node
     *  before/after having visited all of its children.
     *  Execute both actions even if t has no children.
     *  If a child visit yields a new child, it can update its
     *  parent's child list or just return the new child.  The
     *  child update code works even if the child visit alters its parent
     *  and returns the new tree.
     *
     *  Return result of applying post action to this node.
     */
    public visit(t: CommonTree, action?: TreeVisitorAction<CommonTree>): CommonTree {
        const isNil = t.isNil();
        if (action && !isNil) {
            t = action.pre(t); // if rewritten, walk children of new t
        }

        for (let i = 0; i < t.children.length; i++) {
            const child = t.children[i];
            const visitResult = this.visit(child, action);
            const childAfterVisit = t.children[i];
            if (visitResult !== childAfterVisit) { // result & child differ?
                t.setChild(i, visitResult); // update with new child
            }
        }

        if (action && !isNil) {
            t = action.post(t);
        }

        return t;
    }
}
