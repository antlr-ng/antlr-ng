/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mkdirSync, mkdtempSync, readFileSync, rmdirSync, writeFileSync } from "fs";
import { basename, dirname, join } from "node:path";
import { ErrorType } from "../src/tool/ErrorType.js";
import { GrammarSemanticsMessage } from "../src/tool/GrammarSemanticsMessage.js";
import { Grammar } from "../src/tool/index.js";
import { ErrorQueue } from "./support/ErrorQueue.js";
import { convertMapToString } from "./support/test-helpers.js";
import { ToolTestUtils } from "./ToolTestUtils.js";
import { tmpdir } from "node:os";

describe("TestCompositeGrammars", () => {
    let tempDirPath: string;

    const sort = <K extends string, V extends number>(data: Map<K, V>): Map<K, V> => {
        const dup = new Map<K, V>();

        const keys = [...data.keys()];
        keys.sort((a, b) => {
            return a.localeCompare(b);
        });

        for (const k of keys) {
            dup.set(k, data.get(k)!);
        }

        return dup;
    };

    const checkGrammarSemanticsWarning = (errorQueue: ErrorQueue, expectedMessage: GrammarSemanticsMessage): void => {
        let foundMsg;
        for (const m of errorQueue.warnings) {
            if (m.getErrorType() === expectedMessage.getErrorType()) {
                foundMsg = m;
            }
        }

        expect(foundMsg).toBeDefined();
        expect(foundMsg).instanceOf(GrammarSemanticsMessage);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        expect(foundMsg!.getArgs().join(", ")).toBe(expectedMessage.getArgs().join(", "));
        if (errorQueue.size() !== 1) {
            console.error(errorQueue);
        }
    };

    beforeEach(() => {
        tempDirPath = mkdtempSync(join(tmpdir(), "AntlrComposite"));
    });

    afterEach(() => {
        rmdirSync(tempDirPath, { recursive: true });
    });

    it("testImportFileLocationInSubdir", () => {
        const slave =
            "parser grammar S;\n" +
            "a : B {System.out.println(\"S.a\");} ;\n";

        const subdir = join(tempDirPath, "sub");
        mkdirSync(subdir, { recursive: true });

        writeFileSync(join(subdir, "S.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "s : a ;\n" +
            "B : 'b' ;" + // defines B from inherited token space
            "WS : (' '|'\\n') -> skip ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", subdir);
        expect(queue.all).toHaveLength(0);
    });

    // Test for https://github.com/antlr/antlr4/issues/1317
    it("testImportSelfLoop", () => {
        const master =
            "grammar M;\n" +
            "import M;\n" +
            "s : 'a' ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testImportIntoLexerGrammar", () => {
        const master =
            "lexer grammar M;\n" +
            "import S;\n" +
            "A : 'a';\n" +
            "B : 'b';\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "C : 'c';\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testImportModesIntoLexerGrammar", () => {

        const master =
            "lexer grammar M;\n" +
            "import S;\n" +
            "A : 'a' -> pushMode(X);\n" +
            "B : 'b';\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "D : 'd';\n" +
            "mode X;\n" +
            "C : 'c' -> popMode;\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testImportChannelsIntoLexerGrammar", () => {

        const master =
            "lexer grammar M;\n" +
            "import S;\n" +
            "channels {CH_A, CH_B}\n" +
            "A : 'a' -> channel(CH_A);\n" +
            "B : 'b' -> channel(CH_B);\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "C : 'c';\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testImportMixedChannelsIntoLexerGrammar", () => {

        const master =
            "lexer grammar M;\n" +
            "import S;\n" +
            "channels {CH_A, CH_B}\n" +
            "A : 'a' -> channel(CH_A);\n" +
            "B : 'b' -> channel(CH_B);\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "channels {CH_C}\n" +
            "C : 'c' -> channel(CH_C);\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testImportClashingChannelsIntoLexerGrammar", () => {

        const master =
            "lexer grammar M;\n" +
            "import S;\n" +
            "channels {CH_A, CH_B, CH_C}\n" +
            "A : 'a' -> channel(CH_A);\n" +
            "B : 'b' -> channel(CH_B);\n" +
            "C : 'C' -> channel(CH_C);\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "channels {CH_C}\n" +
            "C : 'c' -> channel(CH_C);\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testMergeModesIntoLexerGrammar", () => {

        const master =
            "lexer grammar M;\n" +
            "import S;\n" +
            "A : 'a' -> pushMode(X);\n" +
            "mode X;\n" +
            "B : 'b';\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "D : 'd';\n" +
            "mode X;\n" +
            "C : 'c' -> popMode;\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testEmptyModesInLexerGrammar", () => {

        const master =
            "lexer grammar M;\n" +
            "import S;\n" +
            "A : 'a';\n" +
            "C : 'e';\n" +
            "B : 'b';\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "D : 'd';\n" +
            "mode X;\n" +
            "C : 'c' -> popMode;\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(0);
    });

    it("testCombinedGrammarImportsModalLexerGrammar", () => {

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "A : 'a';\n" +
            "B : 'b';\n" +
            "r : A B;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const slave =
            "lexer grammar S;\n" +
            "D : 'd';\n" +
            "mode X;\n" +
            "C : 'c' -> popMode;\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        expect(queue.all).toHaveLength(1);

        const msg = queue.all[0];
        expect(msg.getErrorType()).toBe(ErrorType.MODE_NOT_IN_LEXER);
        expect(msg.getArgs()[0]).toBe("X");
        expect(msg.line).toBe(3);
        expect(msg.charPosition).toBe(5);
        expect(basename(msg.fileName)).toBe("M.g4");
    });

    it("testDelegatesSeeSameTokenType", () => {
        const slaveS =
            "parser grammar S;\n" +
            "tokens { A, B, C }\n" +
            "x : A ;\n";
        const slaveT =
            "parser grammar T;\n" +
            "tokens { C, B, A } // reverse order\n" +
            "y : A ;\n";

        writeFileSync(join(tempDirPath, "S.g4"), slaveS);
        writeFileSync(join(tempDirPath, "T.g4"), slaveT);

        const master =
            "// The lexer will create rules to match letters a, b, c.\n" +
            "// The associated token types A, B, C must have the same value\n" +
            "// and all import'd parsers.  Since ANTLR regenerates all imports\n" +
            "// for use with the delegator M, it can generate the same token type\n" +
            "// mapping in each parser:\n" +
            "// public static final int C=6;\n" +
            "// public static final int EOF=-1;\n" +
            "// public static final int B=5;\n" +
            "// public static final int WS=7;\n" +
            "// public static final int A=4;\n" +
            "grammar M;\n" +
            "import S,T;\n" +
            "s : x y ; // matches AA, which should be 'aa'\n" +
            "B : 'b' ; // another order: B, A, C\n" +
            "A : 'a' ;\n" +
            "C : 'c' ;\n" +
            "WS : (' '|'\\n') -> skip ;\n";

        writeFileSync(join(tempDirPath, "M.g4"), master);

        const g = new Grammar(tempDirPath + "/M.g4", master);

        const errors = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(errors);

        g.tool.process(g, false);

        const expectedTokenIDToTypeMap = "{EOF=-1, B=1, A=2, C=3, WS=4}";
        const expectedStringLiteralToTypeMap = "{'a'=2, 'b'=1, 'c'=3}";
        const expectedTypeToTokenList = "B,A,C,WS";

        expect(convertMapToString(g.tokenNameToTypeMap)).toBe(expectedTokenIDToTypeMap);
        expect(convertMapToString(sort(g.stringLiteralToTypeMap))).toBe(expectedStringLiteralToTypeMap);
        expect(ToolTestUtils.realElements(g.typeToTokenList).toString()).toBe(expectedTypeToTokenList);
        expect(errors.errors).toHaveLength(0);
    });

    it("testErrorInImportedGetsRightFilename", () => {
        const slave =
            "parser grammar S;\n" +
            "a : 'a' | c;\n";
        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-lib", tempDirPath);
        const msg = queue.errors[0];

        expect(msg.getErrorType()).toBe(ErrorType.UNDEFINED_RULE_REF);
        expect(msg.getArgs()[0]).toBe("c");
        expect(msg.line).toBe(2);
        expect(msg.charPosition).toBe(10);
        expect(basename(msg.fileName)).toBe("S.g4");
    });

    it("testImportFileNotSearchedForInOutputDir", () => {
        const slave =
            "parser grammar S;\n" +
            "a : B {System.out.println(\"S.a\");} ;\n";

        const outdir = tempDirPath + "/out";
        mkdirSync(outdir);
        writeFileSync(join(outdir, "S.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "s : a ;\n" +
            "B : 'b' ;" + // defines B from inherited token space
            "WS : (' '|'\\n') -> skip ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-o", outdir);
        expect(queue.all[0].getErrorType()).toBe(ErrorType.CANNOT_FIND_IMPORTED_GRAMMAR);
    });

    it("testOutputDirShouldNotEffectImports", () => {
        const slave =
            "parser grammar S;\n" +
            "a : B {System.out.println(\"S.a\");} ;\n";

        const subdir = tempDirPath + "/sub";
        mkdirSync(subdir);
        writeFileSync(join(subdir, "S.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "s : a ;\n" +
            "B : 'b' ;" + // defines B from inherited token space
            "WS : (' '|'\\n') -> skip ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);
        const outdir = tempDirPath + "/out";
        mkdirSync(outdir);
        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false, "-o", outdir, "-lib",
            subdir);
        expect(queue.all).toHaveLength(0);
    });

    it("testTokensFileInOutputDirAndImportFileInSubdir", () => {
        const slave =
            "parser grammar S;\n" +
            "a : B {System.out.println(\"S.a\");} ;\n";

        const subdir = tempDirPath + "/sub";
        mkdirSync(subdir);
        writeFileSync(join(subdir, "S.g4"), slave);

        const parser =
            "parser grammar MParser;\n" +
            "import S;\n" +
            "options {tokenVocab=MLexer;}\n" +
            "s : a ;\n";
        writeFileSync(join(tempDirPath, "MParser.g4"), parser);

        const lexer =
            "lexer grammar MLexer;\n" +
            "B : 'b' ;" + // defines B from inherited token space
            "WS : (' '|'\\n') -> skip ;\n";
        writeFileSync(join(tempDirPath, "MLexer.g4"), lexer);

        const outdir = tempDirPath + "/out";
        mkdirSync(outdir);

        let queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "MLexer.g4", false, "-o", outdir);
        expect(queue.all).toHaveLength(0);

        queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "MParser.g4", false, "-o", outdir, "-lib", subdir);
        expect(queue.all).toHaveLength(0);
    });

    it("testImportedTokenVocabIgnoredWithWarning", () => {
        const slave =
            "parser grammar S;\n" +
            "options {tokenVocab=whatever;}\n" +
            "tokens { A }\n" +
            "x : A {System.out.println(\"S.x\");} ;\n";

        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "s : x ;\n" +
            "WS : (' '|'\\n') -> skip ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const g = new Grammar(tempDirPath + "/M.g4", master);
        const queue = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(queue);
        g.tool.process(g, false);

        const expectedArg = "S";
        const expectedMsgID = ErrorType.OPTIONS_IN_DELEGATE;
        const expectedMessage = new GrammarSemanticsMessage(expectedMsgID, g.fileName, null, expectedArg);
        checkGrammarSemanticsWarning(queue, expectedMessage);

        expect(queue.errors).toHaveLength(0);
        expect(queue.warnings).toHaveLength(1);
    });

    it("testSyntaxErrorsInImportsNotThrownOut", () => {
        const slave =
            "parser grammar S;\n" +
            "options {toke\n";

        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "s : x ;\n" +
            "WS : (' '|'\\n') -> skip ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);
        const g = new Grammar(tempDirPath + "/M.g4", master);
        const errors = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(errors);
        g.tool.process(g, false);

        expect(errors.errors[0].getErrorType()).toBe(ErrorType.SYNTAX_ERROR);
    });

    // Make sure that M can import S that imports T.
    it("test3LevelImport", () => {
        const slave =
            "parser grammar T;\n" +
            "a : T ;\n";

        writeFileSync(join(tempDirPath, "T.g4"), slave);
        const slave2 =
            "parser grammar S;\n" +
            "import T;\n" +
            "a : S ;\n";

        writeFileSync(join(tempDirPath, "S.g4"), slave2);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "a : M ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);
        const g = new Grammar(tempDirPath + "/M.g4", master);
        g.name = "M";
        const errors = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(errors);
        g.tool.process(g, false);

        const expectedTokenIDToTypeMap = "{EOF=-1, M=1}"; // S and T aren't imported; overridden
        const expectedStringLiteralToTypeMap = "{}";
        const expectedTypeToTokenList = "M";

        expect(convertMapToString(g.tokenNameToTypeMap)).toBe(expectedTokenIDToTypeMap);
        expect(convertMapToString(g.stringLiteralToTypeMap)).toBe(expectedStringLiteralToTypeMap);
        expect(ToolTestUtils.realElements(g.typeToTokenList).toString()).toBe(expectedTypeToTokenList);

        expect(errors.errors).toHaveLength(0);
    });

    it("testBigTreeOfImports", () => {
        let slave =
            "parser grammar T;\n" +
            "tokens{T}\n" +
            "x : T ;\n";

        writeFileSync(join(tempDirPath, "T.g4"), slave);
        slave =
            "parser grammar S;\n" +
            "import T;\n" +
            "tokens{S}\n" +
            "y : S ;\n";

        writeFileSync(join(tempDirPath, "S.g4"), slave);

        slave =
            "parser grammar C;\n" +
            "tokens{C}\n" +
            "i : C ;\n";

        writeFileSync(join(tempDirPath, "C.g4"), slave);
        slave =
            "parser grammar B;\n" +
            "tokens{B}\n" +
            "j : B ;\n";

        writeFileSync(join(tempDirPath, "B.g4"), slave);
        slave =
            "parser grammar A;\n" +
            "import B,C;\n" +
            "tokens{A}\n" +
            "k : A ;\n";

        writeFileSync(join(tempDirPath, "A.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S,A;\n" +
            "tokens{M}\n" +
            "a : M ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);
        const g = new Grammar(tempDirPath + "/M.g4", master);
        const errors = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(errors);
        g.tool.process(g, false);

        expect(errors.all).toHaveLength(0);

        const expectedTokenIDToTypeMap = "{EOF=-1, M=1, S=2, T=3, A=4, B=5, C=6}";
        const expectedStringLiteralToTypeMap = "{}";
        const expectedTypeToTokenList = "M,S,T,A,B,C";

        expect(convertMapToString(g.tokenNameToTypeMap)).toBe(expectedTokenIDToTypeMap);
        expect(convertMapToString(g.stringLiteralToTypeMap)).toBe(expectedStringLiteralToTypeMap);
        expect(ToolTestUtils.realElements(g.typeToTokenList).toString()).toBe(expectedTypeToTokenList);
    });

    it("testRulesVisibleThroughMultilevelImport", () => {
        const slave =
            "parser grammar T;\n" +
            "x : T ;\n";

        writeFileSync(join(tempDirPath, "T.g4"), slave);
        const slave2 =
            "parser grammar S;\n" + // A, B, C token type order
            "import T;\n" +
            "a : S ;\n";

        writeFileSync(join(tempDirPath, "S.g4"), slave2);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "a : M x ;\n"; // x MUST BE VISIBLE TO M
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const g = new Grammar(tempDirPath + "/M.g4", master);
        const errors = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(errors);
        g.tool.process(g, false);

        const expectedTokenIDToTypeMap = "{EOF=-1, M=1, T=2}";
        const expectedStringLiteralToTypeMap = "{}";
        const expectedTypeToTokenList = "M,T";

        expect(convertMapToString(g.tokenNameToTypeMap)).toBe(expectedTokenIDToTypeMap);
        expect(convertMapToString(g.stringLiteralToTypeMap)).toBe(expectedStringLiteralToTypeMap);
        expect(ToolTestUtils.realElements(g.typeToTokenList).toString()).toBe(expectedTypeToTokenList);

        expect(errors.errors).toHaveLength(0);
    });

    it("testNestedComposite", () => {
        // Wasn't compiling. http://www.antlr.org/jira/browse/ANTLR-438
        let grammarString =
            "lexer grammar L;\n" +
            "T1: '1';\n" +
            "T2: '2';\n" +
            "T3: '3';\n" +
            "T4: '4';\n";

        writeFileSync(join(tempDirPath, "L.g4"), grammarString);
        grammarString =
            "parser grammar G1;\n" +
            "s: a | b;\n" +
            "a: T1;\n" +
            "b: T2;\n";

        writeFileSync(join(tempDirPath, "G1.g4"), grammarString);

        grammarString =
            "parser grammar G2;\n" +
            "import G1;\n" +
            "a: T3;\n";

        writeFileSync(join(tempDirPath, "G2.g4"), grammarString);
        const grammar3String =
            "grammar G3;\n" +
            "import G2;\n" +
            "b: T4;\n";

        writeFileSync(join(tempDirPath, "G3.g4"), grammar3String);

        const g = new Grammar(tempDirPath + "/G3.g4", grammar3String);
        const errors = new ErrorQueue(g.tool.errorManager);
        g.tool.errorManager.addListener(errors);
        g.tool.process(g, false);

        const expectedTokenIDToTypeMap = "{EOF=-1, T4=1, T3=2}";
        const expectedStringLiteralToTypeMap = "{}";
        const expectedTypeToTokenList = "T4,T3";

        expect(convertMapToString(g.tokenNameToTypeMap)).toBe(expectedTokenIDToTypeMap);
        expect(convertMapToString(g.stringLiteralToTypeMap)).toBe(expectedStringLiteralToTypeMap);
        expect(ToolTestUtils.realElements(g.typeToTokenList).toString()).toBe(expectedTypeToTokenList);

        expect(errors.errors).toHaveLength(0);

        // TODO: assertTrue(TestCompositeGrammars.compile("G3.g4", G3str, "G3Parser", "b", tempDir));
    });

    it("testHeadersPropagatedCorrectlyToImportedGrammars", () => {
        const slave =
            "parser grammar S;\n" +
            "a : B {System.out.print(\"S.a\");} ;\n";

        writeFileSync(join(tempDirPath, "S.g4"), slave);

        const master =
            "grammar M;\n" +
            "import S;\n" +
            "@header{package myPackage;}\n" +
            "s : a ;\n" +
            "B : 'b' ;" + // defines B from inherited token space
            "WS : (' '|'\\n') -> skip ;\n";
        writeFileSync(join(tempDirPath, "M.g4"), master);

        const queue = ToolTestUtils.antlrOnFile(tempDirPath, "Java", "M.g4", false);

        expect(queue.all).toHaveLength(0);
    });

    /**
     * This is a regression test for antlr/antlr4#670 "exception when importing
     * grammar".  I think this one always worked but I found that a different
     * Java grammar caused an error and so I made the testImportLeftRecursiveGrammar() test below.
     * https://github.com/antlr/antlr4/issues/670
     */
    it("testImportLargeGrammar", async () => {
        const sourceURL = join(dirname(import.meta.url), "./grammars/Java.g4").substring("file:".length);
        const slave = readFileSync(sourceURL, "utf-8");
        const master =
            "grammar NewJava;\n" +
            "import Java;\n";

        writeFileSync(join(tempDirPath, "Java.g4"), slave);

        const originalLog = console.log;
        try {
            let output = "";
            console.log = (str) => {
                output += str;
            };

            const queue = await ToolTestUtils.execParser("NewJava.g4", master, "NewJavaParser", "NewJavaLexer",
                "compilationUnit", "package Foo;", false, tempDirPath);

            expect(output).toBe("");
            expect(queue.errors).toHaveLength(0);
        } finally {
            console.log = originalLog;
        }
    });

    /**
     * This is a regression test for antlr/antlr4#670 "exception when importing
     * grammar".
     * https://github.com/antlr/antlr4/issues/670
     */
    it("testImportLeftRecursiveGrammar", async () => {
        const slave =
            "grammar Java;\n" +
            "e : '(' e ')'\n" +
            "  | e '=' e\n" +
            "  | ID\n" +
            "  ;\n" +
            "ID : [a-z]+ ;\n";
        const master =
            "grammar T;\n" +
            "import Java;\n" +
            "s : e ;\n";

        writeFileSync(join(tempDirPath, "Java.g4"), slave);

        const originalLog = console.log;
        try {
            let output = "";
            console.log = (str) => {
                output += str;
            };

            const queue = await ToolTestUtils.execParser("T.g4", master, "TParser", "TLexer", "s", "a=b", false,
                tempDirPath);
            expect(output).toBe("");
            expect(queue.errors).toHaveLength(0);
            expect("", output);
        } finally {
            console.log = originalLog;
        }
    });

    // ISSUE: https://github.com/antlr/antlr4/issues/2296
    it("testCircularGrammarInclusion", async () => {
        const g1 =
            "grammar G1;\n" +
            "import  G2;\n" +
            "r : 'R1';";

        const g2 =
            "grammar G2;\n" +
            "import  G1;\n" +
            "r : 'R2';";

        writeFileSync(join(tempDirPath, "G1.g4"), g1);
        const queue = await ToolTestUtils.execParser("G2.g4", g2, "G2Parser", "G2Lexer", "r", "R2", false, tempDirPath);
        expect(queue.errors).toHaveLength(0);
    });
});
