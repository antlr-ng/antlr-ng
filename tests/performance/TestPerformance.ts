/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */


/* eslint-disable jsdoc/require-returns, jsdoc/require-param */


import {
    BailErrorStrategy, BaseErrorListener, CharStream, CommonTokenStream, DefaultErrorStrategy, DiagnosticErrorListener, Lexer, Parser, ParserInterpreter, ParserRuleContext, RecognitionException, Recognizer, Token, TokenStream, ATN, ATNConfig, ATNConfigSet, LexerATNSimulator, ParserATNSimulator, PredictionContextCache, PredictionMode, DFA, DFAState, Interval, MurmurHash, ParseCancellationException, ErrorNode, ParseTree, ParseTreeListener, ParseTreeWalker, TerminalNode, HashSet } from "antlr4ng";



describe("TestPerformance", () => {

	public static FileParseResult =  class FileParseResult {
		public readonly  sourceName:  string;
		public readonly  checksum:  number;
		public readonly  parseTree:  ParseTree;
		public readonly  tokenCount:  number;
		public readonly  startTime:  bigint;
		public readonly  endTime:  bigint;

		public readonly  lexerDFASize:  number;
		public readonly  lexerTotalTransitions:  bigint;
		public readonly  lexerComputedTransitions:  bigint;

		public readonly  parserDFASize:  number;
		public readonly  decisionInvocations:  BigInt64Array;
		public readonly  fullContextFallback:  BigInt64Array;
		public readonly  nonSll:  BigInt64Array;
		public readonly  parserTotalTransitions:  BigInt64Array;
		public readonly  parserComputedTransitions:  BigInt64Array;
		public readonly  parserFullContextTransitions:  BigInt64Array;

		public  constructor(sourceName: string, checksum: number, parseTree: ParseTree, tokenCount: number, startTime: bigint, lexer: Lexer, parser: Parser) {
			this.sourceName = sourceName;
			this.checksum = checksum;
			this.parseTree = parseTree;
			this.tokenCount = tokenCount;
			this.startTime = startTime;
			this.endTime = System.nanoTime();

			if (lexer !== null) {
				let  interpreter = lexer.getInterpreter();
				if (interpreter instanceof TestPerformance.StatisticsLexerATNSimulator) {
					this.lexerTotalTransitions = (interpreter as TestPerformance.StatisticsLexerATNSimulator).totalTransitions;
					this.lexerComputedTransitions = (interpreter as TestPerformance.StatisticsLexerATNSimulator).computedTransitions;
				} else {
					this.lexerTotalTransitions = 0;
					this.lexerComputedTransitions = 0;
				}

				let  dfaSize = 0;
				for (let dfa of interpreter.decisionToDFA) {
					if (dfa !== null) {
						dfaSize += dfa.states.size();
					}
				}

				this.lexerDFASize = dfaSize;
			} else {
				this.lexerDFASize = 0;
				this.lexerTotalTransitions = 0;
				this.lexerComputedTransitions = 0;
			}

			if (parser !== null) {
				let  interpreter = parser.getInterpreter();
				if (interpreter instanceof TestPerformance.StatisticsParserATNSimulator) {
					this.decisionInvocations = (interpreter as TestPerformance.StatisticsParserATNSimulator).decisionInvocations;
					this.fullContextFallback = (interpreter as TestPerformance.StatisticsParserATNSimulator).fullContextFallback;
					this.nonSll = (interpreter as TestPerformance.StatisticsParserATNSimulator).nonSll;
					this.parserTotalTransitions = (interpreter as TestPerformance.StatisticsParserATNSimulator).totalTransitions;
					this.parserComputedTransitions = (interpreter as TestPerformance.StatisticsParserATNSimulator).computedTransitions;
					this.parserFullContextTransitions = (interpreter as TestPerformance.StatisticsParserATNSimulator).fullContextTransitions;
				} else {
					this.decisionInvocations = new  BigInt64Array(0);
					this.fullContextFallback = new  BigInt64Array(0);
					this.nonSll = new  BigInt64Array(0);
					this.parserTotalTransitions = new  BigInt64Array(0);
					this.parserComputedTransitions = new  BigInt64Array(0);
					this.parserFullContextTransitions = new  BigInt64Array(0);
				}

				let  dfaSize = 0;
				for (let dfa of interpreter.decisionToDFA) {
					if (dfa !== null) {
						dfaSize += dfa.states.size();
					}
				}

				this.parserDFASize = dfaSize;
			} else {
				this.parserDFASize = 0;
				this.decisionInvocations = new  BigInt64Array(0);
				this.fullContextFallback = new  BigInt64Array(0);
				this.nonSll = new  BigInt64Array(0);
				this.parserTotalTransitions = new  BigInt64Array(0);
				this.parserComputedTransitions = new  BigInt64Array(0);
				this.parserFullContextTransitions = new  BigInt64Array(0);
			}
		}
	};


	public static StatisticsLexerATNSimulator =  class StatisticsLexerATNSimulator extends LexerATNSimulator {

		public  totalTransitions:  bigint;
		public  computedTransitions:  bigint;

		public  constructor(atn: ATN, decisionToDFA: DFA[], sharedContextCache: PredictionContextCache);

		public  constructor(recog: Lexer, atn: ATN, decisionToDFA: DFA[], sharedContextCache: PredictionContextCache);
    public constructor(...args: unknown[]) {
		switch (args.length) {
			case 3: {
				const [atn, decisionToDFA, sharedContextCache] = args as [ATN, DFA[], PredictionContextCache];


			super(atn, decisionToDFA, sharedContextCache);


				break;
			}

			case 4: {
				const [recog, atn, decisionToDFA, sharedContextCache] = args as [Lexer, ATN, DFA[], PredictionContextCache];


			super(recog, atn, decisionToDFA, sharedContextCache);


				break;
			}

			default: {
				throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
			}
		}
	}



protected override  getExistingTargetState(s: DFAState, t: number):  DFAState {
			this.totalTransitions++;
			return super.getExistingTargetState(s, t);
		}


protected override  computeTargetState(input: CharStream, s: DFAState, t: number):  DFAState {
			this.computedTransitions++;
			return super.computeTargetState(input, s, t);
		}
	};


	public static StatisticsParserATNSimulator =  class StatisticsParserATNSimulator extends ParserATNSimulator {

		public readonly  decisionInvocations:  BigInt64Array;
		public readonly  fullContextFallback:  BigInt64Array;
		public readonly  nonSll:  BigInt64Array;
		public readonly  totalTransitions:  BigInt64Array;
		public readonly  computedTransitions:  BigInt64Array;
		public readonly  fullContextTransitions:  BigInt64Array;

		private  decision:  number;

		public  constructor(atn: ATN, decisionToDFA: DFA[], sharedContextCache: PredictionContextCache);

		public  constructor(parser: Parser, atn: ATN, decisionToDFA: DFA[], sharedContextCache: PredictionContextCache);
    public constructor(...args: unknown[]) {
		switch (args.length) {
			case 3: {
				const [atn, decisionToDFA, sharedContextCache] = args as [ATN, DFA[], PredictionContextCache];


			super(atn, decisionToDFA, sharedContextCache);
			this.decisionInvocations = new  BigInt64Array(atn.decisionToState.size());
			this.fullContextFallback = new  BigInt64Array(atn.decisionToState.size());
			this.nonSll = new  BigInt64Array(atn.decisionToState.size());
			this.totalTransitions = new  BigInt64Array(atn.decisionToState.size());
			this.computedTransitions = new  BigInt64Array(atn.decisionToState.size());
			this.fullContextTransitions = new  BigInt64Array(atn.decisionToState.size());


				break;
			}

			case 4: {
				const [parser, atn, decisionToDFA, sharedContextCache] = args as [Parser, ATN, DFA[], PredictionContextCache];


			super(parser, atn, decisionToDFA, sharedContextCache);
			this.decisionInvocations = new  BigInt64Array(atn.decisionToState.size());
			this.fullContextFallback = new  BigInt64Array(atn.decisionToState.size());
			this.nonSll = new  BigInt64Array(atn.decisionToState.size());
			this.totalTransitions = new  BigInt64Array(atn.decisionToState.size());
			this.computedTransitions = new  BigInt64Array(atn.decisionToState.size());
			this.fullContextTransitions = new  BigInt64Array(atn.decisionToState.size());


				break;
			}

			default: {
				throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
			}
		}
	}



public override  adaptivePredict(input: TokenStream, decision: number, outerContext: ParserRuleContext):  number {
			try {
				this.decision = decision;
				this.decisionInvocations[decision]++;
				return super.adaptivePredict(input, decision, outerContext);
			}
			finally {
				this.decision = -1;
			}
		}


protected override  execATNWithFullContext(dfa: DFA, D: DFAState, s0: ATNConfigSet, input: TokenStream, startIndex: number, outerContext: ParserRuleContext):  number {
			this.fullContextFallback[this.decision]++;
			return super.execATNWithFullContext(dfa, D, s0, input, startIndex, outerContext);
		}


protected override  getExistingTargetState(previousD: DFAState, t: number):  DFAState {
			this.totalTransitions[this.decision]++;
			return super.getExistingTargetState(previousD, t);
		}


protected override  computeTargetState(dfa: DFA, previousD: DFAState, t: number):  DFAState {
			this.computedTransitions[this.decision]++;
			return super.computeTargetState(dfa, previousD, t);
		}


protected override  computeReachSet(closure: ATNConfigSet, t: number, fullCtx: boolean):  ATNConfigSet {
			if (fullCtx) {
				this.totalTransitions[this.decision]++;
				this.computedTransitions[this.decision]++;
				this.fullContextTransitions[this.decision]++;
			}

			return super.computeReachSet(closure, t, fullCtx);
		}
	};


	public static DescriptiveErrorListener =  class DescriptiveErrorListener extends BaseErrorListener {
		public static readonly  INSTANCE = new  TestPerformance.DescriptiveErrorListener();


public override  syntaxError(recognizer: Recognizer<unknown, unknown>, offendingSymbol: Object,
								line: number, charPositionInLine: number,
								msg: string, e: RecognitionException):  void
		{
			if (!TestPerformance.REPORT_SYNTAX_ERRORS) {
				return;
			}

			let  sourceName = recognizer.getInputStream().getSourceName();
			if (!sourceName.isEmpty()) {
				sourceName = string.format("%s:%d:%d: ", sourceName, line, charPositionInLine);
			}

			System.err.println(sourceName+"line "+line+":"+charPositionInLine+" "+msg);
		}

	};


	public static SummarizingDiagnosticErrorListener =  class SummarizingDiagnosticErrorListener extends DiagnosticErrorListener {
		private  _sllConflict:  BitSet;
		private  _sllConfigs:  ATNConfigSet;


public override  reportAmbiguity(recognizer: Parser, dfa: DFA, startIndex: number, stopIndex: number, exact: boolean, ambigAlts: BitSet, configs: ATNConfigSet):  void {
			if (TestPerformance.COMPUTE_TRANSITION_STATS && TestPerformance.DETAILED_DFA_STATE_STATS) {
				let  sllPredictions = this.getConflictingAlts(this._sllConflict, this._sllConfigs);
				let  sllPrediction = sllPredictions.nextSetBit(0);
				let  llPredictions = this.getConflictingAlts(ambigAlts, configs);
				let  llPrediction = llPredictions.cardinality() === 0 ? ATN.INVALID_ALT_NUMBER : llPredictions.nextSetBit(0);
				if (sllPrediction !== llPrediction) {
					(recognizer.getInterpreter() as TestPerformance.StatisticsParserATNSimulator).nonSll[dfa.decision]++;
				}
			}

			if (!TestPerformance.REPORT_AMBIGUITIES) {
				return;
			}

			// show the rule name along with the decision
			let  format = "reportAmbiguity d=%d (%s): ambigAlts=%s, input='%s'";
			let  decision = dfa.decision;
			let  rule = recognizer.getRuleNames()[dfa.atnStartState.ruleIndex];
			let  input = recognizer.getTokenStream().getText(Interval.of(startIndex, stopIndex));
			recognizer.notifyErrorListeners(string.format(format, decision, rule, ambigAlts, input));
		}


public override  reportAttemptingFullContext(recognizer: Parser, dfa: DFA, startIndex: number, stopIndex: number, conflictingAlts: BitSet, configs: ATNConfigSet):  void {
			this._sllConflict = conflictingAlts;
			this._sllConfigs = configs;
			if (!TestPerformance.REPORT_FULL_CONTEXT) {
				return;
			}

			// show the rule name and viable configs along with the base info
			let  format = "reportAttemptingFullContext d=%d (%s), input='%s', viable=%s";
			let  decision = dfa.decision;
			let  rule = recognizer.getRuleNames()[dfa.atnStartState.ruleIndex];
			let  input = recognizer.getTokenStream().getText(Interval.of(startIndex, stopIndex));
			let  representedAlts = this.getConflictingAlts(conflictingAlts, configs);
			recognizer.notifyErrorListeners(string.format(format, decision, rule, input, representedAlts));
		}


public override  reportContextSensitivity(recognizer: Parser, dfa: DFA, startIndex: number, stopIndex: number, prediction: number, configs: ATNConfigSet):  void {
			if (TestPerformance.COMPUTE_TRANSITION_STATS && TestPerformance.DETAILED_DFA_STATE_STATS) {
				let  sllPredictions = this.getConflictingAlts(this._sllConflict, this._sllConfigs);
				let  sllPrediction = sllPredictions.nextSetBit(0);
				if (sllPrediction !== prediction) {
					(recognizer.getInterpreter() as TestPerformance.StatisticsParserATNSimulator).nonSll[dfa.decision]++;
				}
			}

			if (!TestPerformance.REPORT_CONTEXT_SENSITIVITY) {
				return;
			}

			// show the rule name and viable configs along with the base info
			let  format = "reportContextSensitivity d=%d (%s), input='%s', viable={%d}";
			let  decision = dfa.decision;
			let  rule = recognizer.getRuleNames()[dfa.atnStartState.ruleIndex];
			let  input = recognizer.getTokenStream().getText(Interval.of(startIndex, stopIndex));
			recognizer.notifyErrorListeners(string.format(format, decision, rule, input, prediction));
		}

	};


	public static readonly FilenameFilters =  class FilenameFilters {
		public static readonly  ALL_FILES = new  class extends FilenameFilter {


public  accept(dir: File, name: string):  boolean {
				return true;
			}

		}();

		public static FileExtensionFilenameFilter =  class FileExtensionFilenameFilter implements FilenameFilter {

			private readonly  extension:  string;
			private readonly  caseSensitive:  boolean;

			public  constructor(extension: string, caseSensitive: boolean) {
				if (!extension.startsWith(".")) {
					extension = '.' + extension;
				}

				this.extension = extension;
				this.caseSensitive = caseSensitive;
			}


public  accept(dir: File, name: string):  boolean {
				if (this.caseSensitive) {
					return name.endsWith(this.extension);
				} else {
					return name.toLowerCase().endsWith(this.extension);
				}
			}
		};


		public static FileNameFilenameFilter =  class FileNameFilenameFilter implements FilenameFilter {

			private readonly  filename:  string;
			private readonly  caseSensitive:  boolean;

			public  constructor(filename: string, caseSensitive: boolean) {
				this.filename = filename;
				this.caseSensitive = caseSensitive;
			}


public  accept(dir: File, name: string):  boolean {
				if (this.caseSensitive) {
					return name.equals(this.filename);
				} else {
					return name.toLowerCase().equals(this.filename);
				}
			}
		};


		public static AllFilenameFilter =  class AllFilenameFilter implements FilenameFilter {

			private readonly  filters:  FilenameFilter[];

			public  constructor(filters: FilenameFilter[]) {
				this.filters = filters;
			}


public  accept(dir: File, name: string):  boolean {
				for (let filter of this.filters) {
					if (!filter.accept(dir, name)) {
						return false;
					}
				}

				return true;
			}
		};


		public static AnyFilenameFilter =  class AnyFilenameFilter implements FilenameFilter {

			private readonly  filters:  FilenameFilter[];

			public  constructor(filters: FilenameFilter[]) {
				this.filters = filters;
			}


public  accept(dir: File, name: string):  boolean {
				for (let filter of this.filters) {
					if (filter.accept(dir, name)) {
						return true;
					}
				}

				return false;
			}
		};


		public static NotFilenameFilter =  class NotFilenameFilter implements FilenameFilter {

			private readonly  filter:  FilenameFilter;

			public  constructor(filter: FilenameFilter) {
				this.filter = filter;
			}


public  accept(dir: File, name: string):  boolean {
				return !this.filter.accept(dir, name);
			}
		};


		private  constructor() {
		}

		public static  extension(extension: string):  FilenameFilter;

		public static  extension(extension: string, caseSensitive: boolean):  FilenameFilter;
public static extension(...args: unknown[]):  FilenameFilter {
		switch (args.length) {
			case 1: {
				const [extension] = args as [string];


			return extension(extension, true);


				break;
			}

			case 2: {
				const [extension, caseSensitive] = args as [string, boolean];


			return new  TestPerformance.FilenameFilters.FileExtensionFilenameFilter(extension, caseSensitive);


				break;
			}

			default: {
				throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
			}
		}
	}


		public static  name(filename: string):  FilenameFilter;

		public static  name(filename: string, caseSensitive: boolean):  FilenameFilter;
public static name(...args: unknown[]):  FilenameFilter {
		switch (args.length) {
			case 1: {
				const [filename] = args as [string];


			return FilenameFilters.name(filename, true);


				break;
			}

			case 2: {
				const [filename, caseSensitive] = args as [string, boolean];


			return new  TestPerformance.FilenameFilters.FileNameFilenameFilter(filename, caseSensitive);


				break;
			}

			default: {
				throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
			}
		}
	}


		public static  all(...filters: FilenameFilter[]):  FilenameFilter {
			return new  TestPerformance.FilenameFilters.AllFilenameFilter(filters);
		}

		public static  any(...filters: FilenameFilter[]):  FilenameFilter {
			return new  TestPerformance.FilenameFilters.AnyFilenameFilter(filters);
		}

		public static  none(...filters: FilenameFilter[]):  FilenameFilter {
			return FilenameFilters.not(FilenameFilters.any(filters));
		}

		public static  not(filter: FilenameFilter):  FilenameFilter {
			return new  TestPerformance.FilenameFilters.NotFilenameFilter(filter);
		}
	};


	public static NumberedThread =  class NumberedThread extends java.lang.Thread {
		private readonly  threadNumber:  number;

		public  constructor(target: java.lang.Runnable, threadNumber: number) {
			super(target);
			this.threadNumber = threadNumber;
		}

		public readonly  getThreadNumber():  number {
			return this.threadNumber;
		}

	};


	public static NumberedThreadFactory =  class NumberedThreadFactory implements ThreadFactory {
		private readonly  nextThread = new  AtomicInteger();


public  newThread(r: Runnable):  Thread {
			let  threadNumber = this.nextThread.getAndIncrement();
			/* assert threadNumber < NUMBER_OF_THREADS; */
			return new  TestPerformance.NumberedThread(r, threadNumber);
		}

	};


	public static FixedThreadNumberFactory =  class FixedThreadNumberFactory implements ThreadFactory {
		private readonly  threadNumber:  number;

		public  constructor(threadNumber: number) {
			this.threadNumber = threadNumber;
		}


public  newThread(r: Runnable):  Thread {
			/* assert threadNumber < NUMBER_OF_THREADS; */
			return new  TestPerformance.NumberedThread(r, this.threadNumber);
		}
	};


	public static ChecksumParseTreeListener =  class ChecksumParseTreeListener implements ParseTreeListener {
		private static readonly  VISIT_TERMINAL = 1;
		private static readonly  VISIT_ERROR_NODE = 2;
		private static readonly  ENTER_RULE = 3;
		private static readonly  EXIT_RULE = 4;

		private readonly  checksum:  TestPerformance.MurmurHashChecksum;

		public  constructor(checksum: TestPerformance.MurmurHashChecksum) {
			this.checksum = checksum;
		}


public  visitTerminal(node: TerminalNode):  void {
			this.checksum.update(ChecksumParseTreeListener.VISIT_TERMINAL);
			TestPerformance.updateChecksum(this.checksum, node.getSymbol());
		}


public  visitErrorNode(node: ErrorNode):  void {
			this.checksum.update(ChecksumParseTreeListener.VISIT_ERROR_NODE);
			TestPerformance.updateChecksum(this.checksum, node.getSymbol());
		}


public  enterEveryRule(ctx: ParserRuleContext):  void {
			this.checksum.update(ChecksumParseTreeListener.ENTER_RULE);
			TestPerformance.updateChecksum(this.checksum, ctx.getRuleIndex());
			TestPerformance.updateChecksum(this.checksum, ctx.getStart());
		}


public  exitEveryRule(ctx: ParserRuleContext):  void {
			this.checksum.update(ChecksumParseTreeListener.EXIT_RULE);
			TestPerformance.updateChecksum(this.checksum, ctx.getRuleIndex());
			TestPerformance.updateChecksum(this.checksum, ctx.getStop());
		}

	};


	public static readonly InputDescriptor =  class InputDescriptor {
		private readonly  source:  string;
		private  inputStream:  Reference<TestPerformance.CloneableANTLRFileStream>;

		public  constructor(source: string) {
			this.source = source;
			if (TestPerformance.PRELOAD_SOURCES) {
				this.getInputStream();
			}
		}


		public  getInputStream():  CharStream {
			let  stream = this.inputStream !== null ? this.inputStream.get() : null;
			if (stream === null) {
				try {
					stream = new  TestPerformance.CloneableANTLRFileStream(this.source, TestPerformance.ENCODING);
				} catch (ex) {
if (ex instanceof IOException) {
					throw new  RuntimeException(ex);
				} else {
	throw ex;
	}
}

				if (TestPerformance.PRELOAD_SOURCES) {
					this.inputStream = new  TestPerformance.StrongReference<TestPerformance.CloneableANTLRFileStream>(stream);
				} else {
					this.inputStream = new  SoftReference<TestPerformance.CloneableANTLRFileStream>(stream);
				}
			}

			return new  JavaUnicodeInputStream(stream.createCopy());
		}
	};


	public static CloneableANTLRFileStream =  class CloneableANTLRFileStream extends ANTLRFileStream {

		public  constructor(fileName: string, encoding: string) {
			super(fileName, encoding);
		}

		public  createCopy():  ANTLRInputStream {
			let  stream = new  ANTLRInputStream(this.data, this.n);
			stream.name = this.getSourceName();
			return stream;
		}
	};


	public static StrongReference =  class StrongReference<T> extends java.lang.ref.WeakReference<T> {
		public readonly  referent:  T;

		public  constructor(referent: T) {
			super(referent);
			this.referent = referent;
		}


public override  get():  T {
			return this.referent;
		}
	};


	public static MurmurHashChecksum =  class MurmurHashChecksum {
		private  value:  number;
		private  count:  number;

		public  constructor() {
			this.value = MurmurHash.initialize();
		}

		public  update(value: number):  void {
			this.value = MurmurHash.update(this.value, value);
			this.count++;
		}

		public  getValue():  number {
			return MurmurHash.finish(this.value, this.count);
		}
	};

    /**
     * Parse all java files under this package within the JDK_SOURCE_ROOT
     * (environment variable or property defined on the Java command line).
     */
    private static readonly  TOP_PACKAGE = "java.lang";
    /**
     * {@code true} to load java files from sub-packages of
     * {@link #TOP_PACKAGE}.
     */
    private static readonly  RECURSIVE = true;
	/**
	 * {@code true} to read all source files from disk into memory before
	 * starting the parse. The default value is {@code true} to help prevent
	 * drive speed from affecting the performance results. This value may be set
	 * to {@code false} to support parsing large input sets which would not
	 * otherwise fit into memory.
	 */
	private static readonly  PRELOAD_SOURCES = true;
	/**
	 * The encoding to use when reading source files.
	 */
	private static readonly  ENCODING = "utf-8";
	/**
	 * The maximum number of files to parse in a single iteration.
	 */
	private static readonly  MAX_FILES_PER_PARSE_ITERATION = number.MAX_VALUE;

	/**
	 * {@code true} to call {@link Collections#shuffle} on the list of input
	 * files before the first parse iteration.
	 */
	private static readonly  SHUFFLE_FILES_AT_START = false;
	/**
	 * {@code true} to call {@link Collections#shuffle} before each parse
	 * iteration <em>after</em> the first.
	 */
	private static readonly  SHUFFLE_FILES_AFTER_ITERATIONS = false;
	/**
	 * The instance of {@link Random} passed when calling
	 * {@link Collections#shuffle}.
	 */
	private static readonly  RANDOM = new  Random();

    /**
     * {@code true} to use the Java grammar with expressions in the v4
     * left-recursive syntax (JavaLR.g4). {@code false} to use the standard
     * grammar (Java.g4). In either case, the grammar is renamed in the
     * temporary directory to Java.g4 before compiling.
     */
    private static readonly  USE_LR_GRAMMAR = true;
    /**
     * {@code true} to specify the {@code -Xforce-atn} option when generating
     * the grammar, forcing all decisions in {@code JavaParser} to be handled by
     * {@link ParserATNSimulator#adaptivePredict}.
     */
    private static readonly  FORCE_ATN = false;
    /**
     * {@code true} to specify the {@code -atn} option when generating the
     * grammar. This will cause ANTLR to export the ATN for each decision as a
     * DOT (GraphViz) file.
     */
    private static readonly  EXPORT_ATN_GRAPHS = true;
	/**
	 * {@code true} to specify the {@code -XdbgST} option when generating the
	 * grammar.
	 */
	private static readonly  DEBUG_TEMPLATES = false;
	/**
	 * {@code true} to specify the {@code -XdbgSTWait} option when generating the
	 * grammar.
	 */
	private static readonly  DEBUG_TEMPLATES_WAIT = TestPerformance.DEBUG_TEMPLATES;
    /**
     * {@code true} to delete temporary (generated and compiled) files when the
     * test completes.
     */
    private static readonly  DELETE_TEMP_FILES = true;
	/**
	 * {@code true} to use a {@link ParserInterpreter} for parsing instead of
	 * generated parser.
	 */
	private static readonly  USE_PARSER_INTERPRETER = false;

	/**
	 * {@code true} to call {@link System#gc} and then wait for 5 seconds at the
	 * end of the test to make it easier for a profiler to grab a heap dump at
	 * the end of the test run.
	 */
    private static readonly  PAUSE_FOR_HEAP_DUMP = false;

    /**
     * Parse each file with {@code JavaParser.compilationUnit}.
     */
    private static readonly  RUN_PARSER = true;
    /**
     * {@code true} to use {@link BailErrorStrategy}, {@code false} to use
     * {@link DefaultErrorStrategy}.
     */
    private static readonly  BAIL_ON_ERROR = false;
	/**
	 * {@code true} to compute a checksum for verifying consistency across
	 * optimizations and multiple passes.
	 */
	private static readonly  COMPUTE_CHECKSUM = true;
    /**
     * This value is passed to {@link Parser#setBuildParseTree}.
     */
    private static readonly  BUILD_PARSE_TREES = false;
    /**
     * Use
     * {@link ParseTreeWalker#DEFAULT}{@code .}{@link ParseTreeWalker#walk walk}
     * with the {@code JavaParserBaseListener} to show parse tree walking
     * overhead. If {@link #BUILD_PARSE_TREES} is {@code false}, the listener
     * will instead be called during the parsing process via
     * {@link Parser#addParseListener}.
     */
    private static readonly  BLANK_LISTENER = false;

	/**
	 * Shows the number of {@link DFAState} and {@link ATNConfig} instances in
	 * the DFA cache at the end of each pass. If {@link #REUSE_LEXER_DFA} and/or
	 * {@link #REUSE_PARSER_DFA} are false, the corresponding instance numbers
	 * will only apply to one file (the last file if {@link #NUMBER_OF_THREADS}
	 * is 0, otherwise the last file which was parsed on the first thread).
	 */
    private static readonly  SHOW_DFA_STATE_STATS = true;
	/**
	 * If {@code true}, the DFA state statistics report includes a breakdown of
	 * the number of DFA states contained in each decision (with rule names).
	 */
	private static readonly  DETAILED_DFA_STATE_STATS = true;

	/**
	 * Specify the {@link PredictionMode} used by the
	 * {@link ParserATNSimulator}. If {@link #TWO_STAGE_PARSING} is
	 * {@code true}, this value only applies to the second stage, as the first
	 * stage will always use {@link PredictionMode#SLL}.
	 */
	private static readonly  PREDICTION_MODE = PredictionMode.LL;

	private static readonly  TWO_STAGE_PARSING = true;

    private static readonly  SHOW_CONFIG_STATS = false;

	/**
	 * If {@code true}, detailed statistics for the number of DFA edges were
	 * taken while parsing each file, as well as the number of DFA edges which
	 * required on-the-fly computation.
	 */
	private static readonly  COMPUTE_TRANSITION_STATS = false;
	private static readonly  SHOW_TRANSITION_STATS_PER_FILE = false;
	/**
	 * If {@code true}, the transition statistics will be adjusted to a running
	 * total before reporting the final results.
	 */
	private static readonly  TRANSITION_RUNNING_AVERAGE = false;
	/**
	 * If {@code true}, transition statistics will be weighted according to the
	 * total number of transitions taken during the parsing of each file.
	 */
	private static readonly  TRANSITION_WEIGHTED_AVERAGE = false;

	/**
	 * If {@code true}, after each pass a summary of the time required to parse
	 * each file will be printed.
	 */
	private static readonly  COMPUTE_TIMING_STATS = false;
	/**
	 * If {@code true}, the timing statistics for {@link #COMPUTE_TIMING_STATS}
	 * will be cumulative (i.e. the time reported for the <em>n</em>th file will
	 * be the total time required to parse the first <em>n</em> files).
	 */
	private static readonly  TIMING_CUMULATIVE = false;
	/**
	 * If {@code true}, the timing statistics will include the parser only. This
	 * flag allows for targeted measurements, and helps eliminate variance when
	 * {@link #PRELOAD_SOURCES} is {@code false}.
	 * <p/>
	 * This flag has no impact when {@link #RUN_PARSER} is {@code false}.
	 */
	private static readonly  TIME_PARSE_ONLY = false;

	/**
	 * When {@code true}, messages will be printed to {@link System#err} when
	 * the first stage (SLL) parsing resulted in a syntax error. This option is
	 * ignored when {@link #TWO_STAGE_PARSING} is {@code false}.
	 */
	private static readonly  REPORT_SECOND_STAGE_RETRY = true;
	private static readonly  REPORT_SYNTAX_ERRORS = true;
	private static readonly  REPORT_AMBIGUITIES = false;
	private static readonly  REPORT_FULL_CONTEXT = false;
	private static readonly  REPORT_CONTEXT_SENSITIVITY = TestPerformance.REPORT_FULL_CONTEXT;

    /**
     * If {@code true}, a single {@code JavaLexer} will be used, and
     * {@link Lexer#setInputStream} will be called to initialize it for each
     * source file. Otherwise, a new instance will be created for each file.
     */
    private static readonly  REUSE_LEXER = false;
	/**
	 * If {@code true}, a single DFA will be used for lexing which is shared
	 * across all threads and files. Otherwise, each file will be lexed with its
	 * own DFA which is accomplished by creating one ATN instance per thread and
	 * clearing its DFA cache before lexing each file.
	 */
	private static readonly  REUSE_LEXER_DFA = true;
    /**
     * If {@code true}, a single {@code JavaParser} will be used, and
     * {@link Parser#setInputStream} will be called to initialize it for each
     * source file. Otherwise, a new instance will be created for each file.
     */
    private static readonly  REUSE_PARSER = false;
	/**
	 * If {@code true}, a single DFA will be used for parsing which is shared
	 * across all threads and files. Otherwise, each file will be parsed with
	 * its own DFA which is accomplished by creating one ATN instance per thread
	 * and clearing its DFA cache before parsing each file.
	 */
	private static readonly  REUSE_PARSER_DFA = true;
    /**
     * If {@code true}, the shared lexer and parser are reset after each pass.
     * If {@code false}, all passes after the first will be fully "warmed up",
     * which makes them faster and can compare them to the first warm-up pass,
     * but it will not distinguish bytecode load/JIT time from warm-up time
     * during the first pass.
     */
    private static readonly  CLEAR_DFA = false;
    /**
     * Total number of passes to make over the source.
     */
    private static readonly  PASSES = 4;

	/**
	 * This option controls the granularity of multi-threaded parse operations.
	 * If {@code true}, the parsing operation will be parallelized across files;
	 * otherwise the parsing will be parallelized across multiple iterations.
	 */
	private static readonly  FILE_GRANULARITY = true;

	/**
	 * Number of parser threads to use.
	 */
	private static readonly  NUMBER_OF_THREADS = 1;

    private static readonly  sharedLexers = new  Array<Lexer>(TestPerformance.NUMBER_OF_THREADS);

    private static readonly  sharedParsers = new  Array<Parser>(TestPerformance.NUMBER_OF_THREADS);

    private static readonly  sharedListeners = new  Array<ParseTreeListener>(TestPerformance.NUMBER_OF_THREADS);

	private static readonly  totalTransitionsPerFile:  BigInt64Array[];
	private static readonly  computedTransitionsPerFile:  BigInt64Array[];

	private static readonly  decisionInvocationsPerFile:  BigInt64Array[][];
	private static readonly  fullContextFallbackPerFile:  BigInt64Array[][];
	private static readonly  nonSllPerFile:  BigInt64Array[][];
	private static readonly  totalTransitionsPerDecisionPerFile:  BigInt64Array[][];
	private static readonly  computedTransitionsPerDecisionPerFile:  BigInt64Array[][];
	private static readonly  fullContextTransitionsPerDecisionPerFile:  BigInt64Array[][];

	private static readonly  timePerFile:  BigInt64Array[];
	private static readonly  tokensPerFile:  Int32Array[];

    protected  configOutputSize = 0;

    private readonly  tokenCount = new  AtomicIntegerArray(TestPerformance.PASSES);

    public static  getOptionsDescription(topPackage: string):  string {
        let  builder = new  StringBuilder();
        builder.append("Input=");
        if (topPackage.isEmpty()) {
            builder.append("*");
        }
        else {
            builder.append(topPackage).append(".*");
        }

        builder.append(", Grammar=").append(TestPerformance.USE_LR_GRAMMAR ? "LR" : "Standard");
        builder.append(", ForceAtn=").append(TestPerformance.FORCE_ATN);

        builder.append(NewLine);

        builder.append("Op=Lex").append(TestPerformance.RUN_PARSER ? "+Parse" : " only");
        builder.append(", Strategy=").append(TestPerformance.BAIL_ON_ERROR ? BailErrorStrategy.class.getSimpleName() : DefaultErrorStrategy.class.getSimpleName());
        builder.append(", BuildParseTree=").append(TestPerformance.BUILD_PARSE_TREES);
        builder.append(", WalkBlankListener=").append(TestPerformance.BLANK_LISTENER);

        builder.append(NewLine);

        builder.append("Lexer=").append(TestPerformance.REUSE_LEXER ? "setInputStream" : "newInstance");
        builder.append(", Parser=").append(TestPerformance.REUSE_PARSER ? "setInputStream" : "newInstance");
        builder.append(", AfterPass=").append(TestPerformance.CLEAR_DFA ? "newInstance" : "setInputStream");

        builder.append(NewLine);

        return builder.toString();
    }

	private static  sum(array: BigInt64Array):  bigint {
		let  result = 0;
		for (let  i = 0; i < array.length; i++) {
			result += array[i];
		}

		return result;
	}

	private static  updateChecksum(checksum: TestPerformance.MurmurHashChecksum, value: number):  void;

	private static  updateChecksum(checksum: TestPerformance.MurmurHashChecksum, token: Token):  void;
private static updateChecksum(...args: unknown[]):  void {
		switch (args.length) {
			case 2: {
				const [checksum, value] = args as [TestPerformance.MurmurHashChecksum, number];


		checksum.update(value);


				break;
			}

			case 2: {
				const [checksum, token] = args as [TestPerformance.MurmurHashChecksum, Token];


		if (token === null) {
			checksum.update(0);
			return;
		}

		TestPerformance.updateChecksum(checksum, token.getStartIndex());
		TestPerformance.updateChecksum(checksum, token.getStopIndex());
		TestPerformance.updateChecksum(checksum, token.getLine());
		TestPerformance.updateChecksum(checksum, token.getCharPositionInLine());
		TestPerformance.updateChecksum(checksum, token.getType());
		TestPerformance.updateChecksum(checksum, token.getChannel());


				break;
			}

			default: {
				throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
			}
		}
	}


    @Test
@Test

    @Disabled
public  compileJdk():  void {
        let  jdkSourceRoot = this.getSourceRoot("JDK");
		assertTrue(jdkSourceRoot !== null && !jdkSourceRoot.isEmpty(),
				"The JDK_SOURCE_ROOT environment variable must be set for performance testing.");

        let  javaCompiledState = this.compileJavaParser(TestPerformance.USE_LR_GRAMMAR);
         let  lexerName    = TestPerformance.USE_LR_GRAMMAR ? "JavaLRLexer"        : "JavaLexer";
         let  parserName   = TestPerformance.USE_LR_GRAMMAR ? "JavaLRParser"       : "JavaParser";
         let  listenerName = TestPerformance.USE_LR_GRAMMAR ? "JavaLRBaseListener" : "JavaBaseListener";
         let  entryPoint = "compilationUnit";
         let  factory = this.getParserFactory(javaCompiledState, listenerName, entryPoint);

		if (!TestPerformance.TOP_PACKAGE.isEmpty()) {
            jdkSourceRoot = jdkSourceRoot + '/' + TestPerformance.TOP_PACKAGE.replace('.', '/');
        }

        let  directory = new  File(jdkSourceRoot);
        assertTrue(directory.isDirectory());

		let  filesFilter = TestPerformance.FilenameFilters.extension(".java", false);
		let  directoriesFilter = TestPerformance.FilenameFilters.ALL_FILES;
		 let  sources = this.loadSources(directory, filesFilter, directoriesFilter, TestPerformance.RECURSIVE);

		for (let  i = 0; i < TestPerformance.PASSES; i++) {
			if (TestPerformance.COMPUTE_TRANSITION_STATS) {
				TestPerformance.totalTransitionsPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION));
				TestPerformance.computedTransitionsPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION));

				if (TestPerformance.DETAILED_DFA_STATE_STATS) {
					TestPerformance.decisionInvocationsPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION))[];
					TestPerformance.fullContextFallbackPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION))[];
					TestPerformance.nonSllPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION))[];
					TestPerformance.totalTransitionsPerDecisionPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION))[];
					TestPerformance.computedTransitionsPerDecisionPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION))[];
					TestPerformance.fullContextTransitionsPerDecisionPerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION))[];
				}
			}

			if (TestPerformance.COMPUTE_TIMING_STATS) {
				TestPerformance.timePerFile[i] = new  BigInt64Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION));
				TestPerformance.tokensPerFile[i] = new  Int32Array(Math.min(sources.size(), TestPerformance.MAX_FILES_PER_PARSE_ITERATION));
			}
		}

		System.out.format("Located %d source files.%n", sources.size());
		System.out.print(TestPerformance.getOptionsDescription(TestPerformance.TOP_PACKAGE));

		let  executorService = Executors.newFixedThreadPool(TestPerformance.FILE_GRANULARITY ? 1 : TestPerformance.NUMBER_OF_THREADS, new  TestPerformance.NumberedThreadFactory());

		let  passResults = new  Array<Future<unknown>>();
		passResults.add(executorService.submit(new  class extends Runnable {

public  run():  void {
				try {
					$outer.parse1(0, factory, sources, TestPerformance.SHUFFLE_FILES_AT_START);
				} catch (ex) {
if (ex instanceof InterruptedException) {
					java.lang.System.Logger.getLogger(TestPerformance.class.getName()).log(java.lang.System.Logger.Level.SEVERE, null, ex);
				} else {
	throw ex;
	}
}
			}
		}()));
        for (let  i = 0; i < TestPerformance.PASSES - 1; i++) {
             let  currentPass = i + 1;
			passResults.add(executorService.submit(new  class extends Runnable {

public  run():  void {
					if (TestPerformance.CLEAR_DFA) {
						let  index = TestPerformance.FILE_GRANULARITY ? 0 : (Thread.currentThread() as TestPerformance.NumberedThread).getThreadNumber();
						if (TestPerformance.sharedLexers.length > 0 && TestPerformance.sharedLexers[index] !== null) {
							let  atn = TestPerformance.sharedLexers[index].getATN();
							for (let  j = 0; j < TestPerformance.sharedLexers[index].getInterpreter().decisionToDFA.length; j++) {
								TestPerformance.sharedLexers[index].getInterpreter().decisionToDFA[j] = new  DFA(atn.getDecisionState(j), j);
							}
						}

						if (TestPerformance.sharedParsers.length > 0 && TestPerformance.sharedParsers[index] !== null) {
							let  atn = TestPerformance.sharedParsers[index].getATN();
							for (let  j = 0; j < TestPerformance.sharedParsers[index].getInterpreter().decisionToDFA.length; j++) {
								TestPerformance.sharedParsers[index].getInterpreter().decisionToDFA[j] = new  DFA(atn.getDecisionState(j), j);
							}
						}

						if (TestPerformance.FILE_GRANULARITY) {
							Arrays.fill(TestPerformance.sharedLexers, null);
							Arrays.fill(TestPerformance.sharedParsers, null);
						}
					}

					try {
						$outer.parse2(currentPass, factory, sources, TestPerformance.SHUFFLE_FILES_AFTER_ITERATIONS);
					} catch (ex) {
if (ex instanceof InterruptedException) {
						java.lang.System.Logger.getLogger(TestPerformance.class.getName()).log(java.lang.System.Logger.Level.SEVERE, null, ex);
					} else {
	throw ex;
	}
}
				}
			}()));
        }

		for (let passResult of passResults) {
			passResult.get();
		}

		executorService.shutdown();
		executorService.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);

		if (TestPerformance.COMPUTE_TRANSITION_STATS && TestPerformance.SHOW_TRANSITION_STATS_PER_FILE) {
			this.computeTransitionStatistics();
		}

		if (TestPerformance.COMPUTE_TIMING_STATS) {
			this.computeTimingStatistics();
		}

		sources.clear();
		if (TestPerformance.PAUSE_FOR_HEAP_DUMP) {
			System.gc();
			System.out.println("Pausing before application exit.");
			try {
				Thread.sleep(4000);
			} catch (ex) {
if (ex instanceof InterruptedException) {
				java.lang.System.Logger.getLogger(TestPerformance.class.getName()).log(java.lang.System.Logger.Level.SEVERE, null, ex);
			} else {
	throw ex;
	}
}
		}
    }

	@Test
