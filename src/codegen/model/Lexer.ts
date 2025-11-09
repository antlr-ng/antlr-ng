/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import type { LexerGrammar } from "../../tool/LexerGrammar.js";
import type { Rule } from "../../tool/Rule.js";
import type { IOutputModelFactory } from "../IOutputModelFactory.js";
import type { LexerFile } from "./LexerFile.js";
import { Recognizer } from "./Recognizer.js";
import type { RuleActionFunction } from "./RuleActionFunction.js";

export class Lexer extends Recognizer {
    public readonly channelNames: string[] = [];
    public readonly escapedChannels = new Map<string, number>();
    public readonly file: LexerFile;
    public readonly modes: string[];
    public readonly escapedModeNames: string[] = [];

    public actionFuncs = new Map<Rule, RuleActionFunction>();

    public constructor(factory: IOutputModelFactory, file: LexerFile) {
        super(factory);
        this.file = file; // who contains us?

        const target = factory.getGenerator()!.targetGenerator;

        for (const [key, value] of factory.grammar.channelNameToValueMap) {
            this.escapedChannels.set(target.escapeIfNeeded(key), value);
            this.channelNames.push(key);
        }

        this.modes = Array.from((factory.grammar as LexerGrammar).modes.keys());
        for (const mode of this.modes) {
            this.escapedModeNames.push(target.escapeIfNeeded(mode));
        }
    }

}
