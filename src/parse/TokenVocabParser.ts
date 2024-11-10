/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/* eslint-disable jsdoc/require-returns */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";

import { Token } from "antlr4ng";

import { Constants } from "../Constants1.js";
import { grammarOptions } from "../grammar-options.js";
import { ErrorManager } from "../tool/ErrorManager.js";
import { ErrorType } from "../tool/ErrorType.js";
import type { IGrammar } from "../types.js";

const linePattern = /([^\n]+?)[ \\t]*?=[ \\t]*?([0-9]+);/;

export class TokenVocabParser {
    protected readonly g: IGrammar;

    public constructor(g: IGrammar) {
        this.g = g;
    }

    /** Load a vocab file {@code <vocabName>.tokens} and return mapping. */
    public load(): Map<string, number> {
        const tokens = new Map<string, number>();
        let maxTokenType = -1;
        const tool = this.g.tool;
        const vocabName = this.g.getOptionString("tokenVocab");

        const content = this.getImportedVocabFile();
        const lines = content.split("\n");

        let lineNum = 1;
        for (const tokenDef of lines) {
            ++lineNum;
            if (tokenDef.length === 0) {
                // ignore blank lines
                continue;
            }

            const match = linePattern.exec(tokenDef);
            if (match?.groups) {
                const tokenID = match.groups[1];
                const tokenTypeS = match.groups[2];
                let tokenType: number;
                try {
                    tokenType = Number.parseInt(tokenTypeS);
                } catch {
                    ErrorManager.get().toolError(ErrorType.TOKENS_FILE_SYNTAX_ERROR,
                        vocabName + Constants.VOCAB_FILE_EXTENSION, " bad token type: " + tokenTypeS,
                        lineNum);
                    tokenType = Token.INVALID_TYPE;
                }

                tool.logInfo({ component: "grammar", msg: "import " + tokenID + "=" + tokenType });
                tokens.set(tokenID, tokenType);
                maxTokenType = Math.max(maxTokenType, tokenType);
            } else if (tokenDef.length > 0) {
                ErrorManager.get().toolError(ErrorType.TOKENS_FILE_SYNTAX_ERROR,
                    vocabName + Constants.VOCAB_FILE_EXTENSION, " bad token def: " + tokenDef, lineNum);
            }
        }

        return tokens;
    }

    /**
     * Return the content of the vocab file. Look in library or in -o output path.  antlr -o foo T.g4 U.g4 where U
     * needs T.tokens won't work unless we look in foo too. If we do not find the file in the lib directory then must
     * assume that the .tokens file is going to be generated as part of this build and we have defined .tokens files
     * so that they ALWAYS are generated in the base output directory, which means the current directory for the
     * command line tool if there was no output directory specified.
     */
    public getImportedVocabFile(): string {
        const vocabName = this.g.getOptionString("tokenVocab");
        if (!vocabName) {
            return "";
        }

        try {
            let name = join(grammarOptions.libDirectory ?? ".", vocabName, Constants.VOCAB_FILE_EXTENSION);
            if (existsSync(name)) {
                return readFileSync(name, "utf8");
            }

            // We did not find the vocab file in the lib directory, so we need to look for it in the output directory
            // which is where .tokens files are generated (in the base, not relative to the input location.)
            if (grammarOptions.outputDirectory) {
                name = join(grammarOptions.outputDirectory, vocabName, Constants.VOCAB_FILE_EXTENSION);
                if (existsSync(name)) {
                    return readFileSync(name, "utf8");
                }
            }

            // Still not found? Use the grammar's subfolder then.
            name = dirname(this.g.fileName);
            if (name) {
                name = join(name, vocabName, Constants.VOCAB_FILE_EXTENSION);
                if (existsSync(name)) {
                    return readFileSync(name, "utf8");
                }
            }

            // File not found.
            const inTree = this.g.ast.getOptionAST("tokenVocab");
            const inTreeValue = inTree?.token?.text;
            if (vocabName === inTreeValue) {
                ErrorManager.get().grammarError(ErrorType.CANNOT_FIND_TOKENS_FILE_REFD_IN_GRAMMAR, this.g.fileName,
                    inTree?.token ?? null, inTreeValue);
            } else { // must be from -D option on cmd-line not token in tree
                ErrorManager.get().toolError(ErrorType.CANNOT_FIND_TOKENS_FILE_GIVEN_ON_CMDLINE, vocabName,
                    this.g.name);
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            ErrorManager.get().toolError(ErrorType.ERROR_READING_TOKENS_FILE, e, vocabName, message);
        }

        return "";
    }
}
