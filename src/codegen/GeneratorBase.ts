/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IGenerationOptions } from "../config/config.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { CharSupport } from "../misc/CharSupport.js";
import { Character } from "../support/Character.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import { Grammar } from "../tool/Grammar.js";
import type { Rule } from "../tool/Rule.js";
import type { CodePoint, ISharedInvariants, ITargetGenerator, Lines } from "./ITargetGenerator.js";

import { Action } from "./model/Action.js";
import { AddToLabelList } from "./model/AddToLabelList.js";
import { AltBlock } from "./model/AltBlock.js";
import { CaptureNextToken } from "./model/CaptureNextToken.js";
import { CaptureNextTokenType } from "./model/CaptureNextTokenType.js";
import { ActionChunk } from "./model/chunk/ActionChunk.js";
import { ActionText } from "./model/chunk/ActionText.js";
import { ArgRef } from "./model/chunk/ArgRef.js";
import type { LabelRef } from "./model/chunk/LabelRef.js";
import { ListLabelRef } from "./model/chunk/ListLabelRef.js";
import { LocalRef } from "./model/chunk/LocalRef.js";
import { NonLocalAttrRef } from "./model/chunk/NonLocalAttrRef.js";
import { QRetValueRef } from "./model/chunk/QRetValueRef.js";
import { RetValueRef } from "./model/chunk/RetValueRef.js";
import { RulePropertyRef } from "./model/chunk/RulePropertyRef.js";
import { RulePropertyRefCtx } from "./model/chunk/RulePropertyRefCtx.js";
import { RulePropertyRefParser } from "./model/chunk/RulePropertyRefParser.js";
import { RulePropertyRefStart } from "./model/chunk/RulePropertyRefStart.js";
import { RulePropertyRefStop } from "./model/chunk/RulePropertyRefStop.js";
import { RulePropertyRefText } from "./model/chunk/RulePropertyRefText.js";
import { SetAttr } from "./model/chunk/SetAttr.js";
import { SetNonLocalAttr } from "./model/chunk/SetNonLocalAttr.js";
import { ThisRulePropertyRefCtx } from "./model/chunk/ThisRulePropertyRefCtx.js";
import { ThisRulePropertyRefParser } from "./model/chunk/ThisRulePropertyRefParser.js";
import { ThisRulePropertyRefStart } from "./model/chunk/ThisRulePropertyRefStart.js";
import { ThisRulePropertyRefStop } from "./model/chunk/ThisRulePropertyRefStop.js";
import { ThisRulePropertyRefText } from "./model/chunk/ThisRulePropertyRefText.js";
import { TokenPropertyRefIndex } from "./model/chunk/TokenPropertyRefIndex.js";
import { TokenPropertyRefInt } from "./model/chunk/TokenPropertyRefInt.js";
import { TokenPropertyRefLine } from "./model/chunk/TokenPropertyRefLine.js";
import { TokenPropertyRefPos } from "./model/chunk/TokenPropertyRefPos.js";
import { TokenPropertyRefText } from "./model/chunk/TokenPropertyRefText.js";
import { TokenPropertyRefType } from "./model/chunk/TokenPropertyRefType.js";
import { TokenRef } from "./model/chunk/TokenRef.js";
import { CodeBlockForAlt } from "./model/CodeBlockForAlt.js";
import { CodeBlockForOuterMostAlt } from "./model/CodeBlockForOuterMostAlt.js";
import { AltLabelStructDecl } from "./model/decl/AltLabelStructDecl.js";
import { AttributeDecl } from "./model/decl/AttributeDecl.js";
import { ContextRuleGetterDecl } from "./model/decl/ContextRuleGetterDecl.js";
import { ContextRuleListGetterDecl } from "./model/decl/ContextRuleListGetterDecl.js";
import { ContextRuleListIndexedGetterDecl } from "./model/decl/ContextRuleListIndexedGetterDecl.js";
import { ContextTokenGetterDecl } from "./model/decl/ContextTokenGetterDecl.js";
import { ContextTokenListGetterDecl } from "./model/decl/ContextTokenListGetterDecl.js";
import { ContextTokenListIndexedGetterDecl } from "./model/decl/ContextTokenListIndexedGetterDecl.js";
import type { Decl } from "./model/decl/Decl.js";
import { RuleContextDecl } from "./model/decl/RuleContextDecl.js";
import { RuleContextListDecl } from "./model/decl/RuleContextListDecl.js";
import { StructDecl } from "./model/decl/StructDecl.js";
import { TokenDecl } from "./model/decl/TokenDecl.js";
import { TokenListDecl } from "./model/decl/TokenListDecl.js";
import { TokenTypeDecl } from "./model/decl/TokenTypeDecl.js";
import { ExceptionClause } from "./model/ExceptionClause.js";
import { InvokeRule } from "./model/InvokeRule.js";
import { LeftRecursiveRuleFunction } from "./model/LeftRecursiveRuleFunction.js";
import type { LexerFile } from "./model/LexerFile.js";
import { ListenerDispatchMethod } from "./model/ListenerDispatchMethod.js";
import type { ListenerFile } from "./model/ListenerFile.js";
import { LL1AltBlock } from "./model/LL1AltBlock.js";
import { LL1OptionalBlock } from "./model/LL1OptionalBlock.js";
import { LL1OptionalBlockSingleAlt } from "./model/LL1OptionalBlockSingleAlt.js";
import { LL1PlusBlockSingleAlt } from "./model/LL1PlusBlockSingleAlt.js";
import { LL1StarBlockSingleAlt } from "./model/LL1StarBlockSingleAlt.js";
import { MatchNotSet } from "./model/MatchNotSet.js";
import { MatchSet } from "./model/MatchSet.js";
import { MatchToken } from "./model/MatchToken.js";
import { OptionalBlock } from "./model/OptionalBlock.js";
import type { OutputFile } from "./model/OutputFile.js";
import type { OutputModelObject } from "./model/OutputModelObject.js";
import type { ParserFile } from "./model/ParserFile.js";
import { PlusBlock } from "./model/PlusBlock.js";
import type { RuleFunction } from "./model/RuleFunction.js";
import type { RuleSempredFunction } from "./model/RuleSempredFunction.js";
import { SemPred } from "./model/SemPred.js";
import type { SerializedATN } from "./model/SerializedATN.js";
import type { SrcOp } from "./model/SrcOp.js";
import { StarBlock } from "./model/StarBlock.js";
import { TestSetInline } from "./model/TestSetInline.js";
import { ThrowNoViableAlt } from "./model/ThrowNoViableAlt.js";
import { VisitorDispatchMethod } from "./model/VisitorDispatchMethod.js";
import type { VisitorFile } from "./model/VisitorFile.js";
import { Wildcard } from "./model/Wildcard.js";

