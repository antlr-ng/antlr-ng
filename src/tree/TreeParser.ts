/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { Token, type RecognitionException } from "antlr4ng";

import { Constants } from "../Constants.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { ErrorManager } from "../tool/ErrorManager.js";
import { ErrorType } from "../tool/ErrorType.js";
import { CommonTree } from "./CommonTree.js";
import { CommonTreeNodeStream } from "./CommonTreeNodeStream.js";
import { MismatchedTreeNodeException } from "./exceptions/MismatchTreeNodeException.js";

/**
 * A parser for a stream of tree nodes. Tree walkers result in a subclass of this. All the error reporting
 * and recovery is shared with Parser via the BaseRecognizer superclass.
 */
export class TreeParser {
    protected input: CommonTreeNodeStream;
    protected errorManager: ErrorManager;

    /**
     * This is true when we see an error and before having successfully matched a token. Prevents generation of more
     * than one error message per error.
     */
    protected errorRecovery = false;

    /**
     * In lieu of a return value, this indicates that a rule or token has failed to match. Reset to false upon valid
     * token match.
     */
    protected failed = false;

    /** If 0, no backtracking is going on. Safe to exec actions etc... If > 0 then it's the level of backtracking. */
    protected backtracking = 0;

    public constructor(errorManager: ErrorManager, input?: CommonTreeNodeStream) {
        this.errorManager = errorManager;
        this.input = input ?? new CommonTreeNodeStream(new CommonTree());
    }

    private static getAncestor(tokenNames: string[], t: CommonTree | null, goal: string): CommonTree | null {
        while (t !== null) {
            const name = tokenNames[t.getType()];
            if (name === goal) {
                return t;
            }

            t = t.parent;
        }

        return null;
    }

    /**
     * Match '.' in tree parser has special meaning. Skip node or entire tree if node has children. If children,
     * scan until corresponding UP node.
     */
    public matchAny(): void {
        this.errorRecovery = false;
        this.failed = false;

        let lookAhead = this.input.lookaheadType(1);
        if (lookAhead && lookAhead.children.length === 0) {
            // Not subtree - consume 1 node and return.
            this.input.consume();

            return;
        }

        // Current node is a subtree, skip to corresponding UP. Must count nesting level to get right UP.
        let level = 0;
        if (lookAhead) {
            let tokenType = lookAhead.getType();
            while (tokenType !== Token.EOF && !(tokenType === Constants.UP && level === 0)) {
                this.input.consume();
                lookAhead = this.input.lookaheadType(1);
                if (lookAhead) {
                    tokenType = lookAhead.getType();
                    if (tokenType === Constants.DOWN) {
                        ++level;
                    } else {
                        if (tokenType === Constants.UP) {
                            --level;
                        }
                    }
                }
            }
        }

        this.input.consume(); // Consume UP.
    }

    /**
     * Check if current node in input has a context.  Context means sequence of nodes towards root of tree. For
     * example, you might say context is "MULT" which means my parent must be MULT. "CLASS VARDEF" says current node
     * must be child of a VARDEF and whose parent is a CLASS node. You can use "..." to mean zero-or-more nodes.
     * "METHOD ... VARDEF" means my parent is VARDEF and somewhere above that is a METHOD node. The first node in t
     * he context is not necessarily the root. The context matcher stops matching and returns true when it runs out
     * of context. There is no way to force the first node to be the root.
     */
    public inContext(context: string): boolean {
        context = context.trim();
        const nodes = context.split(/\s+/);
        let ni = nodes.length - 1;

        const t = this.input.lookaheadType(1)!;
        const tokenNames = this.getTokenNames();

        let run: CommonTree | null = t.parent;
        while (ni >= 0 && run !== null) {
            if (nodes[ni] === "...") {
                // Walk upwards until we see nodes[ni - 1] then continue walking.
                if (ni === 0) {
                    return true;
                }

                // ... at start is no-op.
                const goal = nodes[ni - 1];
                const ancestor = TreeParser.getAncestor(tokenNames, run, goal);
                if (ancestor === null) {
                    return false;
                }

                run = ancestor;
                ni--;
            }

            const name = tokenNames[run.getType()];
            if (name !== nodes[ni]) {
                return false;
            }

            // Advance to parent and to previous element in context node list.
            ni--;
            run = run.parent;
        }

        if (run === null && ni >= 0) {
            return false;
        }

        // At root but more nodes to match.
        return true;
    }

    /**
     * Match current input symbol against ttype. Attempt single token insertion or deletion error recovery. If
     * that fails, throw MismatchedTokenException.
     */
    public match<T extends GrammarAST = GrammarAST>(input: CommonTreeNodeStream, ttype: number): T | null {
        this.failed = false;

        const matchedSymbol = input.lookaheadType(1) as T | null;
        if (input.lookahead(1) === ttype) {
            input.consume();
            this.errorRecovery = false;

            return matchedSymbol;
        }

        if (this.backtracking > 0) {
            this.failed = true;

            return matchedSymbol;
        }

        throw new MismatchedTreeNodeException(ttype);
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
        if (this.errorRecovery) {
            return;
        }

        this.errorRecovery = true;
        this.errorManager.toolError(ErrorType.INTERNAL_ERROR, e);
    }

    /**
     * Used to print out token names like ID during debugging and error reporting.  The generated parsers implement
     * a method that overrides this to point to their String[] tokenNames.
     */
    protected getTokenNames(): string[] {
        return [];
    }
}
