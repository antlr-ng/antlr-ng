/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// Renders the parser of a generated grammar with many rules in several target generators and prints the line count
// of each result as JSON. It runs in a separate Node.js process (see TestLargeGrammarGeneration.spec.ts), because
// the test workers have a larger stack than a normal Node.js process.

import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import type { ITargetGenerator } from "../../src/codegen/ITargetGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { CppTargetGenerator } from "../../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../../src/default-target-generators/CSharpTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../src/tool/index.js";

const ruleCount = Number(process.argv[2]);
const rules = Array.from({ length: ruleCount }, (_, i) => {
    return `r${i} : ID (',' ID)* | INT ;`;
});
const grammarText = `grammar T;\ns : r0 EOF ;\n${rules.join("\n")}\nID : [a-z]+ ;\nINT : [0-9]+ ;\n` +
    "WS : ' ' -> skip ;\n";

const generators: ITargetGenerator[] = [
    new TypeScriptTargetGenerator(),
    new CppTargetGenerator(),
    new CSharpTargetGenerator(),
];

const parameters = defineConfig({
    grammarFiles: [],
    generationOptions: { outputDirectory: "" },
    generators,
});

const g = new Grammar(grammarText);
g.tool.process(g, parameters, false);

const result: Record<string, number | string> = { errors: g.tool.getNumErrors() };
for (const generator of generators) {
    generator.setUp();
    try {
        const gen = new CodeGenerator(g, generator, parameters.generationOptions);
        result[generator.language] = gen.generateParser(parameters.generationOptions).split("\n").length;
    } catch (e) {
        result[generator.language] = String(e);
    }
}

console.log(JSON.stringify(result));
