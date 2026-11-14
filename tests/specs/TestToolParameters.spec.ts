/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { describe, expect, it, vi } from "vitest";

import { fs } from "memfs";

import { fileSystem, parseToolParameters, useFileSystem } from "../../src/tool-parameters.js";

describe("Tool parameters coverage", () => {
    it("parses all options", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { /**/ });
        try {
            const parameters = parseToolParameters([
                "-o", "out",
                "--lib", "lib",
                "--atn", "true",
                "-e", "utf8",
                "--long-messages", "yes",
                "-l", "1",
                "-v", "on",
                "-p", "my.pkg",
                "-d", "false",
                "-D", "language=TypeScript", "-D", "superClass=Base",
                "-w", "True",
                "-f", "off",
                "--log",
                "--exact-output-dir", "0",
                "A.g4", "B.g4",
            ]);

            expect(parameters.outputDirectory).toBe("out");
            expect(parameters.lib).toBe("lib");
            expect(parameters.atn).toBe(true);
            expect(parameters.encoding).toBe("utf8");
            expect(parameters.longMessages).toBe(true);
            expect(parameters.generateListener).toBe(true);
            expect(parameters.generateVisitor).toBe(true);
            expect(parameters.package).toBe("my.pkg");
            expect(parameters.generateDependencies).toBe(false);
            expect(parameters.define).toEqual({ language: "TypeScript", superClass: "Base" });
            expect(parameters.warningsAreErrors).toBe(true);
            expect(parameters.forceAtn).toBe(false);
            expect(parameters.log).toBe(true);
            expect(parameters.exactOutputDir).toBe(false);
            expect(parameters.grammarFiles).toEqual(["A.g4", "B.g4"]);
            expect(parameters.config).toBeUndefined();

            // Command line parameters are deprecated.
            expect(warn).toHaveBeenCalledWith("Command line parameters are deprecated. Use a config file instead.");
        } finally {
            warn.mockRestore();
        }
    });

    it("uses long option names and leaves unspecified options undefined", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { /**/ });
        try {
            const parameters = parseToolParameters([
                "--output-directory", "gen",
                "--encoding", "latin1",
                "--generate-listener", "false",
                "--generate-visitor", "no",
                "--package", "p",
                "--generate-dependencies", "yes",
                "--define", "a=1",
                "--warnings-are-errors", "nope",
                "--force-atn", "TRUE",
                "--log", "false",
                "C.g4",
            ]);

            expect(parameters.outputDirectory).toBe("gen");
            expect(parameters.encoding).toBe("latin1");
            expect(parameters.generateListener).toBe(false);
            expect(parameters.generateVisitor).toBe(false);
            expect(parameters.package).toBe("p");
            expect(parameters.generateDependencies).toBe(true);
            expect(parameters.define).toEqual({ a: "1" });
            expect(parameters.warningsAreErrors).toBe(false);
            expect(parameters.forceAtn).toBe(true);
            expect(parameters.log).toBe(false);
            expect(parameters.atn).toBeUndefined();
            expect(parameters.lib).toBeUndefined();
            expect(parameters.exactOutputDir).toBeUndefined();
            expect(parameters.grammarFiles).toEqual(["C.g4"]);
        } finally {
            warn.mockRestore();
        }
    });

    it("accepts a config file alone without deprecation warning", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { /**/ });
        try {
            // The config file lists the grammar files, so none are needed here.
            const parameters = parseToolParameters(["-c", "antlr-ng.config.json"]);
            expect(parameters.config).toBe("antlr-ng.config.json");
            expect(parameters.grammarFiles).toEqual([]);
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    /**
     * Parses the arguments and expects the parser to fail with the given error message.
     *
     * @param args The command line arguments.
     * @param message The expected error message.
     */
    const expectFailure = (args: string[], message: string): void => {
        const error = vi.spyOn(console, "error").mockImplementation(() => { /**/ });
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { /**/ });
        const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
            throw new Error(`exit ${code}`);
        }) as (code?: number) => never);

        try {
            expect(() => {
                parseToolParameters(args);
            }).toThrow("exit 1");
            expect(error).toHaveBeenCalledWith(message);
            expect(exit).toHaveBeenCalledWith(1);
        } finally {
            error.mockRestore();
            warn.mockRestore();
            exit.mockRestore();
        }
    };

    it("rejects a config file together with other options", () => {
        expectFailure(["--config", "cfg.json", "-o", "out", "E.g4"],
            "Cannot use a config file together with other options.");
    });

    it("rejects a config file together with grammar files, which would be ignored", () => {
        expectFailure(["-c", "cfg.json", "E.g4"], "Cannot use a config file together with other options.");
    });

    it("requires grammar files without a config file", () => {
        expectFailure([], "No grammar files given. Use a config file or list the grammar files.");
        expectFailure(["-o", "out"], "No grammar files given. Use a config file or list the grammar files.");
    });

    it("allows switching the virtual file system", () => {
        const current = fileSystem;
        try {
            const other = { existsSync: () => { return false; } } as unknown as typeof fs;
            useFileSystem(other);
            expect(fileSystem).toBe(other);
        } finally {
            useFileSystem(current);
            expect(fileSystem).toBe(current);
        }
    });
});
