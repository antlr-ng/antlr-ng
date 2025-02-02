/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Grammar } from "../../tool/Grammar.js";
import { ActionAST } from "../../tool/ast/ActionAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputModelObject } from "./OutputModelObject.js";

export abstract class OutputFile extends OutputModelObject {
    public readonly fileName: string;
    public readonly grammarFileName: string;
    public readonly TokenLabelType?: string;
    public readonly inputSymbolType?: string;

    /**
     * This is the version the runtimes test against for their compatibility. We use the version of the old ANTLR4
     * tool here, until we start implementing the new target infrastructure.
     */
    public readonly ANTLRVersion = "4.13.2";

    public constructor(factory: IOutputModelFactory, fileName: string) {
        super(factory);

        this.fileName = fileName;

        const g = factory.grammar;
        this.grammarFileName = g.fileName.replace("\\", "/");
        this.TokenLabelType = g.getOptionString("TokenLabelType");
        this.inputSymbolType = this.TokenLabelType;
    }

    public buildNamedActions(g: Grammar, filter?: (ast: ActionAST) => boolean): Map<string, Action> {
        const namedActions = new Map<string, Action>();
        for (const name of g.namedActions.keys()) {
            const ast = g.namedActions.get(name)!;
            if (!filter || filter(ast)) {
                namedActions.set(name, new Action(this.factory!, ast));
            }
        }

        return namedActions;
    }
}
