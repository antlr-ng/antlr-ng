/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { Grammar } from "../tool/Grammar.js";
import type { Rule } from "../tool/Rule.js";
import type { IGrammar } from "../types.js";
import type { LexerFile } from "./model/LexerFile.js";
import type { ListenerFile } from "./model/ListenerFile.js";
import type { ParserFile } from "./model/ParserFile.js";
import type { VisitorFile } from "./model/VisitorFile.js";

/** Represets a single code point in Unicode. */
export type CodePoint = number;

export type Lines = Array<string | undefined>;

/**
 * This interface contains all callable members of the target generator, which generate code.
 * They all take an output model object (aka OMO) as first argument. The generator will use the information in
 * the model object to generate the target code.
 */
export interface ITargetGeneratorCallables {
    /**
     * Renders a `ParserFile` output model.
     *
     * @param file The model object for details.
     * @param declaration If true, render the declaration file for the parser file.
     *
     * @returns The generated code as a string.
     */
    renderParserFile(file: ParserFile, declaration: boolean): string;

    /**
     * Renders a `LexerFile` output model.
     *
     * @param file The model object for details.
     * @param declaration If true, render the declaration file for the lexer file.
     *
     * @returns The generated code as a string.
     */
    renderLexerFile(file: LexerFile, declaration: boolean): string;

    /**
     * Renders a `ListenerFile` output model.
     *
     * @param file The model object for details.
     * @param declaration If true, render the declaration file for the listener file.
     *
     * @returns The generated code as a string.
     */
    renderListenerFile(file: ListenerFile, declaration: boolean): string;

    /**
     * Renders a base version of a `ListenerFile` output model. This base class implements all methods of the listener
     * interface as empty methods. This is useful for the user to create a custom listener class by extending
     * this base class and overriding only the methods of interest.
     *
     * Languages that support optional methods (e.g. TypeSricpt) don't need such a base class. Custom listeners can
     * simply implement the interface and override only the methods of interest. The code generator has to insert
     * code to test if the method is implemented or not.
     *
     * @param file The model object for details.
     * @param declaration If true, render the declaration file for the base listener file.
     *
     * @returns The generated code as a string.
     */
    renderBaseListenerFile(file: ListenerFile, declaration: boolean): string;

    /**
     * Renders a `VistiorFile` output model.
     *
     * @param file The model object for details.
     * @param declaration If true, render the declaration file for the visitor file.
     *
     * @returns The generated code as a string.
     */
    renderVisitorFile(file: VisitorFile, declaration: boolean): string;

    /**
     * Renders a base version of a `VisitorFile` output model. This base class implements all methods of the visitor
     * interface as empty methods. This is useful for the user to create a custom vistitors class by extending
     * this base class and overriding only the methods of interest.
     *
     * Languages that support optional methods (e.g. TypeSricpt) don't need such a base class. Custom listeners can
     * simply implement the interface and override only the methods of interest. The code generator has to insert
     * code to test if the method is implemented or not.
     *
     * @param file The model object for details.
     * @param declaration If true, render the declaration file for the base visitor file.
     *
     * @returns The generated code as a string.
     */
    renderBaseVisitorFile(file: VisitorFile, declaration: boolean): string;

    /**
     * Should be same for all refs to same token like ctx.ID within single rule function for literals like 'while',
     * we gen _s<ttype>
     */
    renderImplicitTokenLabel(tokenName: string): string;
    renderImplicitRuleLabel(ruleName: string): string;
    renderImplicitSetLabel(id: string): string;
    renderListLabelName(label: string): string;

    escapeIfNeeded(identifier: string): string;

    /**
     * Renders the content of the unit test file with the given parameters. The test file is used to execute a single
     * unit test for a grammar. It contains the necessary imports, the test function and the code to parse
     * a given input string with the specified parser and lexer.
     *
     * @param grammarName The name of the grammar to be tested.
     * @param lexerName The name of the lexer to be used in the test.
     * @param parserName The name of the parser to be used in the test.
     * @param parserStartRuleName The start rule of the parser to be used in the test.
     * @param showDiagnosticErrors If true, the test will show diagnostic errors in the output.
     * @param traceATN If true, the test will print ATN tracing information.
     * @param profile If true, the test will profile the parsing process.
     * @param showDFA If true, the test will show the DFA state information from the lexer.
     * @param useListener If true, the test will use a listener to print processing information.
     * @param useVisitor If true, the test will use a visitor. This is used mostly to test importing the generated
     *                   visitor class.
     * @param predictionMode The prediction mode to be used in the test. This can be one of the
     *                       following: "LL", "SLL", "LL_EXACT_AMBIG_DETECTION".
     *                       If undefined, the default prediction mode of the parser will be used.
     * @param buildParseTree If true, the test will build a parse tree from the input string and print it.
     */
    renderTestFile(grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string;
}

/** Defines the structure for a target generator. */
export interface ITargetGenerator extends ITargetGeneratorCallables {
    /** A unique identifier for the generator. */
    readonly id: string;

