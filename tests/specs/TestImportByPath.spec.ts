/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { createFsFromVolume, Volume } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineConfig } from "../../src/config/config.js";
import { copyFolderToMemFs, generateRandomFilename, resolvePath } from "../../src/support/fs-helpers.js";
import { copyImportedGrammarsToMemFs, findGrammarImports } from "../../src/support/grammar-imports.js";
import { fileSystem } from "../../src/tool-parameters.js";
import { Grammar } from "../../src/tool/Grammar.js";
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
     * @param lib The lib folder, relative to the test folder.
     *
     * @returns The reported issues.
     */
    const run = (fileName: string, lib?: string): ErrorQueue => {
        return ToolTestUtils.antlrOnFile(defineConfig({
            generators: [tsGenerator],
            generationOptions: { outputDirectory: `${dir}/out` },
            grammarFiles: [`${dir}/${fileName}`],
            lib: lib === undefined ? undefined : `${dir}/${lib}`,
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

        const log = vi.spyOn(console, "log").mockImplementation(() => { /**/ });
        try {
            const queue = ToolTestUtils.antlrOnFile(defineConfig({
                generators: [tsGenerator],
                generationOptions: { outputDirectory: `file://${dir}/out/`, generateDependencies: true },
                grammarFiles: [`${dir}/main/M.g4`],
            }), false);

            expect(queue.all).toEqual([]);
            expect(log).toHaveBeenCalledOnce();
            const lines = (log.mock.calls[0][0] as string).split("\n");
            expect(lines[0]).toBe(`${dir}/shared/S.g4`);

            // The imported grammar is an input only, never a generated file.
            expect(lines.slice(1).filter((line) => {
                return line.includes("S.g4 :");
            })).toEqual([]);
        } finally {
            log.mockRestore();
        }
    });

    it("loads a file imported by name and by path only once", () => {
        // The name import finds the file in the lib folder, which is given with a trailing slash.
        write({
            "M.g4": "grammar M;\nimport S, './lib/S.g4';\ns : a ;\n",
            "lib/S.g4": "grammar S;\n@members {/* S members */}\na : X ;\nX : 'x' ;\n",
        });

        const queue = run("M.g4", "lib/");
        expect(queue.all).toEqual([]);
        expect(generated("MParser.ts").split("/* S members */")).toHaveLength(2);
    });

    it("does not confuse a path import with a name import of the same grammar name", () => {
        // x/Common.g4 has imports of its own, so it was recorded as visited by its name.
        write({
            "M.g4": "grammar M;\nimport 'x/Common.g4', Common;\ns : a b ;\nX : 'x' ;\n",
            "x/Common.g4": "parser grammar Common;\nimport 'Other.g4';\na : c ;\n",
            "x/Other.g4": "parser grammar Other;\nc : X ;\n",
            "Common.g4": "parser grammar Common;\nb : X ;\n",
        });

        const queue = run("M.g4");
        expect(queue.all).toEqual([]);

        const parser = generated("MParser.ts");
        expect(parser).toContain("public a()");
        expect(parser).toContain("public b()");
        expect(parser).toContain("public c()");
    });

    it("loads the imports of a shared grammar again for each root grammar", () => {
        // X loads A -> B, and B's import of A is circular there. Y imports B only and still needs A's rules.
        write({
            "X.g4": "grammar X;\nimport 'A.g4';\ns : a ;\nT : 't' ;\n",
            "Y.g4": "grammar Y;\nimport 'B.g4';\ns : b ;\nT : 't' ;\n",
            "A.g4": "parser grammar A;\nimport 'B.g4';\na : T ;\n",
            "B.g4": "parser grammar B;\nimport 'A.g4';\nb : a ;\n",
        });

        const queue = ToolTestUtils.antlrOnFile(defineConfig({
            generators: [tsGenerator],
            generationOptions: { outputDirectory: `${dir}/out` },
            grammarFiles: [`${dir}/X.g4`, `${dir}/Y.g4`],
        }), false);
        expect(queue.all).toEqual([]);
        expect(generated("YParser.ts")).toContain("public a()");
    });

    it("makes the current root grammar the root of a shared grammar", () => {
        // S is loaded once and shared by X and Y. While Y is processed, S belongs to Y, not to X.
        write({
            "X.g4": "grammar X;\nimport S;\nr : s ;\nOLD : 'x' ;\n",
            "Y.g4": "grammar Y;\nimport S;\nr : s ;\nNEW : 'x' ;\n",
            "S.g4": "parser grammar S;\ns : 'x' ;\n",
        });

        // Records the root of each imported grammar right after a grammar loaded its imports.
        const roots = new Map<string, string>();
        const descriptor = Object.getOwnPropertyDescriptor(Grammar.prototype, "loadImportedGrammars")!;
        const load = descriptor.value as Grammar["loadImportedGrammars"];
        vi.spyOn(Grammar.prototype, "loadImportedGrammars").mockImplementation(function (this: Grammar, ...args) {
            load.apply(this, args);
            for (const g of this.getAllImportedGrammars()) {
                roots.set(`${this.name}:${g.name}`, g.getOutermostGrammar().name);
            }
        });

        try {
            const queue = ToolTestUtils.antlrOnFile(defineConfig({
                generators: [tsGenerator],
                generationOptions: { outputDirectory: `${dir}/out` },
                grammarFiles: [`${dir}/X.g4`, `${dir}/Y.g4`],
            }), false);
            expect(queue.all).toEqual([]);
        } finally {
            vi.restoreAllMocks();
        }

        expect(roots.get("X:S")).toBe("X");
        expect(roots.get("Y:S")).toBe("Y");
        expect(generated("YParser.ts")).toContain("YParser.NEW");
    });

    it("identifies a file found by name relative to the current directory", () => {
        // The name import finds lib/S.g4 through a relative lib folder, the path import through an absolute path.
        const relativeDir = `AntlrImportCwd-${Date.now()}`;
        const absoluteDir = `${process.cwd()}/${relativeDir}`;
        fileSystem.mkdirSync(`${absoluteDir}/lib`, { recursive: true });
        try {
            fileSystem.writeFileSync(`${absoluteDir}/M.g4`, "grammar M;\nimport S, './lib/S.g4';\ns : a ;\n");
            fileSystem.writeFileSync(`${absoluteDir}/lib/S.g4`,
                "grammar S;\n@members {/* S members */}\na : X ;\nX : 'x' ;\n");

            const queue = ToolTestUtils.antlrOnFile(defineConfig({
                generators: [tsGenerator],
                generationOptions: { outputDirectory: `${dir}/out` },
                grammarFiles: [`${absoluteDir}/M.g4`],
                lib: `${relativeDir}/lib`,
            }), false);
            expect(queue.all).toEqual([]);
            expect(generated("MParser.ts").split("/* S members */")).toHaveLength(2);
        } finally {
            fileSystem.rmSync(absoluteDir, { recursive: true, force: true });
        }
    });

    it("checks each import against the grammar it loaded", () => {
        // Both files declare a grammar named Common. Only the name import is a parser grammar.
        write({
            "L.g4": "lexer grammar L;\nimport 'x/Common.g4', Common;\nX : 'x' ;\n",
            "x/Common.g4": "lexer grammar Common;\nY : 'y' ;\n",
            "Common.g4": "parser grammar Common;\na : X ;\n",
        });

        const queue = run("L.g4");
        const invalid = queue.errors.filter((issue) => {
            return issue.code === IssueCode.InvalidImport;
        });
        expect(invalid).toHaveLength(1);
        expect(invalid[0].line).toBe(2);
        expect(invalid[0].column).toBe(22); // The name import.
    });

    it("lists each grammar of layered diamond imports once", () => {
        // Every layer imports both grammars of the next layer, which gives 2^n import paths to the last one.
        const layers = 12;
        const files: Record<string, string> = {
            "M.g4": "grammar M;\nimport L0a, L0b;\ns : r0a ;\nX : 'x' ;\n",
        };
        for (let i = 0; i < layers; ++i) {
            for (const side of ["a", "b"]) {
                const imports = i + 1 < layers ? `import L${i + 1}a, L${i + 1}b;\n` : "";
                files[`L${i}${side}.g4`] = `parser grammar L${i}${side};\n${imports}r${i}${side} : X ;\n`;
            }
        }
        write(files);

        const getAll = vi.spyOn(Grammar.prototype, "getAllImportedGrammars");
        try {
            const queue = run("M.g4");
            expect(queue.all).toEqual([]);
            expect(generated("MParser.ts")).toContain(`public r${layers - 1}b()`);

            // Called a few times for the root grammar, not once per import path.
            expect(getAll.mock.calls.length).toBeLessThan(layers);
        } finally {
            getAll.mockRestore();
        }
    });

    it("reports an empty path", () => {
        write({ "M.g4": "grammar M;\nimport '';\ns : X ;\nX : 'x' ;\n" });

        const queue = run("M.g4");
        expect(queue.errors.map((issue) => {
            return issue.code;
        })).toEqual([IssueCode.CannotFindImportedGrammar]);
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
        expect(resolvePath("/a", "\\shared\\x.g4")).toBe("/shared/x.g4");
        expect(resolvePath("//server/share", "x.g4")).toBe("//server/share/x.g4");
    });

    it("does not go above the root of absolute paths", () => {
        expect(resolvePath("C:/a", "../../x.g4")).toBe("C:/x.g4");
        expect(resolvePath("/a", "../../x.g4")).toBe("/x.g4");
    });

    it("keeps the server and share of UNC paths", () => {
        expect(resolvePath("//server/share/grammars", "../../Other.g4")).toBe("//server/share/Other.g4");
        expect(resolvePath("\\\\server\\share", "..\\x.g4")).toBe("//server/share/x.g4");
        expect(resolvePath("//server/share", ".")).toBe("//server/share");
    });
});

