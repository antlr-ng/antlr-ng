/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IGenerationOptions } from "../../config/config.js";
import { ModelElement } from "../../misc/ModelElement.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionText } from "./chunk/ActionText.js";
import { OutputFile } from "./OutputFile.js";
import { Parser } from "./Parser.js";

export class ParserFile extends OutputFile {
    public genPackage?: string;
    public genListener: boolean;
    public genVisitor: boolean;

    public grammarName: string;

    @ModelElement
    public parser: Parser;

    @ModelElement
    public namedActions: Map<string, Action>;

    @ModelElement
    public contextSuperClass?: ActionChunk;

    public constructor(factory: IOutputModelFactory, fileName: string, options: IGenerationOptions) {
        super(factory, fileName);
        const g = factory.g;
        this.namedActions = this.buildNamedActions(g);
        this.genPackage = options.package;

        // Need the below members in the ST for Python, C++.
        this.genListener = options.generateListener;
        this.genVisitor = options.generateVisitor;
        this.grammarName = g.name;

        if (g.getOptionString("contextSuperClass")) {
            this.contextSuperClass = new ActionText(undefined, [g.getOptionString("contextSuperClass")]);
        }
    }

    public override get parameterFields(): string[] {
        return [...super.parameterFields, "parser", "namedActions", "contextSuperClass"];
    }
}
