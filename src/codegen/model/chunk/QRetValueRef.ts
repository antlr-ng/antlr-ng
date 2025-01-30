/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { StructDecl } from "../decl/StructDecl.js";
import { RetValueRef } from "./RetValueRef.js";

export class QRetValueRef extends RetValueRef {
    public readonly dict: string;

    public constructor(ctx: StructDecl, dict: string, name: string, escapedName: string) {
        super(ctx, name, escapedName);
        this.dict = dict;
    }
}
