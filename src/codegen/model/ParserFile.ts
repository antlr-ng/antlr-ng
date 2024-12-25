/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import type { IToolParameters } from "../../tool-parameters.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Action } from "./Action.js";
import { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionText } from "./chunk/ActionText.js";
import { OutputFile } from "./OutputFile.js";
import { Parser } from "./Parser.js";

export class ParserFile extends OutputFile {
    public genPackage?: string; // from -package cmd-line
    public exportMacro?: string; // from -DexportMacro cmd-line
    public genListener: boolean; // from -listener cmd-line
    public genVisitor: boolean; // from -visitor cmd-line

    public grammarName: string;

    @ModelElement
    public parser: Parser;

    @ModelElement
    public namedActions: Map<string, Action>;

    @ModelElement
    public contextSuperClass: ActionChunk;

    public constructor(factory: OutputModelFactory, fileName: string, toolParameters: IToolParameters) {
        super(factory, fileName);
        const g = factory.getGrammar()!;
        this.namedActions = this.buildNamedActions(factory.getGrammar()!);
        this.genPackage = toolParameters.package;
        this.exportMacro = factory.getGrammar()!.getOptionString("exportMacro");

        // need the below members in the ST for Python, C++
        this.genListener = toolParameters.generateListener ?? true;
        this.genVisitor = toolParameters.generateVisitor ?? false;
        this.grammarName = g.name;

        if (g.getOptionString("contextSuperClass")) {
            this.contextSuperClass = new ActionText(undefined, g.getOptionString("contextSuperClass"));
        }
    }
}
