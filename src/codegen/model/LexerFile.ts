/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { Lexer } from "./Lexer.js";
import { OutputFile } from "./OutputFile.js";

export class LexerFile extends OutputFile {
    public lexer: Lexer;

    public namedActions: Map<string, Action>;

    public constructor(factory: IOutputModelFactory, fileName: string) {
        super(factory, fileName);

        this.namedActions = this.buildNamedActions();
    }

}