import { UnicodeEscapes } from "./UnicodeEscapes.js";

export type NamedActions = Map<string, Action>;

/** The constructor type of OutputModelObject class. Used in the class-to-method maps. */
type OutputModelObjectConstructor = new (...args: unknown[]) => OutputModelObject;

/** The signature format of source op render methods. */
type SourceOpRenderFunction = (rcOp: SrcOp) => Lines;

/** The signature format of action chunk render methods. */
type ActionChunkRenderFunction = (action: ActionChunk) => Lines;

/** Flags used when rendering a collection. */
export interface IRenderCollectionOptions {
    /**
     * The maximum number of characters per line. If not given, everything is rendered in a single line.
     * Don't use this with line breaks in the separator or the result will be unpredictable.
     */
    wrap?: number;

    /** The indentation level for the output. */
    indent?: number;

    /** The string rendered between elements. If not set then ", " is used. */
    separator?: string;

    /** The string to use after the final element. If not given then no separator is rendered. */
    finalSeparator?: string;

    /** The quote character(s) to use for wrapping each element. */
    quote?: string;

    /** The string to use for the final shape of the elements. */
    template?: string;

    /** If set, the `null` value is rendered with the given value, otherwise as the literal "null". */
    null?: string;
}

/**
 * Base class for all target generators. It provides some common functionality and helper methods/fields.
 * The actual code generation is done in the subclasses.
 */
export abstract class GeneratorBase implements ITargetGenerator {
    /**
     * For pure strings of Unicode char, how can we display it in the target language as a literal. Useful for dumping
     * predicates and such that may refer to chars that need to be escaped when represented as strings.
     *
     * @returns The default map with the most common escape sequences. Subclasses can override this method to provide
     *          additional or different escape sequences.
     */
    // XXX: make private once the Java serialized ATN is converted.
    public static readonly defaultCharValueEscape = new Map<CodePoint, string>([
        ["\t".codePointAt(0)!, "\\t"],
        ["\b".codePointAt(0)!, "\\b"],
        ["\n".codePointAt(0)!, "\\n"],
        ["\r".codePointAt(0)!, "\\r"],
        ["\f".codePointAt(0)!, "\\f"],
        ["'".codePointAt(0)!, "\\'"],
        ['"'.codePointAt(0)!, '\\"'],
        ["\\".codePointAt(0)!, "\\\\"],
    ]);

    public abstract readonly id: string;

    public abstract readonly version: string;

    public abstract readonly language: string;

    public abstract readonly languageSpecifiers: string[];

    public abstract readonly codeFileExtension: string;

    public abstract renderParserFile: (file: ParserFile, declaration: boolean,
        options: IGenerationOptions) => string;

    public abstract renderLexerFile: (file: LexerFile, declaration: boolean,
        options: IGenerationOptions) => string;

    public abstract renderListenerFile: (file: ListenerFile, declaration: boolean,
        options: IGenerationOptions) => string;

    public abstract renderBaseListenerFile: (file: ListenerFile, declaration: boolean,
        options: IGenerationOptions) => string;

    public abstract renderVisitorFile: (file: VisitorFile, declaration: boolean,
        options: IGenerationOptions) => string;

    public abstract renderBaseVisitorFile: (file: VisitorFile, declaration: boolean,
        options: IGenerationOptions) => string;

    public abstract renderTestFile: (grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ) => string;

    public abstract renderRecRuleReplaceContext: (ctxName: string) => Lines;

    public abstract renderRecRuleAltPredicate: (ruleName: string, opPrec: number) => Lines;

    public abstract renderRecRuleSetReturnAction: (src: string, name: string) => Lines;

    public abstract renderRecRuleSetStopToken: () => Lines;

    public abstract renderRecRuleSetPrevCtx: () => Lines;

    public abstract renderRecRuleLabeledAltStartAction: (parserName: string, ruleName: string,
        currentAltLabel: string, label: string | undefined, isListLabel: boolean) => Lines;

    public abstract renderRecRuleAltStartAction: (parserName: string, ruleName: string, ctxName: string,
        label: string | undefined, isListLabel: boolean) => Lines;

    public readonly lexerRuleContext: string = "RuleContext";

    public readonly ruleContextNameSuffix: string = "Context";

    public readonly wantsBaseListener: boolean = false;

    public readonly wantsBaseVisitor: boolean = false;

    public readonly supportsOverloadedMethods: boolean = true;

    public readonly isATNSerializedAsInts: boolean = true;

    public readonly inlineTestSetWordSize: number = 64;

    public readonly needsDeclarationFile: boolean = false;

    public readonly declarationFileExtension?: string;

