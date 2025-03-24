/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ContextGetterDecl } from "./ContextGetterDecl.js";

/**
 * `public List<Token> X() { }`
 * `public Token X(int i) { }`
 */
export class ContextTokenListGetterDecl extends ContextGetterDecl {
    public override getSignatureDecl(): ContextGetterDecl {
        return new ContextTokenListGetterDecl(this.factory!, this.name, true);
    }
}
