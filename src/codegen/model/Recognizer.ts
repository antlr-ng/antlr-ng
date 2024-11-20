/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { ModelElement } from "../../misc/ModelElement.js";
import { Rule } from "../../tool/Rule.js";
import { CodeGenerator } from "../CodeGenerator.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { JavaTarget } from "../target/JavaTarget.js";
import { ActionChunk } from "./chunk/ActionChunk.js";
import { ActionText } from "./chunk/ActionText.js";
import { OutputModelObject } from "./OutputModelObject.js";
import { RuleSempredFunction } from "./RuleSempredFunction.js";
import { SerializedATN } from "./SerializedATN.js";
import { SerializedJavaATN } from "./SerializedJavaATN.js";

export abstract class Recognizer extends OutputModelObject {
    public name: string;
    public grammarName: string;
    public grammarFileName: string;
    public accessLevel?: string;
    public tokens: Map<string, number>;

    /**
     * @deprecated This field is provided only for compatibility with code
     * generation targets which have not yet been updated to use
     * {@link #literalNames} and {@link #symbolicNames}.
     * @deprecated
     */
    public tokenNames: Array<string | null>;

    public literalNames: Array<string | null>;
    public symbolicNames: Array<string | null>;
    public ruleNames: Set<string>;
    public rules: Rule[];

    @ModelElement
    public superClass: ActionChunk;

    @ModelElement
    public atn: SerializedATN;

    @ModelElement
    public sempredFuncs = new Map<Rule, RuleSempredFunction>();

    public constructor(factory: OutputModelFactory) {
        super(factory);

        const g = factory.getGrammar()!;
        const gen = factory.getGenerator()!;
        this.grammarFileName = g.fileName;
        this.grammarName = g.name;
        this.name = g.getRecognizerName();
        this.accessLevel = g.getOptionString("accessLevel");
        this.tokens = new Map<string, number>();
        for (const [key, ttype] of g.tokenNameToTypeMap) {
            if (ttype > 0) {
                this.tokens.set(gen.getTarget().escapeIfNeeded(key), ttype);
            }
        }

        this.ruleNames = new Set(g.rules.keys());
        this.rules = Array.from(g.rules.values());
        if (gen.getTarget() instanceof JavaTarget) {
            this.atn = new SerializedJavaATN(factory, g.atn!);
        } else {
            this.atn = new SerializedATN(factory, g.atn);
        }

        if (g.getOptionString("superClass")) {
            this.superClass = new ActionText(undefined, g.getOptionString("superClass") ?? undefined);
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
                gen.getTarget().getTargetStringLiteralFromANTLRStringLiteral(gen, tokenName, false, true);

            return "\"'" + targetString + "'\"";
        } else {
            return gen.getTarget().getTargetStringLiteralFromString(tokenName, true);
        }
    }

}
