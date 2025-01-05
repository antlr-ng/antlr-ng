/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { OutputModelFactory } from "../../OutputModelFactory.js";
import { TokenDecl } from "./TokenDecl.js";

export class TokenListDecl extends TokenDecl {
    public constructor(factory: OutputModelFactory, varName: string) {
        super(factory, varName);
    }
}
