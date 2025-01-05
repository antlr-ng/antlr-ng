/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/** What type of grammar is it we process currently? */
export enum GrammarType {
    /** A lexer grammar. */
    Lexer,

    /** A parser grammar. */
    Parser,

    /**
     * A combined grammar (lexer + parser in a single file).
     * Combined grammars are limited and should be avoided.
     */
    Combined
}
