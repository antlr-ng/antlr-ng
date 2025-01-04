/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DOTGenerator } from "../../src/tool/DOTGenerator.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";

describe("DOTGenerator", () => {
    let lexerGrammar: Grammar;
    let dotGenerator: DOTGenerator;

    beforeAll(async () => {
        const sourcePath = join(dirname(import.meta.url), "data/abbLexer.g4").substring("file:".length);
        const lexerGrammarText = await readFile(sourcePath, "utf8");
        lexerGrammar = new LexerGrammar(lexerGrammarText);
        lexerGrammar.tool.process(lexerGrammar, false);

    });

    beforeEach(() => {
        dotGenerator = new DOTGenerator(lexerGrammar);
    });

    it("Bug #33", () => {
        const rule = lexerGrammar.getRule("EscapeSequence")!;
        const startState = lexerGrammar.atn!.ruleToStartState[rule.index]!;
        const result = dotGenerator.getDOTFromState(startState, true);
        expect(result.indexOf(`s327 -> s335 [fontsize=11, fontname="Courier", arrowsize=.7, ` +
            String.raw`label = "'\\\\'", arrowhead = normal];`)).toBeGreaterThan(-1);
    });

});
