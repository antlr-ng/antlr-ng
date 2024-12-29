/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CharSupport } from "../../misc/CharSupport.js";
import { GrammarAST } from "./GrammarAST.js";

export abstract class GrammarASTWithOptions extends GrammarAST {
    public override readonly astType: string = "GrammarASTWithOptions";

    private options = new Map<string, GrammarAST | null>();

    public setOption(key: string, node: GrammarAST | null): void {
        this.options.set(key, node);
    }

    public getOptionString(key: string): string | undefined {
        const value = this.getOptionAST(key);
        if (value === undefined) {
            return value;
        }

        if (value.astType === "ActionAST") {
            return value.getText();
        } else {
            let v: string | null = value.getText();
            if (v && (v.startsWith("'") || v.startsWith("\""))) {
                v = CharSupport.getStringFromGrammarStringLiteral(v, this.g, { line: 1, column: 0 });
                if (v === null) {
                    v = "";
                }
            }

            return v;
        }
    }

    /**
     * Gets AST node holding value for option key; ignores default options
     * and command-line forced options.
     */
    public getOptionAST(key: string): GrammarAST | undefined {
        return this.options.get(key) ?? undefined;
    }

    public getNumberOfOptions(): number {
        return this.options.size;
    }

    public getOptions(): Map<string, GrammarAST | null> {
        return this.options;
    }

    public abstract override dupNode(): GrammarASTWithOptions;
}
