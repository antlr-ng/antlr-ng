/* java2ts: keep */

/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

// cspell: disable

import { BitSet, RecognitionException, Token, type IntStream, type TokenStream } from "antlr4ng";

import { RecognizerSharedState } from "./RecognizerSharedState.js";
import { TreeParser } from "./tree/TreeParser.js";
import type { Tree } from "./tree/Tree.js";

/**
 * A generic recognizer that can handle recognizers generated from
 *  lexer, parser, and tree grammars.  This is all the parsing
 *  support code essentially; most of it is error recovery stuff and
 *  backtracking.
 */
export abstract class BaseRecognizer {
    public static readonly MEMO_RULE_FAILED = -2;
    public static readonly MEMO_RULE_UNKNOWN = -1;
    public static readonly INITIAL_FOLLOW_STACK_SIZE = 100;

    // copies from Token object for convenience in actions
    public static readonly DEFAULT_TOKEN_CHANNEL = Token.DEFAULT_CHANNEL;
    public static readonly HIDDEN = Token.HIDDEN_CHANNEL;

    public static readonly NEXT_TOKEN_RULE_NAME = "nextToken";

    /**
     * State of a lexer, parser, or tree parser are collected into a state
     *  object so the state can be shared.  This sharing is needed to
     *  have one grammar import others and share same error variables
     *  and other state variables.  It's a kind of explicit multiple
     *  inheritance via delegation of methods and shared state.
     */
    protected state: RecognizerSharedState;

    public constructor(state: RecognizerSharedState = new RecognizerSharedState()) {
        this.state = state;
    }

    /**
     * A more general version of getRuleInvocationStack where you can
     *  pass in, for example, a RecognitionException to get it's rule
     *  stack trace.  This routine is shared with all recognizers, hence,
     *  static.
     *
     *  TODO: move to a utility class or something; weird having lexer call this
     */
    public static getRuleInvocationStack(e: Error, recognizerClassName: string): string[] {
        //const rules = new Array<string>();
        const stack = e.stack ?? "";

        /*let i: number;
        for (i = stack.length - 1; i >= 0; i--) {
            const t = stack[i];
            if (t.getClassName().startsWith("org.antlr.runtime.")) {
                continue; // skip support code such as this method
            }
            if (t.getMethodName().equals(BaseRecognizer.NEXT_TOKEN_RULE_NAME)) {
                continue;
            }
            if (!t.getClassName().equals(recognizerClassName)) {
                continue; // must not be part of this parser
            }
            rules.add(t.getMethodName());
        }

        return rules;*/

        return stack.split("\n");
    }

