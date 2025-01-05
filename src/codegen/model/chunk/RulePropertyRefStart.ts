/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { RulePropertyRef } from "./RulePropertyRef.js";
import { StructDecl } from "../decl/StructDecl.js";

export class RulePropertyRefStart extends RulePropertyRef {
    public constructor(ctx: StructDecl, label: string) {
        super(ctx, label);
    }
}
