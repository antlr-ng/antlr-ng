/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { ATNState, IntervalSet, OrderedHashSet, RecognitionException } from "antlr4ng";

import { ANTLRv4Lexer } from "../../generated/ANTLRv4Lexer.js";
import { CommonTreeNodeStream } from "../../tree/CommonTreeNodeStream.js";

import type { CommonTree } from "../../tree/CommonTree.js";

import { FrequencySet } from "../../misc/FrequencySet.js";
import { ModelElement } from "../../misc/ModelElement.js";
import { IssueCode } from "../../tool/Issues.js";
import { Rule } from "../../tool/Rule.js";
import { ActionAST } from "../../tool/ast/ActionAST.js";
import { AltAST } from "../../tool/ast/AltAST.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { PredAST } from "../../tool/ast/PredAST.js";
import { IOutputModelFactory } from "../IOutputModelFactory.js";
import { Action } from "./Action.js";
import { ElementFrequenciesVisitor } from "./ElementFrequenciesVisitor.js";
import { ExceptionClause } from "./ExceptionClause.js";
import { OutputModelObject } from "./OutputModelObject.js";
import { SrcOp } from "./SrcOp.js";
import { AltLabelStructDecl } from "./decl/AltLabelStructDecl.js";
import { AttributeDecl } from "./decl/AttributeDecl.js";
import { ContextRuleGetterDecl } from "./decl/ContextRuleGetterDecl.js";
import { ContextRuleListGetterDecl } from "./decl/ContextRuleListGetterDecl.js";
import { ContextRuleListIndexedGetterDecl } from "./decl/ContextRuleListIndexedGetterDecl.js";
import { ContextTokenGetterDecl } from "./decl/ContextTokenGetterDecl.js";
import { ContextTokenListGetterDecl } from "./decl/ContextTokenListGetterDecl.js";
import { ContextTokenListIndexedGetterDecl } from "./decl/ContextTokenListIndexedGetterDecl.js";
import { Decl } from "./decl/Decl.js";
import { StructDecl } from "./decl/StructDecl.js";

export class RuleFunction extends OutputModelObject {
    public readonly name: string;
    public readonly escapedName: string;
    public readonly modifiers: string[];
    public ctxType: string;
    public readonly ruleLabels: Set<string> | null = null;
    public readonly tokenLabels: Set<string>;
    public readonly startState: ATNState;
    public readonly index: number;
    public readonly rule: Rule;
    public readonly altToContext: AltLabelStructDecl[];
    public hasLookaheadBlock: boolean;

    @ModelElement
    public code: SrcOp[];

    @ModelElement
    public readonly locals = new OrderedHashSet<Decl>(); // TODO: move into ctx?

    @ModelElement
    public args?: AttributeDecl[];

    @ModelElement
    public ruleCtx: StructDecl;

    @ModelElement
    public altLabelCtxs?: Map<string, AltLabelStructDecl>;

    @ModelElement
    public namedActions: Map<string, Action> | undefined;

    @ModelElement
    public finallyAction: Action | undefined;

    @ModelElement
    public exceptions: ExceptionClause[] | undefined;

    @ModelElement
    public postamble: SrcOp[] | undefined;

    public constructor(factory: IOutputModelFactory, r: Rule) {
        super(factory);

        this.name = r.name;
        this.escapedName = factory.getGenerator()!.target.escapeIfNeeded(r.name);
        this.rule = r;
        this.modifiers = this.nodesToStrings(r.modifiers ?? []);

        this.index = r.index;

        this.ruleCtx = new StructDecl(factory, r);
        this.altToContext = new Array<AltLabelStructDecl>(r.getOriginalNumberOfAlts() + 1);
        this.addContextGetters(factory, r);

        if (r.args) {
            if (r.args.attributes.size > 0) {
                this.args = [];
                this.ruleCtx.addDecls(Array.from(r.args.attributes.values()));
                for (const a of r.args.attributes.values()) {
                    this.args.push(new AttributeDecl(factory, a));
                }
                this.ruleCtx.ctorAttrs = this.args;
            }
        }

        if (r.retvals) {
            this.ruleCtx.addDecls(Array.from(r.retvals.attributes.values()));
        }

        if (r.locals) {
            this.ruleCtx.addDecls(Array.from(r.locals.attributes.values()));
        }

        this.ruleLabels = r.getElementLabelNames();
        this.tokenLabels = r.getTokenRefs();
        this.exceptions = new Array<ExceptionClause>();

        for (const e of r.exceptions) {
            const catchArg = e.children[0] as ActionAST;
            const catchAction = e.children[1] as ActionAST;
            this.exceptions.push(new ExceptionClause(factory, catchArg, catchAction));
        }

        this.startState = factory.g.atn!.ruleToStartState[r.index]!;
    }

