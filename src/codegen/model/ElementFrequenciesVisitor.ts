/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { GrammarTreeVisitor } from "../../tree/walkers/GrammarTreeVisitor.js";

import { FrequencySet } from "../../misc/FrequencySet.js";
import { ActionAST } from "../../tool/ast/ActionAST.js";
import { AltAST } from "../../tool/ast/AltAST.js";
import { GrammarAST } from "../../tool/ast/GrammarAST.js";
import { TerminalAST } from "../../tool/ast/TerminalAST.js";
import { ANTLRv4Parser } from "../../generated/ANTLRv4Parser.js";
import type { CommonTreeNodeStream } from "../../tree/CommonTreeNodeStream.js";

export class ElementFrequenciesVisitor extends GrammarTreeVisitor {

    /**
     * This special value means "no set", and is used by {@link #minFrequencies}
     * to ensure that {@link #combineMin} doesn't merge an empty set (all zeros)
     * with the results of the first alternative.
     */
    private static readonly SENTINEL = new FrequencySet<string>();

    public readonly frequencies: Array<FrequencySet<string>>;

    private readonly minFrequencies: Array<FrequencySet<string>>;

    public constructor(input: CommonTreeNodeStream) {
        super(input);
        this.frequencies = new Array<FrequencySet<string>>();
        this.frequencies.unshift(new FrequencySet<string>());
        this.minFrequencies = new Array<FrequencySet<string>>();
        this.minFrequencies.unshift(ElementFrequenciesVisitor.SENTINEL);
    }

    /**
     * Generate a frequency set as the union of two input sets. If an
     * element is contained in both sets, the value for the output will be
     * the maximum of the two input values.
     *
     * @param a The first set.
     * @param b The second set.
     * @returns The union of the two sets, with the maximum value chosen
     * whenever both sets contain the same key.
     */
    protected static combineMax(a: FrequencySet<string>, b: FrequencySet<string>): FrequencySet<string> {
        const result = ElementFrequenciesVisitor.combineAndClip(a, b, 1);
        for (const [key, value] of a.entries()) {
            result.set(key, value);
        }

        for (const [key, value] of b.entries()) {
            const slot = result.get(key);
            result.set(key, slot === undefined ? value : Math.max(slot, value));
        }

        return result;
    }

    /**
     * Generate a frequency set as the union of two input sets. If an
     * element is contained in both sets, the value for the output will be
     * the minimum of the two input values.
     *
     * @param a The first set.
     * @param b The second set. If this set is {@link #SENTINEL}, it is treated
     * as though no second set were provided.
     * @returns The union of the two sets, with the minimum value chosen
     * whenever both sets contain the same key.
     */
    protected static combineMin(a: FrequencySet<string>, b: FrequencySet<string>): FrequencySet<string> {
        if (b === ElementFrequenciesVisitor.SENTINEL) {
            return a;
        }

        /* assert a != SENTINEL; */
        const result = ElementFrequenciesVisitor.combineAndClip(a, b, Number.MAX_VALUE);
        for (const [key] of result.entries()) {
            result.set(key, Math.min(a.count(key), b.count(key)));
        }

        return result;
    }

    /**
     * Generate a frequency set as the union of two input sets, with the
     * values clipped to a specified maximum value. If an element is
     * contained in both sets, the value for the output, prior to clipping,
     * will be the sum of the two input values.
     *
     * @param a The first set.
     * @param b The second set.
     * @param clip The maximum value to allow for any output.
     * @returns The sum of the two sets, with the individual elements clipped
     * to the maximum value given by {@code clip}.
     */
    protected static combineAndClip(a: FrequencySet<string>, b: FrequencySet<string>,
        clip: number): FrequencySet<string> {
        const result = new FrequencySet<string>();
        for (const [key, value] of a.entries()) {
            for (let i = 0; i < value; i++) {
                result.add(key);
            }
        }

        for (const [key, value] of b.entries()) {
            for (let i = 0; i < value; i++) {
                result.add(key);
            }
        }

        for (const [key, value] of result.entries()) {
            result.set(key, Math.min(value, clip));
        }

        return result;
    }

    public override tokenRef(ref: TerminalAST): void {
        this.frequencies[0].add(ref.getText());
        this.minFrequencies[0].add(ref.getText());
    }

    public override ruleRef(ref: GrammarAST, arg: ActionAST): void {
        this.frequencies[0].add(ref.getText());
        this.minFrequencies[0].add(ref.getText());
    }

    public override stringRef(ref: TerminalAST): void {
        const tokenName = ref.g.getTokenName(ref.getText());

        if (tokenName !== null && !tokenName.startsWith("T__")) {
            this.frequencies[0].add(tokenName);
            this.minFrequencies[0].add(tokenName);
        }
    }

