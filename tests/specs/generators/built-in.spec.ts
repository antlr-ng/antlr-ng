/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, it } from "vitest";

import { defineConfig } from "../../../src/config/config.js";
import { Grammar } from "../../../src/index.js";
import { Tool } from "../../../src/Tool.js";

import { TypeScriptTargetGenerator } from "../../../src/default-target-generators/TypeScriptTargetGenerator.js";

describe("Test built-in generators", () => {

    it("test TypeScript", () => {
        const configuration = defineConfig({
            grammarFiles: ["T.g4"],
            outputDirectory: "out",
            generators: [new TypeScriptTargetGenerator()],
        });

        const grammar = new Grammar("grammar T;\n" +
            "a : A B ;" +
            "A: 'foo' ;" +
            "B: 'bar' ;");

        const tool = new Tool();
        grammar.tool = tool;
        tool.process(grammar, configuration, true);
    });
});
