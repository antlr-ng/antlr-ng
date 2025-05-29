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

        if (this.params.line !== -1) {
            if (this.params.fileName === undefined) {
                this.params.fileName = "<unknown>";
            }

            location = locationTemplate.replace("<file>", this.params.fileName);
            location = location.replace("<line>", String(this.params.line));
            location = location.replace("<column>", String(this.params.column));
        }

        let message = "";
        const issue = issueTypes.get(this.code)!;
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

        result = result.replace("<severity>", severityMap.get(issue.severity)!);
        result = result.replace("<issueCode>", String(this.code));
        result = result.replace("<location>", location);
        result = result.replace("<message>", message);

        return result;
    }
}