    protected abstract readonly reservedWords: Set<string>;

    /** Only casts localContext to the type when the cast isn't redundant (i.e. to a sub-context for a labeled alt) */
    protected abstract renderTypedContext: (ctx: StructDecl) => string;

    protected abstract renderCodeBlockForOuterMostAlt: (t: CodeBlockForOuterMostAlt) => Lines;

    protected abstract renderContextRuleGetterDecl: (t: ContextRuleGetterDecl) => Lines;

    protected abstract renderContextRuleListGetterDecl: (t: ContextRuleListGetterDecl) => Lines;

    protected abstract renderContextTokenGetterDecl: (t: ContextTokenGetterDecl) => Lines;

    protected abstract renderContextTokenListGetterDecl: (t: ContextTokenListGetterDecl) => Lines;

    protected abstract renderContextTokenListIndexedGetterDecl: (
        t: ContextTokenListIndexedGetterDecl) => Lines;

    protected abstract renderExceptionClause: (t: ExceptionClause) => Lines;

    protected abstract renderLL1AltBlock: (t: LL1AltBlock) => Lines;

    protected abstract renderLL1OptionalBlock: (t: LL1OptionalBlock) => Lines;

    protected abstract renderLL1OptionalBlockSingleAlt: (t: LL1OptionalBlockSingleAlt) => Lines;

    protected abstract renderLL1StarBlockSingleAlt: (t: LL1StarBlockSingleAlt) => Lines;

    protected abstract renderLL1PlusBlockSingleAlt: (t: LL1PlusBlockSingleAlt) => Lines;

    protected abstract renderMatchToken: (t: MatchToken) => Lines;

    protected abstract renderMatchSet: (t: MatchSet) => Lines;

    protected abstract renderMatchNotSet: (t: MatchNotSet) => Lines;

    protected abstract renderRuleContextDecl: (t: RuleContextDecl) => Lines;

    protected abstract renderRuleContextListDecl: (t: RuleContextListDecl) => Lines;

    protected abstract renderStructDecl: (t: StructDecl) => Lines;

    protected abstract renderTestSetInline: (t: TestSetInline) => Lines;

    protected abstract renderTokenDecl: (t: TokenDecl) => Lines;

    protected abstract renderTokenTypeDecl: (t: TokenTypeDecl) => Lines;

    protected abstract renderTokenListDecl: (t: TokenListDecl) => Lines;

    protected abstract renderThrowNoViableAlt: (t: ThrowNoViableAlt) => Lines;

    protected abstract renderWildcard: (t: Wildcard) => Lines;

    protected abstract renderContextRuleListIndexedGetterDecl: (
        t: ContextRuleListIndexedGetterDecl) => Lines;

    protected abstract renderStarBlock: (t: StarBlock) => Lines;

    protected abstract renderPlusBlock: (t: PlusBlock) => Lines;

    protected abstract renderOptionalBlock: (t: OptionalBlock) => Lines;

    protected abstract renderAltBlock: (t: AltBlock) => Lines;

    protected abstract renderInvokeRule: (t: InvokeRule) => Lines;

    protected abstract renderSemPred: (t: SemPred) => Lines;

    protected abstract renderAction: (t: Action) => Lines;

    protected abstract renderLabelRef: (t: LabelRef) => Lines;

    protected abstract renderLexerSkipCommand: () => Lines;

    protected abstract renderLexerMoreCommand: () => Lines;

    protected abstract renderLexerPopModeCommand: () => Lines;

    protected abstract renderLexerTypeCommand: (t: string) => Lines;

    protected abstract renderLexerChannelCommand: (t: string) => Lines;

    protected abstract renderLexerModeCommand: (t: string) => Lines;

    protected abstract renderLexerPushModeCommand: (t: string) => Lines;

    protected abstract renderActionText: (t: ActionText) => Lines;

    protected abstract renderArgRef: (t: ArgRef) => Lines;

    protected abstract renderListLabelRef: (t: ListLabelRef) => Lines;

    protected abstract renderLocalRef: (t: LocalRef) => Lines;

    protected abstract renderNonLocalAttrRef: (t: NonLocalAttrRef) => Lines;

    protected abstract renderQRetValueRef: (t: QRetValueRef) => Lines;

    protected abstract renderRetValueRef: (t: RetValueRef) => Lines;

    protected abstract renderRulePropertyRef: (t: RulePropertyRef) => Lines;

    protected abstract renderRulePropertyRefCtx: (t: RulePropertyRefCtx) => Lines;

    protected abstract renderRulePropertyRefParser: (t: RulePropertyRefParser) => Lines;

    protected abstract renderRulePropertyRefStart: (t: RulePropertyRefStart) => Lines;

    protected abstract renderRulePropertyRefStop: (t: RulePropertyRefStop) => Lines;

    protected abstract renderRulePropertyRefText: (t: RulePropertyRefText) => Lines;

    protected abstract renderSetAttr: (t: SetAttr) => Lines;

    protected abstract renderSetNonLocalAttr: (t: SetNonLocalAttr) => Lines;

    protected abstract renderThisRulePropertyRefCtx: (t: ThisRulePropertyRefCtx) => Lines;

    protected abstract renderThisRulePropertyRefParser: (t: ThisRulePropertyRefParser) => Lines;

    protected abstract renderThisRulePropertyRefStart: (t: ThisRulePropertyRefStart) => Lines;

    protected abstract renderThisRulePropertyRefStop: (t: ThisRulePropertyRefStop) => Lines;

    protected abstract renderThisRulePropertyRefText: (t: ThisRulePropertyRefText) => Lines;

    protected abstract renderTokenPropertyRefChannel: (t: TokenPropertyRefPos) => Lines;

