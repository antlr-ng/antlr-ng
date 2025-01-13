/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import type { IST } from "stringtemplate4ts";

import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";

import { CommonTreeNodeStream } from "../tree/CommonTreeNodeStream.js";
import { SourceGenTriggers } from "../tree/walkers/SourceGenTriggers.js";

import { Utils } from "../misc/Utils.js";
import { GrammarASTAdaptor } from "../parse/GrammarASTAdaptor.js";
import { Alternative } from "../tool/Alternative.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { LeftRecursiveRule } from "../tool/LeftRecursiveRule.js";
import { Rule } from "../tool/Rule.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { PredAST } from "../tool/ast/PredAST.js";
import { CodeGenerator } from "./CodeGenerator.js";
import { CodeGeneratorExtension } from "./CodeGeneratorExtension.js";
import { OutputModelFactory } from "./OutputModelFactory.js";
import { Action } from "./model/Action.js";
import { AltBlock } from "./model/AltBlock.js";
import { BaseListenerFile } from "./model/BaseListenerFile.js";
import { BaseVisitorFile } from "./model/BaseVisitorFile.js";
import { Choice } from "./model/Choice.js";
import { CodeBlockForAlt } from "./model/CodeBlockForAlt.js";
import { CodeBlockForOuterMostAlt } from "./model/CodeBlockForOuterMostAlt.js";
import { LabeledOp } from "./model/LabeledOp.js";
import { LeftRecursiveRuleFunction } from "./model/LeftRecursiveRuleFunction.js";
import { Lexer } from "./model/Lexer.js";
import { LexerFile } from "./model/LexerFile.js";
import { ListenerFile } from "./model/ListenerFile.js";
import { OutputModelObject } from "./model/OutputModelObject.js";
import { Parser } from "./model/Parser.js";
import { ParserFile } from "./model/ParserFile.js";
import { RuleActionFunction } from "./model/RuleActionFunction.js";
import { RuleFunction } from "./model/RuleFunction.js";
import { RuleSempredFunction } from "./model/RuleSempredFunction.js";
import { SrcOp } from "./model/SrcOp.js";
import { StarBlock } from "./model/StarBlock.js";
import { VisitorFile } from "./model/VisitorFile.js";
import { CodeBlock } from "./model/decl/CodeBlock.js";
import type { IToolParameters } from "../tool-parameters.js";

/**
 * This receives events from SourceGenTriggers.g and asks factory to do work.
 *  Then runs extensions in order on resulting SrcOps to get final list.
 */
export class OutputModelController {

    /** Who does the work? Doesn't have to be CoreOutputModelFactory. */
    public delegate: OutputModelFactory;

    /** Post-processing CodeGeneratorExtension objects; done in order given. */
    public extensions = new Array<CodeGeneratorExtension>();

    /**
     * While walking code in rules, this is set to the tree walker that
     *  triggers actions.
     */
    public walker: SourceGenTriggers;

    /** Context set by the SourceGenTriggers.g */
    public codeBlockLevel = -1;
    public treeLevel = -1;
    public root: OutputModelObject; // normally ParserFile, LexerFile, ...
    public currentRule = new Array<RuleFunction>();
    public currentBlock: CodeBlock;
    public currentOuterMostAlternativeBlock: CodeBlockForOuterMostAlt;

    private currentOuterMostAlt: Alternative;

    public constructor(factory: OutputModelFactory) {
        this.delegate = factory;
    }

    public addExtension(ext: CodeGeneratorExtension): void {
        this.extensions.push(ext);
    }

    /**
     * Build a file with a parser containing rule functions. Use the
     *  controller as factory in SourceGenTriggers so it triggers codegen
     *  extensions too, not just the factory functions in this factory.
     */
    public buildParserOutputModel(header: boolean, toolParameters: IToolParameters): OutputModelObject {
        const gen = this.delegate.getGenerator()!;
        const file = this.parserFile(gen.getRecognizerFileName(header), toolParameters);
        this.setRoot(file);
        file.parser = this.parser(file);

        const g = this.delegate.getGrammar()!;
        for (const r of g.rules.values()) {
            this.buildRuleFunction(file.parser, r);
        }

        return file;
    }

