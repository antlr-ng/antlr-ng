/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { type ANTLRMessage } from "./ANTLRMessage.js";

/**
 * Defines behavior of object able to handle error messages from ANTLR including
 *  both tool errors like "can't write file" and grammar ambiguity warnings.
 *  To avoid having to change tools that use ANTLR (like GUIs), I am
 *  wrapping error data in Message objects and passing them to the listener.
 *  In this way, users of this interface are less sensitive to changes in
 *  the info I need for error messages.
 */
export interface ANTLRToolListener {
    info(msg: string): void;
    error(msg: ANTLRMessage): void;
    warning(msg: ANTLRMessage): void;
}
