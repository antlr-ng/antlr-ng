/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

// cspell: disable

import {
    CommonToken, Token, type BitSet, type IntStream, type RecognitionException,
} from "antlr4ng";

import type { CommonTreeAdaptor } from "./CommonTreeAdaptor.js";
import { Constants } from "../Constants.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import { CommonTree } from "./CommonTree.js";
import { CommonTreeNodeStream } from "./CommonTreeNodeStream.js";
import { createRecognizerSharedState, type IRecognizerSharedState } from "./misc/IRecognizerSharedState.js";
import { MismatchedTreeNodeException } from "./MismatchTreeNodeException.js";

/**
 * A parser for a stream of tree nodes.  "tree grammars" result in a subclass
 *  of this.  All the error reporting and recovery is shared with Parser via
 *  the BaseRecognizer superclass.
 */
export abstract class TreeParser {
    // precompiled regex used by inContext
    private static dotdot = /.*[^.]\\.\\.[^.].*/g;
    private static doubleEtc = /.*\\.\\.\\.\\s+\\.\\.\\..*/g;

    protected input: CommonTreeNodeStream;

    /**
     * State of a lexer, parser, or tree parser are collected into a state object so the state can be shared.
     * This sharing is needed to have one grammar import others and share same error variables and other state
     * variables.  It's a kind of explicit multiple inheritance via delegation of methods and shared state.
     */
    protected state: IRecognizerSharedState;

    public constructor(input?: CommonTreeNodeStream, state?: IRecognizerSharedState) {
        this.state = state ?? createRecognizerSharedState();
        this.input = input ?? new CommonTreeNodeStream(new CommonTree());
    }

