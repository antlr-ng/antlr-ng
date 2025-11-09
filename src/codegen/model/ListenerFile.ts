/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { type IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputFile } from "./OutputFile.js";

/**
 * A model object representing a parse tree listener file.
 *  These are the rules specific events triggered by a parse tree visitor.
 */
export class ListenerFile extends OutputFile {
    public accessLevel?: string;
    public grammarName: string;
    public parserName: string;

    /** The names of all listener contexts. */
    public listenerNames = new Set<string>();

    /**
     * For listener contexts created for a labeled outer alternative, maps from a listener context name to the name
     * of the rule which defines the context.
     */
    public listenerLabelRuleNames = new Map<string, string>();

    public header?: Action;

    public namedActions: Map<string, Action>;

    public constructor(factory: IOutputModelFactory, fileName: string) {
        super(factory, fileName);

        this.parserName = factory.grammar.getRecognizerName();
        this.grammarName = factory.grammar.name;
        this.namedActions = this.buildNamedActions((ast) => {
            return ast.getScope() === null;
        });

        for (const r of factory.grammar.rules.values()) {
            const labels = r.getAltLabels();
            if (labels !== null) {
                for (const key of labels.keys()) {
                    this.listenerNames.add(key);
                    this.listenerLabelRuleNames.set(key, r.name);
                }
            } else {
                // Only add rule context if no labels.
                this.listenerNames.add(r.name);
            }
        }

        const ast = factory.grammar.namedActions.get("header");
        if (ast?.getScope() === null) {
            this.header = new Action(factory, ast);
        }

        this.accessLevel = factory.grammar.getOptionString("accessLevel");
    }

}
