/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// cspell: ignore bitand bitor compl constexpr

import { Target } from "../Target.js";

export class CppTarget extends Target {
    protected static readonly targetCharValueEscape = new Map<number, string>([
        // https://stackoverflow.com/a/10220539/1046374
        [0x07, "a"],
        [0x08, "b"],
        [0x0B, "v"],
        [0x1B, "e"],
        [0x3F, "?"],
    ]);

    protected static readonly reservedWords = new Set([
        "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand",
        "bitor", "bool", "break", "case", "catch", "char", "char16_t",
        "char32_t", "class", "compl", "concept", "const", "constexpr",
        "const_cast", "continue", "decltype", "default", "delete", "do",
        "double", "dynamic_cast", "else", "enum", "explicit", "export",
        "extern", "false", "float", "for", "friend", "goto", "if",
        "inline", "int", "long", "mutable", "namespace", "new",
        "noexcept", "not", "not_eq", "nullptr", "NULL", "operator", "or",
        "or_eq", "private", "protected", "public", "register",
        "reinterpret_cast", "requires", "return", "short", "signed",
        "sizeof", "static", "static_assert", "static_cast", "struct",
        "switch", "template", "this", "thread_local", "throw", "true",
        "try", "typedef", "typeid", "typename", "union", "unsigned",
        "using", "virtual", "void", "volatile", "wchar_t", "while",
        "xor", "xor_eq",

        "rule", "parserRule",
    ]);

    public override getTargetCharValueEscape(): Map<number, string> {
        return new Map([...Target.defaultCharValueEscape, ...CppTarget.targetCharValueEscape]);
    }

    public override needsHeader(): boolean {
        return true;
    }

    public override getRecognizerFileName(header: boolean): string {
        const extST = this.templates.getInstanceOf(header ? "headerFileExtension" : "codeFileExtension")!;
        const recognizerName = this.gen.g!.getRecognizerName();

        return recognizerName + extST.render();
    }

    public override getListenerFileName(header: boolean): string {
        const extST = this.templates.getInstanceOf(header ? "headerFileExtension" : "codeFileExtension")!;
        const listenerName = this.gen.g!.name + "Listener";

        return listenerName + extST.render();
    }

    public override getVisitorFileName(header: boolean): string {
        const extST = this.templates.getInstanceOf(header ? "headerFileExtension" : "codeFileExtension")!;
        const listenerName = this.gen.g!.name + "Visitor";

        return listenerName + extST.render();
    }

    public override getBaseListenerFileName(header: boolean): string {
        const extST = this.templates.getInstanceOf(header ? "headerFileExtension" : "codeFileExtension")!;
        const listenerName = this.gen.g!.name + "BaseListener";

        return listenerName + extST.render();
    }

    public override getBaseVisitorFileName(header: boolean): string {
        const extST = this.templates.getInstanceOf(header ? "headerFileExtension" : "codeFileExtension")!;
        const listenerName = this.gen.g!.name + "BaseVisitor";

        return listenerName + extST.render();
    }

    protected override get reservedWords(): Set<string> {
        return CppTarget.reservedWords;
    }

    protected override shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint: number): boolean {
        if (codePoint === 0x3F) { // ?
            // In addition to the default escaped code points, also escape ? to prevent trigraphs.
            // Ideally, we would escape ? with \?, but escaping as unicode \u003F works as well.
            return true;
        } else {
            return super.shouldUseUnicodeEscapeForCodePointInDoubleQuotedString(codePoint);
        }
    }
}