    public getMinFrequencies(): FrequencySet<string> {
        return this.minFrequencies[0];
    }

    /*
     * Parser rules
     */

    protected override enterAlternative(tree: AltAST): void {
        this.frequencies.unshift(new FrequencySet<string>());
        this.minFrequencies.unshift(new FrequencySet<string>());
    }

    protected override exitAlternative(tree: AltAST): void {
        this.frequencies.unshift(ElementFrequenciesVisitor.combineMax(this.frequencies.shift()!,
            this.frequencies.shift()!));
        this.minFrequencies.unshift(ElementFrequenciesVisitor.combineMin(this.minFrequencies.shift()!,
            this.minFrequencies.shift()!));
    }

    protected override enterElement(tree: GrammarAST): void {
        this.frequencies.unshift(new FrequencySet<string>());
        this.minFrequencies.unshift(new FrequencySet<string>());
    }

    protected override exitElement(tree: GrammarAST): void {
        this.frequencies.unshift(ElementFrequenciesVisitor.combineAndClip(this.frequencies.shift()!,
            this.frequencies.shift()!, 2));
        this.minFrequencies.unshift(ElementFrequenciesVisitor.combineAndClip(this.minFrequencies.shift()!,
            this.minFrequencies.shift()!, 2));
    }

    protected override enterBlockSet(tree: GrammarAST): void {
        this.frequencies.unshift(new FrequencySet<string>());
        this.minFrequencies.unshift(new FrequencySet<string>());
    }

    protected override exitBlockSet(tree: GrammarAST): void {
        // This visitor counts a block set as a sequence of elements, not a
        // sequence of alternatives of elements. Reset the count back to 1
        // for all items when leaving the set to ensure duplicate entries in
        // the set are treated as a maximum of one item.
        for (const key of this.frequencies[0].keys()) {
            this.frequencies[0].set(key, 1);
        }

        if (this.minFrequencies[0].size > 1) {
            // Everything is optional
            this.minFrequencies[0].clear();
        }

        this.frequencies.unshift(ElementFrequenciesVisitor.combineAndClip(this.frequencies.shift()!,
            this.frequencies.shift()!, 2));
        this.minFrequencies.unshift(ElementFrequenciesVisitor.combineAndClip(this.minFrequencies.shift()!,
            this.minFrequencies.shift()!, 2));
    }

    protected override exitSubrule(tree: GrammarAST): void {
        if (tree.getType() === ANTLRv4Parser.CLOSURE || tree.getType() === ANTLRv4Parser.POSITIVE_CLOSURE) {
            const set = this.frequencies[0];
            for (const key of set.keys()) {
                set.set(key, 2);
            }
        }

        if (tree.getType() === ANTLRv4Parser.CLOSURE || tree.getType() === ANTLRv4Parser.OPTIONAL) {
            // Everything inside a closure is optional, so the minimum
            // number of occurrences for all elements is 0.
            this.minFrequencies[0].clear();
        }
    }

    /*
     * Lexer rules
     */

    protected override enterLexerAlternative(tree: GrammarAST): void {
        this.frequencies.unshift(new FrequencySet<string>());
        this.minFrequencies.unshift(new FrequencySet<string>());
    }

    protected override exitLexerAlternative(tree: GrammarAST): void {
        this.frequencies.unshift(ElementFrequenciesVisitor.combineMax(this.frequencies.shift()!,
            this.frequencies.pop()!));
        this.minFrequencies.unshift(ElementFrequenciesVisitor.combineMin(this.minFrequencies.shift()!,
            this.minFrequencies.pop()!));
    }

    protected override enterLexerElement(tree: GrammarAST): void {
        this.frequencies.unshift(new FrequencySet<string>());
        this.minFrequencies.unshift(new FrequencySet<string>());
    }

    protected override exitLexerElement(tree: GrammarAST): void {
        this.frequencies.unshift(ElementFrequenciesVisitor.combineAndClip(this.frequencies.shift()!,
            this.frequencies.shift()!, 2));
        this.minFrequencies.unshift(ElementFrequenciesVisitor.combineAndClip(this.minFrequencies.shift()!,
            this.minFrequencies.shift()!, 2));
    }

    protected override exitLexerSubrule(tree: GrammarAST): void {
        if (tree.getType() === ANTLRv4Parser.CLOSURE || tree.getType() === ANTLRv4Parser.POSITIVE_CLOSURE) {
            const set = this.frequencies[0];
            for (const key of set.keys()) {
                set.set(key, 2);
            }
        }

        if (tree.getType() === ANTLRv4Parser.CLOSURE) {
            // Everything inside a closure is optional, so the minimum
            // number of occurrences for all elements is 0.
            this.minFrequencies[0].clear();
        }
    }
}
