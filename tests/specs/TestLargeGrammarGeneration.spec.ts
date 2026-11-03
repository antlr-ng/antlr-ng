/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

describe("Large grammar generation", () => {
    it("renders parsers with more lines than a spread call can take", () => {
        // `lines.push(...other)` passes every line as a separate argument, which exceeds the call stack of a normal
        // Node.js process for about 125k lines. 2000 rules render to more than 140k lines in each generator. The test
        // workers have a larger stack, so the rendering runs in a child process with the default stack size.
        const ruleCount = 2000;
        const root = fileURLToPath(new URL("../..", import.meta.url));
        const script = fileURLToPath(new URL("../support/renderLargeGrammar.ts", import.meta.url));
        const child = spawnSync(process.execPath, ["--import", "tsx", script, String(ruleCount)],
            { cwd: root, encoding: "utf8" });

        expect(child.stderr).toBe("");
        const result = JSON.parse(child.stdout) as Record<string, number | string>;
        expect(result.errors).toBe(0);
        for (const language of ["TypeScript", "Cpp", "CSharp"]) {
            expect(result[language]).toBeGreaterThan(140000);
        }
    }, 60000);
});
