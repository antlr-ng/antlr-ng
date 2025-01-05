/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ThrowRecognitionException } from "./ThrowRecognitionException.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { IntervalSet } from "antlr4ng";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";

export class ThrowNoViableAlt extends ThrowRecognitionException {
    public constructor(factory: OutputModelFactory, blkOrEbnfRootAST: GrammarAST,
        expecting?: IntervalSet) {
        super(factory, blkOrEbnfRootAST, expecting);
    }
}
