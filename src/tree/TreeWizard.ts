/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

import { Token } from "antlr4ng";

import { CommonTree } from "./CommonTree.js";
import { CommonTreeAdaptor } from "./CommonTreeAdaptor.js";
import { TreePatternLexer } from "./TreePatternLexer.js";
import { TreePatternParser } from "./TreePatternParser.js";

export class Visitor implements TreeWizard.ContextVisitor {
    public visit<T>(t: T): void;
    public visit<T>(t: T, parent: T, childIndex: number, labels: Map<string, T>): void;
    public visit<T>(...args: unknown[]): void {
        if (args.length === 1) {
            throw Error("visit must be overridden");
        }

        this.visit(args[0] as T);
    }
};

/**
 * Build and navigate trees with this object.  Must know about the names
 *  of tokens so you have to pass in a map or array of token names (from which
 *  this class can build the map).  I.e., Token DECL means nothing unless the
 *  class can translate it to a token type.
 *
 *  In order to create nodes and navigate, this class needs a TreeAdaptor.
 *
 *  This class can build a token type &rarr; node index for repeated use or for
 *  iterating over the various nodes with a particular type.
 *
 *  This class works in conjunction with the TreeAdaptor rather than moving
 *  all this functionality into the adaptor.  An adaptor helps build and
 *  navigate trees using methods.  This class helps you do it with string
 *  patterns like "(A B C)".  You can create a tree from that pattern or
 *  match subtrees against it.
 */
export class TreeWizard {

    /**
     * When using %label:TOKENNAME in a tree for parse(), we must
     *  track the label.
     */
    public static TreePattern = class TreePattern extends CommonTree {
        public label: string;
        public hasTextArg: boolean;

        public declare startIndex: number;
        public declare stopIndex: number;
        public declare node: CommonTree;

        public constructor(payload?: Token) {
            super(payload);
        }

        public override toString(): string {
            return "%" + this.label + ":" + super.toString();
        }
    };

    public static WildcardTreePattern = class WildcardTreePattern extends TreeWizard.TreePattern {
        public constructor(payload: Token) {
            super(payload);
        }
    };

    /** This adaptor creates TreePattern objects for use during scan() */
    public static TreePatternTreeAdaptor = class TreePatternTreeAdaptor extends CommonTreeAdaptor {
        public declare treeToUniqueIDMap: Map<CommonTree, number>;
        public declare uniqueNodeID;

        public override create(payload?: Token): CommonTree;
        public override create(tokenType: number, text: string): CommonTree;
        public override create(tokenType: number, fromToken: Token, text?: string): CommonTree;
        public override create(...args: unknown[]): CommonTree {
            if (args.length < 2) {
                return new TreeWizard.TreePattern(args[0] as Token | undefined);
            }

            return super.create.apply(this, args) as CommonTree;
        }
    };

    protected adaptor: CommonTreeAdaptor;
    protected tokenNameToTypeMap?: Map<string | null, number>;

    public constructor(adaptorOrTokenNames: CommonTreeAdaptor | Array<string | null>);
    public constructor(adaptor: CommonTreeAdaptor, tokenNameToTypeMap: Map<string, number>);
    public constructor(adaptor: CommonTreeAdaptor, tokenNames: Array<string | null>);
    public constructor(...args: unknown[]) {
        let adaptor: CommonTreeAdaptor;
        let tokenNameToTypeMap: Map<string | null, number> | undefined;
        let tokenNames: Array<string | null>;

        if (args.length === 1) {
            if (Array.isArray(args[0])) {
                adaptor = new CommonTreeAdaptor();
                tokenNames = args[0] as Array<string | null>;
            } else {
                adaptor = args[0] as CommonTreeAdaptor;
            }
        } else {
            adaptor = args[0] as CommonTreeAdaptor;
            if (Array.isArray(args[1])) {
                tokenNames = args[1] as Array<string | null>;
                tokenNameToTypeMap = this.computeTokenTypes(tokenNames);
            } else {
                tokenNameToTypeMap = args[1] as Map<string, number>;
            }
        }

        this.adaptor = adaptor;
        this.tokenNameToTypeMap = tokenNameToTypeMap;
    }

    /**
     * Compare t1 and t2; return true if token types/text, structure match exactly.
     *  The trees are examined in their entirety so that (A B) does not match
     *  (A B C) nor (A (B C)).
     // TODO: allow them to pass in a comparator
     *  TODO: have a version that is nonstatic so it can use instance adaptor
     *
     *  I cannot rely on the tree node's equals() implementation as I make
     *  no constraints at all on the node types nor interface etc...
     */
    public static equals(t1: CommonTree | null, t2: CommonTree | null, adaptor: CommonTreeAdaptor): boolean {
        return TreeWizard._equals(t1, t2, adaptor);
    }

