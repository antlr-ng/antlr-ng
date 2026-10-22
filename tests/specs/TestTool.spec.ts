/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it, vi } from "vitest";

import { CharStream, CommonTokenStream, LexerInterpreter, SemanticContext } from "antlr4ng";

import { defineConfig } from "../../src/config/config.js";
import { BuildDependencyGenerator } from "../../src/tool/BuildDependencyGenerator.js";
import { ErrorManager } from "../../src/tool/ErrorManager.js";
import { Issue } from "../../src/tool/Issue.js";
import { IssueCode } from "../../src/tool/Issues.js";
import { ToolListener } from "../../src/tool/ToolListener.js";
import { generateRandomFilename } from "../../src/support/fs-helpers.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar, LexerGrammar, Tool } from "../../src/tool/index.js";
import { ErrorQueue } from "../support/ErrorQueue.js";
import { dummyConfiguration, generate, tsGenerator } from "../support/GenerationHelper.js";

describe("Tool coverage", () => {
    describe("BuildDependencyGenerator", () => {
        it("lists generated files and dependencies of a combined grammar", () => {
            const tool = new Tool();
            const g = new Grammar("grammar Dep;\noptions { tokenVocab = Other; }\na : A ;\nA : 'a' ;");
            g.fileName = "Dep.g4";

            const options = defineConfig({
                generationOptions: {
                    outputDirectory: "file:///tmp/out/",
                    generateListener: true,
                    generateVisitor: true,
                },
            }).generationOptions;

            const generator = new BuildDependencyGenerator(tool, g, options, tsGenerator, "my lib");
            expect(generator.getGenerator().targetGenerator).toBe(tsGenerator);

            const generated = generator.getGeneratedFileList().map((url) => { return url.toString(); });
            expect(generated).toEqual([
                "file:///tmp/out/DepParser.ts",
                "file:///tmp/out/Dep.tokens",
                "file:///tmp/out/DepLexer.ts",
                "file:///tmp/out/DepLexer.tokens",
                "file:///tmp/out/DepListener.ts",
                "file:///tmp/out/DepBaseListener.ts",
                "file:///tmp/out/DepVisitor.ts",
                "file:///tmp/out/DepBaseVisitor.ts",
            ]);

            expect(generator.getNonImportDependenciesFileList()).toEqual(["my lib/Other.tokens"]);
            expect(generator.getDependenciesFileList()).toEqual(["my lib/Other.tokens"]);

            const dependencies = generator.getDependencies();
            expect(dependencies.split("\n")[0]).toBe("my lib/Other.tokens");
            expect(dependencies).toContain("file:///tmp/out/DepParser.ts : Dep.g4");
            expect(dependencies).toContain("file:///tmp/out/DepBaseVisitor.ts : Dep.g4");
        });

        it("uses the current directory for token vocabularies without lib directory", () => {
            const tool = new Tool();
            const g = new LexerGrammar("lexer grammar DepL;\noptions { tokenVocab = Other; }\nA : 'a' ;");
            g.fileName = "DepL.g4";

            const options = defineConfig({ generationOptions: { outputDirectory: "file:///tmp/out/" } })
                .generationOptions;

            const generator = new BuildDependencyGenerator(tool, g, options, tsGenerator);
            expect(generator.getNonImportDependenciesFileList()).toEqual(["Other.tokens"]);
            expect(generator.getGeneratedFileList().map((url) => { return url.toString(); })).toEqual([
                "file:///tmp/out/DepL.ts",
                "file:///tmp/out/DepL.tokens",
            ]);
            expect(generator.getDependencies()).toBe("Other.tokens\nfile:///tmp/out/DepL.ts : DepL.g4\n" +
                "file:///tmp/out/DepL.tokens : DepL.g4");
        });

        it("includes imported grammars", () => {
            const tool = new Tool();
            const root = new Grammar("grammar Root;\nimport Imported;\na : b ;");
            root.fileName = "Root.g4";
            const imported = new Grammar("parser grammar Imported;\nb : B ;");
            imported.fileName = "Imported.g4";
            root.importedGrammars.push(imported);

            const options = defineConfig({ generationOptions: { outputDirectory: "file:///tmp/out/" } })
                .generationOptions;
            const generator = new BuildDependencyGenerator(tool, root, options, tsGenerator, "/lib");

            expect(generator.getDependenciesFileList()).toEqual(["/lib/Imported.g4"]);
            expect(generator.getGeneratedFileList().map((url) => { return url.toString(); }))
                .toContain("file:///tmp/out/Imported.g4");
        });

        it("is used by the tool when dependency generation is requested", () => {
            const log = vi.spyOn(console, "log").mockImplementation(() => { /**/ });
            try {
                const result = generate("grammar DepT;\na : A ;\nA : 'a' ;", { generateDependencies: true },
                    (config) => {
                        config.generationOptions.outputDirectory = "file:///tmp/out/";
                    });
                expect(result.queue.errors).toHaveLength(0);
                expect(result.files.has("DepTParser.ts")).toBe(false);
                expect(log).toHaveBeenCalledTimes(1);
                const lines = (log.mock.calls[0][0] as string).split("\n");
                expect(lines).toHaveLength(4);
                expect(lines[0]).toMatch(/^file:\/\/\/tmp\/out\/DepTParser\.ts : \/tmp\/coverage-[^/]+\/DepT\.g4$/);
                expect(lines[1]).toMatch(/^file:\/\/\/tmp\/out\/DepT\.tokens : /);
                expect(lines[2]).toMatch(/^file:\/\/\/tmp\/out\/DepTLexer\.ts : /);
                expect(lines[3]).toMatch(/^file:\/\/\/tmp\/out\/DepTLexer\.tokens : /);
            } finally {
                log.mockRestore();
            }
        });
    });

    describe("ErrorManager and ToolListener", () => {
        it("emits one-off issues only once", () => {
            const manager = new ErrorManager();
            manager.configure(defineConfig({}).messageFormatOptions);
            const queue = new ErrorQueue(manager);
            manager.addListener(queue);

            manager.toolError(IssueCode.WarningTreatedAsErrors);
            manager.toolError(IssueCode.WarningTreatedAsErrors);
            manager.toolError(IssueCode.CannotWriteFile, new Error("disk full"), "out.ts", "disk full");

            expect(queue.errors).toHaveLength(2);
            expect(manager.errors).toBe(2);
            expect(queue.errors[0].toString()).toBe("error(" + IssueCode.WarningTreatedAsErrors +
                "): <unknown>::: warning treated as error");
            expect(queue.errors[1].toString()).toContain("cannot write file out.ts: disk full");
            expect(queue.errors[1].paramsAsString).toBe("out.ts, disk full");
            expect(manager.errorTypes.has(IssueCode.CannotWriteFile)).toBe(true);
        });

        it("forwards info messages, removes listeners and reports format settings", () => {
            const manager = new ErrorManager();
            manager.configure(defineConfig({ messageFormatOptions: { singleLine: false } }).messageFormatOptions);
            expect(manager.formatWantsSingleLineMessage()).toBe(false);

            const queue = new ErrorQueue(manager);
            manager.addListener(queue);
            manager.info("hello");
            expect(queue.infos).toEqual(["hello"]);

            manager.removeListener(queue);
            manager.removeListener(queue); // Not registered anymore, no effect.

            // Without listeners the default listener (console) is used.
            const log = vi.spyOn(console, "log").mockImplementation(() => { /**/ });
            const error = vi.spyOn(console, "error").mockImplementation(() => { /**/ });
            const warn = vi.spyOn(console, "warn").mockImplementation(() => { /**/ });
            try {
                manager.info("multi\nline");
                manager.syntaxError(IssueCode.SyntaxError, "T.g4", 3, 4, undefined, "boom");
                manager.grammarError(IssueCode.ImplicitTokenDefinition, "T.g4", null, "A");

                expect(log).toHaveBeenCalledWith("multi\nline");
                expect(error).toHaveBeenCalledWith("error(" + IssueCode.SyntaxError +
                    "): T.g4:3:4: syntax error: boom");
                expect(warn).toHaveBeenCalledWith("warning(" + IssueCode.ImplicitTokenDefinition +
                    "): T.g4::: implicit definition of token A in parser");
            } finally {
                log.mockRestore();
                error.mockRestore();
                warn.mockRestore();
            }

            expect(queue.infos).toEqual(["hello"]);
        });

        it("single line mode replaces line breaks in listener output", () => {
            const manager = new ErrorManager();
            manager.configure(defineConfig({}).messageFormatOptions);
            const listener = new ToolListener(manager);

            const log = vi.spyOn(console, "log").mockImplementation(() => { /**/ });
            const error = vi.spyOn(console, "error").mockImplementation(() => { /**/ });
            try {
                listener.info("a\nb");
                expect(log).toHaveBeenCalledWith("a b");

                const issue = new Issue(IssueCode.CannotWriteFile, defineConfig({}).messageFormatOptions,
                    { line: -1, column: -1, arg: "x\ny", arg2: "z" });
                listener.error(issue);
                expect(error).toHaveBeenCalledWith("error(" + IssueCode.CannotWriteFile + "): <unknown>::: cannot " +
                    "write file x y: z");
            } finally {
                log.mockRestore();
                error.mockRestore();
            }
        });

        it("renders verbose messages with exception details", () => {
            const options = defineConfig({}).messageFormatOptions;
            const cause = new Error("the cause");
            const issue = new Issue(IssueCode.InternalError, options,
                { line: -1, column: -1, arg: "oops", error: cause }, true);

            const text = issue.toString();
            expect(text).toContain("the cause");
            expect(text).toContain("oops");
            expect(issue.severity).toBe(2);

            const copy = Issue.fromIssue(issue);
            expect(copy).not.toBe(issue);
            expect(copy.toString()).toBe(text);
            expect(copy.paramsAsString).toBe("oops");
        });

        it("reports internal errors on the console", () => {
            const error = vi.spyOn(console, "error").mockImplementation(() => { /**/ });
            try {
                ErrorManager.internalError("plain");
                expect(error).toHaveBeenCalledTimes(1);
                expect(error.mock.calls[0][0]).toMatch(/^internal error: .*plain$/);

                ErrorManager.internalError("with cause", new Error("cause"));
                expect(error).toHaveBeenCalledTimes(2);
                expect(error.mock.calls[1][0]).toContain("Exception Error: cause@");

                expect(() => {
                    ErrorManager.fatalInternalError("fatal", new Error("cause"));
                }).toThrow("fatal");
                expect(error).toHaveBeenCalledTimes(3);
            } finally {
                error.mockRestore();
            }
        });
    });

    describe("Grammar", () => {
        it("maps predicate indexes to predicate ASTs", () => {
            const g = new Grammar(
                "grammar Pred;\n" +
                "a : {first()}? A | {second()}? B ;\n" +
                "b : {third()}? A ;\n");
            g.tool.process(g, dummyConfiguration(), false);

            const map = g.getIndexToPredicateMap();
            expect([...map.keys()]).toEqual([0, 1, 2]);
            expect(map.get(1)!.getText()).toBe("{second()}?");
            expect(g.getPredicateDisplayString(new SemanticContext.Predicate(0, 1, false))).toBe("{second()}?");
            expect(g.getPredicateDisplayString(new SemanticContext.Predicate(1, 2, false))).toBe("{third()}?");
        });

        it("reports token and char types", () => {
            const parser = new Grammar("grammar Types;\na : A B ;\nA : 'a' ;\nB : 'b' ;");
            parser.tool.process(parser, dummyConfiguration(), false);
            expect(parser.getMaxCharValue()).toBe(0x1FFFF);
            expect(parser.getTokenTypes().toString()).toBe("{1..2}");

            const lexer = new LexerGrammar("lexer grammar TypesL;\nA : 'a' ;");
            lexer.tool.process(lexer, dummyConfiguration(), false);
            expect(lexer.getTokenTypes().toString()).toBe("{0..131071}");
            expect(lexer.getAllCharValues().toString()).toBe("{0..131071}");
        });

        it("rule helpers: equality, hashes, string rendering and label resolution", () => {
            const g = new Grammar(
                "grammar RuleHelpers;\n" +
                "a[int x] returns [int y] : b=c xs+=A ;\n" +
                "c : A ;\n" +
                "A : 'a' ;\n");
            g.tool.process(g, dummyConfiguration(), false);

            const a = g.getRule("a")!;
            const c = g.getRule("c")!;
            expect(a.equals(a)).toBe(true);
            expect(a.equals(c)).toBe(false);
            expect(a.equals("a")).toBe(false);
            expect(a.hashCode()).not.toBe(c.hashCode());
            expect(c.toString()).toBe("Rule{name=c}");

            expect(a.resolveToRule("a")).toBe(a);
            expect(a.resolveToRule("b")).toBe(c);
            expect(a.resolveToRule("c")).toBe(c);
            expect(a.resolveToRule("xs")).toBeNull();

            const alt = a.alt[1];
            expect(alt.resolveToRule("c")).toBe(c);
            expect(alt.resolveToRule("b")).toBe(c);
            expect(alt.resolveToRule("xs")).toBeNull();

            const pair = alt.labelDefs.get("b")![0];
            expect(pair.toString()).toBe("b RULE_LABEL c");
            expect(a.args!.toString()).toContain(":");
        });
    });

    describe("Semantic checks", () => {
        const errorCodes = (text: string | Array<{ name: string, content: string; }>): IssueCode[] => {
            return generate(text).queue.errors.map((e) => { return e.code; });
        };

        it("channel names must not conflict with tokens, modes or common constants", () => {
            const grammar =
                "lexer grammar Chan;\n" +
                "channels { ID, HIDDEN, M }\n" +
                "ID : 'a' ;\n" +
                "mode M;\n" +
                "X : 'x' ;\n";

            const codes = errorCodes(grammar);
            expect(codes).toContain(IssueCode.ChannelConflictsWithToken);
            expect(codes).toContain(IssueCode.ChannelConflictsWithCommonConstants);
            expect(codes).toContain(IssueCode.ChannelConflictsWithMode);
        });

        it("grammar name must match the file name", () => {
            const codes = errorCodes([{ name: "Other.g4", content: "grammar Mismatch;\na : A ;\nA : 'a' ;\n" }]);
            expect(codes).toEqual([IssueCode.FileAndGrammarNameDiffer]);
        });

        it("alternative labels must not conflict with rules or other labels", () => {
            const grammar =
                "grammar AltLabels;\n" +
                "a : A # b | B # x ;\n" +
                "b : A ;\n" +
                "c : B # x | A # y ;\n" +
                "A : 'a' ;\n" +
                "B : 'b' ;\n";

            const codes = errorCodes(grammar);
            expect(codes).toContain(IssueCode.AltLabelConflictsWithRule);
            expect(codes).toContain(IssueCode.AltLabelRedef);
        });

        it("lexer modes need non-fragment rules", () => {
            const grammar =
                "lexer grammar Modes;\n" +
                "A : 'a' ;\n" +
                "mode M;\n" +
                "fragment F : 'f' ;\n";

            expect(errorCodes(grammar)).toContain(IssueCode.ModeWithoutRules);
        });

        it("rule kinds must match the grammar type", () => {
            expect(errorCodes("lexer grammar LK;\na : 'a' ;\n")).toContain(IssueCode.ParserRuleNotAllowed);
            expect(errorCodes("parser grammar PK;\nA : B ;\n")).toContain(IssueCode.LexerRulesNotAllowed);
        });

        it("unknown options on predicates and rule references are reported", () => {
            const grammar =
                "grammar Opt;\n" +
                "a : {p()}?<foo=bar> b<baz=1> ;\n" +
                "b : A ;\n" +
                "A : 'a' ;\n";

            const result = generate(grammar);
            expect(result.queue.errors).toHaveLength(0);
            const warnings = result.queue.warnings.filter((w) => { return w.code === IssueCode.IllegalOption; });
            expect(warnings).toHaveLength(2);
        });
    });

    describe("Imports", () => {
        it("import aliases, scoped actions and options in delegates", () => {
            const root =
                "grammar Root4;\n" +
                "import Alias=Imp4;\n" +
                "a : b ;\n" +
                "A : 'a' ;\n";
            const imported =
                "parser grammar Imp4;\n" +
                "options { superClass = Base; }\n" +
                "@parser::members { const importedMember = 1; }\n" +
                "b : A ;\n";

            const result = generate([{ name: "Root4.g4", content: root }, { name: "Imp4.g4", content: imported }]);
            expect(result.queue.errors).toHaveLength(0);
            expect(result.queue.warnings.map((w) => { return w.code; })).toContain(IssueCode.OptionsInDelegate);

            const parser = result.files.get("Root4Parser.ts")!;
            expect(parser).toContain("public b(): BContext {");
            expect(parser).toContain("const importedMember = 1;");
        });

        it("invalid import types and import name clashes are reported", () => {
            const lexer = "lexer grammar Imp5;\nA : 'a' ;\n";
            const parser = "parser grammar Root5;\nimport Imp5;\na : A ;\n";
            expect(generate([{ name: "Root5.g4", content: parser }, { name: "Imp5.g4", content: lexer }])
                .queue.errors.map((e) => { return e.code; })).toContain(IssueCode.InvalidImport);

            const clashingLexer = "lexer grammar Root6Lexer;\nA : 'a' ;\n";
            const combined = "grammar Root6;\nimport Root6Lexer;\na : A ;\n";
            const clash = generate([
                { name: "Root6.g4", content: combined }, { name: "Root6Lexer.g4", content: clashingLexer },
            ]);
            expect(clash.queue.errors.map((e) => { return e.code; })).toContain(IssueCode.ImportNameClash);
        });

        it("grammar hierarchy helpers", () => {
            const dir = generateRandomFilename("/tmp/imports-");
            fileSystem.mkdirSync(dir, { recursive: true });
            try {
                fileSystem.writeFileSync(dir + "/Inner.g4", "parser grammar Inner;\nc : A ;\n");
                fileSystem.writeFileSync(dir + "/Middle.g4", "parser grammar Middle;\nimport Inner;\nb : c ;\n");

                const root = new Grammar("grammar Outer;\nimport Middle;\na : b ;\nA : 'a' ;\n");
                root.fileName = dir + "/Outer.g4";
                root.tool.toolConfiguration = defineConfig({ lib: dir, generators: [tsGenerator] });
                root.loadImportedGrammars(new Set());

                const middle = root.getImportedGrammars()[0];
                expect(middle.name).toBe("Middle");
                const inner = middle.getImportedGrammars()[0];
                expect(inner.name).toBe("Inner");

                expect(root.getAllImportedGrammars().map((g) => { return g.name; })).toEqual(["Middle", "Inner"]);
                expect(root.getOutermostGrammar()).toBe(root);
                expect(inner.getOutermostGrammar()).toBe(root);
                expect(root.getGrammarAncestors()).toBeNull();
                expect(inner.getGrammarAncestors()!.map((g) => { return g.name; })).toEqual(["Outer", "Middle"]);
                expect(inner.getRecognizerName()).toBe("Inner");
                expect(root.getRecognizerName()).toBe("OuterParser");
                expect(root.getImportedGrammar("Middle")).toBe(middle);
                expect(middle.getImportedGrammar("Inner")).toBe(inner);
                expect(root.getImportedGrammar("Inner")).toBeNull();

                expect(root.getRule("Middle", "b")).toBe(middle.getRule("b"));
                expect(root.getRule("Nope", "b")).toBeNull();
                expect(root.getRule("", "a")).toBe(root.getRule("a"));
            } finally {
                fileSystem.rmSync(dir, { recursive: true, force: true });
            }
        });

        it("missing imports are reported while loading", () => {
            const root = new Grammar("grammar Lonely;\nimport Missing;\na : A ;\nA : 'a' ;\n");
            root.fileName = "/nonexistent/Lonely.g4";
            root.tool.toolConfiguration = defineConfig({ lib: "/nonexistent", generators: [tsGenerator] });
            const queue = new ErrorQueue(root.tool.errorManager);
            root.tool.errorManager.addListener(queue);
            root.tool.errorManager.configure(root.tool.toolConfiguration.messageFormatOptions);

            root.loadImportedGrammars(new Set());
            expect(root.getImportedGrammars()).toHaveLength(0);
            expect(queue.errors.map((e) => { return e.code; })).toEqual([IssueCode.CannotFindImportedGrammar]);
        });
    });

    describe("Interpreters", () => {
        it("require a processed grammar of the right kind", () => {
            const unprocessed = new Grammar("grammar Unprocessed;\na : A ;\nA : 'a' ;\n");
            expect(() => { return unprocessed.createLexerInterpreter(CharStream.fromString("a")); })
                .toThrow("The ATN must be created");

            const lexer = new LexerGrammar("lexer grammar OnlyLexer;\nA : 'a' ;\n");
            lexer.tool.process(lexer, dummyConfiguration(), false);
            const tokens = new CommonTokenStream(lexer.createLexerInterpreter(CharStream.fromString("a")));
            expect(() => { return lexer.createParserInterpreter(tokens); })
                .toThrow("A parser interpreter can only be created for a parser or combined grammar.");
            expect(() => { return lexer.createGrammarParserInterpreter(tokens); })
                .toThrow("A parser interpreter can only be created for a parser or combined grammar.");
            expect(() => { return unprocessed.createParserInterpreter(tokens); }).toThrow("The ATN must be created");
            expect(() => { return unprocessed.createGrammarParserInterpreter(tokens); })
                .toThrow("The ATN must be created");

            const parser = new Grammar("parser grammar OnlyParser;\na : A ;\n");
            parser.tool.process(parser, dummyConfiguration(), false);
            expect(() => { return parser.createLexerInterpreter(CharStream.fromString("a")); })
                .toThrow("A lexer interpreter can only be created for a lexer or combined grammar.");

            const combined = new Grammar("grammar Both;\na : A ;\nA : 'a' ;\n");
            combined.tool.process(combined, dummyConfiguration(), false);
            const lexerInterpreter = combined.createLexerInterpreter(CharStream.fromString("a"));
            expect(lexerInterpreter).toBeInstanceOf(LexerInterpreter);
            expect(lexerInterpreter.nextToken().type).toBe(combined.getTokenType("A"));
            expect(() => { return combined.createGrammarParserInterpreter(new CommonTokenStream(lexerInterpreter)); })
                .not.toThrow();
        });
    });

    describe("Imports", () => {
        it("merges channels, tokens, actions and modes from imported lexer grammars", () => {
            const root =
                "lexer grammar Root;\n" +
                "import Imp;\n" +
                "channels { C1 }\n" +
                "tokens { T1 }\n" +
                "@members { const rootMember = 1; }\n" +
                "A : 'a' ;\n" +
                "mode M1;\n" +
                "M1A : 'x' ;\n";
            const imported =
                "lexer grammar Imp;\n" +
                "channels { C1, C2 }\n" +
                "tokens { T2 }\n" +
                "@members { const importedMember = 2; }\n" +
                "@header { const importedHeader = 3; }\n" +
                "A : 'z' ;\n" +
                "B : 'b' -> channel(C2) ;\n" +
                "mode M1;\n" +
                "M1B : 'q' ;\n" +
                "mode M2;\n" +
                "M2A : 'w' ;\n";

            const result = generate([{ name: "Root.g4", content: root }, { name: "Imp.g4", content: imported }]);
            expect(result.queue.errors).toHaveLength(0);

            const lexer = result.files.get("Root.ts")!;
            expect(lexer).toContain("\"DEFAULT_TOKEN_CHANNEL\", \"HIDDEN\", \"C1\", \"C2\"");
            expect(lexer).toContain("public static readonly T1 = 1;");
            expect(lexer).toContain("public static readonly T2 = 2;");
            expect(lexer).toContain("const rootMember = 1;");
            expect(lexer).toContain("const importedMember = 2;");
            expect(lexer).toContain("const importedHeader = 3;");
            expect(lexer).toContain("\"DEFAULT_MODE\", \"M1\", \"M2\"");
            expect(lexer).toContain("\"A\", \"B\", \"M1A\", \"M1B\", \"M2A\"");
        });

        it("reports redefined actions in the same grammar and missing imports", () => {
            const root =
                "grammar Root2;\n" +
                "import Missing;\n" +
                "@members { const a = 1; }\n" +
                "@members { const b = 2; }\n" +
                "a : A ;\n" +
                "A : 'a' ;\n";

            const result = generate(root);
            const codes = result.queue.errors.map((e) => { return e.code; });
            expect(codes).toContain(IssueCode.CannotFindImportedGrammar);
        });

        it("imported parser rules and tokens are merged into a combined grammar", () => {
            const root =
                "grammar Root3;\n" +
                "import Imp3;\n" +
                "tokens { T1 }\n" +
                "a : b T1 ;\n" +
                "A : 'a' ;\n";
            const imported =
                "parser grammar Imp3;\n" +
                "tokens { T2 }\n" +
                "b : A T2 ;\n" +
                "a : A ;\n";

            const result = generate([{ name: "Root3.g4", content: root }, { name: "Imp3.g4", content: imported }]);
            expect(result.queue.errors).toHaveLength(0);

            const parser = result.files.get("Root3Parser.ts")!;
            expect(parser).toMatch(/public static readonly T1 = \d+;/);
            expect(parser).toMatch(/public static readonly T2 = \d+;/);
            expect(parser).toContain("public b(): BContext {");
            expect(parser).toContain("this.match(Root3Parser.T2);");
        });
    });
});
