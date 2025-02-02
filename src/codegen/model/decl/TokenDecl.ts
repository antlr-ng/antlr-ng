/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IOutputModelFactory } from "../../IOutputModelFactory.js";
import { Decl } from "./Decl.js";

/** x=ID or implicit _tID label */
export class TokenDecl extends Decl {
    public isImplicit: boolean;

    public constructor(factory: IOutputModelFactory, varName: string) {
        super(factory, varName);
    }
}
