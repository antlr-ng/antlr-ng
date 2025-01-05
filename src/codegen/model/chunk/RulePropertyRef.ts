/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ActionChunk } from "./ActionChunk.js";
import { StructDecl } from "../decl/StructDecl.js";

export class RulePropertyRef extends ActionChunk {
    public label: string;

    public constructor(ctx: StructDecl, label: string) {
        super(ctx);
        this.label = label;
    }
}
