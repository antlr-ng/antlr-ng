/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import {
    ATN, ATNState, BailErrorStrategy, BitSet, DecisionState, DefaultErrorStrategy, InputMismatchException,
    InterpreterRuleContext, Parser, ParserInterpreter, ParserRuleContext, PredictionMode, RecognitionException,
    StarLoopEntryState, Token, TokenStream, Trees, Vocabulary,
} from "antlr4ng";

import { ClassFactory } from "../ClassFactory.js";
import type { Constructor } from "../support/helpers.js";
import type { IGrammar, IGrammarParserInterpreter } from "../types.js";
import { GrammarInterpreterRuleContext } from "./GrammarInterpreterRuleContext.js";
import { LeftRecursiveRule } from "./LeftRecursiveRule.js";

/**
 * A heavier weight {@link ParserInterpreter} that creates parse trees that track alternative numbers for subtree roots.
 */
export class GrammarParserInterpreter extends ParserInterpreter implements IGrammarParserInterpreter {
    /**
     * The grammar associated with this interpreter. Unlike the {@link ParserInterpreter} from the standard
     * distribution, this can reference Grammar, which is in the tools area not purely runtime.
     */
    protected readonly g: IGrammar;

    protected decisionStatesThatSetOuterAltNumInContext: BitSet;

    /**
     * We want to stop and track the first error but we cannot bail out like {@link BailErrorStrategy} as consume()
     * constructs trees. We make sure to create an error node during recovery with this strategy. We consume() 1
     * token during the "bail out of rule" mechanism in recover() and let it fall out of the rule to finish
     * constructing trees. For recovery in line, we throw InputMismatchException to engage recover().
     */
    private static BailButConsumeErrorStrategy = class BailButConsumeErrorStrategy extends DefaultErrorStrategy {
        public firstErrorTokenIndex = -1;

        public override recover(recognizer: Parser, e: RecognitionException): void {
            const errIndex = recognizer.inputStream.index;
            if (this.firstErrorTokenIndex === -1) {
                this.firstErrorTokenIndex = errIndex; // Latch.
            }

            const input = recognizer.inputStream;
            if (input.index < input.size - 1) { // Don't consume EOF.
                // Just kill this bad token and let it continue.
                recognizer.consume();
            }
        }

        public override recoverInline(recognizer: Parser): Token {
            const errIndex = recognizer.inputStream.index;
            if (this.firstErrorTokenIndex === -1) {
                this.firstErrorTokenIndex = errIndex; // latch
            }

            throw new InputMismatchException(recognizer);
        }

        public override sync(recognizer: Parser): void {
            // Don't consume anything - let it fail later.
        }
    };

    /**
     * Cache {@link LeftRecursiveRule.getPrimaryAlts()} and {@link LeftRecursiveRule.getRecursiveOpAlts()} for states
     * in {@link decisionStatesThatSetOuterAltNumInContext}. It only caches decisions in left-recursive rules.
     */
    private stateToAltsMap: number[][] = [];

    public constructor(g: IGrammar, atn: ATN, input: TokenStream);
    public constructor(g: IGrammar, grammarFileName: string, vocabulary: Vocabulary, ruleNames: string[], atn: ATN,
        input: TokenStream);
    public constructor(...args: unknown[]) {
        if (args[1] instanceof ATN) {
            const [g, atn, input] = args as [IGrammar, ATN, TokenStream];
            super(g.fileName, g.getVocabulary(), g.getRuleNames(), atn, input);
            this.g = g;
            this.decisionStatesThatSetOuterAltNumInContext = this.findOuterMostDecisionStates();
        } else {
            const [g, grammarFileName, vocabulary, ruleNames, atn, input] =
                args as [IGrammar, string, Vocabulary, string[], ATN, TokenStream];

            super(grammarFileName, vocabulary, ruleNames, atn, input);
            this.g = g;
        }
    }

