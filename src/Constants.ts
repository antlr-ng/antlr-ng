/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Lexer } from "antlr4ng";

import { DictType } from "./misc/types.js";
import { AttributeDict } from "./tool/AttributeDict.js";

/**
 * Various constant value that were scattered all over the place. Collect them here to minimize circular dependencies.
 */
export class Constants {
    public static readonly DefaultNodeName = "DEFAULT_MODE";

    public static readonly PrecedenceOptionName = "p";
    public static readonly TokenIndexOptionName = "tokenIndex";

    public static readonly VocabFileExtension = ".tokens";

    public static readonly GrammarFromStringName = "<string>";

    public static readonly EorTokenType = 1;
    public static readonly Down = 2;
    public static readonly Up = 3;

    /**
     * Rule refs have a predefined set of attributes as well as the return values and args.
     *
     * These must be consistent with ActionTranslator.rulePropToModelMap, ...
     */
    public static readonly predefinedRulePropertiesDict = new AttributeDict(DictType.PredefinedRule);

    /**
     * All {@link Token} scopes (token labels) share the same fixed scope of of predefined attributes. I keep this
     * out of the {@link Token} interface to avoid a runtime type leakage.
     */
    public static readonly predefinedTokenDict = new AttributeDict(DictType.Token);

    /**
     * Provides a map of names of predefined constants which are likely to appear as the argument for lexer commands.
     * These names are required during code generation for creating {@link LexerAction} instances that are usable
     * by a lexer interpreter.
     */
    public static readonly COMMON_CONSTANTS = new Map<string, number>([
        ["HIDDEN", Lexer.HIDDEN],
        ["DEFAULT_TOKEN_CHANNEL", Lexer.DEFAULT_TOKEN_CHANNEL],
        ["DEFAULT_MODE", Lexer.DEFAULT_MODE],
        ["SKIP", Lexer.SKIP],
        ["MORE", Lexer.MORE],
        ["EOF", Lexer.EOF],
        //["MAX_CHAR_VALUE", Lexer.MAX_CHAR_VALUE], // TODO: are these constants needed?
        //["MIN_CHAR_VALUE", Lexer.MIN_CHAR_VALUE],
        ["MAX_CHAR_VALUE", 0x1FFFF],
        ["MIN_CHAR_VALUE", 0],
    ]);

    static {
        Constants.predefinedRulePropertiesDict.add({ name: "parser" });
        Constants.predefinedRulePropertiesDict.add({ name: "text" });
        Constants.predefinedRulePropertiesDict.add({ name: "start" });
        Constants.predefinedRulePropertiesDict.add({ name: "stop" });
        Constants.predefinedRulePropertiesDict.add({ name: "ctx" });

        Constants.predefinedTokenDict.add({ name: "text" });
        Constants.predefinedTokenDict.add({ name: "type" });
        Constants.predefinedTokenDict.add({ name: "line" });
        Constants.predefinedTokenDict.add({ name: "index" });
        Constants.predefinedTokenDict.add({ name: "pos" });
        Constants.predefinedTokenDict.add({ name: "channel" });
        Constants.predefinedTokenDict.add({ name: "int" });
    }
}
