/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import {
    ActionTransition, ATN, ATNState, AtomTransition, BasicState, CodePointTransitions, CommonToken, HashMap,
    IntervalSet, IntStream, Lexer, LexerAction, LexerChannelAction, LexerCustomAction, LexerModeAction, LexerMoreAction,
    LexerPopModeAction, LexerPushModeAction, LexerSkipAction, LexerTypeAction, NotSetTransition, SetTransition, Token,
    TokensStartState, Transition
} from "antlr4ng";
import type { STGroup } from "stringtemplate4ts";

import { CodeGenerator } from "../codegen/CodeGenerator.js";
import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";
import { CharSupport } from "../misc/CharSupport.js";
import { EscapeSequenceParsing, ResultType } from "../misc/EscapeSequenceParsing.js";
import { format } from "../misc/helpers.js";
import { Character } from "../support/Character.js";
import { MurmurHash } from "../support/MurmurHash.js";
import { ErrorType } from "../tool/ErrorType.js";
import { LexerGrammar } from "../tool/LexerGrammar.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { GrammarAST } from "../tool/ast/GrammarAST.js";
import { RangeAST } from "../tool/ast/RangeAST.js";
import { TerminalAST } from "../tool/ast/TerminalAST.js";
import type { CommonTree } from "../tree/CommonTree.js";
import { ATNOptimizer } from "./ATNOptimizer.js";
import { CharactersDataCheckStatus } from "./CharactersDataCheckStatus.js";
import type { IStatePair } from "./IATNFactory.js";
import { ParserATNFactory } from "./ParserATNFactory.js";
import { RangeBorderCharactersData } from "./RangeBorderCharactersData.js";

enum Mode {
    None,
    Error,
    PrevCodePoint,
    PrevProperty,
};

export class LexerATNFactory extends ParserATNFactory {

    /**
     * Provides a map of names of predefined constants which are likely to
     * appear as the argument for lexer commands. These names are required during code generation for creating
     * {@link LexerAction} instances that are usable by a lexer interpreter.
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

    public static CharSetParseState = class CharSetParseState {

        public static readonly NONE = new CharSetParseState(Mode.None, false, -1, new IntervalSet());
        public static readonly ERROR = new CharSetParseState(Mode.Error, false, -1, new IntervalSet());

        public readonly mode: Mode;
        public readonly inRange: boolean;
        public readonly prevCodePoint: number;
        public readonly prevProperty: IntervalSet;

        public constructor(mode: Mode, inRange: boolean, prevCodePoint: number, prevProperty: IntervalSet) {
            this.mode = mode;
            this.inRange = inRange;
            this.prevCodePoint = prevCodePoint;
            this.prevProperty = prevProperty;
        }

        public toString(): string {
            return format("%s mode=%s inRange=%s prevCodePoint=%d prevProperty=%s", String(this), this.mode,
                this.inRange, this.prevCodePoint, this.prevProperty);
        }

        public equals(other: object): boolean {
            if (!(other instanceof CharSetParseState)) {
                return false;
            }

            const that = other;
            if (this === that) {
                return true;
            }

            return this.mode === that.mode &&
                this.inRange === that.inRange &&
                this.prevCodePoint === that.prevCodePoint &&
                this.prevProperty.equals(that.prevProperty);
        }

        public hashCode(): number {
            let hash = MurmurHash.initialize();
            hash = MurmurHash.update(hash, this.mode);
            hash = MurmurHash.update(hash, this.inRange);
            hash = MurmurHash.update(hash, this.prevCodePoint);
            hash = MurmurHash.update(hash, this.prevProperty);
            hash = MurmurHash.finish(hash, 4);

            return hash;
        }

    };

    public codegenTemplates: STGroup;

    /**
     * Maps from an action index to a {@link LexerAction} object.
     */
    protected indexToActionMap = new Map<number, LexerAction>();

