/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("Large grammar generation", () => {
    it("renders all files without spread calls that overflow the stack", async () => {
        // `lines.push(...other)` passes every line as a separate argument, which overflows the call stack for large
        // line lists (about 125k lines with the default stack). The test workers have a larger stack than a normal
        // Node.js process, so the rendering runs in a child process. Its stack is reduced to 100 KB, which lowers
        // the limit to about 12k lines, so a grammar of 600 rules is enough to exceed it in every file kind.
        const root = fileURLToPath(new URL("../..", import.meta.url));
        const script = fileURLToPath(new URL("../support/renderLargeGrammar.ts", import.meta.url));

        let stdout: string;
        try {
            ({ stdout } = await execFileAsync(process.execPath, ["--stack-size=100", "--import", "tsx", script, "600"],
                { cwd: root, encoding: "utf8", timeout: 50000, maxBuffer: 1024 * 1024 }));
        } catch (e) {
            const error = e as Error & { code?: number, signal?: string, stderr?: string; };
            throw new Error(`Rendering failed (exit code ${error.code}, signal ${error.signal}):\n${error.stderr}`);
        }

        // Each entry is the line count of a rendered file, or the error message if rendering failed.
        const result = JSON.parse(stdout) as Record<string, number | string>;
        expect(result.errors).toBe(0);

        const failed = Object.entries(result).filter(([_, value]) => {
            return typeof value === "string";
        });
        expect(failed).toEqual([]);

        // Make sure the test still produces files that are larger than the spread limit.
        expect(result["TypeScript.parser"]).toBeGreaterThan(50000);
    }, 60000);
});
