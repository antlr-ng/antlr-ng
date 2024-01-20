/* java2ts: keep */

/*
 * Copyright (c) 2012-2022 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

import { TsNodeRunner } from "./TsNodeRunner.js";
import { RuntimeRunner } from "../RuntimeRunner.js";
import { RuntimeTests } from "../RuntimeTests.js";

export class TypeScriptRuntimeTests extends RuntimeTests {
    protected override  createRuntimeRunner(): RuntimeRunner {
        return new TsNodeRunner();
    }
}
