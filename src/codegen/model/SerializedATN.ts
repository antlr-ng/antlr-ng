/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ATN, ATNSerializer } from "antlr4ng";

import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { OutputModelObject } from "./OutputModelObject.js";

/**
 * Represents a serialized ATN that is just a list of signed integers. Targets which need a different
 * representation (e.g. Java, which uses 16-bit char encoded string literals) convert the list while rendering.
 */
export class SerializedATN extends OutputModelObject {
    public readonly serialized: number[];

    public constructor(factory: IOutputModelFactory, atn?: ATN) {
        super(factory);

        if (atn) {
            this.serialized = ATNSerializer.getSerialized(atn);
        }
    }
}
