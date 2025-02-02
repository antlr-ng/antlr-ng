/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ContextGetterDecl } from "./ContextGetterDecl.js";
import { IOutputModelFactory } from "../../IOutputModelFactory.js";

/** {@code public Token X() { }} */
export class ContextTokenGetterDecl extends ContextGetterDecl {
    public optional: boolean;

    public constructor(factory: IOutputModelFactory, name: string, optional: boolean, signature?: boolean) {
        super(factory, name, signature);
        this.optional = optional;
    }

    public override getSignatureDecl(): ContextGetterDecl {
        return new ContextTokenGetterDecl(this.factory!, this.name, this.optional, true);
    }
}