@Test

	@Timeout(20)
public  testExponentialInclude(/* @TempDir */  tempDir: Path):  void {
		let  tempDirPath = tempDir.toString();
		let  grammarFormat =
			"parser grammar Level_%d_%d;\n" +
			"\n" +
			"%s import Level_%d_1, Level_%d_2;\n" +
			"\n" +
			"rule_%d_%d : EOF;\n";

		FileUtils.mkdir(tempDirPath);

		let  startTime = System.nanoTime();

		let  levels = 20;
		for (let  level = 0; level < levels; level++) {
			let  leafPrefix = level === levels - 1 ? "//" : "";
			let  grammar1 = string.format(grammarFormat, level, 1, leafPrefix, level + 1, level + 1, level, 1);
			writeFile(tempDirPath, "Level_" + level + "_1.g4", grammar1);
			if (level > 0) {
				let  grammar2 = string.format(grammarFormat, level, 2, leafPrefix, level + 1, level + 1, level, 1);
				writeFile(tempDirPath, "Level_" + level + "_2.g4", grammar2);
			}
		}

		let  equeue = Generator.antlrOnString(tempDirPath, "Java", "Level_0_1.g4", false);
		assertTrue(equeue.errors.isEmpty());

		let  endTime = System.nanoTime();
		System.out.format("%s milliseconds.%n", (endTime - startTime) / 1000000.0);
	}

    /**
     *  This method is separate from {@link #parse2} so the first pass can be distinguished when analyzing
     *  profiler results.
     */
    protected  parse1(currentPass: number, factory: TestPerformance.ParserFactory, sources: Collection<TestPerformance.InputDescriptor>, shuffleSources: boolean):  void {
		if (TestPerformance.FILE_GRANULARITY) {
			System.gc();
		}

        this.parseSources(currentPass, factory, sources, shuffleSources);
    }

    /**
     *  This method is separate from {@link #parse1} so the first pass can be distinguished when analyzing
     *  profiler results.
     */
    protected  parse2(currentPass: number, factory: TestPerformance.ParserFactory, sources: Collection<TestPerformance.InputDescriptor>, shuffleSources: boolean):  void {
		if (TestPerformance.FILE_GRANULARITY) {
			System.gc();
		}

        this.parseSources(currentPass, factory, sources, shuffleSources);
    }

    protected  loadSources(directory: File, filesFilter: FilenameFilter, directoriesFilter: FilenameFilter, recursive: boolean):  Array<TestPerformance.InputDescriptor>;

    protected  loadSources(directory: File, filesFilter: FilenameFilter, directoriesFilter: FilenameFilter, recursive: boolean, result: Collection<TestPerformance.InputDescriptor>):  void;
