/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Decl } from "./Decl.js";
import { OutputModelFactory } from "../../OutputModelFactory.js";

/** x=ID or implicit _tID label */
export class TokenDecl extends Decl {
    public isImplicit: boolean;

    public constructor(factory: OutputModelFactory, varName: string) {
        super(factory, varName);
    }
}
