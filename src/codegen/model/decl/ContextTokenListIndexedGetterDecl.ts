/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ContextGetterDecl } from "./ContextGetterDecl.js";
import { ContextTokenListGetterDecl } from "./ContextTokenListGetterDecl.js";

export class ContextTokenListIndexedGetterDecl extends ContextTokenListGetterDecl {
    public override getArgType(): string {
        return "int";
    }

    public override getSignatureDecl(): ContextGetterDecl {
        return new ContextTokenListIndexedGetterDecl(this.factory!, this.name, true);
    }
}
