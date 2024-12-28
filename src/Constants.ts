/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { Token } from "antlr4ng";

import { AttributeDict } from "./tool/AttributeDict.js";
import { DictType } from "./tool/DictType.js";

/**
 * Various constant value that were scattered all over the place. Collect them here to minimize circular dependencies.
 */

export class Constants {
    public static readonly DEFAULT_MODE_NAME = "DEFAULT_MODE";

    public static readonly PRECEDENCE_OPTION_NAME = "p";
    public static readonly TOKENINDEX_OPTION_NAME = "tokenIndex";

    public static readonly VOCAB_FILE_EXTENSION = ".tokens";

    public static readonly GRAMMAR_FROM_STRING_NAME = "<string>";

    public static readonly EOR_TOKEN_TYPE = 1;
    public static readonly DOWN = 2;
    public static readonly UP = 3;

    public static readonly MEMO_RULE_FAILED = -2;
    public static readonly MEMO_RULE_UNKNOWN = -1;

    // copies from Token object for convenience in actions
    public static readonly DEFAULT_TOKEN_CHANNEL = Token.DEFAULT_CHANNEL;
    public static readonly HIDDEN = Token.HIDDEN_CHANNEL;

    public static readonly NEXT_TOKEN_RULE_NAME = "nextToken";

    /**
     * Rule refs have a predefined set of attributes as well as the return values and args.
     *
     * These must be consistent with ActionTranslator.rulePropToModelMap, ...
     */
    public static readonly predefinedRulePropertiesDict = new AttributeDict(DictType.PredefinedRule);

    /**
     * All {@link Token} scopes (token labels) share the same fixed scope of
     * of predefined attributes.  I keep this out of the {@link Token}
     * interface to avoid a runtime type leakage.
     */
    public static readonly predefinedTokenDict = new AttributeDict(DictType.Token);

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