    public buildLexerOutputModel(header: boolean, toolParameters: IToolParameters): OutputModelObject {
        const gen = this.delegate.getGenerator()!;
        const file = this.lexerFile(gen.getRecognizerFileName(header), toolParameters);
        this.setRoot(file);
        file.lexer = this.lexer(file);

        const g = this.delegate.getGrammar()!;
        for (const r of g.rules.values()) {
            this.buildLexerRuleActions(file.lexer, r);
        }

        return file;
    }

    public buildListenerOutputModel(header: boolean): OutputModelObject {
        const gen = this.delegate.getGenerator()!;

        return new ListenerFile(this.delegate, gen.getListenerFileName(header));
    }

    public buildBaseListenerOutputModel(header: boolean): OutputModelObject {
        const gen = this.delegate.getGenerator()!;

        return new BaseListenerFile(this.delegate, gen.getBaseListenerFileName(header));
    }

    public buildVisitorOutputModel(header: boolean): OutputModelObject {
        const gen = this.delegate.getGenerator()!;

        return new VisitorFile(this.delegate, gen.getVisitorFileName(header));
    }

    public buildBaseVisitorOutputModel(header: boolean): OutputModelObject {
        const gen = this.delegate.getGenerator()!;

        return new BaseVisitorFile(this.delegate, gen.getBaseVisitorFileName(header));
    }

    public parserFile(fileName: string, toolParameters: IToolParameters): ParserFile {
        let f = this.delegate.parserFile(fileName, toolParameters)!;
        for (const ext of this.extensions) {
            f = ext.parserFile(f);
        }

        return f;
    }

    public parser(file: ParserFile): Parser {
        let p = this.delegate.parser(file)!;
        for (const ext of this.extensions) {
            p = ext.parser(p);
        }

        return p;
    }

    public lexerFile(fileName: string, toolParameters: IToolParameters): LexerFile {
        return new LexerFile(this.delegate, fileName, toolParameters);
    }

    public lexer(file: LexerFile): Lexer {
        return new Lexer(this.delegate, file);
    }

    /**
     * Create RuleFunction per rule and update sempreds,actions of parser
     *  output object with stuff found in r.
     */
    public buildRuleFunction(parser: Parser, r: Rule): void {
        const ruleFunction = this.rule(r);
        parser.funcs.push(ruleFunction);
        this.pushCurrentRule(ruleFunction);
        ruleFunction.fillNamedActions(this.delegate, r);

        if (r instanceof LeftRecursiveRule) {
            this.buildLeftRecursiveRuleFunction(r, ruleFunction as LeftRecursiveRuleFunction);
        } else {
            this.buildNormalRuleFunction(r, ruleFunction);
        }

        const g = this.getGrammar()!;
        for (const a of r.actions) {
            if (a instanceof PredAST) {
                const p = a;
                let rsf = parser.sempredFuncs.get(r);
                if (!rsf) {
                    rsf = new RuleSempredFunction(this.delegate, r, ruleFunction.ctxType);
                    parser.sempredFuncs.set(r, rsf);
                }
                rsf.actions.set(g.sempreds.get(p)!, new Action(this.delegate, p));
            }
        }

        this.popCurrentRule();
    }