    protected abstract renderTokenPropertyRefIndex: (t: TokenPropertyRefIndex) => Lines;

    protected abstract renderTokenPropertyRefInt: (t: TokenPropertyRefInt) => Lines;

    protected abstract renderTokenPropertyRefLine: (t: TokenPropertyRefLine) => Lines;

    protected abstract renderTokenPropertyRefPos: (t: TokenPropertyRefPos) => Lines;

    protected abstract renderTokenPropertyRefText: (t: TokenPropertyRefText) => Lines;

    protected abstract renderTokenPropertyRefType: (t: TokenPropertyRefType) => Lines;

    protected abstract renderTokenRef: (t: TokenRef) => Lines;

    protected abstract renderAddToLabelList: (a: AddToLabelList) => Lines;

    protected abstract renderAttributeDecl: (d: AttributeDecl) => Lines;

    protected abstract renderCaptureNextToken: (d: CaptureNextToken) => Lines;

    protected abstract renderCaptureNextTokenType: (d: CaptureNextTokenType) => Lines;

    protected abstract renderVisitorDispatchMethod: (struct: StructDecl) => Lines;

    protected abstract renderListenerDispatchMethod: (struct: StructDecl,
        method: ListenerDispatchMethod) => Lines;

    protected abstract renderAltLabelStructDecl: (currentRule: RuleFunction,
        struct: AltLabelStructDecl) => Lines;

    protected abstract renderRuleFunction: (namedActions: NamedActions,
        currentRule: RuleFunction) => Lines;

    protected abstract renderLeftRecursiveRuleFunction: (namedActions: NamedActions,
        currentRule: LeftRecursiveRuleFunction) => Lines;

    protected abstract renderSerializedATN: (model: SerializedATN) => Lines;

    protected abstract renderRuleSempredFunction: (r: RuleSempredFunction) => Lines;

    /**
     * Values that don't change during generation. That usually includes values for frequently used names
     * (recognizer, context, etc.) and other constants (e.g. render for declaration file or not).
     *
     * Instead of passing them around, we keep them here.
     */
    protected readonly invariants: ISharedInvariants = {
        recognizerName: "",
        grammarName: "",
        grammarFileName: "",
        tokenLabelType: "Token",
        declaration: false,
        packageName: "",
    };

    /** Maps lexer call commands (those with parameters) to methods which render that command. */
    private lexerCallCommandMap: Map<string, (arg: string) => Lines>;

    /**
     * Maps lexer commands (those without parameters) to methods which render that command.
     * Separating both maps allows for quick tests of missing or invalid parameters.
     */
    private lexerCommandMap: Map<string, (arg: string) => Lines>;

    private actionMap: Map<OutputModelObjectConstructor, ActionChunkRenderFunction>;

    /**
     * Code blocks are at the heart of code generation. This map allows easy lookup of the correct render method for a
     * specific output model code object, named a `SrcOp`. Source ops are code snippets that are put together
     * to form the final code.
     */
    private srcOpMap: Map<OutputModelObjectConstructor, SourceOpRenderFunction>;

    /**
     * Constructs a new renderer instance.
     *
     * @param logRendering For debugging: when set to true includes start and end markers for many parts.
     */
    public constructor(protected logRendering = false) { }

    public setUp(): void {
        this.actionMap = this.fillActionMap();
        this.srcOpMap = this.fillSrcOpMap();
        this.lexerCommandMap = this.fillLexerCommandMap();
        this.lexerCallCommandMap = this.fillLexerCallCommandMap();
    };

    /**
     * @returns the escape map for the target language. This is used to escape characters in strings.
     * Subclasses can override this method to provide additional or different escape sequences.
     */
    public get charValueEscapeMap(): Map<CodePoint, string> {
        return GeneratorBase.defaultCharValueEscape;
    };

    /**
     * Given a random string of unicode chars, return a new string with optionally appropriate quote characters for
     * target language and possibly with some escaped characters. For example, if the incoming string has actual
     * newline characters, the output of this method would convert them to the two char sequence \n for Java, C,
     * C++, ... The new string has double-quotes around it as well. Example string in memory:
     *
     * ```
     * a"[newlineChar]b'c[carriageReturnChar]d[tab]e\f
     * ```
     * would be converted to the valid string:
     * ```
     * "a\"\nb'c\rd\te\\f"
     * ```
     * or
     * ```
     * a\"\nb'c\rd\te\\f
     * ```
     * depending on the quoted arg.
     *
     * @param s The string to convert.
     * @param quoted If true, the string is quoted. If false, it is not.
     *
     * @returns The converted string.
     */
    public getTargetStringLiteralFromString(s: string, quoted?: boolean): string {
        quoted ??= true;

        let result = "";
        if (quoted) {
            result += '"';
        }

        for (let i = 0; i < s.length;) {
            const c = s.codePointAt(i)!;
            const escaped = (c <= Character.MAX_VALUE) ? this.charValueEscapeMap.get(Number(c)) : undefined;
            if (c !== 0x27 && escaped) { // Don't escape single quotes in strings for Java.
                // XXX: remove any special handling for a particular language here.
                result += escaped;
            } else if (this.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(c)) {
                result += this.createUnicodeEscapedCodePoint(i);
            } else {
                result += String.fromCodePoint(c);
            }

            i += Character.charCount(c);
        }

        if (quoted) {
            result += '"';
        }

        return result;
    }

    public escapeIfNeeded(identifier: string): string {
        return this.reservedWords.has(identifier) ? this.escapeWord(identifier) : identifier;
    }

    public getTokenTypeAsTargetLabel(g: Grammar, ttype: number): string {
        const name = this.escapeIfNeeded(g.getTokenName(ttype) ?? "");

        // If name is not valid, return the token type instead.
        if (Grammar.INVALID_TOKEN_NAME === name) {
            return String(ttype);
        }

        return name;
    }

