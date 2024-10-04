/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

// cspell: ignore bytearray classmethod delattr divmod frozenset getattr hasattr isinstance issubclass memoryview
// cspell: ignore setattr repr staticmethod unichr

import { CodeGenerator } from "../CodeGenerator.js";
import { Target, type char } from "../Target.js";

export class Python3Target extends Target {
    protected static readonly reservedWords = new Set([
        "abs", "all", "and", "any", "apply", "as", "assert",
        "bin", "bool", "break", "buffer", "bytearray",
        "callable", "chr", "class", "classmethod", "coerce", "compile", "complex", "continue",
        "def", "del", "delattr", "dict", "dir", "divmod",
        "elif", "else", "enumerate", "eval", "execfile", "except",
        "file", "filter", "finally", "float", "for", "format", "from", "frozenset",
        "getattr", "global", "globals",
        "hasattr", "hash", "help", "hex",
        "id", "if", "import", "in", "input", "int", "intern", "is", "isinstance", "issubclass", "iter",
        "lambda", "len", "list", "locals",
        "map", "max", "min", "memoryview",
        "next", "nonlocal", "not",
        "object", "oct", "open", "or", "ord",
        "pass", "pow", "print", "property",
        "raise", "range", "raw_input", "reduce", "reload", "repr", "return", "reversed", "round",
        "set", "setattr", "slice", "sorted", "staticmethod", "str", "sum", "super",
        "try", "tuple", "type",
        "unichr", "unicode",
        "vars",
        "with", "while",
        "yield",
        "zip",
        "__import__",
        "True", "False", "None",

        // misc
        "rule", "parserRule",
    ]);

    protected static readonly targetCharValueEscape = new Map<char, string>([
        // https://docs.python.org/3/reference/lexical_analysis.html#string-and-bytes-literals
        [0x07, "a"],
        [0x08, "b"],
        [0x09, "t"],
        [0x0A, "n"],
        [0x0C, "f"],
        [0x0D, "r"],
        [0x0B, "v"],
        [0x5C, "\\"],
        [0x22, "\""],
        [0x27, "'"],
    ]);

    public constructor(gen: CodeGenerator) {
        super(gen);
    }


    public override  getTargetCharValueEscape(): Map<char, string> {
        return Python3Target.targetCharValueEscape;
    }


    public override  wantsBaseListener(): boolean {
        return false;
    }


    public override  wantsBaseVisitor(): boolean {
        return false;
    }


    public override  supportsOverloadedMethods(): boolean {
        return false;
    }


    protected override  get reservedWords(): Set<string> {
        return Python3Target.reservedWords;
    }
}
