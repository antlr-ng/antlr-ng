/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

import { isToken, type RecognitionException, type Token, type TokenStream } from "antlr4ng";

import type { CommonTree } from "../../tree/CommonTree.js";
import { CommonErrorNode } from "./CommonErrorNode.js";
import type { TreeAdaptor } from "./TreeAdaptor.js";

/** A TreeAdaptor that works with any Tree implementation. */
export abstract class BaseTreeAdaptor implements TreeAdaptor {
    /**
     * System.identityHashCode() is not always unique; we have to
     *  track ourselves.  That's ok, it's only for debugging, though it's
     *  expensive: we have to create a hashtable with all tree nodes in it.
     */
    protected treeToUniqueIDMap = new Map<CommonTree, number>();
    protected uniqueNodeID = 1;

    public create(payload?: Token): CommonTree;
    public create(tokenType: number, text: string): CommonTree;
    public create(tokenType: number, fromToken: Token, text?: string): CommonTree;
    public create(...args: unknown[]): CommonTree {
        if (args.length < 2) {
            // Simulate an abstract method for an overloaded method.
            throw new Error("Abstract method called: BaseTreeAdaptor.create(Token)");
        }

        switch (args.length) {
            case 2: {
                if (typeof args[1] === "string") {
                    const [tokenType, text] = args as [number, string];

                    const fromToken = this.createToken(tokenType, text);

                    return this.create(fromToken);
                } else {
                    const [tokenType, fromToken] = args as [number, Token];

                    const temp = this.createToken(fromToken);
                    temp.type = tokenType;

                    return this.create(temp);
                }
            }

            case 3: {
                const [tokenType, fromToken, text] = args as [number, Token | null, string];

                if (fromToken === null) {
                    return this.create(tokenType, text);
                }

                const temp = this.createToken(fromToken);
                temp.type = tokenType;
                temp.text = text;

                return this.create(temp);
            }

            default: {
                throw new Error("Invalid number of arguments");
            }
        }
    }

    public nil(): CommonTree {
        return this.create();
    }

    /**
     * create tree node that holds the start and stop tokens associated
     *  with an error.
     *
     *  If you specify your own kind of tree nodes, you will likely have to
     *  override this method. CommonTree returns Token.INVALID_TOKEN_TYPE
     *  if no token payload but you might have to set token type for diff
     *  node type.
     *
     *  You don't have to subclass CommonErrorNode; you will likely need to
     *  subclass your own tree node class to avoid class cast exception.
     */
    public errorNode(input: TokenStream, start: Token, stop: Token,
        e: RecognitionException): CommonTree {
        return new CommonErrorNode(input, start, stop, e);
    }

    public isNil(tree: CommonTree | null): boolean {
        if (tree === null) {
            return true;
        }

        return tree.isNil();
    }

    /**
     * This is generic in the sense that it will work with any kind of
     *  tree (not just Tree interface).  It invokes the adaptor routines
     *  not the tree node routines to do the construction.
     */
    public dupTree(t: CommonTree, parent?: CommonTree): CommonTree {
        const newTree = this.dupNode(t);

        // ensure new subtree root has parent/child index set
        this.setChildIndex(newTree, this.getChildIndex(t)); // same index in new tree
        if (parent) {
            this.setParent(newTree, parent);
        }

        const n = this.getChildCount(t);
        for (let i = 0; i < n; i++) {
            const child = this.getChild(t, i)!;
            const newSubTree = this.dupTree(child, t);
            this.addChild(newTree, newSubTree);
        }

        return newTree;
    }

    /**
     * Add a child to the tree t.  If child is a flat tree (a list), make all
     *  in list children of t.  Warning: if t has no children, but child does
     *  and child isNil then you can decide it is ok to move children to t via
     *  t.children = child.children; i.e., without copying the array.  Just
     *  make sure that this is consistent with have the user will build
     *  ASTs.
     */
    public addChild(t: CommonTree, child: CommonTree): void {
        t.addChild(child);
    }

