/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { ST } from "stringtemplate4ts";

import { ErrorType } from "./ErrorType.js";

export class ANTLRMessage {
    // used for location template
    public readonly fileName: string;
    public readonly line: number = -1;
    public readonly column: number = -1;

    public readonly args: unknown[] = [];

    public readonly errorType: ErrorType;

    private readonly e: Error | null = null;

    public constructor(errorType: ErrorType, fileName: string, line: number, column: number, ...args: unknown[]);
    public constructor(errorType: ErrorType, fileName: string, e: Error | null, line: number, column: number,
        ...args: unknown[]);
    public constructor(...args: unknown[]) {
        this.errorType = args.shift() as ErrorType;
        this.fileName = args.shift() as string;

        let next = args.shift();
        if (typeof next !== "number") {
            this.e = next as Error;
            next = args.shift();
        }

        this.line = next as number;
        this.column = args.shift() as number;

        if (args.length > 0) {
            this.args = args;
        }
    }

    public getMessageTemplate(verbose: boolean): ST {
        const messageST = new ST(this.errorType.msg);
        messageST.impl!.name = this.errorType.name;

        messageST.add("verbose", verbose);
        for (let i = 0; i < this.args.length; i++) {
            let attr = "arg";
            if (i > 0) {
                attr += String(i + 1);
            }

            messageST.add(attr, this.args[i]);
        }
        if (this.args.length < 2) {
            messageST.add("arg2", null);
        }
        // some messages ref arg2

        if (this.e !== null) {
            messageST.add("exception", this.e);
            messageST.add("stackTrace", this.e.stack);
        } else {
            messageST.add("exception", null); // avoid ST error msg
            messageST.add("stackTrace", null);
        }

        return messageST;
    }

    public toString(): string {
        return "Message{" +
            "errorType=" + this.errorType.name +
            ", args=" + this.args.join(", ") +
            ", e=" + String(this.e) +
            ", fileName='" + this.fileName + "'" +
            ", line=" + String(this.line) +
            ", charPosition=" + String(this.column) +
            "}";
    }
}
