/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Character } from "../support/Character.js";

/** Utility class to escape Unicode code points using various languages' syntax. */
export class UnicodeEscapes {
    public static escapeCodePoint(codePoint: number, language: string): string {
        let introducer = "\\u";
        let text = "";

        switch (language) {
            case "CSharp":
            case "Python3":
            case "Cpp":
            case "Go":
            case "PHP": {
                if (Character.isSupplementaryCodePoint(codePoint)) {
                    introducer = "\\U";
                    //text = printf("%08x", codePoint);
                    text = codePoint.toString(16).padStart(8, "0");
                } else {
                    //text = printf("%04x", codePoint);
                    text = codePoint.toString(16).padStart(4, "0");
                }

                break;
            }

            case "Swift": {
                //text = printf("{%04x}", codePoint);
                text = `{${codePoint.toString(16).padStart(4, "0")}}`;

                break;
            }

            default: {
                if (Character.isSupplementaryCodePoint(codePoint)) {
                    /*return introducer + printf("%04x", Number(Character.highSurrogate(codePoint))).toUpperCase() +
                        introducer + printf("%04x", Number(Character.lowSurrogate(codePoint))).toUpperCase();*/
                    return introducer +
                        Number(Character.highSurrogate(codePoint)).toString(16).toUpperCase().padStart(4, "0") +
                        introducer +
                        Number(Character.lowSurrogate(codePoint)).toString(16).toUpperCase().padStart(4, "0");
                } else {
                    //text = printf("%04x", codePoint);
                    text = codePoint.toString(16).padStart(4, "0");
                }
            }
        }

        return introducer + text.toUpperCase();
    }
}
