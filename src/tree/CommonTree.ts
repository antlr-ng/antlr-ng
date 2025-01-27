/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Interval, ParseTree, Token, type ParseTreeVisitor } from "antlr4ng";

/** A tree node that is wrapper for a Token object. */
export class CommonTree implements ParseTree {
    /** A single token is the payload */
    public token?: Token;

    /** Who is the parent node of this node; if null, implies node is root */
    public parent: CommonTree | null = null;

    /** What token indexes bracket all tokens associated with this node and below? */
    public startIndex = -1;

    /** What token indexes bracket all tokens associated with this node and below? */
    public stopIndex = -1;

    /** What index is this node in the child list? Range: 0..n-1 */
    private childIndex = -1;

    private children: CommonTree[] = [];

    public constructor(nodeOrToken?: CommonTree | Token) {
        if (nodeOrToken instanceof CommonTree) {
            this.token = nodeOrToken.token;
            this.startIndex = nodeOrToken.startIndex;
            this.stopIndex = nodeOrToken.stopIndex;
        } else if (nodeOrToken) {
            this.token = nodeOrToken;
            this.startIndex = nodeOrToken.tokenIndex;
            this.stopIndex = nodeOrToken.tokenIndex;
        }
    }

    public getChild(i: number): CommonTree | null {
        return this.children[i] ?? null;
    }

    public getChildCount(): number {
        return this.children.length;
    }

    public getChildren(): CommonTree[] {
        return this.children;
    }

    public getFirstChildWithType(type: number): CommonTree | null {
        for (const t of this.children) {
            if (t.getType() === type) {
                return t;
            }
        }

        return null;
    }

    public getPayload(): Token | null {
        return this.token ?? null;
    }

    public dupNode(): CommonTree {
        return new CommonTree(this);
    }

    /**
     * Add t as child of this node.
     *
     * Warning: if t has no children, but child does
     * and child isNil then this routine moves children to t via
     * t.#children = child.#children; i.e., without copying the array.
     *
     * @param t The child to add.
     */
    public addChild(t?: CommonTree): void {
        if (!t) {
            return;
        }

        if (t.isNil()) { // t is an empty node possibly with children
            if (this.children === t.children) {
                throw new Error("attempt to add child list to itself");
            }

            // just add all of childTree's children to this
            if (this.children.length > 0) { // must copy, this has children already
                const n = t.children.length;
                for (let i = 0; i < n; i++) {
                    const c = t.children[i];
                    this.children.push(c);

                    // handle double-link stuff for each child of nil root
                    c.parent = this;
                    c.setChildIndex(this.children.length - 1);
                }
            } else {
                // no children for this but t has children; just set pointer
                // call general freshener routine
                this.children = t.children;
                this.freshenParentAndChildIndexes();
            }
        } else { // child is not nil (don't care about children)
            this.children.push(t);
            t.parent = this;
            t.setChildIndex(this.children.length - 1);
        }
    }

    /**
     * Add all elements of kids list as children of this node
     *
     * @param kids The children to add.
     */
    public addChildren(kids: CommonTree[]): void {
        for (const kid of kids) {
            this.addChild(kid);
        }
    }

    public setChild(i: number, t: CommonTree): void {
        if (t.isNil()) {
            throw new Error("Can't set single child to a list");
        }

        this.children[i] = t;
        t.parent = this;
        t.setChildIndex(i);
    }

    /**
     * Insert child t at child position i (0..n-1) by shifting children
     * i+1..n-1 to the right one position. Set parent / indexes properly
     * but does NOT collapse nil-rooted t's that come in here like addChild.
     *
     * @param i The index to insert the child at.
     * @param t The child to insert.
     */
    public insertChild(i: number, t: CommonTree): void {
        if (i < 0 || i > this.getChildCount()) {
            throw new Error(`${i} out or range`);
        }

        this.children.splice(i, 0, t);

        // walk others to increment their child indexes
        // set index, parent of this one too
        this.freshenParentAndChildIndexes(i);
    }

    public deleteChild(i: number): CommonTree | null {
        const killed = this.children.splice(i, 1);

        // walk rest and decrement their child indexes
        this.freshenParentAndChildIndexes(i);

        return killed[0] ?? null;
    }

