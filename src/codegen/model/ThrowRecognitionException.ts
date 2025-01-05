/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { SrcOp } from "./SrcOp.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { IntervalSet } from "antlr4ng";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";

export class ThrowRecognitionException extends SrcOp {
    public decision: number;
    public grammarFile: string;
    public grammarLine: number;
    public grammarCharPosInLine: number;

    public constructor(factory: OutputModelFactory, ast: GrammarAST, expecting?: IntervalSet) {
        super(factory, ast);
        this.grammarLine = ast.getLine();
        this.grammarLine = ast.getCharPositionInLine();
        this.grammarFile = factory.getGrammar()!.fileName;
    }
}
