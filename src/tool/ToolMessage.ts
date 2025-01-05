/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ANTLRMessage } from "./ANTLRMessage.js";
import { ErrorType } from "./ErrorType.js";

/**
 * A generic message from the tool such as "file not found" type errors; there
 *  is no reason to create a special object for each error unlike the grammar
 *  errors, which may be rather complex.
 *
 *  Sometimes you need to pass in a filename or something to say it is "bad".
 *  Allow a generic object to be passed in and the string template can deal
 *  with just printing it or pulling a property out of it.
 */
export class ToolMessage extends ANTLRMessage {
    public constructor(errorType: ErrorType);
    public constructor(errorType: ErrorType, ...args: unknown[]);
    public constructor(errorType: ErrorType, e: Error, ...args: unknown[]);
    public constructor(...args: unknown[]) {
        if (args.length < 2) {
            super(args[0] as ErrorType, "", -1, -1);
        } else {
            const [errorType, rest] = args as [ErrorType, unknown[]];
            if (rest[0] instanceof Error) {
                const [errorType, e, rest] = args as [ErrorType, Error, unknown[]];

                super(errorType, "", e, -1, -1, rest);
            } else {
                super(errorType, "", -1, -1, rest);
            }
        }
    }
}
