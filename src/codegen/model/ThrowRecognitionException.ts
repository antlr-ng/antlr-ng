/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { SrcOp } from "./SrcOp.js";

export class ThrowRecognitionException extends SrcOp {
    public decision: number;
    public grammarFile: string;
    public grammarLine: number;
    public grammarCharPosInLine: number;

    public constructor(factory: IOutputModelFactory, ast: GrammarAST) {
        super(factory, ast);

        this.grammarLine = ast.getLine();
        this.grammarLine = ast.getCharPositionInLine();
        this.grammarFile = factory.grammar.fileName;
    }
}
