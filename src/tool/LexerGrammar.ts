/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ClassFactory } from "../ClassFactory.js";
import type { ILexerGrammar, IRule, ITool } from "../types.js";

import type { GrammarRootAST } from "./ast/GrammarRootAST.js";
import { Grammar } from "./Grammar.js";

export class LexerGrammar extends Grammar implements ILexerGrammar {
    /** The grammar from which this lexer grammar was derived (if implicit). */
    public implicitLexerOwner: Grammar;

    /** DEFAULT_MODE rules are added first due to grammar syntax order. */
    public modes = new Map<string, IRule[]>();

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

    protected override undefineRule(r: IRule): boolean {
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
