/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

// cspell: ignore Dname

import { antlrVersion } from "../tool-parameters.js";
import { ErrorSeverity } from "./ErrorSeverity.js";

export class ErrorType {
    public static readonly NO_GRAMMARS_FOUND = new ErrorType(0, "no grammars found\n",
        ErrorSeverity.Fatal, "NO_GRAMMARS_FOUND");

    /**
     * Compiler Error 1.
     *
     * > cannot write file `filename`: `reason`
     */
    public static readonly CANNOT_WRITE_FILE = new ErrorType(1, "cannot write file <arg>: <arg2>",
        ErrorSeverity.Error, "CANNOT_WRITE_FILE");

    /**
     * Compiler Error 2.
     *
     * > unknown command-line option `option`
     */
    public static readonly INVALID_CMDLINE_ARG = new ErrorType(2, "unknown command-line option <arg>",
        ErrorSeverity.Error, "INVALID_CMDLINE_ARG");

    /**
     * Compiler Error 3.
     *
     * > cannot find tokens file `filename`
     */
    public static readonly CANNOT_FIND_TOKENS_FILE_GIVEN_ON_CMDLINE =
        new ErrorType(3, "cannot find tokens file <arg> given for <arg2>",
            ErrorSeverity.Error, "CANNOT_FIND_TOKENS_FILE_GIVEN_ON_CMDLINE");

    /**
     * Compiler Error 4.
     *
     * > cannot find tokens file `filename`: `reason`
     */
    public static readonly ERROR_READING_TOKENS_FILE =
        new ErrorType(4, "error reading tokens file <arg>: <arg2>",
            ErrorSeverity.Error, "ERROR_READING_TOKENS_FILE");

    /**
     * Compiler Error 5.
     *
     * > directory not found: `directory`
     */
    public static readonly DIR_NOT_FOUND =
        new ErrorType(5, "directory not found: <arg>",
            ErrorSeverity.Error, "DIR_NOT_FOUND");

    /**
     * Compiler Error 6.
     *
     * > output directory is a file: `filename`
     */
    public static readonly OUTPUT_DIR_IS_FILE =
        new ErrorType(6, "output directory is a file: <arg>",
            ErrorSeverity.Error, "OUTPUT_DIR_IS_FILE");

    /**
     * Compiler Error 7.
     *
     * > cannot find or open file: `filename`
     */
    public static readonly CANNOT_OPEN_FILE =
        new ErrorType(7, "cannot find or open file: <arg><if(exception&&verbose)>; reason: <exception><endif>",
            ErrorSeverity.Error, "CANNOT_OPEN_FILE");

    /**
     * Compiler Error 8.
     *
     * >
     * grammar name `name` and file name `filename` differ
     */
    public static readonly FILE_AND_GRAMMAR_NAME_DIFFER =
        new ErrorType(8, "grammar name <arg> and file name <arg2> differ",
            ErrorSeverity.Error, "FILE_AND_GRAMMAR_NAME_DIFFER");

    /**
     * Compiler Error 9.
     *
     * > invalid {@code -Dname=value} syntax: `syntax`
     */
    public static readonly BAD_OPTION_SET_SYNTAX =
        new ErrorType(9, "invalid -Dname=value syntax: <arg>",
            ErrorSeverity.Error, "BAD_OPTION_SET_SYNTAX");

    /**
     * Compiler Error 10.
     *
     * > warning treated as error
     */
    public static readonly WARNING_TREATED_AS_ERROR =
        new ErrorType(10, "warning treated as error",
            ErrorSeverity.ErrorOneOff, "WARNING_TREATED_AS_ERROR");

    /**
     * Compiler Error 11.
     *
     * > cannot find tokens file `filename`: `reason`
     */
    public static readonly ERROR_READING_IMPORTED_GRAMMAR =
        new ErrorType(11, "error reading imported grammar <arg> referenced in <arg2>",
            ErrorSeverity.Error, "ERROR_READING_IMPORTED_GRAMMAR");

    /**
     * Compiler Error 20.
     *
     * > internal error: `message`
     */
    public static readonly INTERNAL_ERROR =
        new ErrorType(20, "internal error: <arg> <arg2><if(exception&&verbose)>: <exception><stackTrace; " +
            "separator=\"\\n\"><endif>", ErrorSeverity.Error, "INTERNAL_ERROR");

    /**
     * Compiler Error 21.
     *
     * > .tokens file syntax error `filename`: `message`
     */
    public static readonly TOKENS_FILE_SYNTAX_ERROR =
        new ErrorType(21, ".tokens file syntax error <arg>:<arg2>",
            ErrorSeverity.Error, "TOKENS_FILE_SYNTAX_ERROR");

    /**
     * Compiler Warning 22.
     *
     * > template error: `message`
     */
    public static readonly STRING_TEMPLATE_WARNING =
        new ErrorType(22, "template error: <arg> <arg2><if(exception&&verbose)>: <exception><stackTrace; " +
            "separator=\"\\n\"><endif>", ErrorSeverity.Warning, "STRING_TEMPLATE_WARNING");

    /*
     * Code generation errors
     */

    /**
     * Compiler Error 30.
     *
     * > can't find code generation templates: `group`
     */
    public static readonly MISSING_CODE_GEN_TEMPLATES =
        new ErrorType(30, "can't find code generation templates: <arg>",
            ErrorSeverity.Error, "MISSING_CODE_GEN_TEMPLATES");

    /**
     * Compiler Error 31.
     *
     * >
     * ANTLR cannot generate `language` code as of version
     * `version`
     */
    public static readonly CANNOT_CREATE_TARGET_GENERATOR =
        new ErrorType(31, "ANTLR cannot generate <arg> code as of version " + antlrVersion,
            ErrorSeverity.ErrorOneOff, "CANNOT_CREATE_TARGET_GENERATOR");

    /**
     * Compiler Error 32.
     *
     * >
     * code generation template `template` has missing, misnamed, or
     * incomplete arg list; missing `field`
     */
    public static readonly CODE_TEMPLATE_ARG_ISSUE =
        new ErrorType(32, "code generation template <arg> has missing, misnamed, or incomplete arg list; " +
            "missing <arg2>", ErrorSeverity.Error, "CODE_TEMPLATE_ARG_ISSUE");

