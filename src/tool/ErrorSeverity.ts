/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

export const enum ErrorSeverity {
    Info,
    Warning,
    WarningOneOff,
    Error,
    ErrorOneOff,
    Fatal,
}

export const severityMap = new Map<ErrorSeverity, string>([
    [ErrorSeverity.Info, "info"],
    [ErrorSeverity.Warning, "warning"],
    [ErrorSeverity.WarningOneOff, "warning"],
    [ErrorSeverity.Error, "error"],
    [ErrorSeverity.ErrorOneOff, "error"],
    [ErrorSeverity.Fatal, "fatal"],
]);
