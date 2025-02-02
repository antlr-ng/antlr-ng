/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { SrcOp } from "./SrcOp.js";

export class CaptureNextTokenType extends SrcOp {
    public varName: string;

    public constructor(factory: IOutputModelFactory, varName: string) {
        super(factory);

        this.varName = varName;
    }
}
