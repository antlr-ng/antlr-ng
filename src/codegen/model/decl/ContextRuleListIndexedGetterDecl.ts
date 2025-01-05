/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ContextGetterDecl } from "./ContextGetterDecl.js";
import { ContextRuleListGetterDecl } from "./ContextRuleListGetterDecl.js";

export class ContextRuleListIndexedGetterDecl extends ContextRuleListGetterDecl {
    public override getArgType(): string {
        return "int";
    }

    public override getSignatureDecl(): ContextGetterDecl {
        return new ContextRuleListIndexedGetterDecl(this.factory!, this.name, this.ctxName, true);
    }
}
