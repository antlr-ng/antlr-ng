/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";

import { LeftRecursiveRule } from "../../tool/LeftRecursiveRule.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { RuleFunction } from "./RuleFunction.js";
import { RuleContextDecl } from "./decl/RuleContextDecl.js";
import { RuleContextListDecl } from "./decl/RuleContextListDecl.js";

export class LeftRecursiveRuleFunction extends RuleFunction {
    public constructor(factory: OutputModelFactory, r: LeftRecursiveRule) {
        super(factory, r);

        const gen = factory.getGenerator()!;
        // Since we delete x=lr, we have to manually add decls for all labels
        // on left-recur refs to proper structs
        for (const [idAST, altLabel] of r.leftRecursiveRuleRefLabels) {
            const label = idAST.getText();
            const ruleRefAST = idAST.getParent()!.getChild(1) as GrammarAST;
            if (ruleRefAST.getType() === ANTLRv4Parser.RULE_REF) {
                const targetRule = factory.getGrammar()!.getRule(ruleRefAST.getText())!;
                const ctxName = gen.getTarget().getRuleFunctionContextStructName(targetRule);
                let d: RuleContextDecl;
                if (idAST.getParent()!.getType() === ANTLRv4Parser.ASSIGN) {
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
                    // if alt label, use sub ctx
                }
                struct.addDecl(d); // stick in overall rule's ctx
            }
        }
    }
}