    /**
     * Compiler Error 33.
     *
     * > missing code generation template `template`
     */
    public static readonly CODE_GEN_TEMPLATES_INCOMPLETE =
        new ErrorType(33, "missing code generation template <arg>",
            ErrorSeverity.Error, "CODE_GEN_TEMPLATES_INCOMPLETE");

    /**
     * Compiler Error 34.
     *
     * >
     * no mapping to template name for output model class `class`
     */
    public static readonly NO_MODEL_TO_TEMPLATE_MAPPING =
        new ErrorType(34, "no mapping to template name for output model class <arg>",
            ErrorSeverity.Error, "NO_MODEL_TO_TEMPLATE_MAPPING");

    /**
     * Compiler Error 35.
     *
     * > templates/target and tool aren't compatible
     */
    public static readonly INCOMPATIBLE_TOOL_AND_TEMPLATES =
        new ErrorType(35, "<arg3> code generation target requires ANTLR <arg2>; it can't be loaded by the current " +
            "ANTLR <arg>", ErrorSeverity.Error, "INCOMPATIBLE_TOOL_AND_TEMPLATES");

    /*
     * Grammar errors
     */

    /**
     * Compiler Error 50.
     *
     * > syntax error: `message`
     */
    public static readonly SYNTAX_ERROR =
        new ErrorType(50, "syntax error: <arg>",
            ErrorSeverity.Error, "SYNTAX_ERROR");

    /**
     * Compiler Error 51.
     *
     * > rule `rule` redefinition; previous at line `line`
     */
    public static readonly RULE_REDEFINITION =
        new ErrorType(51, "rule <arg> redefinition; previous at line <arg2>",
            ErrorSeverity.Error, "RULE_REDEFINITION");

    /**
     * Compiler Error 52.
     *
     * > lexer rule `rule` not allowed in parser
     */
    public static readonly LEXER_RULES_NOT_ALLOWED =
        new ErrorType(52, "lexer rule <arg> not allowed in parser",
            ErrorSeverity.Error, "LEXER_RULES_NOT_ALLOWED");

    /**
     * Compiler Error 53.
     *
     * > parser rule `rule` not allowed in lexer
     */
    public static readonly PARSER_RULES_NOT_ALLOWED =
        new ErrorType(53, "parser rule <arg> not allowed in lexer",
            ErrorSeverity.Error, "PARSER_RULES_NOT_ALLOWED");

    /**
     * Compiler Error 54.
     *
     * >
     * repeated grammar prequel spec ({@code options}, {@code tokens}, or
     * {@code import}); please merge
     */
    public static readonly REPEATED_PREQUEL =
        new ErrorType(54, "repeated grammar prequel spec (options, tokens, or import); please merge",
            ErrorSeverity.Error, "REPEATED_PREQUEL");

    /**
     * Compiler Error 56.
     *
     * > reference to undefined rule: `rule`
     *
     * @see PARSER_RULE_REF_IN_LEXER_RULE
     */
    public static readonly UNDEFINED_RULE_REF =
        new ErrorType(56, "reference to undefined rule: <arg>",
            ErrorSeverity.Error, "UNDEFINED_RULE_REF");

    /**
     * Compiler Error 57.
     *
     * > reference to undefined rule `rule` in non-local ref `reference`
     */
    public static readonly UNDEFINED_RULE_IN_NONLOCAL_REF =
        new ErrorType(57, "reference to undefined rule <arg> in non-local ref <arg3>",
            ErrorSeverity.Error, "UNDEFINED_RULE_IN_NONLOCAL_REF");

    /**
     * Compiler Error 60.
     *
     * > token names must start with an uppercase letter: `name`
     */
    public static readonly TOKEN_NAMES_MUST_START_UPPER =
        new ErrorType(60, "token names must start with an uppercase letter: <arg>",
            ErrorSeverity.Error, "TOKEN_NAMES_MUST_START_UPPER");

    /**
     * Compiler Error 63.
     *
     * > unknown attribute reference `attribute` in `expression`
     */
    public static readonly UNKNOWN_SIMPLE_ATTRIBUTE =
        new ErrorType(63, "unknown attribute reference <arg> in <arg2>",
            ErrorSeverity.Error, "UNKNOWN_SIMPLE_ATTRIBUTE");

    /**
     * Compiler Error 64.
     *
     * > parameter `parameter` of rule `rule` is not accessible in this scope: `expression`
     */
    public static readonly INVALID_RULE_PARAMETER_REF =
        new ErrorType(64, "parameter <arg> of rule <arg2> is not accessible in this scope: <arg3>",
            ErrorSeverity.Error, "INVALID_RULE_PARAMETER_REF");

    /**
     * Compiler Error 65.
     *
     * > unknown attribute `attribute` for rule `rule` in `expression`
     */
    public static readonly UNKNOWN_RULE_ATTRIBUTE =
        new ErrorType(65, "unknown attribute <arg> for rule <arg2> in <arg3>",
            ErrorSeverity.Error, "UNKNOWN_RULE_ATTRIBUTE");

    /**
     * Compiler Error 66.
     *
     * > attribute `attribute` isn't a valid property in `expression`
     */
    public static readonly UNKNOWN_ATTRIBUTE_IN_SCOPE =
        new ErrorType(66, "attribute <arg> isn't a valid property in <arg2>",
            ErrorSeverity.Error, "UNKNOWN_ATTRIBUTE_IN_SCOPE");

    /**
     * Compiler Error 67.
     *
     * > missing attribute access on rule reference `rule` in `expression`
     */
    public static readonly ISOLATED_RULE_REF =
        new ErrorType(67, "missing attribute access on rule reference <arg> in <arg2>",
            ErrorSeverity.Error, "ISOLATED_RULE_REF");

    /**
     * Compiler Error 69.
     *
     * > label `label` conflicts with rule with same name
     */
    public static readonly LABEL_CONFLICTS_WITH_RULE =
        new ErrorType(69, "label <arg> conflicts with rule with same name",
            ErrorSeverity.Error, "LABEL_CONFLICTS_WITH_RULE");

    /**
     * Compiler Error 70.
     *
     * > label `label` conflicts with token with same name
     */
    public static readonly LABEL_CONFLICTS_WITH_TOKEN =
        new ErrorType(70, "label <arg> conflicts with token with same name",
            ErrorSeverity.Error, "LABEL_CONFLICTS_WITH_TOKEN");

