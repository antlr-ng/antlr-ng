/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// cspell: ignore RULEMODIFIERS, ruleref

import {
    CommonToken, ParserRuleContext, type CharStream, type TerminalNode, type TokenSource, type TokenStream
} from "antlr4ng";

import {
    ANTLRv4Parser,
    type Action_Context, type AlternativeContext, type AltListContext, type AtomContext, type BlockContext,
    type BlockSetContext, type ChannelsSpecContext, type CharacterRangeContext, type DelegateGrammarsContext,
    type EbnfContext, type EbnfSuffixContext, type ElementContext, type ElementOptionContext,
    type ElementOptionsContext, type GrammarSpecContext, type LabeledElementContext, type LexerAltContext,
    type LexerAtomContext, type LexerBlockContext, type LexerCommandContext, type LexerCommandsContext,
    type LexerElementContext, type LexerElementsContext, type LexerRuleBlockContext, type LexerRuleSpecContext,
    type ModeSpecContext, type NotSetContext, type OptionsSpecContext, type ParserRuleSpecContext,
    type PredicateOptionsContext, type PrequelConstructContext, type RuleActionContext, type RuleBlockContext,
    type RulerefContext, type RulesContext, type RuleSpecContext,
    type SetElementContext, type TerminalDefContext, type TokensSpecContext
} from "../generated/ANTLRv4Parser.js";

import { Constants } from "../Constants1.js";
import { ANTLRv4Lexer } from "../generated/ANTLRv4Lexer.js";
import type { Constructor } from "../misc/Utils.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { AltAST } from "../tool/ast/AltAST.js";
import { BlockAST } from "../tool/ast/BlockAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { GrammarRootAST } from "../tool/ast/GrammarRootAST.js";
import { NotAST } from "../tool/ast/NotAST.js";
import { OptionalBlockAST } from "../tool/ast/OptionalBlockAST.js";
import { PlusBlockAST } from "../tool/ast/PlusBlockAST.js";
import { RuleAST } from "../tool/ast/RuleAST.js";
import { RuleRefAST } from "../tool/ast/RuleRefAST.js";
import { SetAST } from "../tool/ast/SetAST.js";
import { StarBlockAST } from "../tool/ast/StarBlockAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";
import { GrammarType } from "./GrammarType.js";
import { Grammar } from "../tool/Grammar.js";
import { RangeAST } from "../tool/ast/RangeAST.js";

/**
 * Converts a grammar spec parse tree into a grammar AST.
 */
export class ParseTreeToASTConverter {
    /**
     * Converts the grammar parse tree to an abstract syntax tree (AST).
     * We simulate here the same tree structure as produced by the old ANTlR 3.x parser.
     *
     * @param grammarSpec The root context of the grammar parse tree.
     * @param tokens The token stream to use for the AST nodes.
     *
     * @returns The generated AST.
     */
    public static convertGrammarSpecToAST(grammarSpec: GrammarSpecContext, tokens: TokenStream): GrammarRootAST {
        let name = "";
        let type: GrammarType;
        if (grammarSpec.grammarDecl().grammarType().LEXER() !== null) {
            name = "LEXER_GRAMMAR";
            type = GrammarType.Lexer;
        } else if (grammarSpec.grammarDecl().grammarType().PARSER() !== null) {
            name = "PARSER_GRAMMAR";
            type = GrammarType.Parser;
        } else {
            name = "COMBINED_GRAMMAR";
            type = GrammarType.Combined;
        }

        // The grammar type is our root AST node.
        const token = this.createToken(ANTLRv4Parser.GRAMMAR, grammarSpec);
        const root = new GrammarRootAST(ANTLRv4Parser.GRAMMAR, token, name, tokens);
        root.grammarType = type;
        const grammarName = grammarSpec.grammarDecl().identifier();
        root.addChild(this.createASTNode(ANTLRv4Parser.ID, grammarName));

        this.convertPrequelConstructToAST(grammarSpec.prequelConstruct(), root);
        this.convertRulesToAST(grammarSpec.rules(), root);
        this.convertModeSpecToAST(grammarSpec.modeSpec(), root);

        const options = root.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (options) {
            Grammar.setNodeOptions(root, options);
        }

        return root;
    }

