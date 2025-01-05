/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import { ActionAST } from "../../tool/ast/ActionAST.js";
import { ActionTranslator } from "../ActionTranslator.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Action } from "./Action.js";
import { ActionChunk } from "./chunk/ActionChunk.js";

export class SemPred extends Action {

    /**
     * The user-specified terminal option {@code fail}, if it was used and the
     * value is a string literal. For example:
     *
     * <p>
     * {@code {pred}?<fail='message'>}</p>
     */
    public msg: string;

    /**
     * The predicate string with <code>{</code> and <code>}?</code> stripped from the ends.
     */
    public predicate: string;

    /**
     * The translated chunks of the user-specified terminal option {@code fail},
     * if it was used and the value is an action. For example:
     *
     * <p>
     * {@code {pred}?<fail={"Java literal"}>}</p>
     */
    @ModelElement
    public failChunks: ActionChunk[];

    public constructor(factory: OutputModelFactory, ast: ActionAST) {
        super(factory, ast);
        const failNode = ast.getOptionAST("fail");
        const gen = factory.getGenerator()!;

        // Remove the outer braces and the trailing question mark.
        this.predicate = ast.getText().substring(1, ast.getText().length - 2);
        if (this.predicate.startsWith("{") && this.predicate.endsWith("}")) {
            this.predicate = this.predicate.substring(1, this.predicate.length - 2);
        }

        this.predicate = gen.getTarget().getTargetStringLiteralFromString(this.predicate);
        if (!failNode) {
            return;
        }

        if (failNode instanceof ActionAST) {
            const failActionNode = failNode;
            const rf = factory.getCurrentRuleFunction() ?? null;
            this.failChunks = ActionTranslator.translateAction(factory, rf, failActionNode.token!, failActionNode);
        } else {
            this.msg = gen.getTarget().getTargetStringLiteralFromANTLRStringLiteral(gen, failNode.getText(), true,
                true);
        }
    }
}
