/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { DOTGenerator } from "../../src/tool/DOTGenerator.js";
import { LexerGrammar } from "../../src/tool/index.js";

describe("DOTGenerator", () => {
    it("Bug #33 Escaping issues with backslash in .dot file comparison", async () => {
        const sourcePath = join(dirname(import.meta.url), "data/abbLexer.g4").substring("file:".length);
        const lexerGrammarText = await readFile(sourcePath, "utf8");
        const lexerGrammar = new LexerGrammar(lexerGrammarText);
        lexerGrammar.tool.process(lexerGrammar, false);

        const rule = lexerGrammar.getRule("EscapeSequence")!;
        const startState = lexerGrammar.atn!.ruleToStartState[rule.index]!;

        const dotGenerator = new DOTGenerator(lexerGrammar);
        const result = dotGenerator.getDOTFromState(startState, true);
        expect(result.indexOf(`s327 -> s335 [fontsize=11, fontname="Courier", arrowsize=.7, ` +
            String.raw`label = "'\\\\'", arrowhead = normal];`)).toBeGreaterThan(-1);
    });

    it("Bug #35 Tool crashes with --atn", async () => {
        const sourcePath = join(dirname(import.meta.url), "data/GoLexer.g4").substring("file:".length);
        const lexerGrammarText = await readFile(sourcePath, "utf8");
        const lexerGrammar = new LexerGrammar(lexerGrammarText);
        lexerGrammar.tool.process(lexerGrammar, false);

        const rule = lexerGrammar.getRule("EOS")!;
        const startState = lexerGrammar.atn!.ruleToStartState[rule.index]!;

        const dotGenerator = new DOTGenerator(lexerGrammar);
        const result = dotGenerator.getDOTFromState(startState, true);
        expect(result.indexOf(`s833 -> s835 [fontsize=11, fontname="Courier", arrowsize=.7, label = "EOF", ` +
            `arrowhead = normal];`)).toBeGreaterThan(-1);
    });

});
