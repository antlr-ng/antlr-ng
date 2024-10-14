/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { grammarOptions } from "../../grammar-options.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputFile } from "./OutputFile.js";

/**
 * A model object representing a parse tree listener file.
 *  These are the rules specific events triggered by a parse tree visitor.
 */
export class ListenerFile extends OutputFile {
    public genPackage?: string; // from -package cmd-line
    public accessLevel?: string; // from -DaccessLevel cmd-line
    public exportMacro?: string; // from -DexportMacro cmd-line
    public grammarName: string;
    public parserName: string;

    /** The names of all listener contexts. */
    public listenerNames = new Set<string>();

    /**
     * For listener contexts created for a labeled outer alternative, maps from
     * a listener context name to the name of the rule which defines the
     * context.
     */
    public listenerLabelRuleNames = new Map<string, string>();

    public header: Action;

    public namedActions: Map<string, Action>;

    public constructor(factory: OutputModelFactory, fileName: string) {
        super(factory, fileName);
        const g = factory.getGrammar()!;
        this.parserName = g.getRecognizerName();
        this.grammarName = g.name;
        this.namedActions = this.buildNamedActions(factory.getGrammar()!, (ast) => {
            return ast.getScope() === null;
        });

        for (const r of g.rules.values()) {
            const labels = r.getAltLabels();
            if (labels !== null) {
                for (const key of labels.keys()) {
                    this.listenerNames.add(key);
                    this.listenerLabelRuleNames.set(key, r.name);
                }
            }
            else {
                // only add rule context if no labels
                this.listenerNames.add(r.name);
            }
        }

        const ast = g.namedActions.get("header");
        if (ast?.getScope() === null) {
            this.header = new Action(factory, ast);
        }

        this.genPackage = grammarOptions.package;
        this.accessLevel = g.getOptionString("accessLevel");
        this.exportMacro = g.getOptionString("exportMacro");
    }
}
