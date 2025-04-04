/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IGrammarAST } from "../../types.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";

export abstract class OutputModelObject {
    public factory?: IOutputModelFactory;
    public ast?: IGrammarAST;

    public constructor(factory?: IOutputModelFactory, ast?: IGrammarAST) {
        this.factory = factory;
        this.ast = ast;
    }

    public get parameterFields(): string[] {
        return [];
    }
}
