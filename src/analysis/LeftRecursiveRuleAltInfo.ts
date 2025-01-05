/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { AltAST } from "../tool/ast/AltAST.js";

export class LeftRecursiveRuleAltInfo {
    public altNum: number; // original alt index (from 1)
    public leftRecursiveRuleRefLabel?: string;
    public altLabel?: string;
    public readonly isListLabel: boolean;
    public altText: string;
    public originalAltAST?: AltAST;
    public altAST: AltAST; // transformed ALT
    public nextPrec: number;

    public constructor(altNum: number, altText: string, leftRecursiveRuleRefLabel?: string, altLabel?: string,
        isListLabel?: boolean, originalAltAST?: AltAST) {
        this.altNum = altNum;
        this.altText = altText;
        this.leftRecursiveRuleRefLabel = leftRecursiveRuleRefLabel;
        this.altLabel = altLabel;
        this.isListLabel = isListLabel ?? false;
        this.originalAltAST = originalAltAST;
    }

}