    public buildLeftRecursiveRuleFunction(r: LeftRecursiveRule, ruleFunction: LeftRecursiveRuleFunction): void {
        this.buildNormalRuleFunction(r, ruleFunction);

        // now inject code to start alts
        const gen = this.delegate.getGenerator()!;
        const codegenTemplates = gen.getTemplates();

        // pick out alt(s) for primaries
        const outerAlt = ruleFunction.code[0] as CodeBlockForOuterMostAlt;
        const primaryAltsCode = new Array<CodeBlockForAlt>();
        const primaryStuff = outerAlt.ops[0];
        if (primaryStuff instanceof Choice) {
            const primaryAltBlock = primaryStuff;
            primaryAltsCode.push(...primaryAltBlock.alts);
        } else { // just a single alt I guess; no block
            primaryAltsCode.push(primaryStuff as CodeBlockForAlt);
        }

        // pick out alt(s) for op alts
        const opAltStarBlock = outerAlt.ops[1] as StarBlock;
        const altForOpAltBlock = opAltStarBlock.alts[0];
        const opAltsCode = new Array<CodeBlockForAlt>();
        const opStuff = altForOpAltBlock.ops[0];
        if (opStuff instanceof AltBlock) {
            const opAltBlock = opStuff;
            opAltsCode.push(...opAltBlock.alts);
        } else { // just a single alt I guess; no block
            opAltsCode.push(opStuff as CodeBlockForAlt);
        }

        // Insert code in front of each primary alt to create specialized ctx if there was a label
        for (let i = 0; i < primaryAltsCode.length; i++) {
            const altInfo = r.recPrimaryAlts[i];
            if (altInfo.altLabel === undefined) {
                continue;
            }

            const altActionST = codegenTemplates.getInstanceOf("recRuleReplaceContext")!;
            altActionST.add("ctxName", Utils.capitalize(altInfo.altLabel));
            const altAction =
                new Action(this.delegate, ruleFunction.altLabelCtxs!.get(altInfo.altLabel)!, altActionST);
            const alt = primaryAltsCode[i];
            alt.insertOp(0, altAction);
        }

        // Insert code to set ctx.stop after primary block and before op * loop
        const setStopTokenAST = codegenTemplates.getInstanceOf("recRuleSetStopToken")!;
        const setStopTokenAction = new Action(this.delegate, ruleFunction.ruleCtx, setStopTokenAST);
        outerAlt.insertOp(1, setStopTokenAction);

        // Insert code to set previous context at start of * loop.
        const setPrevCtx = codegenTemplates.getInstanceOf("recRuleSetPrevCtx")!;
        const setPrevCtxAction = new Action(this.delegate, ruleFunction.ruleCtx, setPrevCtx);
        opAltStarBlock.addIterationOp(setPrevCtxAction);

        // Insert code in front of each op alt to create specialized ctx if there was an alt label
        for (let i = 0; i < opAltsCode.length; i++) {
            let altActionST: IST;
            const altInfo = r.recOpAlts.getElement(i)!;
            let templateName: string;
            if (altInfo.altLabel !== undefined) {
                templateName = "recRuleLabeledAltStartAction";
                altActionST = codegenTemplates.getInstanceOf(templateName)!;
                altActionST.add("currentAltLabel", altInfo.altLabel);
            } else {
                templateName = "recRuleAltStartAction";
                altActionST = codegenTemplates.getInstanceOf(templateName)!;
                altActionST.add("ctxName", Utils.capitalize(r.name));
            }

            altActionST.add("ruleName", r.name);

            // add label of any lr ref we deleted
            altActionST.add("label", altInfo.leftRecursiveRuleRefLabel);
            if (altActionST.impl!.formalArguments!.has("isListLabel")) {
                altActionST.add("isListLabel", altInfo.isListLabel);
            } else {
                if (altInfo.isListLabel) {
                    this.delegate.getGrammar()!.tool.errorManager.toolError(ErrorType.CODE_TEMPLATE_ARG_ISSUE,
                        templateName, "isListLabel");
                }
            }

            const altAction = new Action(this.delegate, ruleFunction.altLabelCtxs!.get(altInfo.altLabel!)!,
                altActionST);
            const alt = opAltsCode[i];
            alt.insertOp(0, altAction);
        }
    }

