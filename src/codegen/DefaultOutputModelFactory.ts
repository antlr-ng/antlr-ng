/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { IntervalSet } from "antlr4ng";

import type { IToolParameters } from "../tool-parameters.js";
import { Alternative } from "../tool/Alternative.js";
import { Grammar } from "../tool/Grammar.js";
import { Rule } from "../tool/Rule.js";
import type { ActionAST } from "../tool/ast/ActionAST.js";
import type { BlockAST } from "../tool/ast/BlockAST.js";
import type { GrammarAST } from "../tool/ast/GrammarAST.js";
import { CodeGenerator } from "./CodeGenerator.js";
import type { IOutputModelFactory } from "./IOutputModelFactory.js";
import { OutputModelController } from "./OutputModelController.js";
import { Action } from "./model/Action.js";
import type { Choice } from "./model/Choice.js";
import type { CodeBlockForAlt } from "./model/CodeBlockForAlt.js";
import type { ILabeledOp } from "./model/ILabeledOp.js";
import type { Lexer } from "./model/Lexer.js";
import type { LexerFile } from "./model/LexerFile.js";
import type { Parser } from "./model/Parser.js";
import type { ParserFile } from "./model/ParserFile.js";
import { RuleFunction } from "./model/RuleFunction.js";
import { SrcOp } from "./model/SrcOp.js";
import { CodeBlock } from "./model/decl/CodeBlock.js";

/**
 * Create output objects for elements *within* rule functions except buildOutputModel() which builds outer/root
 * model object and any objects such as RuleFunction that surround elements in rule functions.
 */
export class DefaultOutputModelFactory implements IOutputModelFactory {
    public readonly grammar: Grammar;
    public readonly gen: CodeGenerator;

    public controller: OutputModelController;

    protected constructor(gen: CodeGenerator) {
        this.gen = gen;
        this.grammar = gen.g!;
    }

    public rulePostamble(ruleFunction: RuleFunction, r: Rule): SrcOp[] | undefined {
        if (r.namedActions.has("after") || r.namedActions.has("finally")) {
            // See OutputModelController.buildLeftRecursiveRuleFunction and Parser.exitRule for other places
            // which set stop.
            const gen = this.getGenerator();
            const codegenTemplates = gen.templates;
            const setStopTokenAST = codegenTemplates.getInstanceOf("recRuleSetStopToken")!;
            const setStopTokenAction = new Action(this, ruleFunction.ruleCtx, setStopTokenAST);
            const ops = new Array<SrcOp>(1);
            ops.push(setStopTokenAction);

            return ops;
        }

        return undefined;
    }

    public getGrammar(): Grammar | undefined {
        return this.grammar;
    }

    public getGenerator(): CodeGenerator {
        return this.gen;
    }

    public getCurrentRuleFunction(): RuleFunction | undefined {
        return this.controller.currentRuleFunction;
    }

    public getCurrentOuterMostAlt(): Alternative {
        return this.controller.currentOuterMostAlt;
    }

    public getCurrentBlock(): CodeBlock {
        return this.controller.currentBlock;
    }

    public parserFile(fileName: string, toolParameters: IToolParameters): ParserFile | undefined {
        return undefined;
    }

    public parser(file: ParserFile): Parser | undefined {
        return undefined;
    }

    public rule(r: Rule): RuleFunction | undefined {
        return undefined;
    }

    public lexerFile(fileName: string): LexerFile | undefined {
        return undefined;
    }

    public lexer(file: LexerFile): Lexer | undefined {
        return undefined;
    }

    // alternatives / elements

    public alternative(alt: Alternative, outerMost: boolean): CodeBlockForAlt | undefined {
        return undefined;
    }

    public finishAlternative(blk: CodeBlockForAlt, ops: SrcOp[]): CodeBlockForAlt {
        return blk;
    }

    public epsilon(alt: Alternative, outerMost: boolean): CodeBlockForAlt | undefined {
        return undefined;
    }

    public ruleRef(id: GrammarAST, label: GrammarAST, args: GrammarAST): SrcOp[] | undefined {
        return undefined;
    }

    public tokenRef(id: GrammarAST, label: GrammarAST | null, args: GrammarAST | null): SrcOp[] | undefined {
        return undefined;
    }

    public stringRef(id: GrammarAST, label: GrammarAST | null): SrcOp[] | undefined {
        return this.tokenRef(id, label, null);
    }

    public set(setAST: GrammarAST, label: GrammarAST, invert: boolean): SrcOp[] | undefined {
        return undefined;
    }

    public wildcard(ast: GrammarAST, labelAST: GrammarAST): SrcOp[] | undefined {
        return undefined;
    };

    // actions

    public action(ast: ActionAST): SrcOp[] | undefined {
        return undefined;
    }

    public sempred(ast: ActionAST): SrcOp[] | undefined {
        return undefined;
    };

    // blocks

    public getChoiceBlock(blkAST: BlockAST, alts: CodeBlockForAlt[], label: GrammarAST): Choice | undefined {
        return undefined;
    }

    public getEBNFBlock(ebnfRoot: GrammarAST, alts: CodeBlockForAlt[]): Choice | undefined {
        return undefined;
    }

    public getLL1ChoiceBlock(blkAST: BlockAST, alts: CodeBlockForAlt[]): Choice | undefined {
        return undefined;
    }

    public getComplexChoiceBlock(blkAST: BlockAST, alts: CodeBlockForAlt[]): Choice | undefined {
        return undefined;
    }

    public getLL1EBNFBlock(ebnfRoot: GrammarAST, alts: CodeBlockForAlt[]): Choice | undefined {
        return undefined;
    }

    public getComplexEBNFBlock(ebnfRoot: GrammarAST, alts: CodeBlockForAlt[]): Choice | undefined {
        return undefined;
    }

    public getLL1Test(look: IntervalSet, blkAST: GrammarAST): SrcOp[] | undefined {
        return undefined;
    }

    public needsImplicitLabel(id: GrammarAST, op: ILabeledOp): boolean {
        return false;
    }

}