    /**
     * If oldRoot is a nil root, just copy or move the children to newRoot.
     *  If not a nil root, make oldRoot a child of newRoot.
     *
     *    old=^(nil a b c), new=r yields ^(r a b c)
     *    old=^(a b c), new=r yields ^(r ^(a b c))
     *
     *  If newRoot is a nil-rooted single child tree, use the single
     *  child as the new root node.
     *
     *    old=^(nil a b c), new=^(nil r) yields ^(r a b c)
     *    old=^(a b c), new=^(nil r) yields ^(r ^(a b c))
     *
     *  If oldRoot was null, it's ok, just return newRoot (even if isNil).
     *
     *    old=null, new=r yields r
     *    old=null, new=^(nil r) yields ^(nil r)
     *
     *  Return newRoot.  Throw an exception if newRoot is not a
     *  simple node or nil root with a single child node--it must be a root
     *  node.  If newRoot is ^(nil x) return x as newRoot.
     *
     *  Be advised that it's ok for newRoot to point at oldRoot's
     *  children; i.e., you don't have to copy the list.  We are
     *  constructing these nodes so we should have this control for
     *  efficiency.
     */
    public becomeRoot(newRoot: CommonTree | Token, oldRoot: CommonTree | null): CommonTree {
        if (isToken(newRoot)) {
            newRoot = this.create(newRoot);
        }

        if (oldRoot === null) {
            return newRoot;
        }

        // handle ^(nil real-node)
        if (newRoot.isNil()) {
            const nc = newRoot.getChildCount();
            if (nc === 1) {
                newRoot = newRoot.getChild(0)!;
            } else {
                if (nc > 1) {
                    // TODO: make tree run time exceptions hierarchy
                    throw new Error("more than one node as root (TODO: make exception hierarchy)");
                }
            }
        }

        // add oldRoot to newRoot; addChild takes care of case where oldRoot
        // is a flat list (i.e., nil-rooted tree).  All children of oldRoot
        // are added to newRoot.
        newRoot.addChild(oldRoot);

        return newRoot;
    }

    /**
     * Transform ^(nil x) to x and nil to null
     */
    public rulePostProcessing(root: CommonTree): CommonTree | null {
        let r: CommonTree | null = root;
        if (r.isNil()) {
            if (r.getChildCount() === 0) {
                r = null;
            } else if (r.getChildCount() === 1) {
                r = r.getChild(0)!;
                // whoever invokes rule will set parent and child index
                r.setParent(null);
                r.setChildIndex(-1);
            }

        }

        return r;
    }

    public getType(t: unknown): number {
        return (t as CommonTree).getType();
    }

    public setType(t: unknown, type: number): void {
        throw new Error("don't know enough about Tree node");
    }

    public getText(t: CommonTree): string | null {
        return t.getText();
    }

    public setText(t: unknown, text: string): void {
        throw new Error("don't know enough about Tree node");
    }

    public getChild(t: CommonTree, i: number): CommonTree | null {
        return t.getChild(i);
    }

    public setChild(t: unknown, i: number, child: unknown): void {
        (t as CommonTree).setChild(i, child as CommonTree);
    }

    public deleteChild(t: CommonTree, i: number): CommonTree | null {
        return t.deleteChild(i);
    }

    public getChildCount(t: unknown): number {
        return (t as CommonTree).getChildCount();
    }

    public getUniqueID(node: CommonTree): number {
        const prevID = this.treeToUniqueIDMap.get(node);
        if (prevID) {
            return prevID;
        }

        const id = this.uniqueNodeID++;
        this.treeToUniqueIDMap.set(node, id);

        return id;
    }

    /**
     * Tell me how to create a token for use with imaginary token nodes.
     *  For example, there is probably no input symbol associated with imaginary
     *  token DECL, but you need to create it as a payload or whatever for
     *  the DECL node as in ^(DECL type ID).
     *
     *  If you care what the token payload objects' type is, you should
     *  override this method and any other createToken variant.
     */
    public abstract createToken(tokenType: number, text: string): Token;

    /**
     * Tell me how to create a token for use with imaginary token nodes.
     *  For example, there is probably no input symbol associated with imaginary
     *  token DECL, but you need to create it as a payload or whatever for
     *  the DECL node as in ^(DECL type ID).
     *
     *  This is a variant of createToken where the new token is derived from
     *  an actual real input token.  Typically this is for converting '{'
     *  tokens to BLOCK etc...  You'll see
     *
     *    r : lc='{' ID+ '}' -&gt; ^(BLOCK[$lc] ID+) ;
     *
     *  If you care what the token payload objects' type is, you should
     *  override this method and any other createToken variant.
     */
    public abstract createToken(fromToken: Token): Token;

    public abstract dupNode(treeNode: CommonTree): CommonTree;

    public abstract getParent(t: CommonTree | null): CommonTree | null;
    public abstract setParent(t: CommonTree | null, parent: CommonTree | null): void;

    public abstract getChildIndex(t: CommonTree): number;
    public abstract setChildIndex(t: CommonTree, index: number): void;

    public abstract getToken(t: CommonTree): Token | null;
    public abstract setTokenBoundaries(t: CommonTree, startToken: Token, stopToken: Token): void;
    public abstract getTokenStartIndex(t: CommonTree): number;
    public abstract getTokenStopIndex(t: CommonTree): number;

    public abstract replaceChildren(parent: CommonTree, startChildIndex: number, stopChildIndex: number,
        t: CommonTree): void;
}
