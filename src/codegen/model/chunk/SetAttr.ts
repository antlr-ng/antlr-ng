/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../../misc/ModelElement.js";
import { StructDecl } from "../decl/StructDecl.js";
import { ActionChunk } from "./ActionChunk.js";
import { SymbolRefChunk } from "./SymbolRefChunk.js";

export class SetAttr extends SymbolRefChunk {
    @ModelElement
    public rhsChunks: ActionChunk[];

    public constructor(ctx: StructDecl, name: string, escapedName: string, rhsChunks: ActionChunk[]) {
        super(ctx, name, escapedName);
        this.rhsChunks = rhsChunks;
    }
}
