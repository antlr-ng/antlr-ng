/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/* eslint-disable jsdoc/require-returns */

import { LeftRecursiveRuleAltInfo } from "../analysis/LeftRecursiveRuleAltInfo.js";
import { OrderedHashMap } from "../misc/OrderedHashMap.js";
import { Alternative } from "./Alternative.js";
import { Grammar } from "./Grammar.js";
import { Rule } from "./Rule.js";
import { AltAST } from "./ast/AltAST.js";
import type { GrammarAST } from "./ast/GrammarAST.js";
import { RuleAST } from "./ast/RuleAST.js";

export class LeftRecursiveRule extends Rule {
    public override readonly ruleType: string = "LeftRecursiveRule";

    public recPrimaryAlts: LeftRecursiveRuleAltInfo[];
    public recOpAlts: OrderedHashMap<number, LeftRecursiveRuleAltInfo>;
    public originalAST: RuleAST;

    /** Did we delete any labels on direct left-recur refs? Points at ID of ^(= ID el) */
    public leftRecursiveRuleRefLabels = new Array<[GrammarAST, string | undefined]>();

    public constructor(g: Grammar, name: string, ast: RuleAST) {
        super(g, name, ast, 1); // always just one
        this.originalAST = ast;
        for (let i = 1; i <= this.numberOfAlts; i++) {
            this.alt[i] = new Alternative(this, i);
        }
    }

    public override hasAltSpecificContexts(): boolean {
        return super.hasAltSpecificContexts() || this.getAltLabels() !== null;
    }

    public override getOriginalNumberOfAlts(): number {
        return this.recPrimaryAlts.length + this.recOpAlts.size;
    }

    public getOriginalAST(): RuleAST {
        return this.originalAST;
    }

    public override getUnlabeledAltASTs(): AltAST[] | null {
        const alts = new Array<AltAST>();
        for (const altInfo of this.recPrimaryAlts) {
            if (altInfo.altLabel === undefined) {
                alts.push(altInfo.originalAltAST!);
            }

        }
        for (let i = 0; i < this.recOpAlts.size; i++) {
            const altInfo = this.recOpAlts.getElement(i)!;
            if (altInfo.altLabel === undefined) {
                alts.push(altInfo.originalAltAST!);
            }

        }
        if (alts.length === 0) {
            return null;
        }

        return alts;
    }

    /**
     * Return an array that maps predicted alt from primary decision
     *  to original alt of rule. For following rule, return [0, 2, 4]
     *
     * ```antlr
     * e : e '*' e
     *   | INT
     *   | e '+' e
     *   | ID
     *   ;
     * ```
     *
     *  That maps predicted alt 1 to original alt 2 and predicted 2 to alt 4.
     */
    public getPrimaryAlts(): number[] {
        const alts: number[] = [0];
        for (const altInfo of this.recPrimaryAlts) {
            alts.push(altInfo.altNum);
        }

        return alts;
    }

    /**
     * Return an array that maps predicted alt from recursive op decision
     *  to original alt of rule. For following rule, return [0, 1, 3]
     *
     * ```antlr
     * e : e '*' e
     *   | INT
     *   | e '+' e
     *   | ID
     *   ;
     * ```
     *  That maps predicted alt 1 to original alt 1 and predicted 2 to alt 3.
     */
    public getRecursiveOpAlts(): number[] {
        const alts: number[] = [0];
        for (const [_, altInfo] of this.recOpAlts) {
            alts.push(altInfo.altNum);
        }

        return alts;
    }

    /** Get -&gt; labels from those alts we deleted for left-recursive rules. */

    public override getAltLabels(): Map<string, Array<[number, AltAST]>> | null {
        const labels = new Map<string, Array<[number, AltAST]>>();
        const normalAltLabels = super.getAltLabels();
        if (normalAltLabels !== null) {
            normalAltLabels.forEach((value, key) => {
                labels.set(key, value);
            });
        }

        for (const altInfo of this.recPrimaryAlts) {
            if (altInfo.altLabel !== undefined) {
                let pairs = labels.get(altInfo.altLabel);
                if (!pairs) {
                    pairs = [];
                    labels.set(altInfo.altLabel, pairs);
                }

                pairs.push([altInfo.altNum, altInfo.originalAltAST!]);
            }
        }

        for (let i = 0; i < this.recOpAlts.size; i++) {
            const altInfo = this.recOpAlts.getElement(i)!;
            if (altInfo.altLabel !== undefined) {
                let pairs = labels.get(altInfo.altLabel);
                if (!pairs) {
                    pairs = [];
                    labels.set(altInfo.altLabel, pairs);
                }

                pairs.push([altInfo.altNum, altInfo.originalAltAST!]);
            }
        }

        if (labels.size === 0) {
            return null;
        }

        return labels;
    }
}