    /**
     * Compiler Error 72.
     *
     * > label `label` conflicts with parameter with same name
     */
    public static readonly LABEL_CONFLICTS_WITH_ARG =
        new ErrorType(72, "label <arg> conflicts with parameter with same name",
            ErrorSeverity.Error, "LABEL_CONFLICTS_WITH_ARG");

    /**
     * Compiler Error 73.
     *
     * > label `label` conflicts with return value with same name
     */
    public static readonly LABEL_CONFLICTS_WITH_RETVAL =
        new ErrorType(73, "label <arg> conflicts with return value with same name",
            ErrorSeverity.Error, "LABEL_CONFLICTS_WITH_RETVAL");

    /**
     * Compiler Error 74.
     *
     * > label `label` conflicts with local with same name
     */
    public static readonly LABEL_CONFLICTS_WITH_LOCAL =
        new ErrorType(74, "label <arg> conflicts with local with same name",
            ErrorSeverity.Error, "LABEL_CONFLICTS_WITH_LOCAL");

    /**
     * Compiler Error 75.
     *
     * > label `label` type mismatch with previous definition: `message`
     */
    public static readonly LABEL_TYPE_CONFLICT =
        new ErrorType(75, "label <arg> type mismatch with previous definition: <arg2>",
            ErrorSeverity.Error, "LABEL_TYPE_CONFLICT");

    /**
     * Compiler Error 76.
     *
     * > return value `name` conflicts with parameter with same name
     */
    public static readonly RETVAL_CONFLICTS_WITH_ARG =
        new ErrorType(76, "return value <arg> conflicts with parameter with same name",
            ErrorSeverity.Error, "RETVAL_CONFLICTS_WITH_ARG");

    /**
     * Compiler Error 79.
     *
     * > missing argument(s) on rule reference: `rule`
     */
    public static readonly MISSING_RULE_ARGS =
        new ErrorType(79, "missing argument(s) on rule reference: <arg>",
            ErrorSeverity.Error, "MISSING_RULE_ARGS");

    /**
     * Compiler Error 80.
     *
     * > rule `rule` has no defined parameters
     */
    public static readonly RULE_HAS_NO_ARGS =
        new ErrorType(80, "rule <arg> has no defined parameters",
            ErrorSeverity.Error, "RULE_HAS_NO_ARGS");

    /**
     * Compiler Warning 83.
     *
     * > unsupported option `option`
     */
    public static readonly ILLEGAL_OPTION =
        new ErrorType(83, "unsupported option <arg>",
            ErrorSeverity.Warning, "ILLEGAL_OPTION");

    /**
     * Compiler Warning 84.
     *
     * > unsupported option value `name`=`value`
     */
    public static readonly ILLEGAL_OPTION_VALUE =
        new ErrorType(84, "unsupported option value <arg>=<arg2>",
            ErrorSeverity.Warning, "ILLEGAL_OPTION_VALUE");

    /**
     * Compiler Error 94.
     *
     * > redefinition of `action` action
     */
    public static readonly ACTION_REDEFINITION =
        new ErrorType(94, "redefinition of <arg> action",
            ErrorSeverity.Error, "ACTION_REDEFINITION");

    /**
     * Compiler Error 99.
     *
     * > This error may take any of the following forms.
     * >
     * > - grammar `grammar` has no rules
     * > - implicitly generated grammar `grammar` has no rules
     */
    public static readonly NO_RULES =
        new ErrorType(99, "<if(arg2.implicitLexerOwner)>implicitly generated <endif>grammar <arg> has no rules",
            ErrorSeverity.Error, "NO_RULES");

    /**
     * Compiler Error 105.
     *
     * > reference to undefined grammar in rule reference: `grammar`.`rule`
     */
    public static readonly NO_SUCH_GRAMMAR_SCOPE =
        new ErrorType(105, "reference to undefined grammar in rule reference: <arg>.<arg2>",
            ErrorSeverity.Error, "NO_SUCH_GRAMMAR_SCOPE");

    /**
     * Compiler Error 106.
     *
     * > rule `rule` is not defined in grammar `grammar`
     */
    public static readonly NO_SUCH_RULE_IN_SCOPE =
        new ErrorType(106, "rule <arg2> is not defined in grammar <arg>",
            ErrorSeverity.Error, "NO_SUCH_RULE_IN_SCOPE");

    /**
     * Compiler Warning 108.
     *
     * > token name `Token` is already defined
     */
    public static readonly TOKEN_NAME_REASSIGNMENT =
        new ErrorType(108, "token name <arg> is already defined",
            ErrorSeverity.Warning, "TOKEN_NAME_REASSIGNMENT");

    /**
     * Compiler Warning 109.
     *
     * > options ignored in imported grammar `grammar`
     */
    public static readonly OPTIONS_IN_DELEGATE =
        new ErrorType(109, "options ignored in imported grammar <arg>",
            ErrorSeverity.Warning, "OPTIONS_IN_DELEGATE");

    /**
     * Compiler Error 110.
     *
     * > can't find or load grammar `grammar` from `filename`
     */
    public static readonly CANNOT_FIND_IMPORTED_GRAMMAR =
        new ErrorType(110, "can't find or load grammar <arg>",
            ErrorSeverity.Error, "CANNOT_FIND_IMPORTED_GRAMMAR");

    /**
     * Compiler Error 111.
     *
     * > `grammarType` grammar `grammar1` cannot import `grammarType` grammar `grammar2`
     */
    public static readonly INVALID_IMPORT =
        new ErrorType(111, "<arg.typeString> grammar <arg.name> cannot import <arg2.typeString> grammar <arg2.name>",
            ErrorSeverity.Error, "INVALID_IMPORT");

    /**
     * Compiler Error 113.
     *
     * > `grammarType` grammar `grammar1` and imported `grammarType` grammar `grammar2` both generate `recognizer`
     */
    public static readonly IMPORT_NAME_CLASH =
        new ErrorType(113, "<arg.typeString> grammar <arg.name> and imported <arg2.typeString> grammar <arg2.name> " +
            "both generate <arg2.recognizerName>", ErrorSeverity.Error, "IMPORT_NAME_CLASH");

