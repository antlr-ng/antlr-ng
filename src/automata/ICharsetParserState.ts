/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { IntervalSet } from "antlr4ng";

export enum Mode {
    None,
    Error,
    PrevCodePoint,
    PrevProperty,
};

export interface ICharSetParseState {
    mode: Mode;
    inRange: boolean;
    prevCodePoint: number;
    prevProperty: IntervalSet;
};

export namespace ICharSetParseState {
    export const none: ICharSetParseState = {
        mode: Mode.None, inRange: false, prevCodePoint: -1, prevProperty: new IntervalSet()
    };

    export const error: ICharSetParseState = {
        mode: Mode.Error, inRange: false, prevCodePoint: -1, prevProperty: new IntervalSet()
    };
};
