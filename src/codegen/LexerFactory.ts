/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { DefaultOutputModelFactory } from "./DefaultOutputModelFactory.js";
import { CodeGenerator } from "./CodeGenerator.js";

export class LexerFactory extends DefaultOutputModelFactory {
    public constructor(gen: CodeGenerator) {
        super(gen);
    }
}
