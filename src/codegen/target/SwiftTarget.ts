/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore associatedtype deinit typealias nonmutating

import { format } from "../../support/helpers.js";
import { Target, type CodePoint } from "../Target.js";

export class SwiftTarget extends Target {
    // https://docs.swift.org/swift-book/documentation/the-swift-programming-language/stringsandcharacters/
    protected static readonly targetCharValueEscape = new Map<number, string>([
        [0, "0"],
    ]);

    protected static readonly reservedWords = new Set([
        "associatedtype", "class", "deinit", "enum", "extension", "func", "import", "init", "inout", "internal",
        "let", "operator", "private", "protocol", "public", "static", "struct", "subscript", "typealias", "var",
        "break", "case", "continue", "default", "defer", "do", "else", "fallthrough", "for", "guard", "if",
        "in", "repeat", "return", "switch", "where", "while",
        "as", "catch", "dynamicType", "false", "is", "nil", "rethrows", "super", "self", "Self", "throw", "throws",
        "true", "try", "__COLUMN__", "__FILE__", "__FUNCTION__", "__LINE__", "#column", "#file", "#function", "#line",
        "_", "#available", "#else", "#elseif", "#endif", "#if", "#selector",
        "associativity", "convenience", "dynamic", "didSet", "final", "get", "infix", "indirect", "lazy",
        "left", "mutating", "none", "nonmutating", "optional", "override", "postfix", "precedence",
        "prefix", "Protocol", "required", "right", "set", "Type", "unowned", "weak", "willSet",

        "rule", "parserRule",
    ]);

    public override getTargetCharValueEscape(): Map<CodePoint, string> {
        return new Map([...Target.defaultCharValueEscape, ...SwiftTarget.targetCharValueEscape]);
    }

    protected override get reservedWords(): Set<string> {
        return SwiftTarget.reservedWords;
    }

    protected override escapeWord(word: string): string {
        return "`" + word + "`";
    }

    protected override escapeChar(v: number): string {
        return format("\\u{%X}", v);
    }
}
