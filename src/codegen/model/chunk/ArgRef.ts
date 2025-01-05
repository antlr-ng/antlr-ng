/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { LocalRef } from "./LocalRef.js";
import { StructDecl } from "../decl/StructDecl.js";

export class ArgRef extends LocalRef {
    public constructor(ctx: StructDecl, name: string, escapedName: string) {
        super(ctx, name, escapedName);
    }
}
