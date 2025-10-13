/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IGenerationOptions } from "../../config/config.js";
import { ModelElement } from "../../misc/ModelElement.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { Lexer } from "./Lexer.js";
import { OutputFile } from "./OutputFile.js";

export class LexerFile extends OutputFile {
    public genPackage?: string;
    public genListener: boolean;
    public genVisitor: boolean;

    @ModelElement
    public lexer: Lexer;

    @ModelElement
    public namedActions: Map<string, Action>;

    public constructor(factory: IOutputModelFactory, fileName: string, options: IGenerationOptions) {
        super(factory, fileName);

        this.namedActions = this.buildNamedActions(factory.g);
        this.genPackage = options.package;
        this.genListener = options.generateListener;
        this.genVisitor = options.generateVisitor;
    }

    public override get parameterFields(): string[] {
        return ["lexer", "namedActions"];
    }
}
