/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { CharStream, CommonTokenStream, type Parser, type ParserRuleContext } from "antlr4ng";

await import("../../src/Tool.js"); // To kick off the loading of the tool

import { ParserATNFactory } from "../../src/automata/ParserATNFactory.js";
import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import type { ITargetGenerator } from "../../src/codegen/ITargetGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { CppTargetGenerator } from "../../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../../src/default-target-generators/CSharpTargetGenerator.js";
import { DartTargetGenerator } from "../../src/default-target-generators/DartTargetGenerator.js";
import { GoTargetGenerator } from "../../src/default-target-generators/GoTargetGenerator.js";
import { JavaTargetGenerator } from "../../src/default-target-generators/JavaTargetGenerator.js";
import { PHPTargetGenerator } from "../../src/default-target-generators/PHPTargetGenerator.js";
import { Python3TargetGenerator } from "../../src/default-target-generators/Python3TargetGenerator.js";
import { SwiftTargetGenerator } from "../../src/default-target-generators/SwiftTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../src/tool/index.js";
import { dummyConfiguration } from "../support/GenerationHelper.js";
import { ToolTestUtils } from "../ToolTestUtils.js";

const guardGrammar = `grammar T;
start: optionalRule suffix starRule suffix plusRule suffix EOF;
optionalRule: ID argument?;
starRule: ID argument*;
plusRule: ID argument+;
argument: (LP | LB | LC) A (RP | RB | RC);
suffix: LP B RP | SEMI;
ID: 'i'; A: 'a'; B: 'b'; LP: '('; LB: '['; LC: '{'; RP: ')'; RB: ']'; RC: '}'; SEMI: ';';
WS: [ \\t\\r\\n]+ -> skip;
`;

/**
 * Generates a parser for the given target without writing any files.
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
        },
    });

    const grammar = new Grammar(grammarText);
    grammar.tool.process(grammar, config, false);
    expect(grammar.ast.hasErrors).toBe(false);

    const factory = new ParserATNFactory(grammar);
    grammar.atn = factory.createATN();

    const gen = new CodeGenerator(grammar, generator, config.generationOptions);

    return gen.generateParser(config.generationOptions);
};

interface IGuardExpectation {
    name: string;
    generator: ITargetGenerator;
    guardTest: string;
    adaptivePredict: string;
}

const expectations: IGuardExpectation[] = [
    {
        name: "TypeScript",
        generator: new TypeScriptTargetGenerator(false),
        guardTest: "this.numberOfSyntaxErrors > 0",
        adaptivePredict: "this.interpreter.adaptivePredict",
    },
    {
        name: "Java",
        generator: new JavaTargetGenerator(false),
        guardTest: "getNumberOfSyntaxErrors() > 0",
        adaptivePredict: "getInterpreter().adaptivePredict",
    },
    {
        name: "CSharp",
        generator: new CSharpTargetGenerator(false),
        guardTest: "NumberOfSyntaxErrors > 0",
        adaptivePredict: "Interpreter.AdaptivePredict",
    },
    {
        name: "Cpp",
        generator: new CppTargetGenerator(false),
        guardTest: "getNumberOfSyntaxErrors() > 0",
        adaptivePredict: "adaptivePredict",
    },
    {
        name: "Go",
        generator: new GoTargetGenerator(false),
        guardTest: "p.HasError() || p.GetErrorHandler().InErrorRecoveryMode(p)",
        adaptivePredict: "AdaptivePredict",
    },
    {
        name: "Python3",
        generator: new Python3TargetGenerator(false),
        guardTest: "self.getNumberOfSyntaxErrors() > 0",
        adaptivePredict: "adaptivePredict",
    },
    {
        name: "PHP",
        generator: new PHPTargetGenerator(false),
        guardTest: "$this->getNumberOfSyntaxErrors() > 0",
        adaptivePredict: "adaptivePredict",
    },
    {
        name: "Dart",
        generator: new DartTargetGenerator(false),
        guardTest: "numberOfSyntaxErrors > 0",
        adaptivePredict: "adaptivePredict",
    },
    {
        name: "Swift",
        generator: new SwiftTargetGenerator(false),
        guardTest: "getNumberOfSyntaxErrors() > 0",
        adaptivePredict: "adaptivePredict",
    },
];

/**
 * Collects parser diagnostics for the generated parser.
 *
 * @param parser The parser to attach the collecting listener to.
 *
 * @returns The array which receives all reported messages.
 */
const collectDiagnostics = (parser: Parser): string[] => {
    const messages: string[] = [];
    parser.removeErrorListeners();
    parser.addErrorListener({
        syntaxError: (_recognizer, _offendingSymbol, _line, _column, message) => {
            messages.push(message);
        },
    });

    return messages;
};