    public static convertRuleSpecToAST(rule: RuleSpecContext, ast: GrammarAST): GrammarAST | undefined {
        if (rule.parserRuleSpec()) {
            const parserRule = rule.parserRuleSpec()!;
            const ruleAST = this.createVirtualASTNode(RuleAST, ANTLRv4Lexer.RULE, rule, "RULE");
            ast.addChild(ruleAST);

            ruleAST.addChild(this.createASTNode(ANTLRv4Parser.RULE_REF, parserRule.RULE_REF()));
            if (parserRule.argActionBlock()) {
                this.convertArgActionBlockToAST(ANTLRv4Lexer.ARG_ACTION, parserRule.argActionBlock()!, ruleAST);
            }

            if (parserRule.ruleReturns()) {
                const returnsAST = this.createASTNode(ANTLRv4Parser.RETURNS, parserRule.ruleReturns()!.RETURNS());
                this.convertArgActionBlockToAST(ANTLRv4Lexer.ARG_ACTION, parserRule.ruleReturns()!.argActionBlock(),
                    returnsAST);

                ruleAST.addChild(returnsAST);
            }

            if (parserRule.throwsSpec()) {
                const throwsAST = this.createASTNode(ANTLRv4Parser.THROWS, parserRule.throwsSpec()!.THROWS());
                parserRule.throwsSpec()!.qualifiedIdentifier().forEach((id) => {
                    throwsAST.addChild(this.createASTNode(ANTLRv4Parser.ID, id));
                });

                ruleAST.addChild(throwsAST);
            }

            if (parserRule.localsSpec()) {
                const localsAST = this.createASTNode(ANTLRv4Parser.LOCALS, parserRule.localsSpec()!.LOCALS());
                this.convertArgActionBlockToAST(ANTLRv4Lexer.ARG_ACTION, parserRule.localsSpec()!.argActionBlock(),
                    localsAST);

                ruleAST.addChild(localsAST);
            }

            parserRule.rulePrequel().forEach((prequel) => {
                if (prequel.optionsSpec()) {
                    this.convertOptionsSpecToAST(prequel.optionsSpec()!, ruleAST);
                } else if (prequel.ruleAction()) {
                    this.convertRuleActionToAST(prequel.ruleAction()!, ruleAST);
                }
            });

            this.convertRuleBlockToAST(parserRule.ruleBlock(), ruleAST);

            parserRule.exceptionGroup().exceptionHandler().forEach((exceptionHandler) => {
                const exception = this.createASTNode(exceptionHandler.CATCH().symbol.type, exceptionHandler.CATCH());
                ruleAST.addChild(exception);

                this.convertArgActionBlockToAST(ANTLRv4Lexer.ARG_ACTION, exceptionHandler.argActionBlock(), exception);
                this.convertActionBlockToAST(ANTLRv4Lexer.ARG_ACTION, exceptionHandler.actionBlock(), exception);
            });

            if (parserRule.exceptionGroup().finallyClause()) {
                const finallyAST = new BlockAST(this.createToken(ANTLRv4Lexer.FINALLY,
                    parserRule.exceptionGroup().finallyClause()!));
                ruleAST.addChild(finallyAST);
                this.convertActionBlockToAST(ANTLRv4Lexer.ACTION,
                    parserRule.exceptionGroup().finallyClause()!.actionBlock(), finallyAST);
            }

            const options = ruleAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
            if (options) {
                Grammar.setNodeOptions(ruleAST, options);
            }

            return ruleAST;
        } else if (rule.lexerRuleSpec()) {
            return this.convertLexerRuleSpecToAST(rule.lexerRuleSpec()!, ast);
        }

        return undefined;
    }

    public static convertRuleBlockToAST(ruleBlock: RuleBlockContext, ast: GrammarAST): BlockAST {
        const colon = (ruleBlock.parent as ParserRuleSpecContext).COLON();
        const blockAST = this.createVirtualASTNode(BlockAST, ANTLRv4Lexer.BLOCK, colon, "BLOCK");
        ast.addChild(blockAST);

        ruleBlock.ruleAltList().labeledAlt().forEach((labeledAlt) => {
            // labeledAlt.alternative is rooted at an AltAST node.
            const altAST = this.convertAlternativeToAST(labeledAlt.alternative(), blockAST);

            if (altAST && labeledAlt.POUND()) {
                const id = this.createASTNode(ANTLRv4Parser.ID, labeledAlt.identifier()!);
                altAST.altLabel = id;
            }
        });

        return blockAST;
    }

    public static convertRulerefToAST(ruleref: RulerefContext, ast: GrammarAST): RuleRefAST {
        const ruleRefAST = this.createVirtualASTNode(RuleRefAST, ANTLRv4Parser.RULE_REF, ruleref.RULE_REF());
        ast.addChild(ruleRefAST);

        if (ruleref.argActionBlock()) {
            this.convertArgActionBlockToAST(ANTLRv4Lexer.ARG_ACTION, ruleref.argActionBlock()!, ruleRefAST);
        }

        if (ruleref.elementOptions()) {
            this.convertElementOptionsToAST(ruleref.elementOptions()!, ruleRefAST);
        }

        const options = ruleRefAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (options) {
            Grammar.setNodeOptions(ruleRefAST, options);
        }

        return ruleRefAST;
    }

    public static convertPrequelConstructToAST(prequelConstruct: PrequelConstructContext[], ast: GrammarAST): void {
        prequelConstruct.forEach((prequel) => {
            if (prequel.optionsSpec()) {
                this.convertOptionsSpecToAST(prequel.optionsSpec()!, ast);
            } else if (prequel.delegateGrammars()) {
                this.convertDelegateGrammarsToAST(prequel.delegateGrammars()!, ast);
            } else if (prequel.tokensSpec()) {
                this.convertTokensSpec(prequel.tokensSpec()!, ast);
            } else if (prequel.channelsSpec()) {
                this.convertChannelsSpecToAST(prequel.channelsSpec()!, ast);
            } else if (prequel.action_()) {
                this.convertActionRuleToAST(prequel.action_()!, ast);
            }
        });
    }

