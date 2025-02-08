/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ANTLRMessage } from "./ANTLRMessage.js";

/**
 * A problem with the symbols and/or meaning of a grammar such as rule redefinition. Any msg where we can point to
 * a location in the grammar.
 */
export class GrammarSemanticsMessage extends ANTLRMessage { }
