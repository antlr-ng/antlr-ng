/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import * as nodeFs from "fs";

import { CharStream, Token } from "antlr4ng";
import type { IFs } from "memfs";

import { Constants } from "../Constants.js";
import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";
import { CharSupport } from "../misc/CharSupport.js";
import { dirname, resolvePath } from "./fs-helpers.js";

/** An import of a grammar, as written in an import statement. */
export interface IGrammarImport {
    /** True for an import by file path (a string literal), false for an import by grammar name. */
    isPath: boolean;

    /** The grammar name, or the string literal including its quotes. */
    text: string;
}

/**
 * Lists the imports of a grammar. The grammar is only tokenized, not parsed, so this also works for grammars with
 * errors. Text in comments, actions and string literals is not mistaken for an import statement.
 *
 * @param content The text of the grammar.
 *
 * @returns The imported grammars, in the order in which they are imported. For `import X = A;` this is A.
 */
export const findGrammarImports = (content: string): IGrammarImport[] => {
    const lexer = new ANTLRv4Lexer(CharStream.fromString(content));
    lexer.removeErrorListeners();
    const tokens = lexer.getAllTokens().filter((token) => {
        return token.channel === Token.DEFAULT_CHANNEL;
    });

    const result: IGrammarImport[] = [];
    for (let i = 0; i < tokens.length; ++i) {
        if (tokens[i].type !== ANTLRv4Lexer.IMPORT) {
            continue;
        }

        // Each import is the last token before a comma or the semicolon.
        for (++i; i < tokens.length && tokens[i].type !== ANTLRv4Lexer.SEMI; ++i) {
            const next = tokens[i + 1]?.type;
            if (next !== ANTLRv4Lexer.COMMA && next !== ANTLRv4Lexer.SEMI) {
                continue;
            }

            const token = tokens[i];
            switch (token.type) {
                case ANTLRv4Lexer.STRING_LITERAL: {
                    result.push({ isPath: true, text: token.text! });
                    break;
                }

                case ANTLRv4Lexer.TOKEN_REF:
                case ANTLRv4Lexer.RULE_REF: {
                    result.push({ isPath: false, text: token.text! });
                    break;
                }

                default:
            }
        }
    }

    return result;
};

/**
 * Determines the file of an imported grammar in the physical file system, the same way the tool does: a path is
 * relative to the importing grammar, a name is searched for in the current directory, the folder of the importing
 * grammar and the lib folder.
 *
 * @param grammarFile The path of the importing grammar.
 * @param grammarImport The import.
 * @param lib The lib folder, if any.
 *
 * @returns The path of the imported grammar file, or undefined if there is no such file.
 */
const findImportedFile = (grammarFile: string, grammarImport: IGrammarImport, lib?: string): string | undefined => {
    const isFile = (fileName: string): boolean => {
        return nodeFs.statSync(fileName, { throwIfNoEntry: false })?.isFile() ?? false;
    };

    if (grammarImport.isPath) {
        // Invalid or empty literals are left to the tool, which reports them.
        const path = CharSupport.getStringFromGrammarStringLiteral(grammarImport.text);
        if (!path) {
            return undefined;
        }

        const fileName = resolvePath(dirname(grammarFile), path);

        return isFile(fileName) ? fileName : undefined;
    }

    for (const extension of Constants.AllGrammarExtensions) {
        const name = grammarImport.text + extension;
        for (const candidate of [name, dirname(grammarFile) + "/" + name, lib ? lib + "/" + name : undefined]) {
            if (candidate && isFile(candidate)) {
                return candidate;
            }
        }
    }

    return undefined;
};

/**
 * Copies the grammar files that a grammar imports from the physical file system to the virtual one, and recursively
 * the files these import. Imports by path can be anywhere, and grammars imported by name can import other grammars
 * by path, so the files can be outside the folders that are copied for the grammar itself.
 *
 * Each file is copied once, to its real path (without symbolic links), and its imports are resolved from there, as the
 * tool does. An import through a symbolic link becomes a symbolic link to that copy, so the tool sees the same file
 * under both paths.
 *
 * Imports that cannot be found are skipped. The tool reports them when it processes the grammar.
 *
 * @param fs The target file system.
 * @param grammarFile The path of the grammar file in the physical file system (the same path is used in the virtual
 *                    file system).
 * @param lib The lib folder, if any.
 * @param visited The real paths of the files handled so far.
 */
export const copyImportedGrammarsToMemFs = (fs: IFs, grammarFile: string, lib?: string,
    visited = new Set<string>()): void => {
    if (!nodeFs.existsSync(grammarFile)) {
        return;
    }

    visited.add(nodeFs.realpathSync(grammarFile));
    for (const grammarImport of findGrammarImports(nodeFs.readFileSync(grammarFile, "utf-8"))) {
        const fileName = findImportedFile(grammarFile, grammarImport, lib);
        if (!fileName) {
            continue;
        }

        const realPath = nodeFs.realpathSync(fileName);
        const isAlias = resolvePath(".", fileName) !== realPath;
        if (isAlias) {
            // The folder copies of the CLI may already contain the alias as a separate file.
            fs.mkdirSync(dirname(fileName), { recursive: true });
            if (fs.lstatSync(fileName, { throwIfNoEntry: false })?.isSymbolicLink() !== true) {
                fs.rmSync(fileName, { force: true });
                fs.symlinkSync(realPath, fileName);
            }
        }

        if (!visited.has(realPath)) {
            fs.mkdirSync(dirname(realPath), { recursive: true });
            fs.writeFileSync(realPath, nodeFs.readFileSync(realPath));
            copyImportedGrammarsToMemFs(fs, realPath, lib, visited);
        }
    }
};
