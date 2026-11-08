/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defineConfig } from "../../src/config/config.js";
import { generateRandomFilename, resolvePath } from "../../src/support/fs-helpers.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { BuildDependencyGenerator } from "../../src/tool/BuildDependencyGenerator.js";
import { Tool } from "../../src/tool/index.js";
import { IssueCode } from "../../src/tool/Issues.js";
import type { ErrorQueue } from "../support/ErrorQueue.js";
import { tsGenerator } from "../support/GenerationHelper.js";
import { ToolTestUtils } from "../ToolTestUtils.js";

describe("Imports by path", () => {
    let dir: string;

    beforeEach(() => {
        dir = generateRandomFilename("/tmp/AntlrImportPath-");
        fileSystem.mkdirSync(dir, { recursive: true });
    });

    afterEach(() => {
        fileSystem.rmSync(dir, { recursive: true, force: true });
    });

    /**
     * Writes grammar files below the test folder.
     *
     * @param files The grammar text per file path (relative to the test folder).
     */
    const write = (files: Record<string, string>): void => {
        for (const [name, text] of Object.entries(files)) {
            const fileName = `${dir}/${name}`;
            fileSystem.mkdirSync(fileName.substring(0, fileName.lastIndexOf("/")), { recursive: true });
            fileSystem.writeFileSync(fileName, text);
        }
    };

    /**
     * Runs the tool on a grammar file.
     *
     * @param fileName The path of the grammar file, relative to the test folder.
     *
     * @returns The reported issues.
     */
    const run = (fileName: string): ErrorQueue => {
        return ToolTestUtils.antlrOnFile(defineConfig({
            generators: [tsGenerator],
            generationOptions: { outputDirectory: `${dir}/out` },
            grammarFiles: [`${dir}/${fileName}`],
        }), false);
    };

    /**
     * @param fileName The name of a generated file.
     *
     * @returns The content of the file.
     */
    const generated = (fileName: string): string => {
        return fileSystem.readFileSync(`${dir}/out/${fileName}`, "utf-8") as string;
    };

    it("loads a grammar relative to the importing grammar", () => {
        write({
            "shared/Unicode.g4": "lexer grammar Unicode;\nLETTER : [a-z] ;\n",
            "main/M.g4": "grammar M;\nimport '../shared/Unicode.g4';\ns : LETTER+ ;\n",
        });

        const queue = run("main/M.g4");
        expect(queue.all).toEqual([]);
        expect(generated("MLexer.ts")).toContain("LETTER");
    });

    it("mixes name and path imports", () => {
        write({
            "M.g4": "grammar M;\nimport S, 'lib/T.g4';\ns : a b ;\nX : 'x' ;\n",
            "S.g4": "parser grammar S;\na : X ;\n",
            "lib/T.g4": "parser grammar T;\nb : X ;\n",
        });

        const queue = run("M.g4");
        expect(queue.all).toEqual([]);

        const parser = generated("MParser.ts");
        expect(parser).toContain("public a()");
        expect(parser).toContain("public b()");
    });

    it("loads a grammar imported twice only once", () => {
        // M imports A and B, which both import Common. Common's rule must not conflict with itself.
        write({
            "M.g4": "grammar M;\nimport 'a/A.g4', 'b/B.g4';\ns : a b ;\nX : 'x' ;\n",
            "a/A.g4": "parser grammar A;\nimport '../common/Common.g4';\na : c ;\n",
            "b/B.g4": "parser grammar B;\nimport '../common/Common.g4';\nb : c ;\n",
            "common/Common.g4": "parser grammar Common;\nc : X ;\n",
        });

        const queue = run("M.g4");
        expect(queue.all).toEqual([]);
        expect(generated("MParser.ts")).toContain("public c()");
    });

    it("keeps grammars with the same name in different files apart", () => {
        write({
            "M.g4": "grammar M;\nimport 'x/Common.g4', 'y/Common.g4';\ns : a b ;\nX : 'x' ;\n",
            "x/Common.g4": "parser grammar Common;\na : X ;\n",
            "y/Common.g4": "parser grammar Common;\nb : X ;\n",
        });

        const queue = run("M.g4");
        expect(queue.all).toEqual([]);

        const parser = generated("MParser.ts");
        expect(parser).toContain("public a()");
        expect(parser).toContain("public b()");
    });

    it("ignores circular imports", () => {
        write({
            "M.g4": "grammar M;\nimport 'A.g4', './M.g4';\ns : a ;\nX : 'x' ;\n",
            "A.g4": "parser grammar A;\nimport 'B.g4';\na : b ;\n",
            "B.g4": "parser grammar B;\nimport 'A.g4', 'M.g4';\nb : X ;\n",
        });

        const queue = run("M.g4");
        expect(queue.all).toEqual([]);
    });

    it("reports a missing file at the import", () => {
        write({ "M.g4": "grammar M;\nimport 'missing/S.g4';\ns : X ;\nX : 'x' ;\n" });

        const queue = run("M.g4");
        expect(queue.errors).toHaveLength(1);

        const issue = queue.errors[0];
        expect(issue.code).toBe(IssueCode.CannotFindImportedGrammar);
        expect(issue.message).toContain(`${dir}/missing/S.g4`);
        expect(issue.line).toBe(2);
        expect(issue.column).toBe(7);
    });

    it("reports an invalid import type", () => {
        write({
            "L.g4": "lexer grammar L;\nimport 'P.g4';\nX : 'x' ;\n",
            "P.g4": "parser grammar P;\na : X ;\n",
        });

        // The type check needs to find the grammar loaded for the path. Like with `import P;`, the parser rule then
        // also causes an error in the lexer.
        const queue = run("L.g4");
        expect(queue.errors.map((issue) => {
            return issue.code;
        })).toContain(IssueCode.InvalidImport);
    });

    it("lists the imported files as dependencies", () => {
        write({
            "main/M.g4": "grammar M;\nimport '../shared/S.g4';\ns : a ;\nX : 'x' ;\n",
            "shared/S.g4": "parser grammar S;\na : X ;\n",
        });

        const tool = new Tool();
        const g = tool.loadGrammar(`${dir}/main/M.g4`);
        g.loadImportedGrammars(new Set());

        const options = defineConfig({ generationOptions: { outputDirectory: `file://${dir}/out/` } })
            .generationOptions;
        const generator = new BuildDependencyGenerator(tool, g, options, tsGenerator, "/lib");
        expect(generator.getDependenciesFileList()).toEqual([`${dir}/shared/S.g4`]);
    });
});

describe("resolvePath", () => {
    it("resolves relative paths against the base folder", () => {
        expect(resolvePath("/a/b", "c.g4")).toBe("/a/b/c.g4");
        expect(resolvePath("/a/b", "../c/./d.g4")).toBe("/a/c/d.g4");
        expect(resolvePath("a/b", "../../../c.g4")).toBe("../c.g4");
        expect(resolvePath(".", "c.g4")).toBe("c.g4");
        expect(resolvePath(".", "./x/../c.g4")).toBe("c.g4");
    });

    it("keeps absolute paths", () => {
        expect(resolvePath("/a/b", "/x/y.g4")).toBe("/x/y.g4");
        expect(resolvePath("/a/b", "C:\\x\\y.g4")).toBe("C:/x/y.g4");
    });
});
