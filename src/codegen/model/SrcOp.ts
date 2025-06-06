/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns */

import { type GrammarAST } from "../../tool/ast/GrammarAST.js";
import { type IOutputModelFactory } from "../IOutputModelFactory.js";
import type { CodeBlockForOuterMostAlt } from "./CodeBlockForOuterMostAlt.js";
import { type CodeBlock } from "./decl/CodeBlock.js";
import { OutputModelObject } from "./OutputModelObject.js";
import { type RuleFunction } from "./RuleFunction.js";

export abstract class SrcOp extends OutputModelObject {

    /**
     * All operations know in which block they live:
     *
     *  	CodeBlock, CodeBlockForAlt
     *
     *  Templates might need to know block nesting level or find a specific declaration, etc...
     */
    private enclosingBlock?: CodeBlock;

    private enclosingRuleFunction?: RuleFunction;

    public constructor(factory: IOutputModelFactory, ast?: GrammarAST) {
        super(factory, ast);

        this.enclosingBlock = factory.getCurrentBlock()!;
        this.enclosingRuleFunction = factory.getCurrentRuleFunction();
    }

    /** Walk upwards in model tree, looking for outer alt's code block. */
    public getOuterMostAltCodeBlock(): CodeBlockForOuterMostAlt | undefined {
        if (this.isCodeBlockForOuterMostAlt()) {
            return this;
        }

        let p = this.enclosingBlock;
        while (p) {
            if (p.isCodeBlockForOuterMostAlt()) {
                return p;
            }

            p = p.enclosingBlock;
        }

        return undefined;
    }

    /** Return label alt or return name of rule. */
    public getContextName(): string {
        const alt = this.getOuterMostAltCodeBlock();
        if (alt?.altLabel) {
            return alt.altLabel;
        }

        return this.enclosingRuleFunction!.name;
    }
    protected isCodeBlockForOuterMostAlt(): this is CodeBlockForOuterMostAlt { return false; }

}
