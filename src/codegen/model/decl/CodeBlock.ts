/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

import { ModelElement } from "../../../misc/ModelElement.js";
import { type OutputModelFactory } from "../../OutputModelFactory.js";
import { SrcOp } from "../SrcOp.js";
import { type Decl } from "./Decl.js";

export class CodeBlock extends SrcOp {
    public codeBlockLevel: number;
    public treeLevel: number;

    @ModelElement
    public locals = new Set<Decl>();

    @ModelElement
    public preamble: SrcOp[] = [];

    @ModelElement
    public ops: SrcOp[] = [];

    public constructor(factory: OutputModelFactory);
    public constructor(factory: OutputModelFactory, treeLevel: number, codeBlockLevel: number);
    public constructor(...args: unknown[]) {
        const factory = args[0] as OutputModelFactory;
        super(factory);
        if (args.length === 3) {
            this.treeLevel = args[1] as number;
            this.codeBlockLevel = args[2] as number;
        }
    }

    /** Add local var decl */
    public addLocalDecl(d: Decl): void {
        this.locals.add(d);
        d.isLocal = true;
    }

    public addPreambleOp(op: SrcOp): void {
        this.preamble.push(op);
    }

    public addOp(op: SrcOp): void {
        this.ops.push(op);
    }

    public insertOp(i: number, op: SrcOp): void {
        this.ops.splice(i, 0, op);
    }

    public addOps(ops: SrcOp[]): void {
        this.ops.push(...ops);
    }
}
