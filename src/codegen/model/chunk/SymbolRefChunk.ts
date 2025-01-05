/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ActionChunk } from "./ActionChunk.js";
import { StructDecl } from "../decl/StructDecl.js";

export abstract class SymbolRefChunk extends ActionChunk {
    public readonly name: string;

    public readonly escapedName: string;

    public constructor(ctx: StructDecl, name: string, escapedName: string) {
        super(ctx);
        this.name = name;
        this.escapedName = escapedName;
    }
}