    public static convertRulesToAST(rules: RulesContext, ast: GrammarAST): void {
        const rulesRoot = this.createVirtualASTNode(GrammarAST, ANTLRv4Lexer.RULES, rules, "RULES");
        ast.addChild(rulesRoot);
        rules.ruleSpec().forEach((rule) => {
            this.convertRuleSpecToAST(rule, rulesRoot);
        });
    }

    public static convertModeSpecToAST(modeSpecs: ModeSpecContext[], ast: GrammarAST): void {
        if (modeSpecs.length > 0) {
            const mode = this.createASTNode(ANTLRv4Parser.MODE, modeSpecs[0].parent!);
            ast.addChild(mode);
            modeSpecs.forEach((modeSpec) => {
                const id = this.createASTNode(ANTLRv4Parser.ID, modeSpec.identifier());
                mode.addChild(id);
                modeSpec.lexerRuleSpec().forEach((lexerRule) => {
                    this.convertLexerRuleSpecToAST(lexerRule, mode);
                });
            });
        }
    }

    public static convertOptionsSpecToAST(optionsSpec: OptionsSpecContext, ast: GrammarAST): void {
        const options = this.createVirtualASTNode(GrammarAST, ANTLRv4Parser.OPTIONS, optionsSpec.OPTIONS(), "OPTIONS");
        ast.addChild(options);
        optionsSpec.option().forEach((option) => {
            const assign = this.createVirtualASTNode(GrammarAST, ANTLRv4Parser.ASSIGN, option, "=");
            options.addChild(assign);
            const id = this.createASTNode(ANTLRv4Parser.ID, option.identifier());
            assign.addChild(id);
            const value = this.createASTNode(ANTLRv4Parser.STRING_LITERAL, option.optionValue());
            assign.addChild(value);
        });

    }

    public static convertDelegateGrammarsToAST(delegateGrammars: DelegateGrammarsContext, ast: GrammarAST): GrammarAST {
        const delegate = this.createVirtualASTNode(GrammarAST, ANTLRv4Parser.IMPORT, delegateGrammars, "import");
        ast.addChild(delegate);
        delegateGrammars.delegateGrammar().forEach((dg) => {
            if (dg.ASSIGN()) {
                const assign = this.createASTNode(ANTLRv4Parser.ASSIGN, dg.ASSIGN()!);
                delegate.addChild(assign);

                assign.addChild(this.createASTNode(ANTLRv4Parser.ID, dg.identifier()[0]));
                assign.addChild(this.createASTNode(ANTLRv4Parser.ID, dg.identifier()[1]));
            } else {
                const id = this.createASTNode(ANTLRv4Parser.ID, dg.identifier()[0]);
                delegate.addChild(id);
            }
        });

        return delegate;
    }

    public static convertTokensSpec(tokensSpec: TokensSpecContext, ast: GrammarAST): void {
        if (tokensSpec.idList()) {
            const tokens = this.createVirtualASTNode(GrammarAST, ANTLRv4Parser.TOKENS, tokensSpec, "tokens");
            ast.addChild(tokens);

            tokensSpec.idList()!.identifier().forEach((id) => {
                tokens.addChild(this.createASTNode(ANTLRv4Parser.ID, id));
            });
        }

    }

    public static convertChannelsSpecToAST(channelsSpec: ChannelsSpecContext, ast: GrammarAST): void {
        if (channelsSpec.idList()) {
            const channels = this.createASTNode(ANTLRv4Parser.CHANNELS, channelsSpec);
            ast.addChild(channels);
            channelsSpec.idList()!.identifier().forEach((id) => {
                channels.addChild(this.createASTNode(ANTLRv4Parser.ID, id));
            });
        }
    }

    public static convertActionRuleToAST(actionRule: Action_Context, ast: GrammarAST): void {
        const action = this.createVirtualASTNode(GrammarAST, ANTLRv4Parser.AT, actionRule, "@");
        ast.addChild(action);

        if (actionRule.actionScopeName()) {
            action.addChild(this.createASTNode(ANTLRv4Parser.ID, actionRule.actionScopeName()!));
        }
        action.addChild(this.createASTNode(ANTLRv4Parser.ID, actionRule.identifier()));
        this.convertActionBlockToAST(ANTLRv4Lexer.ACTION, actionRule.actionBlock(), action);
    }

    public static convertAtomToAST(atom: AtomContext, ast: GrammarAST): GrammarAST | undefined {
        if (atom.terminalDef()) {
            return this.convertTerminalDefToAST(atom.terminalDef()!, ast);
        } else if (atom.ruleref()) {
            return this.convertRulerefToAST(atom.ruleref()!, ast);
        } else if (atom.notSet()) {
            return this.convertNotSetToAST(atom.notSet()!, ast);
        } else if (atom.DOT()) {
            return this.convertWildcardToAST(atom.DOT()!, atom.elementOptions(), ast);
        }

        return undefined;
    }