    /** The version of the generator. */
    readonly version: string;

    /** The human readably language name for the generator. */
    readonly language: string;

    /** A list of specifiers that can be used to identify this language (not case sensitive). */
    readonly languageSpecifiers: string[];

    /** Does this target need a declaration file (e.g. a C/C++ header file or type definitions for JavaScript)? */
    readonly needsDeclarationFile?: boolean;

    /** The extension to be used for generated files which contain code (including the dot). */
    readonly codeFileExtension: string;

    /** The extension to be used for generated files which contain type definitions (including the dot). */
    readonly declarationFileExtension?: string;

    /** Reserved words of this language. */
    readonly reservedWords: Set<string>;

    /** The rule context name is the rule followed by a suffix; e.g., r becomes rContext. */
    readonly contextNameSuffix: string;

    readonly lexerRuleContext: string;

    readonly ruleContextNameSuffix: string;

    readonly wantsBaseListener: boolean;

    readonly wantsBaseVisitor: boolean;

    readonly supportsOverloadedMethods: boolean;

    readonly isATNSerializedAsInts: boolean;

    /**
     * How many bits should be used to do inline token type tests? Java assumes a 64-bit word for bitsets. Must be a
     * valid word size for your target like 8, 16, 32, 64, etc...
     */
    readonly inlineTestSetWordSize: number;

    /** Maps lexer commands to methods which render that command. */
    readonly lexerCommandMap: Map<string, () => Lines>;

    /**
     * Maps lexer call commands to methods which render that command. The first argument is the command argument, the
     * second is the grammar object.
     */
    readonly lexerCallCommandMap: Map<string, (arg: string, grammar: IGrammar) => Lines>;

    /** Part of the left-recursive-rule pre-rendering. */
    renderRecRuleReplaceContext(ctxName: string): Lines;

    renderRecRuleAltPredicate(ruleName: string, opPrec: number): Lines;
    renderRecRuleSetReturnAction(src: string, name: string): Lines;
    renderRecRuleSetStopToken(): Lines;

    renderRecRuleSetPrevCtx(): Lines;

