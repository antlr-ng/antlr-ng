/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { ActionSplitterListener } from "../parse/ActionSplitterListener.js";

export class BlankActionSplitterListener implements ActionSplitterListener {

    public qualifiedAttr(expr: string, x: Token, y: Token): void {
        // Do nothing
    }

    public setAttr(expr: string, x: Token, rhs: Token): void {
        // Do nothing
    }

    public attr(expr: string, x: Token): void {
        // Do nothing
    }

    public templateInstance(expr: string): void {
        // Do nothing
    }

    public nonLocalAttr(expr: string, x: Token, y: Token): void {
        // Do nothing
    }

    public setNonLocalAttr(expr: string, x: Token, y: Token, rhs: string): void {
        // Do nothing
    }

    public indirectTemplateInstance(expr: string): void {
        // Do nothing
    }

    public setExprAttribute(expr: string): void {
        // Do nothing
    }

    public setSTAttribute(expr: string): void {
        // Do nothing
    }

    public templateExpr(expr: string): void {
        // Do nothing
    }

    public text(text: string): void {
        // Do nothing
    }
}
