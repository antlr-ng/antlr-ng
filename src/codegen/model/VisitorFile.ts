/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputFile } from "./OutputFile.js";

export class VisitorFile extends OutputFile {
    public accessLevel?: string;
    public exportMacro?: string;
    public grammarName: string;
    public parserName: string;

    /** The names of all rule contexts which may need to be visited. */
    public visitorNames = new Set<string>();

    /**
     * For rule contexts created for a labeled outer alternative, maps from a listener context name to the name of
     * the rule which defines the context.
     */
    public visitorLabelRuleNames = new Map<string, string>();

    public header: Action;

    public namedActions: Map<string, Action>;

    public constructor(factory: IOutputModelFactory, fileName: string) {
        super(factory, fileName);

        this.namedActions = this.buildNamedActions((ast) => {
            return ast.getScope() === null;
        });

        this.parserName = factory.grammar.getRecognizerName();
        this.grammarName = factory.grammar.name;
        for (const r of factory.grammar.rules.values()) {
            const labels = r.getAltLabels();
            if (labels !== null) {
                for (const [key] of labels) {
                    this.visitorNames.add(key);
                    this.visitorLabelRuleNames.set(key, r.name);
                }
            } else {
                // If labels, must label all. no need for generic rule visitor then.
                this.visitorNames.add(r.name);
            }
        }

        const ast = factory.grammar.namedActions.get("header");
        if (ast?.getScope() == null) {
            this.header = new Action(factory, ast);
        }

        this.accessLevel = factory.grammar.getOptionString("accessLevel");
        this.exportMacro = factory.grammar.getOptionString("exportMacro");
    }

}
