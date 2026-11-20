/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { CharStream, CommonTokenStream, type Lexer, type Parser, type ParserRuleContext } from "antlr4ng";

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
 * @param forceAtn Whether every decision must use ATN prediction.
 *
 * @returns The generated parser code.
 */
const generateParser = (generator: ITargetGenerator, grammarText: string, forceAtn = false): string => {
    generator.setUp();
    const config = defineConfig({
        forceAtn,
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

const parseStart = (parser: Parser): { tree: string; diagnostics: string[]; } => {
    const diagnostics = collectDiagnostics(parser);
    const typedParser = parser as Parser & { start: () => ParserRuleContext; };
    const tree = typedParser.start().toStringTree(parser).replace(/:\d+/g, "");

    return { tree, diagnostics };
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

    it.each(expectations)("$name preserves forced-ATN prediction", ({ generator, guardTest, adaptivePredict }) => {
        const code = generateParser(generator, guardGrammar, true);

        expect(code).toContain(adaptivePredict);
        expect(code).not.toContain(guardTest);
    });

    it("does not declare an unused Go guard local in forced-ATN mode", () => {
        const grammar = `grammar T;
            s: A? EOF;
            A: 'a';
        `;

        const code = generateParser(new GoTargetGenerator(false), grammar, true);
        expect(code).toContain("AdaptivePredict");
        expect(code).not.toContain("var _la int");
    });

    it.each(["*", "+"])("does not guard a %s decision with multiple consuming alternatives", (quantifier) => {
        const grammar = `grammar T;
            s: (A | A B)${quantifier} A EOF;
            A: 'a'; B: 'b'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).toContain("adaptivePredict");
        expect(code).not.toContain("numberOfSyntaxErrors");
    });

    it("does not guard a decision with an opaque semantic predicate", () => {
        const grammar = `grammar T;
            s: ({true}? A)* A EOF;
            A: 'a'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).toContain("adaptivePredict");
        expect(code).not.toContain("numberOfSyntaxErrors");
    });

    it.each([
        { quantifier: "?", input: "b" },
        { quantifier: "*", input: "b" },
        { quantifier: "+", input: "ab" },
    ])("preserves $quantifier diagnostics when a predicate hides exit lookahead", async ({ quantifier, input }) => {
        const grammar = `grammar T;
            start: A${quantifier} {false}? B EOF;
            A: 'a'; B: 'b';
        `;

        const tempDir = mkdtempSync(join(tmpdir(), "AntlrPredictionGuardPredicate-"));
        try {
            const options = ToolTestUtils.createOptionsForToolTests("T.g4", grammar, "TParser", "TLexer",
                false, false, "start", input, false, false);
            const [, parser] = await ToolTestUtils.setupRecognizers(options, join(tempDir, "normal"));
            const [, forcedParser] = await ToolTestUtils.setupRecognizers({ ...options, forceAtn: true },
                join(tempDir, "forced"));

            const expected = parseStart(forcedParser);
            expect(expected.diagnostics).toEqual(["no viable alternative at input 'b'"]);
            expect(parseStart(parser)).toEqual(expected);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
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

    it("does not guard a nullable rule-reference optional body", () => {
        const grammar = `grammar T;
            s: r? B EOF;
            r: A?;
            A: 'a'; B: 'b'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).toContain("adaptivePredict");
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

            const parse = (input: string, reportPreviousError = false):
            { predictions: number; diagnostics: string[]; } => {
                diagnostics.length = 0;
                predictSpy.mockClear();

                lexer.inputStream = CharStream.fromString(input);
                parser.tokenStream = new CommonTokenStream(lexer);
                if (reportPreviousError) {
                    parser.notifyErrorListeners("previous error");
                }

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

            // Once an error has been reported, every guard retains adaptive prediction even outside FIRST.
            const afterReportedError = parse("i;i;i(a);", true);
            expect(afterReportedError.predictions).toBe(3);
            expect(afterReportedError.diagnostics).toEqual(["previous error"]);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("keeps diagnostics and recovered parse trees unchanged", async () => {
        const grammar = `grammar T;
            start: A item* A EOF;
            item: A B C;
            A: 'a'; B: 'b'; C: 'c'; D: 'd'; WS: [ \\t\\r\\n]+ -> skip;
        `;

        const code = generateParser(new TypeScriptTargetGenerator(false), grammar);
        expect(code).toContain("numberOfSyntaxErrors");
        expect(code).toContain("adaptivePredict");

        const parse = (lexer: Lexer, parser: Parser,
            input: string): { tree: string; diagnostics: string[]; } => {
            lexer.inputStream = CharStream.fromString(input);
            parser.tokenStream = new CommonTokenStream(lexer);

            return parseStart(parser);
        };

        const tempDir = mkdtempSync(join(tmpdir(), "AntlrPredictionGuardInvalid-"));
        try {
            const guardedOptions = ToolTestUtils.createOptionsForToolTests("T.g4", grammar, "TParser", "TLexer",
                false, false, "start", "", false, false);
            const forcedOptions = { ...guardedOptions, forceAtn: true };
            const [guardedLexer, guardedParser] = await ToolTestUtils.setupRecognizers(guardedOptions,
                join(tempDir, "guarded"));
            const [forcedLexer, forcedParser] = await ToolTestUtils.setupRecognizers(forcedOptions,
                join(tempDir, "forced"));
            guardedLexer.removeErrorListeners();
            forcedLexer.removeErrorListeners();

            const cases = [
                { input: "aa", hasDiagnostics: false },
                { input: "aabca", hasDiagnostics: false },
                { input: "aaca", hasDiagnostics: true },
                { input: "aabcaabc", hasDiagnostics: true },
                { input: "ad", hasDiagnostics: true },
            ];
            for (const { input, hasDiagnostics } of cases) {
                const expected = parse(forcedLexer, forcedParser, input);
                const actual = parse(guardedLexer, guardedParser, input);

                expect(actual.diagnostics.length > 0, input).toBe(hasDiagnostics);
                expect(actual.diagnostics, input).toEqual(expected.diagnostics);
                expect(actual.tree, input).toBe(expected.tree);
            }
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });
});
