/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Decl } from "./Decl.js";
import { OutputModelFactory } from "../../OutputModelFactory.js";

export class TokenTypeDecl extends Decl {
    public constructor(factory: OutputModelFactory, name: string) {
        super(factory, name);
    }
}