    /**
     * The worker for inContext. It's static and full of parameters for testing purposes.
     */
    public static inContext(adaptor: CommonTreeAdaptor, tokenNames: string[], t: CommonTree | null,
        context: string): boolean {
        if (context.match(TreeParser.dotdot)) { // don't allow "..", must be "..."
            throw new Error("invalid syntax: ..");
        }

        if (context.match(TreeParser.doubleEtc)) { // don't allow double "..."
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
    protected static getAncestor(adaptor: CommonTreeAdaptor, tokenNames: string[], t: CommonTree | null,
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

    public reset(): void {
        // wack everything related to error recovery
        this.state.errorRecovery = false;
        this.state.lastErrorIndex = -1;
        this.state.failed = false;
        this.state.syntaxErrors = 0;

        // wack everything related to backtracking and memoization
        this.state.backtracking = 0;
        for (let i = 0; this.state.ruleMemo !== null && i < this.state.ruleMemo.length; i++) { // wipe cache
            this.state.ruleMemo[i] = null;
        }

        this.input.seek(0); // rewind the input
    }

    public getSourceName(): string {
        return this.input.getSourceName();
    }

    /**
     * Match '.' in tree parser has special meaning.  Skip node or
     *  entire tree if node has children.  If children, scan until
     *  corresponding UP node.
     */
    public matchAny(): void {
        this.state.errorRecovery = false;
        this.state.failed = false;

        let look = this.input.LT(1);
        if (look && this.input.getTreeAdaptor().getChildCount(look) === 0) {
            this.input.consume(); // not subtree, consume 1 node and return

            return;
        }

        // current node is a subtree, skip to corresponding UP.
        // must count nesting level to get right UP
        let level = 0;

        if (look) {
            let tokenType = this.input.getTreeAdaptor().getType(look);
            while (tokenType !== Token.EOF && !(tokenType === Constants.UP && level === 0)) {
                this.input.consume();
                look = this.input.LT(1);
                if (look) {
                    tokenType = this.input.getTreeAdaptor().getType(look);
                    if (tokenType === Constants.DOWN) {
                        level++;
                    } else {
                        if (tokenType === Constants.UP) {
                            level--;
                        }
                    }
                }
            }
        }

        this.input.consume(); // consume UP
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
        return TreeParser.inContext(this.input.getTreeAdaptor(), this.getTokenNames(), this.input.LT(1), context);
    }

    /**
     * Match current input symbol against ttype.  Attempt
     *  single token insertion or deletion error recovery.  If
     *  that fails, throw MismatchedTokenException.
     *
     *  To turn off single token insertion or deletion error
     *  recovery, override recoverFromMismatchedToken() and have it
     *  throw an exception. See TreeParser.recoverFromMismatchedToken().
     *  This way any error in a rule will cause an exception and
     *  immediate exit from rule.  Rule would recover by resynchronizing
     *  to the set of symbols that can follow rule ref.
     */
    public match(input: IntStream, ttype: number): GrammarAST | null {
        this.state.failed = false;

        const matchedSymbol = this.getCurrentInputSymbol(input) as GrammarAST | null;
        if (input.LA(1) === ttype) {
            input.consume();
            this.state.errorRecovery = false;

            return matchedSymbol;
        }

        if (this.state.backtracking > 0) {
            this.state.failed = true;

            return matchedSymbol;
        }

        return this.recoverFromMismatchedToken(input, ttype);
    }

    /**
     * Report a recognition problem.
     *
     * This method sets errorRecovery to indicate the parser is recovering not parsing.  Once in recovery mode,
     * no errors are generated. To get out of recovery mode, the parser must successfully match
     * a token (after a resync). So it will go:
     *
     *   1. error occurs
     * 	 2. enter recovery mode, report error
     * 	 3. consume until token found in resynch set
     * 	 4. try to resume parsing
     * 	 5. next match() will reset errorRecovery mode
     *
     *  If you override, make sure to update syntaxErrors if you care about that.
     */
    public reportError(e: RecognitionException): void {
        // If we've already reported an error and have not matched a token yet successfully, don't report any errors.
        if (this.state.errorRecovery) {
            return;
        }

        this.state.syntaxErrors++;
        this.state.errorRecovery = true;

        this.displayRecognitionError(e);
    }

    public displayRecognitionError(e: RecognitionException): void {
        const hdr = this.getErrorHeader(e);
        const msg = this.getErrorMessage(e);

        // XXX: switch to the error manager.
        console.error(hdr + " " + msg);
    }

    /**
     * Prefix error message with the grammar name because message is
     *  always intended for the programmer because the parser built
     *  the input tree not the user.
     */
    protected getErrorHeader(e: RecognitionException): string {
        return this.constructor.name + ": node from line " + e.offendingToken?.line + ":" +
            e.offendingToken?.column;
    }

    /**
     * What error message should be generated for the various
     *  exception types?
     *
     *  Not very object-oriented code, but I like having all error message
     *  generation within one method rather than spread among all of the
     *  exception classes. This also makes it much easier for the exception
     *  handling because the exception classes do not have to have pointers back
     *  to this object to access utility routines and so on. Also, changing
     *  the message for an exception type would be difficult because you
     *  would have to subclassing exception, but then somehow get ANTLR
     *  to make those kinds of exception objects instead of the default.
     *  This looks weird, but trust me--it makes the most sense in terms
     *  of flexibility.
     *
     *  For grammar debugging, you will want to override this to add
     *  more information such as the stack frame with
     *  getRuleInvocationStack(e, this.getClass().getName()) and,
     *  for no viable alts, the decision description and state etc...
     *
     *  Override this to change the message generated for one or more
     *  exception types.
     */
    protected getErrorMessage(e: RecognitionException): string {
        let msg = e.message;
        if (e.offendingToken !== null) {
            const tokenName = e.offendingToken.text;
            msg = "extraneous input " + this.getTokenErrorDisplay(e.offendingToken) + " expecting " + tokenName;
        }

        return msg;
    }

    /**
     * How should a token be displayed in an error message? The default
     *  is to display just the text, but during development you might
     *  want to have a lot of information spit out.  Override in that case
     *  to use t.toString() (which, for CommonToken, dumps everything about
     *  the token). This is better than forcing you to override a method in
     *  your token objects because you don't have to go modify your lexer
     *  so that it creates a new Java type.
     */
    protected getTokenErrorDisplay(t: Token): string {
        let s = t.text;
        if (!s) {
            if (t.type === Token.EOF) {
                s = "<EOF>";
            } else {
                s = "<" + t.type + ">";
            }
        }

        s = s.replaceAll("\n", "\\\\n");
        s = s.replaceAll("\r", "\\\\r");
        s = s.replaceAll("\t", "\\\\t");

        return "'" + s + "'";
    }

    protected setBacktrackingLevel(n: number): void {
        this.state.backtracking = n;
    }

    /** Return whether or not a backtracking attempt failed. */
    protected get failed(): boolean {
        return this.state.failed;
    }

    protected set failed(value: boolean) {
        this.state.failed = value;
    }

    /**
     * We have DOWN/UP nodes in the stream that have no line info; override.
     *  plus we want to alter the exception type.  Don't try to recover
     *  from tree parser errors inline...
     */
    protected recoverFromMismatchedToken(input: IntStream, ttype: number): GrammarAST {
        throw new MismatchedTreeNodeException(ttype);
    }

    protected getCurrentInputSymbol(input: IntStream): CommonTree | null {
        return (input as CommonTreeNodeStream).LT(1);
    }

    protected getMissingSymbol(input: CommonTreeNodeStream, e: RecognitionException, expectedTokenType: number,
        follow: BitSet): CommonTree {
        const tokenText = "<missing " + this.getTokenNames()[expectedTokenType] + ">";
        const adaptor = (input).getTreeAdaptor();

        return adaptor.create(CommonToken.fromType(expectedTokenType, tokenText));
    }

    /**
     * Used to print out token names like ID during debugging and
     *  error reporting.  The generated parsers implement a method
     *  that overrides this to point to their String[] tokenNames.
     */
    protected abstract getTokenNames(): string[];

}
