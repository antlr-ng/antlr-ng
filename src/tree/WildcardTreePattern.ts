/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { Token } from "antlr4ng";

import { TreePattern } from "./TreePattern.js";

export class WildcardTreePattern extends TreePattern {
    public constructor(payload: Token) {
        super(payload);
    }
};
