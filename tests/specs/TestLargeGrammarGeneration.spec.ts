/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { execFile } from "node:child_process";
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const languages = ["TypeScript", "Cpp", "CSharp", "Dart", "Go", "Java", "PHP", "Python3", "Swift"];

/**
 * Renders all files of a large grammar in a child process with a small stack.
 *
 * @param language The target language to render.
 *
 * @returns The line count of each rendered file, or the error message if rendering failed, plus the error count.
 */
const render = async (language: string): Promise<Record<string, number | string>> => {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const script = fileURLToPath(new URL("../support/renderLargeGrammar.ts", import.meta.url));

    try {
        const { stdout } = await execFileAsync(process.execPath,
            ["--stack-size=100", "--import", "tsx", script, "600", language],
            { cwd: root, encoding: "utf8", timeout: 50000, maxBuffer: 1024 * 1024 });

        return JSON.parse(stdout) as Record<string, number | string>;
    } catch (e) {
        const error = e as Error & { code?: number, signal?: string, stderr?: string; };
        throw new Error(`Rendering ${language} failed (exit code ${error.code}, signal ${error.signal}):\n` +
            `${error.stderr}`);
    }
};

describe("Large grammar generation", () => {
    it("renders all files without spread calls that overflow the stack", async () => {
        // `lines.push(...other)` passes every line as a separate argument, which overflows the call stack for large
        // line lists (about 125k lines with the default stack). The test workers have a larger stack than a normal
        // Node.js process, so the rendering runs in child processes, one per target. Their stack is reduced to
        // 100 KB, which lowers the limit to about 12k lines, so a grammar of 600 rules is enough to exceed it in every
        // file kind.
        // Only half of the CPUs render at the same time, because the other test files run concurrently and slow
        // tests (like the built-in generator tests) time out otherwise.
        const results = new Array<Record<string, number | string>>(languages.length);
        let next = 0;
        const worker = async (): Promise<void> => {
            while (next < languages.length) {
                const index = next++;
                results[index] = await render(languages[index]);
            }
        };

        const workerCount = Math.max(1, Math.floor(availableParallelism() / 2));
        await Promise.all(Array.from({ length: Math.min(workerCount, languages.length) }, () => {
            return worker();
        }));

        for (const [index, result] of results.entries()) {
            expect(result.errors, languages[index]).toBe(0);

            const failed = Object.entries(result).filter(([_, value]) => {
                return typeof value === "string";
            });
            expect(failed).toEqual([]);
        }

        // Make sure the test still produces files that are larger than the spread limit.
        expect(results[0]["TypeScript.parser"]).toBeGreaterThan(50000);
    }, 180000);
});
