/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { createFsFromVolume, Volume } from "memfs";
import { describe, expect, it } from "vitest";

import { copyFolderToMemFs } from "../../src/support/fs-helpers.js";

/**
 * Creates a source folder `src` (with `L.g4` and `sub/S.g4`) and a folder `other` (with `O.g4`) in a new temporary
 * folder, lets the test add links and removes the folder afterwards.
 *
 * @param test The test to run. It gets the temporary folder and a function that copies `src` to the same path in a
 *             fresh virtual file system and returns the copied files, relative to `src`.
 */
const withFolder = (test: (dir: string, copy: (recursive: boolean, filter?: RegExp) => Record<string, string | null>,
    volume: InstanceType<typeof Volume>) => void): void => {
    const dir = realpathSync(mkdtempSync(tmpdir() + "/AntlrCopyFolder-"));
    const volume = new Volume();
    try {
        mkdirSync(dir + "/src/sub", { recursive: true });
        mkdirSync(dir + "/other");
        writeFileSync(dir + "/src/L.g4", "lexer grammar L;\n");
        writeFileSync(dir + "/src/sub/S.g4", "lexer grammar S;\n");
        writeFileSync(dir + "/other/O.g4", "lexer grammar O;\n");

        test(dir, (recursive: boolean, filter?: RegExp) => {
            volume.reset();
            const fs = createFsFromVolume(volume);
            fs.mkdirSync(dir + "/src", { recursive: true });
            copyFolderToMemFs(fs, dir + "/src", dir + "/src", recursive, filter);

            return volume.toJSON(dir + "/src", {}, true);
        }, volume);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
};

describe("copyFolderToMemFs", () => {
    it("skips folders and links to folders when not recursive", () => {
        withFolder((dir, copy) => {
            symlinkSync(dir + "/other", dir + "/src/linked");

            expect(copy(false)).toEqual({ "L.g4": "lexer grammar L;\n" });
        });
    });

    it("follows links to folders when recursive", () => {
        withFolder((dir, copy) => {
            symlinkSync(dir + "/other", dir + "/src/linked");

            expect(copy(true)).toEqual({
                "L.g4": "lexer grammar L;\n",
                "sub/S.g4": "lexer grammar S;\n",
                "linked/O.g4": "lexer grammar O;\n",
            });
        });
    });

    it("copies links to files as files", () => {
        withFolder((dir, copy, volume) => {
            symlinkSync(dir + "/other/O.g4", dir + "/src/O.g4");
            symlinkSync("L.g4", dir + "/src/Alias.g4");

            expect(copy(false, /\.g4$/)).toEqual({
                "L.g4": "lexer grammar L;\n",
                "O.g4": "lexer grammar O;\n",
                "Alias.g4": "lexer grammar L;\n",
            });
            expect(createFsFromVolume(volume).lstatSync(dir + "/src/O.g4").isSymbolicLink()).toBe(false);
        });
    });

    it("skips links that cannot be resolved", () => {
        withFolder((dir, copy) => {
            symlinkSync(dir + "/missing", dir + "/src/dangling.g4");
            symlinkSync("loop.g4", dir + "/src/loop.g4");

            expect(copy(false)).toEqual({ "L.g4": "lexer grammar L;\n" });
            expect(copy(true)).toEqual({ "L.g4": "lexer grammar L;\n", "sub/S.g4": "lexer grammar S;\n" });
        });
    });

    it("does not follow links to the folder itself or its parents", () => {
        withFolder((dir, copy) => {
            symlinkSync(".", dir + "/src/self");
            symlinkSync("..", dir + "/src/sub/parent");
            symlinkSync(dir, dir + "/src/sub/root");

            // The link to the temporary folder is followed, but not its folder `src`, which is being copied already.
            expect(copy(true)).toEqual({
                "L.g4": "lexer grammar L;\n",
                "sub/S.g4": "lexer grammar S;\n",
                "sub/root/other/O.g4": "lexer grammar O;\n",
            });
        });
    });
});
