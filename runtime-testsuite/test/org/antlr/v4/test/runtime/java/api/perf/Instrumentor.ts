/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */




import { java, JavaObject } from "jree";

type Instrumentation = java.lang.instrument.Instrumentation;
type String = java.lang.String;
const String = java.lang.String;

import { Test, Override } from "../../../../../../../../../decorators.js";


/** Just a hook so we can call {@link java.lang.instrument.Instrumentation}
 *  methods like sizeof().  Start the Java VM with -javaagent instrumentor.jar
 *  if instrumentor.jar is where you put the .class file for this code.
 *  MANIFEST.MF for that jar must have "Premain-Class:Instrumentor".
 *
 *  I'm not using at moment but I'm adding in case.
 */
export  class Instrumentor extends JavaObject {
	public static  instrumentation:  Instrumentation;

	public static  premain(args: String, I: Instrumentation):  void {
		Instrumentor.instrumentation = I;
	}
}
