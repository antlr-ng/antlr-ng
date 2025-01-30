/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StructDecl } from "../decl/StructDecl.js";
import { SymbolRefChunk } from "./SymbolRefChunk.js";

export class NonLocalAttrRef extends SymbolRefChunk {
    public ruleName: string;
    public ruleIndex: number;

    public constructor(ctx: StructDecl, ruleName: string, name: string, escapedName: string, ruleIndex: number) {
        super(ctx, name, escapedName);
        this.ruleName = ruleName;
        this.ruleIndex = ruleIndex;
    }
}
