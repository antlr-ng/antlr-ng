/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

export const enum IssueSeverity {
    Warning,
    WarningOneOff,
    Error,
    ErrorOneOff,
    Fatal,
}

export const severityMap = new Map<IssueSeverity, string>([
    [IssueSeverity.Warning, "warning"],
    [IssueSeverity.WarningOneOff, "warning"],
    [IssueSeverity.Error, "error"],
    [IssueSeverity.ErrorOneOff, "error"],
    [IssueSeverity.Fatal, "fatal"],
]);

export enum IssueCode {
    NoGrammarsFound,
    CannotWriteFile,
    InvalidCmdlineArg,
    CannotFindTokensFile,
    ErrorReadingTokensFile,
    DirNotFound,
    OutputDirIsFIle,
    CannotOpenFile,
    FileAndGrammarNameDiffer,
    BadOptionSetSyntax,
    WarningTreatedAsErrors,
    ErrorReadingImportedGrammar,
    InternalError,
    TokensFileSyntaxError,

    // Code generation errors.

    IncompatibleToolAndTemplates,

    // Grammar errors.

    SyntaxError,
    RuleRedefinition,
    LexerRulesNotAllowed,
    ParserRuleNotAllowed,
    RepeatedPrequel,
    UndefinedRuleRef,
    UndefinedRuleInNonlocalRef,
    TokenNamesMustStartUpper,
    UnknownSimpleAttribute,
    InvalidRuleParameterRef,
    UnknownRuleAttribute,
    UnknownAtrributeInScopoe,
    IsolatedRuleRef,
    LabelConflictsWithRule,
    LabelConflictsWithToken,
    LabelConflictsWithArg,
    LabelConflictsWithRetval,
    LabelConflictsWithLocal,
    LabelTypeConflict,
    RetValueConflictsWithArg,
    MissingRuleArgs,
    RuleHasNoArgs,
    IllegalOption,
    IllegalOptionValue,
    ActionRedefinition,
    NoRules,
    NoSuchGrammarScope,
    NoSuchRuleInScope,
    TokenNameReassignment,
    OptionsInDelegate,
    CannotFindImportedGrammar,
    InvalidImport,
    ImportNameClash,
    CannotFindTokensFileRefdInGrammar,
    LeftRecursionCycles,
    ModeNotInLexer,
    CannotFindAttributeNameInDecl,
    RuleWithTooFewAltLabels,
    AltLabelRedef,
    AltLabelConflictsWithRule,
    ImplicitTokenDefinition,
    ImplicitStringDefinition,
    AttributeInLexerAction,
    LabelBlockNotASet,
    ExpectedNonGreedyWildcardBlock,
    LexerCommandPlacementIssue,
    UnsupportedReferenceInLexerSet,
    AssignmentToListLabel,
    RetvalConflictsWithRule,
    RetvalConflictsWithToken,
    ArgConflictsWithRule,
    ArgConflictsWithToken,
    LocalConflictsWithRule,
    LocalConflictsWithToken,
    LocalConflictsWithArg,
    LocalConflictsWithRetval,
    InvalidLiteralInLexerSet,
    ModeWithoutRules,
    EpsilonToken,
    NoNonLrAlts,
    EpsilonLrFollow,
    InvalidLexerCommand,
    MisingLexerCommandArgument,
    UnwantedLexerCommandArgument,
    UnterminatedStringLiteral,
    EpsilonClosure,
    EpsilonOptional,
    UnknownLexerConstant,
    InvalidEscapeSequence,
    UnrecognizedAsscoOption,
    FragmentActionIgnored,
    ReservedRuleName,
    ParserRuleRefInLexerRule,
    ChannelConflictsWithToken,
    ChannelConflictsWithMode,
    ChannelsBlockInParserGrammar,
    ChannelsBlockInCombinedGrammar,
    NonconformingLrRule,
    ModeConflictsWithToken,
    TokenConflictsWithCommonConstants,
    ChannelConflictsWithCommonConstants,
    ModeConflictsWithCommonConstants,
    EmptyStringAndSetsNotAllowed,
    ConstantValueIsNotARecognizedTokenName,
    ConstantValueIsNotARecognizedModeName,
    ConstantValueIsNotARecognizedChannelName,
    DuplicatedCommand,
    IncompatibleCommands,
    CharactersCollisionInSet,
    TplemjRangeInParser,
    UnicodePropertyNotAllowedInRange,
    TokenUnreachable,
    RangeProbablyContainsNotImpliedCharacter,
    EofClosure,
    RedundantCaseInsensitiveLexerRuleOption,
}

