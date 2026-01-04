/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { Action } from "./Action.js";
import type { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionText } from "./chunk/ActionText.js";
import { OutputFile } from "./OutputFile.js";
import type { Parser } from "./Parser.js";

export class ParserFile extends OutputFile {
    public accessLevel?: string;
    public grammarName: string;

    public parser: Parser;

    public namedActions: Map<string, Action>;

    public contextSuperClass?: ActionChunk;

    public constructor(factory: IOutputModelFactory, fileName: string) {
        super(factory, fileName);
        this.namedActions = this.buildNamedActions();

        this.grammarName = factory.grammar.name;
        this.accessLevel = factory.grammar.getOptionString("accessLevel");

        if (factory.grammar.getOptionString("contextSuperClass")) {
            this.contextSuperClass = new ActionText(undefined, [factory.grammar.getOptionString("contextSuperClass")]);
        }
    }

}
