/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import { Rule } from "../../tool/Rule.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputModelObject } from "./OutputModelObject.js";

export class RuleActionFunction extends OutputModelObject {
    public readonly name: string;
    public readonly escapedName: string;
    public readonly ctxType: string;
    public readonly ruleIndex: number;

    /** Map actionIndex to Action */
    @ModelElement
    public readonly actions = new Map<number, Action>();

    public constructor(factory: IOutputModelFactory, r: Rule, ctxType: string) {
        super(factory);

        this.name = r.name;
        this.escapedName = factory.getGenerator()!.target.escapeIfNeeded(this.name);
        this.ruleIndex = r.index;
        this.ctxType = ctxType;
    }
}
