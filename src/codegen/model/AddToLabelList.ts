/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { SrcOp } from "./SrcOp.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Decl } from "./decl/Decl.js";

export class AddToLabelList extends SrcOp {
    public readonly label: Decl;
    public readonly listName: string;

    public constructor(factory: OutputModelFactory, listName: string, label: Decl) {
        super(factory);
        this.label = label;
        this.listName = listName;
    }
}