    /**
     * Given an ambiguous parse information, return the list of ambiguous parse trees. An ambiguity occurs when a
     * specific token sequence can be recognized in more than one way by the grammar. These ambiguities are detected
     * only at decision points.
     *
     * The list of trees includes the actual interpretation (that for the minimum alternative number) and all
     * ambiguous alternatives. The actual interpretation is always first.
     *
     * This method reuses the same physical input token stream used to detect the ambiguity by the original parser
     * in the first place. This method resets/seeks within but does not alter originalParser.
     *
     * The trees are rooted at the node whose start..stop token indices include the start and stop indices of this
     * ambiguity event. That is, the trees returned will always include the complete ambiguous sub phrase
     * identified by the ambiguity event.  The subtrees returned will also always contain the node associated with
     * the overridden decision.
     *
     * Be aware that this method does NOT notify error or parse listeners as it would trigger duplicate or otherwise
     * unwanted events.
     *
     * This uses a temporary ParserATNSimulator and a ParserInterpreter so we don't mess up any statistics, event
     * lists, etc... The parse tree constructed while identifying/making ambiguityInfo is not affected by this method
     * as it creates a new parser interp to get the ambiguous interpretations.
     *
     * Nodes in the returned ambig trees are independent of the original parse tree (constructed while
     * identifying/creating ambiguityInfo).
     *
     * @param g From which grammar should we drive alternative numbers and alternative labels.
     * @param originalParser The parser used to create ambiguityInfo; it is not modified by this routine and can be
     *                       either a generated or interpreted parser. It's token stream *is* reset/seek()'d.
     * @param tokens A stream of tokens to use with the temporary parser. This will often be just the token stream
     *               within the original parser but here it is for flexibility.
     * @param decision Which decision to try different alternatives for.
     * @param alts The set of alternatives to try while re-parsing.
     * @param startIndex The index of the first token of the ambiguous input or other input of interest.
     * @param stopIndex The index of the last token of the ambiguous input. The start and stop indexes are used
     *                  primarily to identify how much of the resulting parse tree to return.
     * @param startRuleIndex The start rule for the entire grammar, not the ambiguous decision. We re-parse the entire
     *                       input and so we need the original start rule.
     * @returns The list of all possible interpretations of the input for the decision in ambiguityInfo. The actual
     *          interpretation chosen by the parser is always given first because this method retests the input in
     *          alternative order and ANTLR always resolves ambiguities by choosing the first alternative that matches
     *          the input.
     */
    public static getAllPossibleParseTrees(g: IGrammar, originalParser: Parser, tokens: TokenStream, decision: number,
        alts: BitSet, startIndex: number, stopIndex: number, startRuleIndex: number): ParserRuleContext[] {
        const trees = new Array<ParserRuleContext>();

        // Create a new parser interpreter to parse the ambiguous sub phrase.
        const parser = GrammarParserInterpreter.deriveTempParserInterpreter(g, originalParser, tokens);

        // If we are pointing at EOF token.
        if (stopIndex >= (tokens.size - 1)) {
            // EOF is not in tree, so must be 1 less than last non-EOF token
            stopIndex = tokens.size - 2;
        }

        // Get ambig trees.
        let alt = alts.nextSetBit(0);
        while (alt !== undefined && alt >= 0) {
            // Re-parse entire input for all ambiguous alternatives (don't have to do first as it's been parsed,
            // but do again for simplicity using this temp parser).
            parser.reset();
            parser.addDecisionOverride(decision, startIndex, alt);
            const t = parser.parse(startRuleIndex);
            let ambigSubTree = Trees.getRootOfSubtreeEnclosingRegion(t, startIndex, stopIndex);

            // Use higher of overridden decision tree or tree enclosing all tokens.
            if (Trees.isAncestorOf(parser.overrideDecisionRoot, ambigSubTree)) {
                ambigSubTree = parser.overrideDecisionRoot;
            }

            trees.push(ambigSubTree as GrammarInterpreterRuleContext);
            alt = alts.nextSetBit(alt + 1);
        }

        return trees;
    }

