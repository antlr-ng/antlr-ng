/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, type Token } from "antlr4ng";

import { ActionSplitter } from "../generated/ActionSplitter.js";
import { ActionSplitterListener } from "../parse/ActionSplitterListener.js";

import { DictType } from "../tool/DictType.js";
import { ErrorType } from "../tool/ErrorType.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { CodeGenerator } from "./CodeGenerator.js";
import { IOutputModelFactory } from "./IOutputModelFactory.js";
import { Target } from "./Target.js";
import { RuleFunction } from "./model/RuleFunction.js";
import { ActionChunk } from "./model/chunk/ActionChunk.js";
import { ActionText } from "./model/chunk/ActionText.js";
import { ArgRef } from "./model/chunk/ArgRef.js";
import { LabelRef } from "./model/chunk/LabelRef.js";
import { ListLabelRef } from "./model/chunk/ListLabelRef.js";
import { LocalRef } from "./model/chunk/LocalRef.js";
import { NonLocalAttrRef } from "./model/chunk/NonLocalAttrRef.js";
import { QRetValueRef } from "./model/chunk/QRetValueRef.js";
import { RetValueRef } from "./model/chunk/RetValueRef.js";
import { RulePropertyRef } from "./model/chunk/RulePropertyRef.js";
import { RulePropertyRefCtx } from "./model/chunk/RulePropertyRefCtx.js";
import { RulePropertyRefParser } from "./model/chunk/RulePropertyRefParser.js";
import { RulePropertyRefStart } from "./model/chunk/RulePropertyRefStart.js";
import { RulePropertyRefStop } from "./model/chunk/RulePropertyRefStop.js";
import { RulePropertyRefText } from "./model/chunk/RulePropertyRefText.js";
import { SetAttr } from "./model/chunk/SetAttr.js";
import { SetNonLocalAttr } from "./model/chunk/SetNonLocalAttr.js";
import { ThisRulePropertyRefCtx } from "./model/chunk/ThisRulePropertyRefCtx.js";
import { ThisRulePropertyRefParser } from "./model/chunk/ThisRulePropertyRefParser.js";
import { ThisRulePropertyRefStart } from "./model/chunk/ThisRulePropertyRefStart.js";
import { ThisRulePropertyRefStop } from "./model/chunk/ThisRulePropertyRefStop.js";
import { ThisRulePropertyRefText } from "./model/chunk/ThisRulePropertyRefText.js";
import { TokenPropertyRef } from "./model/chunk/TokenPropertyRef.js";
import { TokenPropertyRefChannel } from "./model/chunk/TokenPropertyRefChannel.js";
import { TokenPropertyRefIndex } from "./model/chunk/TokenPropertyRefIndex.js";
import { TokenPropertyRefInt } from "./model/chunk/TokenPropertyRefInt.js";
import { TokenPropertyRefLine } from "./model/chunk/TokenPropertyRefLine.js";
import { TokenPropertyRefPos } from "./model/chunk/TokenPropertyRefPos.js";
import { TokenPropertyRefText } from "./model/chunk/TokenPropertyRefText.js";
import { TokenPropertyRefType } from "./model/chunk/TokenPropertyRefType.js";
import { TokenRef } from "./model/chunk/TokenRef.js";
import { StructDecl } from "./model/decl/StructDecl.js";

export class ActionTranslator implements ActionSplitterListener {
    public static readonly thisRulePropToModelMap = new Map<string, typeof RulePropertyRef>([
        ["start", ThisRulePropertyRefStart],
        ["stop", ThisRulePropertyRefStop],
        ["text", ThisRulePropertyRefText],
        ["ctx", ThisRulePropertyRefCtx],
        ["parser", ThisRulePropertyRefParser],
    ]);

    public static readonly rulePropToModelMap = new Map<string, typeof RulePropertyRef>([
        ["start", RulePropertyRefStart],
        ["stop", RulePropertyRefStop],
        ["text", RulePropertyRefText],
        ["ctx", RulePropertyRefCtx],
        ["parser", RulePropertyRefParser],
    ]);

    public static readonly tokenPropToModelMap = new Map<string, typeof TokenPropertyRef>([
        ["text", TokenPropertyRefText],
        ["type", TokenPropertyRefType],
        ["line", TokenPropertyRefLine],
        ["index", TokenPropertyRefIndex],
        ["pos", TokenPropertyRefPos],
        ["channel", TokenPropertyRefChannel],
        ["int", TokenPropertyRefInt],
    ]);

