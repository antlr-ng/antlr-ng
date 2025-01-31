/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { LL1AltBlock } from "./LL1AltBlock.js";

/**
 * An optional block is just an alternative block where the last alternative
 *  is epsilon. The analysis takes care of adding to the empty alternative.
 *
 *  `(A | B | C)?`
 */
export class LL1OptionalBlock extends LL1AltBlock { }