    public static convertBlockToAST(block: BlockContext, ast: GrammarAST): BlockAST {
        const blockAST = new BlockAST(ANTLRv4Parser.BLOCK, block.LPAREN().symbol, "BLOCK");
        ast.addChild(blockAST);

        if (block.optionsSpec()) {
            this.convertOptionsSpecToAST(block.optionsSpec()!, blockAST);
        }

        block.ruleAction().forEach((ruleAction) => {
            this.convertRuleActionToAST(ruleAction, blockAST);
        });

        this.convertAltListToAST(block.altList(), blockAST);

        const options = blockAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (options) {
            Grammar.setNodeOptions(blockAST, options);
        }

        return blockAST;
    }

    public static convertEbnfSuffixToAST(ebnfSuffix: EbnfSuffixContext, ast: GrammarAST): GrammarAST | undefined {
        let blockAST;
        if (ebnfSuffix.QUESTION().length > 0) {
            blockAST = new OptionalBlockAST(ANTLRv4Lexer.OPTIONAL, this.createToken(ANTLRv4Lexer.OPTIONAL, ebnfSuffix),
                ebnfSuffix.QUESTION().length === 1);
        } else if (ebnfSuffix.STAR()) {
            blockAST = new StarBlockAST(ANTLRv4Parser.CLOSURE, this.createToken(ANTLRv4Parser.STAR, ebnfSuffix),
                ebnfSuffix.QUESTION().length === 0);
        } else if (ebnfSuffix.PLUS()) {
            blockAST = new PlusBlockAST(ANTLRv4Parser.POSITIVE_CLOSURE,
                this.createToken(ANTLRv4Parser.PLUS, ebnfSuffix), ebnfSuffix.QUESTION().length === 0);
        }

        ast.addChild(blockAST);

        return blockAST;
    }

    public static convertEbnfToAST(ebnf: EbnfContext, ast: GrammarAST): GrammarAST | undefined {
        if (ebnf.blockSuffix()) {
            const root = this.convertEbnfSuffixToAST(ebnf.blockSuffix()!.ebnfSuffix(), ast);
            if (root) {
                this.convertBlockToAST(ebnf.block(), root);
            }

            return root;
        } else {
            return this.convertBlockToAST(ebnf.block(), ast);
        }
    }

    public static convertActionBlockToAST(astType: number, actionBlock: ParserRuleContext,
        ast: GrammarAST): ActionAST {
        const text = actionBlock.getText(); // Remove outer [].
        const token = this.createToken(astType, actionBlock, text);
        const actionAST = new ActionAST(token);
        ast.addChild(actionAST);

        return actionAST;
    }

    public static convertArgActionBlockToAST(astType: number, actionBlock: ParserRuleContext,
        ast: GrammarAST): ActionAST {
        const text = actionBlock.getText(); // Remove outer [].
        const token = this.createToken(astType, actionBlock, text.substring(1, text.length - 1));
        const actionAST = new ActionAST(token);
        ast.addChild(actionAST);

        return actionAST;
    }

    public static convertPredicateOptionsToAST(options: PredicateOptionsContext, ast: GrammarAST): void {
        // Predicate options are new in ANTLR4. Previously only element options existed. For left recursive rules
        // they were introduced to support more than what element options do (namely actions and numbers on the RHS).
        // The general syntax of both is the same (`<lhs = rhs>`). To allow easy use in the tree walkers we convert
        // them to element options here.
        const predicateOptions = this.createASTNode(ANTLRv4Lexer.ELEMENT_OPTIONS, options);
        ast.addChild(predicateOptions);

        options.predicateOption().forEach((option) => {
            if (option.elementOption()) {
                this.convertElementOptionToAST(option.elementOption()!, predicateOptions);
            } else if (option.ASSIGN()) {
                const assign = this.createASTNode(ANTLRv4Parser.ASSIGN, option);
                predicateOptions.addChild(assign);
                const id = this.createASTNode(ANTLRv4Parser.ID, option.identifier()!);
                assign.addChild(id);

                if (option.actionBlock()) {
                    this.convertActionBlockToAST(ANTLRv4Lexer.ACTION, option.actionBlock()!, assign);
                } else if (option.INT()) {
                    const int = this.createASTNode(ANTLRv4Parser.INT, option.INT()!);
                    assign.addChild(int);
                } else if (option.STRING_LITERAL()) {
                    const string = this.createASTNode(ANTLRv4Parser.STRING_LITERAL, option.STRING_LITERAL()!);
                    assign.addChild(string);
                }
            } else {
                const id = this.createASTNode(ANTLRv4Parser.ID, option.identifier()!);
                predicateOptions.addChild(id);
            }
        });
    }

