/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IToolMessageOptions } from "../config/config.js";
import { IssueCode, issueTypes, severityMap, type IssueSeverity } from "./Issues.js";

export interface IIssueParams {
    fileName?: string;
    line: number;
    column: number;

    /** The line of the end of the issue range (1-based). */
    endLine?: number;

    /** The column after the last character of the issue range (0-based, exclusive). */
    endColumn?: number;

    error?: Error;
    arg?: unknown;
    arg2?: unknown;
    arg3?: unknown;
}

/** A class that knows how to render an issue to a string. */
export class Issue {
    public constructor(public readonly code: IssueCode, private formatOptions: IToolMessageOptions,
        private params: IIssueParams, private verbose = false) {
    }

    public static fromIssue(issue: Issue): Issue {
        return new Issue(issue.code, issue.formatOptions, { ...issue.params }, issue.verbose);
    }

    /** @returns The file in which the issue was found, if it relates to a file. */
    public get fileName(): string | undefined {
        return this.params.fileName;
    }

    /** @returns The line where the issue starts (1-based), or -1 if the issue has no position. */
    public get line(): number {
        return this.params.line;
    }

    /** @returns The column where the issue starts (0-based, in code points), or -1 if the issue has no position. */
    public get column(): number {
        return this.params.column;
    }

    /** @returns The line where the issue ends (1-based), or `undefined` if the extent of the issue is unknown. */
    public get endLine(): number | undefined {
        return this.params.endLine;
    }

    /**
     * @returns The column after the last character of the issue (0-based, in code points, exclusive), or `undefined`
     * if the extent of the issue is unknown.
     */
    public get endColumn(): number | undefined {
        return this.params.endColumn;
    }

    /** @returns The error that caused this issue, if any. */
    public get error(): Error | undefined {
        return this.params.error;
    }

    public get severity(): IssueSeverity {
        const issue = issueTypes.get(this.code);
        if (!issue) {
            throw new Error(`Unknown issue code: ${this.code}`);
        }

        return issue.severity;
    }

    public toString(): string {
        let result = this.formatOptions.messageFormat;
        const locationTemplate = this.formatOptions.locationFormat;

        let location = "";

        location = locationTemplate.replace("<file>", this.params.fileName ?? "<unknown>");

        if (this.params.line !== -1) {
            location = location.replace("<line>", String(this.params.line));
            location = location.replace("<column>", String(this.params.column));
        } else {
            location = location.replace("<line>", "");
            location = location.replace("<column>", "");
        }

        result = result.replace("<severity>", severityMap.get(this.severity)!);
        result = result.replace("<issueCode>", String(this.code));
        result = result.replace("<location>", location);
        result = result.replace("<message>", this.message);

        return result;
    }

    /** @returns The issue text with all arguments filled in, but without severity, code and location. */
    public get message(): string {
        const issue = issueTypes.get(this.code);
        if (!issue) {
            throw new Error(`Unknown issue code: ${this.code}`);
        }

        let message = issue.message;
        if (this.verbose && issue.verboseMessage) {
            message = issue.verboseMessage;

            if (this.params.error !== undefined) {
                message = message.replace("<exception>", this.params.error.message);
                message = message.replace("<stackTrace>", this.params.error.stack ?? "");
            }
        }

        if (this.params.arg !== undefined) {
            message = message.replace("<arg>", String(this.params.arg));
        }

        if (this.params.arg2 !== undefined) {
            message = message.replace("<arg2>", String(this.params.arg2));
        }

        if (this.params.arg3 !== undefined) {
            message = message.replace("<arg3>", String(this.params.arg3));
        }

        return message;
    }

    /**
     * For testing only.
     *
     * @returns A string representation of the parameters used to create this issue.
     */
    public get paramsAsString(): string {
        const args: string[] = [];
        if (this.params.arg !== undefined) {
            args.push(String(this.params.arg));
        }

        if (this.params.arg2 !== undefined) {
            args.push(String(this.params.arg2));
        }

        if (this.params.arg3 !== undefined) {
            args.push(String(this.params.arg3));
        }

        return args.join(", ");
    }
}