    renderRecRuleLabeledAltStartAction(parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines;

    renderRecRuleAltStartAction(parserName: string, ruleName: string, ctxName: string, label: string | undefined,
        isListLabel: boolean): Lines;

    /** @returns the full name for a rule function. */
    getRuleFunctionContextStructName(r: Rule): string;

    /**
     * Given a random string of unicode chars, return a new string with optionally appropriate quote characters for
     * target language and possibly with some escaped characters.
     *
     * @param s The string to be converted.
     * @param quoted If true, the string will be quoted.
     *
     * @returns The converted string.
     */
    getTargetStringLiteralFromString(s: string, quoted?: boolean): string;

    getLoopLabel(ast: GrammarAST): string;

    /**
     * Generate TParser.java and TLexer.java from T.g4 if combined, else just use T.java as output regardless of type.
     *
     * @param forDeclarationFile If true, the file name will be for a declaration file (e.g. TParser.h), otherwise
     *        it will be for a code file (e.g. TParser.java).
     * @param recognizerName The name of the recognizer, such as TParser or TLexer.
     *
     * @returns The file name for the recognizer, such as TParser.java or TLexer.cpp.
     */
    getRecognizerFileName(forDeclarationFile: boolean, recognizerName: string): string;

    /**
     * A given grammar T, return the listener name such as TListener.java, if we're using the Java target.
     *
     * @param forDeclarationFile If true, the file name will be for a declaration file (e.g. TParser.h), otherwise
     *        it will be for a code file (e.g. TParser.java).
     * @param grammarName The name of the grammar, which determinse the base name of the listener.
     *
     * @returns The file name for the listener, such as TListener.java or TListener.ts.
     */
    getListenerFileName(forDeclarationFile: boolean, grammarName: string): string;

    /**
     * A given grammar T, return the visitor name such as TVisitor.java, if we're using the Java target.
     *
     * @param forDeclarationFile If true, the file name will be for a declaration file (e.g. TParser.h), otherwise
     *        it will be for a code file (e.g. TParser.java).
     * @param grammarName The name of the grammar, which determinse the base name of the listener.
     *
     * @returns The file name for the visitor, such as TVisitor.java or TVisitor.ts.
     */
    getVisitorFileName(forDeclarationFile: boolean, grammarName: string): string;

    /**
     * A given grammar T, return a blank listener implementation such as TBaseListener.java, if we're using the
     * Java target.
     *
     * @param forDeclarationFile If true, the file name will be for a declaration file (e.g. TParser.h), otherwise
     *        it will be for a code file (e.g. TParser.java).
     * @param grammarName The name of the grammar, which determinse the base name of the listener.
     *
     * @returns The file name for the base listener, such as TBaseListener.java or TBaseListener.ts.
     */
    getBaseListenerFileName(forDeclarationFile: boolean, grammarName: string): string;

    /**
     * A given grammar T, return a blank vistor implementation such as TBaseListener.java, if we're using the
     * Java target.
     *
     * @param forDeclarationFile If true, the file name will be for a declaration file (e.g. TParser.h), otherwise
     *        it will be for a code file (e.g. TParser.java).
     * @param grammarName The name of the grammar, which determinse the base name of the listener.
     *
     * @returns The file name for the base visitor, such as TBaseVisitor.java or TBaseVisitor.ts.
     */
    getBaseVisitorFileName(forDeclarationFile: boolean, grammarName: string): string;

    /**
     * Gets the maximum number of 16-bit unsigned integers that can be encoded in a single segment (a declaration in
     * target language) of the serialized ATN. E.g., in C++, a small segment length results in multiple decls like:
     *
     *   static const int32_t serializedATNSegment1[] = {
     *     0x7, 0x12, 0x2, 0x13, 0x7, 0x13, 0x2, 0x14, 0x7, 0x14, 0x2, 0x15, 0x7,
     *        0x15, 0x2, 0x16, 0x7, 0x16, 0x2, 0x17, 0x7, 0x17, 0x2, 0x18, 0x7,
     *        0x18, 0x2, 0x19, 0x7, 0x19, 0x2, 0x1a, 0x7, 0x1a, 0x2, 0x1b, 0x7,
     *        0x1b, 0x2, 0x1c, 0x7, 0x1c, 0x2, 0x1d, 0x7, 0x1d, 0x2, 0x1e, 0x7,
     *        0x1e, 0x2, 0x1f, 0x7, 0x1f, 0x2, 0x20, 0x7, 0x20, 0x2, 0x21, 0x7,
     *        0x21, 0x2, 0x22, 0x7, 0x22, 0x2, 0x23, 0x7, 0x23, 0x2, 0x24, 0x7,
     *        0x24, 0x2, 0x25, 0x7, 0x25, 0x2, 0x26,
     *   };
     *
     * instead of one big one. Targets are free to ignore this like JavaScript does.
     *
     * This is primarily needed by Java target to limit size of any single ATN string to 65k length.
     *
     * {@link SerializedATN.getSegments}
     *
     * @returns the serialized ATN segment limit
     */
    getSerializedATNSegmentLimit(): number;

    /**
     * Get a meaningful name for a token type useful during code generation. Literals without associated names
     * are converted to the string equivalent of their integer values. Used to generate x==ID and x==34 type
     * comparisons etc...  Essentially we are looking for the most obvious way to refer to a token type in the
     * generated code.
     *
     * @param g The grammar object containing the token names.
     * @param ttype The token type to convert to a label.
     *
     * @returns The token type as a label. If the token type is not defined in the grammar, it returns the
     *          string representation of the token type.
     */
    getTokenTypeAsTargetLabel(g: Grammar, ttype: number): string;

    /**
     * Converts from an TypeScript string literal found in a grammar file to an equivalent string literal in the target
     * language.
     *
     * For Java, this is the translation `'a\n"'` -> `"a\n\""`. Expect single quotes around the incoming literal.
     * Just flip the quotes and replace double quotes with `\"`.
     *
     * Note that we have decided to allow people to use '\"' without penalty, so we must build the target string in
     * a loop as {@link String.replaceAll} cannot handle both `\"` and `"` without a lot of messing around.
     *
     * @param literal The string literal to convert.
     * @param addQuotes If true, the string is quoted. If false, it is not.
     * @param escapeSpecial If true, escape special characters.
     *
     * @returns The converted string.
     */
    getTargetStringLiteralFromANTLRStringLiteral(literal: string, addQuotes: boolean,
        escapeSpecial?: boolean): string;

    /** Allows to transform a token identifier to a different string (e.g. to avoid keyword collissions). */
    tokenNameTransformer?: (name: string) => string;

    /** Allows to alter a grammar text before it is processed by antlr-ng. */
    inputFilter?: (grammar: string) => string;

    /**
     * Allows to alter the output of antlr-ng after it was processed by the generator
     * (e.g. to remove unwanted parts). This is called once per generated file, right before it is written to
     * the file system.
     */
    outputFilter?: (code: string) => string;
}
