/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import type { IToolParameters } from "../../tool-parameters.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { Lexer } from "./Lexer.js";
import { OutputFile } from "./OutputFile.js";

export class LexerFile extends OutputFile {
    public genPackage?: string; // from -package cmd-line
    public exportMacro?: string; // from -DexportMacro cmd-line
    public genListener: boolean; // from -listener cmd-line
    public genVisitor: boolean; // from -visitor cmd-line

    @ModelElement
    public lexer: Lexer;

    @ModelElement
    public namedActions: Map<string, Action>;

    public constructor(factory: IOutputModelFactory, fileName: string, toolParameters: IToolParameters) {
        super(factory, fileName);

        this.namedActions = this.buildNamedActions(factory.grammar!);
        this.genPackage = toolParameters.package;
        this.exportMacro = factory.grammar!.getOptionString("exportMacro");
        this.genListener = toolParameters.generateListener ?? true;
        this.genVisitor = toolParameters.generateVisitor ?? false;
    }
}