    /**
     * Maps from a {@link LexerAction} object to the action index.
     */
    private actionToIndexMap = new HashMap<LexerAction, number>();

    private readonly ruleCommands = new Array<string>();

    public constructor(g: LexerGrammar, codeGenerator?: CodeGenerator) {
        super(g);

        // use codegen to get correct language templates for lexer commands
        codeGenerator ??= new CodeGenerator(g);
        this.codegenTemplates = codeGenerator.getTemplates();
    }

    public static getCommonConstants(): Map<string, number> {
        return LexerATNFactory.COMMON_CONSTANTS;
    }

    public override createATN(): ATN {
        // BUILD ALL START STATES (ONE PER MODE)
        for (const [modeName] of (this.g as LexerGrammar).modes) {
            // create s0, start state; implied Tokens rule node
            const startState = this.newState(TokensStartState);
            this.atn.modeNameToStartState.set(modeName, startState);
            this.atn.modeToStartState.push(startState);
            this.atn.defineDecisionState(startState);
        }

        // INIT ACTION, RULE->TOKEN_TYPE MAP
        this.atn.ruleToTokenType = new Array<number>(this.g.rules.size);
        for (const r of this.g.rules.values()) {
            this.atn.ruleToTokenType[r.index] = this.g.getTokenType(r.name);
        }

        // CREATE ATN FOR EACH RULE
        this._createATN(Array.from(this.g.rules.values()));

        this.atn.lexerActions = new Array<LexerAction>(this.indexToActionMap.size);
        for (const [index, value] of this.indexToActionMap.entries()) {
            this.atn.lexerActions[index] = value;
        }

        // LINK MODE START STATE TO EACH TOKEN RULE
        for (const [modeName] of (this.g as LexerGrammar).modes) {
            const rules = (this.g as LexerGrammar).modes.get(modeName)!;
            const startState = this.atn.modeNameToStartState.get(modeName) ?? null;
            for (const r of rules) {
                if (!r.isFragment()) {
                    const s = this.atn.ruleToStartState[r.index]!;
                    this.epsilon(startState, s);
                }
            }
        }

        ATNOptimizer.optimize(this.g, this.atn);
        this.checkEpsilonClosure();

        return this.atn;
    }

    public override rule(ruleAST: GrammarAST, name: string, blk: IStatePair): IStatePair {
        this.ruleCommands.splice(0, this.ruleCommands.length);

        return super.rule(ruleAST, name, blk);
    }

    public override action(action: ActionAST | string): IStatePair;
    public override action(node: GrammarAST, lexerAction: LexerAction): IStatePair;
    public override action(...args: unknown[]): IStatePair {
        let node;
        let lexerAction;

        if (args.length === 1) {
            if (typeof args[0] === "string") {
                const [action] = args as [string];

                if (action.trim().length === 0) {
                    const left = this.newState(BasicState);
                    const right = this.newState(BasicState);
                    this.epsilon(left, right);

                    return { left, right };
                }

                // define action AST for this rule as if we had found in grammar
                node = new ActionAST(CommonToken.fromType(ANTLRv4Parser.BEGIN_ACTION, action));
                this.currentRule!.defineActionInAlt(this.currentOuterAlt, node);
            } else {
                [node] = args as [ActionAST];
            }

            const ruleIndex = this.currentRule!.index;
            const actionIndex = this.g.lexerActions.get(node)!;
            lexerAction = new LexerCustomAction(ruleIndex, actionIndex);
        } else {
            [node, lexerAction] = args as [GrammarAST, LexerAction];
        }

        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        const isCtxDependent = false;
        const lexerActionIndex = this.getLexerActionIndex(lexerAction);
        const a = new ActionTransition(right, this.currentRule!.index, lexerActionIndex, isCtxDependent);
        left.addTransition(a);
        node.atnState = left;

        return { left, right };
    }

