/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StructDecl } from "../decl/StructDecl.js";
import { ActionChunk } from "./ActionChunk.js";

export class TokenPropertyRef extends ActionChunk {
    public label: string;

    public constructor(ctx: StructDecl, label: string) {
        super(ctx);
        this.label = label;
    }
}
