/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

import { CommonToken, Token } from "antlr4ng";

import { BaseTreeAdaptor } from "./BaseTreeAdaptor.js";
import { CommonTree } from "../../tree/CommonTree.js";
import type { Tree } from "./Tree.js";

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
export class CommonTreeAdaptor extends BaseTreeAdaptor {
    /**
     * Duplicate a node.  This is part of the factory;
     *	override if you want another kind of node to be built.
     *
     *  I could use reflection to prevent having to override this
     *  but reflection is slow.
     */
    public override dupNode(t: CommonTree): CommonTree {
        return t.dupNode();
    }

    public override create(payload?: Token): CommonTree;
    public override create(tokenType: number, text: string): CommonTree;
    public override create(tokenType: number, fromToken: Token, text?: string): CommonTree;
    public override create(...args: unknown[]): CommonTree {
        if (args.length < 2) {
            const [payload] = args as [Token | undefined];

            return new CommonTree(payload);
        }

        return super.create.apply(this, args) as CommonTree;
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

    public getTokenStartIndex(t: unknown): number {
        if (t === null) {
            return -1;
        }

        return (t as Tree).getTokenStartIndex();
    }

    public getTokenStopIndex(t: unknown): number {
        if (t === null) {
            return -1;
        }

        return (t as Tree).getTokenStopIndex();
    }

    public override getText(t: CommonTree | null): string | null {
        if (t === null) {
            return null;
        }

        return t.getText();
    }

    public override getType(t: CommonTree | null): number {
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

    public override getChild(t: CommonTree | null, i: number): CommonTree | null {
        if (t === null) {
            return null;
        }

        return t.getChild(i);
    }

    public override getChildCount(t: CommonTree | null): number {
        if (t === null) {
            return 0;
        }

        return t.getChildCount();
    }

    public override getParent(t: CommonTree | null): CommonTree | null {
        if (t === null) {
            return null;
        }

        return (t).getParent();
    }

    public setParent(t: unknown, parent: unknown): void {
        if (t !== null) {
            (t as Tree).setParent(parent as Tree);
        }

    }

    public getChildIndex(t: unknown): number {
        if (t === null) {
            return 0;
        }

        return (t as Tree).getChildIndex();
    }

    public setChildIndex(t: unknown, index: number): void {
        if (t !== null) {
            (t as Tree).setChildIndex(index);
        }

    }

    public replaceChildren(parent: unknown, startChildIndex: number, stopChildIndex: number, t: unknown): void {
        if (parent !== null) {
            (parent as Tree).replaceChildren(startChildIndex, stopChildIndex, t);
        }
    }
}