    /**
     * Compiler Error 114.
     *
     * > cannot find tokens file `filename`
     */
    public static readonly CANNOT_FIND_TOKENS_FILE_REFD_IN_GRAMMAR =
        new ErrorType(114, "cannot find tokens file <arg>",
            ErrorSeverity.Error, "CANNOT_FIND_TOKENS_FILE_REFD_IN_GRAMMAR");

    /**
     * Compiler Error 119.
     *
     * > The following sets of rules are mutually left-recursive `[rules]`
     */
    public static readonly LEFT_RECURSION_CYCLES =
        new ErrorType(119, "The following sets of rules are mutually left-recursive <arg:{c| [<c:{r|<r.name>}; " +
            "separator=\", \">]}; separator=\" and \">", ErrorSeverity.Error, "LEFT_RECURSION_CYCLES");

    /**
     * Compiler Error 120.
     *
     * > lexical modes are only allowed in lexer grammars
     */
    public static readonly MODE_NOT_IN_LEXER =
        new ErrorType(120, "lexical modes are only allowed in lexer grammars",
            ErrorSeverity.Error, "MODE_NOT_IN_LEXER");

    /**
     * Compiler Error 121.
     *
     * > cannot find an attribute name in attribute declaration
     */
    public static readonly CANNOT_FIND_ATTRIBUTE_NAME_IN_DECL =
        new ErrorType(121, "cannot find an attribute name in attribute declaration",
            ErrorSeverity.Error, "CANNOT_FIND_ATTRIBUTE_NAME_IN_DECL");

    /**
     * Compiler Error 122.
     *
     * > rule `rule`: must label all alternatives or none
     */
    public static readonly RULE_WITH_TOO_FEW_ALT_LABELS =
        new ErrorType(122, "rule <arg>: must label all alternatives or none",
            ErrorSeverity.Error, "RULE_WITH_TOO_FEW_ALT_LABELS");

    /**
     * Compiler Error 123.
     *
     * > rule alt label `label` redefined in rule `rule1`, originally in rule `rule2`
     */
    public static readonly ALT_LABEL_REDEF =
        new ErrorType(123, "rule alt label <arg> redefined in rule <arg2>, originally in rule <arg3>",
            ErrorSeverity.Error, "ALT_LABEL_REDEF");

    /**
     * Compiler Error 124.
     *
     * > rule alt label `label` conflicts with rule `rule`
     */
    public static readonly ALT_LABEL_CONFLICTS_WITH_RULE =
        new ErrorType(124, "rule alt label <arg> conflicts with rule <arg2>",
            ErrorSeverity.Error, "ALT_LABEL_CONFLICTS_WITH_RULE");

    /**
     * Compiler Warning 125.
     *
     * > implicit definition of token `Token` in parser
     */
    public static readonly IMPLICIT_TOKEN_DEFINITION =
        new ErrorType(125, "implicit definition of token <arg> in parser",
            ErrorSeverity.Warning, "IMPLICIT_TOKEN_DEFINITION");

    /**
     * Compiler Error 126.
     *
     * > cannot create implicit token for string literal in non-combined grammar: `literal`
     */
    public static readonly IMPLICIT_STRING_DEFINITION =
        new ErrorType(126, "cannot create implicit token for string literal in non-combined grammar: <arg>",
            ErrorSeverity.Error, "IMPLICIT_STRING_DEFINITION");

    /**
     * Compiler Error 128.
     *
     * > attribute references not allowed in lexer actions: `expression`
     */
    public static readonly ATTRIBUTE_IN_LEXER_ACTION =
        new ErrorType(128, "attribute references not allowed in lexer actions: $<arg>",
            ErrorSeverity.Error, "ATTRIBUTE_IN_LEXER_ACTION");

    /**
     * Compiler Error 130.
     *
     * > label `label` assigned to a block which is not a set
     */
    public static readonly LABEL_BLOCK_NOT_A_SET =
        new ErrorType(130, "label <arg> assigned to a block which is not a set",
            ErrorSeverity.Error, "LABEL_BLOCK_NOT_A_SET");

    /**
     * Compiler Warning 131.
     *
     * > This warning may take any of the following forms.
     *
     * <ul>
     * <li>greedy block {@code ()*} contains wildcard; the non-greedy syntax {@code ()*?} may be preferred</li>
     * <li>greedy block {@code ()+} contains wildcard; the non-greedy syntax {@code ()+?} may be preferred</li>
     * </ul>
     */
    public static readonly EXPECTED_NON_GREEDY_WILDCARD_BLOCK =
        new ErrorType(131, "greedy block ()<arg> contains wildcard; the non-greedy syntax ()<arg>? may be preferred",
            ErrorSeverity.Warning, "EXPECTED_NON_GREEDY_WILDCARD_BLOCK");

    /**
     * Compiler Error 133.
     *
     * > `command` in lexer rule `rule` must be last element of single outermost alt
     */
    public static readonly LEXER_COMMAND_PLACEMENT_ISSUE =
        new ErrorType(133, "->command in lexer rule <arg> must be last element of single outermost alt",
            ErrorSeverity.Error, "LEXER_COMMAND_PLACEMENT_ISSUE");

    /**
     * Compiler Error 183.
     *
     * > rule reference `rule` is not currently supported in a set
     */
    public static readonly UNSUPPORTED_REFERENCE_IN_LEXER_SET =
        new ErrorType(183, "rule reference <arg> is not currently supported in a set",
            ErrorSeverity.Error, "UNSUPPORTED_REFERENCE_IN_LEXER_SET");

    /**
     * Compiler Error 135.
     *
     * > cannot assign a value to list label `label`
     */
    public static readonly ASSIGNMENT_TO_LIST_LABEL =
        new ErrorType(135, "cannot assign a value to list label <arg>",
            ErrorSeverity.Error, "ASSIGNMENT_TO_LIST_LABEL");

    /**
     * Compiler Error 136.
     *
     * > return value `name` conflicts with rule with same name
     */
    public static readonly RETVAL_CONFLICTS_WITH_RULE =
        new ErrorType(136, "return value <arg> conflicts with rule with same name",
            ErrorSeverity.Error, "RETVAL_CONFLICTS_WITH_RULE");

    /**
     * Compiler Error 137.
     *
     * > return value `name` conflicts with token with same name
     */
    public static readonly RETVAL_CONFLICTS_WITH_TOKEN =
        new ErrorType(137, "return value <arg> conflicts with token with same name",
            ErrorSeverity.Error, "RETVAL_CONFLICTS_WITH_TOKEN");

