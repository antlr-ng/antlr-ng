/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { Action } from "./Action.js";
import type { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionText } from "./chunk/ActionText.js";
import { OutputFile } from "./OutputFile.js";
import type { Parser } from "./Parser.js";

export class ParserFile extends OutputFile {
    public grammarName: string;

    @ModelElement
    public parser: Parser;

    @ModelElement
    public namedActions: Map<string, Action>;

    @ModelElement
    public contextSuperClass?: ActionChunk;

    public constructor(factory: IOutputModelFactory, fileName: string) {
        super(factory, fileName);
        const g = factory.g;
        this.namedActions = this.buildNamedActions(g);

        this.grammarName = g.name;

        if (g.getOptionString("contextSuperClass")) {
            this.contextSuperClass = new ActionText(undefined, [g.getOptionString("contextSuperClass")]);
        }
    }

    public override get parameterFields(): string[] {
        return [...super.parameterFields, "parser", "namedActions", "contextSuperClass"];
    }
}
