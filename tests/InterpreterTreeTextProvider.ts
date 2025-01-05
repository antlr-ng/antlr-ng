/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ErrorNode, Trees, type ParseTree } from "antlr4ng";

export class InterpreterTreeTextProvider {
    public ruleNames: string[];
    public constructor(ruleNames: string[]) {
        this.ruleNames = ruleNames;
    }

    public getText(node: ParseTree | null): string {
        if (node === null) {
            return "null";
        }

        const nodeText = Trees.getNodeText(node, this.ruleNames) ?? "<unknown>";
        if (node instanceof ErrorNode) {
            return "<error " + nodeText + ">";
        }

        return nodeText;
    }
}
