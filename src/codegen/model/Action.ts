/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonToken } from "antlr4ng";

import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";

import { ActionAST } from "../../tool/ast/ActionAST.js";
import { ActionTranslator } from "../ActionTranslator.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { Lines } from "../ITargetGenerator.js";
import { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionText } from "./chunk/ActionText.js";
import { StructDecl } from "./decl/StructDecl.js";
import { RuleElement } from "./RuleElement.js";

export class Action extends RuleElement {
    public chunks: ActionChunk[] = [];

    public constructor(factory: IOutputModelFactory, ast?: ActionAST);
    public constructor(factory: IOutputModelFactory, ctx: StructDecl | undefined, action: Lines);
    public constructor(...args: unknown[]) {
        if (args.length === 1) {
            super(args[0] as IOutputModelFactory);
        } else if (args.length === 2) {
            const [factory, ast] = args as [IOutputModelFactory, ActionAST | undefined];

            super(factory, ast);
            const rf = factory.getCurrentRuleFunction();
            if (ast) {
                this.chunks = ActionTranslator.translateAction(factory, rf, ast.token!, ast);
            }
        } else {
            const [factory, ctx, action] = args as [IOutputModelFactory, StructDecl | undefined, Lines];

            super(factory);

            const ast = new ActionAST(CommonToken.fromType(ANTLRv4Parser.AT));
            const rf = factory.getCurrentRuleFunction();
            if (rf) { // We can translate.
                ast.resolver = rf.rule;
                action.forEach((line) => {
                    if (line !== undefined) {
                        this.chunks.push(...ActionTranslator.translateActionChunk(factory, rf, line, ast));
                    }
                });
            } else {
                this.chunks.push(new ActionText(ctx, action));
            }
        }

        return this;
    }
}
