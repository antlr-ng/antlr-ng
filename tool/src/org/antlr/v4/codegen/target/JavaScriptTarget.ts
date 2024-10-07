/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { Target } from "../Target.js";

export class JavaScriptTarget extends Target {
    /** Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar */
    protected static readonly reservedWords = new Set([
        "break", "case", "class", "catch", "const", "continue", "debugger",
        "default", "delete", "do", "else", "export", "extends", "finally", "for",
        "function", "if", "import", "in", "instanceof", "let", "new", "return",
        "super", "switch", "this", "throw", "try", "typeof", "var", "void",
        "while", "with", "yield",

        //future reserved
        "enum", "await", "implements", "package", "protected", "static",
        "interface", "private", "public",

        //future reserved in older standards
        "abstract", "boolean", "byte", "char", "double", "final", "float",
        "goto", "int", "long", "native", "short", "synchronized", "transient",
        "volatile",

        //literals
        "null", "true", "false",

        // misc
        "rule", "parserRule",
    ]);

    public override  getInlineTestSetWordSize(): number {
        return 32;
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

    public override  isATNSerializedAsInts(): boolean {
        return true;
    }

    protected override  get reservedWords(): Set<string> {
        return JavaScriptTarget.reservedWords;
    }
}
