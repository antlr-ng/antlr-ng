/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { CommonToken, Token } from "antlr4ng";

import { Constants } from "../../../src/Constants.js";
import { CommonTree } from "../../../src/tree/CommonTree.js";
import { CommonTreeNodeStream } from "../../../src/tree/CommonTreeNodeStream.js";
import { TreeIterator } from "../../../src/tree/TreeIterator.js";
import { EarlyExitException } from "../../../src/tree/exceptions/EarlyExitException.js";
import { FailedPredicateException } from "../../../src/tree/exceptions/FailedPredicateException.js";
import { NoViableAltException } from "../../../src/tree/exceptions/NoViableAltException.js";

/**
 * Creates a tree node with the given type and text (and token index = type for easy identification).
 *
 * @param type The token type.
 * @param text The token text.
 * @param tokenIndex The token index.
 *
 * @returns The new node.
 */
const node = (type: number, text: string, tokenIndex = type): CommonTree => {
    const token = CommonToken.fromType(type, text);
    token.tokenIndex = tokenIndex;
    token.line = type;
    token.column = type * 10;

    return new CommonTree(token);
};

/**
 * Builds the tree (A (B C D) E).
 *
 * @returns The root node.
 */
const buildTree = (): CommonTree => {
    const a = node(1, "A");
    const b = node(2, "B");
    b.addChild(node(3, "C"));
    b.addChild(node(4, "D"));
    a.addChild(b);
    a.addChild(node(5, "E"));

    return a;
};

