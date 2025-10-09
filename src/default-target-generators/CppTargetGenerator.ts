/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable max-len, jsdoc/require-returns, jsdoc/require-param */

import * as OutputModelObjects from "src/codegen/model/index.js";
import { CodeBlock } from "src/codegen/model/decl/CodeBlock.js";
import { GeneratorBase } from "../codegen/GeneratorBase.js";
import type { ITargetGenerator, Lines } from "../codegen/ITargetGenerator.js";
import type { GrammarASTWithOptions } from "../tool/ast/GrammarASTWithOptions.js";
import type { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import type { Grammar } from "../tool/Grammar.js";
import type { Rule } from "../tool/Rule.js";

/** The constructor type of OutputModelObject class. Used the source op lookup map. */
type OutputModelObjectConstructor = new (...args: unknown[]) => OutputModelObjects.OutputModelObject;

export class CppTargetGenerator extends GeneratorBase implements ITargetGenerator {
    public readonly id = "generator.default.cpp";
    public readonly version = "1.0.0";

    public readonly language = "Cpp";
    public readonly languageSpecifiers = ["cpp", "c++"];

    public override readonly codeFileExtension = ".cpp";
    public override readonly declarationFileExtension = ".h";
    public readonly needsDeclarationFile = true;
    public readonly contextNameSuffix = "Context";
    public readonly lexerRuleContext = "antlr4::ParserRuleContext";

    /** The rule context name is the rule followed by a suffix, e.g. r becomes rContext. */
    public readonly ruleContextNameSuffix = "Context";

    public override readonly inlineTestSetWordSize = 64;
    public override readonly isATNSerializedAsInts = true;
    
    // Note: C++ needs wantsBaseListener=true, wantsBaseVisitor=true, supportsOverloadedMethods=false
    // But TypeScript doesn't allow overriding readonly properties with different values.
    // This is handled by the template system instead.

    /**
     * C++ reserved words
     */
    public override readonly reservedWords = new Set([
        "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand",
        "bitor", "bool", "break", "case", "catch", "char", "char16_t",
        "char32_t", "class", "compl", "concept", "const", "constexpr",
        "const_cast", "continue", "decltype", "default", "delete", "do",
        "double", "dynamic_cast", "else", "enum", "explicit", "export",
        "extern", "false", "float", "for", "friend", "goto", "if",
        "inline", "int", "long", "mutable", "namespace", "new", "noexcept",
        "not", "not_eq", "nullptr", "operator", "or", "or_eq", "private",
        "protected", "public", "register", "reinterpret_cast", "requires",
        "return", "short", "signed", "sizeof", "static", "static_assert",
        "static_cast", "struct", "switch", "template", "this", "thread_local",
        "throw", "true", "try", "typedef", "typeid", "typename", "union",
        "unsigned", "using", "virtual", "void", "volatile", "wchar_t", "while",
        "xor", "xor_eq",
    ]);

    public readonly lexerCommandMap: Map<string, () => Lines>;
    public readonly lexerCallCommandMap: Map<string, (arg: string, grammar: Grammar) => Lines>;

    /**
     * Code blocks are at the heart of code generation. This map allows easy lookup of the correct render method for a
     * specific output model code object, named a `SrcOp`. Source ops are code snippets that are put together
     * to form the final code.
     */
    private readonly srcOpMap = new Map<OutputModelObjectConstructor,
        (outputFile: OutputModelObjects.OutputFile, recognizerName: string, srcOp: OutputModelObjects.SrcOp) => Lines>([
            [OutputModelObjects.AddToLabelList, (outputFile, recognizerName, srcOp) => {
                return this.renderAddToLabelList(srcOp as OutputModelObjects.AddToLabelList);
            }],
            [OutputModelObjects.AttributeDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderAttributeDecl(srcOp as OutputModelObjects.AttributeDecl);
            }],
            [OutputModelObjects.CaptureNextToken, (outputFile, recognizerName, srcOp) => {
                return this.renderCaptureNextToken(srcOp as OutputModelObjects.CaptureNextToken);
            }],
            [OutputModelObjects.CaptureNextTokenType, (outputFile, recognizerName, srcOp) => {
                return this.renderCaptureNextTokenType(srcOp as OutputModelObjects.CaptureNextTokenType);
            }],
            [OutputModelObjects.CodeBlockForAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderCodeBlockForAlt(outputFile, recognizerName, srcOp as OutputModelObjects.CodeBlockForAlt);
            }],
            [OutputModelObjects.CodeBlockForOuterMostAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderCodeBlockForOuterMostAlt(outputFile, recognizerName, srcOp as OutputModelObjects.CodeBlockForOuterMostAlt);
            }],
            [OutputModelObjects.ContextRuleGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextRuleGetterDecl(srcOp as OutputModelObjects.ContextRuleGetterDecl);
            }],
            [OutputModelObjects.ContextRuleListGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextRuleListGetterDecl(srcOp as OutputModelObjects.ContextRuleListGetterDecl);
            }],
            [OutputModelObjects.ContextTokenGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextTokenGetterDecl(recognizerName, srcOp as OutputModelObjects.ContextTokenGetterDecl);
            }],
            [OutputModelObjects.ContextTokenListGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextTokenListGetterDecl(srcOp as OutputModelObjects.ContextTokenListGetterDecl);
            }],
            [OutputModelObjects.ContextTokenListIndexedGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextTokenListIndexedGetterDecl(recognizerName, srcOp as OutputModelObjects.ContextTokenListIndexedGetterDecl);
            }],
            [OutputModelObjects.ExceptionClause, (outputFile, recognizerName, srcOp) => {
                return this.renderExceptionClause(srcOp as OutputModelObjects.ExceptionClause);
            }],
            [OutputModelObjects.LL1AltBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1AltBlock(outputFile, recognizerName, srcOp as OutputModelObjects.LL1AltBlock);
            }],
            [OutputModelObjects.LL1OptionalBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1OptionalBlock(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1OptionalBlock);
            }],
            [OutputModelObjects.LL1OptionalBlockSingleAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1OptionalBlockSingleAlt(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1OptionalBlockSingleAlt);
            }],
            [OutputModelObjects.LL1StarBlockSingleAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1StarBlockSingleAlt(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1StarBlockSingleAlt);
            }],
            [OutputModelObjects.LL1PlusBlockSingleAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderLL1PlusBlockSingleAlt(outputFile, recognizerName,
                    srcOp as OutputModelObjects.LL1PlusBlockSingleAlt);
            }],
            [OutputModelObjects.MatchToken, (outputFile, recognizerName, srcOp) => {
                return this.renderMatchToken(recognizerName, srcOp as OutputModelObjects.MatchToken);
            }],
            [OutputModelObjects.MatchSet, (outputFile, recognizerName, srcOp) => {
                return this.renderMatchSet(srcOp as OutputModelObjects.MatchSet);
            }],
            [OutputModelObjects.MatchNotSet, (outputFile, recognizerName, srcOp) => {
                return this.renderMatchNotSet(srcOp as OutputModelObjects.MatchNotSet);
            }],
            [OutputModelObjects.RuleContextDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderRuleContextDecl(srcOp as OutputModelObjects.RuleContextDecl);
            }],
            [OutputModelObjects.RuleContextListDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderRuleContextListDecl(srcOp as OutputModelObjects.RuleContextListDecl);
            }],
            [OutputModelObjects.StructDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderStructDecl(outputFile, recognizerName, srcOp as OutputModelObjects.StructDecl);
            }],
            [OutputModelObjects.TestSetInline, (outputFile, recognizerName, srcOp) => {
                return this.renderTestSetInline(srcOp as OutputModelObjects.TestSetInline);
            }],
            [OutputModelObjects.TokenDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderTokenDecl(outputFile, recognizerName, srcOp as OutputModelObjects.TokenDecl);
            }],
            [OutputModelObjects.TokenTypeDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderTokenTypeDecl(srcOp as OutputModelObjects.TokenTypeDecl);
            }],
            [OutputModelObjects.TokenListDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderTokenListDecl(srcOp as OutputModelObjects.TokenListDecl);
            }],
            [OutputModelObjects.ThrowNoViableAlt, (outputFile, recognizerName, srcOp) => {
                return this.renderThrowNoViableAlt(srcOp as OutputModelObjects.ThrowNoViableAlt);
            }],
            [OutputModelObjects.Wildcard, (outputFile, recognizerName, srcOp) => {
                return this.renderWildcard(srcOp as OutputModelObjects.Wildcard);
            }],
            [OutputModelObjects.ContextRuleListIndexedGetterDecl, (outputFile, recognizerName, srcOp) => {
                return this.renderContextRuleListIndexedGetterDecl(
                    srcOp as OutputModelObjects.ContextRuleListIndexedGetterDecl);
            }],
            [OutputModelObjects.StarBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderStarBlock(outputFile, recognizerName, srcOp as OutputModelObjects.StarBlock);
            }],
            [OutputModelObjects.PlusBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderPlusBlock(outputFile, recognizerName, srcOp as OutputModelObjects.PlusBlock);
            }],
            [OutputModelObjects.OptionalBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderOptionalBlock(outputFile, recognizerName, srcOp as OutputModelObjects.OptionalBlock);
            }],
            [OutputModelObjects.AltBlock, (outputFile, recognizerName, srcOp) => {
                return this.renderAltBlock(outputFile, recognizerName, srcOp as OutputModelObjects.AltBlock);
            }],
            [OutputModelObjects.InvokeRule, (outputFile, recognizerName, srcOp) => {
                return this.renderInvokeRule(srcOp as OutputModelObjects.InvokeRule);
            }],
            [OutputModelObjects.SemPred, (outputFile, recognizerName, srcOp) => {
                return this.renderSemPred(srcOp as OutputModelObjects.SemPred);
            }],
            [OutputModelObjects.Action, (outputFile, recognizerName, srcOp) => {
                return this.renderAction(srcOp as OutputModelObjects.Action);
            }],
        ]);

    public constructor() {
        super();

        this.lexerCommandMap = new Map<string, () => Lines>([
            ["skip", this.renderLexerSkipCommand],
            ["more", this.renderLexerMoreCommand],
            ["popMode", this.renderLexerPopModeCommand],
        ]);

        this.lexerCallCommandMap = new Map<string, (arg: string, grammar: Grammar) => Lines>([
            ["type", this.renderLexerTypeCommand],
            ["channel", this.renderLexerChannelCommand],
            ["mode", this.renderLexerModeCommand],
            ["pushMode", this.renderLexerPushModeCommand],
        ]);
    }

    public renderParserFile(parserFile: OutputModelObjects.ParserFile, declaration: boolean): string {
        // C++ requires both header (.h) and implementation (.cpp) files
        if (declaration) {
            return this.renderParserHeader(parserFile);
        } else {
            return this.renderParserImplementation(parserFile);
        }
    }

    public renderLexerFile(lexerFile: OutputModelObjects.LexerFile, declaration: boolean): string {
        if (declaration) {
            return this.renderLexerHeader(lexerFile);
        } else {
            return this.renderLexerImplementation(lexerFile);
        }
    }

    public renderBaseListenerFile(file: OutputModelObjects.ListenerFile, declaration: boolean): string {
        if (declaration) {
            return this.renderBaseListenerHeader(file);
        } else {
            return this.renderBaseListenerImplementation(file);
        }
    }

    public renderListenerFile(listenerFile: OutputModelObjects.ListenerFile, declaration: boolean): string {
        if (declaration) {
            return this.renderListenerHeader(listenerFile);
        } else {
            return this.renderListenerImplementation(listenerFile);
        }
    }

    public renderBaseVisitorFile(file: OutputModelObjects.VisitorFile, declaration: boolean): string {
        if (declaration) {
            return this.renderBaseVisitorHeader(file);
        } else {
            return this.renderBaseVisitorImplementation(file);
        }
    }

    public renderVisitorFile(visitorFile: OutputModelObjects.VisitorFile, declaration: boolean): string {
        if (declaration) {
            return this.renderVisitorHeader(visitorFile);
        } else {
            return this.renderVisitorImplementation(visitorFile);
        }
    }

    public renderLexerRuleContext(): Lines {
        return ["antlr4::ParserRuleContext"];
    }

    public getRuleFunctionContextStructName(r: Rule): string {
        if (r.g.isLexer()) {
            return this.renderLexerRuleContext().join("");
        }

        return this.toTitleCase(r.name) + this.ruleContextNameSuffix;
    }

    public renderRecRuleReplaceContext(ctxName: string): Lines {
        return [
            `_localctx = std::make_shared<${ctxName}>(_localctx);`,
            "_ctx = _localctx;",
            "_prevctx = _localctx;"
        ];
    }

    public renderRecRuleAltPredicate(ruleName: string, opPrec: number): Lines {
        return [`precpred(_ctx, ${opPrec})`];
    }

    public renderRecRuleSetReturnAction(src: string, name: string): Lines {
        return [`$${name} = $${src}->${name};`];
    }

    public renderRecRuleSetStopToken(): Lines {
        return [`_ctx->stop = _input->LT(-1);`];
    }

    public renderRecRuleSetPrevCtx(): Lines {
        return [
            "if (_parseListeners != nullptr) {",
            "    triggerExitRuleEvent();",
            "}",
            "",
            "_prevctx = _localctx;",
        ];
    }

    public renderRecRuleLabeledAltStartAction(parserName: string, ruleName: string, currentAltLabel: string,
        label: string | undefined, isListLabel: boolean): Lines {

        const altLabelClass = this.toTitleCase(currentAltLabel);
        const ruleNameClass = this.toTitleCase(ruleName);

        const result: Lines = [
            `_localctx = std::make_shared<${altLabelClass}Context>(std::make_shared<${ruleNameClass}Context>(_parentctx, _parentState));`
        ];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`dynamic_cast<${altLabelClass}Context*>(_localctx.get())->_${label}.push_back(_prevctx);`);
            } else {
                result.push(`dynamic_cast<${altLabelClass}Context*>(_localctx.get())->_${label} = _prevctx;`);
            }
        }

        result.push(`pushNewRecursionContext(_localctx, _startState, ${parserName}::RULE_${ruleName});`);

        return result;
    }

    public renderRecRuleAltStartAction(parserName: string, ruleName: string, ctxName: string, label: string | undefined,
        isListLabel: boolean): Lines {

        const contextClass = this.toTitleCase(ctxName);
        const result: Lines = [`_localctx = std::make_shared<${contextClass}Context>(_parentctx, _parentState);`];

        if (label !== undefined) {
            if (isListLabel) {
                result.push(`_localctx->_${label}.push_back(_prevctx);`);
            } else {
                result.push(`_localctx->_${label} = _prevctx;`);
            }
        }

        result.push(`pushNewRecursionContext(_localctx, _startState, ${parserName}::RULE_${ruleName});`);

        return result;
    }

    public renderTestFile(grammarName: string, lexerName: string, parserName: string | undefined,
        parserStartRuleName: string | undefined, showDiagnosticErrors: boolean, traceATN: boolean, profile: boolean,
        showDFA: boolean, useListener: boolean, useVisitor: boolean, predictionMode: string, buildParseTree: boolean,
    ): string {
        // C++ test file generation
        const lines: Lines = [
            `#include <iostream>`,
            `#include <fstream>`,
            `#include "antlr4-runtime.h"`,
            `#include "${lexerName}.h"`
        ];

        if (parserName) {
            lines.push(`#include "${parserName}.h"`);

            if (useListener) {
                lines.push(`#include "${grammarName}Listener.h"`);
            }

            if (useVisitor) {
                lines.push(`#include "${grammarName}Visitor.h"`);
            }
        }

        lines.push(
            ``,
            `using namespace antlr4;`,
            ``,
            `int main(int argc, const char* argv[]) {`,
            `    std::ifstream stream;`,
            `    stream.open(argv[1]);`,
            `    ANTLRInputStream input(stream);`,
            `    ${lexerName} lexer(&input);`,
            `    CommonTokenStream tokens(&lexer);`,
        );

        if (parserName) {
            lines.push(
                `    ${parserName} parser(&tokens);`,
                `    tree::ParseTree *tree = parser.${parserStartRuleName}();`,
                `    std::cout << tree->toStringTree(&parser) << std::endl;`,
            );
        } else {
            lines.push(
                `    tokens.fill();`,
                `    for (auto token : tokens.getTokens()) {`,
                `        std::cout << token->toString() << std::endl;`,
                `    }`,
            );
        }

        lines.push(
            `    return 0;`,
            `}`,
        );

        return lines.join("\n");
    }

    // Private helper methods for rendering different parts

    private renderParserHeader(parserFile: OutputModelObjects.ParserFile): string {
        const result: Lines = [
            ...this.renderFileHeader(parserFile),
            "",
            "#pragma once",
            "",
            "#include \"antlr4-runtime.h\"",
            "",
        ];

        // Add forward declarations
        const parser = parserFile.parser;
        const namespace_ = parserFile.genPackage;

        if (namespace_) {
            result.push(`namespace ${namespace_} {`);
            result.push("");
        }

        result.push(`class ${parser.name} : public antlr4::Parser {`);
        result.push("public:");

        // Token constants
        result.push("    enum {");
        result.push(...this.renderMap(parser.tokens, 8, "${0} = ${1},"));
        result.push("    };");
        result.push("");

        // Rule constants
        result.push("    enum {");
        result.push(...this.renderTemplatedObjectList(parser.rules, 8, "RULE_${0} = ${1},", "name", "index"));
        result.push("    };");
        result.push("");

        // Constructor and methods
        result.push(`    explicit ${parser.name}(antlr4::TokenStream *input);`);
        result.push(`    ~${parser.name}();`);
        result.push("");

        // Virtual methods
        result.push("    std::string getGrammarFileName() const override;");
        result.push("    const antlr4::atn::ATN& getATN() const override;");
        result.push("    const std::vector<std::string>& getTokenNames() const override;");
        result.push("    const std::vector<std::string>& getRuleNames() const override;");
        result.push("");

        // Rule methods - just declarations
        for (const rule of parser.funcs) {
            result.push(...this.renderRuleFunctionDeclaration(rule));
        }

        result.push("");
        result.push("private:");
        result.push("    static std::vector<antlr4::dfa::DFA> _decisionToDFA;");
        result.push("    static antlr4::atn::PredictionContextCache _sharedContextCache;");
        result.push("    static std::vector<std::string> _ruleNames;");
        result.push("    static std::vector<std::string> _tokenNames;");
        result.push("    static std::vector<std::string> _literalNames;");
        result.push("    static std::vector<std::string> _symbolicNames;");
        result.push("    static antlr4::dfa::Vocabulary _vocabulary;");
        result.push("    static antlr4::atn::ATN _atn;");
        result.push("    static std::vector<uint16_t> _serializedATN;");
        result.push("");

        result.push("};");

        if (namespace_) {
            result.push("");
            result.push(`}  // namespace ${namespace_}`);
        }

        return result.join("\n");
    }

    private renderParserImplementation(parserFile: OutputModelObjects.ParserFile): string {
        const result: Lines = [
            ...this.renderFileHeader(parserFile),
            "",
            `#include "${parserFile.parser.name}.h"`,
            "",
        ];

        const parser = parserFile.parser;
        const namespace_ = parserFile.genPackage;

        if (namespace_) {
            result.push(`using namespace ${namespace_};`);
            result.push("");
        }

        result.push("using namespace antlr4;");
        result.push("");

        // Static member initialization
        result.push(`std::vector<dfa::DFA> ${parser.name}::_decisionToDFA;`);
        result.push(`atn::PredictionContextCache ${parser.name}::_sharedContextCache;`);
        result.push(`std::vector<std::string> ${parser.name}::_ruleNames;`);
        result.push(`std::vector<std::string> ${parser.name}::_tokenNames;`);
        result.push(`std::vector<std::string> ${parser.name}::_literalNames;`);
        result.push(`std::vector<std::string> ${parser.name}::_symbolicNames;`);
        result.push(`dfa::Vocabulary ${parser.name}::_vocabulary;`);
        result.push(`atn::ATN ${parser.name}::_atn;`);
        result.push("");

        // Constructor
        result.push(`${parser.name}::${parser.name}(TokenStream *input) : Parser(input) {`);
        result.push("    _interpreter = new atn::ParserATNSimulator(this, _atn, _decisionToDFA, _sharedContextCache);");
        result.push("}");
        result.push("");

        // Destructor
        result.push(`${parser.name}::~${parser.name}() {`);
        result.push("    delete _interpreter;");
        result.push("}");
        result.push("");

        // Implement virtual methods
        result.push(`std::string ${parser.name}::getGrammarFileName() const {`);
        result.push(`    return "${parserFile.grammarFileName}";`);
        result.push("}");
        result.push("");

        result.push(`const atn::ATN& ${parser.name}::getATN() const {`);
        result.push("    return _atn;");
        result.push("}");
        result.push("");

        // Rule implementations
        for (const rule of parser.funcs) {
            result.push(...this.renderRuleFunctionImplementation(parser.name, rule));
            result.push("");
        }

        return result.join("\n");
    }

    private renderLexerHeader(lexerFile: OutputModelObjects.LexerFile): string {
        const result: Lines = [
            ...this.renderFileHeader(lexerFile),
            "",
            "#pragma once",
            "",
            "#include \"antlr4-runtime.h\"",
            "",
        ];

        const lexer = lexerFile.lexer;
        const namespace_ = lexerFile.genPackage;

        if (namespace_) {
            result.push(`namespace ${namespace_} {`);
            result.push("");
        }

        result.push(`class ${lexer.name} : public antlr4::Lexer {`);
        result.push("public:");

        // Token constants
        result.push("    enum {");
        result.push(...this.renderMap(lexer.tokens, 8, "${0} = ${1},"));
        result.push("    };");
        result.push("");

        // Constructor
        result.push(`    explicit ${lexer.name}(antlr4::CharStream *input);`);
        result.push(`    ~${lexer.name}();`);
        result.push("");

        // Virtual methods
        result.push("    std::string getGrammarFileName() const override;");
        result.push("    const std::vector<std::string>& getRuleNames() const override;");
        result.push("    const std::vector<std::string>& getChannelNames() const override;");
        result.push("    const std::vector<std::string>& getModeNames() const override;");
        result.push("    const std::vector<std::string>& getTokenNames() const override;");
        result.push("    antlr4::dfa::Vocabulary& getVocabulary() const override;");
        result.push("    const std::vector<uint16_t> getSerializedATN() const override;");
        result.push("    const antlr4::atn::ATN& getATN() const override;");
        result.push("");

        result.push("private:");
        result.push("    static std::vector<antlr4::dfa::DFA> _decisionToDFA;");
        result.push("    static antlr4::atn::PredictionContextCache _sharedContextCache;");
        result.push("    static std::vector<std::string> _ruleNames;");
        result.push("    static std::vector<std::string> _channelNames;");
        result.push("    static std::vector<std::string> _modeNames;");
        result.push("    static std::vector<std::string> _tokenNames;");
        result.push("    static std::vector<std::string> _literalNames;");
        result.push("    static std::vector<std::string> _symbolicNames;");
        result.push("    static antlr4::dfa::Vocabulary _vocabulary;");
        result.push("    static antlr4::atn::ATN _atn;");
        result.push("    static std::vector<uint16_t> _serializedATN;");
        result.push("");

        result.push("};");

        if (namespace_) {
            result.push("");
            result.push(`}  // namespace ${namespace_}`);
        }

        return result.join("\n");
    }

    private renderLexerImplementation(lexerFile: OutputModelObjects.LexerFile): string {
        const result: Lines = [
            ...this.renderFileHeader(lexerFile),
            "",
            `#include "${lexerFile.lexer.name}.h"`,
            "",
        ];

        const lexer = lexerFile.lexer;
        const namespace_ = lexerFile.genPackage;

        if (namespace_) {
            result.push(`using namespace ${namespace_};`);
            result.push("");
        }

        result.push("using namespace antlr4;");
        result.push("");

        // Static member initialization
        result.push(`std::vector<dfa::DFA> ${lexer.name}::_decisionToDFA;`);
        result.push(`atn::PredictionContextCache ${lexer.name}::_sharedContextCache;`);
        result.push("");

        // Constructor
        result.push(`${lexer.name}::${lexer.name}(CharStream *input) : Lexer(input) {`);
        result.push("    _interpreter = new atn::LexerATNSimulator(this, _atn, _decisionToDFA, _sharedContextCache);");
        result.push("}");
        result.push("");

        // Destructor
        result.push(`${lexer.name}::~${lexer.name}() {`);
        result.push("    delete _interpreter;");
        result.push("}");
        result.push("");

        result.push(`std::string ${lexer.name}::getGrammarFileName() const {`);
        result.push(`    return "${lexerFile.grammarFileName}";`);
        result.push("}");
        result.push("");

        return result.join("\n");
    }

    private renderListenerHeader(listenerFile: OutputModelObjects.ListenerFile): string {
        const result: Lines = [
            ...this.renderFileHeader(listenerFile),
            "",
            "#pragma once",
            "",
            "#include \"antlr4-runtime.h\"",
            `#include "${listenerFile.parserName}.h"`,
            "",
        ];

        const namespace_ = listenerFile.genPackage;
        if (namespace_) {
            result.push(`namespace ${namespace_} {`);
            result.push("");
        }

        result.push(`class ${listenerFile.grammarName}Listener : public antlr4::tree::ParseTreeListener {`);
        result.push("public:");
        result.push("");

        for (const lname of listenerFile.listenerNames) {
            result.push(`    virtual void enter${this.toTitleCase(lname)}(${listenerFile.parserName}::${this.toTitleCase(lname)}Context *ctx) = 0;`);
            result.push(`    virtual void exit${this.toTitleCase(lname)}(${listenerFile.parserName}::${this.toTitleCase(lname)}Context *ctx) = 0;`);
            result.push("");
        }

        result.push("};");

        if (namespace_) {
            result.push("");
            result.push(`}  // namespace ${namespace_}`);
        }

        return result.join("\n");
    }

    private renderListenerImplementation(listenerFile: OutputModelObjects.ListenerFile): string {
        // C++ listener typically doesn't need an implementation file for pure virtual methods
        return "";
    }

    private renderBaseListenerHeader(listenerFile: OutputModelObjects.ListenerFile): string {
        const result: Lines = [
            ...this.renderFileHeader(listenerFile),
            "",
            "#pragma once",
            "",
            "#include \"antlr4-runtime.h\"",
            `#include "${listenerFile.grammarName}Listener.h"`,
            "",
        ];

        const namespace_ = listenerFile.genPackage;
        if (namespace_) {
            result.push(`namespace ${namespace_} {`);
            result.push("");
        }

        result.push(`class ${listenerFile.grammarName}BaseListener : public ${listenerFile.grammarName}Listener {`);
        result.push("public:");
        result.push("");

        for (const lname of listenerFile.listenerNames) {
            result.push(`    virtual void enter${this.toTitleCase(lname)}(${listenerFile.parserName}::${this.toTitleCase(lname)}Context * /*ctx*/) override { }`);
            result.push(`    virtual void exit${this.toTitleCase(lname)}(${listenerFile.parserName}::${this.toTitleCase(lname)}Context * /*ctx*/) override { }`);
            result.push("");
        }

        result.push("    virtual void enterEveryRule(antlr4::ParserRuleContext * /*ctx*/) override { }");
        result.push("    virtual void exitEveryRule(antlr4::ParserRuleContext * /*ctx*/) override { }");
        result.push("    virtual void visitTerminal(antlr4::tree::TerminalNode * /*node*/) override { }");
        result.push("    virtual void visitErrorNode(antlr4::tree::ErrorNode * /*node*/) override { }");
        result.push("");

        result.push("};");

        if (namespace_) {
            result.push("");
            result.push(`}  // namespace ${namespace_}`);
        }

        return result.join("\n");
    }

    private renderBaseListenerImplementation(listenerFile: OutputModelObjects.ListenerFile): string {
        // C++ base listener implementation file (empty implementations already in header)
        return "";
    }

    private renderVisitorHeader(visitorFile: OutputModelObjects.VisitorFile): string {
        const result: Lines = [
            ...this.renderFileHeader(visitorFile),
            "",
            "#pragma once",
            "",
            "#include \"antlr4-runtime.h\"",
            `#include "${visitorFile.parserName}.h"`,
            "",
        ];

        const namespace_ = visitorFile.genPackage;
        if (namespace_) {
            result.push(`namespace ${namespace_} {`);
            result.push("");
        }

        result.push(`class ${visitorFile.grammarName}Visitor : public antlr4::tree::AbstractParseTreeVisitor {`);
        result.push("public:");
        result.push("");

        for (const lname of visitorFile.visitorNames) {
            result.push(`    virtual std::any visit${this.toTitleCase(lname)}(${visitorFile.parserName}::${this.toTitleCase(lname)}Context *ctx) = 0;`);
            result.push("");
        }

        result.push("};");

        if (namespace_) {
            result.push("");
            result.push(`}  // namespace ${namespace_}`);
        }

        return result.join("\n");
    }

    private renderVisitorImplementation(visitorFile: OutputModelObjects.VisitorFile): string {
        // C++ visitor typically doesn't need an implementation file for pure virtual methods
        return "";
    }

    private renderBaseVisitorHeader(visitorFile: OutputModelObjects.VisitorFile): string {
        const result: Lines = [
            ...this.renderFileHeader(visitorFile),
            "",
            "#pragma once",
            "",
            "#include \"antlr4-runtime.h\"",
            `#include "${visitorFile.grammarName}Visitor.h"`,
            "",
        ];

        const namespace_ = visitorFile.genPackage;
        if (namespace_) {
            result.push(`namespace ${namespace_} {`);
            result.push("");
        }

        result.push(`class ${visitorFile.grammarName}BaseVisitor : public ${visitorFile.grammarName}Visitor {`);
        result.push("public:");
        result.push("");

        for (const lname of visitorFile.visitorNames) {
            result.push(`    virtual std::any visit${this.toTitleCase(lname)}(${visitorFile.parserName}::${this.toTitleCase(lname)}Context *ctx) override {`);
            result.push("        return visitChildren(ctx);");
            result.push("    }");
            result.push("");
        }

        result.push("};");

        if (namespace_) {
            result.push("");
            result.push(`}  // namespace ${namespace_}`);
        }

        return result.join("\n");
    }

    private renderBaseVisitorImplementation(visitorFile: OutputModelObjects.VisitorFile): string {
        // C++ base visitor implementation file (empty implementations already in header)
        return "";
    }

    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        const result: Lines = [];

        // file.ANTLRVersion is set by the template engine, not in the TypeScript model
        result.push(`// Generated from ${file.grammarFileName} by ANTLR`);

        return result;
    }

    private renderRuleFunctionDeclaration(rule: OutputModelObjects.RuleFunction): Lines {
        const result: Lines = [];
        const ruleName = this.escapeIfNeeded(rule.name);

        result.push(`    ${this.toTitleCase(rule.name)}Context* ${ruleName}();`);

        return result;
    }

    private renderRuleFunctionImplementation(parserName: string, rule: OutputModelObjects.RuleFunction): Lines {
        const result: Lines = [];
        const ruleName = this.escapeIfNeeded(rule.name);
        const contextName = this.toTitleCase(rule.name) + "Context";

        result.push(`${parserName}::${contextName}* ${parserName}::${ruleName}() {`);
        result.push(`    ${contextName}* _localctx = _tracker.createInstance<${contextName}>(_ctx, getState());`);
        result.push(`    enterRule(_localctx, ${rule.index}, ${parserName}::RULE_${rule.name});`);
        result.push("");

        // Add rule body here - this would need to be expanded with actual code generation
        result.push("    // Rule implementation");
        result.push("");

        result.push("    exitRule();");
        result.push("    return _localctx;");
        result.push("}");

        return result;
    }

    // Render methods for various source operations
    private renderAddToLabelList(srcOp: OutputModelObjects.AddToLabelList): Lines {
        return [`${srcOp.label}.push_back(${srcOp.listName});`];
    }

    private renderAttributeDecl(d: OutputModelObjects.AttributeDecl): Lines {
        const result: Lines = [];
        if (d.initValue !== undefined) {
            result.push(`${d.type} ${d.escapedName} = ${d.initValue};`);
        } else {
            result.push(`${d.type} ${d.escapedName};`);
        }
        return result;
    }

    private renderCaptureNextToken(srcOp: OutputModelObjects.CaptureNextToken): Lines {
        return [`${srcOp.varName} = _input->LT(1);`];
    }

    private renderCaptureNextTokenType(srcOp: OutputModelObjects.CaptureNextTokenType): Lines {
        return [`${srcOp.varName} = _input->LA(1);`];
    }

    private renderCodeBlockForAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.CodeBlockForAlt): Lines {
        return this.renderCodeBlock(outputFile, recognizerName, srcOp);
    }

    private renderCodeBlockForOuterMostAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.CodeBlockForOuterMostAlt): Lines {
        const result: Lines = [];
        result.push(`enterOuterAlt(_localctx, ${srcOp.alt.altNum});`);
        result.push(...this.renderCodeBlock(outputFile, recognizerName, srcOp));
        return result;
    }

    private renderCodeBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: CodeBlock): Lines {
        const result: Lines = [];

        // Render locals
        for (const local of srcOp.locals || []) {
            const method = this.srcOpMap.get(local.constructor as OutputModelObjectConstructor);
            if (method) {
                result.push(...method(outputFile, recognizerName, local));
            }
        }

        // Render preamble
        if (srcOp.preamble) {
            for (const preambleOp of srcOp.preamble) {
                const method = this.srcOpMap.get(preambleOp.constructor as OutputModelObjectConstructor);
                if (method) {
                    result.push(...method(outputFile, recognizerName, preambleOp));
                }
            }
        }

        // Render operations
        for (const op of srcOp.ops || []) {
            const method = this.srcOpMap.get(op.constructor as OutputModelObjectConstructor);
            if (method) {
                result.push(...method(outputFile, recognizerName, op));
            }
        }

        return result;
    }

    private renderContextRuleGetterDecl(srcOp: OutputModelObjects.ContextRuleGetterDecl): Lines {
        // signature is a boolean, not an object with a name property
        return [`${srcOp.ctxName}* ${srcOp.name}();`];
    }

    private renderContextRuleListGetterDecl(srcOp: OutputModelObjects.ContextRuleListGetterDecl): Lines {
        return [`std::vector<${srcOp.ctxName}*> ${srcOp.name}();`];
    }

    private renderContextTokenGetterDecl(recognizerName: string, srcOp: OutputModelObjects.ContextTokenGetterDecl): Lines {
        return [`antlr4::tree::TerminalNode* ${srcOp.name}();`];
    }

    private renderContextTokenListGetterDecl(srcOp: OutputModelObjects.ContextTokenListGetterDecl): Lines {
        return [`std::vector<antlr4::tree::TerminalNode*> ${srcOp.name}();`];
    }

    private renderContextTokenListIndexedGetterDecl(recognizerName: string,
        srcOp: OutputModelObjects.ContextTokenListIndexedGetterDecl): Lines {
        return [`antlr4::tree::TerminalNode* ${srcOp.name}(size_t i);`];
    }

    private renderContextRuleListIndexedGetterDecl(srcOp: OutputModelObjects.ContextRuleListIndexedGetterDecl): Lines {
        return [`${srcOp.ctxName}* ${srcOp.name}(size_t i);`];
    }

    private renderExceptionClause(srcOp: OutputModelObjects.ExceptionClause): Lines {
        const result: Lines = [];
        result.push(`catch (${this.renderActionChunks(srcOp.catchArg.chunks)}) {`);
        result.push(...this.formatLines(this.renderAction(srcOp.catchAction), 4));
        result.push("}");
        return result;
    }

    private renderLL1AltBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.LL1AltBlock): Lines {
        const result: Lines = [];
        result.push(`setState(${srcOp.decision});`);
        result.push(`switch (_input->LA(1)) {`);

        for (const alt of srcOp.alts || []) {
            result.push(...this.renderCodeBlock(outputFile, recognizerName, alt));
        }

        result.push("}");
        return result;
    }

    private renderLL1OptionalBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.LL1OptionalBlock): Lines {
        const result: Lines = [];
        result.push(`setState(${srcOp.decision});`);
        result.push("if (_input->LA(1) == /* token */) {");

        for (const alt of srcOp.alts || []) {
            result.push(...this.formatLines(this.renderCodeBlock(outputFile, recognizerName, alt), 4));
        }

        result.push("}");
        return result;
    }

    private renderLL1OptionalBlockSingleAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.LL1OptionalBlockSingleAlt): Lines {
        return this.renderLL1OptionalBlock(outputFile, recognizerName, srcOp);
    }

    private renderLL1StarBlockSingleAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.LL1StarBlockSingleAlt): Lines {
        const result: Lines = [];
        result.push(`setState(${srcOp.decision});`);
        result.push("while (/* condition */) {");

        for (const alt of srcOp.alts || []) {
            result.push(...this.formatLines(this.renderCodeBlock(outputFile, recognizerName, alt), 4));
        }

        result.push(`    setState(${srcOp.loopBackStateNumber});`);
        result.push("}");
        return result;
    }

    private renderLL1PlusBlockSingleAlt(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.LL1PlusBlockSingleAlt): Lines {
        const result: Lines = [];
        result.push(`setState(${srcOp.decision});`);
        result.push("do {");

        for (const alt of srcOp.alts || []) {
            result.push(...this.formatLines(this.renderCodeBlock(outputFile, recognizerName, alt), 4));
        }

        result.push(`    setState(${srcOp.loopBackStateNumber});`);
        result.push("} while (/* condition */);");
        return result;
    }

    private renderMatchToken(recognizerName: string, srcOp: OutputModelObjects.MatchToken): Lines {
        return [`match(${recognizerName}::${srcOp.name});`];
    }

    private renderMatchSet(srcOp: OutputModelObjects.MatchSet): Lines {
        return ["matchSet(/* set */);"];
    }

    private renderMatchNotSet(srcOp: OutputModelObjects.MatchNotSet): Lines {
        return ["matchNotSet(/* set */);"];
    }

    private renderRuleContextDecl(srcOp: OutputModelObjects.RuleContextDecl): Lines {
        return [`${srcOp.ctxName}* ${srcOp.name} = nullptr;`];
    }

    private renderRuleContextListDecl(srcOp: OutputModelObjects.RuleContextListDecl): Lines {
        return [`std::vector<${srcOp.ctxName}*> ${srcOp.name};`];
    }

    private renderStructDecl(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.StructDecl): Lines {
        const result: Lines = [];

        // Get the super class from the parser file's contextSuperClass
        const contextSuperClass = (outputFile as OutputModelObjects.ParserFile).contextSuperClass;
        let superClass = "antlr4::ParserRuleContext";
        if (contextSuperClass) {
            superClass = this.renderActionChunks([contextSuperClass]);
        }

        result.push(`class ${srcOp.escapedName} : public ${superClass} {`);
        result.push("public:");

        // Render attributes
        for (const attr of srcOp.attrs || []) {
            const method = this.srcOpMap.get(attr.constructor as OutputModelObjectConstructor);
            if (method) {
                result.push(...this.formatLines(method(outputFile, recognizerName, attr), 4));
            }
        }

        // Render getters
        for (const getter of srcOp.getters || []) {
            const method = this.srcOpMap.get(getter.constructor as OutputModelObjectConstructor);
            if (method) {
                result.push(...this.formatLines(method(outputFile, recognizerName, getter), 4));
            }
        }

        result.push("};");
        return result;
    }

    private renderTestSetInline(srcOp: OutputModelObjects.TestSetInline): Lines {
        return ["/* test set inline */"];
    }

    private renderTokenDecl(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.TokenDecl): Lines {
        return [`antlr4::Token* ${srcOp.name} = nullptr;`];
    }

    private renderTokenTypeDecl(srcOp: OutputModelObjects.TokenTypeDecl): Lines {
        return [`int ${srcOp.name} = 0;`];
    }

    private renderTokenListDecl(srcOp: OutputModelObjects.TokenListDecl): Lines {
        return [`std::vector<antlr4::Token*> ${srcOp.name};`];
    }

    private renderThrowNoViableAlt(srcOp: OutputModelObjects.ThrowNoViableAlt): Lines {
        return ["throw antlr4::NoViableAltException(this);"];
    }

    private renderWildcard(srcOp: OutputModelObjects.Wildcard): Lines {
        return ["matchWildcard();"];
    }

    private renderStarBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.StarBlock): Lines {
        const result: Lines = [];
        result.push("while (/* condition */) {");

        for (const alt of srcOp.alts || []) {
            result.push(...this.formatLines(this.renderCodeBlock(outputFile, recognizerName, alt), 4));
        }

        result.push("}");
        return result;
    }

    private renderPlusBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.PlusBlock): Lines {
        const result: Lines = [];
        result.push("do {");

        for (const alt of srcOp.alts || []) {
            result.push(...this.formatLines(this.renderCodeBlock(outputFile, recognizerName, alt), 4));
        }

        result.push("} while (/* condition */);");
        return result;
    }

    private renderOptionalBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.OptionalBlock): Lines {
        const result: Lines = [];
        result.push("if (/* condition */) {");

        for (const alt of srcOp.alts || []) {
            result.push(...this.formatLines(this.renderCodeBlock(outputFile, recognizerName, alt), 4));
        }

        result.push("}");
        return result;
    }

    private renderAltBlock(outputFile: OutputModelObjects.OutputFile, recognizerName: string,
        srcOp: OutputModelObjects.AltBlock): Lines {
        const result: Lines = [];

        for (const alt of srcOp.alts || []) {
            result.push(...this.renderCodeBlock(outputFile, recognizerName, alt));
        }

        return result;
    }

    private renderInvokeRule(srcOp: OutputModelObjects.InvokeRule): Lines {
        const args = srcOp.argExprsChunks ? this.renderActionChunks(srcOp.argExprsChunks) : "";
        return [`${srcOp.name}(${args});`];
    }

    private renderSemPred(srcOp: OutputModelObjects.SemPred): Lines {
        return [`if (!(${srcOp.predicate})) throw antlr4::FailedPredicateException(this, "${srcOp.predicate}");`];
    }

    private renderAction(srcOp: OutputModelObjects.Action | undefined): Lines {
        if (!srcOp) {
            return [];
        }

        const result: Lines = [];
        if (srcOp.chunks) {
            for (const chunk of srcOp.chunks) {
                result.push(...this.renderActionChunk(chunk));
            }
        }

        return result;
    }

    private renderActionChunk(chunk: OutputModelObjects.ActionChunk): Lines {
        if (chunk instanceof OutputModelObjects.ActionText) {
            return chunk.text || [];
        }

        // Handle other chunk types as needed
        return [];
    }

    protected override renderActionChunks(chunks: OutputModelObjects.ActionChunk[]): string {
        const lines: Lines = [];
        for (const chunk of chunks) {
            lines.push(...this.renderActionChunk(chunk));
        }
        return lines.join("");
    }

    // Lexer command methods
    private renderLexerSkipCommand = (): Lines => {
        return ["skip();"];
    };

    private renderLexerMoreCommand = (): Lines => {
        return ["more();"];
    };

    private renderLexerPopModeCommand = (): Lines => {
        return ["popMode();"];
    };

    private renderLexerTypeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`setType(${arg});`];
    };

    private renderLexerChannelCommand = (arg: string, grammar: Grammar): Lines => {
        return [`setChannel(${arg});`];
    };

    private renderLexerModeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`setMode(${arg});`];
    };

    private renderLexerPushModeCommand = (arg: string, grammar: Grammar): Lines => {
        return [`pushMode(${arg});`];
    };

    // Additional required interface methods
    public override renderImplicitTokenLabel(tokenName: string): string {
        return `_t${tokenName}`;
    }

    public override renderImplicitRuleLabel(ruleName: string): string {
        return `_r${ruleName}`;
    }

    public override renderImplicitSetLabel(id: string): string {
        return `_tset${id}`;
    }

    public override renderListLabelName(label: string): string {
        return `_${label}_list`;
    }

    public override escapeIfNeeded(identifier: string): string {
        return this.reservedWords.has(identifier) ? `${identifier}_` : identifier;
    }

    public override getTargetStringLiteralFromString(s: string, quoted?: boolean): string {
        if (quoted === undefined) {
            quoted = true;
        }

        const sb: string[] = [];
        if (quoted) {
            sb.push('"');
        }

        for (let i = 0; i < s.length;) {
            const c = s.codePointAt(i)!;
            const escape = this.charValueEscapeMap.get(c);

            if (escape) {
                sb.push(`\\${escape}`);
            } else if (c < 0x20 || c > 0x7F) {
                sb.push(`\\u${c.toString(16).padStart(4, "0")}`);
            } else {
                sb.push(String.fromCodePoint(c));
            }

            i += c > 0xFFFF ? 2 : 1;
        }

        if (quoted) {
            sb.push('"');
        }

        return sb.join("");
    }

    public override getLoopLabel(ast: GrammarASTWithOptions): string {
        return `loop${ast.token?.tokenIndex ?? 0}`;
    }

    public override getRecognizerFileName(forDeclarationFile: boolean, recognizerName: string): string {
        return `${recognizerName}${forDeclarationFile ? this.declarationFileExtension : this.codeFileExtension}`;
    }

    public override getListenerFileName(forDeclarationFile: boolean, grammarName: string): string {
        return `${grammarName}Listener${forDeclarationFile ? this.declarationFileExtension : this.codeFileExtension}`;
    }

    public override getVisitorFileName(forDeclarationFile: boolean, grammarName: string): string {
        return `${grammarName}Visitor${forDeclarationFile ? this.declarationFileExtension : this.codeFileExtension}`;
    }

    public override getBaseListenerFileName(forDeclarationFile: boolean, grammarName: string): string {
        return `${grammarName}BaseListener${forDeclarationFile ? this.declarationFileExtension : this.codeFileExtension}`;
    }

    public override getBaseVisitorFileName(forDeclarationFile: boolean, grammarName: string): string {
        return `${grammarName}BaseVisitor${forDeclarationFile ? this.declarationFileExtension : this.codeFileExtension}`;
    }

    public override getSerializedATNSegmentLimit(): number {
        return 2 ^ 16 - 1; // 64K per segment for C++
    }

    public override getTokenTypeAsTargetLabel(g: Grammar, ttype: number): string {
        const name = g.getTokenName(ttype);
        if (name && name.startsWith("'")) {
            return name;
        }

        return String(ttype);
    }

    public override getTargetStringLiteralFromANTLRStringLiteral(literal: string, addQuotes: boolean,
        escapeSpecial?: boolean): string {
        escapeSpecial ??= true;

        let s = literal;

        // Remove quotes from ANTLR literal
        if (s.startsWith("'") && s.endsWith("'")) {
            s = s.slice(1, -1);
        }

        return this.getTargetStringLiteralFromString(s, addQuotes);
    }

    protected override renderTypedContext(ctx: OutputModelObjects.StructDecl): string {
        return ctx.provideCopyFrom ? `dynamic_cast<${ctx.name}*>(_localctx.get())` : `_localctx`;
    }
}