    /** reset the parser's state; subclasses must rewinds the input stream */
    public reset(): void {
        // wack everything related to error recovery
        this.state._fsp = -1;
        this.state.errorRecovery = false;
        this.state.lastErrorIndex = -1;
        this.state.failed = false;
        this.state.syntaxErrors = 0;

        // wack everything related to backtracking and memoization
        this.state.backtracking = 0;
        for (let i = 0; this.state.ruleMemo !== null && i < this.state.ruleMemo.length; i++) { // wipe cache
            this.state.ruleMemo[i] = null;
        }
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
    public match(input: IntStream, ttype: number, follow: BitSet | null): Tree | null {
        let matchedSymbol = this.getCurrentInputSymbol(input);
        if (input.LA(1) === ttype) {
            input.consume();
            this.state.errorRecovery = false;
            this.state.failed = false;

            return matchedSymbol;
        }

        if (this.state.backtracking > 0) {
            this.state.failed = true;

            return matchedSymbol;
        }
        matchedSymbol = this.recoverFromMismatchedToken(input, ttype, follow);

        return matchedSymbol;
    }

    /** Match the wildcard: in a symbol */
    public matchAny(input: IntStream): void {
        this.state.errorRecovery = false;
        this.state.failed = false;
        input.consume();
    }

    public mismatchIsUnwantedToken(input: IntStream, ttype: number): boolean {
        return input.LA(2) === ttype;
    }

    public mismatchIsMissingToken(input: IntStream, follow: BitSet | null): boolean {
        if (follow === null) {
            // we have no information about the follow; we can only consume
            // a single token and hope for the best
            return false;
        }

        // compute what can follow this grammar element reference
        if (follow.get(TreeParser.EOR_TOKEN_TYPE)) {
            const viableTokensFollowingThisRule = this.computeContextSensitiveRuleFOLLOW();
            follow.or(viableTokensFollowingThisRule);
            if (this.state._fsp >= 0) { // remove EOR if we're not the start symbol
                follow.clear(TreeParser.EOR_TOKEN_TYPE);
            }
        }

        // if current token is consistent with what could come after set
        // then we know we're missing a token; error recovery is free to
        // "insert" the missing token

        // BitSet cannot handle negative numbers like -1 (EOF) so I leave EOR
        // in follow set to indicate that the fall of the start symbol is
        // in the set (EOF can follow).
        if (follow.get(input.LA(1)) || follow.get(TreeParser.EOR_TOKEN_TYPE)) {
            return true;
        }

        return false;
    }

    /**
     * Report a recognition problem.
     *
     *  This method sets errorRecovery to indicate the parser is recovering
     *  not parsing.  Once in recovery mode, no errors are generated.
     *  To get out of recovery mode, the parser must successfully match
     *  a token (after a resync).  So it will go:
     *
     * 		1. error occurs
     * 		2. enter recovery mode, report error
     * 		3. consume until token found in resynch set
     * 		4. try to resume parsing
     * 		5. next match() will reset errorRecovery mode
     *
     *  If you override, make sure to update syntaxErrors if you care about that.
     */
    public reportError(e: RecognitionException): void {
        // if we've already reported an error and have not matched a token
        // yet successfully, don't report any errors.
        if (this.state.errorRecovery) {
            //System.err.print("[SPURIOUS] ");
            return;
        }
        this.state.syntaxErrors++; // don't count spurious
        this.state.errorRecovery = true;

        this.displayRecognitionError(this.getTokenNames(), e);
    }

    public displayRecognitionError(tokenNames: string[], e: RecognitionException): void {
        const hdr = this.getErrorHeader(e);
        const msg = this.getErrorMessage(e, tokenNames);
        this.emitErrorMessage(hdr + " " + msg);
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
    public getErrorMessage(e: RecognitionException, tokenNames: string[]): string {
        let msg = e.message;
        if (e.offendingToken !== null) {
            const tokenName = e.offendingToken.text;
            msg = "extraneous input " + this.getTokenErrorDisplay(e.offendingToken) +
                " expecting " + tokenName;
        }

        return msg;
    }

    /**
     * Get number of recognition errors (lexer, parser, tree parser).  Each
     *  recognizer tracks its own number.  So parser and lexer each have
     *  separate count.  Does not count the spurious errors found between
     *  an error and next valid token match
     *
     *  See also reportError()
     */
    public getNumberOfSyntaxErrors(): number {
        return this.state.syntaxErrors;
    }

    /** What is the error header, normally line/character position information? */
    public getErrorHeader(e: RecognitionException): string {
        const token = e.offendingToken!;

        return this.getSourceName() + " line " + token.line + ":" + token.column;
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
    public getTokenErrorDisplay(t: Token): string {
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

    /** Override this method to change where error messages go */
    public emitErrorMessage(msg: string): void {
        console.log(msg);
    }

    /**
     * Recover from an error found on the input stream.  This is
     *  for NoViableAlt and mismatched symbol exceptions.  If you enable
     *  single token insertion and deletion, this will usually not
     *  handle mismatched symbol exceptions but there could be a mismatched
     *  token that the match() routine could not recover from.
     */
    public recover(input: IntStream, re: RecognitionException): void {
        if (this.state.lastErrorIndex === input.index) {
            // uh oh, another error at same token index; must be a case
            // where LT(1) is in the recovery token set so nothing is
            // consumed; consume a single token so at least to prevent
            // an infinite loop; this is a failsafe.
            input.consume();
        }
        this.state.lastErrorIndex = input.index;
        const followSet = this.computeErrorRecoverySet();
        this.beginResync();
        this.consumeUntil(input, followSet);
        this.endResync();
    }

    /**
     * A hook to listen in on the token consumption during error recovery.
     *  The DebugParser subclasses this to fire events to the listenter.
     */
    public beginResync(): void {
        // intentionally empty
    }

    public endResync(): void {
        // intentionally empty
    }

    public consumeUntil(input: IntStream, tokenTypeOrSet: number | BitSet): void {
        if (tokenTypeOrSet instanceof BitSet) {
            let ttype = input.LA(1);
            while (ttype !== Token.EOF && !tokenTypeOrSet.get(ttype)) {
                input.consume();
                ttype = input.LA(1);
            }
        } else {
            let ttype = input.LA(1);
            while (ttype !== Token.EOF && ttype !== tokenTypeOrSet) {
                input.consume();
                ttype = input.LA(1);
            }
        }
    }

    /**
     * Return List&lt;String&gt; of the rules in your parser instance
     *  leading up to a call to this method.  You could override if
     *  you want more details such as the file/line info of where
     *  in the parser java code a rule is invoked.
     *
     *  This is very useful for error messages and for context-sensitive
     *  error recovery.
     */
    public getRuleInvocationStack(): string[] {
        const parserClassName = this.constructor.name;

        return BaseRecognizer.getRuleInvocationStack(new Error(), parserClassName);
    }

    public getBacktrackingLevel(): number {
        return this.state.backtracking;
    }

    public setBacktrackingLevel(n: number): void {
        this.state.backtracking = n;
    }

    /** Return whether or not a backtracking attempt failed. */
    public failed(): boolean {
        return this.state.failed;
    }

    /**
     * Used to print out token names like ID during debugging and
     *  error reporting.  The generated parsers implement a method
     *  that overrides this to point to their String[] tokenNames.
     */
    public getTokenNames(): string[] {
        return [];
    }

    /**
     * For debugging and other purposes, might want the grammar name.
     *  Have ANTLR generate an implementation for this method.
     */
    public getGrammarFileName(): string | null {
        return null;
    }

    /**
     * A convenience method for use most often with template rewrites.
     *  Convert a List&lt;Token&gt; to List&lt;String&gt;
     */
    public toStrings(tokens: Token[]): string[] {
        const strings: string[] = [];
        for (const token of tokens) {
            strings.push(token.text ?? "");
        }

        return strings;
    }

    /**
     * Given a rule number and a start token index number, return
     *  MEMO_RULE_UNKNOWN if the rule has not parsed input starting from
     *  start index.  If this rule has parsed input starting from the
     *  start index before, then return where the rule stopped parsing.
     *  It returns the index of the last token matched by the rule.
     *
     *  For now we use a hashtable and just the slow Object-based one.
     *  Later, we can make a special one for ints and also one that
     *  tosses out data after we commit past input position i.
     */
    public getRuleMemoization(ruleIndex: number, ruleStartIndex: number): number {
        if (this.state.ruleMemo![ruleIndex] === null) {
            this.state.ruleMemo![ruleIndex] = new Map<number, number>();
        }

        const stopIndexI = this.state.ruleMemo![ruleIndex].get(ruleStartIndex);
        if (stopIndexI == null) {
            return BaseRecognizer.MEMO_RULE_UNKNOWN;
        }

        return stopIndexI;
    }

    /**
     * Has this rule already parsed input at the current index in the
     *  input stream?  Return the stop token index or MEMO_RULE_UNKNOWN.
     *  If we attempted but failed to parse properly before, return
     *  MEMO_RULE_FAILED.
     *
     *  This method has a side-effect: if we have seen this input for
     *  this rule and successfully parsed before, then seek ahead to
     *  1 past the stop token matched for this rule last time.
     */
    public alreadyParsedRule(input: IntStream, ruleIndex: number): boolean {
        const stopIndex = this.getRuleMemoization(ruleIndex, input.index);
        if (stopIndex === BaseRecognizer.MEMO_RULE_UNKNOWN) {
            return false;
        }

        if (stopIndex === BaseRecognizer.MEMO_RULE_FAILED) {
            this.state.failed = true;
        } else {
            input.seek(stopIndex + 1); // jump to one past stop token
        }

        return true;
    }

    /**
     * Record whether or not this rule parsed the input at this position
     *  successfully.  Use a standard java hashtable for now.
     */
    public memoize(input: IntStream,
        ruleIndex: number,
        ruleStartIndex: number): void {
        const stopTokenIndex = this.state.failed ? BaseRecognizer.MEMO_RULE_FAILED : input.index - 1;
        if (this.state.ruleMemo === null) {
            console.error("!!!!!!!!! memo array is null for " + this.getGrammarFileName());
        }

        if (ruleIndex >= this.state.ruleMemo!.length) {
            console.error("!!!!!!!!! memo size is " + this.state.ruleMemo!.length + ", but rule index is " + ruleIndex);
        }

        if (this.state.ruleMemo![ruleIndex] !== null) {
            this.state.ruleMemo![ruleIndex].set(ruleStartIndex, stopTokenIndex);
        }
    }

    /**
     * return how many rule/input-index pairs there are in total.
     *  TODO: this includes synpreds. :(
     */
    public getRuleMemoizationCacheSize(): number {
        let n = 0;
        for (let i = 0; this.state.ruleMemo !== null && i < this.state.ruleMemo.length; i++) {
            const ruleMap = this.state.ruleMemo[i];
            if (ruleMap !== null) {
                n += ruleMap.size; // how many input indexes are recorded?
            }
        }

        return n;
    }

    public traceIn(ruleName: string, ruleIndex: number, inputSymbol: unknown): void {
        console.log("enter " + ruleName + " " + inputSymbol);
        if (this.state.backtracking > 0) {
            console.log(" backtracking=" + this.state.backtracking);
        }
        console.log();
    }

    public traceOut(ruleName: string,
        ruleIndex: number,
        inputSymbol: unknown): void {
        console.log("exit " + ruleName + " " + inputSymbol);
        if (this.state.backtracking > 0) {
            console.log(" backtracking=" + this.state.backtracking);
            if (this.state.failed) {
                console.log(" failed");
            }

            else {
                console.log(" succeeded");
            }

        }
        console.log();
    }

    /*  Compute the error recovery set for the current rule.  During
     *  rule invocation, the parser pushes the set of tokens that can
     *  follow that rule reference on the stack; this amounts to
     *  computing FIRST of what follows the rule reference in the
     *  enclosing rule. This local follow set only includes tokens
     *  from within the rule; i.e., the FIRST computation done by
     *  ANTLR stops at the end of a rule.
     *
     *  EXAMPLE
     *
     *  When you find a "no viable alt exception", the input is not
     *  consistent with any of the alternatives for rule r.  The best
     *  thing to do is to consume tokens until you see something that
     *  can legally follow a call to r *or* any rule that called r.
     *  You don't want the exact set of viable next tokens because the
     *  input might just be missing a token--you might consume the
     *  rest of the input looking for one of the missing tokens.
     *
     *  Consider grammar:
     *
     *  a : '[' b ']'
     *    | '(' b ')'
     *    ;
     *  b : c '^' INT ;
     *  c : ID
     *    | INT
     *    ;
     *
     *  At each rule invocation, the set of tokens that could follow
     *  that rule is pushed on a stack.  Here are the various "local"
     *  follow sets:
     *
     *  FOLLOW(b1_in_a) = FIRST(']') = ']'
     *  FOLLOW(b2_in_a) = FIRST(')') = ')'
     *  FOLLOW(c_in_b) = FIRST('^') = '^'
     *
     *  Upon erroneous input "[]", the call chain is
     *
     *  a -> b -> c
     *
     *  and, hence, the follow context stack is:
     *
     *  depth  local follow set     after call to rule
     *    0         <EOF>                    a (from main())
     *    1          ']'                     b
     *    3          '^'                     c
     *
     *  Notice that ')' is not included, because b would have to have
     *  been called from a different context in rule a for ')' to be
     *  included.
     *
     *  For error recovery, we cannot consider FOLLOW(c)
     *  (context-sensitive or otherwise).  We need the combined set of
     *  all context-sensitive FOLLOW sets--the set of all tokens that
     *  could follow any reference in the call chain.  We need to
     *  resync to one of those tokens.  Note that FOLLOW(c)='^' and if
     *  we resync'd to that token, we'd consume until EOF.  We need to
     *  sync to context-sensitive FOLLOWs for a, b, and c: {']','^'}.
     *  In this case, for input "[]", LA(1) is in this set so we would
     *  not consume anything and after printing an error rule c would
     *  return normally.  It would not find the required '^' though.
     *  At this point, it gets a mismatched token error and throws an
     *  exception (since LA(1) is not in the viable following token
     *  set).  The rule exception handler tries to recover, but finds
     *  the same recovery set and doesn't consume anything.  Rule b
     *  exits normally returning to rule a.  Now it finds the ']' (and
     *  with the successful match exits errorRecovery mode).
     *
     *  So, you cna see that the parser walks up call chain looking
     *  for the token that was a member of the recovery set.
     *
     *  Errors are not generated in errorRecovery mode.
     *
     *  ANTLR's error recovery mechanism is based upon original ideas:
     *
     *  "Algorithms + Data Structures = Programs" by Niklaus Wirth
     *
     *  and
     *
     *  "A note on error recovery in recursive descent parsers":
     *  http://portal.acm.org/citation.cfm?id=947902.947905
     *
     *  Later, Josef Grosch had some good ideas:
     *
     *  "Efficient and Comfortable Error Recovery in Recursive Descent
     *  Parsers":
     *  ftp://www.cocolab.com/products/cocktail/doca4.ps/ell.ps.zip
     *
     *  Like Grosch I implemented local FOLLOW sets that are combined
     *  at run-time upon error to avoid overhead during parsing.
     */
    protected computeErrorRecoverySet(): BitSet {
        return this.combineFollows(false);
    }

    /**
     * Compute the context-sensitive FOLLOW set for current rule.
     *  This is set of token types that can follow a specific rule
     *  reference given a specific call chain.  You get the set of
     *  viable tokens that can possibly come next (lookahead depth 1)
     *  given the current call chain.  Contrast this with the
     *  definition of plain FOLLOW for rule r:
     *
     *   FOLLOW(r)={x | S=&gt;*alpha r beta in G and x in FIRST(beta)}
     *
     *  where x in T* and alpha, beta in V*; T is set of terminals and
     *  V is the set of terminals and nonterminals.  In other words,
     *  FOLLOW(r) is the set of all tokens that can possibly follow
     *  references to r in *any* sentential form (context).  At
     *  runtime, however, we know precisely which context applies as
     *  we have the call chain.  We may compute the exact (rather
     *  than covering superset) set of following tokens.
     *
     *  For example, consider grammar:
     *
     *  stat : ID '=' expr ';'      // FOLLOW(stat)=={EOF}
     *       | "return" expr '.'
     *       ;
     *  expr : atom ('+' atom)* ;   // FOLLOW(expr)=={';','.',')'}
     *  atom : INT                  // FOLLOW(atom)=={'+',')',';','.'}
     *       | '(' expr ')'
     *       ;
     *
     *  The FOLLOW sets are all inclusive whereas context-sensitive
     *  FOLLOW sets are precisely what could follow a rule reference.
     *  For input input "i=(3);", here is the derivation:
     *
     *  stat =&gt; ID '=' expr ';'
     *       =&gt; ID '=' atom ('+' atom)* ';'
     *       =&gt; ID '=' '(' expr ')' ('+' atom)* ';'
     *       =&gt; ID '=' '(' atom ')' ('+' atom)* ';'
     *       =&gt; ID '=' '(' INT ')' ('+' atom)* ';'
     *       =&gt; ID '=' '(' INT ')' ';'
     *
     *  At the "3" token, you'd have a call chain of
     *
     *    stat &rarr; expr &rarr; atom &rarr; expr &rarr; atom
     *
     *  What can follow that specific nested ref to atom?  Exactly ')'
     *  as you can see by looking at the derivation of this specific
     *  input.  Contrast this with the FOLLOW(atom)={'+',')',';','.'}.
     *
     *  You want the exact viable token set when recovering from a
     *  token mismatch.  Upon token mismatch, if LA(1) is member of
     *  the viable next token set, then you know there is most likely
     *  a missing token in the input stream.  "Insert" one by just not
     *  throwing an exception.
     */
    protected computeContextSensitiveRuleFOLLOW(): BitSet {
        return this.combineFollows(true);
    }

    // what is exact? it seems to only add sets from above on stack
    // if EOR is in set i.  When it sees a set w/o EOR, it stops adding.
    // Why would we ever want them all?  Maybe no viable alt instead of
    // mismatched token?
    protected combineFollows(exact: boolean): BitSet {
        const top = this.state._fsp;
        const followSet = new BitSet();
        for (let i = top; i >= 0; i--) {
            const localFollowSet = this.state.following[i];
            followSet.or(localFollowSet);
            if (exact) {
                // can we see end of rule?
                if (localFollowSet.get(TreeParser.EOR_TOKEN_TYPE)) {
                    // Only leave EOR in set if at top (start rule); this lets
                    // us know if have to include follow(start rule); i.e., EOF
                    if (i > 0) {
                        followSet.clear(TreeParser.EOR_TOKEN_TYPE);
                    }
                }
                else { // can't see end of rule, quit
                    break;
                }
            }
        }

        return followSet;
    }

    /**
     * Attempt to recover from a single missing or extra token.
     *
     *  EXTRA TOKEN
     *
     *  LA(1) is not what we are looking for.  If LA(2) has the right token,
     *  however, then assume LA(1) is some extra spurious token.  Delete it
     *  and LA(2) as if we were doing a normal match(), which advances the
     *  input.
     *
     *  MISSING TOKEN
     *
     *  If current token is consistent with what could come after
     *  ttype then it is ok to "insert" the missing token, else throw
     *  exception For example, Input "i=(3;" is clearly missing the
     *  ')'.  When the parser returns from the nested call to expr, it
     *  will have call chain:
     *
     *    stat &rarr; expr &rarr; atom
     *
     *  and it will be trying to match the ')' at this point in the
     *  derivation:
     *
     *       =&gt; ID '=' '(' INT ')' ('+' atom)* ';'
     *                          ^
     *  match() will see that ';' doesn't match ')' and report a
     *  mismatched token error.  To recover, it sees that LA(1)==';'
     *  is in the set of tokens that can follow the ')' token
     *  reference in rule atom.  It can assume that you forgot the ')'.
     */
    protected recoverFromMismatchedToken(input: IntStream, ttype: number, follow: BitSet | null): Tree | null {
        let e = null;
        // if next token is what we are looking for then "delete" this token
        if (this.mismatchIsUnwantedToken(input, ttype)) {
            e = new RecognitionException({
                message: "Unwanted Token",
                input: input as TokenStream,
                recognizer: null,
                ctx: null,
            });
            this.beginResync();
            input.consume(); // simply delete extra token
            this.endResync();
            this.reportError(e); // report after consuming so AW sees the token in the exception
            // we want to return the token we're actually matching
            const matchedSymbol = this.getCurrentInputSymbol(input);
            input.consume(); // move past ttype token as if all were ok

            return matchedSymbol;
        }

        // can't recover with single token deletion, try insertion
        if (this.mismatchIsMissingToken(input, follow)) {
            const inserted = this.getMissingSymbol(input, e, ttype, follow);
            e = new RecognitionException({
                message: "Missing Token", input: input as TokenStream, recognizer: null, ctx: null,
            });
            this.reportError(e); // report after inserting so AW sees the token in the exception

            return inserted;
        }

        // even that didn't work; must throw the exception
        throw new RecognitionException({
            message: "Mismatched Token",
            input: input as TokenStream,
            recognizer: null,
            ctx: null,
        });
    }

    /**
     * Match needs to return the current input symbol, which gets put
     *  into the label for the associated token ref; e.g., x=ID.  Token
     *  and tree parsers need to return different objects. Rather than test
     *  for input stream type or change the IntStream interface, I use
     *  a simple method to ask the recognizer to tell me what the current
     *  input symbol is.
     *
     *  This is ignored for lexers.
     */
    protected getCurrentInputSymbol(input: IntStream): Tree | null {
        return null;
    }

    /**
     * Conjure up a missing token during error recovery.
     *
     *  The recognizer attempts to recover from single missing
     *  symbols. But, actions might refer to that missing symbol.
     *  For example, x=ID {f($x);}. The action clearly assumes
     *  that there has been an identifier matched previously and that
     *  $x points at that token. If that token is missing, but
     *  the next token in the stream is what we want we assume that
     *  this token is missing and we keep going. Because we
     *  have to return some token to replace the missing token,
     *  we have to conjure one up. This method gives the user control
     *  over the tokens returned for missing tokens. Mostly,
     *  you will want to create something special for identifier
     *  tokens. For literals such as '{' and ',', the default
     *  action in the parser or tree parser works. It simply creates
     *  a CommonToken of the appropriate type. The text will be the token.
     *  If you change what tokens must be created by the lexer,
     *  override this method to create the appropriate tokens.
     */
    protected getMissingSymbol(input: IntStream,
        e: RecognitionException | null,
        expectedTokenType: number,
        follow: BitSet | null): Tree | null {
        return null;
    }

    /** Push a rule's follow set using our own hardcoded stack */
    protected pushFollow(fset: BitSet): void {
        if ((this.state._fsp + 1) >= this.state.following.length) {
            this.state.following = this.state.following.slice();
        }
        this.state.following[++this.state._fsp] = fset;
    }

    public abstract getSourceName(): string;

}