describe("Tree infrastructure coverage", () => {
    describe("CommonTree", () => {
        it("renders trees, positions and token boundaries", () => {
            const tree = buildTree();
            expect(tree.toStringTree()).toBe("(A (B C D) E)");
            expect(tree.toString()).toBe("A");
            expect(tree.getType()).toBe(1);
            expect(tree.getLine()).toBe(1);
            expect(tree.getCharPositionInLine()).toBe(10);
            expect(tree.getTokenStartIndex()).toBe(1);
            expect(tree.getTokenStopIndex()).toBe(1);

            tree.setUnknownTokenBoundaries();
            const leaf = tree.children[1];
            expect(leaf.startIndex).toBe(5);
            expect(leaf.stopIndex).toBe(5);
            expect(leaf.getSourceInterval().toString()).toBe("5..5");

            // Explicit boundaries are kept.
            tree.setTokenStartIndex(0);
            tree.setTokenStopIndex(9);
            tree.setUnknownTokenBoundaries();
            expect(tree.getSourceInterval().toString()).toBe("0..9");
        });

        it("nil nodes take their position from the first child", () => {
            const nil = new CommonTree();
            expect(nil.isNil()).toBe(true);
            expect(nil.toString()).toBe("nil");
            expect(nil.getType()).toBe(Token.INVALID_TYPE);
            expect(nil.getLine()).toBe(0);
            expect(nil.getCharPositionInLine()).toBe(0);
            expect(nil.getText()).toBe("");

            nil.addChild(node(7, "X"));
            expect(nil.getLine()).toBe(7);
            expect(nil.getCharPositionInLine()).toBe(70);
            expect(nil.toStringTree()).toBe("X");

            nil.addChild(node(8, "Y"));
            expect(nil.toStringTree()).toBe("X Y");
        });

        it("adding a nil node merges its children", () => {
            const root = node(1, "R");
            root.addChild(undefined);
            expect(root.children).toHaveLength(0);

            const nil = new CommonTree();
            nil.addChild(node(2, "A"));
            nil.addChild(node(3, "B"));
            root.addChild(nil);

            expect(root.toStringTree()).toBe("(R A B)");
            expect(root.children[0].parent).toBe(root);
            expect(root.children[1].childIndex).toBe(1);

            const copy = root.dupNode();
            expect(copy.getText()).toBe("R");
            expect(copy.children).toHaveLength(0);
        });

        it("replaces child ranges with fewer, equal and more nodes", () => {
            const tree = buildTree();

            // Same number of nodes.
            tree.replaceChildren(0, 0, node(9, "N"));
            expect(tree.toStringTree()).toBe("(A N E)");
            expect(tree.children[0].parent).toBe(tree);

            // Fewer nodes than replaced.
            const nil = new CommonTree();
            nil.addChild(node(10, "P"));
            tree.replaceChildren(0, 1, nil);
            expect(tree.toStringTree()).toBe("(A P)");
            expect(tree.children[0].childIndex).toBe(0);

            // More nodes than replaced.
            const more = new CommonTree();
            more.addChild(node(11, "Q"));
            more.addChild(node(12, "R"));
            more.addChild(node(13, "S"));
            tree.replaceChildren(0, 0, more);
            expect(tree.toStringTree()).toBe("(A Q R S)");
            expect(tree.children[2].childIndex).toBe(2);
            expect(tree.children[2].parent).toBe(tree);

            expect(() => { node(1, "X").replaceChildren(0, 0, node(2, "Y")); })
                .toThrow("indexes invalid; no children in list");
        });

        it("inserts, sets and deletes children", () => {
            const tree = buildTree();
            tree.insertChild(1, node(6, "F"));
            expect(tree.toStringTree()).toBe("(A (B C D) F E)");
            tree.setChild(1, node(7, "G"));
            expect(tree.toStringTree()).toBe("(A (B C D) G E)");
            expect(tree.deleteChild(1)!.getText()).toBe("G");
            expect(tree.toStringTree()).toBe("(A (B C D) E)");
            expect(tree.children[1].childIndex).toBe(1);

            tree.addChildren([node(8, "H"), node(9, "I")]);
            expect(tree.toStringTree()).toBe("(A (B C D) E H I)");
            tree.sanityCheckParentAndChildIndexes();

            expect(tree.getFirstChildWithType(5)!.getText()).toBe("E");
            expect(tree.getFirstChildWithType(99)).toBeNull();

            const c = tree.children[0].children[0];
            expect(c.getAncestor(1)).toBe(tree);
            expect(c.getAncestor(2)).toBe(tree.children[0]);
            expect(c.getAncestor(99)).toBeNull();
            expect(tree.getAncestor(1)).toBeNull();
        });
    });

    describe("TreeIterator", () => {
        it("walks a tree in pre-order with DOWN/UP markers", () => {
            const iterator = new TreeIterator(buildTree());
            const names: string[] = [];
            while (iterator.hasNext()) {
                const next = iterator.nextTree()!;
                names.push(next.getText());
                if (next === TreeIterator.eof) {
                    break;
                }
            }

            expect(names).toEqual(["A", "DOWN", "B", "DOWN", "C", "D", "UP", "E", "UP", "EOF"]);
            expect(iterator.hasNext()).toBe(false);
            expect(iterator.nextTree()).toBe(TreeIterator.eof);

            iterator.reset();
            expect(iterator.hasNext()).toBe(true);
            expect(iterator.nextTree()!.getText()).toBe("A");
            expect(() => { iterator.remove(); }).toThrow("Remove is unsupported");
        });

        it("handles single node trees", () => {
            const iterator = new TreeIterator(node(1, "Single"));
            expect(iterator.nextTree()!.getText()).toBe("Single");
            expect(iterator.hasNext()).toBe(true);
            expect(iterator.nextTree()).toBe(TreeIterator.eof);
        });
    });

    describe("CommonTreeNodeStream", () => {
        it("provides lookahead, consumption, marks and seeks", () => {
            const stream = new CommonTreeNodeStream(buildTree());
            expect(stream.lookaheadType(0)).toBeNull();
            expect(stream.lookahead(1)).toBe(1);
            expect(stream.lookahead(2)).toBe(Constants.Down);
            expect(stream.lookahead(3)).toBe(2);
            expect(stream.lookahead(20)).toBe(Token.EOF);
            expect(stream.isEOF(stream.lookaheadType(20)!)).toBe(true);

            stream.consume();
            expect(stream.index).toBe(1);
            expect(stream.lookahead(1)).toBe(Constants.Down);
            expect(stream.lookaheadType(-1)!.getText()).toBe("A");

            const marker = stream.mark();
            stream.consume();
            expect(stream.lookaheadType(-1)!.getText()).toBe("DOWN");
            stream.consume();
            expect(stream.lookaheadType(1)!.getText()).toBe("DOWN");
            stream.seek(1);
            expect(stream.lookahead(1)).toBe(Constants.Down);
            stream.release(marker);

            expect(() => { stream.seek(-1); }).toThrow("can't seek before the beginning of the input");

            // Walk to the end.
            const types: number[] = [];
            while (stream.lookahead(1) !== Token.EOF) {
                types.push(stream.lookahead(1));
                stream.consume();
            }
            expect(types).toEqual([Constants.Down, 2, Constants.Down, 3, 4, Constants.Up, 5, Constants.Up]);
        });

        it("skips nil roots", () => {
            const nil = new CommonTree();
            nil.addChild(node(1, "A"));
            nil.addChild(node(2, "B"));

            const stream = new CommonTreeNodeStream(nil);
            expect(stream.lookahead(1)).toBe(1);
            expect(stream.lookahead(2)).toBe(2);
            expect(stream.lookahead(3)).toBe(Token.EOF);
        });
    });

    describe("exceptions", () => {
        it("carry their decision information", () => {
            const earlyExit = new EarlyExitException(3);
            expect(earlyExit.decisionNumber).toBe(3);
            expect(earlyExit.message).toBe("@[3]");

            const noViableAlt = new NoViableAltException(7, 9);
            expect(noViableAlt.decisionNumber).toBe(7);
            expect(noViableAlt.stateNumber).toBe(9);
            expect(noViableAlt.message).toBe("@[<no viable alt>]");

            const failedPredicate = new FailedPredicateException("rule");
            expect(failedPredicate.ruleName).toBe("rule");
        });
    });
});
