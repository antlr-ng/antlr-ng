/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { ParserFile } from "./ParserFile.js";
import { Recognizer } from "./Recognizer.js";
import { RuleFunction } from "./RuleFunction.js";

export class Parser extends Recognizer {
    public file: ParserFile;

    @ModelElement
    public funcs = new Array<RuleFunction>();

    public constructor(factory: OutputModelFactory, file: ParserFile) {
        super(factory);
        this.file = file; // who contains us?
    }
}
