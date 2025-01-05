/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

import type { Tree } from "./Tree.js";

/**
 * A generic tree implementation with no payload.  You must subclass to
 *  actually have any user data.  ANTLR v3 uses a list of children approach
 *  instead of the child-sibling approach in v2.  A flat tree (a list) is
 *  an empty node whose children represent the list.  An empty, but
 *  non-null node is called "nil".
 */
export abstract class BaseTree implements Tree {
    protected children: Tree[];

    /**
     * Create a new node from an existing node does nothing for BaseTree
     * as there are no fields other than the children list, which cannot
     * be copied as the children are not considered part of this node.
     */
    public constructor(protected node?: Tree) {
    }

    public getChild(i: number): Tree | null {
        if (i >= this.children.length) {
            return null;
        }

        return this.children[i];
    }

    /**
     * Get the children internal List; note that if you directly mess with
     *  the list, do so at your own risk.
     */
    public getChildren(): Tree[] {
        return this.children;
    }

    public getFirstChildWithType(type: number): Tree | null {
        for (const t of this.children) {
            if (t.getType() === type) {
                return t;
            }
        }

        return null;
    }

    public getChildCount(): number {
        return this.children.length;
    }

    /**
     * Add t as child of this node.
     *
     *  Warning: if t has no children, but child does
     *  and child isNil then this routine moves children to t via
     *  t.children = child.children; i.e., without copying the array.
     */
    public addChild(t?: Tree): void {
        if (!t) {
            return; // do nothing upon addChild(null)
        }

        const childTree = t as BaseTree;
        if (childTree.isNil()) { // t is an empty node possibly with children
            if (this.children === childTree.children) {
                throw new Error("attempt to add child list to itself");
            }

            // just add all of childTree's children to this
            if (this.children.length > 0) { // must copy, this has children already
                const n = childTree.children.length;
                for (let i = 0; i < n; i++) {
                    const c = childTree.children[i];
                    this.children.push(c);

                    // handle double-link stuff for each child of nil root
                    c.setParent(this);
                    c.setChildIndex(this.children.length - 1);
                }
            } else {
                // no children for this but t has children; just set pointer
                // call general freshener routine
                this.children = childTree.children;
                this.freshenParentAndChildIndexes();
            }
        } else { // child is not nil (don't care about children)
            this.children.push(t);
            childTree.setParent(this);
            childTree.setChildIndex(this.children.length - 1);
        }
    }

    /** Add all elements of kids list as children of this node */
    public addChildren(kids: Tree[]): void {
        for (const kid of kids) {
            this.addChild(kid);
        }
    }

    public setChild(i: number, t: Tree): void {
        if (t.isNil()) {
            throw new Error("Can't set single child to a list");
        }

        this.children[i] = t;
        t.setParent(this);
        t.setChildIndex(i);
    }

    /**
     *  Insert child t at child position i (0..n-1) by shifting children
     *  i+1..n-1 to the right one position. Set parent / indexes properly
     *  but does NOT collapse nil-rooted t's that come in here like addChild.
     */
    public insertChild(i: number, t: Tree): void {
        if (i < 0 || i > this.getChildCount()) {
            throw new Error(`${i} out or range`);
        }

        this.children.splice(i, 0, t);

        // walk others to increment their child indexes
        // set index, parent of this one too
        this.freshenParentAndChildIndexes(i);
    }

    public deleteChild(i: number): Tree | null {
        const killed = this.children.splice(i, 1);

        // walk rest and decrement their child indexes
        this.freshenParentAndChildIndexes(i);

        return killed[0] ?? null;
    }

    /**
     * Delete children from start to stop and replace with t even if t is
     *  a list (nil-root tree).  num of children can increase or decrease.
     *  For huge child lists, inserting children can force walking rest of
     *  children to set their childindex; could be slow.
     */
    public replaceChildren(startChildIndex: number, stopChildIndex: number, t: Tree): void {
        if (this.children.length === 0) {
            throw new Error("indexes invalid; no children in list");
        }

        const replacingHowMany = stopChildIndex - startChildIndex + 1;
        const newTree = t as BaseTree;
        let newChildren: Tree[] = [];

        // normalize to a list of children to add: newChildren
        if (newTree.isNil()) {
            newChildren = newTree.children;
        } else {
            newChildren.push(newTree);
        }

        const replacingWithHowMany = newChildren.length;
        const numNewChildren = newChildren.length;
        const delta = replacingHowMany - replacingWithHowMany;

        // if same number of nodes, do direct replace
        if (delta === 0) {
            let j = 0; // index into new children
            for (let i = startChildIndex; i <= stopChildIndex; i++) {
                const child = newChildren[j] as BaseTree;
                this.children.splice(i, 0, child);
                child.setParent(this);
                child.setChildIndex(i);
                j++;
            }
        } else {
            if (delta > 0) { // fewer new nodes than there were
                // set children and then delete extra
                for (let j = 0; j < numNewChildren; j++) {
                    this.children[startChildIndex + j] = newChildren[j];
                }

                const indexToDelete = startChildIndex + numNewChildren;
                for (let c = indexToDelete; c <= stopChildIndex; c++) {
                    // delete same index, shifting everybody down each time
                    this.children.splice(indexToDelete, 1);
                }
                this.freshenParentAndChildIndexes(startChildIndex);
            } else { // more new nodes than were there before
                // fill in as many children as we can (replacingHowMany) w/o moving data
                for (let j = 0; j < replacingHowMany; j++) {
                    this.children[startChildIndex + j] = newChildren[j];
                }

                for (let j = replacingHowMany; j < replacingWithHowMany; j++) {
                    this.children.splice(startChildIndex + j, 0, newChildren[j]);
                }
                this.freshenParentAndChildIndexes(startChildIndex);
            }
        }
    }

