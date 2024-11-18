/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import type { RecognitionException, Token } from "antlr4ng";
import { ErrorBuffer, IST, STGroup, STGroupString } from "stringtemplate4ts";

import { basename } from "path";

import { grammarOptions } from "../grammar-options.js";
import { ANTLRMessage } from "./ANTLRMessage.js";
import type { ANTLRToolListener } from "./ANTLRToolListener.js";
import { DefaultToolListener } from "./DefaultToolListener.js";
import { ErrorSeverity } from "./ErrorSeverity.js";
import { ErrorType } from "./ErrorType.js";
import { GrammarSemanticsMessage } from "./GrammarSemanticsMessage.js";
import { GrammarSyntaxMessage } from "./GrammarSyntaxMessage.js";
import { ToolMessage } from "./ToolMessage.js";

// The supported ANTLR message formats. Using ST here is overkill and will later be replaced with a simple solution.
const messageFormats = new Map<string, string>([
    ["antlr", `
location(file, line, column) ::= "<file>:<line>:<column>:"
message(id, text) ::= "(<id>) <text>"
report(location, message, type) ::= "<type>(<message.id>): <location> <message.text>"
wantsSingleLineMessage() ::= "false"
`],
    ["gnu", `
location(file, line, column) ::= "<file>:<line>:<column>:"
message(id, text) ::= "<text> [error <id>]"
report(location, message, type) ::= "<location> <type>: <message>"
wantsSingleLineMessage() ::= "true"
`],
    ["vs2005", `
location(file, line, column) ::= "<file>(<line>,<column>)"
message(id, text) ::= "error <id> : <text>"
report(location, message, type) ::= "<location> : <type> <message.id> : <message.text>"
wantsSingleLineMessage() ::= "true"
`]]);

export class ErrorManager {
    private static readonly loadedFormats = new Map<string, STGroupString>();

    public errors: number;
    public warnings: number;

    /** All errors that have been generated */
    public errorTypes = new Set<ErrorType>();

    /** Singleton. */
    static #instance: ErrorManager = new ErrorManager();

    /** The group of templates that represent the current message format. */
    #format: STGroup;

    #formatName: string;

    #initSTListener = new ErrorBuffer();
    #listeners = new Array<ANTLRToolListener>();

    /**
     * Track separately so if someone adds a listener, it's the only one
     * instead of it and the default stderr listener.
     */
    #defaultListener = new DefaultToolListener();

    private constructor() { // TODO: make this class only a holder of static methods and fields?
        this.errors = 0;
        this.warnings = 0;

        const formatName = grammarOptions.msgFormat ?? "antlr";
        this.loadFormat(formatName);
    }

    public static get(): ErrorManager {
        return ErrorManager.#instance;
    }

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

    public formatWantsSingleLineMessage(): boolean {
        const result = this.#format.getInstanceOf("wantsSingleLineMessage")?.render();

        return result === "true" ? true : false;
    }

    public getMessageTemplate(msg: ANTLRMessage): IST | null {
        const longMessages = grammarOptions.longMessages;
        const messageST = msg.getMessageTemplate(longMessages ?? false);
        const locationST = this.getLocationFormat();
        const reportST = this.getReportFormat(msg.getErrorType().severity);
        const messageFormatST = this.getMessageFormat();

        let locationValid = false;
        if (msg.line !== -1) {
            locationST.add("line", msg.line);
            locationValid = true;
        }

        if (msg.charPosition !== -1) {
            locationST.add("column", msg.charPosition);
            locationValid = true;
        }

        if (msg.fileName) {
            let displayFileName = msg.fileName;
            if (this.#formatName === "antlr") {
                // Don't show path to file in messages in ANTLR format, they're too long.
                displayFileName = basename(msg.fileName);
            } else {
                // For other message formats, use the full filename in the
                // message. This assumes that these formats are intended to
                // be parsed by IDEs, and so they need the full path to
                // resolve correctly.
            }
            locationST.add("file", displayFileName);
            locationValid = true;
        }

        messageFormatST.add("id", msg.getErrorType().code);
        messageFormatST.add("text", messageST);

        if (locationValid) {
            reportST?.add("location", locationST);
        }

        reportST?.add("message", messageFormatST);

        return reportST;
    }

    /**
     * Raise a predefined message with some number of parameters for the StringTemplate but for which there
     * is no location information possible.
     *
     * @param errorType The Message Descriptor
     * @param args The arguments to pass to the StringTemplate
     */
    public toolError(errorType: ErrorType, ...args: unknown[]): void;
    public toolError(errorType: ErrorType, e: Error, ...args: unknown[]): void;
    public toolError(...allArgs: unknown[]): void {
        let msg: ToolMessage;

        if (allArgs.length < 1) {
            throw new Error("Invalid number of arguments");
        }

        const errorType = allArgs.shift() as ErrorType;

        if (allArgs.length > 0) {
            const error = allArgs[0];
            if (error instanceof Error) {
                allArgs.shift();
                msg = new ToolMessage(errorType, error, allArgs);
            } else {
                msg = new ToolMessage(errorType, allArgs);
            }
        } else {
            msg = new ToolMessage(errorType);
        }

        this.emit(errorType, msg);
    }