    public override lexerAltCommands(alt: IStatePair, commands: IStatePair): IStatePair {
        const h = { left: alt.left, right: commands.right };
        this.epsilon(alt.right, commands.left!);

        return h;
    }

    public override lexerCallCommand(id: GrammarAST, arg: GrammarAST): IStatePair {
        return this.lexerCallCommandOrCommand(id, arg);
    }

    public override lexerCommand(id: GrammarAST): IStatePair {
        return this.lexerCallCommandOrCommand(id, null);
    }

    public override range(a: GrammarAST, b: GrammarAST): IStatePair {
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        const t1 = CharSupport.getCharValueFromGrammarCharLiteral(a.getText());
        const t2 = CharSupport.getCharValueFromGrammarCharLiteral(b.getText());
        if (this.checkRange(a, b, t1, t2)) {
            left.addTransition(this.createTransition(right, t1, t2, a));
        }
        a.atnState = left;
        b.atnState = left;

        return { left, right };
    }

    public override set(associatedAST: GrammarAST, alts: GrammarAST[], invert: boolean): IStatePair {
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        const set = new IntervalSet();
        for (const t of alts) {
            if (t.getType() === ANTLRv4Parser.RANGE) {
                const a = CharSupport.getCharValueFromGrammarCharLiteral(t.getChild(0)!.getText());
                const b = CharSupport.getCharValueFromGrammarCharLiteral(t.getChild(1)!.getText());
                if (this.checkRange(t.getChild(0) as GrammarAST, t.getChild(1) as GrammarAST, a, b)) {
                    this.checkRangeAndAddToSet(associatedAST, t, set, a, b, this.currentRule!.caseInsensitive, null);
                }
            } else {
                if (t.getType() === ANTLRv4Parser.LEXER_CHAR_SET) {
                    set.addSet(this.getSetFromCharSetLiteral(t));
                } else {
                    if (t.getType() === ANTLRv4Parser.STRING_LITERAL) {
                        const c = CharSupport.getCharValueFromGrammarCharLiteral(t.getText());
                        if (c !== -1) {
                            this.checkCharAndAddToSet(associatedAST, set, c);
                        } else {
                            this.g.tool.errorManager.grammarError(ErrorType.INVALID_LITERAL_IN_LEXER_SET,
                                this.g.fileName, t.token!, t.getText());
                        }
                    } else {
                        if (t.getType() === ANTLRv4Parser.TOKEN_REF) {
                            this.g.tool.errorManager.grammarError(ErrorType.UNSUPPORTED_REFERENCE_IN_LEXER_SET,
                                this.g.fileName, t.token!, t.getText());
                        }
                    }
                }
            }
        }

        if (invert) {
            left.addTransition(new NotSetTransition(right, set));
        } else {
            let transition: Transition;
            const intervals = Array.from(set);
            if (intervals.length === 1) {
                const interval = intervals[0];
                transition = CodePointTransitions.createWithCodePointRange(right, interval.start, interval.stop);
            } else {
                transition = new SetTransition(right, set);
            }

            left.addTransition(transition);
        }
        associatedAST.atnState = left;

        return { left, right };
    }

    /**
     * For a lexer, a string is a sequence of char to match.  That is,
     *  "fog" is treated as 'f' 'o' 'g' not as a single transition in
     *  the DFA.  Machine== o-'f'->o-'o'->o-'g'->o and has n+1 states
     *  for n characters.
     *  if "caseInsensitive" option is enabled, "fog" will be treated as
     *  o-('f'|'F') -> o-('o'|'O') -> o-('g'|'G')
     */
    public override stringLiteral(stringLiteralAST: TerminalAST): IStatePair {
        const chars = stringLiteralAST.getText();
        const left = this.newState(BasicState);
        let right: ATNState | null;
        const s = CharSupport.getStringFromGrammarStringLiteral(chars, this.g, stringLiteralAST.token);
        if (s === null) {
            return { left, right: left };
        }

        let prev = left;
        right = null;
        for (const char of s) {
            right = this.newState(BasicState);
            const codePoint = char.codePointAt(0)!;
            prev.addTransition(this.createTransition(right, codePoint, codePoint, stringLiteralAST));
            prev = right;
        }
        stringLiteralAST.atnState = left;

        return { left, right };
    }

