/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

await import("../../src/Tool.js"); // To kick off the loading of the tool

import { ParserATNFactory } from "../../src/automata/ParserATNFactory.js";
import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import type { ITargetGenerator } from "../../src/codegen/ITargetGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { CppTargetGenerator } from "../../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../../src/default-target-generators/CSharpTargetGenerator.js";
import { SwiftTargetGenerator } from "../../src/default-target-generators/SwiftTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../src/tool/index.js";

/**
 * Generates the parser code for a grammar with the given generator, without writing any files.
 *
 * @param generator The target generator to use.
 * @param grammarText The grammar to process.
 *
 * @returns The generated parser code.
 */
const generateParser = (generator: ITargetGenerator, grammarText: string): string => {
    generator.setUp();
    const config = defineConfig({
        grammarFiles: [],
        generators: [generator],
        generationOptions: {
            outputDirectory: "/tmp",
        }
    });

    const grammar = new Grammar(grammarText);
    grammar.tool.process(grammar, config, false);
    expect(grammar.ast.hasErrors).toBe(false);

    const factory = new ParserATNFactory(grammar);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, generator, config.generationOptions);

    return gen.generateParser(config.generationOptions);
};

describe("TestLabelCodeGeneration", () => {
    // Labels which are keywords in the target language are declared with their escaped name, so token and rule
    // property references must use the escaped name too.
    const grammar = "grammar K;\n" +
        "s : class=INT try=b {\n" +
        "    $class.int; $class.channel; $class.text; $try.text; $try.start; $try.stop; $try.ctx;\n" +
        "} ;\n" +
        "b : INT ;\n" +
        "INT : [0-9]+ ;\n";

    it.each([
        ["TypeScript", new TypeScriptTargetGenerator(false), [
            "localContext._class_ = this.match(KParser.INT);",
            "Number(localContext._class_?.text ?? '0'); localContext._class_?.channel ?? 0; " +
            "(localContext._class_?.text ?? '');",
            "(localContext._try_ != null ? this.tokenStream.getTextFromRange(localContext._try_.start, " +
            "localContext._try_.stop) : ''); (localContext._try_!.start); (localContext._try_!.stop); " +
            "localContext._try_;",
        ]],
        ["Cpp", new CppTargetGenerator(false), [
            "(_localctx->class_ != nullptr ? std::stoi(_localctx->class_->getText()) : 0)",
            "(_localctx->class_ != nullptr ? _localctx->class_->getChannel() : 0)",
            "(_localctx->try_ != nullptr ? _input->getText(_localctx->try_->start, _localctx->try_->stop) : nullptr)",
            "(_localctx->try_ != nullptr ? (_localctx->try_->stop) : nullptr)",
        ]],
        ["CSharp", new CSharpTargetGenerator(false), [
            "(_localctx.@class!=null?int.Parse(_localctx.@class.Text):0)",
            "(_localctx.@class != null ? _localctx.@class.Channel:0)",
            "(_localctx.@try != null ? TokenStream.GetText(_localctx.@try.Start, _localctx.@try.Stop) : null)",
            "(_localctx.@try != null ? (_localctx.@try.Stop) : null)",
        ]],
        ["Swift", new SwiftTargetGenerator(false), [
            "(_localctx.castdown(SContext.self).`class` != nil ? " +
            "(Int(_localctx.castdown(SContext.self).`class`!.getText()!) ?? 0) : 0);",
            "_localctx.castdown(SContext.self).`try`?.stop; _localctx.castdown(SContext.self).`try`;",
        ]],
    ])("Keyword labels in property references (%s)", (_name, generator, expected) => {
        const code = generateParser(generator, grammar);
        for (const line of expected) {
            expect(code).toContain(line);
        }

        // No reference uses the raw keyword as the member name.
        expect(code).not.toMatch(/(\.|->|_)(class|try)\b(?![`_])/);
    });
});
