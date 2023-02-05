/* java2ts: keep */

/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { java, S, JavaObject, MurmurHash } from "jree";
import { Token } from "./Token";
import { Vocabulary } from "./Vocabulary";

import { JavaObject } from "../../../../../lib/java/lang/Object";

/**
 * This class provides a default implementation of the {@link Vocabulary}
 * interface.
 *
 * @author Sam Harwell
 */
export class VocabularyImpl extends JavaObject implements Vocabulary {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static readonly EMPTY_NAMES: java.lang.String[] = new Array<java.lang.String>(0);

    /**
     * Gets an empty {@link Vocabulary} instance.
     *
     * <p>
     * No literal or symbol names are assigned to token types, so
     * {@link #getDisplayName(int)} returns the numeric value for all tokens
     * except {@link Token#EOF}.</p>
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/member-ordering
    public static readonly EMPTY_VOCABULARY =
        new VocabularyImpl(VocabularyImpl.EMPTY_NAMES, VocabularyImpl.EMPTY_NAMES, VocabularyImpl.EMPTY_NAMES);

    private readonly literalNames: Array<java.lang.String | null>;
    private readonly symbolicNames: Array<java.lang.String | null>;
    private readonly displayNames: java.lang.String[];
    private readonly maxTokenType: number;

    /**
     * Constructs a new instance of {@link VocabularyImpl} from the specified
     * literal, symbolic, and display token names.
     *
     * @param literalNames The literal names assigned to tokens, or {@code null}
     * if no literal names are assigned.
     * @param symbolicNames The symbolic names assigned to tokens, or
     * {@code null} if no symbolic names are assigned.
     * @param displayNames The display names assigned to tokens, or {@code null}
     * to use the values in {@code literalNames} and {@code symbolicNames} as
     * the source of display names, as described in
     * {@link #getDisplayName(int)}.
     *
     * @see #getLiteralName(int)
     * @see #getSymbolicName(int)
     * @see #getDisplayName(int)
     */
    public constructor(literalNames: Array<java.lang.String | null>, symbolicNames: Array<java.lang.String | null>,
        displayNames?: java.lang.String[]) {
        super();

        this.literalNames = literalNames ?? VocabularyImpl.EMPTY_NAMES;
        this.symbolicNames = symbolicNames ?? VocabularyImpl.EMPTY_NAMES;
        this.displayNames = displayNames ?? VocabularyImpl.EMPTY_NAMES;
        // See note here on -1 part: https://github.com/antlr/antlr4/pull/1146
        this.maxTokenType =
            Math.max(this.displayNames.length,
                Math.max(this.literalNames.length, this.symbolicNames.length)) - 1;
    }

    /**
     * Returns a {@link VocabularyImpl} instance from the specified set of token
     * names. This method acts as a compatibility layer for the single
     * {@code tokenNames} array generated by previous releases of ANTLR.
     *
     * <p>The resulting vocabulary instance returns {@code null} for
     * {@link #getLiteralName(int)} and {@link #getSymbolicName(int)}, and the
     * value from {@code tokenNames} for the display names.</p>
     *
     * @param tokenNames The token names, or {@code null} if no token names are
     * available.
      @returns A {@link Vocabulary} instance which uses {@code tokenNames} for
     * the display names of tokens.
     */
    public static fromTokenNames = (tokenNames: java.lang.String[] | null): Vocabulary => {
        if (tokenNames === null || tokenNames.length === 0) {
            return VocabularyImpl.EMPTY_VOCABULARY;
        }

        const literalNames: Array<java.lang.String | null> = java.util.Arrays.copyOf(tokenNames, tokenNames.length);
        const symbolicNames: Array<java.lang.String | null> = java.util.Arrays.copyOf(tokenNames, tokenNames.length);
        for (let i = 0; i < tokenNames.length; i++) {
            const tokenName = tokenNames[i];
            if (tokenName === null) {
                continue;
            }

            if (!tokenName.isEmpty()) {
                const firstChar = tokenName.charAt(0);
                if (firstChar === 0x27) {
                    symbolicNames[i] = null;
                    continue;
                } else {
                    if (java.lang.Character.isUpperCase(firstChar)) {
                        literalNames[i] = null;
                        continue;
                    }
                }
            }

            // wasn't a literal or symbolic name
            literalNames[i] = null;
            symbolicNames[i] = null;
        }

        return new VocabularyImpl(literalNames, symbolicNames, tokenNames);
    };

    public getMaxTokenType = (): number => {
        return this.maxTokenType;
    };

    public getLiteralName = (tokenType: number): java.lang.String | null => {
        if (tokenType >= 0 && tokenType < this.literalNames.length) {
            return this.literalNames[tokenType];
        }

        return null;
    };

    public getSymbolicName = (tokenType: number): java.lang.String | null => {
        if (tokenType >= 0 && tokenType < this.symbolicNames.length) {
            return this.symbolicNames[tokenType];
        }

        if (tokenType === Token.EOF) {
            return S`EOF`;
        }

        return null;
    };

    public getDisplayName = (tokenType: number): java.lang.String => {
        if (tokenType >= 0 && tokenType < this.displayNames.length) {
            const displayName = this.displayNames[tokenType];
            if (displayName !== null) {
                return displayName;
            }
        }

        const literalName = this.getLiteralName(tokenType);
        if (literalName !== null) {
            return literalName;
        }

        const symbolicName = this.getSymbolicName(tokenType);
        if (symbolicName !== null) {
            return symbolicName;
        }

        return java.lang.Integer.toString(tokenType);
    };

    // Because this is an actual implementation object, we can provide access methods for vocabulary symbols

    public getLiteralNames = (): Array<java.lang.String | null> => {
        return this.literalNames;
    };

    public getSymbolicNames = (): Array<java.lang.String | null> => {
        return this.symbolicNames;
    };

    public getDisplayNames = (): java.lang.String[] => {
        return this.displayNames;
    };
}