    public buildNormalRuleFunction(r: Rule, ruleFunction: RuleFunction): void {
        const gen = this.delegate.getGenerator()!;

        // TRIGGER factory functions for rule alts, elements
        const adaptor = new GrammarASTAdaptor(r.ast.token?.inputStream ?? undefined);

        const blk = r.ast.getFirstChildWithType(ANTLRv4Parser.BLOCK) as GrammarAST;
        const nodes = new CommonTreeNodeStream(adaptor, blk);
        this.walker = new SourceGenTriggers(nodes, this);

        // walk AST of rule alts/elements
        ruleFunction.code = this.walker.block(null, null)!;
        ruleFunction.hasLookaheadBlock = this.walker.hasLookaheadBlock;
        ruleFunction.ctxType = gen.getTarget().getRuleFunctionContextStructName(ruleFunction);
        ruleFunction.postamble = this.rulePostamble(ruleFunction, r);
    }

    public buildLexerRuleActions(lexer: Lexer, r: Rule): void {
        if (r.actions.length === 0) {
            return;
        }

        const gen = this.delegate.getGenerator()!;
        const g = this.delegate.getGrammar();
        const ctxType = gen.getTarget().getRuleFunctionContextStructName(r);
        let raf = lexer.actionFuncs.get(r);
        if (!raf) {
            raf = new RuleActionFunction(this.delegate, r, ctxType);
        }

        for (const a of r.actions) {
            if (a instanceof PredAST) {
                const p = a;
                let rsf = lexer.sempredFuncs.get(r);
                if (!rsf) {
                    rsf = new RuleSempredFunction(this.delegate, r, ctxType);
                    lexer.sempredFuncs.set(r, rsf);
                }
                rsf.actions.set(g!.sempreds.get(p)!, new Action(this.delegate, p));
            } else {
                if (a.getType() === ANTLRv4Parser.ACTION) {
                    raf.actions.set(g!.lexerActions.get(a)!, new Action(this.delegate, a));
                }
            }
        }

        if (raf.actions.size > 0 && !lexer.actionFuncs.has(r)) {
            // only add to lexer if the function actually contains actions
            lexer.actionFuncs.set(r, raf);
        }
    }

    public rule(r: Rule): RuleFunction {
        let rf = this.delegate.rule(r)!;
        for (const ext of this.extensions) {
            rf = ext.rule(rf);
        }

        return rf;
    }

    public rulePostamble(ruleFunction: RuleFunction, r: Rule): SrcOp[] {
        let ops = this.delegate.rulePostamble(ruleFunction, r)!;
        for (const ext of this.extensions) {
            ops = ext.rulePostamble(ops);
        }

        return ops;
    }

    public getGrammar(): Grammar | undefined {
        return this.delegate.getGrammar();
    }

    public getGenerator(): CodeGenerator {
        return this.delegate.getGenerator()!;
    }

    public alternative(alt: Alternative, outerMost: boolean): CodeBlockForAlt {
        let blk = this.delegate.alternative(alt, outerMost)!;
        if (outerMost) {
            this.currentOuterMostAlternativeBlock = blk as CodeBlockForOuterMostAlt;
        }

        for (const ext of this.extensions) {
            blk = ext.alternative(blk, outerMost);
        }

        return blk;
    }

    public finishAlternative(blk: CodeBlockForAlt, ops: SrcOp[], outerMost: boolean): CodeBlockForAlt {
        blk = this.delegate.finishAlternative(blk, ops);
        for (const ext of this.extensions) {
            blk = ext.finishAlternative(blk, outerMost);
        }

        return blk;
    }

    public ruleRef(id: GrammarAST, label: GrammarAST | null, args: GrammarAST | null): SrcOp[] {
        let ops = this.delegate.ruleRef(id, label, args)!;
        for (const ext of this.extensions) {
            ops = ext.ruleRef(ops);
        }

        return ops;
    }

    public tokenRef(id: GrammarAST, label: GrammarAST | null, args: GrammarAST | null): SrcOp[] {
        let ops = this.delegate.tokenRef(id, label, args)!;
        for (const ext of this.extensions) {
            ops = ext.tokenRef(ops);
        }

        return ops;
    }

