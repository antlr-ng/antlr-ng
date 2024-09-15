/* java2ts: keep */

/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

// cspell: disable

import { CommonToken, Token } from "antlr4ng";
import type { TreeAdaptor } from "./TreeAdaptor.js";
import { TreePatternLexer } from "./TreePatternLexer.js";
import { TreeWizard } from "./TreeWizard.js";
import type { Tree } from "./Tree.js";

export class TreePatternParser {
    protected tokenizer: TreePatternLexer;
    protected ttype: number;
    protected wizard: TreeWizard;
    protected adaptor: TreeAdaptor;

    public constructor(tokenizer: TreePatternLexer, wizard: TreeWizard, adaptor: TreeAdaptor) {
        this.tokenizer = tokenizer;
        this.wizard = wizard;
        this.adaptor = adaptor;
        this.ttype = tokenizer.nextToken(); // kickstart
    }

    public pattern(): Tree | null {
        if (this.ttype === TreePatternLexer.BEGIN) {
            return this.parseTree();
        } else {
            if (this.ttype === TreePatternLexer.ID) {
                const node = this.parseNode();
                if (this.ttype === TreePatternLexer.EOF) {
                    return node;
                }

                return null; // extra junk on end
            }
        }

        return null;
    }

    public parseTree(): Tree | null {
        if (this.ttype !== TreePatternLexer.BEGIN) {
            throw new Error("no BEGIN");
        }

        this.ttype = this.tokenizer.nextToken();
        const root = this.parseNode();
        if (root === null) {
            return null;
        }

        while (this.ttype === TreePatternLexer.BEGIN ||
            this.ttype === TreePatternLexer.ID ||
            this.ttype === TreePatternLexer.PERCENT ||
            this.ttype === TreePatternLexer.DOT) {
            if (this.ttype === TreePatternLexer.BEGIN) {
                const subtree = this.parseTree();
                if (subtree) {
                    this.adaptor.addChild(root, subtree);
                }
            }
            else {
                const child = this.parseNode();
                if (child === null) {
                    return null;
                }
                this.adaptor.addChild(root, child);
            }
        }

        if (this.ttype !== TreePatternLexer.END) {
            throw new Error("no END");
        }

        this.ttype = this.tokenizer.nextToken();

        return root;
    }

    public parseNode(): Tree | null {
        // "%label:" prefix
        let label = null;
        if (this.ttype === TreePatternLexer.PERCENT) {
            this.ttype = this.tokenizer.nextToken();
            if (this.ttype !== TreePatternLexer.ID) {
                return null;
            }

            label = this.tokenizer.sval.toString();
            this.ttype = this.tokenizer.nextToken();
            if (this.ttype !== TreePatternLexer.COLON) {
                return null;
            }

            this.ttype = this.tokenizer.nextToken(); // move to ID following colon
        }

        // Wildcard?
        if (this.ttype === TreePatternLexer.DOT) {
            this.ttype = this.tokenizer.nextToken();
            const wildcardPayload = CommonToken.fromType(0, ".");
            const node = new TreeWizard.WildcardTreePattern(wildcardPayload);
            if (label !== null) {
                node.label = label;
            }

            return node;
        }

        // "ID" or "ID[arg]"
        if (this.ttype !== TreePatternLexer.ID) {
            return null;
        }

        const tokenName = this.tokenizer.sval.toString();
        this.ttype = this.tokenizer.nextToken();
        if (tokenName === "nil") {
            return this.adaptor.nil();
        }

        let text = tokenName;
        // check for arg
        let arg = null;
        if (this.ttype === TreePatternLexer.ARG) {
            arg = this.tokenizer.sval.toString();
            text = arg;
            this.ttype = this.tokenizer.nextToken();
        }

        // create node
        const treeNodeType = this.wizard.getTokenType(tokenName);
        if (treeNodeType === Token.INVALID_TYPE) {
            return null;
        }

        const node = this.adaptor.create(treeNodeType, text);
        if (label !== null && node instanceof TreeWizard.TreePattern) {
            node.label = label;
        }

        if (arg !== null && node instanceof TreeWizard.TreePattern) {
            node.hasTextArg = true;
        }

        return node;
    }
}