    public static convertLexerRuleSpecToAST(lexerRule: LexerRuleSpecContext, ast: GrammarAST): RuleAST {
        const ruleAST = this.createVirtualASTNode(RuleAST, ANTLRv4Lexer.RULE, lexerRule, "RULE");
        ast.addChild(ruleAST);
        ruleAST.addChild(this.createASTNode(ANTLRv4Parser.TOKEN_REF, lexerRule.TOKEN_REF()));

        if (lexerRule.FRAGMENT()) {
            const ruleModifiers = this.createASTNode(ANTLRv4Lexer.RULEMODIFIERS, lexerRule.FRAGMENT()!);
            ruleAST.addChild(ruleModifiers);

            ruleModifiers.addChild(this.createASTNode(ANTLRv4Parser.FRAGMENT, lexerRule.FRAGMENT()!));
        }

        if (lexerRule.optionsSpec()) {
            this.convertOptionsSpecToAST(lexerRule.optionsSpec()!, ruleAST);
        }

        this.convertLexerRuleBlockToAST(lexerRule.lexerRuleBlock(), ruleAST);

        return ruleAST;
    }

    public static convertLexerRuleBlockToAST(lexerRuleBlock: LexerRuleBlockContext, ast: GrammarAST): void {
        const colon = (lexerRuleBlock.parent as LexerRuleSpecContext).COLON();
        const blockAST = this.createVirtualASTNode(BlockAST, ANTLRv4Lexer.BLOCK, colon, "BLOCK");
        ast.addChild(blockAST);

        lexerRuleBlock.lexerAltList().lexerAlt().forEach((lexerAlt) => {
            this.convertLexerAltToAST(lexerAlt, blockAST);
        });

        const options = blockAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (options) {
            Grammar.setNodeOptions(blockAST, options);
        }

    }

    public static convertLexerAltToAST(lexerAlt: LexerAltContext, ast: GrammarAST): void {
        if (lexerAlt.lexerElements()) {
            if (lexerAlt.lexerCommands()) {
                const altAST = this.createVirtualASTNode(AltAST, ANTLRv4Lexer.LEXER_ALT_ACTION,
                    lexerAlt.lexerCommands()!, "LEXER_ALT_ACTION");
                ast.addChild(altAST);

                this.convertLexerElementsToAST(lexerAlt.lexerElements()!, altAST);
                this.convertLexerCommandsToAST(lexerAlt.lexerCommands()!, altAST);
            } else {
                this.convertLexerElementsToAST(lexerAlt.lexerElements()!, ast);
            }
        }
    }

    public static convertLexerElementsToAST(lexerElements: LexerElementsContext, ast: GrammarAST): void {
        const altAST = this.createVirtualASTNode(AltAST, ANTLRv4Lexer.ALT, lexerElements, "ALT");
        ast.addChild(altAST);

        if (lexerElements.lexerElement.length === 0) {
            // Empty alt.
            altAST.addChild(this.createASTNode(ANTLRv4Lexer.EPSILON, lexerElements));
        } else {
            lexerElements.lexerElement().forEach((lexerElement) => {
                this.convertLexerElementToAST(lexerElement, altAST);
            });
        }
    }

    public static convertLexerElementToAST(lexerElement: LexerElementContext, ast: GrammarAST): GrammarAST | undefined {
        if (lexerElement.lexerAtom()) {
            if (lexerElement.ebnfSuffix()) {
                const ebnfSuffixAST = this.convertEbnfSuffixToAST(lexerElement.ebnfSuffix()!, ast);
                if (ebnfSuffixAST) {
                    const blockAST = this.createVirtualASTNode(BlockAST, ANTLRv4Parser.BLOCK, lexerElement.lexerAtom()!,
                        "BLOCK");
                    ebnfSuffixAST.addChild(blockAST);
                    const altAST = this.createVirtualASTNode(AltAST, ANTLRv4Lexer.ALT, lexerElement.lexerAtom()!,
                        "ALT");
                    blockAST.addChild(altAST);
                    this.convertLexerAtomToAST(lexerElement.lexerAtom()!, altAST);
                }

                return ebnfSuffixAST;
            } else {
                return this.convertLexerAtomToAST(lexerElement.lexerAtom()!, ast);
            }
        } else if (lexerElement.lexerBlock()) {
            if (lexerElement.ebnfSuffix()) {
                const ebnfSuffixAST = this.convertEbnfSuffixToAST(lexerElement.ebnfSuffix()!, ast);
                if (ebnfSuffixAST) {
                    this.convertLexerBlockToAST(lexerElement.lexerBlock()!, ebnfSuffixAST);
                }

                return ebnfSuffixAST;
            } else {
                return this.convertLexerBlockToAST(lexerElement.lexerBlock()!, ast);
            }
        } else if (lexerElement.actionBlock()) {
            return this.convertActionBlockToAST(ANTLRv4Lexer.ACTION, lexerElement.actionBlock()!, ast);
        }

        return undefined;
    }

    public static convertElementOptionsToAST(elementOptions: ElementOptionsContext, ast: GrammarAST): void {
        const options = this.createVirtualASTNode(GrammarAST, ANTLRv4Lexer.ELEMENT_OPTIONS, elementOptions,
            "ELEMENT_OPTIONS");
        elementOptions.elementOption().forEach((elementOption) => {
            this.convertElementOptionToAST(elementOption, options);
        });

        ast.addChild(options);
    }