    protected static _equals(t1: CommonTree | null, t2: CommonTree | null, adaptor: CommonTreeAdaptor): boolean {
        if (t1 === null || t2 === null) {
            return false;
        }

        // check roots
        if (adaptor.getType(t1) !== adaptor.getType(t2)) {
            return false;
        }

        if (adaptor.getText(t1) !== adaptor.getText(t2)) {
            return false;
        }

        // check children
        const n1 = adaptor.getChildCount(t1);
        const n2 = adaptor.getChildCount(t2);
        if (n1 !== n2) {
            return false;
        }

        for (let i = 0; i < n1; i++) {
            const child1 = adaptor.getChild(t1, i);
            const child2 = adaptor.getChild(t2, i);
            if (!TreeWizard._equals(child1, child2, adaptor)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Compute a map that is an inverted index of tokenNames (which maps int token types to names).
     */
    public computeTokenTypes(tokenNames: Array<string | null>): Map<string | null, number> {
        const m = new Map<string | null, number>();

        for (let ttype = 0; ttype < tokenNames.length; ttype++) {
            const name = tokenNames[ttype];
            m.set(name, ttype);
        }

        return m;
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
     * Walk the entire tree and make a node name to nodes mapping.
     *  For now, use recursion but later nonrecursive version may be
     *  more efficient.  Returns Map&lt;Integer, List&gt; where the List is
     *  of your AST node type.  The Integer is the token type of the node.
     *
     *  TODO: save this index so that find and visit are faster
     */
    public index(t: CommonTree): Map<number, CommonTree[]> {
        const m = new Map<number, CommonTree[]>();
        this._index(t, m);

        return m;
    }

    /** Return a List of tree nodes with token type ttype or matching a search pattern. */
    public find(t: CommonTree, typeOrPattern: number | string): CommonTree[] | null {
        if (typeof typeOrPattern === "number") {
            const nodes = new Array<CommonTree>();
            this.visit(t, typeOrPattern, new class extends Visitor {
                public override visit(t: CommonTree): void {
                    nodes.push(t);
                }
            }());

            return nodes;
        }

        const subtrees = new Array<CommonTree>();
        const tokenizer = new TreePatternLexer(typeOrPattern);
        const parser = new TreePatternParser(tokenizer, this, new TreeWizard.TreePatternTreeAdaptor());
        const tpattern = parser.pattern() as TreeWizard.TreePattern | null;

        // don't allow invalid patterns
        if (tpattern === null || tpattern.isNil() || tpattern instanceof TreeWizard.WildcardTreePattern) {
            return null;
        }

        const rootTokenType = tpattern.getType();
        this.visit(t, rootTokenType, new class implements TreeWizard.ContextVisitor {
            public constructor(private readonly $outer: TreeWizard) { };

            public visit(t: CommonTree, parent: CommonTree, childIndex: number, labels: Map<string, CommonTree>): void {
                if (this.$outer._parse(t, tpattern, null)) {
                    subtrees.push(t);
                }
            }
        }(this));

        return subtrees;

    }

    public findFirst(t: CommonTree, typeOrPattern: number | string): CommonTree | null {
        return null;
    }

    /**
     * Visit every ttype node in t, invoking the visitor.  This is a quicker
     *  version of the general visit(t, pattern) method.  The labels arg
     *  of the visitor action method is never set (it's null) since using
     *  a token type rather than a pattern doesn't let us set a label.
     */
    public visit<T extends CommonTree>(t: T, ttype: number, visitor: TreeWizard.ContextVisitor): void;
    /**
     * For all subtrees that match the pattern, execute the visit action.
     *  The implementation uses the root node of the pattern in combination
     *  with visit(t, ttype, visitor) so nil-rooted patterns are not allowed.
     *  Patterns with wildcard roots are also not allowed.
     */
    public visit<T extends CommonTree>(t: T, pattern: string, visitor: TreeWizard.ContextVisitor): void;
    public visit<T extends CommonTree>(...args: unknown[]): void {
        const [t, typeOrPattern, visitor] = args as [T, number | string, TreeWizard.ContextVisitor];
        if (typeof typeOrPattern === "number") {
            this._visit(t, null, 0, typeOrPattern, visitor);
        } else {
            // Create a TreePattern from the pattern
            const tokenizer = new TreePatternLexer(typeOrPattern);
            const parser = new TreePatternParser(tokenizer, this, new TreeWizard.TreePatternTreeAdaptor());
            const tpattern = parser.pattern() as TreeWizard.TreePattern | null;

            // don't allow invalid patterns
            if (tpattern === null || tpattern.isNil() || tpattern instanceof TreeWizard.WildcardTreePattern) {
                return;
            }

            const labels = new Map<string, T>(); // reused for each _parse
            const rootTokenType = tpattern.getType();
            this.visit(t, rootTokenType, new class implements TreeWizard.ContextVisitor {
                public constructor(private readonly $outer: TreeWizard) { };

                public visit(t: CommonTree, parent: CommonTree, childIndex: number): void {
                    labels.clear();
                    if (this.$outer._parse(t, tpattern, labels)) {
                        visitor.visit(t, parent, childIndex, labels);
                    }
                }
            }(this));
        }
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
        const parser = new TreePatternParser(tokenizer, this, new TreeWizard.TreePatternTreeAdaptor());
        const tpattern = parser.pattern() as TreeWizard.TreePattern;
        const matched = this._parse(t, tpattern, labels ?? null);

        return matched;
    }

    /**
     * Create a tree or node from the indicated tree pattern that closely
     *  follows ANTLR tree grammar tree element syntax:
     *
     * 		(root child1 ... child2).
     *
     *  You can also just pass in a node: ID
     *
     *  Any node can have a text argument: ID[foo]
     *  (notice there are no quotes around foo--it's clear it's a string).
     *
     *  nil is a special name meaning "give me a nil node".  Useful for
     *  making lists: (nil A B C) is a list of A B C.
     */
    public create(pattern: string): unknown {
        const tokenizer = new TreePatternLexer(pattern);
        const parser = new TreePatternParser(tokenizer, this, this.adaptor);
        const t = parser.pattern();

        return t;
    }

    /**
     * Compare type, structure, and text of two trees, assuming adaptor in
     *  this instance of a TreeWizard.
     */
    public equals(t1: CommonTree, t2: CommonTree): boolean {
        return TreeWizard._equals(t1, t2, this.adaptor);
    }

    /**
     * Do the work for parse. Check to see if the t2 pattern fits the
     *  structure and token types in t1.  Check text if the pattern has
     *  text arguments on nodes.  Fill labels map with pointers to nodes
     *  in tree matched against nodes in pattern with labels.
     */
    protected _parse(t1: CommonTree, tpattern: TreeWizard.TreePattern,
        labels: Map<string, CommonTree> | null): boolean {
        // check roots (wildcard matches anything)
        if (!(tpattern instanceof TreeWizard.WildcardTreePattern)) {
            if (this.adaptor.getType(t1) !== tpattern.getType()) {
                return false;
            }

            // if pattern has text, check node text
            if (tpattern.hasTextArg && this.adaptor.getText(t1) !== tpattern.getText()) {
                return false;
            }
        }

        if (tpattern.label && labels !== null) {
            // map label in pattern to node in t1
            labels.set(tpattern.label, t1);
        }

        // check children
        const n1 = this.adaptor.getChildCount(t1);
        const n2 = tpattern.getChildCount();
        if (n1 !== n2) {
            return false;
        }
        for (let i = 0; i < n1; i++) {
            const child1 = this.adaptor.getChild(t1, i);
            const child2 = tpattern.getChild(i) as TreeWizard.TreePattern;
            if (child1) {
                if (!this._parse(child1, child2, labels)) {
                    return false;
                }
            }
        }

        return true;
    }

    /** Do the work for index */
    protected _index(t: CommonTree, m: Map<number, CommonTree[]>): void {
        const ttype = this.adaptor.getType(t);
        let elements = m.get(ttype);
        if (!elements) {
            elements = new Array<CommonTree>();
            m.set(ttype, elements);
        }

        elements.push(t);
        const n = this.adaptor.getChildCount(t);
        for (let i = 0; i < n; i++) {
            const child = this.adaptor.getChild(t, i);
            if (child) {
                this._index(child, m);
            }
        }
    }

    /** Do the recursive work for visit */
    protected _visit<T extends CommonTree>(t: T, parent: T | null, childIndex: number, ttype: number,
        visitor: TreeWizard.ContextVisitor): void {
        if (this.adaptor.getType(t) === ttype) {
            visitor.visit(t, parent, childIndex, null);
        }

        const n = this.adaptor.getChildCount(t);
        for (let i = 0; i < n; i++) {
            const child = this.adaptor.getChild(t, i);

            if (child) {
                this._visit(child, t, i, ttype, visitor);
            }
        }
    }

}

export namespace TreeWizard {
    export interface ContextVisitor {
        // TODO: should this be called visit or something else?
        visit(t: CommonTree, parent: CommonTree | null, childIndex: number,
            labels: Map<string, CommonTree> | null): void;
    }

    export type TreePattern = InstanceType<typeof TreeWizard.TreePattern>;
    export type WildcardTreePattern = InstanceType<typeof TreeWizard.WildcardTreePattern>;
    export type TreePatternTreeAdaptor = InstanceType<typeof TreeWizard.TreePatternTreeAdaptor>;
}
