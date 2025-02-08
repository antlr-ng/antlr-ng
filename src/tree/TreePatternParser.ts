/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CommonToken, Token } from "antlr4ng";

import { CommonTree } from "./CommonTree.js";
import { TreePattern } from "./TreePattern.js";
import { TreePatternLexer } from "./TreePatternLexer.js";
import { TreeWizard } from "./TreeWizard.js";
import { WildcardTreePattern } from "./WildcardTreePattern.js";

export class TreePatternParser {
    protected tokenizer: TreePatternLexer;
    protected ttype: number;
    protected wizard: TreeWizard;

    public constructor(tokenizer: TreePatternLexer, wizard: TreeWizard) {
        this.tokenizer = tokenizer;
        this.wizard = wizard;
        this.ttype = tokenizer.nextToken();
    }

    public pattern(): CommonTree | null {
        if (this.ttype === TreePatternLexer.BEGIN) {
            return this.parseTree();
        } else if (this.ttype === TreePatternLexer.ID) {
            const node = this.parseNode();
            if (this.ttype === TreePatternLexer.EOF) {
                return node;
            }

            return null; // Extra junk on end.
        }

        return null;
    }

    public parseTree(): CommonTree | null {
        if (this.ttype !== TreePatternLexer.BEGIN) {
            throw new Error("no BEGIN");
        }

        this.ttype = this.tokenizer.nextToken();
        const root = this.parseNode();
        if (root === null) {
            return null;
        }

        while (this.ttype === TreePatternLexer.BEGIN
            || this.ttype === TreePatternLexer.ID
            || this.ttype === TreePatternLexer.PERCENT
            || this.ttype === TreePatternLexer.DOT) {
            if (this.ttype === TreePatternLexer.BEGIN) {
                const subtree = this.parseTree();
                if (subtree) {
                    root.addChild(subtree);
                }
            } else {
                const child = this.parseNode();
                if (child === null) {
                    return null;
                }
                root.addChild(child);
            }
        }

        if (this.ttype !== TreePatternLexer.END) {
            throw new Error("no END");
        }

        this.ttype = this.tokenizer.nextToken();

        return root;
    }

    public parseNode(): CommonTree | null {
        // "%label:" prefix.
        let label = null;
        if (this.ttype === TreePatternLexer.PERCENT) {
            this.ttype = this.tokenizer.nextToken();
            if (this.ttype !== TreePatternLexer.ID) {
                return null;
            }

            label = this.tokenizer.stringValue;
            this.ttype = this.tokenizer.nextToken();
            if (this.ttype !== TreePatternLexer.COLON) {
                return null;
            }

            this.ttype = this.tokenizer.nextToken(); // Move to ID following colon.
        }

        // Wildcard?
        if (this.ttype === TreePatternLexer.DOT) {
            this.ttype = this.tokenizer.nextToken();
            const wildcardPayload = CommonToken.fromType(0, ".");
            const node = new WildcardTreePattern(wildcardPayload);
            if (label !== null) {
                node.label = label;
            }

            return node;
        }

        // "ID" or "ID[arg]".
        if (this.ttype !== TreePatternLexer.ID) {
            return null;
        }

        const tokenName = this.tokenizer.stringValue;
        this.ttype = this.tokenizer.nextToken();
        if (tokenName === "nil") {
            return new TreePattern();
        }

        // Check for arg.
        let text = tokenName;
        let arg = null;
        if (this.ttype === TreePatternLexer.ARG) {
            arg = this.tokenizer.stringValue;
            text = arg;
            this.ttype = this.tokenizer.nextToken();
        }

        // Create node.
        const treeNodeType = this.wizard.getTokenType(tokenName);
        if (treeNodeType === Token.INVALID_TYPE) {
            return null;
        }

        const token = CommonToken.fromType(treeNodeType, text);
        const node = new TreePattern(token);
        if (label !== null) {
            node.label = label;
        }

        if (arg !== null) {
            node.hasTextArg = true;
        }

        return node;
    }
}
