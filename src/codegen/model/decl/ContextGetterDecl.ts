/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { MurmurHash } from "../../../support/MurmurHash.js";
import { OutputModelFactory } from "../../OutputModelFactory.js";
import { Decl } from "./Decl.js";

export abstract class ContextGetterDecl extends Decl { // assume no args
    public readonly signature: boolean;

    public constructor(factory: OutputModelFactory, name: string, signature?: boolean) {
        super(factory, name);
        this.signature = signature ?? false;
    }

    /**
     * Not used for output; just used to distinguish between decl types to avoid duplicates.
     */
    public getArgType(): string {
        return "";
    }

    public override hashCode(): number {
        let hash = MurmurHash.initialize();
        hash = MurmurHash.update(hash, this.name);
        hash = MurmurHash.update(hash, this.getArgType());
        hash = MurmurHash.finish(hash, 2);

        return hash;
    }

    /**
     * Make sure that a getter does not equal a label. X() and X are ok.
     *  OTOH, treat X() with two diff return values as the same.  Treat
     *  two X() with diff args as different.
     */
    public override equals(obj: object): boolean {
        if (this === obj) {
            return true;
        }

        // A() and label A are different
        if (!(obj instanceof ContextGetterDecl)) {
            return false;
        }

        return this.name === obj.name && this.getArgType() === obj.getArgType();
    }

    public abstract getSignatureDecl(): ContextGetterDecl;;
}
