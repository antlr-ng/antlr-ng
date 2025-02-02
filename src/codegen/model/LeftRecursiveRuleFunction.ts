/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";

import { LeftRecursiveRule } from "../../tool/LeftRecursiveRule.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { RuleFunction } from "./RuleFunction.js";
import { RuleContextDecl } from "./decl/RuleContextDecl.js";
import { RuleContextListDecl } from "./decl/RuleContextListDecl.js";

export class LeftRecursiveRuleFunction extends RuleFunction {
    public constructor(factory: IOutputModelFactory, r: LeftRecursiveRule) {
        super(factory, r);

        const gen = factory.getGenerator()!;

        // Since we delete x=lr, we have to manually add decls for all labels on left-recur refs to proper structs.
        for (const [idAST, altLabel] of r.leftRecursiveRuleRefLabels) {
            const label = idAST.getText();
            const ruleRefAST = idAST.parent!.getChild(1) as GrammarAST;
            if (ruleRefAST.getType() === ANTLRv4Parser.RULE_REF) {
                const targetRule = factory.grammar!.getRule(ruleRefAST.getText())!;
                const ctxName = gen.target.getRuleFunctionContextStructName(targetRule);

                let d: RuleContextDecl;
                if (idAST.parent!.getType() === ANTLRv4Parser.ASSIGN) {
                    d = new RuleContextDecl(factory, label, ctxName);
                } else {
                    d = new RuleContextListDecl(factory, label, ctxName);
                }

                let struct = this.ruleCtx;
                if (this.altLabelCtxs) {
                    const s = this.altLabelCtxs.get(altLabel!);
                    if (s) {
                        struct = s;
                    }

                    // If alt label, use sub ctx.
                }

                // Stick in overall rule's ctx.
                struct.addDecl(d);
            }
        }
    }
}