    /**
     * Delete children from start to stop and replace with t even if t is
     * a list (nil-root tree).  num of children can increase or decrease.
     * For huge child lists, inserting children can force walking rest of
     * children to set their child index; could be slow.
     *
     * @param startChildIndex The index to start deleting children.
     * @param stopChildIndex The index to stop deleting children.
     * @param t The tree to replace the deleted children with.
     */
    public replaceChildren(startChildIndex: number, stopChildIndex: number, t: CommonTree): void {
        if (this.children.length === 0) {
            throw new Error("indexes invalid; no children in list");
        }

        const replacingHowMany = stopChildIndex - startChildIndex + 1;
        const newTree = t;
        let newChildren: CommonTree[] = [];

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
                const child = newChildren[j];
                this.children.splice(i, 1, child);
                child.parent = this;
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

    /**
     * Set the parent and child index values for all child of t
     *
     * @param offset The index to start from.
     */
    public freshenParentAndChildIndexes(offset?: number): void {
        offset ??= 0;
        const n = this.getChildCount();
        for (let c = offset; c < n; c++) {
            const child = this.getChild(c);
            if (child) {
                child.setChildIndex(c);
                child.parent = this;
            }
        }

    }

    public freshenParentAndChildIndexesDeeply(offset = 0): void {
        const n = this.children.length;
        for (let c = offset; c < n; c++) {
            const child = this.children[c];
            child.setChildIndex(c);
            child.parent = this;
            child.freshenParentAndChildIndexesDeeply();
        }
    }

    public sanityCheckParentAndChildIndexes(): void;
    public sanityCheckParentAndChildIndexes(parent: CommonTree | undefined, i: number): void;
    public sanityCheckParentAndChildIndexes(...args: unknown[]): void {
        const parent = args[0] as CommonTree | undefined;
        const i = (args[1] ?? -1) as number;
        if (parent !== (this.parent ?? undefined)) {
            throw new Error(`parents don't match; expected ${parent} found ${this.parent}`);
        }

        if (i !== this.getChildIndex()) {
            throw new Error(`child indexes don't match; expected ${i} found ${this.getChildIndex()}`);
        }

        const n = this.getChildCount();
        for (let c = 0; c < n; c++) {
            const child = this.children[c];
            child.sanityCheckParentAndChildIndexes(this, c);
        }
    }

    public isNil(): boolean {
        return !this.token;
    }

    public getType(): number {
        if (!this.token) {
            return Token.INVALID_TYPE;
        }

        return this.token.type;
    }

    public getText(): string {
        return this.token?.text ?? "";
    }

    public getLine(): number {
        if (!this.token || this.token.line === 0) {
            if (this.children.length > 0) {
                return this.children[0].getLine();
            }

            return 0;
        }

        return this.token.line;
    }

    public getCharPositionInLine(): number {
        if (!this.token || this.token.column === -1) {
            if (this.children.length > 0) {
                return this.children[0].getCharPositionInLine();
            }

            return 0;
        }

        return this.token.column;
    }

    public getTokenStartIndex(): number {
        if (this.startIndex === -1 && this.token) {
            return this.token.tokenIndex;
        }

        return this.startIndex;
    }

    public setTokenStartIndex(index: number): void {
        this.startIndex = index;
    }

    public getTokenStopIndex(): number {
        if (this.stopIndex === -1 && this.token) {
            return this.token.tokenIndex;
        }

        return this.stopIndex;
    }

    public setTokenStopIndex(index: number): void {
        this.stopIndex = index;
    }

    /**
     * For every node in this subtree, make sure it's start/stop token's
     *  are set.  Walk depth first, visit bottom up.  Only updates nodes
     *  with at least one token index &lt; 0.
     */
    public setUnknownTokenBoundaries(): void {
        if (this.children.length === 0) {
            if (this.startIndex < 0 || this.stopIndex < 0) {
                this.startIndex = this.stopIndex = this.token?.tokenIndex ?? 0;
            }

            return;
        }

        for (const child of this.children) {
            (child).setUnknownTokenBoundaries();
        }

        if (this.startIndex >= 0 && this.stopIndex >= 0) {
            return;
        }

        // already set
        const firstChild = this.children[0];
        const lastChild = this.children[this.children.length - 1];
        this.startIndex = firstChild.getTokenStartIndex();
        this.stopIndex = lastChild.getTokenStopIndex();
    }

    public getChildIndex(): number {
        return this.childIndex;
    }

    public setChildIndex(index: number): void {
        this.childIndex = index;
    }

    public toString(): string {
        if (!this.token) {
            return "nil";
        }

        if (this.getType() === Token.INVALID_TYPE) {
            return "<errornode>";
        }

        return this.token.text ?? "nil";
    }

    public accept<T>(visitor: ParseTreeVisitor<T>): T | null {
        return visitor.visitChildren(this);
    }

    public getSourceInterval(): Interval {
        return Interval.of(this.getTokenStartIndex(), this.getTokenStopIndex());
    }

    /**
     * Walk upwards looking for ancestor with this token type.
     *
     * @param ttype The token type to check for.
     *
     * @returns `true` if this node has an ancestor with the specified token type; otherwise, `false`.
     */
    public hasAncestor(ttype: number): boolean {
        return this.getAncestor(ttype) !== null;
    }

    /**
     * Walk upwards and get first ancestor with this token type.
     *
     * @param ttype The token type to check for.
     *
     * @returns The first ancestor of this node with the specified token type, or `null` if no ancestor with
     *          the type exists.
     */
    public getAncestor(ttype: number): CommonTree | null {
        let run = this.parent;
        while (run !== null) {
            if (run.getType() === ttype) {
                return run;
            }

            run = run.parent;
        }

        return null;
    }

    /**
     * Return a list of all ancestors of this node. The first node of list is the root and the last is the parent
     * of this node.
     *
     * @returns A list of all ancestors of this node, or `null` if this node has no parent.
     */
    public getAncestors(): CommonTree[] | null {
        if (this.parent === null) {
            return null;
        }

        const ancestors = new Array<CommonTree>();
        let t: CommonTree | null = this.parent;
        while (t !== null) {
            ancestors.unshift(t); // insert at start
            t = t.parent;
        }

        return ancestors;
    }

    /**
     * Print out a whole tree not just a node
     *
     * @returns A string representation of the tree.
     */
    public toStringTree(): string {
        if (this.children.length === 0) {
            return this.toString();
        }

        let result = "";
        if (!this.isNil()) {
            result += `(${this.toString()} `;
        }

        for (let i = 0; i < this.children.length; ++i) {
            const t = this.children[i];
            if (i > 0) {
                result += " ";
            }

            result += t.toStringTree();
        }

        if (!this.isNil()) {
            result += ")";
        }

        return result;
    }

}
