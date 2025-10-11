/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { CharSupport } from "../misc/CharSupport.js";
import { Character } from "../support/Character.js";
import type { IndexedObject } from "../support/helpers.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import { Grammar } from "../tool/Grammar.js";
import type { CodePoint, ITargetGenerator, Lines } from "./ITargetGenerator.js";
import * as OutputModelObjects from "./model/index.js";
import { UnicodeEscapes } from "./UnicodeEscapes.js";

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

    /** The quote character(s) to use for wrapping each element. */
    quote?: string;

    /** The string to use for the final shape of the elements. */
    template?: string;
}

/**
 * Base class for all target generators. It provides some common functionality and helper methods/fields.
 * The actual code generation is done in the subclasses.
 */
export abstract class GeneratorBase implements Partial<ITargetGenerator> {
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

    public abstract readonly reservedWords: Set<string>;

    /** For debugging: when set to true includes start and end markers for each part. */
    public logRendering = false;

    /** The version of this generator. */
    public abstract readonly version: string;

    public abstract readonly language: string;

    public abstract readonly codeFileExtension: string;

    public readonly wantsBaseListener: boolean = false;

    public readonly wantsBaseVisitor: boolean = false;

    public readonly supportsOverloadedMethods: boolean = true;

    public readonly isATNSerializedAsInts: boolean = true;

    public inlineTestSetWordSize = 64;

    public readonly declarationFileExtension?: string;

    /**
     * Returns the default escape map for the target language. This is used to escape characters in strings.
     * Subclasses can override this method to provide additional or different escape sequences.
     *
     * @returns The default escape map for the target language.
     */
    public get charValueEscapeMap(): Map<CodePoint, string> {
        return GeneratorBase.defaultCharValueEscape;
    }

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

                    case "u": { // Either unnnn or u{nnnnnn}.
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
    public renderList<T>(list: Iterable<T>, options: IRenderCollectionOptions): Lines {
        const result = [];
        const quote = options.quote ?? "";
        const separator = options.separator ?? ", ";

        let line = "";
        for (const item of list) {
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
            // Remove the last separator.
            line = line.substring(0, line.length - separator.length);
            result.push(line);
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
        ...keys: string[]): string[] {
        const result: string[] = [];
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

    public renderImplicitTokenLabel(tokenName: string): string { return tokenName; }
    public renderImplicitRuleLabel(ruleName: string): string { return ruleName; };
    public renderImplicitSetLabel(id: string): string { return `_tset${id}`; };
    public renderListLabelName(label: string): string { return label; }

    protected static addEscapedChar(map: Map<Character, string>, key: number, representation?: number): void {
        representation = representation ?? key;
        map.set(key, "\\" + representation);
    }

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

    protected renderActionChunks(chunks?: OutputModelObjects.ActionChunk[]): string {
        const result: Lines = [];

        if (chunks) {
            for (const chunk of chunks) {
                const methodName = `render${chunk.constructor.name}`;
                const executor = this as IndexedObject<GeneratorBase>;
                const method = executor[methodName] as (chunk: OutputModelObjects.ActionChunk) => Lines;
                result.push(...method.call(executor, chunk) as Lines);
            }
        }

        return result.join("");
    }

    /**
     * For any action chunk, what is correctly-typed context struct ptr?
     *
     * @param actionChunk The action chunk to render the context for.
     *
     * @returns The rendered context as a string. If the action chunk does not have a context, an empty string
     *          is returned.
     */
    protected renderContext(actionChunk: OutputModelObjects.ActionChunk): string {
        if (!actionChunk.ctx) {
            return "";
        }

        return this.renderTypedContext(actionChunk.ctx);
    }

    protected renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [`// Generated from ${file.grammarFileName} by antlr-ng ${this.version}. Do not edit!`];
    }

    /** Only casts localContext to the type when the cast isn't redundant (i.e. to a sub-context for a labeled alt) */
    protected abstract renderTypedContext(ctx: OutputModelObjects.StructDecl): string;

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

    private filenameForType(forDeclarationFile: boolean, type: string, grammarName: string): string {
        const extension = (forDeclarationFile && this.declarationFileExtension)
            ? this.declarationFileExtension
            : this.codeFileExtension;

        return grammarName + type + extension;
    }
}