    /** [Aa\t \u1234a-z\]\p{Letter}\-] char sets */
    public override charSetLiteral(charSetAST: GrammarAST): IStatePair {
        const left = this.newState(BasicState);
        const right = this.newState(BasicState);
        const set = this.getSetFromCharSetLiteral(charSetAST);

        left.addTransition(new SetTransition(right, set));
        charSetAST.atnState = left;

        return { left, right };
    }

    public getSetFromCharSetLiteral(charSetAST: GrammarAST): IntervalSet {
        let text = charSetAST.getText();
        text = text.substring(1, text.length - 1);
        const set = new IntervalSet();
        let state = LexerATNFactory.CharSetParseState.NONE;

        for (let i = 0; i < text.length;) {
            if (state.mode === Mode.Error) {
                return new IntervalSet();
            }

            const c = text.codePointAt(i)!;
            let offset = Character.charCount(c);
            if (c === 0x5C) { // \
                const escapeParseResult = EscapeSequenceParsing.parseEscape(text, i);

                switch (escapeParseResult.type) {
                    case ResultType.Invalid: {
                        const invalid = text.substring(escapeParseResult.startOffset,
                            escapeParseResult.startOffset + escapeParseResult.parseLength);
                        this.g.tool.errorManager.grammarError(ErrorType.INVALID_ESCAPE_SEQUENCE,
                            this.g.fileName, charSetAST.token!, invalid);
                        state = LexerATNFactory.CharSetParseState.ERROR;

                        break;
                    }

                    case ResultType.CodePoint: {
                        state = this.applyPrevStateAndMoveToCodePoint(charSetAST, set, state,
                            escapeParseResult.codePoint);

                        break;
                    }

                    case ResultType.Property: {
                        state = this.applyPrevStateAndMoveToProperty(charSetAST, set, state,
                            escapeParseResult.propertyIntervalSet);

                        break;
                    }

                    default:

                }
                offset = escapeParseResult.parseLength;
            } else {
                if (c === 0x2D && !state.inRange && i !== 0 && i !== text.length - 1 && state.mode !== Mode.None) {
                    if (state.mode === Mode.PrevProperty) {
                        this.g.tool.errorManager.grammarError(ErrorType.UNICODE_PROPERTY_NOT_ALLOWED_IN_RANGE,
                            this.g.fileName, charSetAST.token!, charSetAST.getText());
                        state = LexerATNFactory.CharSetParseState.ERROR;
                    } else {
                        state = new LexerATNFactory.CharSetParseState(state.mode, true, state.prevCodePoint,
                            state.prevProperty);
                    }
                } else {
                    state = this.applyPrevStateAndMoveToCodePoint(charSetAST, set, state, c);
                }
            }

            i += offset;
        }

        if (state.mode === Mode.Error) {
            return new IntervalSet();
        }

        // Whether or not we were in a range, we'll add the last code point found to the set.
        this.applyPrevState(charSetAST, set, state);

        if (set.length === 0) {
            this.g.tool.errorManager.grammarError(ErrorType.EMPTY_STRINGS_AND_SETS_NOT_ALLOWED, this.g.fileName,
                charSetAST.token!, "[]");
        }

        return set;
    }

    public override tokenRef(node: TerminalAST): IStatePair | null {
        // Ref to EOF in lexer yields char transition on -1
        if (node.getText() === "EOF") {
            const left = this.newState(BasicState);
            const right = this.newState(BasicState);
            left.addTransition(new AtomTransition(right, IntStream.EOF));

            return { left, right };
        }

        return this._ruleRef(node);
    }

