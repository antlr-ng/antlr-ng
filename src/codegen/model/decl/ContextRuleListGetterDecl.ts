/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ContextGetterDecl } from "./ContextGetterDecl.js";
import { IOutputModelFactory } from "../../IOutputModelFactory.js";

/**
 * `public List<XContext> X() { }`
 * `public XContext X(int i) { }`
 */
export class ContextRuleListGetterDecl extends ContextGetterDecl {
    public ctxName: string;

    public constructor(factory: IOutputModelFactory, name: string, ctxName: string, signature?: boolean) {
        super(factory, name, signature);
        this.ctxName = ctxName;
    }

    public override getSignatureDecl(): ContextGetterDecl {
        return new ContextRuleListGetterDecl(this.factory!, this.name, this.ctxName, true);
    }
}
