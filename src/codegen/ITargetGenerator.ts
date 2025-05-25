/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Rule } from "../tool/Rule.js";
import type { LexerFile } from "./model/LexerFile.js";
import type { ListenerFile } from "./model/ListenerFile.js";
import type { ParserFile } from "./model/ParserFile.js";
import type { VisitorFile } from "./model/VisitorFile.js";

/** Represets a single code point in Unicode. */
export type CodePoint = number;

/** Variables set during a generation run to pass values around that can be used in the individual methods. */
export interface IGenerationVariables {
    [key: string]: string | boolean | number | undefined;
    declaration: boolean;
}

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
}

/** Defines the structure for a target generator. */
export interface ITargetGenerator extends ITargetGeneratorCallables {
    /** A unique identifier for the generator. */
    id: string;

    /** The human readably language name for the generator. */
    language: string;

    /** A list of specifiers that can be used to identify this language (not case sensitive). */
    languageSpecifiers: string[];

    /** Does this target need a declaration file (e.g. a C/C++ header file or type definitions for JavaScript)? */
    needsDeclarationFile?: boolean;

    /** The extension to be used for generated files which contain code (including the dot). */
    codeFileExtension: string;

    /** The extension to be used for generated files which contain type definitions (including the dot). */
    declarationFileExtension?: string;

    /** Reserved words of this language. */
    reservedWords: Set<string>;

    /** The rule context name is the rule followed by a suffix; e.g., r becomes rContext. */
    contextNameSuffix: string;

    lexerRuleContext: string;

    ruleContextNameSuffix: string;

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