    /**
     * Compiler Error 138.
     *
     * > parameter `parameter` conflicts with rule with same name
     */
    public static readonly ARG_CONFLICTS_WITH_RULE =
        new ErrorType(138, "parameter <arg> conflicts with rule with same name",
            ErrorSeverity.Error, "ARG_CONFLICTS_WITH_RULE");

    /**
     * Compiler Error 139.
     *
     * > parameter `parameter` conflicts with token with same name
     */
    public static readonly ARG_CONFLICTS_WITH_TOKEN =
        new ErrorType(139, "parameter <arg> conflicts with token with same name",
            ErrorSeverity.Error, "ARG_CONFLICTS_WITH_TOKEN");

    /**
     * Compiler Error 140.
     *
     * > local `local` conflicts with rule with same name
     */
    public static readonly LOCAL_CONFLICTS_WITH_RULE =
        new ErrorType(140, "local <arg> conflicts with rule with same name",
            ErrorSeverity.Error, "LOCAL_CONFLICTS_WITH_RULE");

    /**
     * Compiler Error 141.
     *
     * > local `local` conflicts with rule token same name
     */
    public static readonly LOCAL_CONFLICTS_WITH_TOKEN =
        new ErrorType(141, "local <arg> conflicts with rule token same name",
            ErrorSeverity.Error, "LOCAL_CONFLICTS_WITH_TOKEN");

    /**
     * Compiler Error 142.
     *
     * > local `local` conflicts with parameter with same name
     */
    public static readonly LOCAL_CONFLICTS_WITH_ARG =
        new ErrorType(142, "local <arg> conflicts with parameter with same name",
            ErrorSeverity.Error, "LOCAL_CONFLICTS_WITH_ARG");

    /**
     * Compiler Error 143.
     *
     * > local `local` conflicts with return value with same name
     */
    public static readonly LOCAL_CONFLICTS_WITH_RETVAL =
        new ErrorType(143, "local <arg> conflicts with return value with same name",
            ErrorSeverity.Error, "LOCAL_CONFLICTS_WITH_RETVAL");

    /**
     * Compiler Error 144.
     *
     * > multi-character literals are not allowed in lexer sets: `literal`
     */
    public static readonly INVALID_LITERAL_IN_LEXER_SET =
        new ErrorType(144, "multi-character literals are not allowed in lexer sets: <arg>",
            ErrorSeverity.Error, "INVALID_LITERAL_IN_LEXER_SET");

    /**
     * Compiler Error 145.
     *
     * > lexer mode `mode` must contain at least one non-fragment rule
     *
     * > Every lexer mode must contain at least one rule which is not declared with the `fragment` modifier.
     */
    public static readonly MODE_WITHOUT_RULES =
        new ErrorType(145, "lexer mode <arg> must contain at least one non-fragment rule",
            ErrorSeverity.Error, "MODE_WITHOUT_RULES");

    /**
     * Compiler Warning 146.
     *
     * > non-fragment lexer rule `rule` can match the empty string
     *
     * > All non-fragment lexer rules must match at least one character.
     *
     * > The following example shows this error.
     *
     * ```antlr
     * Whitespace : [ \t]+;  // ok
     * Whitespace : [ \t];   // ok
     *
     * fragment WS : [ \t]*; // ok
     *
     * Whitespace : [ \t]*;  // error 146
     * ```
     */
    public static readonly EPSILON_TOKEN =
        new ErrorType(146, "non-fragment lexer rule <arg> can match the empty string",
            ErrorSeverity.Warning, "EPSILON_TOKEN");

    /**
     * Compiler Error 147.
     *
     * >
     * left recursive rule `rule` must contain an alternative which is
     * not left recursive
     *
     * > Left-recursive rules must contain at least one alternative which is not
     * left recursive.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * // error 147:
     * a : a ID
     *   | a INT
     *   ;
     * ```
     */
    public static readonly NO_NON_LR_ALTS =
        new ErrorType(147, "left recursive rule <arg> must contain an alternative which is not left recursive",
            ErrorSeverity.Error, "NO_NON_LR_ALTS");

    /**
     * Compiler Error 148.
     *
     * >
     * left recursive rule `rule` contains a left recursive alternative
     * which can be followed by the empty string
     *
     * > In left-recursive rules, all left-recursive alternatives must match at
     * least one symbol following the recursive rule invocation.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * a : ID    // ok        (alternative is not left recursive)
     *   | a INT // ok        (a must be follow by INT)
     *   | a ID? // error 148 (the ID following a is optional)
     *   ;
     * ```
     */
    public static readonly EPSILON_LR_FOLLOW =
        new ErrorType(148, "left recursive rule <arg> contains a left recursive alternative which can be followed " +
            "by the empty string", ErrorSeverity.Error, "EPSILON_LR_FOLLOW");

    /**
     * Compiler Error 149.
     *
     * >
     * lexer command `command` does not exist or is not supported by
     * the current target
     *
     * > Each lexer command requires an explicit implementation in the target
     * templates. This error indicates that the command was incorrectly written
     * or is not supported by the current target.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * X : 'foo' -> type(Foo);  // ok
     * Y : 'foo' -> token(Foo); // error 149 (token is not a supported lexer command)
     * ```
     */
    public static readonly INVALID_LEXER_COMMAND =
        new ErrorType(149, "lexer command <arg> does not exist or is not supported by the current target",
            ErrorSeverity.Error, "INVALID_LEXER_COMMAND");

    /**
     * Compiler Error 150.
     *
     * > missing argument for lexer command `command`
     *
     * > Some lexer commands require an argument.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * X : 'foo' -> type(Foo); // ok
     * Y : 'foo' -> type;      // error 150 (the type command requires an argument)
     * ```
     */
    public static readonly MISSING_LEXER_COMMAND_ARGUMENT =
        new ErrorType(150, "missing argument for lexer command <arg>",
            ErrorSeverity.Error, "MISSING_LEXER_COMMAND_ARGUMENT");

