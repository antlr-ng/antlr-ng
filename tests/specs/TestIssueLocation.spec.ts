/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it } from "vitest";

import { defineConfig } from "../../src/config/config.js";
import { generateRandomFilename } from "../../src/support/fs-helpers.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { ErrorManager } from "../../src/tool/ErrorManager.js";
import type { Issue } from "../../src/tool/Issue.js";
import { IssueCode } from "../../src/tool/Issues.js";
import { ErrorQueue } from "../support/ErrorQueue.js";
import { tsGenerator } from "../support/GenerationHelper.js";
import { ToolTestUtils } from "../ToolTestUtils.js";

/**
 * Runs the tool on a grammar.
 *
 * @param fileName The name of the grammar file.
 * @param grammar The grammar text.
 *
 * @returns All issues the tool reported.
 */
const process = (fileName: string, grammar: string): Issue[] => {
    const dir = generateRandomFilename("/tmp/AntlrIssueLocation-");
    fileSystem.mkdirSync(dir, { recursive: true });
    try {
        const parameters = defineConfig({
            grammarFiles: [dir + "/" + fileName],
            generationOptions: { outputDirectory: dir },
            generators: [tsGenerator],
        });

        return ToolTestUtils.antlrOnString(parameters, grammar, false).all;
    } finally {
        fileSystem.rmSync(dir, { recursive: true, force: true });
    }
};

/**
 * @param issue The issue to describe.
 *
 * @returns The location of the issue as `line:column-endLine:endColumn`.
 */
const range = (issue: Issue): string => {
    return `${issue.line}:${issue.column}-${issue.endLine}:${issue.endColumn}`;
};

describe("Issue locations", () => {
    it("covers the referenced name in semantic errors", () => {
        const issues = process("A.g4", "grammar A;\na : b ;\n");

        expect(issues).toHaveLength(1);
        expect(issues[0].code).toBe(IssueCode.UndefinedRuleRef);
        expect(issues[0].fileName?.endsWith("A.g4")).toBe(true);
        expect(range(issues[0])).toBe("2:4-2:5");
        expect(issues[0].message).toBe("reference to undefined rule: b");
    });

    it("covers multi-character tokens in warnings", () => {
        const issues = process("A.g4", "parser grammar A;\na : FOO ;\n");

        expect(issues).toHaveLength(1);
        expect(issues[0].code).toBe(IssueCode.ImplicitTokenDefinition);
        expect(range(issues[0])).toBe("2:4-2:7");
    });

    it("counts columns in code points", () => {
        const issues = process("A.g4", "parser grammar A;\na : 'é😀' ;\n");

        expect(issues).toHaveLength(1);
        expect(issues[0].code).toBe(IssueCode.ImplicitStringDefinition);
        expect(range(issues[0])).toBe("2:4-2:8");
    });

    it("covers the offending token in syntax errors", () => {
        const issues = process("A.g4", "grammar A;\na : ID ;;\nb : B ;");

        expect(issues).toHaveLength(1);
        expect(issues[0].code).toBe(IssueCode.SyntaxError);
        expect(range(issues[0])).toBe("2:8-2:9");
    });

    it("has no end for syntax errors at the end of the input", () => {
        const issues = process("A.g4", "grammar A;\na : ID");

        expect(issues).toHaveLength(1);
        expect(issues[0].code).toBe(IssueCode.SyntaxError);
        expect(issues[0].line).toBe(2);
        expect(issues[0].endLine).toBeUndefined();
        expect(issues[0].endColumn).toBeUndefined();
    });

    describe("ErrorManager", () => {
        const createManager = (): [ErrorManager, ErrorQueue] => {
            const manager = new ErrorManager();
            manager.configure(defineConfig({}).messageFormatOptions);
            const queue = new ErrorQueue(manager);
            manager.addListener(queue);

            return [manager, queue];
        };

        it("computes the end of multi-line tokens", () => {
            const [manager, queue] = createManager();
            const token = { line: 3, column: 2, text: "{\n    x;\n  }", start: -1, stop: -1, inputStream: null };
            manager.grammarError(IssueCode.UndefinedRuleRef, "A.g4", token, "x");

            expect(range(queue.all[0])).toBe("3:2-5:3");
        });

        it("takes the text of grammar AST nodes from their token", () => {
            const [manager, queue] = createManager();
            const token = { line: 1, column: 5, text: "abc", start: -1, stop: -1, inputStream: null };
            manager.grammarError(IssueCode.UndefinedRuleRef, "A.g4", { line: 1, column: 5, token }, "abc");

            expect(range(queue.all[0])).toBe("1:5-1:8");
        });

        it("has no end if the position is not that of the token", () => {
            // An AST node without a position of its own takes it from a child node.
            const [manager, queue] = createManager();
            const token = { line: 0, column: -1, text: "BLOCK", start: -1, stop: -1, inputStream: null };
            manager.grammarError(IssueCode.UndefinedRuleRef, "A.g4", { line: 4, column: 1, token }, "x");

            expect(queue.all[0].line).toBe(4);
            expect(queue.all[0].column).toBe(1);
            expect(queue.all[0].endLine).toBeUndefined();
            expect(queue.all[0].endColumn).toBeUndefined();
        });

        it("has no location for tool errors", () => {
            const [manager, queue] = createManager();
            const error = new Error("disk full");
            manager.toolError(IssueCode.CannotWriteFile, error, "out.ts", "disk full");

            const issue = queue.all[0];
            expect(issue.fileName).toBeUndefined();
            expect(issue.line).toBe(-1);
            expect(issue.column).toBe(-1);
            expect(issue.endLine).toBeUndefined();
            expect(issue.error).toBe(error);
            expect(issue.message).toBe("cannot write file out.ts: disk full");
        });
    });
});
