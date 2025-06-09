/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import {
    ATNConfig, ATNState, AbstractPredicateTransition, ActionTransition, AtomTransition, BlockEndState, BlockStartState,
    DFAState, DecisionState, NotSetTransition, PlusBlockStartState, PlusLoopbackState, RangeTransition,
    RuleStartState, RuleStopState, RuleTransition, SetTransition, StarBlockStartState, StarLoopEntryState,
    StarLoopbackState, Token,
    type Transition
} from "antlr4ng";

import { Grammar } from "./Grammar.js";

/** The DOT (part of graphviz) generation aspect. */
export class DOTGenerator {
    private arrowhead = "normal";
    private rankdir = "LR";
    private grammar: Grammar;

    public constructor(grammar: Grammar) {
        this.grammar = grammar;
    }

    /**
     * @returns A string containing a DOT description that, when displayed, will show the incoming state machine
     *          visually. All nodes reachable from startState will be included.
     */
    public getDOTFromState(startState: ATNState, isLexer = false, ruleNames?: string[]): string {
        ruleNames ??= Array.from(this.grammar.rules.keys());

        // The output DOT graph for visualization.
        const markedStates = new Set<ATNState>();

        const edges: string[] = [];

        const work: ATNState[] = [startState];
        while (true) {
            const s = work.shift();
            if (!s) {
                break;
            }

            if (markedStates.has(s)) {
                continue;
            }
            markedStates.add(s);

            // Don't go past end of rule node to the follow states.
            if (s instanceof RuleStopState) {
                continue;
            }

            // Make a DOT edge for each transition.
            for (let i = 0; i < s.transitions.length; ++i) {
                const edge = s.transitions[i];
                if (edge instanceof RuleTransition) {
                    // Don't jump to other rules, but display edge to follow node.
                    let label = "";
                    label = "<" + ruleNames[edge.ruleIndex];
                    if ((edge.target as RuleStartState).isLeftRecursiveRule) {
                        label += `[${edge.precedence}]`;
                    }
                    label += ">";

                    edges.push(this.renderEdge(`s${s.stateNumber}`, -1, `s${edge.followState.stateNumber}`, label,
                        this.arrowhead));

                    work.push(edge.followState);

                    continue;
                }

                const src = `s${s.stateNumber}`;
                const target = `s${edge.target.stateNumber}`;
                const arrowhead = this.arrowhead;
                let transitionIndex = -1;
                if (s.transitions.length > 1) {
                    transitionIndex = i;
                }

                if (edge instanceof ActionTransition) {
                    edges.push(this.renderActionEdge(src, target, this.getEdgeLabel(edge.toString()), arrowhead,
                        transitionIndex));
                } else if (edge instanceof AbstractPredicateTransition) {
                    edges.push(this.renderEdge(src, transitionIndex, target, this.getEdgeLabel(edge.toString()),
                        arrowhead));
                } else if (edge.isEpsilon) {
                    let loopback = false;
                    if (edge.target instanceof PlusBlockStartState) {
                        loopback = s.equals((edge.target).loopBackState);
                    } else if (edge.target instanceof StarLoopEntryState) {
                        loopback = s.equals((edge.target).loopBackState);
                    }

                    edges.push(this.renderEpsilonEdge(src, this.getEdgeLabel(edge.toString()), target, arrowhead,
                        transitionIndex, loopback));
                } else if (edge instanceof AtomTransition) {
                    let label = edge.labelValue.toString();
                    if (isLexer) {
                        if (edge.labelValue === Token.EOF) {
                            label = "EOF";
                        } else {
                            label = "'" + this.getEdgeLabel(String.fromCodePoint(edge.labelValue)) + "'";
                        }
                    } else {
                        label = this.grammar.getTokenDisplayName(edge.labelValue)!;
                    }

                    edges.push(this.renderEdge(src, transitionIndex, target, label, arrowhead));
                } else if (edge instanceof SetTransition) {
                    let label = edge.label.toString();
                    if (isLexer) {
                        label = edge.label.toString(true);
                    } else {
                        label = edge.label.toStringWithVocabulary(this.grammar.getVocabulary());
                    }

                    if (edge instanceof NotSetTransition) {
                        label = "~" + label;
                    }

                    edges.push(this.renderEdge(src, transitionIndex, target, this.getEdgeLabel(label), arrowhead));
                } else if (edge instanceof RangeTransition) {
                    let label = edge.label.toString();
                    if (isLexer) {
                        label = edge.toString();
                    } else {
                        label = edge.label.toStringWithVocabulary(this.grammar.getVocabulary());
                    }

                    edges.push(this.renderEdge(src, transitionIndex, target, label, arrowhead));
                } else {
                    edges.push(this.renderEdge(src, transitionIndex, target, this.getEdgeLabel(edge.toString()),
                        arrowhead));
                }

                work.push(edge.target);
            }
        }

        const states: string[] = [];
        for (const s of markedStates) {
            if (!(s instanceof RuleStopState)) {
                continue;
            }

            states.push(this.renderStopState(this.getStateLabel(s), `s${s.stateNumber}`));
        }

        for (const s of markedStates) {
            if (s instanceof RuleStopState) {
                continue;
            }

            states.push(this.renderState(this.getStateLabel(s), `s${s.stateNumber}`, s.transitions));
        }

        return this.renderAtn(states, edges);
    }

