/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { ANTLRMessage } from "./ANTLRMessage.js";
import { ErrorType } from "./ErrorType.js";
import { type Rule } from "./Rule.js";

export class LeftRecursionCyclesMessage extends ANTLRMessage {
    public constructor(fileName: string, cycles: Rule[][]) {
        const token = LeftRecursionCyclesMessage.getStartTokenOfFirstRule(cycles);
        const line = token?.line ?? -1;
        const column = token?.column ?? -1;
        super(ErrorType.LEFT_RECURSION_CYCLES, fileName, line, column, cycles);
    }

    protected static getStartTokenOfFirstRule(cycles: Rule[][]): Token | undefined {
        for (const collection of cycles) {
            for (const rule of collection) {
                return rule.ast.token;
            }
        }

        return undefined;
    }
}