    /**
     * Compiler Error 151.
     *
     * > lexer command `command` does not take any arguments
     *
     * > A lexer command which does not take parameters was invoked with an
     * argument.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * X : 'foo' -> popMode;    // ok
     * Y : 'foo' -> popMode(A); // error 151 (the popMode command does not take an argument)
     * ```
     */
    public static readonly UNWANTED_LEXER_COMMAND_ARGUMENT =
        new ErrorType(151, "lexer command <arg> does not take any arguments",
            ErrorSeverity.Error, "UNWANTED_LEXER_COMMAND_ARGUMENT");

    /**
     * Compiler Error 152.
     *
     * > unterminated string literal
     *
     * > The grammar contains an unterminated string literal.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * x : 'x'; // ok
     * y : 'y';  // error 152
     * ```
     */
    public static readonly UNTERMINATED_STRING_LITERAL =
        new ErrorType(152, "unterminated string literal",
            ErrorSeverity.Error, "UNTERMINATED_STRING_LITERAL");

    /**
     * Compiler Error 153.
     *
     * > rule `rule` contains a closure with at least one alternative that can match an empty string
     *
     * > A rule contains a closure (`(...)*`) or positive closure (`(...)+`) around an empty alternative.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * x  : ;
     * y  : x+;                                // error 153
     * z1 : ('foo' | 'bar'? 'bar2'?)*;         // error 153
     * z2 : ('foo' | 'bar' 'bar2'? | 'bar2')*; // ok
     * ```
     */
    public static readonly EPSILON_CLOSURE =
        new ErrorType(153, "rule <arg> contains a closure with at least one alternative that can match an empty string",
            ErrorSeverity.Error, "EPSILON_CLOSURE");

    /**
     * Compiler Warning 154.
     *
     * > rule `rule` contains an optional block with at least one alternative that can match an empty string
     *
     * > A rule contains an optional block (`(...)?`) around an empty alternative.
     *
     * > The following rule produces this warning.
     *
     * ```antlr
     * x  : ;
     * y  : x?;                                // warning 154
     * z1 : ('foo' | 'bar'? 'bar2'?)?;         // warning 154
     * z2 : ('foo' | 'bar' 'bar2'? | 'bar2')?; // ok
     * ```
     */
    public static readonly EPSILON_OPTIONAL =
        new ErrorType(154, "rule <arg> contains an optional block with at least one alternative that can match " +
            "an empty string", ErrorSeverity.Warning, "EPSILON_OPTIONAL");

    /**
     * Compiler Warning 155.
     *
     * > rule `rule` contains a lexer command with an unrecognized constant value; lexer interpreters may produce
     * incorrect output
     *
     * > A lexer rule contains a standard lexer command, but the constant value argument for the command is an
     * unrecognized string. As a result, the lexer command will be translated as a custom lexer action, preventing
     * the command from executing in some interpreted modes. The output of the lexer interpreter may not match
     * the output of the generated lexer.
     *
     * > The following rule produces this warning.
     *
     * ```antlr
     * ‍@members {
     * public static final int CUSTOM = HIDDEN + 1;
     * }
     *
     * X : 'foo' -> channel(HIDDEN);           // ok
     * Y : 'bar' -> channel(CUSTOM);           // warning 155
     * ```
     */
    public static readonly UNKNOWN_LEXER_CONSTANT =
        new ErrorType(155, "rule <arg> contains a lexer command with an unrecognized constant value; lexer " +
            "interpreters may produce incorrect output", ErrorSeverity.Warning, "UNKNOWN_LEXER_CONSTANT");

    /**
     * Compiler Error 156.
     *
     * > invalid escape sequence
     *
     * > The grammar contains a string literal with an invalid escape sequence.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * x : 'x';  // ok
     * y : '\u005Cu'; // error 156
     * ```
     */
    public static readonly INVALID_ESCAPE_SEQUENCE =
        new ErrorType(156, "invalid escape sequence <arg>", ErrorSeverity.Error, "INVALID_ESCAPE_SEQUENCE");

    /**
     * Compiler Warning 157.
     *
     * > rule `rule` contains an assoc element option in an
     * unrecognized location
     *
     * >
     * In ANTLR 4.2, the position of the {@code assoc} element option was moved
     * from the operator terminal(s) to the alternative itself. This warning is
     * reported when an {@code assoc} element option is specified on a grammar
     * element that is not recognized by the current version of ANTLR, and as a
     * result will simply be ignored.
     *
     *
     * > The following rule produces this warning.
     *
     * ```antlr
     * x : 'x'
     *   | x '+' <assoc=right> x   // warning 157
     *   | <assoc=right> x * x   // ok
     *   ;
     * ```
     */
    public static readonly UNRECOGNIZED_ASSOC_OPTION =
        new ErrorType(157, "rule <arg> contains an assoc terminal option in an unrecognized location",
            ErrorSeverity.Warning, "UNRECOGNIZED_ASSOC_OPTION");

    /**
     * Compiler Warning 158.
     *
     * > fragment rule `rule` contains an action or command which can
     * never be executed
     *
     * > A lexer rule which is marked with the {@code fragment} modifier
     * contains an embedded action or lexer command. ANTLR lexers only execute
     * commands and embedded actions located in the top-level matched rule.
     * Since fragment rules can never be the top-level rule matched by a lexer,
     * actions or commands placed in these rules can never be executed during
     * the lexing process.
     *
     * > The following rule produces this warning.
     *
     * ```antlr
     * X1 : 'x' -> more    // ok
     *    ;
     * Y1 : 'x' {more();}  // ok
     *    ;
     * fragment
     * X2 : 'x' -> more    // warning 158
     *    ;
     * fragment
     * Y2 : 'x' {more();}  // warning 158
     *    ;
     * ```
     */
    public static readonly FRAGMENT_ACTION_IGNORED =
        new ErrorType(158, "fragment rule <arg> contains an action or command which can never be executed",
            ErrorSeverity.Warning, "FRAGMENT_ACTION_IGNORED");

    /**
     * Compiler Error 159.
     *
     * > cannot declare a rule with reserved name `rule`
     *
     * > A rule was declared with a reserved name.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * EOF :  ' '   // error 159 (EOF is a reserved name)
     *     ;
     * ```
     */
    public static readonly RESERVED_RULE_NAME =
        new ErrorType(159, "cannot declare a rule with reserved name <arg>",
            ErrorSeverity.Error, "RESERVED_RULE_NAME");

