/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CodeGenerator } from "../CodeGenerator.js";
import { Target } from "../Target.js";

export class TypeScriptTarget extends Target {

    /**
     * https://github.com/microsoft/TypeScript/blob/fad889283e710ee947e8412e173d2c050107a3c1/src/compiler/scanner.ts
     */
    protected static readonly reservedWords = new Set([
        "any", "as", "boolean", "break", "case", "catch", "class", "continue", "const", "constructor", "debugger",
        "declare", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "from",
        "function", "get", "if", "implements", "import", "in", "instanceof", "interface", "let", "module", "new",
        "null", "number", "package", "private", "protected", "public", "require", "return", "set", "static", "string",
        "super", "switch", "symbol", "this", "throw", "true", "try", "type", "typeof", "var", "void", "while", "with",
        "yield", "of",
    ]);

    public constructor(gen: CodeGenerator) {
        super(gen);
    }

    public override getInlineTestSetWordSize(): number {
        return 32;
    }

    public override wantsBaseListener(): boolean {
        return false;
    }

    public override wantsBaseVisitor(): boolean {
        return false;
    }

    public override supportsOverloadedMethods(): boolean {
        return true;
    }

    public override isATNSerializedAsInts(): boolean {
        return true;
    }

    protected override get reservedWords(): Set<string> {
        return TypeScriptTarget.reservedWords;
    }

}
