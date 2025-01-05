/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { OutputModelFactory } from "./OutputModelFactory.js";
import { Choice } from "./model/Choice.js";
import { CodeBlockForAlt } from "./model/CodeBlockForAlt.js";
import { LabeledOp } from "./model/LabeledOp.js";
import { Lexer } from "./model/Lexer.js";
import { LexerFile } from "./model/LexerFile.js";
import { Parser } from "./model/Parser.js";
import { ParserFile } from "./model/ParserFile.js";
import { RuleFunction } from "./model/RuleFunction.js";
import { SrcOp } from "./model/SrcOp.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";

/** Filter list of SrcOps and return; default is pass-through filter */
export class CodeGeneratorExtension {
    public factory: OutputModelFactory;

    public constructor(factory: OutputModelFactory) {
        this.factory = factory;
    }

    public parserFile(f: ParserFile): ParserFile {
        return f;
    }

    public parser(p: Parser): Parser {
        return p;
    }

    public lexerFile(f: LexerFile): LexerFile {
        return f;
    }

    public lexer(l: Lexer): Lexer {
        return l;
    }

    public rule(rf: RuleFunction): RuleFunction {
        return rf;
    }

    public rulePostamble(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    public alternative(blk: CodeBlockForAlt, outerMost: boolean): CodeBlockForAlt {
        return blk;
    }

    public finishAlternative(blk: CodeBlockForAlt, outerMost: boolean): CodeBlockForAlt {
        return blk;
    }

    public epsilon(blk: CodeBlockForAlt): CodeBlockForAlt {
        return blk;
    }

    public ruleRef(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    public tokenRef(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    public set(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    public stringRef(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    public wildcard(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    // ACTIONS

    public action(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    public sempred(ops: SrcOp[]): SrcOp[] {
        return ops;
    }

    // BLOCKS

    public getChoiceBlock(c: Choice): Choice {
        return c;
    }

    public getEBNFBlock(c: Choice): Choice {
        return c;
    }

    public needsImplicitLabel(_id: GrammarAST, op: LabeledOp): boolean {
        return false;
    }
}
