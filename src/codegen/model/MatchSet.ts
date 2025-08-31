/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { SetTransition } from "antlr4ng";

import { ModelElement } from "../../misc/ModelElement.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { CaptureNextTokenType } from "./CaptureNextTokenType.js";
import { TokenTypeDecl } from "./decl/TokenTypeDecl.js";
import { MatchToken } from "./MatchToken.js";
import { TestSetInline } from "./TestSetInline.js";

export class MatchSet extends MatchToken {
    @ModelElement
    public expr: TestSetInline;

    @ModelElement
    public capture: CaptureNextTokenType;

    public constructor(factory: IOutputModelFactory, ast: GrammarAST) {
        super(factory, ast);

        const st = ast.atnState!.transitions[0] as SetTransition;
        const wordSize = factory.getGenerator()!.targetGenerator.inlineTestSetWordSize;

        this.expr = new TestSetInline(factory, undefined, st.set, wordSize);

        const d = new TokenTypeDecl(factory, this.expr.varName);
        factory.getCurrentRuleFunction()?.addLocalDecl(d);
        this.capture = new CaptureNextTokenType(factory, this.expr.varName);
    }

    public override get parameterFields(): string[] {
        return [...super.parameterFields, "expr", "capture"];
    }
}
