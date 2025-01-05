/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore endswitch endwhile insteadof

import { format } from "../../misc/helpers.js";
import { CodeGenerator } from "../CodeGenerator.js";
import { Target, type char } from "../Target.js";

export class PHPTarget extends Target {
    protected static readonly reservedWords = new Set([
        "abstract", "and", "array", "as",
        "break",
        "callable", "case", "catch", "class", "clone", "const", "continue",
        "declare", "default", "die", "do",
        "echo", "else", "elseif", "empty", "enddeclare", "endfor", "endforeach",
        "endif", "endswitch", "endwhile", "eval", "exit", "extends",
        "final", "finally", "for", "foreach", "function",
        "global", "goto",
        "if", "implements", "include", "include_once", "instanceof", "insteadof", "interface", "isset",
        "list",
        "namespace", "new",
        "or",
        "print", "private", "protected", "public",
        "require", "require_once", "return",
        "static", "switch",
        "throw", "trait", "try",
        "unset", "use",
        "var",
        "while",
        "xor",
        "yield",
        "__halt_compiler", "__CLASS__", "__DIR__", "__FILE__", "__FUNCTION__",
        "__LINE__", "__METHOD__", "__NAMESPACE__", "__TRAIT__",

        // misc
        "rule", "parserRule",
    ]);

    protected static readonly targetCharValueEscape = new Map<char, string>([
        // https://www.php.net/manual/en/language.types.string.php
        [0x09, "t"],
        [0x0A, "n"],
        [0x0B, "v"],
        [0x0C, "f"],
        [0x0D, "r"],
        [0x1B, "e"],
        [0x5C, "\\"],
        [0x22, "\""],
        [0x27, "'"],
        [0x24, "$"],
    ]);

    public constructor(gen: CodeGenerator) {
        super(gen);
    }

    public override getTargetCharValueEscape(): Map<char, string> {
        return PHPTarget.targetCharValueEscape;
    }

    public override supportsOverloadedMethods(): boolean {
        return false;
    }

    public override getTargetStringLiteralFromANTLRStringLiteral(generator: CodeGenerator, literal: string,
        addQuotes: boolean, escapeSpecial: boolean): string {
        let targetStringLiteral = super.getTargetStringLiteralFromANTLRStringLiteral(generator, literal, addQuotes,
            escapeSpecial);
        targetStringLiteral = targetStringLiteral.replace("$", "\\$");

        return targetStringLiteral;
    }

    public override isATNSerializedAsInts(): boolean {
        return true;
    }

    protected override get reservedWords(): Set<string> {
        return PHPTarget.reservedWords;
    }

    protected override escapeChar(v: number): string {
        return format("\\u{%X}", v);
    }
}