    protected getLexerActionIndex(lexerAction: LexerAction): number {
        let lexerActionIndex = this.actionToIndexMap.get(lexerAction);
        if (lexerActionIndex === undefined) {
            lexerActionIndex = this.actionToIndexMap.size;
            this.actionToIndexMap.set(lexerAction, lexerActionIndex);
            this.indexToActionMap.set(lexerActionIndex, lexerAction);
        }

        return lexerActionIndex;
    }

    protected checkRange(leftNode: GrammarAST, rightNode: GrammarAST, leftValue: number, rightValue: number): boolean {
        let result = true;
        if (leftValue === -1) {
            result = false;
            this.g.tool.errorManager.grammarError(ErrorType.INVALID_LITERAL_IN_LEXER_SET,
                this.g.fileName, leftNode.token!, leftNode.getText());
        }

        if (rightValue === -1) {
            result = false;
            this.g.tool.errorManager.grammarError(ErrorType.INVALID_LITERAL_IN_LEXER_SET,
                this.g.fileName, rightNode.token!, rightNode.getText());
        }

        if (!result) {
            return false;
        }

        if (rightValue < leftValue) {
            this.g.tool.errorManager.grammarError(ErrorType.EMPTY_STRINGS_AND_SETS_NOT_ALLOWED,
                this.g.fileName, leftNode.parent!.token!, leftNode.getText() + ".." + rightNode.getText());

            return false;
        }

        return true;
    }

    private lexerCallCommandOrCommand(id: GrammarAST, arg: GrammarAST | null): IStatePair {
        const lexerAction = this.createLexerAction(id, arg);
        if (lexerAction !== null) {
            return this.action(id, lexerAction);
        }

        // fall back to standard action generation for the command
        const cmdST = this.codegenTemplates.getInstanceOf("Lexer" + CharSupport.capitalize(id.getText()) +
            "Command");
        if (cmdST === null) {
            this.g.tool.errorManager.grammarError(ErrorType.INVALID_LEXER_COMMAND, this.g.fileName, id.token!,
                id.getText());

            return this.epsilon(id);
        }

        const callCommand = arg !== null;
        const containsArg = cmdST.impl?.formalArguments?.has("arg") ?? false;
        if (callCommand !== containsArg) {
            const errorType = callCommand
                ? ErrorType.UNWANTED_LEXER_COMMAND_ARGUMENT
                : ErrorType.MISSING_LEXER_COMMAND_ARGUMENT;
            this.g.tool.errorManager.grammarError(errorType, this.g.fileName, id.token!, id.getText());

            return this.epsilon(id);
        }

        if (callCommand) {
            cmdST.add("arg", arg.getText());
            cmdST.add("grammar", arg.g);
        }

        return this.action(cmdST.render());
    }

    private applyPrevStateAndMoveToCodePoint(
        charSetAST: GrammarAST,
        set: IntervalSet,
        state: LexerATNFactory.CharSetParseState,
        codePoint: number): LexerATNFactory.CharSetParseState {
        if (state.inRange) {
            if (state.prevCodePoint > codePoint) {
                this.g.tool.errorManager.grammarError(
                    ErrorType.EMPTY_STRINGS_AND_SETS_NOT_ALLOWED,
                    this.g.fileName,
                    charSetAST.token!,
                    CharSupport.getRangeEscapedString(state.prevCodePoint, codePoint));
            }
            this.checkRangeAndAddToSet(charSetAST, set, state.prevCodePoint, codePoint);
            state = LexerATNFactory.CharSetParseState.NONE;
        } else {
            this.applyPrevState(charSetAST, set, state);
            state = new LexerATNFactory.CharSetParseState(Mode.PrevCodePoint, false, codePoint, new IntervalSet());
        }

        return state;
    }

