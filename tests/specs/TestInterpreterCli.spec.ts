/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../../cli/Interpreter.ts", import.meta.url));

// The interpreter runs in the test folder, where the tsx loader cannot be found by name.
const tsx = pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;

/** The interpreter runs on import, so it is tested as a separate process. */
describe("Interpreter CLI", () => {
    let dir: string;

    beforeEach(() => {
        dir = mkdtempSync(tmpdir() + "/AntlrInterpreterCli-");
        writeFileSync(dir + "/E.g4", "grammar E;\ns : ID+ EOF ;\nID : [a-z]+ ;\nWS : [ \\n]+ -> skip ;\n");
        writeFileSync(dir + "/EP.g4", "parser grammar EP;\noptions { tokenVocab = EL; }\ns : ID+ EOF ;\n");
        writeFileSync(dir + "/EL.g4", "lexer grammar EL;\nID : [a-z]+ ;\nWS : [ \\n]+ -> skip ;\n");
        writeFileSync(dir + "/input.txt", "ab cd\n");
    });

    afterEach(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    /**
     * Runs the interpreter in the test folder.
     *
     * @param args The command line arguments.
     *
     * @returns The output of the interpreter.
     */
    const run = (...args: string[]): string => {
        return execFileSync(process.execPath, ["--import", tsx, cli, ...args], { cwd: dir, encoding: "utf-8" });
    };

    it("parses with a combined grammar", () => {
        const output = run("s", "input.txt", "E.g4", "--tokens", "--tree");
        expect(output).toContain("[@0,0:1='ab',<ID>,1:0]");
        expect(output).toContain("(s:1 ab cd <EOF>)");

        // No profiling without --profile.
        expect(existsSync(dir + "/filename.csv")).toBe(false);
    }, 30000);

    it("parses with separate parser and lexer grammars", () => {
        expect(run("s", "input.txt", "EP.g4", "EL.g4", "--tree")).toContain("(s:1 ab cd <EOF>)");
    }, 30000);

    it("writes the profile to the given file", () => {
        run("s", "input.txt", "E.g4", "--profile", "profile.csv");

        const lines = readFileSync(dir + "/profile.csv", "utf-8").trim().split("\n");
        expect(lines[0]).toBe("Rule,Invocations,Time (ms),Total k,Max k,Ambiguities,DFA cache miss");
        expect(lines[1]).toMatch(/^s:0,2,/);
    }, 30000);
});
