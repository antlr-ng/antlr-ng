/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: disable

import type { IntStream, TokenStream } from "antlr4ng";
import type { CommonTree } from "../../tree/CommonTree.js";
import type { TreeAdaptor } from "./TreeAdaptor.js";

/** A stream of tree nodes, accessing nodes from a tree of some kind */
export interface TreeNodeStream extends IntStream {
    /**
     * Get a tree node at an absolute index {@code i}; 0..n-1.
     *  If you don't want to buffer up nodes, then this method makes no
     *  sense for you.
     */
    get(i: number): CommonTree;

    /**
     * Get tree node at current input pointer + {@code k} ahead where
     * {@code k==1} is next node. {@code k<0} indicates nodes in the past. So
     * {@code LT(-1)} is previous node, but implementations are not required to
     * provide results for {@code k < -1}. {@code LT(0)} is undefined. For
     * {@code k<=n}, return {@code null}. Return {@code null} for {@code LT(0)}
     * and any index that results in an absolute address that is negative.
     * <p>
     * This is analogous to {@link TokenStream#LT}, but this returns a tree node
     * instead of a {@link Token}. Makes code generation identical for both
     * parser and tree grammars.</p>
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LT(k: number): CommonTree | null;

    /**
     * Where is this stream pulling nodes from?  This is not the name, but
     *  the object that provides node objects.
     */
    getTreeSource(): unknown;

    /**
     * If the tree associated with this stream was created from a
     * {@link TokenStream}, you can specify it here. Used to do rule
     * {@code $text} attribute in tree parser. Optional unless you use tree
     * parser rule {@code $text} attribute or {@code output=template} and
     * {@code rewrite=true} options.
     */
    getTokenStream(): TokenStream;

    /**
     * What adaptor can tell me how to interpret/navigate nodes and
     *  trees.  E.g., get text of a node.
     */
    getTreeAdaptor(): TreeAdaptor;

    /**
     * As we flatten the tree, we use {@link Token#UP}, {@link Token#DOWN} nodes
     * to represent the tree structure. When debugging we need unique nodes so
     * we have to instantiate new ones. When doing normal tree parsing, it's
     * slow and a waste of memory to create unique navigation nodes. Default
     * should be {@code false}.
     */
    setUniqueNavigationNodes(uniqueNavigationNodes: boolean): void;

    /**
     * Reset the tree node stream in such a way that it acts like
     *  a freshly constructed stream.
     */
    reset(): void;

    /**
     * Return the text of all nodes from {@code start} to {@code stop},
     * inclusive. If the stream does not buffer all the nodes then it can still
     * walk recursively from start until stop. You can always return
     * {@code null} or {@code ""} too, but users should not access
     * {@code $ruleLabel.text} in an action of course in that case.
     */
    toString(start: unknown, stop: unknown): string;

    // REWRITING TREES (used by tree parser)

    /**
     * Replace children of {@code parent} from index {@code startChildIndex} to
     * {@code stopChildIndex} with {@code t}, which might be a list. Number of
     * children may be different after this call. The stream is notified because
     * it is walking the tree and might need to know you are monkeying with the
     * underlying tree. Also, it might be able to modify the node stream to
     * avoid restreaming for future phases.
     * <p>
     * If {@code parent} is {@code null}, don't do anything; must be at root of
     * overall tree. Can't replace whatever points to the parent externally. Do
     * nothing.</p>
     */
    replaceChildren(parent: unknown, startChildIndex: number, stopChildIndex: number, t: unknown): void;
}
