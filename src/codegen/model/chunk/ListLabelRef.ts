/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StructDecl } from "../decl/StructDecl.js";
import { LabelRef } from "./LabelRef.js";

export class ListLabelRef extends LabelRef {
    public constructor(ctx: StructDecl, name: string, escapedName: string) {
        super(ctx, name, escapedName);
    }
}
