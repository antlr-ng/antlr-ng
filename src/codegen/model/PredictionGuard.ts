/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IntervalSet } from "antlr4ng";

import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import { OutputModelObject } from "./OutputModelObject.js";
import { TestSetInline } from "./TestSetInline.js";
import { TokenTypeDecl } from "./decl/TokenTypeDecl.js";

/** The lookahead variable shared by all prediction guards of a rule. */
export const predictionGuardLookahead = "_la";

/** The lookahead test of a prediction guard, rendered from the consuming alternative's FIRST set. */
export class PredictionGuardTest extends TestSetInline {
    public constructor(factory: IOutputModelFactory, ast: GrammarAST | undefined, set: IntervalSet, wordSize: number) {
        super(factory, ast, set, wordSize, predictionGuardLookahead);
    }
}

/**
 * A one-sided rejection guard for a complex single-alternative EBNF decision. The guard allows the
 * decision to skip adaptive prediction when the lookahead token cannot start the consuming alternative.
 */
export class PredictionGuard extends OutputModelObject {
    /** The alternative to use when the lookahead token is outside the FIRST set. */
    public readonly exitAlt: number;

    /** The FIRST set of the consuming alternative. */
    public readonly test: PredictionGuardTest;

    public constructor(factory: IOutputModelFactory, ast: GrammarAST | undefined, firstSet: IntervalSet,
        exitAlt: number) {
        super(factory, ast);

        this.exitAlt = exitAlt;
        this.test = new PredictionGuardTest(factory, ast, firstSet,
            factory.getGenerator()!.targetGenerator.inlineTestSetWordSize);

        // The guard needs its own lookahead variable, regardless of whether the rule has another lookahead block.
        factory.getCurrentRuleFunction()?.addLocalDecl(new TokenTypeDecl(factory, predictionGuardLookahead));
    }
}
