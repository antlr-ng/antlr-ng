/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */

import { Token, type RecognitionException } from "antlr4ng";

import type { IToolMessageOptions } from "../config/config.js";
import { Issue } from "./Issue.js";
import { IssueCode, IssueSeverity } from "./Issues.js";
import { ToolListener } from "./ToolListener.js";

/** The position of a grammar issue: usually a token or a grammar AST node. */
export interface IIssuePosition {
    line: number;
    column: number;
}

/**
 * A class to take care of individual {@link Issue}s. It can notify registered listeners about incoming
 * messages and ensures proper formatting of the messages.
 */
export class ErrorManager {
    public errors = 0;
    public warnings = 0;

    /** All errors that have been generated */
    public errorTypes = new Set<IssueCode>();

    private listeners = new Array<ToolListener>();
    private formatOptions: IToolMessageOptions;

    private longMessages = false;
    private warningsAreErrors = false;

    /**
     * Track separately so if someone adds a listener, it's the only one instead of it and the default stderr listener.
     */
    private defaultListener = new ToolListener(this);

    public static fatalInternalError(error: string, e: Error): void {
        ErrorManager.internalError(error, e);
        throw new Error(error, { cause: e });
    }

    public static internalError(error: string, e?: Error): void {
        if (e) {
            const location = ErrorManager.getLastNonErrorManagerCodeLocation(e);
            ErrorManager.internalError(`Exception ${e}@${location}: ${error}`);
        } else {
            const location = ErrorManager.getLastNonErrorManagerCodeLocation(new Error());
            const msg = location + ": " + error;
            console.error("internal error: " + msg);
        }
    }

    public configure(formatOptions: IToolMessageOptions) {
        this.errors = 0;
        this.warnings = 0;
        this.formatOptions = formatOptions;
    }

    public formatWantsSingleLineMessage(): boolean {
        return this.formatOptions.singleLine;
    }

    /**
     * Raise a predefined message with some number of parameters with no position information.
     *
     * @param errorType The identifier of the issue.
     */
    public toolError(errorType: IssueCode, e?: Error, arg?: unknown, arg2?: unknown, arg3?: unknown): void {
        const msg = new Issue(errorType, this.formatOptions, { line: -1, column: -1, error: e, arg, arg2, arg3 });

        this.emit(msg);
    }

    public grammarError(errorType: IssueCode, fileName: string, position: IIssuePosition | null,
        arg?: unknown, arg2?: unknown, arg3?: unknown): void {
        const line = position?.line ?? -1;
        const column = position?.column ?? -1;
        const msg = new Issue(errorType, this.formatOptions,
            {
                fileName,
                line,
                column,
                ...ErrorManager.getEndPosition(position, line, column),
                arg, arg2, arg3,
            });
        this.emit(msg);
    }

    public addListener(tl: ToolListener): void {
        this.listeners.push(tl);
    }

    public removeListener(tl: ToolListener): void {
        const index = this.listeners.indexOf(tl);
        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }

    public removeListeners(): void {
        this.listeners = [];
    }

    /**
     * Raise a syntax error.
     *
     * @param errorType The identifier of the issue.
     * @param fileName The name of the file with the error.
     * @param line The line of the error.
     * @param column The column of the error.
     * @param antlrException The exception the parser raised, if any.
     * @param arg The first message argument.
     * @param arg2 The second message argument.
     * @param offendingToken The token at which the error occurred, if any. Used to determine the end of the issue.
     */
    public syntaxError(errorType: IssueCode, fileName: string, line: number, column: number,
        antlrException?: RecognitionException, arg?: unknown, arg2?: unknown, offendingToken?: Token | null): void {
        const msg = new Issue(errorType, this.formatOptions, {
            fileName, error: antlrException, line, column,
            ...ErrorManager.getEndPosition(offendingToken, line, column),
            arg, arg2,
        });
        this.emit(msg);
    }

    public info(msg: string): void {
        if (this.listeners.length === 0) {
            this.defaultListener.info(msg);

            return;
        }

        for (const l of this.listeners) {
            l.info(msg);
        }
    }

    public error(msg: Issue): void {
        ++this.errors;
        if (this.listeners.length === 0) {
            this.defaultListener.error(msg);

            return;
        }

        for (const l of this.listeners) {
            l.error(msg);
        }
    }

    public warning(msg: Issue): void {
        ++this.warnings;
        if (this.listeners.length === 0) {
            this.defaultListener.warning(msg);
        } else {
            for (const l of this.listeners) {
                l.warning(msg);
            }
        }

        if (this.formatOptions.warningsAreErrors) {
            this.emit(Issue.fromIssue(msg));
        }
    }

    public emit(msg: Issue): void {
        switch (msg.severity) {
            case IssueSeverity.WarningOneOff: {
                if (this.errorTypes.has(msg.code)) {
                    break;
                }

                // [fall-through]
            }

            case IssueSeverity.Warning: {
                this.warning(msg);

                break;
            }

            case IssueSeverity.ErrorOneOff: {
                if (this.errorTypes.has(msg.code)) {
                    break;
                }

                // [fall-through]
            }

            case IssueSeverity.Error:
            case IssueSeverity.Fatal: {
                this.error(msg);

                break;
            }

            default:
        }

        this.errorTypes.add(msg.code);
    }

    /**
     * Determines where an issue ends, from the source text of the token at its position.
     *
     * @param position The token or grammar AST node at which the issue was found.
     * @param line The line of the issue.
     * @param column The column of the issue.
     *
     * @returns The end line and the (exclusive) end column, or an empty object if the extent of the issue is unknown.
     */
    private static getEndPosition(position: IIssuePosition | null | undefined, line: number,
        column: number): { endLine?: number, endColumn?: number; } {
        if (!position || line < 1 || column < 0) {
            return {};
        }

        // A grammar AST node holds its token in the `token` field.
        const token = ("token" in position ? position.token : position) as Partial<Token> | null | undefined;

        // AST nodes without a position of their own take it from a child, so the token can be somewhere else.
        if (!token || token.type === Token.EOF || token.line !== line || token.column !== column) {
            return {};
        }

        // Prefer the source text, because the text of a token created for an AST node can differ from the input.
        let text: string | undefined;
        const start = token.start ?? -1;
        const stop = token.stop ?? -1;
        if (token.inputStream && start >= 0 && stop >= start) {
            text = token.inputStream.getTextFromRange(start, stop);
        } else {
            text = token.text;
        }

        if (!text) {
            return {};
        }

        // Columns count code points, like the positions of the grammar tokens.
        const lines = text.split("\n");
        const lastLineLength = Array.from(lines[lines.length - 1]).length;
        if (lines.length === 1) {
            return { endLine: line, endColumn: column + lastLineLength };
        }

        return { endLine: line + lines.length - 1, endColumn: lastLineLength };
    }

    /** @returns The first non ErrorManager code location for generating messages. */
    private static getLastNonErrorManagerCodeLocation(e: Error): string {
        const stack = e.stack!.split("\n");
        let entry = "";
        for (entry of stack) {
            if (!entry.includes("ErrorManager")) {
                break;
            }
        }

        return entry;
    }
}
