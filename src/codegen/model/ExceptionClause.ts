/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ActionAST } from "../../tool/ast/ActionAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { SrcOp } from "./SrcOp.js";

export class ExceptionClause extends SrcOp {
    public catchArg: Action;

    public catchAction: Action;

    public constructor(factory: IOutputModelFactory,
        catchArg: ActionAST,
        catchAction: ActionAST) {
        super(factory, catchArg);

        this.catchArg = new Action(factory, catchArg);
        this.catchAction = new Action(factory, catchAction);
    }
}
