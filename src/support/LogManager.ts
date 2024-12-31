/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { writeFileSync } from "node:fs";
import { basename, join } from "node:path";

interface ILogEntry {
    component?: string;
    msg: string;
    fileName?: string;
    lineNumber?: number;
}

export class LogManager {
    private records: ILogEntry[] = [];

    public log(info: { component?: string, msg: string; }): void {
        // Extract the file name and line number from the stack trace.
        const stack = new Error().stack?.split("\n");
        let fileName: string | undefined;
        let lineNumber: number | undefined;
        if (stack) {
            try {
                const stackLine = stack[3];
                const match = stackLine.match(/\(([^)]+)\)/);
                if (match) {
                    const parts = match[1].split(":");
                    fileName = basename(parts[0]);
                    lineNumber = parseInt(parts[1], 10);
                }
            } catch {
                // Ignore errors.
            }
        }
        this.records.push({ ...info, fileName, lineNumber });
    }

    public save(filename?: string): string {
        if (!filename) {
            filename = join(".", `antlrng-${Date.now()}.log`);
        }

        writeFileSync(filename, this.toString());

        return filename;
    }

    public toString(): string {
        const entries = this.records.map((entry) => {
            return `${entry.component ?? ""} ${entry.fileName ?? ""}:` + `${entry.lineNumber ?? -1} ${entry.msg}`;
        });

        return entries.join("\n");
    }
}
