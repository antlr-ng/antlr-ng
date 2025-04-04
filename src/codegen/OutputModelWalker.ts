/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { HashSet, OrderedHashSet } from "antlr4ng";
import { ST, STGroup, type IST } from "stringtemplate4ts";

import { isModelElement } from "../misc/ModelElement.js";
import { Tool } from "../Tool.js";
import { IssueCode } from "../tool/Issues.js";
import { OutputModelObject } from "./model/OutputModelObject.js";
import type { IndexedObject } from "src/support/helpers.js";

/**
 * Convert an output model tree to template hierarchy by walking the output model. Each output model object has
 * a corresponding template of the same name.  An output model object can have nested objects. We identify those
 * nested objects by the list of arguments in the template definition. For example, here is the definition of the
 * parser template:
 * ```
 * Parser(parser, scopes, funcs) ::= <<...>>
 *```
 * The first template argument is always the output model object from which this walker will create the template.
 * Any other arguments identify the field names within the output model object of nested model objects. So, in this
 * case, template Parser is saying that output model object Parser has two fields the walker should chase called
 * a scopes and funcs.
 *
 * This simple mechanism means we don't have to include code in every output model object that says how to create
 * the corresponding template.
 */
export class OutputModelWalker {
    protected tool: Tool;
    protected templates: STGroup;

    public constructor(tool: Tool, templates: STGroup) {
        this.tool = tool;
        this.templates = templates;
    }

    public walk(model: OutputModelObject, header: boolean): IST {
        const omo = model as IndexedObject<OutputModelObject>;

        // Create template for this output object.
        let templateName = omo.constructor.name;
        if (header) {
            templateName += "Header";
        }

        const st = this.templates.getInstanceOf(templateName);
        if (st === null) {
            this.tool.errorManager.toolError(IssueCode.CodeGenTemplatesIncomplete, templateName);

            return new ST("[" + templateName + " invalid]");
        }

        if (!st.impl?.formalArguments) {
            this.tool.errorManager.toolError(IssueCode.CodeTemplateArgIssue, templateName, "<none>");

            return st;
        }

        const formalArgs = st.impl.formalArguments;

        // Pass in output model object to template as first arg.
        const [modelArgName] = [...formalArgs.keys()];
        st.add(modelArgName, omo);

        // Compute templates for each nested model object.
        const usedFieldNames = new Set<string>();
        for (const fieldName in omo) {
            if (!isModelElement(omo, fieldName)) {
                continue;
            }

            if (usedFieldNames.has(fieldName)) {
                this.tool.errorManager.toolError(IssueCode.InternalError, "Model object " + omo.constructor.name +
                    " has multiple fields named '" + fieldName + "'");
                continue;
            }
            usedFieldNames.add(fieldName);

            // Just don't set fields w/o formal arg in target ST
            if (!formalArgs.get(fieldName)) {
                continue;
            }

            const o = (omo as Record<string, unknown>)[fieldName];
            if (o instanceof OutputModelObject) { // Single model object?
                const nestedOmo = o;
                const nestedST = this.walk(nestedOmo, header);
                st.add(fieldName, nestedST);
            } else if (o instanceof Set || o instanceof HashSet || o instanceof OrderedHashSet || Array.isArray(o)) {
                for (const nestedOmo of o) {
                    if (!nestedOmo) {
                        continue;
                    }

                    const nestedST = this.walk(nestedOmo as OutputModelObject, header);
                    st.add(fieldName, nestedST);
                }
            } else if (o instanceof Map) {
                const nestedOmoMap = o as Map<string, OutputModelObject>;
                const m = new Map<string, IST>();
                for (const [key, value] of nestedOmoMap) {
                    const nestedST = this.walk(value, header);
                    m.set(key, nestedST);
                }
                st.add(fieldName, m);
            } else if (o !== undefined) {
                this.tool.errorManager.toolError(IssueCode.InternalError,
                    "not recognized nested model element: " + fieldName);
            }
        }

        return st;
    }
}
