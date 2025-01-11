/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
    InputMismatchException, NoViableAltException, ParseTreeMatch, ParseTreePatternMatcher,
    StartRuleDoesNotConsumeFullPatternError, type ParseTree
} from "antlr4ng";

import { ToolTestUtils } from "./ToolTestUtils.js";
import { convertArrayToString } from "../src/support/helpers.js";

describe("TestParseTreeMatcher", () => {
    const checkPatternMatch = async (grammar: string, startRule: string, input: string, pattern: string,
        grammarName: string, tempDir: string, invertMatch?: boolean): Promise<ParseTreeMatch> => {
        invertMatch ??= false;

        const grammarFileName = grammarName + ".g4";
        const parserName = grammarName + "Parser";
        const lexerName = grammarName + "Lexer";
        const runOptions = ToolTestUtils.createOptionsForToolTests(grammarFileName, grammar, parserName, lexerName,
            false, false, startRule, input, false, false);

        const [_, parser] = await ToolTestUtils.setupRecognizers(runOptions, tempDir);
        const parseTree = ToolTestUtils.callParserMethod(parser, startRule) as ParseTree;
        const p = parser.compileParseTreePattern(pattern, parser.getRuleIndex(startRule));

        const match = p.match(parseTree);
        const matched = match.succeeded();
        expect(matched).toBe(!invertMatch);

        return match;
    };

    const getPatternMatcher = async (grammarFileName: string, grammar: string, parserName: string, lexerName: string,
        startRule: string, tempDir: string): Promise<ParseTreePatternMatcher> => {
        const runOptions = ToolTestUtils.createOptionsForToolTests(grammarFileName, grammar, parserName, lexerName,
            false, false, startRule, "", false, false);
        const [lexer, parser] = await ToolTestUtils.setupRecognizers(runOptions, tempDir);

        return new ParseTreePatternMatcher(lexer, parser);
    };

    it("testChunking", () => {
        const m = new ParseTreePatternMatcher(null, null);
        expect(convertArrayToString(m.split("<ID> = <expr> ;"))).toBe("[ID, ' = ', expr, ' ;']");
        expect(convertArrayToString(m.split(" <ID> = <expr>"))).toBe("[' ', ID, ' = ', expr]");
        expect(convertArrayToString(m.split("<ID> = <expr>"))).toBe("[ID, ' = ', expr]");
        expect(convertArrayToString(m.split("<expr>"))).toBe("[expr]");
        expect(convertArrayToString(m.split("\\<x\\> foo"))).toBe("['<x> foo']");
        expect(convertArrayToString(m.split("foo \\<x\\> bar <tag>"))).toBe("['foo <x> bar ', tag]");
    });

    it("testDelimiters", () => {
        const m = new ParseTreePatternMatcher(null, null);
        m.setDelimiters("<<", ">>", "$");
        const result = convertArrayToString(m.split("<<ID>> = <<expr>> ;$<< ick $>>"));
        expect(result).toBe("[ID, ' = ', expr, ' ;<< ick >>']");
    });

    it("testInvertedTags", () => {
        const m = new ParseTreePatternMatcher(null, null);
        const expected = "tag delimiters out of order in pattern: >expr<";
        expect(() => {
            m.split(">expr<");
        }).toThrow(expected);
    });

    it("testUnclosedTag", () => {
        const m = new ParseTreePatternMatcher(null, null);
        const expected = "unterminated tag in pattern: <expr hi mom";
        expect(() => {
            m.split("<expr hi mom");
        }).toThrow(expected);
    });

    it("testExtraClose", () => {
        const m = new ParseTreePatternMatcher(null, null);
        const expected = "missing start tag in pattern: <expr> >";
        expect(() => {
            m.split("<expr> >");
        }).toThrow(expected);
    });

    it("testTokenizingPattern", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X1;\n" +
                "s : ID '=' expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";
            const m = await getPatternMatcher("X1.g4", grammar, "X1Parser", "X1Lexer", "s", tempDir);

            const tokens = m.tokenize("<ID> = <expr> ;");
            expect(convertArrayToString(tokens))
                .toBe("[ID:3, [@-1,1:1='=',<1>,1:1], expr:7, [@-1,1:1=';',<2>,1:1]]");
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testCompilingPattern", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X2;\n" +
                "s : ID '=' expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";
            const m = await getPatternMatcher("X2.g4", grammar, "X2Parser", "X2Lexer", "s", tempDir);

            const t = m.compile("<ID> = <expr> ;", m.getParser()!.getRuleIndex("s"));
            expect(t.getPatternTree().toStringTree(m.getParser()!)).toBe("(s <ID> = (expr <expr>) ;)");
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testCompilingPatternConsumesAllTokens", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X2;\n" +
                "s : ID '=' expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";
            const m = await getPatternMatcher("X2.g4", grammar, "X2Parser", "X2Lexer", "s", tempDir);
            expect(() => {
                m.compile("<ID> = <expr> ; extra", m.getParser()!.getRuleIndex("s"));
            }).toThrow(StartRuleDoesNotConsumeFullPatternError);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testPatternMatchesStartRule", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X2;\n" +
                "s : ID '=' expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";
            const m = await getPatternMatcher("X2.g4", grammar, "X2Parser", "X2Lexer", "s", tempDir);
            expect(() => {
                m.compile("<ID> ;", m.getParser()!.getRuleIndex("s"));
            }).toThrow(InputMismatchException);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testPatternMatchesStartRule2", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X2;\n" +
                "s : ID '=' expr ';' | expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";
            const m = await getPatternMatcher("X2.g4", grammar, "X2Parser", "X2Lexer", "s", tempDir);
            expect(() => {
                m.compile("<ID> <ID> ;", m.getParser()!.getRuleIndex("s"));
            }).toThrow(NoViableAltException);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testHiddenTokensNotSeenByTreePatternParser", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X2;\n" +
                "s : ID '=' expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> channel(HIDDEN) ;\n";
            const m = await getPatternMatcher("X2.g4", grammar, "X2Parser", "X2Lexer", "s", tempDir);

            const t = m.compile("<ID> = <expr> ;", m.getParser()!.getRuleIndex("s"));
            expect(t.getPatternTree().toStringTree(m.getParser()!)).toBe("(s <ID> = (expr <expr>) ;)");
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testCompilingMultipleTokens", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X2;\n" +
                "s : ID '=' ID ';' ;\n" +
                "ID : [a-z]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";
            const m = await getPatternMatcher("X2.g4", grammar, "X2Parser", "X2Lexer", "s", tempDir);

            const t = m.compile("<ID> = <ID> ;", m.getParser()!.getRuleIndex("s"));
            const results = t.getPatternTree().toStringTree(m.getParser()!);
            const expected = "(s <ID> = <ID> ;)";
            expect(results).toBe(expected);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testIDNodeMatches", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X3;\n" +
                "s : ID ';' ;\n" +
                "ID : [a-z]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            const input = "x ;";
            const pattern = "<ID>;";
            await checkPatternMatch(grammar, "s", input, pattern, "X3", tempDir);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testIDNodeWithLabelMatches", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X8;\n" +
                "s : ID ';' ;\n" +
                "ID : [a-z]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            const input = "x ;";
            const pattern = "<id:ID>;";
            const m = await checkPatternMatch(grammar, "s", input, pattern, "X8", tempDir);
            expect(m.getLabels().toString()).toBe("{ID=[x], id=[x]}");
            expect(m.get("id")).not.toBeNull();
            expect(m.get("ID")).not.toBeNull();
            expect(m.get("id")?.getText()).toBe("x");
            expect(m.get("ID")?.getText()).toBe("x");
            expect(convertArrayToString(m.getAll("id"))).toBe("[x]");
            expect(convertArrayToString(m.getAll("ID"))).toBe("[x]");

            expect(m.get("undefined")).toBeNull();
            expect(convertArrayToString(m.getAll("undefined"))).toBe("[]");
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testLabelGetsLastIDNode", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X9;\n" +
                "s : ID ID ';' ;\n" +
                "ID : [a-z]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            const input = "x y;";
            const pattern = "<id:ID> <id:ID>;";
            const m = await checkPatternMatch(grammar, "s", input, pattern, "X9", tempDir);
            expect(m.getLabels().toString()).toBe("{ID=[x, y], id=[x, y]}");
            expect(m.get("id")).not.toBeNull();
            expect(m.get("ID")).not.toBeNull();
            expect(m.get("id")?.getText()).toBe("y");
            expect(m.get("ID")?.getText()).toBe("y");
            expect(convertArrayToString(m.getAll("id"))).toBe("[x, y]");
            expect(convertArrayToString(m.getAll("ID"))).toBe("[x, y]");

            expect(m.get("undefined")).toBeNull();
            expect("[]", m.getAll("undefined").toString());
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testIDNodeWithMultipleLabelMatches", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X7;\n" +
                "s : ID ID ID ';' ;\n" +
                "ID : [a-z]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            const input = "x y z;";
            const pattern = "<a:ID> <b:ID> <a:ID>;";
            const m = await checkPatternMatch(grammar, "s", input, pattern, "X7", tempDir);
            expect(m.getLabels().toString()).toBe("{ID=[x, y, z], a=[x, z], b=[y]}");
            expect(m.get("a")).not.toBeNull();
            expect(m.get("b")).not.toBeNull();
            expect(m.get("ID")).not.toBeNull();
            expect(m.get("a")?.getText()).toBe("z");
            expect(m.get("b")?.getText()).toBe("y");
            expect(m.get("ID")?.getText()).toBe("z");
            expect(convertArrayToString(m.getAll("a"))).toBe("[x, z]");
            expect(convertArrayToString(m.getAll("b"))).toBe("[y]");
            expect(convertArrayToString(m.getAll("ID"))).toBe("[x, y, z]"); // ordered

            expect(m.getTree().getText()).toBe("xyz;"); // whitespace stripped by lexer

            expect(m.get("undefined")).toBeNull();
            expect(convertArrayToString(m.getAll("undefined"))).toBe("[]");
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testTokenAndRuleMatch", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X4;\n" +
                "s : ID '=' expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            const input = "x = 99;";
            const pattern = "<ID> = <expr> ;";
            await checkPatternMatch(grammar, "s", input, pattern, "X4", tempDir);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testTokenTextMatch", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X4;\n" +
                "s : ID '=' expr ';' ;\n" +
                "expr : ID | INT ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            let input = "x = 0;";
            let pattern = "<ID> = 1;";
            let invertMatch = true; // 0!=1
            await checkPatternMatch(grammar, "s", input, pattern, "X4", tempDir, invertMatch);

            input = "x = 0;";
            pattern = "<ID> = 0;";
            invertMatch = false;
            await checkPatternMatch(grammar, "s", input, pattern, "X4", tempDir, invertMatch);

            input = "x = 0;";
            pattern = "x = 0;";
            invertMatch = false;
            await checkPatternMatch(grammar, "s", input, pattern, "X4", tempDir, invertMatch);

            input = "x = 0;";
            pattern = "y = 0;";
            invertMatch = true;
            await checkPatternMatch(grammar, "s", input, pattern, "X4", tempDir, invertMatch);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testAssign", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X5;\n" +
                "s   : expr ';'\n" +
                //"    | 'return' expr ';'\n" +
                "    ;\n" +
                "expr: expr '.' ID\n" +
                "    | expr '*' expr\n" +
                "    | expr '=' expr\n" +
                "    | ID\n" +
                "    | INT\n" +
                "    ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            const input = "x = 99;";
            const pattern = "<ID> = <expr>;";
            await checkPatternMatch(grammar, "s", input, pattern, "X5", tempDir);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });

    it("testLRecursiveExpr", async () => {
        const tempDir = mkdtempSync(join(tmpdir(), "AntlrParseTreeMatcher"));
        try {
            const grammar =
                "grammar X6;\n" +
                "s   : expr ';'\n" +
                "    ;\n" +
                "expr: expr '.' ID\n" +
                "    | expr '*' expr\n" +
                "    | expr '=' expr\n" +
                "    | ID\n" +
                "    | INT\n" +
                "    ;\n" +
                "ID : [a-z]+ ;\n" +
                "INT : [0-9]+ ;\n" +
                "WS : [ \\r\\n\\t]+ -> skip ;\n";

            const input = "3*4*5";
            const pattern = "<expr> * <expr> * <expr>";
            await checkPatternMatch(grammar, "expr", input, pattern, "X6", tempDir);
        } finally {
            rmSync(tempDir, { recursive: true });
        }
    });
});