    private applyPrevStateAndMoveToProperty(
        charSetAST: GrammarAST,
        set: IntervalSet,
        state: LexerATNFactory.CharSetParseState,
        property: IntervalSet): LexerATNFactory.CharSetParseState {
        if (state.inRange) {
            this.g.tool.errorManager.grammarError(ErrorType.UNICODE_PROPERTY_NOT_ALLOWED_IN_RANGE, this.g.fileName,
                charSetAST.token!, charSetAST.getText());

            return LexerATNFactory.CharSetParseState.ERROR;
        } else {
            this.applyPrevState(charSetAST, set, state);
            state = new LexerATNFactory.CharSetParseState(Mode.PrevProperty, false, -1, property);
        }

        return state;
    }

    private applyPrevState(charSetAST: GrammarAST, set: IntervalSet, state: LexerATNFactory.CharSetParseState): void {
        switch (state.mode) {
            case Mode.None:
            case Mode.Error: {
                break;
            }

            case Mode.PrevCodePoint: {
                this.checkCharAndAddToSet(charSetAST, set, state.prevCodePoint);
                break;
            }

            case Mode.PrevProperty: {
                set.addSet(state.prevProperty);
                break;
            }

            default:

        }
    }

    private checkCharAndAddToSet(ast: GrammarAST, set: IntervalSet, c: number): void {
        this.checkRangeAndAddToSet(ast, ast, set, c, c, this.currentRule!.caseInsensitive, null);
    }

    private checkRangeAndAddToSet(mainAst: GrammarAST, set: IntervalSet, a: number, b: number): void;
    private checkRangeAndAddToSet(rootAst: GrammarAST, ast: GrammarAST, set: IntervalSet, a: number, b: number,
        caseInsensitive: boolean, previousStatus: CharactersDataCheckStatus | null): CharactersDataCheckStatus;
    private checkRangeAndAddToSet(...args: unknown[]): void | CharactersDataCheckStatus {
        switch (args.length) {
            case 4: {
                const [mainAst, set, a, b] = args as [GrammarAST, IntervalSet, number, number];

                this.checkRangeAndAddToSet(mainAst, mainAst, set, a, b, this.currentRule!.caseInsensitive, null);

                break;
            }

            case 7: {
                const [rootAst, ast, set, a, b, caseInsensitive, previousStatus] =
                    args as [
                        GrammarAST, GrammarAST, IntervalSet, number, number, boolean, CharactersDataCheckStatus | null
                    ];

                let status: CharactersDataCheckStatus;
                const charactersData = RangeBorderCharactersData.getAndCheckCharactersData(a, b, this.g, ast,
                    !(previousStatus?.notImpliedCharacters ?? false));
                if (caseInsensitive) {
                    status = new CharactersDataCheckStatus(false, charactersData.mixOfLowerAndUpperCharCase);
                    if (charactersData.isSingleRange()) {
                        status = this.checkRangeAndAddToSet(rootAst, ast, set, a, b, false, status);
                    } else {
                        status = this.checkRangeAndAddToSet(rootAst, ast, set, charactersData.lowerFrom,
                            charactersData.lowerTo, false, status);
                        // Don't report similar warning twice
                        status = this.checkRangeAndAddToSet(rootAst, ast, set, charactersData.upperFrom,
                            charactersData.upperTo, false, status);
                    }
                } else {
                    let charactersCollision = previousStatus?.collision ?? false;
                    if (!charactersCollision) {
                        for (let i = a; i <= b; i++) {
                            if (set.contains(i)) {
                                let setText: string;
                                if (rootAst.getChildren().length === 0) {
                                    setText = rootAst.getText()!;
                                } else {
                                    setText = "";
                                    for (const child of rootAst.getChildren()) {
                                        if (child instanceof RangeAST) {
                                            setText += (child.getChild(0)!.getText()) + "..";
                                            setText += (child).getChild(1)!.getText();
                                        } else {
                                            setText += (child as GrammarAST).getText();
                                        }

                                        setText += " | ";
                                    }
                                    setText = setText.substring(0, setText.length - 3);
                                }

                                const charsString = a === b
                                    ? String.fromCodePoint(a)
                                    : String.fromCodePoint(a) + "-" + String.fromCodePoint(b);
                                this.g.tool.errorManager.grammarError(ErrorType.CHARACTERS_COLLISION_IN_SET,
                                    this.g.fileName, ast.token!, charsString, setText);
                                charactersCollision = true;

                                break;
                            }
                        }
                    }

                    status = new CharactersDataCheckStatus(charactersCollision,
                        charactersData.mixOfLowerAndUpperCharCase);
                    set.addRange(a, b);
                }

                return status;

                break;
            }

            default: {
                throw new Error("Invalid number of arguments");
            }
        }
    }