    public grammarError(errorType: ErrorType, fileName: string, token: Token | null, ...args: unknown[]): void {
        const msg = new GrammarSemanticsMessage(errorType, fileName, token, args);
        this.emit(errorType, msg);
    }

    public addListener(tl: ANTLRToolListener): void {
        this.#listeners.push(tl);
    }

    public removeListener(tl: ANTLRToolListener): void {
        const index = this.#listeners.indexOf(tl);
        if (index >= 0) {
            this.#listeners.splice(index, 1);
        }
    }

    public removeListeners(): void {
        this.#listeners = [];
    }

    public syntaxError(errorType: ErrorType, fileName: string, token: Token, antlrException: RecognitionException,
        ...args: unknown[]): void {
        const msg = new GrammarSyntaxMessage(errorType, fileName, token, antlrException, args);
        this.emit(errorType, msg);
    }

    public info(msg: string): void {
        if (this.#listeners.length === 0) {
            this.#defaultListener.info(msg);

            return;
        }

        for (const l of this.#listeners) {
            l.info(msg);
        }
    }

    public error(msg: ANTLRMessage): void {
        ++this.errors;
        if (this.#listeners.length === 0) {
            this.#defaultListener.error(msg);

            return;
        }

        for (const l of this.#listeners) {
            l.error(msg);
        }
    }

    public warning(msg: ANTLRMessage): void {
        if (this.#listeners.length === 0) {
            this.#defaultListener.warning(msg);
        } else {
            for (const l of this.#listeners) {
                l.warning(msg);
            }
        }

        if (grammarOptions.warningsAreErrors) {
            this.emit(ErrorType.WARNING_TREATED_AS_ERROR, new ANTLRMessage(ErrorType.WARNING_TREATED_AS_ERROR));
        }
    }

    public emit(errorType: ErrorType, msg: ANTLRMessage): void {
        switch (errorType.severity) {
            case ErrorSeverity.WarningOneOff: {
                if (this.errorTypes.has(errorType)) {
                    break;
                }

                // [fall-through]
            }

            case ErrorSeverity.Warning: {
                this.warnings++;
                this.warning(msg);

                break;
            }

            case ErrorSeverity.ErrorOneOff: {
                if (this.errorTypes.has(errorType)) {
                    break;
                }

                // [fall-through]
            }

            case ErrorSeverity.Error: {
                this.error(msg);
                break;
            }

            default:
        }

        this.errorTypes.add(errorType);
    }

    /**
     * Return a StringTemplate that refers to the current format used for
     * emitting messages.
     */
    private getLocationFormat(): IST {
        return this.#format.getInstanceOf("location")!;
    }

    private getReportFormat(severity: ErrorSeverity): IST | null {
        const st = this.#format.getInstanceOf("report");
        st?.add("type", severity.toString());

        return st;
    }

    private getMessageFormat(): IST {
        return this.#format.getInstanceOf("message")!;
    }

    /**
     * The format gets reset either from the Tool if the user supplied a command line option to that effect.
     * Otherwise we just use the default "antlr".
     */
    private loadFormat(formatName: string): void {
        let loadedFormat = ErrorManager.loadedFormats.get(formatName);
        if (!loadedFormat) {
            let templates = messageFormats.get(formatName);
            if (!templates) {
                templates = messageFormats.get("antlr");
                if (!templates) {
                    throw new Error("Unknown message format: " + formatName);
                }
            }

            loadedFormat = new STGroupString("ErrorManager", templates, "<", ">");
            ErrorManager.loadedFormats.set(formatName, loadedFormat);
        }

        this.#formatName = formatName;
        this.#format = loadedFormat;

        if (this.#initSTListener.size > 0) {
            throw new Error("Can't load messages format file:\n" + this.#initSTListener.toString());
        }

        const formatOK = this.verifyFormat();
        if (!formatOK) {
            throw new Error("ANTLR messages format " + formatName + " invalid");
        }
    }

    /** Verify the message format template group */
    private verifyFormat(): boolean {
        let ok = true;
        if (!this.#format.isDefined("location")) {
            console.error("Format template 'location' not found in " + this.#formatName);
            ok = false;
        }

        if (!this.#format.isDefined("message")) {
            console.error("Format template 'message' not found in " + this.#formatName);
            ok = false;
        }

        if (!this.#format.isDefined("report")) {
            console.error("Format template 'report' not found in " + this.#formatName);
            ok = false;
        }

        return ok;
    }
}
