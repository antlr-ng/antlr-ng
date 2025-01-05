/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Rule } from "../../tool/Rule.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { RuleActionFunction } from "./RuleActionFunction.js";

export class RuleSempredFunction extends RuleActionFunction {
    public constructor(factory: OutputModelFactory, r: Rule, ctxType: string) {
        super(factory, r, ctxType);
    }
}
