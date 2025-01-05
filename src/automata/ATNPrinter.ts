/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import {
    ActionTransition, ATNState, AtomTransition, BlockEndState, BlockStartState, EpsilonTransition, HashSet,
    NotSetTransition, PlusBlockStartState, PlusLoopbackState, RuleStartState, RuleStopState, RuleTransition,
    SetTransition, StarBlockStartState, StarLoopbackState, StarLoopEntryState
} from "antlr4ng";

import type { Grammar } from "../tool/index.js";

/** An ATN walker that knows how to dump them to serialized strings. */
export class ATNPrinter {
    private work: ATNState[];
    private marked: HashSet<ATNState>;

    public constructor(private g: Grammar, private start: ATNState) {
    }

    public asString(): string {
        this.marked = new HashSet<ATNState>();

        this.work = [];
        this.work.push(this.start);

        const vocabulary = this.g.getVocabulary();

        let buffer = "";
        while (this.work.length > 0) {
            const s = this.work.shift();
            if (!s || this.marked.contains(s)) {
                continue;
            }

            this.marked.add(s);
            const targets = new Set<number>();
            for (const t of s.transitions) {
                if (!(s instanceof RuleStopState)) { // don't add follow states to work
                    if (t instanceof RuleTransition) {
                        this.work.push(t.followState);
                    } else {
                        this.work.push(t.target);
                    }
                } else {
                    // Rule stop states can have multiple transitions to the same follow state.
                    // No need to process the same state more than once.
                    if (targets.has(t.target.stateNumber)) {
                        continue;
                    }
                    targets.add(t.target.stateNumber);
                }

                buffer += this.getStateString(s);
                if (t instanceof EpsilonTransition) {
                    buffer += "->" + this.getStateString(t.target) + "\n";
                } else {
                    if (t instanceof RuleTransition) {
                        buffer += "-" + this.g.getRule(t.ruleIndex)!.name + "->" + this.getStateString(t.target) +
                            "\n";
                    } else {
                        if (t instanceof ActionTransition) {
                            const a = t;
                            buffer += "-" + a.toString() + "->" + this.getStateString(t.target) + "\n";
                        } else {
                            if (t instanceof SetTransition) {
                                const not = t instanceof NotSetTransition;
                                if (this.g.isLexer()) {
                                    buffer += "-" + (not ? "~" : "") + t.toString() + "->" +
                                        this.getStateString(t.target) + "\n";
                                } else {
                                    buffer += "-" + (not ? "~" : "") +
                                        t.label.toStringWithVocabulary(vocabulary) +
                                        "->" + this.getStateString(t.target) + "\n";
                                }
                            } else {
                                if (t instanceof AtomTransition) {
                                    const label = this.g.getTokenDisplayName(t.labelValue);
                                    buffer += "-" + label + "->" + this.getStateString(t.target) + "\n";
                                } else {
                                    buffer += `-${t}->${this.getStateString(t.target)}\n`;
                                }
                            }
                        }
                    }
                }
            }
        }

        return buffer;
    }

    private getStateString(s: ATNState): string {
        const n = s.stateNumber;
        let stateStr = "s" + n;
        if (s instanceof StarBlockStartState) {
            stateStr = "StarBlockStart_" + n;
        } else {
            if (s instanceof PlusBlockStartState) {
                stateStr = "PlusBlockStart_" + n;
            } else {
                if (s instanceof BlockStartState) {
                    stateStr = "BlockStart_" + n;
                } else {
                    if (s instanceof BlockEndState) {
                        stateStr = "BlockEnd_" + n;
                    } else {
                        if (s instanceof RuleStartState) {
                            stateStr = "RuleStart_" + this.g.getRule(s.ruleIndex)!.name + "_" + n;
                        } else {
                            if (s instanceof RuleStopState) {
                                stateStr = "RuleStop_" + this.g.getRule(s.ruleIndex)!.name + "_" + n;
                            } else {
                                if (s instanceof PlusLoopbackState) {
                                    stateStr = "PlusLoopBack_" + n;
                                } else {
                                    if (s instanceof StarLoopbackState) {
                                        stateStr = "StarLoopBack_" + n;
                                    } else {
                                        if (s instanceof StarLoopEntryState) {
                                            stateStr = "StarLoopEntry_" + n;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return stateStr;
    }
}