    public static convertElementOptionToAST(elementOption: ElementOptionContext, ast: GrammarAST): void {
        if (elementOption.ASSIGN()) {
            const assign = this.createASTNode(ANTLRv4Parser.ASSIGN, elementOption.ASSIGN()!);
            ast.addChild(assign);

            const id = this.createASTNode(ANTLRv4Parser.ID, elementOption.identifier()!);
            assign.addChild(id);

            if (elementOption.STRING_LITERAL()) {
                const value = this.createASTNode(ANTLRv4Parser.STRING_LITERAL, elementOption.STRING_LITERAL()!);
                assign.addChild(value);
            } else if (elementOption.INT()) {
                const value = this.createASTNode(ANTLRv4Parser.INT, elementOption.INT()!);
                assign.addChild(value);
            } else {
                const id = this.createASTNode(ANTLRv4Parser.ID, elementOption.qualifiedIdentifier()!);
                assign.addChild(id);
            }
        } else {
            ast.addChild(this.createASTNode(ANTLRv4Parser.ID, elementOption));
        }
    }

    public static convertLexerCommandsToAST(lexerCommands: LexerCommandsContext, ast: GrammarAST): void {
        lexerCommands.lexerCommand().forEach((lexerCommand) => {
            this.convertLexerCommandToAST(lexerCommand, ast);
        });
    }

    public static convertLexerCommandToAST(lexerCommand: LexerCommandContext, ast: GrammarAST): void {
        if (lexerCommand.lexerCommandExpr()) {
            const callAST = this.createASTNode(ANTLRv4Lexer.LEXER_ACTION_CALL, lexerCommand);
            callAST.addChild(this.createASTNode(ANTLRv4Parser.ID, lexerCommand.lexerCommandName()));
            callAST.addChild(this.createASTNode(ANTLRv4Parser.STRING_LITERAL, lexerCommand.lexerCommandExpr()!));
        } else {
            ast.addChild(this.createASTNode(ANTLRv4Parser.ID, lexerCommand.lexerCommandName()));
        }
    }

    public static convertTerminalDefToAST(terminalDef: TerminalDefContext, ast: GrammarAST): GrammarAST | undefined {
        let terminalAST: GrammarAST | undefined;
        if (terminalDef.TOKEN_REF()) {
            const token = this.createToken(ANTLRv4Parser.TOKEN_REF, terminalDef.TOKEN_REF()!);
            terminalAST = new TerminalAST(token);
        } else if (terminalDef.STRING_LITERAL()) {
            const token = this.createToken(ANTLRv4Parser.STRING_LITERAL, terminalDef.STRING_LITERAL()!);
            terminalAST = new TerminalAST(token);
        }

        if (terminalAST) {
            ast.addChild(terminalAST);

            if (terminalDef.elementOptions()) {
                this.convertElementOptionsToAST(terminalDef.elementOptions()!, terminalAST);
            }

            const options = terminalAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
            if (options) {
                Grammar.setNodeOptions(terminalAST, options);
            }
        }

        return terminalAST;
    }

    public static convertNotSetToAST(notSet: NotSetContext, ast: GrammarAST): NotAST {
        const notAST = new NotAST(ANTLRv4Parser.NOT);
        notAST.setText("~");
        ast.addChild(notAST);

        if (notSet.setElement()) {
            const setAST = new SetAST(ANTLRv4Lexer.SET, notSet.start!, "SET");
            notAST.addChild(setAST);

            this.convertSetElementToAST(notSet.setElement()!, setAST);
        } else if (notSet.blockSet()) {
            this.convertBlockSetToAST(notSet.blockSet()!, notAST);
        }

        return notAST;
    }

    public static convertSetElementToAST(setElement: SetElementContext, ast: GrammarAST): GrammarAST | undefined {
        if (setElement.TOKEN_REF()) {
            const terminalAST = new TerminalAST(this.createToken(ANTLRv4Parser.TOKEN_REF, setElement.TOKEN_REF()!));
            ast.addChild(terminalAST);

            if (setElement.elementOptions()) {
                this.convertElementOptionsToAST(setElement.elementOptions()!, terminalAST);
            }

            return terminalAST;
        } else if (setElement.STRING_LITERAL()) {
            const literalAST = new TerminalAST(this.createToken(ANTLRv4Parser.STRING_LITERAL,
                setElement.STRING_LITERAL()!));
            ast.addChild(literalAST);

            if (setElement.elementOptions()) {
                this.convertElementOptionsToAST(setElement.elementOptions()!, literalAST);
            }

            return literalAST;
        } else if (setElement.characterRange()) {
            return this.convertCharacterRangeToAST(setElement.characterRange()!, ast);
        } else if (setElement.LEXER_CHAR_SET()) {
            const set = this.createASTNode(ANTLRv4Parser.LEXER_CHAR_SET, setElement.LEXER_CHAR_SET()!);
            ast.addChild(set);

            return set;
        }

        return undefined;
    }

