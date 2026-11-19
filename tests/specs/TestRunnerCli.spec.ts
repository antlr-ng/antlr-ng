/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../../cli/runner.ts", import.meta.url));

// The tool runs in the test folder, where the tsx loader cannot be found by name.
const tsx = pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;

/** The tool runs on import, so it is tested as a separate process. */
describe("antlr-ng CLI with legacy parameters", () => {
    // The tests run concurrently, so each one uses its own folder.
    const dirs: string[] = [];

    afterAll(() => {
        for (const dir of dirs) {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    /**
     * Runs the tool in a new folder, which contains the lexer grammar L.g4.
     *
     * @param args The command line arguments.
     *
     * @returns The exit code, the error output and the names of the files in the output folder "out".
     */
    const run = (...args: string[]): { status: number | null, stderr: string, files: string[]; } => {
        const dir = mkdtempSync(tmpdir() + "/AntlrRunnerCli-");
        dirs.push(dir);
        writeFileSync(dir + "/L.g4", "lexer grammar L;\nID : [a-z]+ ;\nWS : [ \\n]+ -> skip ;\n");

        const result = spawnSync(process.execPath, ["--import", tsx, cli, ...args], { cwd: dir, encoding: "utf-8" });
        const files = existsSync(dir + "/out") ? readdirSync(dir + "/out").sort() : [];

        return { status: result.status, stderr: result.stderr, files };
    };

    it("generates TypeScript without a language", () => {
        const result = run("-o", "out", "L.g4");
        expect(result.status).toBe(0);
        expect(result.files).toEqual(["L.tokens", "L.ts"]);
    }, 30000);

    it("generates metadata only with -Dlanguage=None", () => {
        const result = run("-Dlanguage=None", "-o", "out", "L.g4");
        expect(result.status).toBe(0);
        expect(result.files).toEqual(["L.interp", "L.tokens"]);
    }, 30000);

    it("selects the generator with -D language", () => {
        const result = run("-o", "out", "-D", "language=Cpp", "L.g4");
        expect(result.status).toBe(0);
        expect(result.files).toEqual(["L.cpp", "L.h", "L.tokens"]);
    }, 30000);

    it("fails for an unknown language", () => {
        const result = run("-Dlanguage=Foo", "-o", "out", "L.g4");
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Unknown target language "Foo".');
        expect(result.files).toEqual([]);
    }, 30000);
});
