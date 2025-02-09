/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Grammar } from "../src/tool/Grammar.js";

export class IgnoreTokenVocabGrammar extends Grammar {
    public override importTokensFromTokensFile(): void {
        // don't try to import tokens files; must give me both grammars if split
    }
};
