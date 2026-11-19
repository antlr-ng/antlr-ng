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

/**
 * Matches the root of an absolute path: a drive (`C:/`), a UNC share (`//server/share/`), a bare UNC prefix (`//`)
 * or a single slash.
 */
const rootPattern = /^(?:[a-zA-Z]:[\\/]|[\\/]{2}[^\\/]+[\\/][^\\/]+(?:[\\/]|$)|[\\/]{2}|[\\/])/;

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

    let normalizedRoot = root.replaceAll("\\", "/");
    if (/^\/\/[^/]+\/[^/]+/.test(normalizedRoot)) {
        // A UNC share is separated from the following segments like a folder.
        normalizedRoot = normalizedRoot.replace(/\/$/, "");
        if (segments.length > 0) {
            normalizedRoot += "/";
        }
    }
    const result = normalizedRoot + segments.join("/");

    return result === "" ? "." : result;
};

/**
 * Determines the status of a file in the physical file system, following symbolic links.
 *
 * @param path The path of the file.
 *
 * @returns The status of the file or `undefined` if it cannot be determined (e.g. a dangling link or a link cycle).
 */
const statOrUndefined = (path: string): nodeFs.Stats | undefined => {
    try {
        return nodeFs.statSync(path);
    } catch {
        return undefined;
    }
};

/**
 * Copies the entire folder from the physical file system to the virtual one.
 *
 * Symbolic links are followed: a link to a file is copied as a file, a link to a folder is handled like a folder.
 * Links that cannot be resolved are skipped. In recursive mode a folder that is already being copied (a link to
 * the folder itself or to one of its parents) is skipped, to avoid endless recursion.
 *
 * @param fs The target file system.
 * @param source The source folder in the physical file system.
 * @param target The target folder in the virtual file system.
 * @param recursive If true, the copy operation is done recursively.
 * @param filter An optional filter to apply to the file names to copy.
 */
export const copyFolderToMemFs = (fs: IFs, source: string, target: string, recursive: boolean, filter?: RegExp) => {
    copyFolder(fs, source, target, recursive, new Set<string>(), filter);
};

/**
 * Implements `copyFolderToMemFs`.
 *
 * @param fs The target file system.
 * @param source The source folder in the physical file system.
 * @param target The target folder in the virtual file system.
 * @param recursive If true, the copy operation is done recursively.
 * @param ancestors The real paths of the folders being copied, from the top level folder to the parent of `source`.
 * @param filter An optional filter to apply to the file names to copy.
 */
const copyFolder = (fs: IFs, source: string, target: string, recursive: boolean, ancestors: Set<string>,
    filter?: RegExp): void => {
    const realSource = nodeFs.realpathSync(source);
    ancestors.add(realSource);

    const dir = nodeFs.opendirSync(source);
    let entry: nodeFs.Dirent | null;
    while ((entry = dir.readSync()) !== null) {
        if (entry.name.startsWith(".")) {
            continue;
        }

        const sourcePath = source + "/" + entry.name;
        const targetPath = target + "/" + entry.name;
        let isDirectory = entry.isDirectory();
        if (entry.isSymbolicLink()) {
            const stats = statOrUndefined(sourcePath);
            if (!stats) {
                continue;
            }

            isDirectory = stats.isDirectory();
        }

        if (isDirectory) {
            if (!recursive || ancestors.has(nodeFs.realpathSync(sourcePath))) {
                continue;
            }

            fs.mkdirSync(targetPath);
            copyFolder(fs, sourcePath, targetPath, true, ancestors, filter);
        } else {
            if (filter && !filter.test(entry.name)) {
                continue;
            }

            fs.writeFileSync(targetPath, nodeFs.readFileSync(sourcePath));
        }
    }
    dir.closeSync();
    ancestors.delete(realSource);
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
