/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { OutputModelFactory } from "../OutputModelFactory.js";
import { OutputModelObject } from "./OutputModelObject.js";

export class DispatchMethod extends OutputModelObject {
    public constructor(factory: OutputModelFactory) {
        super(factory);
    }
}