    private readonly gen: CodeGenerator;
    private readonly target: Target;
    private readonly node: ActionAST;
    private rf?: RuleFunction;
    private readonly chunks = new Array<ActionChunk>();
    private readonly factory: IOutputModelFactory;
    private nodeContext: StructDecl;

    public constructor(factory: IOutputModelFactory, node: ActionAST) {
        this.factory = factory;
        this.node = node;
        this.gen = factory.getGenerator()!;
        this.target = this.gen.target;
    }

    public static translateAction(factory: IOutputModelFactory, rf: RuleFunction | null,
        tokenWithinAction: Token | null, node: ActionAST): ActionChunk[] {
        let action = tokenWithinAction!.text!;
        if (action.startsWith("{")) {
            const firstCurly = action.indexOf("{");
            const lastCurly = action.lastIndexOf("}");
            if (firstCurly >= 0 && lastCurly >= 0) {
                action = action.substring(firstCurly + 1, lastCurly); // trim {...}
            }
        }

        return ActionTranslator.translateActionChunk(factory, rf, action, node, tokenWithinAction!);
    }

    public static translateActionChunk(factory: IOutputModelFactory, rf: RuleFunction | null, action: string,
        node: ActionAST, refToken?: Token): ActionChunk[] {
        const translator = new ActionTranslator(factory, node);
        translator.rf = rf ?? undefined;

        factory.grammar!.tool.logInfo({ component: "action-translator", msg: "translate " + action });
        const altLabel = node.getAltLabel();
        if (rf) {
            translator.nodeContext = rf.ruleCtx;
            if (altLabel !== null) {
                translator.nodeContext = rf.altLabelCtxs!.get(altLabel)!;
            }
        }

        const input = CharStream.fromString(action);
        const trigger = new ActionSplitter(input);

        // Forces eval, triggers listener methods.
        trigger.getActionTokens(translator, refToken);

        return translator.chunks;
    }

    public attr(_expr: string, x: Token): void {
        this.gen.g?.tool.logInfo({ component: "action-translator", msg: "attr " + x.text });
        const a = this.node.resolver.resolveToAttribute(x.text!, this.node);
        const name = x.text!;
        const escapedName = this.target.escapeIfNeeded(name);

        if (a !== null) {
            switch (a.dict!.type) {
                case DictType.Argument: {
                    this.chunks.push(new ArgRef(this.nodeContext, name, escapedName));
                    break;
                }

                case DictType.Return: {
                    this.chunks.push(new RetValueRef(this.rf!.ruleCtx, name, escapedName));
                    break;
                }

                case DictType.Local: {
                    this.chunks.push(new LocalRef(this.nodeContext, name, escapedName));
                    break;
                }

                case DictType.PredefinedRule: {
                    this.chunks.push(this.getRulePropertyRef(undefined, x.text!));
                    break;
                }

                default: {
                    break;
                }

            }
        }

        if (this.node.resolver.resolvesToToken(name, this.node)) {
            const tokenLabel = this.getTokenLabel(name);

            // $label
            this.chunks.push(new TokenRef(this.nodeContext, tokenLabel, this.target.escapeIfNeeded(tokenLabel)));

            return;
        }

        if (this.node.resolver.resolvesToLabel(name, this.node)) {
            const tokenLabel = this.getTokenLabel(name);

            // $x for x=ID etc...
            this.chunks.push(new LabelRef(this.nodeContext, tokenLabel, this.target.escapeIfNeeded(tokenLabel)));

            return;
        }

        if (this.node.resolver.resolvesToListLabel(name, this.node)) {
            // $ids for ids+=ID etc...
            this.chunks.push(new ListLabelRef(this.nodeContext, name, escapedName));

            return;
        }

        const r = this.factory.grammar!.getRule(name);
        if (r !== null) {
            const ruleLabel = this.getRuleLabel(name);

            // $r for r rule ref
            this.chunks.push(new LabelRef(this.nodeContext, ruleLabel, this.target.escapeIfNeeded(ruleLabel)));
        }
    }

