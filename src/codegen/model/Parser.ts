/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { ParserFile } from "./ParserFile.js";
import { Recognizer } from "./Recognizer.js";
import type { RuleFunction } from "./RuleFunction.js";

export class Parser extends Recognizer {
    public file: ParserFile;

    public funcs = new Array<RuleFunction>();

    public constructor(factory: IOutputModelFactory, file: ParserFile) {
        super(factory);
        this.file = file; // who contains us?
    }

}
