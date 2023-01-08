/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */


import { ATNState } from "./ATNState";
import { RuleStopState } from "./RuleStopState";




export  class RuleStartState extends ATNState {
	public stopState:  RuleStopState | null;
	public isLeftRecursiveRule:  boolean;

	public getStateType = ():  number => {
		return ATNState.RULE_START;
	}
}