    private getStateLabel(s: DFAState | ATNState): string {
        if (s instanceof DFAState) {
            let buf = `s${s.stateNumber}`;

            if (s.isAcceptState) {
                buf += `=>${s.prediction}`;
            }

            if (s.requiresFullContext) {
                buf += "^";
            }

            const alts = s.getAltSet();
            if (alts !== null) {
                buf += "\\n";
                // Separate alts.
                const altList = Array.from(alts);
                altList.sort();
                const configurations = s.configs;
                for (let altIndex = 0; altIndex < altList.length; altIndex++) {
                    const alt = altList[altIndex];
                    if (altIndex > 0) {
                        buf += "\\n";
                    }
                    buf += `alt${alt}:`;

                    // Get a list of configs for just this alt it will help us print better later.
                    const configsInAlt = new Array<ATNConfig>();
                    for (const c of configurations) {
                        if (c.alt !== alt) {
                            continue;
                        }

                        configsInAlt.push(c);
                    }

                    let n = 0;
                    for (let cIndex = 0; cIndex < configsInAlt.length; cIndex++) {
                        const c = configsInAlt[cIndex];
                        ++n;
                        buf += c.toString(null, false);
                        if ((cIndex + 1) < configsInAlt.length) {
                            buf += ", ";
                        }

                        if (n % 5 === 0 && (configsInAlt.length - cIndex) > 3) {
                            buf += "\\n";
                        }
                    }
                }
            }

            return buf;
        } else {
            let stateLabel = "";

            if (s instanceof BlockStartState) {
                stateLabel += "&rarr;\\n";
            } else if (s instanceof BlockEndState) {
                stateLabel += "&larr;\\n";
            }

            stateLabel += s.stateNumber.toString();
            if (s instanceof PlusBlockStartState || s instanceof PlusLoopbackState) {
                stateLabel += "+";
            } else if (s instanceof StarBlockStartState
                || s instanceof StarLoopEntryState
                || s instanceof StarLoopbackState) {
                stateLabel += "*";
            }

            if (s instanceof DecisionState && s.decision >= 0) {
                stateLabel += `\\nd=${s.decision}`;
            }

            return stateLabel;
        }
    }

    /**
     * Fixes edge strings so they print out in DOT properly.
     */
    private getEdgeLabel(label: string): string {
        label = label.replaceAll("\\", "\\\\");
        label = label.replaceAll('"', '\\"');
        label = label.replaceAll("\n", String.raw`\\\n`);
        label = label.replaceAll("\r", "");

        return label;
    }

    private renderAtn(states: string[], edges: string[]): string {
        const lines = [
            `digraph ATN {`,
            `rankdir=LR;`,
            ...states,
            ...edges,
            `}`,
        ];

        return lines.join("\n");
    }

    private renderDfa(name: string, rankdir: string, states: ATNState[], edges: string[]): string {
        const lines = [
            `digraph ${name} {`,
            `rankdir=${rankdir};`,
            ...states,
            ...edges,
            `}`,
        ];

        return lines.join("\n");
    }

    private renderState(label: string, name: string, transitions: Transition[]): string {
        let result = `${name}[fontsize = 11, label="`;

        if (transitions.length > 1) {
            result += `{${label}|`;

            const transitionsWithIndex = transitions.map((t, i) => {
                return `<p${i}>`;
            });
            result += `{${transitionsWithIndex.join("|")}}}`;
        } else {
            result += label;
        }
        result += `"`;

        if (transitions.length > 1) {
            result += `, shape=record, fixedsize=false`;
        } else {
            result += `, shape=circle, fixedsize=true, width=.55`;
        }

        result += `, peripheries=1];`;

        return result;
    }

    private renderStopState(label: string, name: string, actionIndex = -1, useBox = false): string {
        let result = `${name}[fontsize = 11, label="${label}`;

        if (actionIndex >= 0) {
            result += `\naction:${actionIndex}`;
        }
        result += `", `;

        if (useBox) {
            result += `shape=polygon,sides=4,peripheries=2,fixedsize=false`;
        } else {
            result += `shape=doublecircle, fixedsize=true, width=.6`;
        }
        result += `];`;

        return result;
    }

    private renderEdge(src: string, transitionIndex: number, target: string, label: string, arrowHead: string): string {
        let result = src;

        if (transitionIndex >= 0) {
            result += `:p${transitionIndex}`;
        }

        result += ` -> ${target} [fontsize=11, fontname="Courier", arrowsize=.7, label = "${label}"`;

        if (arrowHead) {
            result += `, arrowhead = ${arrowHead}`;
        }

        result += "];";

        return result;
    }

    private renderActionEdge(src: string, target: string, label: string, arrowHead: string,
        transitionIndex: number): string {
        let result = src;

        if (transitionIndex >= 0) {
            result += `:p${transitionIndex}`;
        }

        result += ` -> ${target} [fontsize=11, fontname="Courier", arrowsize=.7, label = "${label}"`;

        if (arrowHead) {
            result += `, arrowhead = ${arrowHead}`;
        }

        result += "];";

        return result;
    }

    private renderEpsilonEdge(src: string, label: string, target: string, arrowHead: string, transitionIndex: number,
        loopback = false): string {
        let result = src;

        if (transitionIndex >= 0) {
            result += `:p${transitionIndex}`;
        }

        result += ` -> ${target} [fontname="Times-Italic", label="&epsilon;"`;

        if (loopback) {
            result += ` -> , style="dashed"`;
        }

        result += "];";

        return result;
    }
};
