/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ClassFactory } from "../ClassFactory.js";
import type { ILexerGrammar, IRule, ITool } from "../types.js";

import { ANTLRToolListener } from "./ANTLRToolListener.js";
import type { GrammarRootAST } from "./ast/GrammarRootAST.js";
import { Grammar } from "./Grammar.js";

export class LexerGrammar extends Grammar implements ILexerGrammar {
    public override readonly grammarType = "lexerGrammar";

    /** The grammar from which this lexer grammar was derived (if implicit) */
    public implicitLexerOwner: Grammar;

    /** DEFAULT_MODE rules are added first due to grammar syntax order */
    public modes = new Map<string, IRule[]>();

    public constructor(grammarText: string);
    public constructor(tool: ITool, ast: GrammarRootAST);
    public constructor(grammarText: string, listener: ANTLRToolListener);
    public constructor(fileName: string, grammarText: string, listener: ANTLRToolListener);
    public constructor(...args: unknown[]) {
        switch (args.length) {
            case 1: {
                const [grammarText] = args as [string];

                super(grammarText);

                break;
            }

            case 2: {
                if (typeof args[0] === "string") {
                    const [grammarText, listener] = args as [string, ANTLRToolListener];

                    super(grammarText, listener);

                    break;
                } else {
                    const [tool, ast] = args as [ITool, GrammarRootAST];

                    super(tool, ast);

                    break;
                }
            }

            case 3: {
                const [fileName, grammarText, listener] = args as [string, string, ANTLRToolListener];

                super(fileName, grammarText, listener);

                break;
            }

            default: {
                throw new Error("Invalid number of arguments");
            }
        }
    }

    public override defineRule(r: IRule): boolean {
        if (!super.defineRule(r) || !r.mode) {
            return false;
        }

        let ruleList = this.modes.get(r.mode);
        if (!ruleList) {
            ruleList = [];
            this.modes.set(r.mode, ruleList);
        }
        ruleList.push(r);

        return true;
    }

    public override undefineRule(r: IRule): boolean {
        if (!super.undefineRule(r) || !r.mode) {
            return false;
        }

        const ruleList = this.modes.get(r.mode);
        if (!ruleList) {
            return false;
        }

        const index = ruleList.indexOf(r);
        if (index === -1) {
            return false;
        }

        ruleList.splice(index, 1);

        return true;
    }

    static {
        ClassFactory.createLexerGrammar = (tool: ITool, ast: GrammarRootAST) => {
            return new LexerGrammar(tool, ast);
        };
    }
}
