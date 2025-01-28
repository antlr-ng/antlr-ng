/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { AltAST } from "../tool/ast/AltAST.js";

export interface ILeftRecursiveRuleAltInfo {
    /** original alt index (from 1). */
    altNum: number;

    leftRecursiveRuleRefLabel?: string;
    altLabel?: string;
    readonly isListLabel: boolean;
    altText: string;
    originalAltAST?: AltAST;

    /** transformed ALT */
    altAST?: AltAST;

    nextPrec: number;
}
