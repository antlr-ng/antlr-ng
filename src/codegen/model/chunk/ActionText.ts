/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ActionChunk } from "./ActionChunk.js";
import { StructDecl } from "../decl/StructDecl.js";
import type { Lines } from "../../ITargetGenerator.js";

export class ActionText extends ActionChunk {
    public text?: Lines;

    public constructor(ctx?: StructDecl, text?: Lines) {
        super(ctx);
        this.text = text;
    }
}
