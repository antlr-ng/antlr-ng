/* java2ts: keep */

/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";
import { Lexer } from "../Lexer";

import { java } from "../../../../../../lib/java/java";
import { JavaObject } from "../../../../../../lib/java/lang/Object";
import { S } from "../../../../../../lib/templates";
import { MurmurHash } from "../../../../../../lib/MurmurHash";

/**
 * Implements the {@code popMode} lexer action by calling {@link Lexer#popMode}.
 *
 * <p>The {@code popMode} command does not have any parameters, so this action is
 * implemented as a singleton instance exposed by {@link #INSTANCE}.</p>
 *
 * @author Sam Harwell
 *
 */
export class LexerPopModeAction extends JavaObject implements LexerAction {
    /**
     * Provides a singleton instance of this parameter-less lexer action.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static readonly INSTANCE = new LexerPopModeAction();

    /**
     * Constructs the singleton instance of the lexer {@code popMode} command.
     */
    private constructor() {
        super();
    }

    /**
      @returns This method returns {@link LexerActionType#POP_MODE}.
     */
    public getActionType = (): LexerActionType => {
        return LexerActionType.POP_MODE;
    };

    /**
      @returns This method returns {@code false}.
     */
    public isPositionDependent = (): boolean => {
        return false;
    };

    /**
     *
     * <p>This action is implemented by calling {@link Lexer#popMode}.</p>
     *
     * @param lexer tbd
     */
    public execute = (lexer: Lexer): void => {
        lexer.popMode();
    };

    public hashCode = (): number => {
        let hash: number = MurmurHash.initialize();
        hash = MurmurHash.update(hash, this.getActionType());

        return MurmurHash.finish(hash, 1);
    };

    public equals = (obj: unknown): boolean => {
        return obj === this;
    };

    public toString = (): java.lang.String => {
        return S`popMode`;
    };
}