protected loadSources(...args: unknown[]):  Array<TestPerformance.InputDescriptor> |  void {
		switch (args.length) {
			case 4: {
				const [directory, filesFilter, directoriesFilter, recursive] = args as [File, FilenameFilter, FilenameFilter, boolean];


        let  result = new  Array<TestPerformance.InputDescriptor>();
        this.loadSources(directory, filesFilter, directoriesFilter, recursive, result);
        return result;


				break;
			}

			case 5: {
				const [directory, filesFilter, directoriesFilter, recursive, result] = args as [File, FilenameFilter, FilenameFilter, boolean, Collection<TestPerformance.InputDescriptor>];


        /* assert directory.isDirectory(); */

        let  sources = directory.listFiles(filesFilter);
        for (let file of sources) {
			if (!file.isFile()) {
				continue;
			}

			result.add(new  TestPerformance.InputDescriptor(file.getAbsolutePath()));
        }

        if (recursive) {
            let  children = directory.listFiles(directoriesFilter);
            for (let child of children) {
                if (child.isDirectory()) {
                    this.loadSources(child, filesFilter, directoriesFilter, true, result);
                }
            }
        }


				break;
			}

			default: {
				throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
			}
		}
	}


	protected  parseSources(/* final */  currentPass: number, /* final */  factory: TestPerformance.ParserFactory, sources: Collection<TestPerformance.InputDescriptor>, shuffleSources: boolean):  void {
		if (shuffleSources) {
			let  sourcesList = new  Array<TestPerformance.InputDescriptor>(sources);
			/* synchronized (RANDOM) { */
				Collections.shuffle(sourcesList, TestPerformance.RANDOM);
			/* } */

			sources = sourcesList;
		}

		let  startTime = System.nanoTime();
        this.tokenCount.set(currentPass, 0);
        let  inputSize = 0;
		let  inputCount = 0;

		let  results = new  Array<Future<TestPerformance.FileParseResult>>();
		let  executorService: ExecutorService;
		if (TestPerformance.FILE_GRANULARITY) {
			executorService = Executors.newFixedThreadPool(TestPerformance.FILE_GRANULARITY ? TestPerformance.NUMBER_OF_THREADS : 1, new  TestPerformance.NumberedThreadFactory());
		} else {
			executorService = Executors.newSingleThreadExecutor(new  TestPerformance.FixedThreadNumberFactory((Thread.currentThread() as TestPerformance.NumberedThread).getThreadNumber()));
		}

		for (let inputDescriptor of sources) {
			if (inputCount >= TestPerformance.MAX_FILES_PER_PARSE_ITERATION) {
				break;
			}

			 let  input = inputDescriptor.getInputStream();
            input.seek(0);
            inputSize += input.size();
			inputCount++;
			let  futureChecksum = executorService.submit(new  class extends Callable<TestPerformance.FileParseResult> {

public  call():  TestPerformance.FileParseResult {
					// this incurred a great deal of overhead and was causing significant variations in performance results.
					//System.out.format("Parsing file %s\n", input.getSourceName());
					try {
						return factory.parseFile(input, currentPass, (Thread.currentThread() as TestPerformance.NumberedThread).getThreadNumber());
					} catch (exOrT) {
if (exOrT instanceof IllegalStateException) {
						const ex = exOrT;
ex.printStackTrace(System.err);
					}else if (exOrT instanceof Throwable) {
						const t = exOrT;
t.printStackTrace(System.err);
					} else {
	throw exOrT;
	}
}

					return null;
				}
			}());

			results.add(futureChecksum);
        }

		let  checksum = new  TestPerformance.MurmurHashChecksum();
		let  currentIndex = -1;
		for (let future of results) {
			currentIndex++;
			let  fileChecksum = 0;
			try {
				let  fileResult = future.get();
				if (TestPerformance.COMPUTE_TRANSITION_STATS) {
					TestPerformance.totalTransitionsPerFile[currentPass][currentIndex] = TestPerformance.sum(fileResult.parserTotalTransitions);
					TestPerformance.computedTransitionsPerFile[currentPass][currentIndex] = TestPerformance.sum(fileResult.parserComputedTransitions);

					if (TestPerformance.DETAILED_DFA_STATE_STATS) {
						TestPerformance.decisionInvocationsPerFile[currentPass][currentIndex] = fileResult.decisionInvocations;
						TestPerformance.fullContextFallbackPerFile[currentPass][currentIndex] = fileResult.fullContextFallback;
						TestPerformance.nonSllPerFile[currentPass][currentIndex] = fileResult.nonSll;
						TestPerformance.totalTransitionsPerDecisionPerFile[currentPass][currentIndex] = fileResult.parserTotalTransitions;
						TestPerformance.computedTransitionsPerDecisionPerFile[currentPass][currentIndex] = fileResult.parserComputedTransitions;
						TestPerformance.fullContextTransitionsPerDecisionPerFile[currentPass][currentIndex] = fileResult.parserFullContextTransitions;
					}
				}

				if (TestPerformance.COMPUTE_TIMING_STATS) {
					TestPerformance.timePerFile[currentPass][currentIndex] = fileResult.endTime - fileResult.startTime;
					TestPerformance.tokensPerFile[currentPass][currentIndex] = fileResult.tokenCount;
				}

				fileChecksum = fileResult.checksum;
			} catch (ex) {
if (ex instanceof ExecutionException) {
				java.lang.System.Logger.getLogger(TestPerformance.class.getName()).log(java.lang.System.Logger.Level.SEVERE, null, ex);
			} else {
	throw ex;
	}
}

			if (TestPerformance.COMPUTE_CHECKSUM) {
				TestPerformance.updateChecksum(checksum, fileChecksum);
			}
		}

		executorService.shutdown();
		executorService.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);

        System.out.format("%d. Total parse time for %d files (%d KB, %d tokens%s): %.0fms%n",
						  currentPass + 1,
                          inputCount,
                          inputSize / 1024,
                          this.tokenCount.get(currentPass),
						  TestPerformance.COMPUTE_CHECKSUM ? string.format(", checksum 0x%8X", checksum.getValue()) : "",
                          Number((System.nanoTime() - startTime)) / 1000000.0);

		if (TestPerformance.sharedLexers.length > 0) {
			let  index = TestPerformance.FILE_GRANULARITY ? 0 : (Thread.currentThread() as TestPerformance.NumberedThread).getThreadNumber();
			let  lexer = TestPerformance.sharedLexers[index];
			 let  lexerInterpreter = lexer.getInterpreter();
			 let  modeToDFA = lexerInterpreter.decisionToDFA;
			if (TestPerformance.SHOW_DFA_STATE_STATS) {
				let  states = 0;
				let  configs = 0;
				let  uniqueConfigs = new  HashSet<ATNConfig>();

				for (let  i = 0; i < modeToDFA.length; i++) {
					let  dfa = modeToDFA[i];
					if (dfa === null) {
						continue;
					}

					states += dfa.states.size();
					for (let state of dfa.states.values()) {
						configs += state.configs.size();
						uniqueConfigs.addAll(state.configs);
					}
				}

				System.out.format("There are %d lexer DFAState instances, %d configs (%d unique).%n", states, configs, uniqueConfigs.size());

				if (TestPerformance.DETAILED_DFA_STATE_STATS) {
					System.out.format("\tMode\tStates\tConfigs\tMode%n");
					for (let  i = 0; i < modeToDFA.length; i++) {
						let  dfa = modeToDFA[i];
						if (dfa === null || dfa.states.isEmpty()) {
							continue;
						}

						let  modeConfigs = 0;
						for (let state of dfa.states.values()) {
							modeConfigs += state.configs.size();
						}

						let  modeName = lexer.getModeNames()[i];
						System.out.format("\t%d\t%d\t%d\t%s%n", dfa.decision, dfa.states.size(), modeConfigs, modeName);
					}
				}
			}
		}

		if (TestPerformance.RUN_PARSER && TestPerformance.sharedParsers.length > 0) {
			let  index = TestPerformance.FILE_GRANULARITY ? 0 : (Thread.currentThread() as TestPerformance.NumberedThread).getThreadNumber();
			let  parser = TestPerformance.sharedParsers[index];
            // make sure the individual DFAState objects actually have unique ATNConfig arrays
             let  interpreter = parser.getInterpreter();
             let  decisionToDFA = interpreter.decisionToDFA;

            if (TestPerformance.SHOW_DFA_STATE_STATS) {
                let  states = 0;
				let  configs = 0;
				let  uniqueConfigs = new  HashSet<ATNConfig>();

                for (let  i = 0; i < decisionToDFA.length; i++) {
                    let  dfa = decisionToDFA[i];
                    if (dfa === null) {
                        continue;
                    }

                    states += dfa.states.size();
					for (let state of dfa.states.values()) {
						configs += state.configs.size();
						uniqueConfigs.addAll(state.configs);
					}
                }

                System.out.format("There are %d parser DFAState instances, %d configs (%d unique).%n", states, configs, uniqueConfigs.size());

				if (TestPerformance.DETAILED_DFA_STATE_STATS) {
					if (TestPerformance.COMPUTE_TRANSITION_STATS) {
						System.out.format("\tDecision\tStates\tConfigs\tPredict (ALL)\tPredict (LL)\tNon-SLL\tTransitions\tTransitions (ATN)\tTransitions (LL)\tLA (SLL)\tLA (LL)\tRule%n");
					}
					else {
						System.out.format("\tDecision\tStates\tConfigs\tRule%n");
					}

					for (let  i = 0; i < decisionToDFA.length; i++) {
						let  dfa = decisionToDFA[i];
						if (dfa === null || dfa.states.isEmpty()) {
							continue;
						}

						let  decisionConfigs = 0;
						for (let state of dfa.states.values()) {
							decisionConfigs += state.configs.size();
						}

						let  ruleName = parser.getRuleNames()[parser.getATN().decisionToState.get(dfa.decision).ruleIndex];

						let  calls = 0;
						let  fullContextCalls = 0;
						let  nonSllCalls = 0;
						let  transitions = 0;
						let  computedTransitions = 0;
						let  fullContextTransitions = 0;
						let  lookahead = 0;
						let  fullContextLookahead = 0;
						let  formatString: string;
						if (TestPerformance.COMPUTE_TRANSITION_STATS) {
							for (let data of TestPerformance.decisionInvocationsPerFile[currentPass]) {
								calls += data[i];
							}

							for (let data of TestPerformance.fullContextFallbackPerFile[currentPass]) {
								fullContextCalls += data[i];
							}

							for (let data of TestPerformance.nonSllPerFile[currentPass]) {
								nonSllCalls += data[i];
							}

							for (let data of TestPerformance.totalTransitionsPerDecisionPerFile[currentPass]) {
								transitions += data[i];
							}

							for (let data of TestPerformance.computedTransitionsPerDecisionPerFile[currentPass]) {
								computedTransitions += data[i];
							}

							for (let data of TestPerformance.fullContextTransitionsPerDecisionPerFile[currentPass]) {
								fullContextTransitions += data[i];
							}

							if (calls > 0) {
								lookahead = Number((transitions - fullContextTransitions)) / Number(calls);
							}

							if (fullContextCalls > 0) {
								fullContextLookahead = Number(fullContextTransitions) / Number(fullContextCalls);
							}

							formatString = "\t%1$d\t%2$d\t%3$d\t%4$d\t%5$d\t%6$d\t%7$d\t%8$d\t%9$d\t%10$f\t%11$f\t%12$s%n";
						}
						else {
							calls = 0;
							formatString = "\t%1$d\t%2$d\t%3$d\t%12$s%n";
						}

						System.out.format(formatString, dfa.decision, dfa.states.size(), decisionConfigs, calls, fullContextCalls, nonSllCalls, transitions, computedTransitions, fullContextTransitions, lookahead, fullContextLookahead, ruleName);
					}
				}
            }

            let  localDfaCount = 0;
            let  globalDfaCount = 0;
            let  localConfigCount = 0;
            let  globalConfigCount = 0;
            let  contextsInDFAState = new  Int32Array(0);

            for (let  i = 0; i < decisionToDFA.length; i++) {
                let  dfa = decisionToDFA[i];
                if (dfa === null) {
                    continue;
                }

                if (TestPerformance.SHOW_CONFIG_STATS) {
                    for (let state of dfa.states.keySet()) {
                        if (state.configs.size() >= contextsInDFAState.length) {
                            contextsInDFAState = Arrays.copyOf(contextsInDFAState, state.configs.size() + 1);
                        }

                        if (state.isAcceptState) {
                            let  hasGlobal = false;
                            for (let config of state.configs) {
                                if (config.reachesIntoOuterContext > 0) {
                                    globalConfigCount++;
                                    hasGlobal = true;
                                } else {
                                    localConfigCount++;
                                }
                            }

                            if (hasGlobal) {
                                globalDfaCount++;
                            } else {
                                localDfaCount++;
                            }
                        }

                        contextsInDFAState[state.configs.size()]++;
                    }
                }
            }

            if (TestPerformance.SHOW_CONFIG_STATS && currentPass === 0) {
                System.out.format("  DFA accept states: %d total, %d with only local context, %d with a global context%n", localDfaCount + globalDfaCount, localDfaCount, globalDfaCount);
                System.out.format("  Config stats: %d total, %d local, %d global%n", localConfigCount + globalConfigCount, localConfigCount, globalConfigCount);
                if (TestPerformance.SHOW_DFA_STATE_STATS) {
                    for (let  i = 0; i < contextsInDFAState.length; i++) {
                        if (contextsInDFAState[i] !== 0) {
                            System.out.format("  %d configs = %d%n", i, contextsInDFAState[i]);
                        }
                    }
                }
            }
        }

		if (TestPerformance.COMPUTE_TIMING_STATS) {
			System.out.format("File\tTokens\tTime%n");
			for (let  i = 0; i< TestPerformance.timePerFile[currentPass].length; i++) {
				System.out.format("%d\t%d\t%d%n", i + 1, TestPerformance.tokensPerFile[currentPass][i], TestPerformance.timePerFile[currentPass][i]);
			}
		}
    }

    protected  compileJavaParser(leftRecursive: boolean):  JavaCompiledState {
        let  grammarFileName = leftRecursive ? "JavaLR.g4"    : "Java.g4";
        let  parserName      = leftRecursive ? "JavaLRParser" : "JavaParser";
        let  lexerName       = leftRecursive ? "JavaLRLexer"  : "JavaLexer";
        let  body = java.lang.Runtime.load(grammarFileName);
        let  extraOptions = new  Array<string>();
		extraOptions.add("-Werror");
        if (TestPerformance.FORCE_ATN) {
            extraOptions.add("-Xforce-atn");
        }
        if (TestPerformance.EXPORT_ATN_GRAPHS) {
            extraOptions.add("-atn");
        }
		if (TestPerformance.DEBUG_TEMPLATES) {
			extraOptions.add("-XdbgST");
			if (TestPerformance.DEBUG_TEMPLATES_WAIT) {
				extraOptions.add("-XdbgSTWait");
			}
		}
        let  extraOptionsArray = extraOptions.toArray(new  Array<string>(0));

		let  runOptions = createOptionsForJavaToolTests(grammarFileName, body, parserName, lexerName,
				false, true, null, null,
				false, false, Stage.Compile);
		 {
// This holds the final error to throw (if any).
let error: java.lang.Throwable | undefined;

 const runner: RuntimeRunner  = new  JavaRunner()
try {
	try  {
			return  runner.run(runOptions) as JavaCompiledState;
		}
	finally {
	error = closeResources([runner]);
	}
} catch(e) {
	error = handleResourceError(e, error);
} finally {
	throwResourceError(error);
}
}

    }

    protected  getParserFactory(javaCompiledState: JavaCompiledState, listenerName: string, /* final */  entryPoint: string):  TestPerformance.ParserFactory {
        try {
            let  loader = javaCompiledState.loader;
			 let  listenerClass = loader.loadClass(listenerName).asSubclass(ParseTreeListener.class);

             let  lexerCtor = javaCompiledState.lexer.getConstructor(CharStream.class);
             let  parserCtor = javaCompiledState.parser.getConstructor(TokenStream.class);

            // construct initial instances of the lexer and parser to deserialize their ATNs
			javaCompiledState.initializeDummyLexerAndParser();

            return new  class implements ParserFactory {


public  parseFile(input: CharStream, currentPass: number, thread: number):  TestPerformance.FileParseResult {
					 let  checksum = new  TestPerformance.MurmurHashChecksum();

					 let  startTime = System.nanoTime();
					/* assert thread >= 0 && thread < NUMBER_OF_THREADS; */

                    try {
						let  listener = TestPerformance.sharedListeners[thread];
						if (listener === null) {
							listener = listenerClass.newInstance();
							TestPerformance.sharedListeners[thread] = listener;
						}

						let  lexer = TestPerformance.sharedLexers[thread];
                        if (TestPerformance.REUSE_LEXER && lexer !== null) {
                            lexer.setInputStream(input);
                        } else {
							let  previousLexer = lexer;
                            lexer = lexerCtor.newInstance(input);
							let  decisionToDFA = (TestPerformance.FILE_GRANULARITY || previousLexer === null ? lexer : previousLexer).getInterpreter().decisionToDFA;
							if (!TestPerformance.REUSE_LEXER_DFA || (!TestPerformance.FILE_GRANULARITY && previousLexer === null)) {
								decisionToDFA = new  Array<DFA>(decisionToDFA.length);
							}

							if (TestPerformance.COMPUTE_TRANSITION_STATS) {
								lexer.setInterpreter(new  TestPerformance.StatisticsLexerATNSimulator(lexer, lexer.getATN(), decisionToDFA, lexer.getInterpreter().getSharedContextCache()));
							} else {
 if (!TestPerformance.REUSE_LEXER_DFA) {
								lexer.setInterpreter(new  LexerATNSimulator(lexer, lexer.getATN(), decisionToDFA, lexer.getInterpreter().getSharedContextCache()));
							}
}


							TestPerformance.sharedLexers[thread] = lexer;
                        }

						lexer.removeErrorListeners();
						lexer.addErrorListener(TestPerformance.DescriptiveErrorListener.INSTANCE);

						if (lexer.getInterpreter().decisionToDFA[0] === null) {
							let  atn = lexer.getATN();
							for (let  i = 0; i < lexer.getInterpreter().decisionToDFA.length; i++) {
								lexer.getInterpreter().decisionToDFA[i] = new  DFA(atn.getDecisionState(i), i);
							}
						}

                        let  tokens = new  CommonTokenStream(lexer);
                        tokens.fill();
                        $outer.tokenCount.addAndGet(currentPass, tokens.size());

						if (TestPerformance.COMPUTE_CHECKSUM) {
							for (let token of tokens.getTokens()) {
								TestPerformance.updateChecksum(checksum, token);
							}
						}

                        if (!TestPerformance.RUN_PARSER) {
                            return new  TestPerformance.FileParseResult(input.getSourceName(), Number(checksum.getValue()), null, tokens.size(), startTime, lexer, null);
                        }

						 let  parseStartTime = System.nanoTime();
						let  parser = TestPerformance.sharedParsers[thread];
                        if (TestPerformance.REUSE_PARSER && parser !== null) {
                            parser.setInputStream(tokens);
                        } else {
							let  previousParser = parser;

							if (TestPerformance.USE_PARSER_INTERPRETER) {
								let  referenceParser = parserCtor.newInstance(tokens);
								parser = new  ParserInterpreter(referenceParser.getGrammarFileName(), referenceParser.getVocabulary(), Arrays.asList(referenceParser.getRuleNames()), referenceParser.getATN(), tokens);
							}
							else {
								parser = parserCtor.newInstance(tokens);
							}

							let  decisionToDFA = (TestPerformance.FILE_GRANULARITY || previousParser === null ? parser : previousParser).getInterpreter().decisionToDFA;
							if (!TestPerformance.REUSE_PARSER_DFA || (!TestPerformance.FILE_GRANULARITY && previousParser === null)) {
								decisionToDFA = new  Array<DFA>(decisionToDFA.length);
							}

							if (TestPerformance.COMPUTE_TRANSITION_STATS) {
								parser.setInterpreter(new  TestPerformance.StatisticsParserATNSimulator(parser, parser.getATN(), decisionToDFA, parser.getInterpreter().getSharedContextCache()));
							} else {
 if (!TestPerformance.REUSE_PARSER_DFA) {
								parser.setInterpreter(new  ParserATNSimulator(parser, parser.getATN(), decisionToDFA, parser.getInterpreter().getSharedContextCache()));
							}
}


							TestPerformance.sharedParsers[thread] = parser;
                        }

						parser.removeParseListeners();
						parser.removeErrorListeners();
						if (!TestPerformance.TWO_STAGE_PARSING) {
							parser.addErrorListener(TestPerformance.DescriptiveErrorListener.INSTANCE);
							parser.addErrorListener(new  TestPerformance.SummarizingDiagnosticErrorListener());
						}

						if (parser.getInterpreter().decisionToDFA[0] === null) {
							let  atn = parser.getATN();
							for (let  i = 0; i < parser.getInterpreter().decisionToDFA.length; i++) {
								parser.getInterpreter().decisionToDFA[i] = new  DFA(atn.getDecisionState(i), i);
							}
						}

						parser.getInterpreter().setPredictionMode(TestPerformance.TWO_STAGE_PARSING ? PredictionMode.SLL : TestPerformance.PREDICTION_MODE);
						parser.setBuildParseTree(TestPerformance.BUILD_PARSE_TREES);
						if (!TestPerformance.BUILD_PARSE_TREES && TestPerformance.BLANK_LISTENER) {
							parser.addParseListener(listener);
						}
						if (TestPerformance.BAIL_ON_ERROR || TestPerformance.TWO_STAGE_PARSING) {
							parser.setErrorHandler(new  BailErrorStrategy());
						}

                        let  parseMethod = javaCompiledState.parser.getMethod(entryPoint);
                        let  parseResult: Object;

						try {
							if (TestPerformance.COMPUTE_CHECKSUM && !TestPerformance.BUILD_PARSE_TREES) {
								parser.addParseListener(new  TestPerformance.ChecksumParseTreeListener(checksum));
							}

							if (TestPerformance.USE_PARSER_INTERPRETER) {
								let  parserInterpreter = parser as ParserInterpreter;
								parseResult = parserInterpreter.parse(Collections.lastIndexOfSubList(Arrays.asList(parser.getRuleNames()), Collections.singletonList(entryPoint)));
							}
							else {
								parseResult = parseMethod.invoke(parser);
							}
						} catch (ex) {
if (ex instanceof InvocationTargetException) {
							if (!TestPerformance.TWO_STAGE_PARSING) {
								throw ex;
							}

							let  sourceName = tokens.getSourceName();
							sourceName = sourceName !== null && !sourceName.isEmpty() ? sourceName+": " : "";
							if (TestPerformance.REPORT_SECOND_STAGE_RETRY) {
								System.err.println(sourceName+"Forced to retry with full context.");
							}

							if (!(ex.getCause() instanceof ParseCancellationException)) {
								throw ex;
							}

							tokens.seek(0);
							if (TestPerformance.REUSE_PARSER && parser !== null) {
								parser.setInputStream(tokens);
							} else {
								let  previousParser = parser;

								if (TestPerformance.USE_PARSER_INTERPRETER) {
									let  referenceParser = parserCtor.newInstance(tokens);
									parser = new  ParserInterpreter(referenceParser.getGrammarFileName(), referenceParser.getVocabulary(), Arrays.asList(referenceParser.getRuleNames()), referenceParser.getATN(), tokens);
								}
								else {
									parser = parserCtor.newInstance(tokens);
								}

								let  decisionToDFA = previousParser.getInterpreter().decisionToDFA;
								if (TestPerformance.COMPUTE_TRANSITION_STATS) {
									parser.setInterpreter(new  TestPerformance.StatisticsParserATNSimulator(parser, parser.getATN(), decisionToDFA, parser.getInterpreter().getSharedContextCache()));
								} else {
 if (!TestPerformance.REUSE_PARSER_DFA) {
									parser.setInterpreter(new  ParserATNSimulator(parser, parser.getATN(), decisionToDFA, parser.getInterpreter().getSharedContextCache()));
								}
}


								TestPerformance.sharedParsers[thread] = parser;
							}

							parser.removeParseListeners();
							parser.removeErrorListeners();
							parser.addErrorListener(TestPerformance.DescriptiveErrorListener.INSTANCE);
							parser.addErrorListener(new  TestPerformance.SummarizingDiagnosticErrorListener());
							parser.getInterpreter().setPredictionMode(PredictionMode.LL);
							parser.setBuildParseTree(TestPerformance.BUILD_PARSE_TREES);
							if (TestPerformance.COMPUTE_CHECKSUM && !TestPerformance.BUILD_PARSE_TREES) {
								parser.addParseListener(new  TestPerformance.ChecksumParseTreeListener(checksum));
							}
							if (!TestPerformance.BUILD_PARSE_TREES && TestPerformance.BLANK_LISTENER) {
								parser.addParseListener(listener);
							}
							if (TestPerformance.BAIL_ON_ERROR) {
								parser.setErrorHandler(new  BailErrorStrategy());
							}

							parseResult = parseMethod.invoke(parser);
						} else {
	throw ex;
	}
}

						assertTrue(parseResult instanceof ParseTree);
						if (TestPerformance.COMPUTE_CHECKSUM && TestPerformance.BUILD_PARSE_TREES) {
							ParseTreeWalker.DEFAULT.walk(new  TestPerformance.ChecksumParseTreeListener(checksum), parseResult as ParseTree);
						}
                        if (TestPerformance.BUILD_PARSE_TREES && TestPerformance.BLANK_LISTENER) {
                            ParseTreeWalker.DEFAULT.walk(listener, parseResult as ParseTree);
                        }

						return new  TestPerformance.FileParseResult(input.getSourceName(), Number(checksum.getValue()), parseResult as ParseTree, tokens.size(), TestPerformance.TIME_PARSE_ONLY ? parseStartTime : startTime, lexer, parser);
                    } catch (e) {
if (e instanceof Exception) {
						if (!TestPerformance.REPORT_SYNTAX_ERRORS && e instanceof ParseCancellationException) {
							return new  TestPerformance.FileParseResult("unknown", Number(checksum.getValue()), null, 0, startTime, null, null);
						}

                        e.printStackTrace(System.out);
                        throw new  IllegalStateException(e);
                    } else {
	throw e;
	}
}
                }
            }();
        } catch (e) {
if (e instanceof Exception) {
            e.printStackTrace(System.out);
            fail(e.getMessage());
            throw new  IllegalStateException(e);
        } else {
	throw e;
	}
}
    }

	/**
	 * Compute and print ATN/DFA transition statistics.
	 */
	private  computeTransitionStatistics():  void {
		if (TestPerformance.TRANSITION_RUNNING_AVERAGE) {
			for (let  i = 0; i < TestPerformance.PASSES; i++) {
				let  data = TestPerformance.computedTransitionsPerFile[i];
				for (let  j = 0; j < data.length - 1; j++) {
					data[j + 1] += data[j];
				}

				data = TestPerformance.totalTransitionsPerFile[i];
				for (let  j = 0; j < data.length - 1; j++) {
					data[j + 1] += data[j];
				}
			}
		}

		let  sumNum = new  BigInt64Array(TestPerformance.totalTransitionsPerFile[0].length);
		let  sumDen = new  BigInt64Array(TestPerformance.totalTransitionsPerFile[0].length);
		let  sumNormalized = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		for (let  i = 0; i < TestPerformance.PASSES; i++) {
			let  num = TestPerformance.computedTransitionsPerFile[i];
			let  den = TestPerformance.totalTransitionsPerFile[i];
			for (let  j = 0; j < den.length; j++) {
				sumNum[j] += num[j];
				sumDen[j] += den[j];
				if (den[j] > 0) {
					sumNormalized[j] += Number(num[j]) / Number(den[j]);
				}
			}
		}

		let  weightedAverage = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		let  average = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		for (let  i = 0; i < average.length; i++) {
			if (sumDen[i] > 0) {
				weightedAverage[i] = Number(sumNum[i]) / Number(sumDen[i]);
			}
			else {
				weightedAverage[i] = 0;
			}

			average[i] = sumNormalized[i] / TestPerformance.PASSES;
		}

		let  low95 = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		let  high95 = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		let  low67 = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		let  high67 = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		let  stddev = new  Float64Array(TestPerformance.totalTransitionsPerFile[0].length);
		for (let  i = 0; i < stddev.length; i++) {
			let  points = new  Float64Array(TestPerformance.PASSES);
			for (let  j = 0; j < TestPerformance.PASSES; j++) {
				let  totalTransitions = TestPerformance.totalTransitionsPerFile[j][i];
				if (totalTransitions > 0) {
					points[j] = (Number(TestPerformance.computedTransitionsPerFile[j][i]) / Number(TestPerformance.totalTransitionsPerFile[j][i]));
				}
				else {
					points[j] = 0;
				}
			}

			Arrays.sort(points);

			 let  averageValue = TestPerformance.TRANSITION_WEIGHTED_AVERAGE ? weightedAverage[i] : average[i];
			let  value = 0;
			for (let  j = 0; j < TestPerformance.PASSES; j++) {
				let  diff = points[j] - averageValue;
				value += diff * diff;
			}

			let  ignoreCount95 = Number(Math.round(TestPerformance.PASSES * (1 - 0.95) / 2.0));
			let  ignoreCount67 = Number(Math.round(TestPerformance.PASSES * (1 - 0.667) / 2.0));
			low95[i] = points[ignoreCount95];
			high95[i] = points[points.length - 1 - ignoreCount95];
			low67[i] = points[ignoreCount67];
			high67[i] = points[points.length - 1 - ignoreCount67];
			stddev[i] = Math.sqrt(value / TestPerformance.PASSES);
		}

		System.out.format("File\tAverage\tStd. Dev.\t95%% Low\t95%% High\t66.7%% Low\t66.7%% High%n");
		for (let  i = 0; i < stddev.length; i++) {
			 let  averageValue = TestPerformance.TRANSITION_WEIGHTED_AVERAGE ? weightedAverage[i] : average[i];
			System.out.format("%d\t%e\t%e\t%e\t%e\t%e\t%e%n", i + 1, averageValue, stddev[i], averageValue - low95[i], high95[i] - averageValue, averageValue - low67[i], high67[i] - averageValue);
		}
	}

	/**
	 * Compute and print timing statistics.
	 */
	private  computeTimingStatistics():  void {
		if (TestPerformance.TIMING_CUMULATIVE) {
			for (let  i = 0; i < TestPerformance.PASSES; i++) {
				let  data = TestPerformance.timePerFile[i];
				for (let  j = 0; j < data.length - 1; j++) {
					data[j + 1] += data[j];
				}

				let  data2 = TestPerformance.tokensPerFile[i];
				for (let  j = 0; j < data2.length - 1; j++) {
					data2[j + 1] += data2[j];
				}
			}
		}

		 let  fileCount = TestPerformance.timePerFile[0].length;
		let  sum = new  Float64Array(fileCount);
		for (let  i = 0; i < TestPerformance.PASSES; i++) {
			let  data = TestPerformance.timePerFile[i];
			let  tokenData = TestPerformance.tokensPerFile[i];
			for (let  j = 0; j < data.length; j++) {
				sum[j] += Number(data[j]) / Number(tokenData[j]);
			}
		}

		let  average = new  Float64Array(fileCount);
		for (let  i = 0; i < average.length; i++) {
			average[i] = sum[i] / TestPerformance.PASSES;
		}

		let  low95 = new  Float64Array(fileCount);
		let  high95 = new  Float64Array(fileCount);
		let  low67 = new  Float64Array(fileCount);
		let  high67 = new  Float64Array(fileCount);
		let  stddev = new  Float64Array(fileCount);
		for (let  i = 0; i < stddev.length; i++) {
			let  points = new  Float64Array(TestPerformance.PASSES);
			for (let  j = 0; j < TestPerformance.PASSES; j++) {
				points[j] = Number(TestPerformance.timePerFile[j][i]) / Number(TestPerformance.tokensPerFile[j][i]);
			}

			Arrays.sort(points);

			 let  averageValue = average[i];
			let  value = 0;
			for (let  j = 0; j < TestPerformance.PASSES; j++) {
				let  diff = points[j] - averageValue;
				value += diff * diff;
			}

			let  ignoreCount95 = Number(Math.round(TestPerformance.PASSES * (1 - 0.95) / 2.0));
			let  ignoreCount67 = Number(Math.round(TestPerformance.PASSES * (1 - 0.667) / 2.0));
			low95[i] = points[ignoreCount95];
			high95[i] = points[points.length - 1 - ignoreCount95];
			low67[i] = points[ignoreCount67];
			high67[i] = points[points.length - 1 - ignoreCount67];
			stddev[i] = Math.sqrt(value / TestPerformance.PASSES);
		}

		System.out.format("File\tAverage\tStd. Dev.\t95%% Low\t95%% High\t66.7%% Low\t66.7%% High%n");
		for (let  i = 0; i < stddev.length; i++) {
			 let  averageValue = average[i];
			System.out.format("%d\t%e\t%e\t%e\t%e\t%e\t%e%n", i + 1, averageValue, stddev[i], averageValue - low95[i], high95[i] - averageValue, averageValue - low67[i], high67[i] - averageValue);
		}
	}

	private  getSourceRoot(prefix: string):  string {
		let  sourceRoot = System.getenv(prefix+"_SOURCE_ROOT");
		if (sourceRoot === null) {
			sourceRoot = System.getProperty(prefix+"_SOURCE_ROOT");
		}

		return sourceRoot;
	}
	 static {
		if (TestPerformance.COMPUTE_TRANSITION_STATS) {
			TestPerformance.totalTransitionsPerFile = new  BigInt64Array(TestPerformance.PASSES)[];
			TestPerformance.computedTransitionsPerFile = new  BigInt64Array(TestPerformance.PASSES)[];
		} else {
			TestPerformance.totalTransitionsPerFile = null;
			TestPerformance.computedTransitionsPerFile = null;
		}
	}
	 static {
		if (TestPerformance.COMPUTE_TRANSITION_STATS && TestPerformance.DETAILED_DFA_STATE_STATS) {
			TestPerformance.decisionInvocationsPerFile = new  BigInt64Array(TestPerformance.PASSES)[][];
			TestPerformance.fullContextFallbackPerFile = new  BigInt64Array(TestPerformance.PASSES)[][];
			TestPerformance.nonSllPerFile = new  BigInt64Array(TestPerformance.PASSES)[][];
			TestPerformance.totalTransitionsPerDecisionPerFile = new  BigInt64Array(TestPerformance.PASSES)[][];
			TestPerformance.computedTransitionsPerDecisionPerFile = new  BigInt64Array(TestPerformance.PASSES)[][];
			TestPerformance.fullContextTransitionsPerDecisionPerFile = new  BigInt64Array(TestPerformance.PASSES)[][];
		} else {
			TestPerformance.decisionInvocationsPerFile = null;
			TestPerformance.fullContextFallbackPerFile = null;
			TestPerformance.nonSllPerFile = null;
			TestPerformance.totalTransitionsPerDecisionPerFile = null;
			TestPerformance.computedTransitionsPerDecisionPerFile = null;
			TestPerformance.fullContextTransitionsPerDecisionPerFile = null;
		}
	}
	 static {
		if (TestPerformance.COMPUTE_TIMING_STATS) {
			TestPerformance.timePerFile = new  BigInt64Array(TestPerformance.PASSES)[];
			TestPerformance.tokensPerFile = new  Int32Array(TestPerformance.PASSES)[];
		} else {
			TestPerformance.timePerFile = null;
			TestPerformance.tokensPerFile = null;
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace TestPerformance {
	export  interface ParserFactory {
          parseFile(input: CharStream, currentPass: number, thread: number): TestPerformance.FileParseResult;
    }

	export type FileParseResult = InstanceType<typeof TestPerformance.FileParseResult>;
	export type StatisticsLexerATNSimulator = InstanceType<typeof TestPerformance.StatisticsLexerATNSimulator>;
	export type StatisticsParserATNSimulator = InstanceType<typeof TestPerformance.StatisticsParserATNSimulator>;
	export type DescriptiveErrorListener = InstanceType<typeof TestPerformance.DescriptiveErrorListener>;
	export type SummarizingDiagnosticErrorListener = InstanceType<typeof TestPerformance.SummarizingDiagnosticErrorListener>;
	export type FilenameFilters = InstanceType<typeof TestPerformance.FilenameFilters>;


// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
namespace FilenameFilters {
	export type FileExtensionFilenameFilter = InstanceType<typeof FilenameFilters.FileExtensionFilenameFilter>;
	export type FileNameFilenameFilter = InstanceType<typeof FilenameFilters.FileNameFilenameFilter>;
	export type AllFilenameFilter = InstanceType<typeof FilenameFilters.AllFilenameFilter>;
	export type AnyFilenameFilter = InstanceType<typeof FilenameFilters.AnyFilenameFilter>;
	export type NotFilenameFilter = InstanceType<typeof FilenameFilters.NotFilenameFilter>;
}

	export type NumberedThread = InstanceType<typeof TestPerformance.NumberedThread>;
	export type NumberedThreadFactory = InstanceType<typeof TestPerformance.NumberedThreadFactory>;
	export type FixedThreadNumberFactory = InstanceType<typeof TestPerformance.FixedThreadNumberFactory>;
	export type ChecksumParseTreeListener = InstanceType<typeof TestPerformance.ChecksumParseTreeListener>;
	export type InputDescriptor = InstanceType<typeof TestPerformance.InputDescriptor>;
	export type CloneableANTLRFileStream = InstanceType<typeof TestPerformance.CloneableANTLRFileStream>;
	export type StrongReference<<T>> = InstanceType<typeof TestPerformance.StrongReference<T>>;
	export type MurmurHashChecksum = InstanceType<typeof TestPerformance.MurmurHashChecksum>;
});