describe("copyImportedGrammarsToMemFs", () => {
    it("copies the files imported by path, recursively", () => {
        // The CLI runs the tool on a virtual file system and copies only the grammar's folder and the lib folder.
        const dir = mkdtempSync(tmpdir() + "/AntlrImportCopy-");
        try {
            mkdirSync(dir + "/main");
            mkdirSync(dir + "/shared/sub", { recursive: true });
            writeFileSync(dir + "/main/M.g4", "grammar M;\n// import 'Comment.g4';\nimport A, '../shared/U.g4';\n" +
                "s : X ;\n");
            writeFileSync(dir + "/shared/U.g4", "lexer grammar U;\nimport 'sub/D.g4', 'missing.g4';\nX : 'x' ;\n");
            writeFileSync(dir + "/shared/sub/D.g4", "lexer grammar D;\nimport '../U.g4';\nD : 'd' ;\n");

            const volume = new Volume();
            const fs = createFsFromVolume(volume);
            copyImportedGrammarsToMemFs(fs, dir + "/main/M.g4");

            expect(Object.keys(volume.toJSON()).sort()).toEqual([
                dir + "/shared/U.g4",
                dir + "/shared/sub/D.g4",
            ]);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("follows name imports and decodes escapes", () => {
        const dir = mkdtempSync(tmpdir() + "/AntlrImportCopy-");
        try {
            mkdirSync(dir + "/main");
            mkdirSync(dir + "/lib");
            mkdirSync(dir + "/shared");

            // A directory named like an import in a comment must not be read.
            writeFileSync(dir + "/main/M.g4", "grammar M;\n// import '../shared';\nimport A, L;\ns : X ;\n");
            writeFileSync(dir + "/main/A.g4", "parser grammar A;\nimport '../shared/O\\'Brien.g4';\na : X ;\n");
            writeFileSync(dir + "/lib/L.g4", "parser grammar L;\nimport '../shared/\\u0053.g4';\nl : X ;\n");
            writeFileSync(dir + "/shared/O'Brien.g4", "lexer grammar OBrien;\nX : 'x' ;\n");
            writeFileSync(dir + "/shared/S.g4", "lexer grammar S;\nY : 'y' ;\n");

            const volume = new Volume();
            copyImportedGrammarsToMemFs(createFsFromVolume(volume), dir + "/main/M.g4", dir + "/lib");

            expect(Object.keys(volume.toJSON()).sort()).toEqual([
                dir + "/lib/L.g4",
                dir + "/main/A.g4",
                dir + "/shared/O'Brien.g4",
                dir + "/shared/S.g4",
            ]);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
    it("copies a file imported through a symbolic link once and follows linked folders", () => {
        const dir = mkdtempSync(tmpdir() + "/AntlrImportCopy-");
        try {
            // link -> . makes link/A.g4, link/link/A.g4 and so on the same file.
            symlinkSync(".", dir + "/link", "dir");
            writeFileSync(dir + "/M.g4", "grammar M;\nimport 'A.g4', 'link/A.g4';\ns : a ;\n");
            writeFileSync(dir + "/A.g4", "parser grammar A;\nimport 'link/B.g4';\na : B ;\n");
            writeFileSync(dir + "/B.g4", "lexer grammar B;\nimport 'link/A.g4';\nB : 'b' ;\n");

            const volume = new Volume();
            const fs = createFsFromVolume(volume);
            copyImportedGrammarsToMemFs(fs, dir + "/M.g4");

            expect(Object.keys(volume.toJSON()).sort()).toEqual([dir + "/A.g4", dir + "/B.g4"]);
            expect(fs.lstatSync(dir + "/link/A.g4").isSymbolicLink()).toBe(true);
            expect(fs.realpathSync(dir + "/link/A.g4")).toBe(dir + "/A.g4");
            expect(fs.realpathSync(dir + "/link/B.g4")).toBe(dir + "/B.g4");
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("lets the tool load a grammar and its alias once", () => {
        // Like the CLI: copy the grammar's folder and its imports into the virtual file system, then run the tool.
        const dir = realpathSync(mkdtempSync(tmpdir() + "/AntlrImportAlias-"));
        try {
            writeFileSync(dir + "/M.g4", "grammar M;\nimport 'S.g4', 'Alias.g4';\ns : a ;\n");
            writeFileSync(dir + "/S.g4", "grammar S;\n@members {/* S members */}\na : X ;\nX : 'x' ;\n");
            symlinkSync("S.g4", dir + "/Alias.g4");

            fileSystem.mkdirSync(dir, { recursive: true });
            copyFolderToMemFs(fileSystem, dir, dir, false, /\.g4/);
            copyImportedGrammarsToMemFs(fileSystem, dir + "/M.g4");

            const queue = ToolTestUtils.antlrOnFile(defineConfig({
                generators: [tsGenerator],
                generationOptions: { outputDirectory: `${dir}/out` },
                grammarFiles: [`${dir}/M.g4`],
            }), false);
            expect(queue.all).toEqual([]);
            const parser = fileSystem.readFileSync(`${dir}/out/MParser.ts`, "utf-8") as string;
            expect(parser.split("/* S members */")).toHaveLength(2);
        } finally {
            rmSync(dir, { recursive: true, force: true });
            fileSystem.rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe("findGrammarImports", () => {
    it("finds only real import statements", () => {
        const grammar = "grammar M;\n" +
            "/* import 'a.g4'; */\n" +
            "// import 'b.g4';\n" +
            "import X = A, 'c;d.g4', B /* , 'e.g4' */;\n" +
            "@members { import 'f.g4'; }\n" +
            "s : 'import' ;\n";

        expect(findGrammarImports(grammar)).toEqual([
            { isPath: false, text: "A" },
            { isPath: true, text: "'c;d.g4'" },
            { isPath: false, text: "B" },
        ]);
    });
});
