/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import * as nodeFs from "fs";
import type { IDirent } from "memfs/lib/node/types/misc.js";
import type { IFs } from "memfs";

export const basename = (path: string, ext?: string): string => {
    const parts = path.split(/[\\/]/);
    const base = parts[parts.length - 1];
    const index = ext ? base.lastIndexOf("." + ext) : -1;

    return index === -1 ? base : base.substring(0, index);
};

export const dirname = (path: string): string => {
    const parts = path.split(/[\\/]/);
    if (parts.length === 1) {
        return ".";
    }

    return parts.slice(0, parts.length - 1).join("/");
};

/** Matches the root of an absolute path: a drive (`C:/`), a UNC prefix (`//server`) or a single slash. */
const rootPattern = /^(?:[a-zA-Z]:[\\/]|[\\/]{2}|[\\/])/;

/**
 * Joins a path to a base folder and removes `.` and `..` segments. The result uses `/` as separator, backslashes
 * are accepted in the input. Unlike `path.resolve` this does not depend on the current working directory or on
 * `node:path`, so it works the same with any file system, also in a browser.
 *
 * @param base The folder the path is relative to. Ignored if `path` is absolute.
 * @param path The path to resolve.
 *
 * @returns The normalized path. `..` segments that would go above the root of an absolute path are dropped.
 */
export const resolvePath = (base: string, path: string): string => {
    const full = rootPattern.test(path) ? path : `${base}/${path}`;
    const root = rootPattern.exec(full)?.[0] ?? "";

    const segments: string[] = [];
    for (const segment of full.substring(root.length).split(/[\\/]/)) {
        if (segment === "" || segment === ".") {
            continue;
        }

        if (segment === "..") {
            if (segments.length > 0 && segments[segments.length - 1] !== "..") {
                segments.pop();
            } else if (root === "") {
                segments.push(segment);
            }
        } else {
            segments.push(segment);
        }
    }

    const result = root.replaceAll("\\", "/") + segments.join("/");

    return result === "" ? "." : result;
};

/**
 * Copies the entire folder from the physical file system to the virtual one.
 *
 * @param fs The target file system.
 * @param source The source folder in the physical file system.
 * @param target The target folder in the virtual file system.
 * @param recursive If true, the copy operation is done recursively.
 * @param filter An optional filter to apply to the file names to copy.
 */
export const copyFolderToMemFs = (fs: IFs, source: string, target: string, recursive: boolean, filter?: RegExp) => {
    const dir = nodeFs.opendirSync(source);
    let entry: nodeFs.Dirent | null;
    while ((entry = dir.readSync()) !== null) {
        if (entry.name.startsWith(".")) {
            continue;
        }

        const sourcePath = source + "/" + entry.name;
        const targetPath = target + "/" + entry.name;
        if (entry.isDirectory()) {
            if (!recursive) {
                continue;
            }

            fs.mkdirSync(targetPath);
            copyFolderToMemFs(fs, sourcePath, targetPath, true, filter);
        } else {
            if (filter && !filter.test(entry.name)) {
                continue;
            }

            fs.writeFileSync(targetPath, nodeFs.readFileSync(sourcePath));
        }
    }
    dir.closeSync();
};

/**
 * Copies the grammar files that a grammar imports by path (`import '../shared/A.g4';`) from the physical file system
 * to the virtual one, and recursively the files these import by path. Such files can be outside the folders that are
 * copied for the grammar itself. Name imports are not handled here: they are only searched for in those folders.
 *
 * The import statements are found with a simple scan of the grammar text. A path that doesn't exist is skipped; the
 * tool reports it when it processes the grammar.
 *
 * @param fs The target file system.
 * @param grammarFile The path of the grammar file in the physical file system (the same path is used in the virtual
 *                    file system).
 * @param visited The files handled so far.
 */
export const copyImportedGrammarsToMemFs = (fs: IFs, grammarFile: string, visited = new Set<string>()): void => {
    if (visited.has(grammarFile) || !nodeFs.existsSync(grammarFile)) {
        return;
    }

    visited.add(grammarFile);
    const content = nodeFs.readFileSync(grammarFile, "utf-8");
    for (const statement of content.matchAll(/\bimport\s+([^;]+);/g)) {
        for (const literal of statement[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
            const fileName = resolvePath(dirname(grammarFile), literal[1]);
            if (!visited.has(fileName) && nodeFs.existsSync(fileName)) {
                fs.mkdirSync(dirname(fileName), { recursive: true });
                fs.writeFileSync(fileName, nodeFs.readFileSync(fileName));
                copyImportedGrammarsToMemFs(fs, fileName, visited);
            }
        }
    }
};

/**
 * Copies the entire folder from the virtual filesystem to physical file one.
 *
 * @param fs The source file system.
 * @param source The source folder in the physical file system.
 * @param target The target folder in the virtual file system.
 * @param recursive If true, the copy operation is done recursively.
 * @param filter An optional filter to apply to the file names to copy.
 */
export const copyFolderFromMemFs = (fs: IFs, source: string, target: string, recursive: boolean, filter?: RegExp) => {
    const entries = fs.readdirSync(source, { withFileTypes: true, encoding: "utf-8" }) as IDirent[];
    for (const entry of entries) {
        const name = entry.name.toString();
        if (name.toString().startsWith(".")) {
            continue;
        }

        const sourcePath = source + "/" + name;
        const targetPath = target + "/" + name;
        if (entry.isDirectory()) {
            if (!recursive) {
                continue;
            }

            nodeFs.mkdirSync(targetPath);
            copyFolderFromMemFs(fs, sourcePath, targetPath, recursive, filter);
        } else {
            if (filter && !filter.test(name)) {
                continue;
            }

            nodeFs.writeFileSync(targetPath, fs.readFileSync(sourcePath));
        }
    }
};

/**
 * Generates a randome file name with the given prefix and length.
 *
 * @param prefix A string to use as the prefix of the result file name.
 * @param length The length of the random part of the file name.
 *
 * @returns A random file name.
 */
export const generateRandomFilename = (prefix: string, length = 8): string => {
    // Characters allowed in file names across platforms.
    const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

    let randomChars = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * validChars.length);
        randomChars += validChars[randomIndex];
    }

    return `${prefix}${randomChars}`;
};