export interface IssueDetails {
    message: string;
    verboseMessage?: string;
    severity: IssueSeverity;
}

/**
 * A map of all issues that can be reported by the antlr-ng tool.
 * Some messages contain arguments, which are replaced by the actual values when the message is rendered.
 * The `<arg>`, `<arg2>` and `<arg3>` placeholders are used to indicate where the main arguments should be placed.
 * There can be up to two additional arguments (`<exception>` and `<stackTrace>`) which are used for verbose messages.
 */
export const issueTypes = new Map<IssueCode, IssueDetails>([
    [IssueCode.NoGrammarsFound, {
        message: "no grammars found",
        severity: IssueSeverity.Fatal
    }],
    [IssueCode.CannotWriteFile, {
        message: "cannot write file <arg>: <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.InvalidCmdlineArg, {
        message: "unknown command-line option <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.CannotFindTokensFile, {
        message: "cannot find tokens file <arg> given for <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ErrorReadingTokensFile, {
        message: "error reading tokens file <arg>: <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.DirNotFound, {
        message: "directory not found: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.OutputDirIsFIle, {
        message: "output directory is a file: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.CannotOpenFile, {
        message: "cannot find or open file: <arg>",
        verboseMessage: "cannot find or open file: <arg>; reason: <exception>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.FileAndGrammarNameDiffer, {
        message: "grammar name <arg> and file name <arg2> differ",
        severity: IssueSeverity.Error
    }],
    [IssueCode.BadOptionSetSyntax, {
        message: "invalid -Dname=value syntax: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.WarningTreatedAsErrors, {
        message: "warning treated as error",
        severity: IssueSeverity.ErrorOneOff
    }],
    [IssueCode.ErrorReadingImportedGrammar, {
        message: "error reading imported grammar <arg> referenced in <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.InternalError, {
        message: "internal error: <arg> <arg2>",
        verboseMessage: "internal error: <arg> <arg2>: <exception><stackTrace>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.TokensFileSyntaxError, {
        message: ".tokens file syntax error <arg>:<arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.IncompatibleToolAndTemplates, {
        message: "<arg3> code generation target requires antlr-ng <arg2>; it can't be loaded by the current " +
            "antlr-ng <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.SyntaxError, {
        message: "syntax error: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RuleRedefinition, {
        message: "rule <arg> redefinition; previous at line <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LexerRulesNotAllowed, {
        message: "lexer rule <arg> not allowed in parser",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ParserRuleNotAllowed, {
        message: "parser rule <arg> not allowed in lexer",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RepeatedPrequel, {
        message: "repeated grammar prequel spec (options, tokens, or import); please merge",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UndefinedRuleRef, {
        message: "reference to undefined rule: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UndefinedRuleInNonlocalRef, {
        message: "reference to undefined rule <arg> in non-local ref <arg3>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.TokenNamesMustStartUpper, {
        message: "token names must start with an uppercase letter: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnknownSimpleAttribute, {
        message: "unknown attribute reference <arg> in <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.InvalidRuleParameterRef, {
        message: "parameter <arg> of rule <arg2> is not accessible in this scope: <arg3>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnknownRuleAttribute, {
        message: "unknown attribute <arg> for rule <arg2> in <arg3>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnknownAtrributeInScopoe, {
        message: "attribute <arg> isn't a valid property in <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.IsolatedRuleRef, {
        message: "missing attribute access on rule reference <arg> in <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LabelConflictsWithRule, {
        message: "label <arg> conflicts with rule with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LabelConflictsWithToken, {
        message: "label <arg> conflicts with token with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LabelConflictsWithArg, {
        message: "label <arg> conflicts with parameter with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LabelConflictsWithRetval, {
        message: "label <arg> conflicts with return value with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LabelConflictsWithLocal, {
        message: "label <arg> conflicts with local with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LabelTypeConflict, {
        message: "label <arg> type mismatch with previous definition: <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RetValueConflictsWithArg, {
        message: "return value <arg> conflicts with parameter with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.MissingRuleArgs, {
        message: "missing argument(s) on rule reference: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RuleHasNoArgs, {
        message: "rule <arg> has no defined parameters",
        severity: IssueSeverity.Error
    }],
    [IssueCode.IllegalOption, {
        message: "unsupported option <arg>",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.IllegalOptionValue, {
        message: "unsupported option value <arg>=<arg2>",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.ActionRedefinition, {
        message: "redefinition of <arg> action",
        severity: IssueSeverity.Error
    }],
    [IssueCode.NoRules, {
        message: "grammar <arg> has no rules",
        verboseMessage: "implicitly generated grammar <arg> has no rules",
        severity: IssueSeverity.Error
    }],
    [IssueCode.NoSuchGrammarScope, {
        message: "reference to undefined grammar in rule reference: <arg>.<arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.NoSuchRuleInScope, {
        message: "rule <arg2> is not defined in grammar <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.TokenNameReassignment, {
        message: "token name <arg> is already defined",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.OptionsInDelegate, {
        message: "options ignored in imported grammar <arg>",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.CannotFindImportedGrammar, {
        message: "can't find or load grammar <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.InvalidImport, {
        message: "<arg.typeString> grammar <arg.name> cannot import <arg2.typeString> grammar <arg2.name>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ImportNameClash, {
        message: "<arg.typeString> grammar <arg.name> and imported <arg2.typeString> grammar <arg2.name> " +
            "both generate <arg2.recognizerName>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.CannotFindTokensFileRefdInGrammar, {
        message: "cannot find tokens file <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LeftRecursionCycles, {
        message: "The following sets of rules are mutually left-recursive <arg:{c| [<c:{r|<r.name>}; " +
            "separator=\", \">]}; separator=\" and \">",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ModeNotInLexer, {
        message: "lexical modes are only allowed in lexer grammars",
        severity: IssueSeverity.Error
    }],
    [IssueCode.CannotFindAttributeNameInDecl, {
        message: "cannot find an attribute name in attribute declaration",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RuleWithTooFewAltLabels, {
        message: "rule <arg>: must label all alternatives or none",
        severity: IssueSeverity.Error
    }],
    [IssueCode.AltLabelRedef, {
        message: "rule alt label <arg> redefined in rule <arg2>, originally in rule <arg3>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.AltLabelConflictsWithRule, {
        message: "rule alt label <arg> conflicts with rule <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ImplicitTokenDefinition, {
        message: "implicit definition of token <arg> in parser",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.ImplicitStringDefinition, {
        message: "cannot create implicit token for string literal in non-combined grammar: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.AttributeInLexerAction, {
        message: "attribute references not allowed in lexer actions: $<arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LabelBlockNotASet, {
        message: "label <arg> assigned to a block which is not a set",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ExpectedNonGreedyWildcardBlock, {
        message: "greedy block ()<arg> contains wildcard; the non-greedy syntax ()<arg>? may be preferred",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.LexerCommandPlacementIssue, {
        message: "->command in lexer rule <arg> must be last element of single outermost alt",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnsupportedReferenceInLexerSet, {
        message: "rule reference <arg> is not currently supported in a set",
        severity: IssueSeverity.Error
    }],
    [IssueCode.AssignmentToListLabel, {
        message: "cannot assign a value to list label <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RetvalConflictsWithRule, {
        message: "return value <arg> conflicts with rule with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RetvalConflictsWithToken, {
        message: "return value <arg> conflicts with token with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ArgConflictsWithRule, {
        message: "parameter <arg> conflicts with rule with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ArgConflictsWithToken, {
        message: "parameter <arg> conflicts with token with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LocalConflictsWithRule, {
        message: "local <arg> conflicts with rule with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LocalConflictsWithToken, {
        message: "local <arg> conflicts with rule token same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LocalConflictsWithArg, {
        message: "local <arg> conflicts with parameter with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.LocalConflictsWithRetval, {
        message: "local <arg> conflicts with return value with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.InvalidLiteralInLexerSet, {
        message: "multi-character literals are not allowed in lexer sets: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ModeWithoutRules, {
        message: "lexer mode <arg> must contain at least one non-fragment rule",
        severity: IssueSeverity.Error
    }],
    [IssueCode.EpsilonToken, {
        message: "non-fragment lexer rule <arg> can match the empty string",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.NoNonLrAlts, {
        message: "left recursive rule <arg> must contain an alternative which is not left recursive",
        severity: IssueSeverity.Error
    }],
    [IssueCode.EpsilonLrFollow, {
        message: "left recursive rule <arg> contains a left recursive alternative which can be followed " +
            "by the empty string",
        severity: IssueSeverity.Error
    }],
    [IssueCode.InvalidLexerCommand, {
        message: "lexer command <arg> does not exist or is not supported by the current target",
        severity: IssueSeverity.Error
    }],
    [IssueCode.MisingLexerCommandArgument, {
        message: "missing argument for lexer command <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnwantedLexerCommandArgument, {
        message: "lexer command <arg> does not take any arguments",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnterminatedStringLiteral, {
        message: "unterminated string literal",
        severity: IssueSeverity.Error
    }],
    [IssueCode.EpsilonClosure, {
        message: "rule <arg> contains a closure with at least one alternative that can match an empty string",
        severity: IssueSeverity.Error
    }],
    [IssueCode.EpsilonOptional, {
        message: "rule <arg> contains an optional block with at least one alternative that can match " +
            "an empty string",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.UnknownLexerConstant, {
        message: "rule <arg> contains a lexer command with an unrecognized constant value; lexer " +
            "interpreters may produce incorrect output",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.InvalidEscapeSequence, {
        message: "invalid escape sequence <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnrecognizedAsscoOption, {
        message: "rule <arg> contains an assoc terminal option in an unrecognized location",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.FragmentActionIgnored, {
        message: "fragment rule <arg> contains an action or command which can never be executed",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.ReservedRuleName, {
        message: "cannot declare a rule with reserved name <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ParserRuleRefInLexerRule, {
        message: "reference to parser rule <arg> in lexer rule <arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ChannelConflictsWithToken, {
        message: "channel <arg> conflicts with token with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ChannelConflictsWithMode, {
        message: "channel <arg> conflicts with mode with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ChannelsBlockInParserGrammar, {
        message: "custom channels are not supported in parser grammars",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ChannelsBlockInCombinedGrammar, {
        message: "custom channels are not supported in combined grammars",
        severity: IssueSeverity.Error
    }],
    [IssueCode.NonconformingLrRule, {
        message: "rule <arg> is left recursive but doesn't conform to a pattern ANTLR can handle",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ModeConflictsWithToken, {
        message: "mode <arg> conflicts with token with same name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.TokenConflictsWithCommonConstants, {
        message: "cannot use or declare token with reserved name <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ChannelConflictsWithCommonConstants, {
        message: "cannot use or declare channel with reserved name <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ModeConflictsWithCommonConstants, {
        message: "cannot use or declare mode with reserved name <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.EmptyStringAndSetsNotAllowed, {
        message: "string literals and sets cannot be empty: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ConstantValueIsNotARecognizedTokenName, {
        message: "<arg> is not a recognized token name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ConstantValueIsNotARecognizedModeName, {
        message: "<arg> is not a recognized mode name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.ConstantValueIsNotARecognizedChannelName, {
        message: "<arg> is not a recognized channel name",
        severity: IssueSeverity.Error
    }],
    [IssueCode.DuplicatedCommand, {
        message: "duplicated command <arg>",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.IncompatibleCommands, {
        message: "incompatible commands <arg> and <arg2>",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.CharactersCollisionInSet, {
        message: "chars <arg> used multiple times in set <arg2>",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.TplemjRangeInParser, {
        message: "token ranges not allowed in parser: <arg>..<arg2>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.UnicodePropertyNotAllowedInRange, {
        message: "unicode property escapes not allowed in lexer charset range: <arg>",
        severity: IssueSeverity.Error
    }],
    [IssueCode.TokenUnreachable, {
        message: "One of the token <arg> values unreachable. <arg2> is always overlapped by token <arg3>",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.RangeProbablyContainsNotImpliedCharacter, {
        message: "Range <arg>..<arg2> probably contains not implied characters <arg3>. Both bounds should " +
            "be defined in lower or UPPER case",
        severity: IssueSeverity.Warning
    }],
    [IssueCode.EofClosure, {
        message: "rule <arg> contains a closure with at least one alternative that can match EOF",
        severity: IssueSeverity.Error
    }],
    [IssueCode.RedundantCaseInsensitiveLexerRuleOption, {
        message: "caseInsensitive lexer rule option is redundant because its value equals to global value (<arg>)",
        severity: IssueSeverity.Warning
    }],
]);
