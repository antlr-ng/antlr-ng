/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { Action } from "./Action.js";
import { OutputFile } from "./OutputFile.js";

export class VisitorFile extends OutputFile {
    public genPackage?: string; // from -package cmd-line
    public accessLevel?: string; // from -DaccessLevel cmd-line
    public exportMacro?: string; // from -DexportMacro cmd-line
    public grammarName: string;
    public parserName: string;

    /**
     * The names of all rule contexts which may need to be visited.
     */
    public visitorNames = new Set<string>();

    /**
     * For rule contexts created for a labeled outer alternative, maps from
     * a listener context name to the name of the rule which defines the
     * context.
     */
    public visitorLabelRuleNames = new Map<string, string>();

    @ModelElement
    public header: Action;

    @ModelElement
    public namedActions: Map<string, Action>;

    public constructor(factory: OutputModelFactory, fileName: string, packageName?: string) {
        super(factory, fileName);

        const g = factory.getGrammar()!;
        this.namedActions = this.buildNamedActions(g, (ast) => {
            return ast.getScope() === null;
        });
        this.parserName = g.getRecognizerName();
        this.grammarName = g.name;
        for (const r of g.rules.values()) {
            const labels = r.getAltLabels();
            if (labels !== null) {
                for (const [key] of labels) {
                    this.visitorNames.add(key);
                    this.visitorLabelRuleNames.set(key, r.name);
                }
            } else {
                // if labels, must label all. no need for generic rule visitor then
                this.visitorNames.add(r.name);
            }
        }

        const ast = g.namedActions.get("header");
        if (ast?.getScope() == null) {
            this.header = new Action(factory, ast);
        }

        this.genPackage = packageName;
        this.accessLevel = g.getOptionString("accessLevel");
        this.exportMacro = g.getOptionString("exportMacro");
    }
}
