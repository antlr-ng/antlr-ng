/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { TokenPropertyRef } from "./TokenPropertyRef.js";
import { StructDecl } from "../decl/StructDecl.js";

export class TokenPropertyRefText extends TokenPropertyRef {
    public constructor(ctx: StructDecl, label: string) {
        super(ctx, label);
    }
}
