/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Decl } from "./Decl.js";
import { IOutputModelFactory } from "../../IOutputModelFactory.js";

export class ElementListDecl extends Decl {
    public constructor(factory: IOutputModelFactory, name: string) {
        super(factory, name);
    }
}
