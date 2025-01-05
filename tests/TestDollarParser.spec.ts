/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { mkdtempSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ToolTestUtils } from "./ToolTestUtils.js";

describe("TestDollarParser", () => {
    it("testSimpleCall", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrDollarParser"));

        const orgLog = console.log;
        let output = "";
        console.log = (str) => {
            output += str;
        };

        try {
            const grammar = "grammar T;\n" +
                "a : ID  { console.log($parser.getSourceName()); }\n" +
                "  ;\n" +
                "ID : 'a'..'z'+ ;\n";

            const errors = await ToolTestUtils.execParser("T.g4", grammar, "TParser", "TLexer", "a", "x", false, true,
                tempDir);
            expect(output.includes("input")).toBe(true);
            expect(errors.all).toHaveLength(0);
        } finally {
            console.log = orgLog;
            rmdirSync(tempDir, { recursive: true });
        }
    });
});