    private createTransition(target: ATNState, from: number, to: number, tree: CommonTree): Transition {
        const charactersData = RangeBorderCharactersData.getAndCheckCharactersData(from, to, this.g, tree, true);
        if (this.currentRule!.caseInsensitive) {
            if (charactersData.isSingleRange()) {
                return CodePointTransitions.createWithCodePointRange(target, from, to);
            } else {
                const intervalSet = new IntervalSet();
                intervalSet.addRange(charactersData.lowerFrom, charactersData.lowerTo);
                intervalSet.addRange(charactersData.upperFrom, charactersData.upperTo);

                return new SetTransition(target, intervalSet);
            }
        } else {
            return CodePointTransitions.createWithCodePointRange(target, from, to);
        }
    }

    private createLexerAction(id: GrammarAST, arg: GrammarAST | null): LexerAction | null {
        const command = id.getText();
        this.checkCommands(command, id.token!);

        switch (command) {
            case "skip": {
                if (arg === null) {
                    return LexerSkipAction.instance;
                }

                break;
            }

            case "more": {
                if (arg === null) {
                    return LexerMoreAction.instance;
                }

                break;
            }

            case "popMode": {
                if (arg === null) {
                    return LexerPopModeAction.instance;
                }

                break;
            }

            default: {
                if (arg !== null) {
                    const name = arg.getText();
                    switch (command) {
                        case "mode": {
                            const mode = this.getModeConstantValue(name, arg.token!);
                            if (mode === null) {
                                return null;
                            }

                            return new LexerModeAction(mode);
                        }

                        case "pushMode": {
                            const mode = this.getModeConstantValue(name, arg.token!);
                            if (mode === null) {
                                return null;
                            }

                            return new LexerPushModeAction(mode);
                        }

                        case "type": {
                            const type = this.getTokenConstantValue(name, arg.token!);
                            if (type === null) {
                                return null;
                            }

                            return new LexerTypeAction(type);
                        }

                        case "channel": {
                            const channel = this.getChannelConstantValue(name, arg.token!);
                            if (channel === null) {
                                return null;
                            }

                            return new LexerChannelAction(channel);
                        }

                        default:
                    }
                }

                break;
            }
        }

        return null;
    }

    private checkCommands(command: string, commandToken: Token | null): void {
        // Command combinations list: https://github.com/antlr/antlr4/issues/1388#issuecomment-263344701
        if (command !== "pushMode" && command !== "popMode") {
            if (this.ruleCommands.includes(command)) {
                this.g.tool.errorManager.grammarError(ErrorType.DUPLICATED_COMMAND, this.g.fileName, commandToken,
                    command);
            }

            let firstCommand = null;

            if (command === "skip") {
                if (this.ruleCommands.includes("more")) {
                    firstCommand = "more";
                } else {
                    if (this.ruleCommands.includes("type")) {
                        firstCommand = "type";
                    } else {
                        if (this.ruleCommands.includes("channel")) {
                            firstCommand = "channel";
                        }
                    }
                }
            } else {
                if (command === "more") {
                    if (this.ruleCommands.includes("skip")) {
                        firstCommand = "skip";
                    } else {
                        if (this.ruleCommands.includes("type")) {
                            firstCommand = "type";
                        } else {
                            if (this.ruleCommands.includes("channel")) {
                                firstCommand = "channel";
                            }
                        }
                    }
                } else {
                    if (command === "type" || command === "channel") {
                        if (this.ruleCommands.includes("more")) {
                            firstCommand = "more";
                        } else {
                            if (this.ruleCommands.includes("skip")) {
                                firstCommand = "skip";
                            }
                        }
                    }
                }
            }

            if (firstCommand !== null) {
                this.g.tool.errorManager.grammarError(ErrorType.INCOMPATIBLE_COMMANDS, this.g.fileName, commandToken,
                    firstCommand, command);
            }
        }

        this.ruleCommands.push(command);
    }

