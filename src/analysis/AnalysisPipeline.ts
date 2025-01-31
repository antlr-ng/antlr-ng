/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet, LL1Analyzer, Token } from "antlr4ng";
import { disjoint } from "../support/helpers.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { LeftRecursionDetector } from "./LeftRecursionDetector.js";
import { Utils } from "../misc/Utils.js";

export class AnalysisPipeline {
    public constructor(private g: Grammar) { }

    public process(): void {
        // Left-recursion check.
        const lr = new LeftRecursionDetector(this.g, this.g.atn!);
        lr.check();
        if (lr.listOfRecursiveCycles.length !== 0) {
            // Bail out.
            return;
        }

        if (this.g.isLexer()) {
            this.processLexer();
        } else {
            // Build dfa for each decision.
            this.processParser();
        }
    }

    protected processLexer(): void {
        // Make sure all non-fragment lexer rules must match at least one symbol.
        for (const rule of this.g.rules.values()) {
            if (rule.isFragment()) {
                continue;
            }

            const analyzer = new LL1Analyzer(this.g.atn!);
            const look = analyzer.look(this.g.atn!.ruleToStartState[rule.index]!, undefined);
            if (look.contains(Token.EPSILON)) {
                this.g.tool.errorManager.grammarError(ErrorType.EPSILON_TOKEN, this.g.fileName,
                    (rule.ast.getChild(0) as GrammarAST).token!, rule.name);
            }
        }
    }

    private processParser(): void {
        this.g.decisionLOOK = new Array<IntervalSet[]>(this.g.atn!.getNumberOfDecisions() + 1);
        for (const s of this.g.atn!.decisionToState) {
            this.g.tool.logInfo({
                component: "LL1",
                msg: "\nDECISION " + s.decision + " in rule " + this.g.getRule(s.ruleIndex)?.name
            });

            let look: IntervalSet[] = [];
            if (s.nonGreedy) { // nongreedy decisions can't be LL(1)
                look = new Array<IntervalSet>(s.transitions.length + 1);
            } else {
                const anal = new LL1Analyzer(this.g.atn!);
                look = anal.getDecisionLookahead(s) as IntervalSet[];
                this.g.tool.logInfo({ component: "LL1", msg: "look=" + look });
            }

            Utils.setSize(this.g.decisionLOOK, s.decision + 1);
            this.g.decisionLOOK[s.decision] = look;
            this.g.tool.logInfo({ component: "LL1", msg: "LL(1)? " + disjoint(look) });
        }
    }
}
