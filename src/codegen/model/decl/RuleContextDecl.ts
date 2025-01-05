/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Decl } from "./Decl.js";
import { OutputModelFactory } from "../../OutputModelFactory.js";

export class RuleContextDecl extends Decl {
    public ctxName: string;
    public isImplicit: boolean;

    public constructor(factory: OutputModelFactory, name: string, ctxName: string) {
        super(factory, name);
        this.ctxName = ctxName;
    }
}
