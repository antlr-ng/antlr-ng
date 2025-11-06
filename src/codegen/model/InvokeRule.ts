/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";

import { ActionAST } from "../../tool/ast/ActionAST.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { ActionTranslator } from "../ActionTranslator.js";
import { ParserFactory } from "../ParserFactory.js";
import { ILabeledOp } from "./ILabeledOp.js";
import { RuleElement } from "./RuleElement.js";
import { ActionChunk } from "./chunk/ActionChunk.js";
import { Decl } from "./decl/Decl.js";
import { RuleContextDecl } from "./decl/RuleContextDecl.js";
import { RuleContextListDecl } from "./decl/RuleContextListDecl.js";

export class InvokeRule extends RuleElement implements ILabeledOp {
    public readonly name: string;
    public readonly escapedName: string;
    public readonly labels: Decl[] = []; // TODO: should need just 1
    public readonly ctxName: string;

    public argExprsChunks?: ActionChunk[];

    public constructor(factory: ParserFactory, ast: GrammarAST, labelAST: GrammarAST | null) {
        super(factory, ast);
        if (ast.atnState) {
            this.stateNumber = ast.atnState.stateNumber;
        }

        const gen = factory.getGenerator();
        const generator = gen.targetGenerator;

        const identifier = ast.getText();
        const r = factory.getGrammar()!.getRule(identifier)!;
        this.name = r.name;
        this.escapedName = gen.targetGenerator.escapeIfNeeded(this.name);
        this.ctxName = generator.getRuleFunctionContextStructName(r);;

        const rf = factory.getCurrentRuleFunction()!;
        if (labelAST !== null) {
            let decl: RuleContextDecl;
            // For x=r, define <rule-context-type> x and list_x.
            const label = labelAST.getText();
            if (labelAST.parent!.getType() === ANTLRv4Parser.PLUS_ASSIGN) {
                factory.defineImplicitLabel(ast, this);
                const listLabel = gen.targetGenerator.renderListLabelName(label);
                decl = new RuleContextListDecl(factory, listLabel, this.ctxName);
            } else {
                decl = new RuleContextDecl(factory, label, this.ctxName);
                this.labels.push(decl);
            }
            rf.addContextDecl(ast.getAltLabel()!, decl);
        }

        const arg = ast.getFirstChildWithType(ANTLRv4Parser.ARG_ACTION) as ActionAST | null;
        if (arg !== null) {
            this.argExprsChunks = ActionTranslator.translateAction(factory, rf, arg.token!, arg);
        }

        // If action refs rule as rule name not label, we need to define implicit label.
        if (factory.getCurrentOuterMostAlt().ruleRefsInActions.has(identifier)) {
            const label = gen.targetGenerator.renderImplicitRuleLabel(identifier);
            const d = new RuleContextDecl(factory, label, this.ctxName);
            this.labels.push(d);
            rf.addContextDecl(ast.getAltLabel()!, d);
        }
    }

}
