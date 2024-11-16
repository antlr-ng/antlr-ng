/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { grammarOptions } from "../../../grammar-options.js";
import { ModelElement } from "../../../misc/ModelElement.js";
import type { IAttribute } from "../../../tool/IAttribute.js";
import { Rule } from "../../../tool/Rule.js";
import { OutputModelFactory } from "../../OutputModelFactory.js";
import { DispatchMethod } from "../DispatchMethod.js";
import { ListenerDispatchMethod } from "../ListenerDispatchMethod.js";
import { OutputModelObject } from "../OutputModelObject.js";
import { VisitorDispatchMethod } from "../VisitorDispatchMethod.js";
import { AttributeDecl } from "./AttributeDecl.js";
import { ContextGetterDecl } from "./ContextGetterDecl.js";
import { Decl } from "./Decl.js";
import { RuleContextDecl } from "./RuleContextDecl.js";
import { RuleContextListDecl } from "./RuleContextListDecl.js";
import { TokenDecl } from "./TokenDecl.js";
import { TokenListDecl } from "./TokenListDecl.js";
import { TokenTypeDecl } from "./TokenTypeDecl.js";

/**
 * This object models the structure holding all of the parameters,
 *  return values, local variables, and labels associated with a rule.
 */
export class StructDecl extends Decl {
    public derivedFromName: string; // rule name or label name
    public provideCopyFrom: boolean;

    // Track these separately; Go target needs to generate getters/setters
    // Do not make them templates; we only need the Decl object not the ST
    // built from it. Avoids adding args to StructDecl template
    public tokenDecls = new Set<Decl>();
    public tokenTypeDecls = new Set<Decl>();
    public tokenListDecls = new Set<Decl>();
    public ruleContextDecls = new Set<Decl>();
    public ruleContextListDecls = new Set<Decl>();
    public attributeDecls = new Set<Decl>();

    @ModelElement
    public dispatchMethods: DispatchMethod[] = [];

    @ModelElement
    public attrs = new Set<Decl>();

    @ModelElement
    public getters = new Set<Decl>();

    @ModelElement
    public ctorAttrs: AttributeDecl[] = [];

    @ModelElement
    public interfaces: OutputModelObject[] = [];

    @ModelElement
    public extensionMembers: OutputModelObject[] = [];

    // Used to generate method signatures in Go target interfaces
    @ModelElement
    public signatures = new Set<Decl>();

    public constructor(factory: OutputModelFactory, r: Rule, name?: string) {
        super(factory, name ?? factory.getGenerator()!.getTarget().getRuleFunctionContextStructName(r));
        this.addDispatchMethods(r);
        this.derivedFromName = r.name;
        this.provideCopyFrom = r.hasAltSpecificContexts();
    }

    public addDispatchMethods(r: Rule): void {
        this.dispatchMethods = new Array<DispatchMethod>();
        if (!r.hasAltSpecificContexts()) {
            // no enter/exit for this ruleContext if rule has labels
            if (grammarOptions.generateListener) {
                this.dispatchMethods.push(new ListenerDispatchMethod(this.factory!, true));
                this.dispatchMethods.push(new ListenerDispatchMethod(this.factory!, false));
            }

            if (grammarOptions.generateVisitor) {
                this.dispatchMethods.push(new VisitorDispatchMethod(this.factory!));
            }
        }
    }

    public addDecl(a: Decl | IAttribute): void {
        if (a instanceof Decl) {
            a.ctx = this;

            if (a instanceof ContextGetterDecl) {
                this.getters.add(a);
                this.signatures.add(a.getSignatureDecl());
            } else {
                this.attrs.add(a);
            }

            // add to specific "lists"
            if (a instanceof TokenTypeDecl) {
                this.tokenTypeDecls.add(a);
            } else if (a instanceof TokenListDecl) {
                this.tokenListDecls.add(a);
            } else if (a instanceof TokenDecl) {
                this.tokenDecls.add(a);
            } else if (a instanceof RuleContextListDecl) {
                this.ruleContextListDecls.add(a);
            } else if (a instanceof RuleContextDecl) {
                this.ruleContextDecls.add(a);
            } else if (a instanceof AttributeDecl) {
                this.attributeDecls.add(a);
            }
        } else {
            this.addDecl(new AttributeDecl(this.factory!, a));
        }
    }

    public addDecls(attrList: IAttribute[]): void {
        for (const a of attrList) {
            this.addDecl(a);
        }

    }

    public implementInterface(value: OutputModelObject): void {
        this.interfaces.push(value);
    }

    public addExtensionMember(member: OutputModelObject): void {
        this.extensionMembers.push(member);
    }

    public isEmpty(): boolean {
        return this.attrs.size === 0;
    }
}