    public addContextGetters(factory: IOutputModelFactory, r: Rule): void {
        // Add ctx labels for elements in alts with no -> label.
        const altsNoLabels = r.getUnlabeledAltASTs();
        if (altsNoLabels !== null) {
            const decls = this.getDeclsForAllElements(altsNoLabels);
            // We know to put in rule ctx, so do it directly.
            for (const d of decls) {
                this.ruleCtx.addDecl(d);
            }
        }

        // Make structs for -> labeled alts, define ctx labels for elements.
        this.altLabelCtxs = new Map<string, AltLabelStructDecl>();
        const labels = r.getAltLabels();
        if (labels !== null) {
            for (const [label, list] of labels) {
                const alts = new Array<AltAST>();
                for (const [_, ast] of list) {
                    alts.push(ast);
                }

                const decls = this.getDeclsForAllElements(alts);
                for (const [altNum] of list) {
                    this.altToContext[altNum] = new AltLabelStructDecl(factory, r, altNum, label);
                    if (!this.altLabelCtxs.has(label)) {
                        this.altLabelCtxs.set(label, this.altToContext[altNum]);
                    }

                    // We know which ctx to put in, so do it directly.
                    for (const d of decls) {
                        this.altToContext[altNum].addDecl(d);
                    }
                }
            }
        }
    }

    public fillNamedActions(factory: IOutputModelFactory, r: Rule): void {
        if (r.finallyAction) {
            this.finallyAction = new Action(factory, r.finallyAction);
        }

        this.namedActions = new Map<string, Action>();
        for (const name of r.namedActions.keys()) {
            const ast = r.namedActions.get(name);
            this.namedActions.set(name, new Action(factory, ast));
        }
    }

    /**
     * For all alts, find which ref X or r needs List. Must see across alts.
     * If any alt needs X or r as list, then define as list.
     */
    public getDeclsForAllElements(altASTs: AltAST[]): Set<Decl> {
        const needsList = new Set<string>();
        const nonOptional = new Set<string>();
        const allRefs = new Array<GrammarAST>();
        let firstAlt = true;

        const refTypes = new IntervalSet();
        refTypes.addOne(ANTLRv4Lexer.RULE_REF);
        refTypes.addOne(ANTLRv4Lexer.TOKEN_REF);
        refTypes.addOne(ANTLRv4Lexer.STRING_LITERAL);

        for (const ast of altASTs) {
            const refs = this.getRuleTokens(ast.getNodesWithType(refTypes));
            allRefs.push(...refs);

            const [minFreq, altFreq] = this.getElementFrequenciesForAlt(ast);
            for (const t of refs) {
                const refLabelName = this.getName(t);

                if (refLabelName !== null) {
                    if (altFreq.count(refLabelName) > 1) {
                        needsList.add(refLabelName);
                    }

                    if (firstAlt && minFreq.count(refLabelName) !== 0) {
                        nonOptional.add(refLabelName);
                    }
                }
            }

            for (const ref of nonOptional) {
                if (minFreq.count(ref) === 0) {
                    nonOptional.delete(ref);
                }
            }

            firstAlt = false;
        }

        const decls = new Set<Decl>();
        for (const t of allRefs) {
            const refLabelName = this.getName(t);

            if (refLabelName === null) {
                continue;
            }

            const d = this.getDeclForAltElement(t, refLabelName, needsList.has(refLabelName),
                !nonOptional.has(refLabelName));

            d.forEach((decl) => {
                return decls.add(decl);
            });
        }

        return decls;
    }

