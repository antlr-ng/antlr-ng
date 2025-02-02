/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { format } from "../../support/helpers.js";
import { Target, type CodePoint } from "../Target.js";

export class CSharpTarget extends Target {
    protected static readonly reservedWords = new Set([
        "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char", "checked", "class", "const",
        "continue", "decimal", "default", "delegate", "do", "double", "else", "enum", "event", "explicit", "extern",
        "false", "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit", "in", "int", "interface",
        "internal", "is", "lock", "long", "namespace", "new", "null", "object", "operator", "out", "override",
        "params", "private", "protected", "public", "readonly", "ref", "return", "sbyte", "sealed", "short", "sizeof",
        "stackalloc", "static", "string", "struct", "switch", "this", "throw", "true", "try", "typeof", "uint", "ulong",
        "unchecked", "unsafe", "ushort", "using", "virtual", "values", "void", "volatile", "while",
    ]);

    protected static readonly targetCharValueEscape = new Map<CodePoint, string>([
        // https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/strings/#string-escape-sequences
        [0, "0"],
        [0x07, "a"],
        [0x08, "b"],
        [0x0B, "v"],
        [0x1B, "e"],
        [0x3F, "?"],

    ]);

    public override getTargetCharValueEscape(): Map<CodePoint, string> {
        return new Map([...Target.defaultCharValueEscape, ...CSharpTarget.targetCharValueEscape]);
    }

    public override isATNSerializedAsInts(): boolean {
        return true;
    }

    protected override get reservedWords(): Set<string> {
        return CSharpTarget.reservedWords;
    }

    protected override escapeWord(word: string): string {
        return "@" + word;
    }

    protected override escapeChar(v: number): string {
        return format("\\x%X", v);
    }
}