    public getTokenTypesAsTargetLabels(g: Grammar, tokenTypes: number[]): string[] {
        const labels = new Array<string>(tokenTypes.length);
        for (let i = 0; i < tokenTypes.length; i++) {
            labels[i] = this.getTokenTypeAsTargetLabel(g, tokenTypes[i]);
        }

        return labels;
    }

    public getTargetStringLiteralFromANTLRStringLiteral(literal: string, addQuotes: boolean,
        escapeSpecial?: boolean): string {
        escapeSpecial ??= false;

        let result = "";
        if (addQuotes) {
            result += '"';
        }

        for (let i = 1; i < literal.length - 1;) {
            const codePoint = literal.codePointAt(i)!;
            let toAdvance = Character.charCount(codePoint);
            if (codePoint === 0x5C) { // backslash
                // Anything escaped is what it is! We assume that people know how to escape characters correctly.
                // However we catch anything that does not need an escape in Java (which is what the default
                // implementation is dealing with and remove the escape. The C target does this for instance.
                const escapedChar = literal.charAt(i + toAdvance);
                toAdvance++;
                switch (escapedChar) {
                    // Pass through any escapes that Java also needs
                    case "n":
                    case "r":
                    case "t":
                    case "b":
                    case "f":
                    case "\\": {
                        // Pass the escape through.
                        if (escapeSpecial && escapedChar !== "\\") {
                            result += "\\";
                        }
                        result += "\\" + escapedChar;
                        break;
                    }

                    case "u": { // Either `unnnn` or `u{nnnnnn}`.
                        if (literal.charAt(i + toAdvance) === "{") {
                            while (literal.charAt(i + toAdvance) !== "}") {
                                ++toAdvance;
                            }
                            ++toAdvance;
                        } else {
                            toAdvance += 4;
                        }

                        if (i + toAdvance <= literal.length) { // We might have an invalid \\uAB or something.
                            const fullEscape = literal.substring(i, i + toAdvance);
                            result += this.createUnicodeEscapedCodePoint(
                                CharSupport.getCharValueFromCharInGrammarLiteral(fullEscape), escapeSpecial);
                        }

                        break;
                    }

                    default: {
                        const codePoint = literal.codePointAt(i + toAdvance)!;
                        if (this.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint)) {
                            result += this.createUnicodeEscapedCodePoint(codePoint, escapeSpecial);
                        } else {
                            result += escapedChar;
                        }

                        break;
                    }
                }
            } else {
                if (codePoint === 0x22) {
                    // antlr-ng doesn't escape " in literal strings, but every other language needs to do so.
                    result += "\\\"";
                } else if (this.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint)) {
                    result += this.createUnicodeEscapedCodePoint(codePoint, escapeSpecial);
                } else {
                    result += String.fromCodePoint(codePoint);
                }
            }

