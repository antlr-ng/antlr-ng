/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IST } from "stringtemplate4ts";

import { StructDecl } from "../decl/StructDecl.js";
import { ActionChunk } from "./ActionChunk.js";

export class ActionTemplate extends ActionChunk {
    public st: IST;

    public constructor(ctx: StructDecl, st: IST) {
        super(ctx);
        this.st = st;
    }
}