    /**
     * @returns list of parse trees, one for each alternative in a decision given the same input.
     *
     * Very similar to {@link getAllPossibleParseTrees} except that it re-parses the input for every alternative
     * in a decision, not just the ambiguous ones (there is no alts parameter here). This method also tries to reduce
     * the size of the parse trees by stripping away children of the tree that are completely out of range of
     * startIndex..stopIndex. Also, because errors are expected, we use a specialized error handler that more or less
     * bails out but that also consumes the first erroneous token at least. This ensures that an error node will be
     * in the parse tree for display.
     *
     * NOTES:
     * We must parse the entire input now with decision overrides we cannot parse a subset because it could be that
     * a decision above our decision of interest needs to read way past lookaheadInfo.stopIndex. It seems like there
     * is no escaping the use of a full and complete token stream if we are resetting to token index 0 and re-parsing
     * from the start symbol. It's not easy to restart parsing somewhere in the middle like a continuation because
     * our call stack does not match the tree stack because of left recursive rule rewriting.
     *
     * @param g The grammar from which to derive alternative numbers and alternative labels.
     * @param originalParser The parser for context information.
     * @param tokens The token stream to use with the new parser.
     * @param startRuleIndex The start rule for the entire grammar.
     * @param decision The decision to try different alternatives for.
     * @param startIndex The index of the first token of the ambiguous input.
     * @param stopIndex The index of the last token of the ambiguous input.
     */
    public static getLookaheadParseTrees(g: IGrammar, originalParser: ParserInterpreter, tokens: TokenStream,
        startRuleIndex: number, decision: number, startIndex: number, stopIndex: number): ParserRuleContext[] {
        const trees = new Array<ParserRuleContext>();

        // Create a new parser interpreter to parse the ambiguous sub phrase.
        const parser = GrammarParserInterpreter.deriveTempParserInterpreter(g, originalParser, tokens);
        const decisionState = originalParser.atn.decisionToState[decision];

        for (let alt = 1; alt <= decisionState.transitions.length; alt++) {
            // Re-parse entire input for all ambiguous alternatives (don't have to do first as it's been parsed, but
            // do again for simplicity using this temp parser).
            const errorHandler = new GrammarParserInterpreter.BailButConsumeErrorStrategy();
            parser.errorHandler = errorHandler;
            parser.reset();
            parser.addDecisionOverride(decision, startIndex, alt);

            const tt = parser.parse(startRuleIndex);
            let stopTreeAt = stopIndex;
            if (errorHandler.firstErrorTokenIndex >= 0) {
                stopTreeAt = errorHandler.firstErrorTokenIndex; // Cut off rest at first error.
            }

            const overallRange = tt.getSourceInterval();
            if (stopTreeAt > overallRange.stop) {
                // If we try to look beyond range of tree, stopTreeAt must be EOF for which there is no EOF ref in
                // grammar. That means tree will not have node for stopTreeAt. Limit to overallRange.b.
                stopTreeAt = overallRange.stop;
            }
            let subtree = Trees.getRootOfSubtreeEnclosingRegion(tt, startIndex, stopTreeAt);

            // Use higher of overridden decision tree or tree enclosing all tokens.
            if (Trees.isAncestorOf(parser.overrideDecisionRoot, subtree)) {
                subtree = parser.overrideDecisionRoot;
            }

            Trees.stripChildrenOutOfRange(subtree, parser.overrideDecisionRoot!, startIndex, stopTreeAt);
            trees.push(subtree!);
        }

        return trees;
    }

    /**
     * Derives a new parser from an old one that has knowledge of the grammar. The Grammar object is used to correctly
     * compute outer alternative numbers for parse tree nodes. A parser of the same type is created for subclasses
     * of {@link ParserInterpreter}.
     *
     * @param g The grammar from which to derive alternative numbers and alternative labels.
     * @param originalParser The parser to derive from.
     * @param tokens The token stream to use with the new parser.
     *
     * @returns A new parser that can be used to parse the same input as the original parser.
     */
    public static deriveTempParserInterpreter(g: IGrammar, originalParser: Parser,
        tokens: TokenStream): ParserInterpreter {
        let parser: ParserInterpreter;
        if (originalParser instanceof ParserInterpreter) {
            try {
                const ctor = originalParser.constructor as Constructor<ParserInterpreter>;
                parser = new ctor(g, originalParser.atn, originalParser.tokenStream);
            } catch (e) {
                if (e instanceof Error) {
                    throw new Error("can't create parser to match incoming " + originalParser.constructor.name);
                } else {
                    throw e;
                }
            }
        } else { // Must've been a generated parser.
            parser = new ParserInterpreter(originalParser.grammarFileName, originalParser.vocabulary,
                originalParser.ruleNames, originalParser.atn, tokens);
        }

        parser.inputStream = tokens;

        // Make sure that we don't get any error messages from using this temporary parser.
        parser.errorHandler = new BailErrorStrategy();
        parser.removeErrorListeners();
        parser.removeParseListeners();
        parser.interpreter.predictionMode = PredictionMode.LL_EXACT_AMBIG_DETECTION;

        return parser;
    }

    protected override createInterpreterRuleContext(parent: ParserRuleContext, invokingStateNumber: number,
        ruleIndex: number): InterpreterRuleContext {
        return new GrammarInterpreterRuleContext(ruleIndex, parent, invokingStateNumber);
    }

