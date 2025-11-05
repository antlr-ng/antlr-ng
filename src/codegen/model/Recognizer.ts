/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import type { Rule } from "../../tool/Rule.js";
import type { CodeGenerator } from "../CodeGenerator.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionText } from "./chunk/ActionText.js";
import { OutputModelObject } from "./OutputModelObject.js";
import type { RuleSempredFunction } from "./RuleSempredFunction.js";
import { SerializedATN } from "./SerializedATN.js";
import { SerializedJavaATN } from "./SerializedJavaATN.js";

export abstract class Recognizer extends OutputModelObject {
    public name: string;
    public grammarName: string;
    public grammarFileName: string;
    public accessLevel?: string;
    public tokens: Map<string, number>;

    /**
     * This field is provided only for compatibility with code generation targets which have not yet been
     * updated to use {@link #literalNames} and {@link #symbolicNames}.
     *
     * @deprecated
     */
    public tokenNames: Array<string | null>;

    public literalNames: Array<string | null>;
    public symbolicNames: Array<string | null>;
    public ruleNames: Set<string>;
    public rules: Rule[];

    @ModelElement
    public superClass?: ActionChunk;

    @ModelElement
    public atn: SerializedATN;

    @ModelElement
    public sempredFuncs = new Map<Rule, RuleSempredFunction>();

    public constructor(factory: IOutputModelFactory) {
        super(factory);

        const g = factory.g;
        const gen = factory.getGenerator()!;

        let lastSlash = g.fileName.lastIndexOf("/");
        if (lastSlash === -1) {
            lastSlash = g.fileName.lastIndexOf("\\");
        }
        this.grammarFileName = lastSlash > -1 ? g.fileName.substring(lastSlash + 1) : g.fileName;

        this.grammarName = g.name;
        this.name = g.getRecognizerName();
        this.accessLevel = g.getOptionString("accessLevel");
        this.tokens = new Map<string, number>();

        for (const [key, ttype] of g.tokenNameToTypeMap) {
            if (ttype > 0) {
                this.tokens.set(gen.targetGenerator.escapeIfNeeded(key), ttype);
            }
        }

        this.ruleNames = new Set(g.rules.keys());
        this.rules = Array.from(g.rules.values());
        if (gen.forJava) {
            this.atn = new SerializedJavaATN(factory, g.atn!);
        } else {
            this.atn = new SerializedATN(factory, g.atn);
        }

        if (g.getOptionString("superClass")) {
            this.superClass = new ActionText(undefined, [g.getOptionString("superClass")]);
        }

        this.tokenNames = Recognizer.translateTokenStringsToTarget(g.getTokenDisplayNames(), gen);
        this.literalNames = Recognizer.translateTokenStringsToTarget(g.getTokenLiteralNames(), gen);
        this.symbolicNames = Recognizer.translateTokenStringsToTarget(g.getTokenSymbolicNames(), gen);
    }

    protected static translateTokenStringsToTarget(tokenStrings: Array<string | null>,
        gen: CodeGenerator): Array<string | null> {
        let result = tokenStrings.slice();
        for (let i = 0; i < tokenStrings.length; i++) {
            result[i] = Recognizer.translateTokenStringToTarget(tokenStrings[i], gen);
        }

        let lastTrueEntry = result.length - 1;
        while (lastTrueEntry >= 0 && !result[lastTrueEntry]) {
            lastTrueEntry--;
        }

        if (lastTrueEntry < result.length - 1) {
            result = result.slice(0, lastTrueEntry + 1);
        }

        return result;
    }

    protected static translateTokenStringToTarget(tokenName: string | null, gen: CodeGenerator): string | null {
        if (tokenName == null) {
            return null;
        }

        if (tokenName.startsWith("'")) {
            const targetString =
                gen.targetGenerator.getTargetStringLiteralFromANTLRStringLiteral(tokenName, false, true);

            return "\"'" + targetString + "'\"";
        } else {
            return gen.targetGenerator.getTargetStringLiteralFromString(tokenName, true);
        }
    }

    public override get parameterFields(): string[] {
        return [...super.parameterFields, "superClass", "atn", "sempredFuncs"];
    }
}
