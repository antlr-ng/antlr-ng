/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StructDecl } from "../decl/StructDecl.js";
import { ActionChunk } from "./ActionChunk.js";
import { SetAttr } from "./SetAttr.js";

export class SetNonLocalAttr extends SetAttr {
    public ruleName: string;
    public ruleIndex: number;

    public constructor(ctx: StructDecl,
        ruleName: string, name: string, escapedName: string, ruleIndex: number,
        rhsChunks: ActionChunk[]) {
        super(ctx, name, escapedName, rhsChunks);
        this.ruleName = ruleName;
        this.ruleIndex = ruleIndex;
    }
}