    /**
     * Compiler Error 160.
     *
     * > reference to parser rule `rule` in lexer rule `name`
     *
     * @see #UNDEFINED_RULE_REF
     */
    public static readonly PARSER_RULE_REF_IN_LEXER_RULE =
        new ErrorType(160, "reference to parser rule <arg> in lexer rule <arg2>",
            ErrorSeverity.Error, "PARSER_RULE_REF_IN_LEXER_RULE");

    /**
     * Compiler Error 161.
     *
     * > channel `name` conflicts with token with same name
     */
    public static readonly CHANNEL_CONFLICTS_WITH_TOKEN =
        new ErrorType(161, "channel <arg> conflicts with token with same name",
            ErrorSeverity.Error, "CHANNEL_CONFLICTS_WITH_TOKEN");

    /**
     * Compiler Error 162.
     *
     * > channel `name` conflicts with mode with same name
     */
    public static readonly CHANNEL_CONFLICTS_WITH_MODE =
        new ErrorType(162, "channel <arg> conflicts with mode with same name",
            ErrorSeverity.Error, "CHANNEL_CONFLICTS_WITH_MODE");

    /**
     * Compiler Error 163.
     *
     * > custom channels are not supported in parser grammars
     */
    public static readonly CHANNELS_BLOCK_IN_PARSER_GRAMMAR =
        new ErrorType(163, "custom channels are not supported in parser grammars",
            ErrorSeverity.Error, "CHANNELS_BLOCK_IN_PARSER_GRAMMAR");

    /**
     * Compiler Error 164.
     *
     * > custom channels are not supported in combined grammars
     */
    public static readonly CHANNELS_BLOCK_IN_COMBINED_GRAMMAR =
        new ErrorType(164, "custom channels are not supported in combined grammars",
            ErrorSeverity.Error, "CHANNELS_BLOCK_IN_COMBINED_GRAMMAR");

    public static readonly NONCONFORMING_LR_RULE =
        new ErrorType(169, "rule <arg> is left recursive but doesn't conform to a pattern ANTLR can handle",
            ErrorSeverity.Error, "NONCONFORMING_LR_RULE");

    /**
     * Compiler Error 170.
     *
     * ```antlr
     * mode M1;
     * A1: 'a'; // ok
     * mode M2;
     * A2: 'a'; // ok
     * M1: 'b'; // error 170
     * ```
     *
     * > mode `name` conflicts with token with same name
     */
    public static readonly MODE_CONFLICTS_WITH_TOKEN =
        new ErrorType(170, "mode <arg> conflicts with token with same name",
            ErrorSeverity.Error, "MODE_CONFLICTS_WITH_TOKEN");

    /**
     * Compiler Error 171.
     *
     * > can not use or declare token with reserved name
     *
     * > Reserved names: HIDDEN, DEFAULT_TOKEN_CHANNEL, SKIP, MORE, MAX_CHAR_VALUE, MIN_CHAR_VALUE.
     *
     * > Can be used but cannot be declared: EOF
     */
    public static readonly TOKEN_CONFLICTS_WITH_COMMON_CONSTANTS =
        new ErrorType(171, "cannot use or declare token with reserved name <arg>",
            ErrorSeverity.Error, "TOKEN_CONFLICTS_WITH_COMMON_CONSTANTS");

    /**
     * Compiler Error 172.
     *
     * > can not use or declare channel with reserved name
     *
     * > Reserved names: DEFAULT_MODE, SKIP, MORE, EOF, MAX_CHAR_VALUE, MIN_CHAR_VALUE.
     *
     * > Can be used but cannot be declared: HIDDEN, DEFAULT_TOKEN_CHANNEL
     */
    public static readonly CHANNEL_CONFLICTS_WITH_COMMON_CONSTANTS =
        new ErrorType(172, "cannot use or declare channel with reserved name <arg>",
            ErrorSeverity.Error, "CHANNEL_CONFLICTS_WITH_COMMON_CONSTANTS");

    /**
     * Compiler Error 173.
     *
     * > can not use or declare mode with reserved name
     *
     * > Reserved names: HIDDEN, DEFAULT_TOKEN_CHANNEL, SKIP, MORE, MAX_CHAR_VALUE, MIN_CHAR_VALUE.
     *
     * > Can be used and cannot declared: DEFAULT_MODE
     */
    public static readonly MODE_CONFLICTS_WITH_COMMON_CONSTANTS =
        new ErrorType(173, "cannot use or declare mode with reserved name <arg>",
            ErrorSeverity.Error, "MODE_CONFLICTS_WITH_COMMON_CONSTANTS");

    /**
     * Compiler Error 174.
     *
     * > empty strings and sets not allowed
     *
     * ```antlr
     * A: '''test''';
     * B: '';
     * C: 'test' '';
     * D: [];
     * E: [f-a];
     * ```
     */
    public static readonly EMPTY_STRINGS_AND_SETS_NOT_ALLOWED =
        new ErrorType(174, "string literals and sets cannot be empty: <arg>",
            ErrorSeverity.Error, "EMPTY_STRINGS_AND_SETS_NOT_ALLOWED");

    /**
     * Compiler Error 175.
     *
     * > `name` is not a recognized token name
     *
     * ```antlr
     * TOKEN: 'a' -> type(CHANNEL1); // error 175
     * ```
     */
    public static readonly CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_TOKEN_NAME =
        new ErrorType(175, "<arg> is not a recognized token name",
            ErrorSeverity.Error, "CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_TOKEN_NAME");

    /**
     * Compiler Error 176.
     *
     * > `name`is not a recognized mode name
     *
     * ```antlr
     * TOKEN: 'a' -> mode(MODE1); // error 176
     * ```
     */
    public static readonly CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_MODE_NAME =
        new ErrorType(176, "<arg> is not a recognized mode name",
            ErrorSeverity.Error, "CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_MODE_NAME");

    /**
     * Compiler Error 177.
     *
     * > `name` is not a recognized channel name
     *
     * ```antlr
     * TOKEN: 'a' -> channel(TOKEN1); // error 177
     * ```
     */
    public static readonly CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_CHANNEL_NAME =
        new ErrorType(177, "<arg> is not a recognized channel name",
            ErrorSeverity.Error, "CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_CHANNEL_NAME");

