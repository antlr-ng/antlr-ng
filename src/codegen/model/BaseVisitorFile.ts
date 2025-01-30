/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { OutputModelFactory } from "../OutputModelFactory.js";
import { VisitorFile } from "./VisitorFile.js";

export class BaseVisitorFile extends VisitorFile {
    public constructor(factory: OutputModelFactory, fileName: string) {
        super(factory, fileName);
    }
}