            i += toAdvance;
        }

        if (addQuotes) {
            result += '"';
        }

        return result;
    }

    /**
     * Generates a comma separated list of the elements in the given list. The elements are converted to strings
     * using the `String` constructor. The list is formatted with a maximum of `wrap` elements per line.
     * The list is split into multiple lines if it exceeds the specified wrap length.
     *
     * @param list The list of entries to be formatted. We are using string coercion here, so make sure any
     *             non-primitive type is rendered to a string, before calling this method.
     * @param options The options for formatting the list.
     *
     * @returns A list of strings, each representing a line of the formatted list.
     */
    public renderList(list: Iterable<string | number | null>, options: IRenderCollectionOptions): Lines {
        const result = [];
        const quote = options.quote ?? "";
        const separator = options.separator ?? ", ";

        let line = "";
        for (let item of list) {
            item ??= options.null ?? "null";

            let value;

            if (options.template) {
                value = this.renderTemplate(options.template, `${quote}${item}${quote}`);
            } else {
                value = `${quote}${item}${quote}`;
            }

            line += value + separator;

            // Do we exceed the line length?
            if (options.wrap && line.length > options.wrap) {
                result.push(line);
                line = "";
            }
        }

        if (line.length > 0) {
            // Remove the last separator if no final separator is given. Otherwise replace it.
            if (options.finalSeparator) {
                line = line.slice(0, -separator.length) + options.finalSeparator;
            } else {
                line = line.slice(0, -separator.length);
            }

            result.push(line);
        } else {
            // The last line was just pushed. Add or replace the final separator if needed.
            if (options.finalSeparator) {
                const lastIndex = result.length - 1;
                result[lastIndex] = result[lastIndex].slice(0, -separator.length) + options.finalSeparator;
            } else {
                const lastIndex = result.length - 1;
                result[lastIndex] = result[lastIndex].slice(0, -separator.length);
            }
        }

        return this.formatLines(result, options.indent);
    }

    /**
     * Takes a list of lines and formats them with the specified indentation. It filters out undefined
     * lines, and adds the specified indentation to each line.
     *
     * @param lines The lines to format.
     * @param indentation The number of spaces to use for indentation.
     *
     * @returns The formatted lines.
     */
    public formatLines(lines: Array<string | undefined>, indentation?: number): Lines {
        // First filter all undefined lines.
        const filteredLines = lines.filter(line => {
            return line !== undefined;
        });

        // Then format the lines with the specified indentation.
        const indentationStr = " ".repeat(indentation ?? 0);
        const formattedLines = filteredLines.map(line => {
            if (line.length === 0) {
                return line;
            }

            return `${indentationStr}${line}`;
        });

        return formattedLines;
    }

    /**
     * Converts the first character of the given string to uppercase.
     *
     * @param str The string to convert.
     *
     * @returns The converted string with the first character in uppercase.
     */
    public toTitleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Converts the first character of the given string to lowercase.
     *
     * @param str The string to convert.
     *
     * @returns The converted string with the first character in lowercase.
     */
    public toLowerCase(str: string): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    /**
     * Renders a template string with the provided parameters. The template can contain placeholders in the
     * format `${0}`, `${1}`, etc., which will be replaced with the corresponding values from the `params` array.
     *
     * @param template The template string to render.
     * @param params The parameters to use for rendering the template.
     *
     * @returns The rendered string.
     */
    public renderTemplate(template: string, ...params: unknown[]): string {
        return template.replace(/\${(\d+)}/g, (match, ...args): string => {
            const paramIndex = parseInt(args[0] as string, 10);

            return params[paramIndex] !== undefined ? params[paramIndex] as string : match;
        });
    }

    /**
     * Renders key/value pairs from a map into a string array using the provided template.
     *
     * @param map The map containing key/value pairs to render.
     * @param indent The number of spaces to use for indentation.
     * @param template The template string to use for rendering each key/value pair.
     *                 The template should contain two placeholders: `${0}` for the key and `${1}` for the value.
     *
     * @returns An array of strings, each representing a rendered key/value pair.
     */
    public renderMap(map: Map<string, unknown>, indent: number, template: string): string[] {
        if (map.size === 0) {
            return [];
        }

        const result = [];
        const indentStr = " ".repeat(indent);

        for (const [key, value] of map) {
            result.push(this.renderTemplate(`${indentStr}${template}`, key, value));
        }

        return result;
    }

    /**
     * Renders a list of objects into a string array using the provided template.
     *
     * @param list The list of objects to render.
     * @param indent The number of spaces to use for indentation.
     * @param template The template string to use for rendering each object.
     *                 The template should contain as many placeholders as there are key..
     * @param keys The names of properties of each object to be used in the template.
     *             The indexed values are coerced to strings.
     *
     * @returns An array of strings, each representing a rendered object.
     */
    public renderTemplatedObjectList(list: Iterable<object>, indent: number, template: string,
        ...keys: string[]): Lines {
        const result: Lines = [];
        const indentStr = " ".repeat(indent);

        for (const obj of list) {
            const printArgs: unknown[] = [];
            for (const key of keys) {
                if (key in obj) {
                    const value = (obj as Record<string, unknown>)[key];
                    printArgs.push(value);
                }
            }

            result.push(this.renderTemplate(`${indentStr}${template}`, ...printArgs));
        }

        return result;
    }

    public getLoopLabel(ast: GrammarAST): string {
        return "loop" + ast.token!.tokenIndex;
    }

    public getLoopCounter(ast: GrammarAST): string {
        return "cnt" + ast.token!.tokenIndex;
    }

    public getRecognizerFileName(forDeclarationFile: boolean, recognizerName: string): string {
        const extension = (forDeclarationFile && this.declarationFileExtension)
            ? this.declarationFileExtension
            : this.codeFileExtension;

        return recognizerName + extension;
    }

    public getListenerFileName(forDeclarationFile: boolean, grammarName: string): string {
        return this.filenameForType(forDeclarationFile, "Listener", grammarName);
    }

    public getVisitorFileName(forDeclarationFile: boolean, grammarName: string): string {
        return this.filenameForType(forDeclarationFile, "Visitor", grammarName);
    }

    public getBaseListenerFileName(forDeclarationFile: boolean, grammarName: string): string {
        return this.filenameForType(forDeclarationFile, "BaseListener", grammarName);
    }

    public getBaseVisitorFileName(forDeclarationFile: boolean, grammarName: string): string {
        return this.filenameForType(forDeclarationFile, "BaseVisitor", grammarName);
    }

    public getSerializedATNSegmentLimit(): number {
        return Number.MAX_VALUE;
    }

    public grammarSymbolCausesIssueInGeneratedCode(idNode: GrammarAST): boolean {
        switch (idNode.parent?.getType()) {
            case ANTLRv4Parser.ASSIGN: {
                switch (idNode.parent.parent?.getType()) {
                    case ANTLRv4Parser.ELEMENT_OPTIONS:
                    case ANTLRv4Parser.OPTIONS: {
                        return false;
                    }

                    default: {
                        break;
                    }
                }

                break;
            }

            case ANTLRv4Parser.AT:
            case ANTLRv4Parser.ELEMENT_OPTIONS: {
                return false;
            }

            case ANTLRv4Parser.LEXER_ACTION_CALL: {
                if (idNode.childIndex === 0) {
                    // First child is the command name which is part of the ANTLR language.
                    return false;
                }

                // Arguments to the command should be checked.
                break;
            }

            default: {
                break;
            }

        }

        return this.reservedWords.has(idNode.getText());
    }

    public renderImplicitTokenLabel(tokenName: string): string {
        return tokenName;
    }

    public renderImplicitRuleLabel(ruleName: string): string {
        return ruleName;
    };

    public renderImplicitSetLabel(id: string): string {
        return `_tset${id}`;
    };

    public renderListLabelName(label: string): string {
        return label;
    }

    public getLexerCommandRenderer(commandName: string,
        arg?: string): ((arg: string) => Lines) | (() => Lines) | undefined {
        if (arg !== undefined) {
            return this.lexerCallCommandMap.get(commandName);
        }

        return this.lexerCommandMap.get(commandName);
    }

    public getRuleFunctionContextStructName(r: Rule): string {
        if (r.g.isLexer()) {
            return this.lexerRuleContext;
        }

        return this.toTitleCase(r.name) + this.ruleContextNameSuffix;
    }

    protected static addEscapedChar(map: Map<Character, string>, key: number, representation?: number): void {
        representation = representation ?? key;
        map.set(key, "\\" + representation);
    };

    /**
     * Escape the Unicode code point appropriately for this language and append the escaped value to `sb`.
     * It exists for flexibility and backward compatibility with external targets, The static method
     * {@link UnicodeEscapes.appendEscapedCodePoint(StringBuilder, int, String)} can be used as well
     * if default escaping method (Java) is used or language is officially supported
     *
     * @param codePoint The Unicode code point to escape.
     * @param escape If true, the code point is escaped with a leading backslash.
     *
     * @returns The escaped code point as a string.
     */
    protected createUnicodeEscapedCodePoint(codePoint: number, escape?: boolean): string {
        let result = UnicodeEscapes.escapeCodePoint(codePoint, this.language);

        if (escape) {
            result = "\\" + result;
        }

        return result;
    }

    protected shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint: number): boolean {
        return codePoint < 0x20   // Control characters up to but not including space.
            || codePoint === 0x5C // backslash
            || codePoint >= 0x7F; // DEL and beyond (keeps source code 7-bit US-ASCII).
    }

    protected escapeChar(v: number): string {
        return `\\u${v.toString(16).padStart(4, "0")}`;
    }

    protected renderActionChunks(chunks?: ActionChunk[]): Lines {
        const result: Lines = [];

        if (chunks) {
            for (const chunk of chunks) {
                const method = this.actionMap.get(chunk.constructor as OutputModelObjectConstructor);
                if (method) {
                    result.push(...method(chunk));
                } else {
                    throw new Error(`Unhandled action type: ${chunk.constructor.name}`);
                }
            }
        }

        return result;
    }

    /**
     * For any action chunk, what is correctly-typed context struct ptr?
     *
     * @param actionChunk The action chunk to render the context for.
     *
     * @returns The rendered context as a string. If the action chunk does not have a context, an empty string
     *          is returned.
     */
    protected renderContext(actionChunk: ActionChunk): string {
        if (!actionChunk.ctx) {
            return "";
        }

        return this.renderTypedContext(actionChunk.ctx);
    }

    protected renderFileHeader(file: OutputFile): Lines {
        return [`// Generated from ${file.grammarFileName} by antlr-ng ${this.version}. Do not edit!`];
    }

    protected escapeWord(word: string): string {
        return word + "_";
    }

    protected escapeCodePoint(codePoint: number): string {
        if (Character.isSupplementaryCodePoint(codePoint)) {
            return "\\u" + Number(Character.highSurrogate(codePoint)).toString(16).toUpperCase().padStart(4, "0") +
                "\\u" + Number(Character.lowSurrogate(codePoint)).toString(16).toUpperCase().padStart(4, "0");
        } else {
            return "\\u" + codePoint.toString(16).padStart(4, "0");
        }
    }

    protected startRendering(section: string): Lines {
        if (this.logRendering) {
            return [`/* Start rendering ${section} */`];
        }

        return [];
    }

    protected endRendering(section: string, lines: Lines): Lines {
        if (this.logRendering) {
            if (lines.length === 1) {
                // Don't render log lines if the section is empty.
                return [];
            }

            lines.push(`/* End rendering ${section} */`);
        }

        return lines;
    }

    protected renderSourceOps(srcOps: Array<SrcOp | null> | undefined): Lines {
        const result: Lines = this.startRendering("SourceOps");

        srcOps?.forEach((srcOp) => {
            if (srcOp) {
                const method = this.srcOpMap.get(srcOp.constructor as OutputModelObjectConstructor);
                if (method) {
                    result.push(...method(srcOp));
                } else {
                    throw new Error(`Unhandled source op type: ${srcOp.constructor.name}`);
                }
            }
        });

        return this.endRendering("SourceOps", result);
    }

    protected renderCodeBlockForAlt = (currentAltCodeBlock: CodeBlockForAlt): Lines => {
        const result: Lines = this.startRendering("CodeBlockForAlt");

        result.push(...this.renderDecls(currentAltCodeBlock.locals));
        result.push(...this.renderSourceOps(currentAltCodeBlock.preamble));
        result.push(...this.renderSourceOps(currentAltCodeBlock.ops));

        return this.endRendering("CodeBlockForAlt", result);
    };

    protected renderDecls(decls: Iterable<Decl>): Lines {
        const result: Lines = this.startRendering("Decls");

        for (const decl of decls) {
            const method = this.srcOpMap.get(decl.constructor as OutputModelObjectConstructor);
            if (method) {
                result.push(...method(decl));
            } else {
                throw new Error(`Unhandled source op type: ${decl.constructor.name}`);
            }
        }

        return this.endRendering("Decls", result);
    }

    protected renderDispatchMethods(struct: StructDecl): Lines {
        const result: Lines = [];

        for (const method of struct.dispatchMethods) {
            if (method instanceof VisitorDispatchMethod) {
                result.push(...this.renderVisitorDispatchMethod(struct));
            } else if (method instanceof ListenerDispatchMethod) {
                result.push(...this.renderListenerDispatchMethod(struct, method));
            }
        }

        return result;

    }

    protected renderRuleFunctions(namedActions: NamedActions, funcs: RuleFunction[]): Lines {
        const result: Lines = [];

        if (funcs.length > 0) {
            funcs.forEach((f) => {
                if (f instanceof LeftRecursiveRuleFunction) {
                    result.push(...this.renderLeftRecursiveRuleFunction(namedActions, f));
                } else {
                    result.push(...this.renderRuleFunction(namedActions, f));
                }
            });
            result.push("");
        }

        return result;
    }
    private filenameForType(forDeclarationFile: boolean, type: string, grammarName: string): string {
        const extension = (forDeclarationFile && this.declarationFileExtension)
            ? this.declarationFileExtension
            : this.codeFileExtension;

        return grammarName + type + extension;
    }

    private fillActionMap(): Map<OutputModelObjectConstructor, ActionChunkRenderFunction> {
        const actionMap = new Map<OutputModelObjectConstructor, ActionChunkRenderFunction>([
            [ActionText, this.renderActionText],
            [ArgRef, this.renderArgRef],
            [ListLabelRef, this.renderListLabelRef],
            [LocalRef, this.renderLocalRef],
            [NonLocalAttrRef, this.renderNonLocalAttrRef],
            [QRetValueRef, this.renderQRetValueRef],
            [RetValueRef, this.renderRetValueRef],
            [RulePropertyRef, this.renderRulePropertyRef],
            [RulePropertyRefCtx, this.renderRulePropertyRefCtx],
            [RulePropertyRefParser, this.renderRulePropertyRefParser],
            [RulePropertyRefStart, this.renderRulePropertyRefStart],
            [RulePropertyRefStop, this.renderRulePropertyRefStop],
            [RulePropertyRefText, this.renderRulePropertyRefText],
            [SetAttr, this.renderSetAttr],
            [SetNonLocalAttr, this.renderSetNonLocalAttr],
            [ThisRulePropertyRefCtx, this.renderThisRulePropertyRefCtx],
            [ThisRulePropertyRefParser, this.renderThisRulePropertyRefParser],
            [ThisRulePropertyRefStart, this.renderThisRulePropertyRefStart],
            [ThisRulePropertyRefStop, this.renderThisRulePropertyRefStop],
            [ThisRulePropertyRefText, this.renderThisRulePropertyRefText],
            [TokenPropertyRefPos, this.renderTokenPropertyRefChannel],
            [TokenPropertyRefIndex, this.renderTokenPropertyRefIndex],
            [TokenPropertyRefInt, this.renderTokenPropertyRefInt],
            [TokenPropertyRefLine, this.renderTokenPropertyRefLine],
            [TokenPropertyRefPos, this.renderTokenPropertyRefPos],
            [TokenPropertyRefText, this.renderTokenPropertyRefText],
            [TokenPropertyRefType, this.renderTokenPropertyRefType],
            [TokenRef, this.renderTokenRef],
        ]);

        return actionMap;
    }

    private fillSrcOpMap(): Map<OutputModelObjectConstructor, SourceOpRenderFunction> {
        const srcOpMap = new Map<OutputModelObjectConstructor, SourceOpRenderFunction>([
            [AddToLabelList, this.renderAddToLabelList],
            [AttributeDecl, this.renderAttributeDecl],
            [CaptureNextToken, this.renderCaptureNextToken],
            [CaptureNextTokenType, this.renderCaptureNextTokenType],
            [CodeBlockForAlt, this.renderCodeBlockForAlt],
            [CodeBlockForOuterMostAlt, this.renderCodeBlockForOuterMostAlt],
            [ContextRuleGetterDecl, this.renderContextRuleGetterDecl],
            [ContextRuleListGetterDecl, this.renderContextRuleListGetterDecl],
            [ContextTokenGetterDecl, this.renderContextTokenGetterDecl],
            [ContextTokenListGetterDecl, this.renderContextTokenListGetterDecl],
            [ContextTokenListIndexedGetterDecl, this.renderContextTokenListIndexedGetterDecl],
            [ExceptionClause, this.renderExceptionClause],
            [LL1AltBlock, this.renderLL1AltBlock],
            [LL1OptionalBlock, this.renderLL1OptionalBlock],
            [LL1OptionalBlockSingleAlt, this.renderLL1OptionalBlockSingleAlt],
            [LL1StarBlockSingleAlt, this.renderLL1StarBlockSingleAlt],
            [LL1PlusBlockSingleAlt, this.renderLL1PlusBlockSingleAlt],
            [MatchToken, this.renderMatchToken],
            [MatchSet, this.renderMatchSet],
            [MatchNotSet, this.renderMatchNotSet],
            [RuleContextDecl, this.renderRuleContextDecl],
            [RuleContextListDecl, this.renderRuleContextListDecl],
            [StructDecl, this.renderStructDecl],
            [TestSetInline, this.renderTestSetInline],
            [TokenDecl, this.renderTokenDecl],
            [TokenTypeDecl, this.renderTokenTypeDecl],
            [TokenListDecl, this.renderTokenListDecl],
            [ThrowNoViableAlt, this.renderThrowNoViableAlt],
            [Wildcard, this.renderWildcard],
            [ContextRuleListIndexedGetterDecl, this.renderContextRuleListIndexedGetterDecl],
            [StarBlock, this.renderStarBlock],
            [PlusBlock, this.renderPlusBlock],
            [OptionalBlock, this.renderOptionalBlock],
            [AltBlock, this.renderAltBlock],
            [InvokeRule, this.renderInvokeRule],
            [SemPred, this.renderSemPred],
            [Action, this.renderAction],
        ]);

        return srcOpMap;
    }

    private fillLexerCommandMap(): Map<string, () => Lines> {
        const map = new Map<string, () => Lines>([
            ["skip", this.renderLexerSkipCommand],
            ["more", this.renderLexerMoreCommand],
            ["popMode", this.renderLexerPopModeCommand],
        ]);

        return map;
    }

    private fillLexerCallCommandMap(): Map<string, (arg: string) => Lines> {
        const map = new Map<string, (arg: string) => Lines>([
            ["type", this.renderLexerTypeCommand],
            ["channel", this.renderLexerChannelCommand],
            ["mode", this.renderLexerModeCommand],
            ["pushMode", this.renderLexerPushModeCommand],
        ]);

        return map;
    }
}
