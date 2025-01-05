/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { OutputModelController } from "./OutputModelController.js";
import { CodeGenerator } from "./CodeGenerator.js";
import { BlankOutputModelFactory } from "./BlankOutputModelFactory.js";
import { Action } from "./model/Action.js";
import { CodeBlockForOuterMostAlt } from "./model/CodeBlockForOuterMostAlt.js";
import { OutputModelObject } from "./model/OutputModelObject.js";
import { RuleFunction } from "./model/RuleFunction.js";
import { SrcOp } from "./model/SrcOp.js";
import { CodeBlock } from "./model/decl/CodeBlock.js";
import { Alternative } from "../tool/Alternative.js";
import { Grammar } from "../tool/Grammar.js";
import { Rule } from "../tool/Rule.js";

/**
 * Create output objects for elements *within* rule functions except
 *  buildOutputModel() which builds outer/root model object and any
 *  objects such as RuleFunction that surround elements in rule
 *  functions.
 */
export abstract class DefaultOutputModelFactory extends BlankOutputModelFactory {
    // Interface to outside world

    public readonly g?: Grammar;

    public readonly gen: CodeGenerator;

    public controller: OutputModelController;

    protected constructor(gen: CodeGenerator) {
        super();

        this.gen = gen;
        this.g = gen.g;
    }

    // MISC

    public override setController(controller: OutputModelController): void {
        this.controller = controller;
    }

    public override getController(): OutputModelController {
        return this.controller;
    }

    public override rulePostamble(ruleFunction: RuleFunction, r: Rule): SrcOp[] | undefined {
        if (r.namedActions.has("after") || r.namedActions.has("finally")) {
            // See OutputModelController.buildLeftRecursiveRuleFunction
            // and Parser.exitRule for other places which set stop.
            const gen = this.getGenerator();
            const codegenTemplates = gen.getTemplates();
            const setStopTokenAST = codegenTemplates.getInstanceOf("recRuleSetStopToken")!;
            const setStopTokenAction = new Action(this, ruleFunction.ruleCtx, setStopTokenAST);
            const ops = new Array<SrcOp>(1);
            ops.push(setStopTokenAction);

            return ops;
        }

        return super.rulePostamble(ruleFunction, r);
    }

    // Convenience methods

    public override getGrammar(): Grammar | undefined {
        return this.g;
    }

    public override getGenerator(): CodeGenerator {
        return this.gen;
    }

    public override getRoot(): OutputModelObject | undefined {
        return this.controller.getRoot();
    }

    public override getCurrentRuleFunction(): RuleFunction | undefined {
        return this.controller.getCurrentRuleFunction();
    }

    public override getCurrentOuterMostAlt(): Alternative {
        return this.controller.getCurrentOuterMostAlt();
    }

    public override getCurrentBlock(): CodeBlock {
        return this.controller.getCurrentBlock();
    }

    public override getCurrentOuterMostAlternativeBlock(): CodeBlockForOuterMostAlt {
        return this.controller.getCurrentOuterMostAlternativeBlock();
    }

    public override getCodeBlockLevel(): number {
        return this.controller.codeBlockLevel;
    }

    public override getTreeLevel(): number {
        return this.controller.treeLevel;
    }
}
