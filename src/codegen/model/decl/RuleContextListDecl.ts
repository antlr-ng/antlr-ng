/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { OutputModelFactory } from "../../OutputModelFactory.js";
import { RuleContextDecl } from "./RuleContextDecl.js";

export class RuleContextListDecl extends RuleContextDecl {
    public constructor(factory: OutputModelFactory, name: string, ctxName: string) {
        super(factory, name, ctxName);
        this.isImplicit = false;
    }
}
