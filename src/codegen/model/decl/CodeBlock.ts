/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

import { ModelElement } from "../../../misc/ModelElement.js";
import { SrcOp } from "../SrcOp.js";
import { type Decl } from "./Decl.js";

export class CodeBlock extends SrcOp {
    @ModelElement
    public locals = new Set<Decl>();

    @ModelElement
    public preamble: SrcOp[] = [];

    @ModelElement
    public ops: Array<SrcOp | null> = [];

    /** Add local var decl */
    public addLocalDecl(d: Decl): void {
        this.locals.add(d);
        d.isLocal = true;
    }

    public addPreambleOp(op: SrcOp): void {
        this.preamble.push(op);
    }

    public addOp(op: SrcOp | null): void {
        this.ops.push(op);
    }

    public insertOp(i: number, op: SrcOp): void {
        this.ops.splice(i, 0, op);
    }

    public addOps(ops: SrcOp[]): void {
        this.ops.push(...ops);
    }

    public override get parameterFields(): string[] {
        return [...super.parameterFields, "locals", "preamble", "ops"];
    }
}