describe("TestPredictionGuard", () => {
    it.each(expectations)("$name generates FIRST-set rejection guards", ({ generator, guardTest,
        adaptivePredict }) => {
        const code = generateParser(generator, guardGrammar);

        expect(code).toContain(adaptivePredict);
        expect(code).toContain(guardTest);

        const guardCount = code.split(guardTest).length - 1;
        expect(guardCount).toBe(4);
    });

    it("does not guard a decision with multiple consuming alternatives", () => {
        const grammar = `grammar T;
            s: ID (ID | ID A)*;
            ID: 'i'; A: 'a'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).not.toContain("numberOfSyntaxErrors");
    });

    it("does not guard a decision with an opaque semantic predicate", () => {
        const grammar = `grammar T;
            s: ID (A {true}? | B)*;
            ID: 'i'; A: 'a'; B: 'b'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).not.toContain("numberOfSyntaxErrors");
    });

    it("does not guard a non-greedy decision without LL(1) lookahead data", () => {
        const grammar = `grammar T;
            s: ID argument*? suffix SEMI;
            argument: LP A RP;
            suffix: LP B RP;
            ID: 'i'; A: 'a'; B: 'b'; LP: '('; RP: ')'; SEMI: ';'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).toContain("adaptivePredict");
        expect(code).not.toContain("numberOfSyntaxErrors");
    });

    it("does not guard a nullable consuming alternative", () => {
        const grammar = `grammar T;
            s: (A?)?;
            A: 'a'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).not.toContain("numberOfSyntaxErrors");
    });

    it("skips prediction outside FIRST and keeps it inside FIRST", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrPredictionGuard-"));
        try {
            const options = ToolTestUtils.createOptionsForToolTests("T.g4", guardGrammar, "TParser", "TLexer",
                false, false, "start", "", false, false);
            const [lexer, parser] = await ToolTestUtils.setupRecognizers(options, tempDir);

            const predictSpy = vi.spyOn(parser.interpreter, "adaptivePredict");

            const diagnostics: string[] = [];
            parser.removeErrorListeners();
            parser.addErrorListener({
                syntaxError: (_recognizer, _offendingSymbol, _line, _column, message) => {
                    diagnostics.push(message);
                },
            });

            const parse = (input: string): { predictions: number; diagnostics: string[]; } => {
                diagnostics.length = 0;
                predictSpy.mockClear();

                lexer.inputStream = CharStream.fromString(input);
                parser.tokenStream = new CommonTokenStream(lexer);

                const typedParser = parser as Parser & { start: () => ParserRuleContext; };
                typedParser.start();

                return { predictions: predictSpy.mock.calls.length, diagnostics: [...diagnostics] };
            };

            // Every rule consumes one mandatory argument in the plus case. No loop or optional decision needs
            // adaptive prediction when the next token cannot start an argument.
            const withoutContinuation = parse("i;i;i(a);");
            expect(withoutContinuation.predictions).toBe(0);
            expect(withoutContinuation.diagnostics).toEqual([]);

            // The optional, the star, and the plus loop each need one prediction when LEFT_PAREN follows.
            const withContinuation = parse("i(a);i(a);i(a)(a);");
            expect(withContinuation.predictions).toBe(3);
            expect(withContinuation.diagnostics).toEqual([]);

            // A star loop predicts once on entry and once after the first argument.
            const starWithTwoArguments = parse("i;i(a)(a);i(a);");
            expect(starWithTwoArguments.predictions).toBe(2);
            expect(starWithTwoArguments.diagnostics).toEqual([]);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("keeps diagnostics and parse trees unchanged for invalid input", async () => {
        const grammar = `grammar T;
            start: atom EOF;
            atom: ID argument*;
            argument: LP ID RP;
            ID: 'i'; LP: '('; RP: ')'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const parsed = new Grammar(grammar);
        parsed.tool.process(parsed, dummyConfiguration(), false);
        parsed.atn = new ParserATNFactory(parsed).createATN();

        const normalizeTree = (tree: string): string => {
            return tree.replace(/:\d+/g, "");
        };

        const parseWithInterpreter = (input: string): { tree: string; diagnostics: string[]; } => {
            const lexer = parsed.createLexerInterpreter(CharStream.fromString(input));
            lexer.removeErrorListeners();
            const tokens = new CommonTokenStream(lexer);
            const parser = parsed.createGrammarParserInterpreter(tokens);
            const diagnostics = collectDiagnostics(parser);
            const tree = parser.parse(parsed.getRule("start")!.index);

            return { tree: normalizeTree(tree.toStringTree(parser)), diagnostics };
        };

        const tempDir = mkdtempSync(join(tmpdir(), "AntlrPredictionGuardInvalid-"));
        try {
            const options = ToolTestUtils.createOptionsForToolTests("T.g4", grammar, "TParser", "TLexer",
                false, false, "start", "", false, false);
            const [lexer, parser] = await ToolTestUtils.setupRecognizers(options, tempDir);
            lexer.removeErrorListeners();

            for (const input of ["i;", "i(a);", "i(;", "i(a", "i(a));"]) {
                const expected = parseWithInterpreter(input);

                const diagnostics: string[] = [];
                parser.removeErrorListeners();
                parser.addErrorListener({
                    syntaxError: (_recognizer, _offendingSymbol, _line, _column, message) => {
                        diagnostics.push(message);
                    },
                });

                lexer.inputStream = CharStream.fromString(input);
                parser.tokenStream = new CommonTokenStream(lexer);

                const typedParser = parser as Parser & { start: () => ParserRuleContext; };
                const tree = normalizeTree(typedParser.start().toStringTree(parser));

                expect(diagnostics, input).toEqual(expected.diagnostics);

                // Parse-tree shape is compared only for valid input. Error recovery inserts different synthetic
                // nodes in generated parsers and interpreters, which is unrelated to prediction.
                if (expected.diagnostics.length === 0) {
                    expect(tree, input).toBe(expected.tree);
                }
            }
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });
});
