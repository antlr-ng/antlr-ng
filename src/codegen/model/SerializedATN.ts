/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ATN, ATNSerializer } from "antlr4ng";

import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { OutputModelObject } from "./OutputModelObject.js";

/**
 * Represents a serialized ATN that is just a list of signed integers; works for all targets except for java, which
 * requires a 16-bit char encoding. See {@link SerializedJavaATN}.
 */
export class SerializedATN extends OutputModelObject {
    public serialized: number[];

    public constructor(factory: IOutputModelFactory, atn?: ATN) {
        super(factory);

        if (atn) {
            this.serialized = ATNSerializer.getSerialized(atn);
        }
    }
}
