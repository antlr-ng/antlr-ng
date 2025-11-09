/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { TerminalAST } from "../../tool/ast/TerminalAST.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { ILabeledOp } from "./ILabeledOp.js";
import { RuleElement } from "./RuleElement.js";
import type { Decl } from "./decl/Decl.js";

export class MatchToken extends RuleElement implements ILabeledOp {
    public readonly name?: string;
    public readonly escapedName?: string;
    public readonly ttype: number = 0;
    public readonly labels = new Array<Decl>();

    public constructor(factory: IOutputModelFactory, ast: TerminalAST | GrammarAST) {
        super(factory, ast);
        if (ast instanceof TerminalAST) {
            const gen = factory.getGenerator()!;
            this.ttype = factory.grammar.getTokenType(ast.getText());

            const target = gen.targetGenerator;
            this.name = target.getTokenTypeAsTargetLabel(factory.grammar, this.ttype);
            this.escapedName = target.escapeIfNeeded(this.name);
        }
    }
}
