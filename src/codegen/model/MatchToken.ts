/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { TerminalAST } from "../../tool/ast/TerminalAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { ILabeledOp } from "./ILabeledOp.js";
import { RuleElement } from "./RuleElement.js";
import { Decl } from "./decl/Decl.js";

export class MatchToken extends RuleElement implements ILabeledOp {
    public readonly name?: string;
    public readonly escapedName?: string;
    public readonly ttype: number = 0;
    public readonly labels = new Array<Decl>();

    public constructor(factory: IOutputModelFactory, ast: TerminalAST | GrammarAST) {
        super(factory, ast);
        if (ast instanceof TerminalAST) {
            const g = factory.grammar;
            const gen = factory.getGenerator()!;
            this.ttype = g.getTokenType(ast.getText());

            const target = gen.target;
            this.name = target.getTokenTypeAsTargetLabel(g, this.ttype);
            this.escapedName = target.escapeIfNeeded(this.name);
        }
    }
}