    private getModeConstantValue(modeName: string | null, token: Token | null): number | null {
        if (modeName === null || token === null) {
            return null;
        }

        if (modeName === "DEFAULT_MODE") {
            return Lexer.DEFAULT_MODE;
        }

        if (LexerATNFactory.COMMON_CONSTANTS.has(modeName)) {
            this.g.tool.errorManager.grammarError(ErrorType.MODE_CONFLICTS_WITH_COMMON_CONSTANTS, this.g.fileName,
                token, token.text);

            return null;
        }

        const modeNames = [...(this.g as LexerGrammar).modes.keys()];
        const mode = modeNames.indexOf(modeName);
        if (mode >= 0) {
            return mode;
        }

        const result = Number.parseInt(modeName);
        if (isNaN(result)) {
            this.g.tool.errorManager.grammarError(ErrorType.CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_MODE_NAME,
                this.g.fileName, token, token.text);

            return null;
        }

        return result;
    }

    private getTokenConstantValue(tokenName: string | null, token: Token | null): number | null {
        if (tokenName === null || token === null) {
            return null;
        }

        if (tokenName === "EOF") {
            return Lexer.EOF;
        }

        if (LexerATNFactory.COMMON_CONSTANTS.has(tokenName)) {
            this.g.tool.errorManager.grammarError(ErrorType.TOKEN_CONFLICTS_WITH_COMMON_CONSTANTS, this.g.fileName,
                token, token.text);

            return null;
        }

        const tokenType = this.g.getTokenType(tokenName);
        if (tokenType !== Token.INVALID_TYPE) {
            return tokenType;
        }

        const result = Number.parseInt(tokenName);
        if (isNaN(result)) {
            this.g.tool.errorManager.grammarError(ErrorType.CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_TOKEN_NAME,
                this.g.fileName, token, token.text);

            return null;
        }

        return result;
    }

    private getChannelConstantValue(channelName: string | null, token: Token | null): number | null {
        if (channelName === null || token === null) {
            return null;
        }

        if (channelName === "HIDDEN") {
            return Lexer.HIDDEN;
        }

        if (channelName === "DEFAULT_TOKEN_CHANNEL") {
            return Lexer.DEFAULT_TOKEN_CHANNEL;
        }

        if (LexerATNFactory.COMMON_CONSTANTS.has(channelName)) {
            this.g.tool.errorManager.grammarError(ErrorType.CHANNEL_CONFLICTS_WITH_COMMON_CONSTANTS, this.g.fileName,
                token, token.text);

            return null;
        }

        const channelValue = this.g.getChannelValue(channelName);
        if (channelValue >= Token.MIN_USER_CHANNEL_VALUE) {
            return channelValue;
        }

        const result = Number.parseInt(channelName);
        if (isNaN(result)) {
            this.g.tool.errorManager.grammarError(ErrorType.CONSTANT_VALUE_IS_NOT_A_RECOGNIZED_CHANNEL_NAME,
                this.g.fileName, token, token.text);

            return null;
        }

        return result;
    }

}

export namespace LexerATNFactory {
    export type CharSetParseState = InstanceType<typeof LexerATNFactory.CharSetParseState>;

}
