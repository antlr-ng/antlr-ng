/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns */

import { Target } from "../Target.js";

export class JavaTarget extends Target {

    protected static readonly reservedWords = new Set([
        "abstract", "assert", "boolean", "break", "byte", "case", "catch",
        "char", "class", "const", "continue", "default", "do", "double", "else",
        "enum", "extends", "false", "final", "finally", "float", "for", "goto",
        "if", "implements", "import", "instanceof", "int", "interface",
        "long", "native", "new", "null", "package", "private", "protected",
        "public", "return", "short", "static", "strictfp", "super", "switch",
        "synchronized", "this", "throw", "throws", "transient", "true", "try",
        "void", "volatile", "while",

        // misc
        "rule", "parserRule",
    ]);

    /**
     * The Java target can cache the code generation templates.
     */
    //private static readonly targetTemplates = new STGroup();

    public override get reservedWords(): Set<string> {
        return JavaTarget.reservedWords;
    }

    public override getSerializedATNSegmentLimit(): number {
        // 65535 is the class file format byte limit for a UTF-8 encoded string literal
        // 3 is the maximum number of bytes it takes to encode a value in the range 0-0xFFFF
        return 65535 / 3;
    }

    public override isATNSerializedAsInts(): boolean {
        return false;
    }
}
