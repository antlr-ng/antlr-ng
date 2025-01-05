/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { Token, Vocabulary } from "antlr4ng";
import { Character } from "../src/support/Character.js";

// TODO: should be in the runtime tests.
describe("TestVocabulary", () => {
    it("testEmptyVocabulary", () => {
        expect(Vocabulary.EMPTY_VOCABULARY).not.toBeNull();
        expect(Vocabulary.EMPTY_VOCABULARY.getSymbolicName(Token.EOF)).toBe("EOF");
        expect(Vocabulary.EMPTY_VOCABULARY.getDisplayName(Token.INVALID_TYPE)).toBe("0");
    });

    it("testVocabularyFromTokenNames", () => {
        const tokenNames = [
            "<INVALID>",
            "TOKEN_REF", "RULE_REF", "'//'", "'/'", "'*'", "'!'", "ID", "STRING"
        ];

        const vocabulary = Vocabulary.fromTokenNames(tokenNames);
        expect(vocabulary).toBeDefined();

        expect(vocabulary.getSymbolicName(Token.EOF)).toBe("EOF");
        for (let i = 0; i < tokenNames.length; i++) {
            expect(vocabulary.getDisplayName(i)).toBe(tokenNames[i]);

            if (tokenNames[i].startsWith("'")) {
                expect(vocabulary.getLiteralName(i)).toBe(tokenNames[i]);
                expect(vocabulary.getSymbolicName(i)).toBeNull();
            } else {
                if (Character.isUpperCase(tokenNames[i].codePointAt(0)!)) {
                    expect(vocabulary.getLiteralName(i)).toBeNull();
                    expect(vocabulary.getSymbolicName(i)).toBe(tokenNames[i]);
                } else {
                    expect(vocabulary.getLiteralName(i)).toBeNull();
                    expect(vocabulary.getSymbolicName(i)).toBeNull();
                }
            }

        }
    });
});
