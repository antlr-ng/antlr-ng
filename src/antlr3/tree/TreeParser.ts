/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

import {
    CommonToken, Token, type BitSet, type IntStream, type RecognitionException,
} from "antlr4ng";

import { Constants } from "../../Constants.js";
import type { CommonTree } from "../../tree/CommonTree.js";
import { BaseRecognizer } from "../BaseRecognizer.js";
import type { IRecognizerSharedState } from "../IRecognizerSharedState.js";
import type { TreeAdaptor } from "./TreeAdaptor.js";
import type { TreeNodeStream } from "./TreeNodeStream.js";
import { MismatchedTreeNodeException } from "../MismatchTreeNodeException.js";

/**
 * A parser for a stream of tree nodes.  "tree grammars" result in a subclass
 *  of this.  All the error reporting and recovery is shared with Parser via
 *  the BaseRecognizer superclass.
 */
export class TreeParser extends BaseRecognizer {
    // precompiled regex used by inContext
    static #dotdot = /.*[^.]\\.\\.[^.].*/g;
    static #doubleEtc = /.*\\.\\.\\.\\s+\\.\\.\\..*/g;

    #input?: TreeNodeStream;

    public constructor(input?: TreeNodeStream, state?: IRecognizerSharedState) {
        super(state);
        this.#input = input;
    }

    /**
     * The worker for inContext. It's static and full of parameters for testing purposes.
     */
    public static inContext(adaptor: TreeAdaptor, tokenNames: string[], t: CommonTree | null,
        context: string): boolean {
        if (context.match(TreeParser.#dotdot)) { // don't allow "..", must be "..."
            throw new Error("invalid syntax: ..");
        }

        if (context.match(TreeParser.#doubleEtc)) { // don't allow double "..."
            throw new Error("invalid syntax: ... ...");
        }

        context = context.replaceAll("\\.\\.\\.", " ... "); // ensure spaces around ...
        context = context.trim();
        const nodes = context.split(/\s+/);
        let ni = nodes.length - 1;
        t = adaptor.getParent(t);
        while (ni >= 0 && t !== null) {
            if (nodes[ni] === "...") {
                // walk upwards until we see nodes[ni-1] then continue walking
                if (ni === 0) {
                    return true;
                }

                // ... at start is no-op
                const goal = nodes[ni - 1];
                const ancestor = TreeParser.getAncestor(adaptor, tokenNames, t, goal);
                if (ancestor === null) {
                    return false;
                }

                t = ancestor;
                ni--;
            }

            const name = tokenNames[adaptor.getType(t)];
            if (name !== nodes[ni]) {
                return false;
            }

            // advance to parent and to previous element in context node list
            ni--;
            t = adaptor.getParent(t);
        }

        if (t === null && ni >= 0) {
            return false;
        }

        // at root but more nodes to match
        return true;
    }

    /** Helper for static inContext */
    protected static getAncestor(adaptor: TreeAdaptor, tokenNames: string[], t: CommonTree | null,
        goal: string): CommonTree | null {
        while (t !== null) {
            const name = tokenNames[adaptor.getType(t)];
            if (name === goal) {
                return t;
            }

            t = adaptor.getParent(t);
        }

        return null;
    }

    public override reset(): void {
        super.reset(); // reset all recognizer state variables
        this.#input!.seek(0); // rewind the input
    }

    public set input(input: TreeNodeStream) {
        this.#input = input;
    }

    public get input(): TreeNodeStream {
        return this.#input!;
    }

    public getSourceName(): string {
        return this.#input!.getSourceName();
    }

    /**
     * Match '.' in tree parser has special meaning.  Skip node or
     *  entire tree if node has children.  If children, scan until
     *  corresponding UP node.
     */
    public override matchAny(input: IntStream): void {
        this.state.errorRecovery = false;
        this.state.failed = false;

        const stream = this.#input ?? input as TreeNodeStream;
        let look = stream.LT(1)!;
        if (stream.getTreeAdaptor().getChildCount(look) === 0) {
            input.consume(); // not subtree, consume 1 node and return

            return;
        }
        // current node is a subtree, skip to corresponding UP.
        // must count nesting level to get right UP
        let level = 0;
        let tokenType = stream.getTreeAdaptor().getType(look);
        while (tokenType !== Token.EOF && !(tokenType === Constants.UP && level === 0)) {
            input.consume();
            look = stream.LT(1)!;
            tokenType = stream.getTreeAdaptor().getType(look);
            if (tokenType === Constants.DOWN) {
                level++;
            } else {
                if (tokenType === Constants.UP) {
                    level--;
                }
            }
        }

        input.consume(); // consume UP
    }

    /**
     * Prefix error message with the grammar name because message is
     *  always intended for the programmer because the parser built
     *  the input tree not the user.
     */
    public override getErrorHeader(e: RecognitionException): string {
        return this.getGrammarFileName() + ": node from line " + e.offendingToken?.line + ":" +
            e.offendingToken?.column;
    }

    /**
     * Tree parsers parse nodes they usually have a token object as
     *  payload. Set the exception token and do the default behavior.
     */
    public override getErrorMessage(e: RecognitionException, tokenNames: string[]): string {
        /*if (this instanceof TreeParser) {
            const adaptor = (e.input as TreeNodeStream).getTreeAdaptor();
            e.token = adaptor.getToken(e.node);
            if (e.token === null) { // could be an UP/DOWN node
                e.token = new CommonToken(adaptor.getType(e.node), adaptor.getText(e.node));
            }
        }*/

        return super.getErrorMessage(e, tokenNames);
    }

    /**
     * Check if current node in input has a context.  Context means sequence
     *  of nodes towards root of tree.  For example, you might say context
     *  is "MULT" which means my parent must be MULT.  "CLASS VARDEF" says
     *  current node must be child of a VARDEF and whose parent is a CLASS node.
     *  You can use "..." to mean zero-or-more nodes.  "METHOD ... VARDEF"
     *  means my parent is VARDEF and somewhere above that is a METHOD node.
     *  The first node in the context is not necessarily the root.  The context
     *  matcher stops matching and returns true when it runs out of context.
     *  There is no way to force the first node to be the root.
     */
    public inContext(context: string): boolean {
        return TreeParser.inContext(this.#input!.getTreeAdaptor(), this.getTokenNames(), this.#input!.LT(1), context);
    }

    public override traceIn(ruleName: string, ruleIndex: number): void {
        super.traceIn(ruleName, ruleIndex, this.#input!.LT(1));
    }

    public override traceOut(ruleName: string, ruleIndex: number): void {
        super.traceOut(ruleName, ruleIndex, this.#input!.LT(1));
    }

    /**
     * We have DOWN/UP nodes in the stream that have no line info; override.
     *  plus we want to alter the exception type.  Don't try to recover
     *  from tree parser errors inline...
     */
    protected override recoverFromMismatchedToken(input: IntStream, ttype: number, follow: BitSet): CommonTree | null {
        throw new MismatchedTreeNodeException(ttype, this.#input!);
    }

    protected override getCurrentInputSymbol(input: IntStream): CommonTree | null {
        return (input as TreeNodeStream).LT(1);
    }

    protected override getMissingSymbol(input: IntStream, e: RecognitionException, expectedTokenType: number,
        follow: BitSet): CommonTree {
        const tokenText = "<missing " + this.getTokenNames()[expectedTokenType] + ">";
        const adaptor = this.#input!.getTreeAdaptor();

        return adaptor.create(CommonToken.fromType(expectedTokenType, tokenText));
    }

}
