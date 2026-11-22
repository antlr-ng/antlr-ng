/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it, vi } from "vitest";

import { CharStream, CommonTokenStream } from "antlr4ng";

import { defineConfig } from "../../src/config/config.js";
import { JavaTargetGenerator } from "../../src/default-target-generators/JavaTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { IssueCode } from "../../src/tool/Issues.js";
import { Grammar, LexerGrammar } from "../../src/tool/index.js";
import { ErrorQueue } from "../support/ErrorQueue.js";
import { generate } from "../support/GenerationHelper.js";

/** A combined grammar with a left-recursive rule and lexer commands. */
const expressions =
    "grammar Expr;\n" +
    "s : e EOF ;\n" +
    "e : e '*' e | e '+' e | INT ;\n" +
    "INT : [0-9]+ ;\n" +
    "COMMENT : '#' ~[\\n]* -> channel(HIDDEN) ;\n" +
    "WS : [ \\n]+ -> skip ;\n";

/**
 * Generates the grammar and returns the language independent files.
 *
 * @param grammar The grammar to generate.
 * @param generators The target generators to configure.
 *
 * @returns The errors and the generated .interp and .tokens files.
 */
const metadata = (grammar: string, generators: Array<JavaTargetGenerator | TypeScriptTargetGenerator>) => {
    const result = generate(grammar, { generateInterpreterData: true }, (config) => {
        config.generators = generators;
    });
    const files = new Map([...result.files].filter(([name]) => {
        return name.endsWith(".interp") || name.endsWith(".tokens");
    }));

    return { errors: result.queue.errors.map((error) => { return error.toString(); }), files };
};

describe("Processing without target generator", () => {
    it("writes the metadata of a grammar with language None", () => {
        const java = new JavaTargetGenerator();
        java.setUp();
        const expected = metadata(expressions, [java]);
        expect(expected.errors).toEqual([]);

        const none = expressions.replace("grammar Expr;", "grammar Expr;\noptions { language = None; }");
        const result = generate(none, {}, (config) => {
            config.generators = [];
        });
        expect(result.queue.errors.map((error) => { return error.toString(); })).toEqual([]);
        expect([...result.files.keys()].sort()).toEqual([
            "Expr.g4", "Expr.interp", "Expr.tokens", "ExprLexer.interp", "ExprLexer.tokens",
        ]);

        // The same files as with a generator: the code of predicates and actions is not part of the ATN.
        for (const [name, content] of expected.files) {
            expect(result.files.get(name), name).toBe(content);
        }
    });

    it("reports a grammar which needs a generator", () => {
        const result = generate(expressions, {}, (config) => {
            config.generators = [];
        });
        expect(result.queue.errors.map((error) => { return error.code; })).toEqual([IssueCode.NoTargetGenerators]);
        expect([...result.files.keys()]).toEqual(["Expr.g4"]);
    });

    it("reports a dependency list without generator", () => {
        const log = vi.spyOn(console, "log").mockImplementation(() => { /**/ });
        try {
            const none = expressions.replace("grammar Expr;", "grammar Expr;\noptions { language = None; }");
            const result = generate(none, { generateDependencies: true }, (config) => {
                config.generators = [];
            });
            expect(result.queue.errors.map((error) => { return error.code; }))
                .toEqual([IssueCode.NoTargetGenerators]);
            expect(log).not.toHaveBeenCalled();
        } finally {
            log.mockRestore();
        }
    });

    it("builds the ATN for interpreters", () => {
        const g = new Grammar(expressions);
        g.fileName = "Expr.g4";
        const queue = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(queue);
        g.tool.process(g, defineConfig({ generationOptions: { outputDirectory: "/tmp/no-generator" } }), false);
        expect(queue.all).toEqual([]);

        const lexer = g.createLexerInterpreter(CharStream.fromString("1 + 2 * 3 # note\n"));
        const parser = g.createGrammarParserInterpreter(new CommonTokenStream(lexer));
        const tree = parser.parse(g.getRule("s")!.index);

        // The interpreter adds the alternative numbers. Multiplication binds stronger (precedence predicates).
        expect(tree.toStringTree(parser)).toBe("(s:1 (e:2 (e:1 1) + (e:1 (e:1 2) * (e:1 3))) <EOF>)");
    });

    it("reports invalid lexer commands like a generator does", () => {
        const lexer = "lexer grammar L;\nA : 'a' -> skip(1) ;\nB : 'b' -> channel ;\nC : 'c' -> unknown ;\n";

        const errors = (generators: TypeScriptTargetGenerator[]): IssueCode[] => {
            const g = new LexerGrammar(lexer);
            g.fileName = "L.g4";
            const queue = new ErrorQueue(g.tool.errorManager);
            g.tool.errorManager.addListener(queue);
            g.tool.process(g, defineConfig({ generators, generationOptions: { outputDirectory: "/tmp/no-gen" } }),
                false);

            return queue.errors.map((error) => { return error.code; });
        };

        const ts = new TypeScriptTargetGenerator();
        ts.setUp();
        const expected = [
            IssueCode.UnwantedLexerCommandArgument,
            IssueCode.MissingLexerCommandArgument,
            IssueCode.InvalidLexerCommand,
        ];
        expect(errors([ts])).toEqual(expected);
        expect(errors([])).toEqual(expected);
    });

    it("sets up a generator which is only passed to process", () => {
        const g = new LexerGrammar("lexer grammar L;\nA : 'a' -> skip(1) ;\n");
        g.fileName = "L.g4";
        const queue = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(queue);

        // The generator is not in the configuration and was not set up before.
        g.tool.process(g, defineConfig({ generationOptions: { outputDirectory: "/tmp/no-gen" } }), false,
            new TypeScriptTargetGenerator());
        expect(queue.errors.map((error) => { return error.code; })).toEqual([IssueCode.UnwantedLexerCommandArgument]);
    });
});

describe("Processing with several target generators", () => {
    it("generates a left-recursive grammar for each of them", () => {
        const ts = new TypeScriptTargetGenerator();
        const java = new JavaTargetGenerator();
        const result = generate(expressions, {}, (config) => {
            config.generators = [ts, java];
        });
        expect(result.queue.errors.map((error) => { return error.toString(); })).toEqual([]);

        // Each generator renders its own precedence predicates.
        expect(result.files.get("ExprParser.ts")).toContain("this.precpred(this.context, 2)");
        expect(result.files.get("ExprParser.java")).toContain("precpred(_ctx, 2)");
        expect(result.files.get("ExprParser.java")).not.toContain("this.context");
        expect(result.files.has("ExprLexer.ts")).toBe(true);
        expect(result.files.has("ExprLexer.java")).toBe(true);
    });
});
