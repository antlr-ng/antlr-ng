/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { MurmurHash } from "../../../support/MurmurHash.js";
import { IOutputModelFactory } from "../../IOutputModelFactory.js";
import { SrcOp } from "../SrcOp.js";
import { StructDecl } from "./StructDecl.js";

export class Decl extends SrcOp {
    public readonly name: string;

    public readonly escapedName: string;

    /** Whole thing if copied from action. */
    public readonly decl?: string;

    /** If local var (not in RuleContext struct). */
    public isLocal: boolean;

    /** Which context contains us? set by addDecl. */
    public ctx: StructDecl;

    public constructor(factory: IOutputModelFactory, name: string, decl?: string) {
        super(factory);
        this.name = name;
        this.escapedName = factory.getGenerator()!.targetGenerator.escapeIfNeeded(name);
        this.decl = decl;
    }

    public hashCode(): number {
        return MurmurHash.hashCode(this.name);
    }

    /** If same name, can't redefine, unless it's a getter. */
    public equals(obj: object): boolean {
        if (this === obj) {
            return true;
        }

        if (!(obj instanceof Decl)) {
            return false;
        }

        // A() and label A are different.
        if ("signature" in obj) { // ContextGetterDecl
            return false;
        }

        return this.name === obj.name;
    }
}
