/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { SrcOp } from "./SrcOp.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";

export class RuleElement extends SrcOp {

    /** Associated ATN state for this rule elements (action, token, rule ref, ...) */
    public stateNumber: number;

    public constructor(factory: OutputModelFactory, ast?: GrammarAST) {
        super(factory, ast);
        if (ast?.atnState) {
            this.stateNumber = ast.atnState.stateNumber;
        }

    }

}
