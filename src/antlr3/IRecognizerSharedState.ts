/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: disable

import { Token } from "antlr4ng";

/**
 * The set of fields needed by an abstract recognizer to recognize input
 *  and recover from errors etc...  As a separate state object, it can be
 *  shared among multiple grammars; e.g., when one grammar imports another.
 *
 *  These fields are publically visible but the actual state pointer per
 *  parser is protected.
 */
export interface IRecognizerSharedState {
    /**
     * This is true when we see an error and before having successfully
     *  matched a token.  Prevents generation of more than one error message
     *  per error.
     */
    errorRecovery: boolean;

    /**
     * The index into the input stream where the last error occurred.
     * This is used to prevent infinite loops where an error is found
     * but no token is consumed during recovery...another error is found,
     * ad naseum.  This is a failsafe mechanism to guarantee that at least
     * one token/tree node is consumed for two errors.
     */
    lastErrorIndex: number;

    /**
     * In lieu of a return value, this indicates that a rule or token
     * has failed to match.  Reset to false upon valid token match.
     */
    failed: boolean;

    /** Did the recognizer encounter a syntax error?  Track how many. */
    syntaxErrors: number;

    /**
     * If 0, no backtracking is going on.  Safe to exec actions etc...
     * If &gt;0 then it's the level of backtracking.
     */
    backtracking: number;

    /**
     * An array[size num rules] of Map&lt;Integer,Integer&gt; that tracks
     * the stop token index for each rule.  ruleMemo[ruleIndex] is
     * the memoization table for ruleIndex.  For key ruleStartIndex, you
     * get back the stop token for associated rule or MEMO_RULE_FAILED.
     *
     * This is only used if rule memoization is on (which it is by default).
     */
    ruleMemo: Array<Map<number, number> | null> | null;

    // LEXER FIELDS (must be in same state object to avoid casting
    //               constantly in generated code and Lexer object) :(

    /**
     * The goal of all lexer rules/methods is to create a token object.
     * This is an instance variable as multiple rules may collaborate to
     * create a single token.  nextToken will return this object after
     * matching lexer rule(s).  If you subclass to allow multiple token
     * emissions, then set this to the last token to be matched or
     * something nonnull so that the auto token emit mechanism will not
     * emit another token.
     */
    token: Token | null;

    /**
     * What character index in the stream did the current token start at?
     * Needed, for example, to get the text for current token.  Set at
     * the start of nextToken.
     */
    tokenStartCharIndex: number;

    /** The line on which the first character of the token resides */
    tokenStartLine: number;

    /** The character position of first character within the line */
    tokenStartCharPositionInLine: number;

    /** The channel number for the current token */
    channel: number;

    /** The token type for the current token */
    type: number;

    /**
     * You can set the text for the current token to override what is in
     * the input char buffer.  Use setText() or can set this instance var.
     */
    text: string;
}

export const createRecognizerSharedState = (): IRecognizerSharedState => {
    return {
        errorRecovery: false,
        lastErrorIndex: -1,
        failed: false,
        syntaxErrors: 0,
        backtracking: 0,
        ruleMemo: null,
        token: null,
        tokenStartCharIndex: -1,
        tokenStartLine: 0,
        tokenStartCharPositionInLine: 0,
        channel: Token.DEFAULT_CHANNEL,
        type: Token.INVALID_TYPE,
        text: "",
    };
};
