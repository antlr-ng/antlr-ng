/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ActionAST } from "../../tool/ast/ActionAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputModelObject } from "./OutputModelObject.js";

export abstract class OutputFile extends OutputModelObject {
    public readonly fileName: string;
    public readonly grammarFileName: string;
    public readonly TokenLabelType?: string;

    public constructor(factory: IOutputModelFactory, fileName: string) {
        super(factory);

        this.fileName = fileName;

        this.grammarFileName = factory.grammar.fileName.replace("\\", "/");
        this.TokenLabelType = factory.grammar.getOptionString("TokenLabelType");
    }

    public buildNamedActions(filter?: (ast: ActionAST) => boolean): Map<string, Action> {
        const namedActions = new Map<string, Action>();
        for (const name of this.factory!.grammar.namedActions.keys()) {
            const ast = this.factory!.grammar.namedActions.get(name)!;
            if (!filter || filter(ast)) {
                namedActions.set(name, new Action(this.factory!, ast));
            }
        }

        return namedActions;
    }
}
