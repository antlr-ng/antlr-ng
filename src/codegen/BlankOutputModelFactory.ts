/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet } from "antlr4ng";

import type { IToolParameters } from "../tool-parameters.js";
import { Alternative } from "../tool/Alternative.js";
import type { Grammar } from "../tool/Grammar.js";
import { Rule } from "../tool/Rule.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import type { CodeGenerator } from "./CodeGenerator.js";
import type { OutputModelController } from "./OutputModelController.js";
import { OutputModelFactory } from "./OutputModelFactory.js";
import { Choice } from "./model/Choice.js";
import { CodeBlockForAlt } from "./model/CodeBlockForAlt.js";
import type { CodeBlockForOuterMostAlt } from "./model/CodeBlockForOuterMostAlt.js";
import { ILabeledOp } from "./model/ILabeledOp.js";
import { Lexer } from "./model/Lexer.js";
import { LexerFile } from "./model/LexerFile.js";
import type { OutputModelObject } from "./model/OutputModelObject.js";
import { Parser } from "./model/Parser.js";
import { ParserFile } from "./model/ParserFile.js";
import { RuleFunction } from "./model/RuleFunction.js";
import { SrcOp } from "./model/SrcOp.js";
import type { CodeBlock } from "./model/decl/CodeBlock.js";

export abstract class BlankOutputModelFactory implements OutputModelFactory {
    public getGrammar(): Grammar | undefined {
        return undefined;
    }

    public getGenerator(): CodeGenerator | undefined {
        return undefined;
    }

    public setController(controller: OutputModelController): void { /**/ }

    public getController(): OutputModelController | undefined {
        return undefined;
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

    public rulePostamble(ruleFunction: RuleFunction, r: Rule): SrcOp[] | undefined {
        return undefined;
    }

    public lexerFile(fileName: string): LexerFile | undefined {
        return undefined;
    }

    public lexer(file: LexerFile): Lexer | undefined {
        return undefined;
    }

    // ALTERNATIVES / ELEMENTS

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

    // ACTIONS

    public action(ast: ActionAST): SrcOp[] | undefined {
        return undefined;
    }

    public sempred(ast: ActionAST): SrcOp[] | undefined {
        return undefined;
    };

    // BLOCKS

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

    // CONTEXT INFO

    public getRoot(): OutputModelObject | undefined {
        return undefined;
    }

    public getCurrentRuleFunction(): RuleFunction | undefined {
        return undefined;
    }

    public getCurrentOuterMostAlt(): Alternative | undefined {
        return undefined;
    }

    public getCurrentBlock(): CodeBlock | undefined {
        return undefined;
    }

    public getCurrentOuterMostAlternativeBlock(): CodeBlockForOuterMostAlt | undefined {
        return undefined;
    }

    public getCodeBlockLevel(): number {
        return -1;
    }

    public getTreeLevel(): number {
        return -1;
    }

}
