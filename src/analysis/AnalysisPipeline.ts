/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { IntervalSet, LL1Analyzer, Token } from "antlr4ng";
import { Utils } from "../misc/Utils.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { LeftRecursionDetector } from "./LeftRecursionDetector.js";

export class AnalysisPipeline {
    public g: Grammar;

    public constructor(g: Grammar) {
        this.g = g;
    }

    /** Return whether lookahead sets are disjoint; no lookahead ⇒ not disjoint */
    public static disjoint(altLook?: Array<IntervalSet | undefined>): boolean {
        if (!altLook) {
            return false;
        }

        let collision = false;
        const combined = new IntervalSet();
        for (const look of altLook) {
            if (look === undefined) {
                return false; // lookahead must've computation failed
            }

            if (look.and(combined).length !== 0) {
                collision = true;
                break;
            }
            combined.addSet(look);
        }

        return !collision;
    }

    public process(): void {
        // LEFT-RECURSION CHECK
        const lr = new LeftRecursionDetector(this.g, this.g.atn!);
        lr.check();
        if (lr.listOfRecursiveCycles.length !== 0) {
            return;
        }
        // bail out

        if (this.g.isLexer()) {
            this.processLexer();
        } else {
            // BUILD DFA FOR EACH DECISION
            this.processParser();
        }
    }

    protected processLexer(): void {
        // make sure all non-fragment lexer rules must match at least one symbol
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

    protected processParser(): void {
        this.g.decisionLOOK = new Array<IntervalSet[]>(this.g.atn!.getNumberOfDecisions() + 1);
        for (const s of this.g.atn!.decisionToState) {
            this.g.tool.logInfo({
                component: "LL1",
                msg: "\nDECISION " + s.decision + " in rule " + this.g.getRule(s.ruleIndex)?.name
            });

            let look: IntervalSet[] | undefined;
            if (s.nonGreedy) { // nongreedy decisions can't be LL(1)
                look = new Array<IntervalSet>(s.transitions.length + 1);
            } else {
                const anal = new LL1Analyzer(this.g.atn!);
                look = anal.getDecisionLookahead(s) as IntervalSet[];
                this.g.tool.logInfo({ component: "LL1", msg: "look=" + look });
            }

            /* assert s.decision + 1 >= g.decisionLOOK.size(); */
            Utils.setSize(this.g.decisionLOOK, s.decision + 1);
            this.g.decisionLOOK[s.decision] = look;
            this.g.tool.logInfo({ component: "LL1", msg: "LL(1)? " + AnalysisPipeline.disjoint(look) });
        }
    }
}
