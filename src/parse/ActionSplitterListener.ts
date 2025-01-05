/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

export interface ActionSplitterListener {
    qualifiedAttr(expr: string, x: Token, y: Token): void;
    setAttr(expr: string, x: Token, rhs: Token): void;
    attr(expr: string, x: Token): void;

    setNonLocalAttr(expr: string, x: Token, y: Token, rhs: string): void;
    nonLocalAttr(expr: string, x: Token, y: Token): void;

    text(text: string): void;
}