    public isNil(): boolean {
        return false;
    }

    /** Set the parent and child index values for all child of t */
    public freshenParentAndChildIndexes(offset?: number): void {
        offset ??= 0;
        const n = this.getChildCount();
        for (let c = offset; c < n; c++) {
            const child = this.getChild(c);
            if (child) {
                child.setChildIndex(c);
                child.setParent(this);
            }
        }

    }

    public freshenParentAndChildIndexesDeeply(offset?: number): void {
        offset ??= 0;
        const n = this.getChildCount();
        for (let c = offset; c < n; c++) {
            const child = this.getChild(c) as BaseTree;
            child.setChildIndex(c);
            child.setParent(this);
            child.freshenParentAndChildIndexesDeeply();
        }
    }

    public sanityCheckParentAndChildIndexes(): void;
    public sanityCheckParentAndChildIndexes(parent: Tree, i: number): void;
    public sanityCheckParentAndChildIndexes(...args: unknown[]): void {
        const parent = args[0] as Tree | undefined;
        const i = (args[1] ?? -1) as number;
        if (parent !== this.getParent()) {
            throw new Error(`parents don't match; expected ${parent} found ${this.getParent()}`);
        }

        if (i !== this.getChildIndex()) {
            throw new Error(`child indexes don't match; expected ${i} found ${this.getChildIndex()}`);
        }

        const n = this.getChildCount();
        for (let c = 0; c < n; c++) {
            const child = this.getChild(c) as BaseTree;
            child.sanityCheckParentAndChildIndexes(this, c);
        }
    }

    /** BaseTree doesn't track child indexes. */
    public getChildIndex(): number {
        return 0;
    }

    public setChildIndex(index: number): void {
        // do nothing
    }

    /** BaseTree doesn't track parent pointers. */
    public getParent(): Tree | null {
        return null;
    }

    public setParent(t: Tree): void {
        // do nothing
    }

    /** Walk upwards looking for ancestor with this token type. */
    public hasAncestor(ttype: number): boolean {
        return this.getAncestor(ttype) !== null;
    }

    /** Walk upwards and get first ancestor with this token type. */
    public getAncestor(ttype: number): Tree | null {
        let run = this.getParent();
        while (run !== null) {
            if (run.getType() === ttype) {
                return run;
            }

            run = run.getParent();
        }

        return null;
    }

    /**
     * Return a list of all ancestors of this node.  The first node of
     *  list is the root and the last is the parent of this node.
     */
    public getAncestors(): Tree[] | null {
        if (this.getParent() === null) {
            return null;
        }

        const ancestors = new Array<Tree>();
        let t = this.getParent();
        while (t !== null) {
            ancestors.unshift(t); // insert at start
            t = t.getParent();
        }

        return ancestors;
    }

    /** Print out a whole tree not just a node */
    public toStringTree(): string | null {
        if (this.children.length === 0) {
            return this.toString();
        }

        let buf = "";
        if (!this.isNil()) {
            buf += `(${this.toString()} `;
        }

        for (let i = 0; i < this.children.length; i++) {
            const t = this.children[i];
            if (i > 0) {
                buf += " ";
            }
            buf += t.toStringTree()!;
        }

        if (!this.isNil()) {
            buf += ")";
        }

        return buf.toString();
    }

    public getLine(): number {
        return 0;
    }

    public getCharPositionInLine(): number {
        return 0;
    }

    /** Override in a subclass to change the impl of children list */
    protected createChildrenList(): Tree[] {
        return [];
    }

    /** Override to say how a node (not a tree) should look as text */
    public abstract toString(): string | null;

    public abstract getTokenStartIndex(): number;
    public abstract setTokenStartIndex(index: number): void;
    public abstract getTokenStopIndex(): number;
    public abstract setTokenStopIndex(index: number): void;
    public abstract dupNode(): Tree;
    public abstract getType(): number;
    public abstract getText(): string | null;
}
