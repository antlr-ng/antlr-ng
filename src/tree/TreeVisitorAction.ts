/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/**
 * How to execute code for node t when a visitor visits node t?
 * Execute pre() before visiting children and execute post() after visiting children.
 */
export interface TreeVisitorAction<T> {
    /**
     * Execute an action before visiting children of t. Return t or a rewritten t.  It is up to the visitor to
     * decide what to do with the return value. Children of returned value will be visited if using TreeVisitor.visit().
     */
    pre(t: T): T;

    /**
     * Execute an action after visiting children of t.  Return t or a rewritten t.  It is up to the visitor to decide
     * what to do with the return value.
     */
    post(t: T): T;
}
