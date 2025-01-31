/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Decl } from "./decl/Decl.js";

/** All the rule elements we can label like tokens, rules, sets, wildcard. */
export interface ILabeledOp {
    readonly labels: Decl[];
}
