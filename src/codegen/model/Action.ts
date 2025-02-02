/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonToken } from "antlr4ng";
import type { IST } from "stringtemplate4ts";

import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";

import { ModelElement } from "../../misc/ModelElement.js";
import { ActionAST } from "../../tool/ast/ActionAST.js";
import { ActionTranslator } from "../ActionTranslator.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionTemplate } from "./chunk/ActionTemplate.js";
import { ActionText } from "./chunk/ActionText.js";
import { StructDecl } from "./decl/StructDecl.js";
import { RuleElement } from "./RuleElement.js";

export class Action extends RuleElement {

    @ModelElement
    public chunks: ActionChunk[] = [];

    public constructor(factory: IOutputModelFactory, ast?: ActionAST);
    public constructor(factory: IOutputModelFactory, ctx: StructDecl, action: string | IST);
    public constructor(...args: unknown[]) {
        if (args.length === 1) {
            super(args[0] as IOutputModelFactory);
        } else if (args.length === 2) {
            const [factory, ast] = args as [IOutputModelFactory, ActionAST | undefined];

            super(factory, ast);
            const rf = factory.getCurrentRuleFunction() ?? null;
            if (ast) {
                this.chunks = ActionTranslator.translateAction(factory, rf, ast.token!, ast);
            }
        } else {
            const [factory, ctx, action] = args as [IOutputModelFactory, StructDecl, string | IST];

            super(factory);

            if (typeof action === "string") {
                const ast = new ActionAST(CommonToken.fromType(ANTLRv4Parser.AT, action));
                const rf = factory.getCurrentRuleFunction();
                if (rf) { // we can translate
                    ast.resolver = rf.rule;
                    this.chunks = ActionTranslator.translateActionChunk(factory, rf, action, ast);
                } else {
                    this.chunks.push(new ActionText(ctx, action));
                }
            } else {
                this.chunks.push(new ActionTemplate(ctx, action));
            }
        }

        return this;
    }

}
