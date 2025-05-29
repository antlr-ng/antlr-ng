/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Character } from "../support/Character.js";
import { IssueCode } from "../tool/Issues.js";
import { Grammar } from "../tool/Grammar.js";
import type { CommonTree } from "../tree/CommonTree.js";

export class RangeBorderCharactersData {
    public constructor(
        public readonly lowerFrom: number,
        public readonly upperFrom: number,
        public readonly lowerTo: number,
        public readonly upperTo: number,
        public readonly mixOfLowerAndUpperCharCase: boolean) { }

    public static getAndCheckCharactersData(from: number, to: number, grammar: Grammar, tree: CommonTree,
        reportRangeContainsNotImpliedCharacters: boolean,
    ): RangeBorderCharactersData {
        const lowerFrom = Character.toLowerCase(from);
        const upperFrom = Character.toUpperCase(from);
        const lowerTo = Character.toLowerCase(to);
        const upperTo = Character.toUpperCase(to);

        const isLowerFrom = lowerFrom === from;
        const isLowerTo = lowerTo === to;
        const mixOfLowerAndUpperCharCase = isLowerFrom && !isLowerTo || !isLowerFrom && isLowerTo;
        if (reportRangeContainsNotImpliedCharacters && mixOfLowerAndUpperCharCase && from <= 0x7F && to <= 0x7F) {
            let notImpliedCharacters = "";
            for (let i = from; i < to; i++) {
                if (!Character.isAlphabetic(i)) {
                    notImpliedCharacters += String.fromCodePoint(i);
                }
            }

            if (notImpliedCharacters.length > 0) {
                grammar.tool.errorManager.grammarError(IssueCode.RangeProbablyContainsNotImpliedCharacter,
                    grammar.fileName, tree.token!,
                    {
                        arg: String.fromCodePoint(from),
                        arg2: String.fromCodePoint(to),
                        arg3: notImpliedCharacters.toString()
                    });
            }
        }

        return new RangeBorderCharactersData(lowerFrom, upperFrom, lowerTo, upperTo, mixOfLowerAndUpperCharCase);
    }

    public isSingleRange(): boolean {
        return this.lowerFrom === this.upperFrom && this.lowerTo === this.upperTo ||
            this.mixOfLowerAndUpperCharCase ||
            this.lowerTo - this.lowerFrom !== this.upperTo - this.upperFrom;
    }
}