    public getDeclForAltElement(t: GrammarAST, refLabelName: string, needList: boolean, optional: boolean): Decl[] {
        const decls = new Array<Decl>();
        if (t.getType() === ANTLRv4Lexer.RULE_REF) {
            const ruleRef = this.factory!.g.getRule(t.getText())!;
            const ctxName = this.factory!.getGenerator()!.target.getRuleFunctionContextStructName(ruleRef);
            if (needList) {
                if (this.factory!.getGenerator()!.target.supportsOverloadedMethods()) {
                    decls.push(new ContextRuleListGetterDecl(this.factory!, refLabelName, ctxName));
                }

                decls.push(new ContextRuleListIndexedGetterDecl(this.factory!, refLabelName, ctxName));
            } else {
                decls.push(new ContextRuleGetterDecl(this.factory!, refLabelName, ctxName, optional));
            }
        } else {
            if (needList) {
                if (this.factory!.getGenerator()!.target.supportsOverloadedMethods()) {
                    decls.push(new ContextTokenListGetterDecl(this.factory!, refLabelName));
                }

                decls.push(new ContextTokenListIndexedGetterDecl(this.factory!, refLabelName));
            } else {
                decls.push(new ContextTokenGetterDecl(this.factory!, refLabelName, optional));
            }
        }

        return decls;
    }

    /** Add local var decl */
    public addLocalDecl(d: Decl): void {
        this.locals.add(d);
        d.isLocal = true;
    }

    /** Add decl to struct ctx for rule or alt if labeled. */
    public addContextDecl(altLabel: string, d: Decl): void {
        const alt = d.getOuterMostAltCodeBlock();

        // If we found code blk and might be alt label, try to add to that label ctx.
        if (alt && this.altLabelCtxs) {
            const altCtx = this.altLabelCtxs.get(altLabel);
            if (altCtx) { // we have an alt ctx
                altCtx.addDecl(d);

                return;
            }
        }

        // Stick in overall rule's ctx.
        this.ruleCtx.addDecl(d);
    }

    /** Given list of X and r refs in alt, compute how many of each there are. */
    protected getElementFrequenciesForAlt(ast: AltAST): [FrequencySet<string>, FrequencySet<string>] {
        const errorManager = this.factory!.g.tool.errorManager;

        try {
            const visitor = new ElementFrequenciesVisitor(errorManager, new CommonTreeNodeStream(ast));
            visitor.outerAlternative();
            if (visitor.frequencies.length !== 1) {
                errorManager.toolError(IssueCode.InternalError);

                return [new FrequencySet<string>(), new FrequencySet<string>()];
            }

            return [visitor.minFrequencies[0], visitor.frequencies[0]];
        } catch (ex) {
            if (ex instanceof RecognitionException) {
                errorManager.toolError(IssueCode.InternalError, ex);

                return [new FrequencySet<string>(), new FrequencySet<string>()];
            } else {
                throw ex;
            }
        }
    }

    private getRuleTokens(refs: GrammarAST[]): GrammarAST[] {
        const result: GrammarAST[] = [];
        for (const ref of refs) {
            let r: CommonTree | null = ref;

            let ignore = false;
            while (r !== null) {
                // Ignore string literals in predicates.
                if (r instanceof PredAST) {
                    ignore = true;
                    break;
                }
                r = r.parent;
            }

            if (!ignore) {
                result.push(ref);
            }
        }

        return result;
    }

    private getName(token: GrammarAST): string | null {
        const tokenText = token.getText();
        const tokenName = token.getType() !== ANTLRv4Lexer.STRING_LITERAL
            ? tokenText
            : token.g.getTokenName(tokenText);

        // Do not include tokens with auto generated names.
        return tokenName === null || tokenName.startsWith("T__") ? null : tokenName;
    }

    private nodesToStrings<T extends GrammarAST>(nodes: T[]): string[] {
        const a = new Array<string>();
        for (const t of nodes) {
            a.push(t.getText());
        }

        return a;
    }
}
