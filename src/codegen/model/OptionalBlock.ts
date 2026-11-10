/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { IQuantifierAST } from "../../tool/ast/IQuantifierAST.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import { AltBlock } from "./AltBlock.js";
import type { CodeBlockForAlt } from "./CodeBlockForAlt.js";

export class OptionalBlock extends AltBlock {
    public constructor(factory: IOutputModelFactory, blkOrEbnfRootAST: GrammarAST, alts: CodeBlockForAlt[]) {
        super(factory, blkOrEbnfRootAST, alts);

        // The consuming alternative is the only real alternative. The exit alternative is the implicit one.
        const nonGreedy = !(blkOrEbnfRootAST as IQuantifierAST).isGreedy();
        const lookIndex = nonGreedy ? 1 : 0;
        const exitAlt = nonGreedy ? 1 : alts.length + 1;
        this.predictionGuard = this.createPredictionGuard(lookIndex, exitAlt);
    }
}
