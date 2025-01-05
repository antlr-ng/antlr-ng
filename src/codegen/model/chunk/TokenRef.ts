/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StructDecl } from "../decl/StructDecl.js";
import { SymbolRefChunk } from "./SymbolRefChunk.js";

export class TokenRef extends SymbolRefChunk {
    public constructor(ctx: StructDecl, name: string, escapedName: string) {
        super(ctx, name, escapedName);
    }
}
