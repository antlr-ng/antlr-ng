/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Utils } from "../../../misc/Utils.js";
import { MurmurHash } from "../../../support/MurmurHash.js";
import { Rule } from "../../../tool/Rule.js";
import { IOutputModelFactory } from "../../IOutputModelFactory.js";
import { ListenerDispatchMethod } from "../ListenerDispatchMethod.js";
import { VisitorDispatchMethod } from "../VisitorDispatchMethod.js";
import { StructDecl } from "./StructDecl.js";

/** A StructDecl to handle a -> label on alt */
export class AltLabelStructDecl extends StructDecl {
    public altNum: number;
    public parentRule: string;
    public constructor(factory: IOutputModelFactory, r: Rule, altNum: number, label: string, generateListener: boolean,
        generateVisitor: boolean) {
        // Override name set in super to the label ctx.
        const suffix = Utils.capitalize(label) + factory.getGenerator()!.targetGenerator.ruleContextNameSuffix;
        super(factory, r, generateListener, generateVisitor, suffix);
        this.altNum = altNum;
        this.parentRule = r.name;
        this.derivedFromName = label;
    }

    public override addDispatchMethods(r: Rule): void {
        this.dispatchMethods.length = 0;
        if (this.generateListener) {
            this.dispatchMethods.push(new ListenerDispatchMethod(this.factory!, true));
            this.dispatchMethods.push(new ListenerDispatchMethod(this.factory!, false));
        }

        if (this.generateVisitor) {
            this.dispatchMethods.push(new VisitorDispatchMethod(this.factory));
        }
    }

    public override hashCode(): number {
        return MurmurHash.hashCode(this.name);
    }

    public override equals(obj: unknown): boolean {
        if (obj === this) {
            return true;
        }

        if (!(obj instanceof AltLabelStructDecl)) {
            return false;
        }

        return this.name === obj.name;
    }
}
