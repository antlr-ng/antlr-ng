/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { OutputModelObject } from "../OutputModelObject.js";
import type { StructDecl } from "../decl/StructDecl.js";

export class ActionChunk extends OutputModelObject {

    /** Where is the ctx that defines attrs,labels etc... for this action? */
    public ctx?: StructDecl;

    public constructor(ctx?: StructDecl) {
        super();

        this.ctx = ctx;
    }
}
