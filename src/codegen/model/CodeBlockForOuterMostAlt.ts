/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IAlternative } from "../../types.js";
import type { OutputModelFactory } from "../OutputModelFactory.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";

/**
 * The code associated with the outermost alternative of a rule.
 *  Sometimes we might want to treat them differently in the
 *  code generation.
 */
export class CodeBlockForOuterMostAlt extends CodeBlockForAlt {

    /**
     * The label for the alternative; or null if the alternative is not labeled.
     */
    public altLabel?: string;

    /**
     * The alternative.
     */
    public alt: IAlternative;

    public constructor(factory: OutputModelFactory, alt: IAlternative) {
        super(factory);
        this.alt = alt;
        this.altLabel = alt.ast.altLabel?.getText() ?? undefined;
    }
}