    /**
     * Override this method so that we can record which alternative was taken at each decision point. For non-left
     * recursive rules, it's simple. Set decisionStatesThatSetOuterAltNumInContext indicates which decision states
     * should set the outer alternative number.
     *
     * Left recursive rules are much more complicated to deal with: there is typically a decision for the primary
     * alternatives and a decision to choose between the recursive operator alternatives. For example, the following
     * left recursive rule has two primary and 2 recursive alternatives.
     *
     * ```antlr
     * e : e '*' e
     * | '-' INT
     * | e '+' e
     * | ID
     * ;
     * ```
     *
     * ANTLR rewrites that rule to be
     *
     * ```antlr
     * e[int precedence]
     * : ('-' INT | ID)
     * ( {...}? '*' e[5]
     * | {...}? '+' e[3]
     * )*
     * ;
     * ```
     *
     * So, there are two decisions associated with picking the outermost alt. This complicates our tracking
     * significantly. The outermost alternative number is a function of the decision (ATN state) within a left
     * recursive rule and the predicted alternative coming back from adaptivePredict().
     *
     * We use stateToAltsMap as a cache to avoid expensive calls to getRecursiveOpAlts().
     *
     * @param p The decision state to visit.
     *
     * @returns The prediction made by the interpreter for this decision state.
     */
    protected override visitDecisionState(p: DecisionState): number {
        const predictedAlt = super.visitDecisionState(p);
        if (p.transitions.length > 1) {
            if (p.decision === this.overrideDecision &&
                this.inputStream.index === this.overrideDecisionInputIndex) {
                this.overrideDecisionRoot = this.context as GrammarInterpreterRuleContext;
            }
        }

        const ctx = this.context as GrammarInterpreterRuleContext;
        if (this.decisionStatesThatSetOuterAltNumInContext.get(p.stateNumber)) {
            ctx.setAltNumber(predictedAlt);
            const r = this.g.getRule(p.ruleIndex)!;
            if (this.atn.ruleToStartState[r.index]?.isLeftRecursiveRule) {
                let alts = this.stateToAltsMap[p.stateNumber];
                const lr = this.g.getRule(p.ruleIndex)! as LeftRecursiveRule;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!alts) {
                    if ((p.constructor as typeof DecisionState).stateType === ATNState.BLOCK_START) {
                        alts = lr.getPrimaryAlts();
                        this.stateToAltsMap[p.stateNumber] = alts; // cache it
                    } else {
                        if ((p.constructor as typeof DecisionState).stateType === ATNState.STAR_BLOCK_START) {
                            alts = lr.getRecursiveOpAlts();
                            this.stateToAltsMap[p.stateNumber] = alts; // cache it
                        }
                    }
                }

                ctx.setAltNumber(alts[predictedAlt]);
            }
        }

        return predictedAlt;
    }

    /**
     * Identify the ATN states where we need to set the outer alt number. For regular rules, that's the block at the
     * target to rule start state. For left-recursive rules, we track the primary block, which looks just like a
     * regular rule's outer block, and the star loop block (always there even if 1 alt).
     *
     * @returns A set of ATN state numbers.
     */
    private findOuterMostDecisionStates(): BitSet {
        const track = new BitSet();
        const numberOfDecisions = this.atn.getNumberOfDecisions();
        for (let i = 0; i < numberOfDecisions; i++) {
            const decisionState = this.atn.getDecisionState(i)!;
            const startState = this.atn.ruleToStartState[decisionState.ruleIndex];
            // Look for StarLoopEntryState that is in any left recursive rule
            if (decisionState instanceof StarLoopEntryState) {
                const loopEntry = decisionState;
                if (loopEntry.precedenceRuleDecision) {
                    // Recursive alts always result in a (...)* in the transformed left recursive rule and that
                    // always has a BasicBlockStartState even if just 1 recursive alt exists.
                    const blockStart = loopEntry.transitions[0].target;

                    // Track the StarBlockStartState associated with the recursive alternatives.
                    track.set(blockStart.stateNumber);
                }
            } else {
                if (startState?.transitions[0].target === decisionState) {
                    // Always track outermost block for any rule if it exists.
                    track.set(decisionState.stateNumber);
                }
            }
        }

        return track;
    }

    static {
        ClassFactory.createGrammarParserInterpreter = (g: IGrammar, atn: ATN, input: TokenStream) => {
            return new GrammarParserInterpreter(g, atn, input);
        };
    }
}
