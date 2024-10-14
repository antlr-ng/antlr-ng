/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { Tool } from "../../Tool.js";
import { Grammar } from "../../tool/Grammar.js";
import { ActionAST } from "../../tool/ast/ActionAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputModelObject } from "./OutputModelObject.js";

export abstract class OutputFile extends OutputModelObject {
    public readonly fileName: string;
    public readonly grammarFileName: string;
    public readonly antlrVersion: string;
    public readonly tokenLabelType?: string;
    public readonly inputSymbolType?: string;

    public constructor(factory: OutputModelFactory, fileName: string) {
        super(factory);
        this.fileName = fileName;
        const g = factory.getGrammar()!;
        this.grammarFileName = g.fileName.replace("\\", "/");
        this.antlrVersion = Tool.VERSION;
        this.tokenLabelType = g.getOptionString("TokenLabelType");
        this.inputSymbolType = this.tokenLabelType;
    }

    public buildNamedActions(g: Grammar, filter?: (ast: ActionAST) => boolean): Map<string, Action> {
        const namedActions = new Map<string, Action>();
        for (const name of g.namedActions.keys()) {
            const ast = g.namedActions.get(name)!;
            if (filter?.(ast)) {
                namedActions.set(name, new Action(this.factory!, ast));
            }
        }

        return namedActions;
    }
}