    public static convertBlockSetToAST(blockSet: BlockSetContext, ast: GrammarAST): SetAST {
        const setAST = new SetAST(ANTLRv4Lexer.SET, blockSet.start!, "SET");
        ast.addChild(setAST);

        blockSet.setElement().forEach((setElement) => {
            this.convertSetElementToAST(setElement, setAST);
        });

        return setAST;
    }

    public static convertLexerAtomToAST(lexerAtom: LexerAtomContext, ast: GrammarAST): GrammarAST | undefined {
        if (lexerAtom.characterRange()) {
            return this.convertCharacterRangeToAST(lexerAtom.characterRange()!, ast);
        } else if (lexerAtom.terminalDef()) {
            return this.convertTerminalDefToAST(lexerAtom.terminalDef()!, ast);
        } else if (lexerAtom.notSet()) {
            return this.convertNotSetToAST(lexerAtom.notSet()!, ast);
        } else if (lexerAtom.LEXER_CHAR_SET()) {
            const set = this.createASTNode(ANTLRv4Parser.LEXER_CHAR_SET, lexerAtom.LEXER_CHAR_SET()!);
            ast.addChild(set);

            return set;
        } else if (lexerAtom.DOT()) {
            return this.convertWildcardToAST(lexerAtom.DOT()!, lexerAtom.elementOptions(), ast);
        }

        return undefined;
    }

    public static convertCharacterRangeToAST(characterRange: CharacterRangeContext, ast: GrammarAST): GrammarAST {
        const range = this.createVirtualASTNode(RangeAST, ANTLRv4Parser.RANGE, characterRange, "..");
        ast.addChild(range);

        characterRange.STRING_LITERAL().forEach((string) => {
            const literalAST = new TerminalAST(this.createToken(ANTLRv4Parser.STRING_LITERAL, string));
            range.addChild(literalAST);
        });

        return range;
    }

    public static convertWildcardToAST(dot: TerminalNode, elementOptions: ElementOptionsContext | null,
        ast: GrammarAST): TerminalAST {
        const dotAST = new TerminalAST(this.createToken(ANTLRv4Parser.DOT, dot));
        ast.addChild(dotAST);

        if (elementOptions) {
            this.convertElementOptionsToAST(elementOptions, dotAST);
        }

        const options = dotAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (options) {
            Grammar.setNodeOptions(dotAST, options);
        }

        return dotAST;
    }

    public static convertRuleActionToAST(ruleAction: RuleActionContext, ast: GrammarAST): GrammarAST {
        const action = this.createASTNode(ANTLRv4Parser.AT, ruleAction.AT());
        ast.addChild(action);

        action.addChild(this.createASTNode(ANTLRv4Parser.ID, ruleAction.identifier()));
        this.convertActionBlockToAST(ANTLRv4Lexer.ACTION, ruleAction.actionBlock(), action);

        return action;
    }

    public static convertAltListToAST(altList: AltListContext, ast: GrammarAST): GrammarAST {
        altList.alternative().forEach((alternative) => {
            this.convertAlternativeToAST(alternative, ast);
        });

        return ast;
    }

    public static convertAlternativeToAST(alternative: AlternativeContext, ast: GrammarAST): AltAST | undefined {
        const altAST = this.createVirtualASTNode(AltAST, ANTLRv4Lexer.ALT, alternative, "ALT");
        ast.addChild(altAST);

        if (alternative.elementOptions()) {
            this.convertElementOptionsToAST(alternative.elementOptions()!, altAST);

            return altAST;
        }

        if (alternative.element().length === 0) {
            // Empty alt.
            altAST.addChild(this.createASTNode(ANTLRv4Lexer.EPSILON, alternative));
        } else {
            alternative.element().forEach((element) => {
                this.convertElementToAST(element, altAST);
            });
        }

        const options = altAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (options) {
            Grammar.setNodeOptions(altAST, options);
        }

        return altAST;
    }

    public static convertElementToAST(element: ElementContext, ast: GrammarAST): GrammarAST | undefined {
        if (element.labeledElement()) {
            if (element.ebnfSuffix()) {
                const ebnfAST = this.convertEbnfSuffixToAST(element.ebnfSuffix()!, ast);
                if (ebnfAST) {
                    const blockAST = this.createVirtualASTNode(BlockAST, ANTLRv4Lexer.BLOCK, element.labeledElement()!,
                        "BLOCK");
                    ebnfAST.addChild(blockAST);

                    const altAST = this.createVirtualASTNode(AltAST, ANTLRv4Lexer.ALT, element.labeledElement()!,
                        "ALT");
                    blockAST.addChild(altAST);
                    this.convertLabeledElementToAST(element.labeledElement()!, altAST);

                    return ebnfAST;
                }
            } else {
                return this.convertLabeledElementToAST(element.labeledElement()!, ast);
            }
        } else if (element.atom()) {
            if (element.ebnfSuffix()) {
                const ebnfAST = this.convertEbnfSuffixToAST(element.ebnfSuffix()!, ast);
                if (ebnfAST) {
                    const blockAST = this.createVirtualASTNode(BlockAST, ANTLRv4Lexer.BLOCK, element.atom()!, "BLOCK");
                    ebnfAST.addChild(blockAST);

                    const altAST = this.createVirtualASTNode(AltAST, ANTLRv4Lexer.ALT, element.atom()!, "ALT");
                    blockAST.addChild(altAST);
                    this.convertAtomToAST(element.atom()!, altAST);
                }

                return ebnfAST;
            } else {
                return this.convertAtomToAST(element.atom()!, ast);
            }
        } else if (element.ebnf()) {
            return this.convertEbnfToAST(element.ebnf()!, ast);
        } else if (element.actionBlock()) {
            const actionAST = this.convertActionBlockToAST(ANTLRv4Lexer.ACTION, element.actionBlock()!, ast);

            if (element.predicateOptions()) {
                this.convertPredicateOptionsToAST(element.predicateOptions()!, actionAST);
            }

            const options = actionAST.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
            if (options) {
                Grammar.setNodeOptions(actionAST, options);
            }

            return actionAST;
        }

        return undefined;
    }

