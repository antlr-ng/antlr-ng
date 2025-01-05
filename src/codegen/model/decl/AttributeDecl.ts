/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IAttribute } from "../../../tool/IAttribute.js";
import { OutputModelFactory } from "../../OutputModelFactory.js";
import { Decl } from "./Decl.js";

export class AttributeDecl extends Decl {
    public type: string;

    public initValue?: string;

    public constructor(factory: OutputModelFactory, a: IAttribute) {
        super(factory, a.name, a.decl);
        this.type = a.type!;
        this.initValue = a.initValue;
    }
}
