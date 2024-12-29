/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { TerminalAST } from "../../tool/ast/TerminalAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { LabeledOp } from "./LabeledOp.js";
import { RuleElement } from "./RuleElement.js";
import { Decl } from "./decl/Decl.js";

export class MatchToken extends RuleElement implements LabeledOp {
    public readonly name?: string;
    public readonly escapedName?: string;
    public readonly ttype: number = 0;
    public readonly labels = new Array<Decl>();

    public constructor(factory: OutputModelFactory, ast: TerminalAST | GrammarAST) {
        super(factory, ast);
        if (ast instanceof TerminalAST) {
            const g = factory.getGrammar()!;
            const gen = factory.getGenerator()!;
            this.ttype = g.getTokenType(ast.getText());
            const target = gen.getTarget();
            this.name = target.getTokenTypeAsTargetLabel(g, this.ttype);
            this.escapedName = target.escapeIfNeeded(this.name);
        }
    }
}
