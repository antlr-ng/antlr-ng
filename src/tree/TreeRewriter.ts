/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param */
// cspell: ignore topdown, bottomup

import { RecognitionException, type TokenStream } from "antlr4ng";

import type { ErrorManager } from "../tool/ErrorManager.js";
import type { CommonTree } from "./CommonTree.js";
import { CommonTreeAdaptor } from "./CommonTreeAdaptor.js";
import { CommonTreeNodeStream } from "./CommonTreeNodeStream.js";
import { createRecognizerSharedState, IRecognizerSharedState } from "./misc/IRecognizerSharedState.js";
import { TreeParser } from "./TreeParser.js";
import { TreeVisitor } from "./TreeVisitor.js";
import type { TreeVisitorAction } from "./TreeVisitorAction.js";

export class TreeRewriter extends TreeParser {

    protected showTransformations = false;
    protected originalTokenStream: TokenStream;
    protected originalAdaptor: CommonTreeAdaptor;

    public constructor(errorManager: ErrorManager, input: CommonTreeNodeStream, state?: IRecognizerSharedState) {
        state ??= createRecognizerSharedState();
        super(errorManager, input, state);
        this.originalAdaptor = input.getTreeAdaptor();
        this.originalTokenStream = input.getTokenStream();
    }

    public downUp(t: CommonTree, showTransformations?: boolean): CommonTree {
        this.showTransformations = showTransformations ?? false;
        const v = new TreeVisitor();
        const actions = new class implements TreeVisitorAction<CommonTree> {
            public constructor(private $outer: TreeRewriter) {
            }

            public pre(t: CommonTree): CommonTree {
                return this.$outer.applyOnce(t, this.$outer.topdown);
            }

            public post(t: CommonTree): CommonTree {
                return this.$outer.applyRepeatedly(t);
            }
        }(this);
        t = v.visit(t, actions);

        return t;
    }

    /**
     * Methods the down-up strategy uses to do the up and down rules.
     * To override, just define tree grammar rule topdown and turn on
     * filter=true.
     *
     * @returns the tree created from applying the down-up rules
     */
    protected topdown = (): CommonTree | undefined => {
        return undefined;
    };

    protected bottomup = (): CommonTree | undefined => {
        return undefined;
    };

    protected override getTokenNames(): string[] {
        return [];
    }

    private applyOnce = (t: CommonTree, whichRule: () => CommonTree | undefined): CommonTree => {
        try {
            // share TreeParser object but not parsing-related state
            this.state = createRecognizerSharedState();
            const input = new CommonTreeNodeStream(this.originalAdaptor, t);
            input.setTokenStream(this.originalTokenStream);
            this.input = input;

            this.setBacktrackingLevel(1);
            const r = whichRule();
            this.setBacktrackingLevel(0);
            if (this.failed) {
                return t;
            }

            if (this.showTransformations && r && t !== r) {
                this.reportTransformation(t, r);
            }

            if (r) {
                return r;
            }

            return t;
        } catch (e) {
            if (!(e instanceof RecognitionException)) {
                throw e;
            }
        }

        return t;
    };

    private applyRepeatedly(t: CommonTree): CommonTree {
        let treeChanged = true;
        while (treeChanged) {
            const u = this.applyOnce(t, this.bottomup);
            treeChanged = t !== u;
            t = u;
        }

        return t;
    }

    /**
     * Override this if you need transformation tracing to go somewhere
     *  other than stdout or if you're not using Tree-derived trees.
     */
    private reportTransformation(oldTree: CommonTree, newTree: CommonTree): void {
        console.log(`${oldTree.toStringTree()} -> ${newTree.toStringTree()}`);
    }

}
