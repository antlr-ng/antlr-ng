/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CommonToken, isToken, Token } from "antlr4ng";

import { CommonTree } from "./CommonTree.js";

/**
 * A TreeAdaptor that works with any Tree implementation.  It provides
 *  really just factory methods; all the work is done by BaseTreeAdaptor.
 *  If you would like to have different tokens created than ClassicToken
 *  objects, you need to override this and then set the parser tree adaptor to
 *  use your subclass.
 *
 *  To get your parser to build nodes of a different type, override
 *  create(Token), errorNode(), and to be safe, YourTreeClass.dupNode().
 *  dupNode is called to duplicate nodes during rewrite operations.
 */
export class CommonTreeAdaptor {
    /**
     * System.identityHashCode() is not always unique; we have to
     *  track ourselves.  That's ok, it's only for debugging, though it's
     *  expensive: we have to create a hashtable with all tree nodes in it.
     */
    protected treeToUniqueIDMap = new Map<CommonTree, number>();
    protected uniqueNodeID = 1;

    /**
     * Duplicate a node.  This is part of the factory;
     *	override if you want another kind of node to be built.
     *
     *  I could use reflection to prevent having to override this
     *  but reflection is slow.
     */
    public dupNode(t: CommonTree): CommonTree {
        return t.dupNode();
    }

    public create(payload?: Token): CommonTree;
    public create(tokenType: number, text: string): CommonTree;
    public create(tokenType: number, fromToken: Token, text?: string): CommonTree;
    public create(...args: unknown[]): CommonTree {
        if (args.length < 2) {
            const [payload] = args as [Token | undefined];

            return new CommonTree(payload);
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
    public createToken(fromToken: Token): Token;
    /**
     * Tell me how to create a token for use with imaginary token nodes.
     *  For example, there is probably no input symbol associated with imaginary
     *  token DECL, but you need to create it as a payload or whatever for
     *  the DECL node as in ^(DECL type ID).
     *
     *  If you care what the token payload objects' type is, you should
     *  override this method and any other createToken variant.
     */
    public createToken(tokenType: number, text: string): Token;
    public createToken(...args: unknown[]): Token {
        if (args.length === 1) {
            const [fromToken] = args as [Token];

            return CommonToken.fromToken(fromToken);
        }

        const [tokenType, text] = args as [number, string];

        return CommonToken.fromType(tokenType, text);
    }

    public nil(): CommonTree {
        return this.create();
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
     * Track start/stop token for subtree root created for a rule.
     *  Only works with Tree nodes.  For rules that match nothing,
     *  seems like this will yield start=i and stop=i-1 in a nil node.
     *  Might be useful info so I'll not force to be i..i.
     */
    public setTokenBoundaries(t: CommonTree | null, startToken: Token | null, stopToken: Token | null): void {
        if (t === null) {
            return;
        }

        let start = 0;
        let stop = 0;
        if (startToken !== null) {
            start = startToken.tokenIndex;
        }

        if (stopToken !== null) {
            stop = stopToken.tokenIndex;
        }

        t.setTokenStartIndex(start);
        t.setTokenStopIndex(stop);
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
            } else if (nc > 1) {
                throw new Error("more than one node as root (TODO: make exception hierarchy)");
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

    public getTokenStartIndex(t: CommonTree | undefined): number {
        return t?.getTokenStartIndex() ?? -1;
    }

    public getTokenStopIndex(t: CommonTree | undefined): number {
        return t?.getTokenStopIndex() ?? -1;
    }

    public getText(t: CommonTree | null): string | null {
        if (t === null) {
            return null;
        }

        return t.getText();
    }

    public getType(t: CommonTree | null): number {
        if (t === null) {
            return Token.INVALID_TYPE;
        }

        return t.getType();
    }

    /**
     * What is the Token associated with this node?  If
     *  you are not using CommonTree, then you must
     *  override this in your own adaptor.
     */
    public getToken(t: CommonTree | null): Token | null {
        if (t) {
            return t.token ?? null;
        }

        return null; // no idea what to do
    }

    public getChild(t: CommonTree | null, i: number): CommonTree | null {
        if (t === null) {
            return null;
        }

        return t.getChild(i);
    }

    public getChildCount(t: CommonTree | null): number {
        if (t === null) {
            return 0;
        }

        return t.getChildCount();
    }

    public getParent(t: CommonTree | null): CommonTree | null {
        if (t === null) {
            return null;
        }

        return (t).getParent();
    }

    public setParent(t: CommonTree | null, parent: CommonTree): void {
        t?.setParent(parent);
    }

    public setChild(t: CommonTree, i: number, child: CommonTree): void {
        (t).setChild(i, child);
    }

    public getChildIndex(t: CommonTree | undefined): number {
        return t?.getChildIndex() ?? 0;
    }

    public setChildIndex(t: CommonTree | undefined, index: number): void {
        t?.setChildIndex(index);
    }

    public replaceChildren(parent: CommonTree | undefined, startChildIndex: number, stopChildIndex: number,
        t: CommonTree): void {
        parent?.replaceChildren(startChildIndex, stopChildIndex, t);
    }
}