    public stringRef(id: GrammarAST, label: GrammarAST | null): SrcOp[] {
        let ops = this.delegate.stringRef(id, label)!;
        for (const ext of this.extensions) {
            ops = ext.stringRef(ops);
        }

        return ops;
    }

    /** (A|B|C) possibly with ebnfRoot and label */
    public set(setAST: GrammarAST, labelAST: GrammarAST | null, invert: boolean): SrcOp[] {
        let ops = this.delegate.set(setAST, labelAST, invert)!;
        for (const ext of this.extensions) {
            ops = ext.set(ops);
        }

        return ops;
    }

    public epsilon(alt: Alternative, outerMost: boolean): CodeBlockForAlt {
        let blk = this.delegate.epsilon(alt, outerMost)!;
        for (const ext of this.extensions) {
            blk = ext.epsilon(blk);
        }

        return blk;
    }

    public wildcard(ast: GrammarAST, labelAST: GrammarAST | null): SrcOp[] {
        let ops = this.delegate.wildcard(ast, labelAST)!;
        for (const ext of this.extensions) {
            ops = ext.wildcard(ops);
        }

        return ops;
    }

    public action(ast: ActionAST): SrcOp[] {
        let ops = this.delegate.action(ast)!;
        for (const ext of this.extensions) {
            ops = ext.action(ops);
        }

        return ops;
    }

    public sempred(ast: ActionAST): SrcOp[] {
        let ops = this.delegate.sempred(ast)!;
        for (const ext of this.extensions) {
            ops = ext.sempred(ops);
        }

        return ops;
    }

    public getChoiceBlock(blkAST: BlockAST, alts: CodeBlockForAlt[], label: GrammarAST | null): Choice {
        let c = this.delegate.getChoiceBlock(blkAST, alts, label)!;
        for (const ext of this.extensions) {
            c = ext.getChoiceBlock(c);
        }

        return c;
    }

    public getEBNFBlock(ebnfRoot: GrammarAST | null, alts: CodeBlockForAlt[]): Choice {
        let c = this.delegate.getEBNFBlock(ebnfRoot, alts)!;
        for (const ext of this.extensions) {
            c = ext.getEBNFBlock(c);
        }

        return c;
    }

    public needsImplicitLabel(id: GrammarAST, op: LabeledOp): boolean {
        let needs = this.delegate.needsImplicitLabel(id, op);
        for (const ext of this.extensions) {
            needs ||= ext.needsImplicitLabel(id, op);
        }

        return needs;
    }

    public getRoot(): OutputModelObject {
        return this.root;
    }

    public setRoot(root: OutputModelObject): void {
        this.root = root;
    }

    public getCurrentRuleFunction(): RuleFunction | undefined {
        if (this.currentRule.length > 0) {
            return this.currentRule[this.currentRule.length - 1];
        }

        return undefined;
    }

    public pushCurrentRule(r: RuleFunction): void {
        this.currentRule.push(r);
    }

    public popCurrentRule(): RuleFunction | null {
        if (this.currentRule.length > 0) {
            return this.currentRule.pop()!;
        }

        return null;
    }

    public getCurrentOuterMostAlt(): Alternative {
        return this.currentOuterMostAlt;
    }

    public setCurrentOuterMostAlt(currentOuterMostAlt: Alternative): void {
        this.currentOuterMostAlt = currentOuterMostAlt;
    }

    public setCurrentBlock(blk: CodeBlock): void {
        this.currentBlock = blk;
    }

    public getCurrentBlock(): CodeBlock {
        return this.currentBlock;
    }

    public setCurrentOuterMostAlternativeBlock(currentOuterMostAlternativeBlock: CodeBlockForOuterMostAlt): void {
        this.currentOuterMostAlternativeBlock = currentOuterMostAlternativeBlock;
    }

    public getCurrentOuterMostAlternativeBlock(): CodeBlockForOuterMostAlt {
        return this.currentOuterMostAlternativeBlock;
    }

    public getCodeBlockLevel(): number {
        return this.codeBlockLevel;
    }
}
