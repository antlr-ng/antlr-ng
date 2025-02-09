/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/** The string values of this type appear in look up maps. */
export enum LabelType {
    RuleLabel = "RULE_LABEL",
    TokenLabel = "TOKEN_LABEL",
    RuleListLabel = "RULE_LIST_LABEL",
    TokenListLabel = "TOKEN_LIST_LABEL",

    /** Used in lexer for x='a' */
    LexerStringLabel = "LEXER_STRING_LABEL"
}