    public static convertLabeledElementToAST(labeledElement: LabeledElementContext, ast: GrammarAST): GrammarAST {
        let root;
        if (labeledElement.ASSIGN()) {
            root = this.createASTNode(ANTLRv4Parser.ASSIGN, labeledElement.ASSIGN()!);
        } else {
            root = this.createASTNode(ANTLRv4Parser.PLUS_ASSIGN, labeledElement.PLUS_ASSIGN()!);
        }
        ast.addChild(root);

        const id = this.createASTNode(ANTLRv4Parser.ID, labeledElement.identifier());
        root.addChild(id);

        // The label is the actual start of the element, so its start index the parent's start index.
        root.startIndex = id.startIndex;

        if (labeledElement.atom()) {
            this.convertAtomToAST(labeledElement.atom()!, root);
        } else if (labeledElement.block()) {
            this.convertBlockToAST(labeledElement.block()!, root);
        }

        return root;
    }

    public static convertLexerBlockToAST(lexerBlock: LexerBlockContext, ast: GrammarAST): BlockAST {
        const blockAST = this.createVirtualASTNode(BlockAST, ANTLRv4Lexer.BLOCK, lexerBlock.LPAREN(), "BLOCK");
        ast.addChild(blockAST);

        lexerBlock.lexerAltList().lexerAlt().forEach((lexerAlt) => {
            if (lexerAlt.lexerElements()) {
                let targetAST: GrammarAST;
                if (lexerAlt.lexerCommands()) {
                    const altAST = this.createVirtualASTNode(AltAST, ANTLRv4Lexer.LEXER_ALT_ACTION,
                        lexerAlt.lexerCommands()!, "ALT");
                    blockAST.addChild(altAST);
                    targetAST = altAST;
                } else {
                    targetAST = blockAST;
                }
                this.convertLexerElementsToAST(lexerAlt.lexerElements()!, targetAST);
            }
        });

        return blockAST;
    }

    public static createToken(type: number, context: ParserRuleContext | TerminalNode, text?: string): CommonToken {
        if (context instanceof ParserRuleContext) {
            const token = CommonToken.fromSource([context.start!.tokenSource, context.start!.inputStream], type,
                Constants.DEFAULT_TOKEN_CHANNEL, context.start!.start, context.start!.stop);
            token.tokenIndex = context.start!.tokenIndex;

            if (text) {
                token.text = text;
            }

            return token;
        }

        const symbol = context.symbol;

        const token = CommonToken.fromSource([symbol.tokenSource, symbol.inputStream], type,
            Constants.DEFAULT_TOKEN_CHANNEL, symbol.start, symbol.stop);
        token.tokenIndex = symbol.tokenIndex;
        token.text = text ?? symbol.text ?? "";

        return token;
    }

    public static createASTNode(astType: number, context: ParserRuleContext | TerminalNode): GrammarAST {
        const token = this.createToken(astType, context, context.getText());

        // The token determines the payload of the AST node as well as the start token index.
        const ast = new GrammarAST(token);

        // Set also the stop token index, if available.
        if (context instanceof ParserRuleContext) {
            ast.stopIndex = context.stop!.tokenIndex;
        }

        return ast;
    }

    public static createVirtualASTNode<T extends GrammarAST>(c: Constructor<T>, astType: number,
        ref: ParserRuleContext | TerminalNode, text?: string): T {

        const sourceToken = ref instanceof ParserRuleContext ? ref.start! : ref.symbol;
        const source: [TokenSource | null, CharStream | null] = [sourceToken.tokenSource, sourceToken.inputStream];
        const token = CommonToken.fromSource(source, astType, Constants.DEFAULT_TOKEN_CHANNEL, sourceToken.start,
            sourceToken.stop);

        if (text) {
            token.text = text;
        }

        token.tokenIndex = sourceToken.tokenIndex;

        const ast = new c(token);

        if (ref instanceof ParserRuleContext) {
            ast.stopIndex = ref.stop!.tokenIndex;
        }

        return ast;
    }
}
