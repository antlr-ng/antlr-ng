/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet } from "antlr4ng";

import { ModelElement } from "../../misc/ModelElement.js";
import { Utils } from "../../misc/Utils.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { OutputModelFactory } from "../OutputModelFactory.js";
import { CaptureNextTokenType } from "./CaptureNextTokenType.js";
import { CodeBlockForAlt } from "./CodeBlockForAlt.js";
import { RuleElement } from "./RuleElement.js";
import { SrcOp } from "./SrcOp.js";
import { TestSetInline } from "./TestSetInline.js";
import { ThrowNoViableAlt } from "./ThrowNoViableAlt.js";
import { TokenInfo } from "./TokenInfo.js";
import { Decl } from "./decl/Decl.js";
import { TokenTypeDecl } from "./decl/TokenTypeDecl.js";

/**
 * The class hierarchy underneath SrcOp is pretty deep but makes sense that,
 *  for example LL1StarBlock is a kind of LL1Loop which is a kind of Choice.
 *  The problem is it's impossible to figure
 *  out how to construct one of these deeply nested objects because of the
 *  long super constructor call chain. Instead, I decided to in-line all of
 *  this and then look for opportunities to re-factor code into functions.
 *  It makes sense to use a class hierarchy to share data fields, but I don't
 *  think it makes sense to factor code using super constructors because
 *  it has too much work to do.
 */
export abstract class Choice extends RuleElement {
    public decision = -1;
    public label: Decl;

    @ModelElement
    public alts: CodeBlockForAlt[] = [];

    @ModelElement
    public preamble: SrcOp[] = [];

    public constructor(factory: OutputModelFactory,
        blkOrEbnfRootAST: GrammarAST,
        alts: CodeBlockForAlt[]) {
        super(factory, blkOrEbnfRootAST);
        this.alts = alts;
    }

    public addPreambleOp(op: SrcOp): void {
        this.preamble.push(op);
    }

    public getAltLookaheadAsStringLists(altLookSets: IntervalSet[]): TokenInfo[][] {
        const altLook: TokenInfo[][] = [];
        const target = this.factory!.getGenerator()!.getTarget();
        const grammar = this.factory!.getGrammar()!;
        for (const s of altLookSets) {
            const list = s.toArray();
            const info = new Array<TokenInfo>(list.length);
            for (let i = 0; i < info.length; i++) {
                info[i] = new TokenInfo(list[i], target.getTokenTypeAsTargetLabel(grammar, list[i]));
            }
            altLook.push(info);
        }

        return altLook;
    }

    public addCodeForLookaheadTempVar(look: IntervalSet): TestSetInline | null {
        const testOps = this.factory!.getLL1Test(look, this.ast!)!;
        const expr = Utils.find(testOps, TestSetInline);
        if (expr !== null) {
            const d = new TokenTypeDecl(this.factory!, expr.varName);
            this.factory!.getCurrentRuleFunction()!.addLocalDecl(d);
            const nextType = new CaptureNextTokenType(this.factory!, expr.varName);
            this.addPreambleOp(nextType);
        }

        return expr;
    }

    public getThrowNoViableAlt(factory: OutputModelFactory, blkAST: GrammarAST,
        expecting?: IntervalSet): ThrowNoViableAlt {
        return new ThrowNoViableAlt(factory, blkAST, expecting);
    }
}
