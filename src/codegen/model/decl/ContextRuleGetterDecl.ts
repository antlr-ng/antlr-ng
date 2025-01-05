/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ContextGetterDecl } from "./ContextGetterDecl.js";
import { OutputModelFactory } from "../../OutputModelFactory.js";

/** {@code public XContext X() { }} */
export class ContextRuleGetterDecl extends ContextGetterDecl {
    public ctxName: string;
    public optional: boolean;

    public constructor(factory: OutputModelFactory, name: string, ctxName: string, optional: boolean,
        signature?: boolean) {
        super(factory, name, signature);
        this.ctxName = ctxName;
        this.optional = optional;
    }

    public override getSignatureDecl(): ContextGetterDecl {
        return new ContextRuleGetterDecl(this.factory!, this.name, this.ctxName, this.optional, true);
    }
}
