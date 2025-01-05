/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: disable

/**
 * What does a tree look like?  ANTLR has a number of support classes
 *  such as CommonTreeNodeStream that work on these kinds of trees.  You
 *  don't have to make your trees implement this interface, but if you do,
 *  you'll be able to use more support code.
 *
 *  NOTE: When constructing trees, ANTLR can build any kind of tree; it can
 *  even use Token objects as trees if you add a child list to your tokens.
 *
 *  This is a tree node without any payload; just navigation and factory stuff.
 */
export interface Tree {

    getChild(i: number): Tree | null;

    getChildCount(): number;

    // Tree tracks parent and child index now > 3.0

    getParent(): Tree | null;

    setParent(t: Tree | null): void;

    /** Is there is a node above with token type ttype? */
    hasAncestor(ttype: number): boolean;

    /** Walk upwards and get first ancestor with this token type. */
    getAncestor(ttype: number): Tree | null;

    /**
     * Return a list of all ancestors of this node.  The first node of
     * list is the root and the last is the parent of this node.
     */
    getAncestors(): Tree[] | null;

    /** This node is what child index? 0..n-1 */
    getChildIndex(): number;

    setChildIndex(index: number): void;

    /** Set the parent and child index values for all children */
    freshenParentAndChildIndexes(): void;

    /**
     * Add t as a child to this node.  If t is null, do nothing.  If t
     *  is nil, add all children of t to this' children.
     */
    addChild(t: Tree): void;

    /** Set ith child (0..n-1) to t; t must be non-null and non-nil node */
    setChild(i: number, t: Tree): void;

    deleteChild(i: number): Tree | null;

    /**
     * Delete children from start to stop and replace with t even if t is
     *  a list (nil-root tree).  num of children can increase or decrease.
     *  For huge child lists, inserting children can force walking rest of
     *  children to set their childindex; could be slow.
     */
    replaceChildren(startChildIndex: number, stopChildIndex: number, t: unknown): void;

    /**
     * Indicates the node is a nil node but may still have children, meaning
     *  the tree is a flat list.
     */
    isNil(): boolean;

    /**
     *  What is the smallest token index (indexing from 0) for this node
     *   and its children?
     */
    getTokenStartIndex(): number;

    setTokenStartIndex(index: number): void;

    /**
     *  What is the largest token index (indexing from 0) for this node
     *   and its children?
     */
    getTokenStopIndex(): number;

    setTokenStopIndex(index: number): void;

    dupNode(): Tree;

    /** Return a token type; needed for tree parsing */
    getType(): number;

    getText(): string | null;

    /** In case we don't have a token payload, what is the line for errors? */
    getLine(): number;

    getCharPositionInLine(): number;

    toStringTree(): string | null;

    toString(): string | null;
}

export namespace Tree {
    //export const INVALID_NODE: Tree = new CommonTree(Token.INVALID_TYPE);
}