    public qualifiedAttr(expr: string, x: Token, y: Token): void {
        this.gen.g?.tool.logInfo({ component: "action-translator", msg: "q-attr " + x.text! + "." + y.text! });
        if (this.node.resolver.resolveToAttribute(x.text!, this.node) !== null) {
            // Must be a member access to a predefined attribute like $ctx.foo.
            this.attr(expr, x);
            this.chunks.push(new ActionText(this.nodeContext, "." + y.text!));

            return;
        }

        const a = this.node.resolver.resolveToAttribute(x.text!, y.text!, this.node);
        if (a === null) {
            // Added in response to https://github.com/antlr/antlr4/issues/1211.
            this.gen.g!.tool.errorManager.grammarError(ErrorType.UNKNOWN_SIMPLE_ATTRIBUTE,
                this.gen.g!.fileName, x, x.text, "rule");

            return;
        }

        switch (a.dict!.type) {
            case DictType.Argument: {
                this.chunks.push(new ArgRef(this.nodeContext, y.text!, this.target.escapeIfNeeded(y.text!)));
                break;
            }

            // Has to be current rule.
            case DictType.Return: {
                this.chunks.push(new QRetValueRef(this.nodeContext, this.getRuleLabel(x.text!), y.text!,
                    this.target.escapeIfNeeded(y.text!)));
                break;
            }

            case DictType.PredefinedRule: {
                this.chunks.push(this.getRulePropertyRef(x.text, y.text!));
                break;
            }

            case DictType.Token: {
                this.chunks.push(this.getTokenPropertyRef(x.text!, y.text!));
                break;
            }

            default: {
                break;
            }
        }
    }

    public setAttr(_expr: string, x: Token, rhs: Token): void {
        this.gen.g?.tool.logInfo({ component: "action-translator", msg: "setAttr " + x.text + " " + rhs.text });
        const rhsChunks = ActionTranslator.translateActionChunk(this.factory, this.rf!, rhs.text!, this.node, x);
        const s = new SetAttr(this.nodeContext, x.text!, this.target.escapeIfNeeded(x.text!), rhsChunks);
        this.chunks.push(s);
    }

    public nonLocalAttr(_expr: string, x: Token, y: Token): void {
        this.gen.g?.tool.logInfo({ component: "action-translator", msg: "nonLocalAttr " + x.text! + "::" + y.text! });
        const r = this.factory.grammar!.getRule(x.text!);
        this.chunks.push(new NonLocalAttrRef(this.nodeContext, x.text!, y.text!, this.target.escapeIfNeeded(y.text!),
            r!.index));
    }

    public setNonLocalAttr(_expr: string, x: Token, y: Token, rhs: string): void {
        this.gen.g?.tool.logInfo({
            component: "action-translator",
            msg: "setNonLocalAttr " + x.text! + "::" + y.text! + "=" + rhs
        });
        const r = this.factory.grammar!.getRule(x.text!);
        const rhsChunks = ActionTranslator.translateActionChunk(this.factory, this.rf!, rhs, this.node);
        const s = new SetNonLocalAttr(this.nodeContext, x.text!, y.text!, this.target.escapeIfNeeded(y.text!),
            r!.index, rhsChunks);
        this.chunks.push(s);
    }

    public text(text: string): void {
        this.chunks.push(new ActionText(this.nodeContext, text));
    }

    public getTokenLabel(x: string): string {
        if (this.node.resolver.resolvesToLabel(x, this.node)) {
            return x;
        }

        return this.target.getImplicitTokenLabel(x);
    }

    public getRuleLabel(x: string): string {
        if (this.node.resolver.resolvesToLabel(x, this.node)) {
            return x;
        }

        return this.target.getImplicitRuleLabel(x);
    }

    protected getTokenPropertyRef(x: string, y: string): TokenPropertyRef {
        const c = ActionTranslator.tokenPropToModelMap.get(y)!;

        return new c(this.nodeContext, this.getTokenLabel(x));
    }

    protected getRulePropertyRef(x: string | undefined, prop: string): RulePropertyRef {
        const c = (x !== undefined
            ? ActionTranslator.rulePropToModelMap
            : ActionTranslator.thisRulePropToModelMap
        ).get(prop)!;

        return new c(this.nodeContext, this.getRuleLabel((x ?? prop)));
    }
}
