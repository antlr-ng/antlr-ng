/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { Token } from "antlr4ng";

import { CommonTree } from "./CommonTree.js";
import type { TreePattern } from "./TreePattern.js";
import { TreePatternLexer } from "./TreePatternLexer.js";
import { TreePatternParser } from "./TreePatternParser.js";
import { WildcardTreePattern } from "./WildcardTreePattern.js";

/**
 * Build and navigate trees with this object.  Must know about the names
 *  of tokens so you have to pass in a map or array of token names (from which
 *  this class can build the map).  I.e., Token DECL means nothing unless the
 *  class can translate it to a token type.
 *
 *  In order to create nodes and navigate, this class needs a TreeAdaptor.
 *
 *  This class can build a token type > node index for repeated use or for
 *  iterating over the various nodes with a particular type.
 *
 *  This class works in conjunction with the TreeAdaptor rather than moving
 *  all this functionality into the adaptor.  An adaptor helps build and
 *  navigate trees using methods.  This class helps you do it with string
 *  patterns like "(A B C)".  You can create a tree from that pattern or
 *  match subtrees against it.
 */
export class TreeWizard {
    private tokenNameToTypeMap?: Map<string | null, number>;

    public constructor(tokenNames: Array<string | null>) {
        this.tokenNameToTypeMap = this.computeTokenTypes(tokenNames);
    }

    /**
     * Given a pattern like (ASSIGN %lhs:ID %rhs:.) with optional labels
     *  on the various nodes and '.' (dot) as the node/subtree wildcard,
     *  return true if the pattern matches and fill the labels Map with
     *  the labels pointing at the appropriate nodes.  Return false if
     *  the pattern is malformed or the tree does not match.
     *
     *  If a node specifies a text arg in pattern, then that must match
     *  for that node in t.
     *
     *  TODO: what's a better way to indicate bad pattern? Exceptions are a hassle
     */
    public parse<T extends CommonTree>(t: T, pattern: string, labels?: Map<string, T>): boolean {
        const tokenizer = new TreePatternLexer(pattern);
        const parser = new TreePatternParser(tokenizer, this);
        const tpattern = parser.pattern() as TreePattern;
        const matched = this.doParse(t, tpattern, labels ?? null);

        return matched;
    }

    /** Using the map of token names to token types, return the type. */
    public getTokenType(tokenName: string): number {
        if (!this.tokenNameToTypeMap) {
            return Token.INVALID_TYPE;
        }

        const ttypeI = this.tokenNameToTypeMap.get(tokenName);
        if (ttypeI !== undefined) {
            return ttypeI;
        }

        return Token.INVALID_TYPE;
    }

    /**
     * Compute a map that is an inverted index of tokenNames (which maps int token types to names).
     */
    private computeTokenTypes(tokenNames: Array<string | null>): Map<string | null, number> {
        const m = new Map<string | null, number>();

        for (let ttype = 0; ttype < tokenNames.length; ttype++) {
            const name = tokenNames[ttype];
            m.set(name, ttype);
        }

        return m;
    }

    /**
     * Do the work for parse. Check to see if the t2 pattern fits the
     *  structure and token types in t1.  Check text if the pattern has
     *  text arguments on nodes.  Fill labels map with pointers to nodes
     *  in tree matched against nodes in pattern with labels.
     */
    private doParse(t1: CommonTree, tpattern: TreePattern, labels: Map<string, CommonTree> | null): boolean {
        // check roots (wildcard matches anything)
        if (!(tpattern instanceof WildcardTreePattern)) {
            if (t1.getType() !== tpattern.getType()) {
                return false;
            }

            // if pattern has text, check node text
            if (tpattern.hasTextArg && t1.getText() !== tpattern.getText()) {
                return false;
            }
        }

        if (tpattern.label && labels !== null) {
            // map label in pattern to node in t1
            labels.set(tpattern.label, t1);
        }

        // check children
        const n1 = t1.children.length;
        const n2 = tpattern.children.length;
        if (n1 !== n2) {
            return false;
        }

        for (let i = 0; i < n1; i++) {
            const child1 = t1.children[i];
            const child2 = tpattern.children[i] as TreePattern;
            if (!this.doParse(child1, child2, labels)) {
                return false;
            }
        }

        return true;
    }
}