    /**
     * Compiler Warning 178.
     *
     * > lexer rule has a duplicated commands
     *
     * > TOKEN: 'asdf' -> mode(MODE1), mode(MODE2);
     */
    public static readonly DUPLICATED_COMMAND =
        new ErrorType(178, "duplicated command <arg>",
            ErrorSeverity.Warning, "DUPLICATED_COMMAND");

    /**
     * Compiler Waring 179.
     *
     * > incompatible commands `command1` and `command2`
     *
     * > T00: 'a00' -> skip, more;
     */
    public static readonly INCOMPATIBLE_COMMANDS =
        new ErrorType(179, "incompatible commands <arg> and <arg2>",
            ErrorSeverity.Warning, "INCOMPATIBLE_COMMANDS");

    /**
     * Compiler Warning 180.
     *
     * > chars "a-f" used multiple times in set [a-fc-m]
     *
     * ```antlr
     * A:    [aa-z];   // warning
     * B:    [a-fc-m]; // warning
     * ```
     *
     * TODO: Does not work with fragment rules.
     */
    public static readonly CHARACTERS_COLLISION_IN_SET =
        new ErrorType(180, "chars <arg> used multiple times in set <arg2>",
            ErrorSeverity.Warning, "CHARACTERS_COLLISION_IN_SET");

    /**
     * Compiler Warning 181
     *
     * The token range operator makes no sense in the parser as token types are not ordered (except
     * in implementation).
     *
     * ```antlr
     * grammar T;
     * a : 'A'..'Z' ;
     * ```
     */
    public static readonly TOKEN_RANGE_IN_PARSER =
        new ErrorType(181, "token ranges not allowed in parser: <arg>..<arg2>",
            ErrorSeverity.Error, "TOKEN_RANGE_IN_PARSER");

    /**
     * Compiler Error 182.
     *
     * > Unicode properties cannot be part of a lexer charset range
     *
     * ```antlr
     * A: [\p{Letter}-\p{Number}];
     * ```
     */
    public static readonly UNICODE_PROPERTY_NOT_ALLOWED_IN_RANGE =
        new ErrorType(182, "unicode property escapes not allowed in lexer charset range: <arg>",
            ErrorSeverity.Error, "UNICODE_PROPERTY_NOT_ALLOWED_IN_RANGE");

    /**
     * Compiler Warning 184.
     *
     * > The token value overlapped by another token or self
     *
     * ```antlr
     * TOKEN1: 'value';
     * TOKEN2: 'value'; // warning
     * ```
     */
    public static readonly TOKEN_UNREACHABLE =
        new ErrorType(184, "One of the token <arg> values unreachable. <arg2> is always overlapped by token <arg3>",
            ErrorSeverity.Warning, "TOKEN_UNREACHABLE");

    /**
     * > Range probably contains not implied characters. Both bounds should be defined in lower or UPPER case
     * For instance, the range [A-z] (ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_"abcdefghijklmnopqrstuvwxy)
     * probably contains not implied characters: [\]^_"
     *
     * Use the following definition: [A-Za-z]
     * If the characters are implied, include them explicitly: [A-Za-z[\\\]^_"]
     *
     * ```antlr
     * TOKEN: [A-z]; // warning
     * ```
     */
    public static readonly RANGE_PROBABLY_CONTAINS_NOT_IMPLIED_CHARACTERS =
        new ErrorType(185, "Range <arg>..<arg2> probably contains not implied characters <arg3>. Both bounds should " +
            "be defined in lower or UPPER case", ErrorSeverity.Warning, "RANGE_PROBABLY_CONTAINS_NOT_IMPLIED_CHARACTERS"
        );

    /**
     * > rule `rule` contains a closure with at least one alternative that can match EOF
     *
     * > A rule contains a closure ({@code (...)*}) or positive closure (`(...)+`) around EOF.
     *
     * > The following rule produces this error.
     *
     * ```antlr
     * x : EOF*;         // error
     * y : EOF+;         // error
     * z : EOF;         // ok
     * ```
     */
    public static readonly EOF_CLOSURE =
        new ErrorType(186, "rule <arg> contains a closure with at least one alternative that can match EOF",
            ErrorSeverity.Error, "EOF_CLOSURE");

    /**
     * > Redundant caseInsensitive lexer rule option
     *
     * ```antlr
     * options { caseInsensitive=true; }
     * TOKEN options { caseInsensitive=true; } : [a-z]+ -> caseInsensitive(true); // warning
     * ```
     */
    public static readonly REDUNDANT_CASE_INSENSITIVE_LEXER_RULE_OPTION =
        new ErrorType(187, "caseInsensitive lexer rule option is redundant because its value equals to global " +
            "value (<arg>)", ErrorSeverity.Warning, "REDUNDANT_CASE_INSENSITIVE_LEXER_RULE_OPTION");

    // Dependency sorting errors

    /* t1.g4 -> t2.g4 -> t3.g4 ->t1.g4 */
    //CIRCULAR_DEPENDENCY(200, "your grammars contain a circular dependency and cannot be sorted into a
    //  valid build order", ErrorSeverity.Error);

    /**
     * The error or warning message, in StringTemplate 4 format using {@code <}
     * and {@code >} as the delimiters. Arguments for the message may be
     * referenced using the following names:
     *
     * <ul>
     * <li>{@code arg}: The first template argument</li>
     * <li>{@code arg2}: The second template argument</li>
     * <li>{@code arg3}: The third template argument</li>
     * <li>{@code verbose}: {@code true} if verbose messages were requested; otherwise, {@code false}</li>
     * <li>{@code exception}: The exception which resulted in the error, if any.</li>
     * <li>{@code stackTrace}: The stack trace for the exception, when available.</li>
     * </ul>
     */
    public readonly msg: string;

    /**
     * The error or warning number.
     *
     * > The code should be unique, and following its
     * use in a release should not be altered or reassigned.
     */
    public readonly code: number;

    /**
     * The error severity.
     */
    public readonly severity: ErrorSeverity;

    /**
     * Constructs a new {@link ErrorType} with the specified code, message, and
     * severity.
     *
     * @param code The unique error number.
     * @param msg The error message template.
     * @param severity The error severity.
     * @param name The enum name as a string.
     */
    protected constructor(code: number, msg: string, severity: ErrorSeverity, public readonly name: string) {
        this.code = code;
        this.msg = msg;
        this.severity = severity;
    }
}
