/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { SrcOp } from "./SrcOp.js";
import { OutputModelFactory } from "../OutputModelFactory.js";

export class CaptureNextTokenType extends SrcOp {
    public varName: string;
    public constructor(factory: OutputModelFactory, varName: string) {
        super(factory);
        this.varName = varName;
    }
}
