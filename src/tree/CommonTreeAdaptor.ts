/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CommonToken, isToken, Token } from "antlr4ng";

import { CommonTree } from "./CommonTree.js";

/** A TreeAdaptor that works with any Tree implementation. */
export class CommonTreeAdaptor {
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
     * If oldRoot is a nil root, just copy or move the children to newRoot. If not a nil root, make oldRoot a child
     * of newRoot.
     * ```
     * old=^(nil a b c), new=r yields ^(r a b c)
     * old=^(a b c), new=r yields ^(r ^(a b c))
     * ```
     * If newRoot is a nil-rooted single child tree, use the single child as the new root node.
     * ```
     * old=^(nil a b c), new=^(nil r) yields ^(r a b c)
     * old=^(a b c), new=^(nil r) yields ^(r ^(a b c))
     * ```
     * If oldRoot was null, it's ok, just return newRoot (even if isNil).
     * ```
     * old=null, new=r yields r
     * old=null, new=^(nil r) yields ^(nil r)
     * ```
     *
     *  @returns newRoot. Throw an error if newRoot is not a simple node or nil root with a single child node. It must
     * be a root node. If newRoot is ^(nil x) return x as newRoot.
     *
     *  Be advised that it's ok for newRoot to point at oldRoot's children, i.e. you don't have to copy the list. We are
     *  constructing these nodes so we should have this control for efficiency.
     */
    public becomeRoot(newRoot: CommonTree | Token, oldRoot: CommonTree | null): CommonTree {
        if (isToken(newRoot)) {
            newRoot = this.create(newRoot);
        }

        if (oldRoot === null) {
            return newRoot;
        }

        // Hhandle ^(nil real-node).
        if (newRoot.isNil()) {
            const nc = newRoot.children.length;
            if (nc === 1) {
                newRoot = newRoot.children[0];
            } else if (nc > 1) {
                throw new Error("more than one node as root (TODO: make exception hierarchy)");
            }
        }

        // Add oldRoot to newRoot. `addChild` takes care of case where oldRoot is a flat list (i.e. nil-rooted tree).
        // All children of oldRoot are added to newRoot.
        newRoot.addChild(oldRoot);

        return newRoot;
    }

    /**
     * Transforms ^(nil x) to x and nil to null.
     */
    public rulePostProcessing(root: CommonTree): CommonTree | null {
        let r: CommonTree | null = root;
        if (r.isNil()) {
            if (r.children.length === 0) {
                r = null;
            } else if (r.children.length === 1) {
                r = r.children[0];

                // Whoever invokes rule will set parent and child index.
                r.parent = null;
                r.childIndex = -1;
            }
        }

        return r;
    }

    /**
     * Tell me how to create a token for use with imaginary token nodes. For example, there is probably no input
     * symbol associated with imaginary token DECL, but you need to create it as a payload or whatever for the DECL
     * node as in ^(DECL type ID).
     *
     * This is a variant of createToken where the new token is derived from an actual real input token. Typically this
     * is for converting '{' tokens to BLOCK etc...  You'll see
     * ```
     *    r : lc='{' ID+ '}' -> ^(BLOCK[$lc] ID+) ;
     * ```
     */
    private createToken(fromToken: Token): Token;
    private createToken(tokenType: number, text: string): Token;
    private createToken(...args: unknown[]): Token {
        if (args.length === 1) {
            const [fromToken] = args as [Token];

            return CommonToken.fromToken(fromToken);
        }

        const [tokenType, text] = args as [number, string];

        return CommonToken.fromType(tokenType, text);
    }

}
