/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { GrammarAST } from "./GrammarAST.js";

export interface IQuantifierAST extends GrammarAST {
    isGreedy(): boolean;
}
