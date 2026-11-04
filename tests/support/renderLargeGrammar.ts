/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

// Renders all files of a generated grammar with many rules in one built-in target generator and prints the line count
// of each result as JSON (or the error message if rendering failed). It runs in a separate Node.js process with a
// small stack (see TestLargeGrammarGeneration.spec.ts), because the test workers have a larger stack than a normal
// Node.js process and a smaller stack lowers the size at which a spread call fails.

import { CodeGenerator } from "../../src/codegen/CodeGenerator.js";
import type { ITargetGenerator } from "../../src/codegen/ITargetGenerator.js";
import { defineConfig } from "../../src/config/config.js";
import { CppTargetGenerator } from "../../src/default-target-generators/CppTargetGenerator.js";
import { CSharpTargetGenerator } from "../../src/default-target-generators/CSharpTargetGenerator.js";
import { DartTargetGenerator } from "../../src/default-target-generators/DartTargetGenerator.js";
import { GoTargetGenerator } from "../../src/default-target-generators/GoTargetGenerator.js";
import { JavaTargetGenerator } from "../../src/default-target-generators/JavaTargetGenerator.js";
import { PHPTargetGenerator } from "../../src/default-target-generators/PHPTargetGenerator.js";
import { Python3TargetGenerator } from "../../src/default-target-generators/Python3TargetGenerator.js";
import { SwiftTargetGenerator } from "../../src/default-target-generators/SwiftTargetGenerator.js";
import { TypeScriptTargetGenerator } from "../../src/default-target-generators/TypeScriptTargetGenerator.js";
import { Grammar } from "../../src/tool/index.js";

const ruleCount = Number(process.argv[2]);
const language = process.argv[3];

// Parser rules have predicates and two labeled alternatives, lexer rules have actions, so that the sempred and
// action functions and the listener/visitor files grow with the rule count as well.
const predicates = "{true}? ".repeat(6);
const actions = "{this.count++;} ".repeat(6);
const parserRules = Array.from({ length: ruleCount }, (_, i) => {
    return `r${i} : ${predicates}ID (',' ID)* # A${i} | INT # B${i} ;`;
});
const lexerRules = Array.from({ length: ruleCount }, (_, i) => {
    return `K${i} : 'k${i}' ${actions};`;
});
const grammarText = `grammar T;\ns : r0 EOF ;\n${parserRules.join("\n")}\n${lexerRules.join("\n")}\n` +
    "ID : [a-z]+ ;\nINT : [0-9]+ ;\nWS : ' ' -> skip ;\n";

const allGenerators: ITargetGenerator[] = [
    new TypeScriptTargetGenerator(),
    new CppTargetGenerator(),
    new CSharpTargetGenerator(),
    new DartTargetGenerator(),
    new GoTargetGenerator(),
    new JavaTargetGenerator(),
    new PHPTargetGenerator(),
    new Python3TargetGenerator(),
    new SwiftTargetGenerator(),
];
const generators = allGenerators.filter((generator) => {
    return generator.language === language;
});

if (generators.length === 0) {
    throw new Error(`Unknown target language: ${language}`);
}

const parameters = defineConfig({
    grammarFiles: [],
    generationOptions: { outputDirectory: "", generateListener: true, generateVisitor: true },
    generators,
});

const g = new Grammar(grammarText);
g.tool.process(g, parameters, false);

const result: Record<string, number | string> = { errors: g.tool.getNumErrors() };
const options = parameters.generationOptions;
for (const generator of generators) {
    generator.setUp();
    const gen = new CodeGenerator(g, generator, options);
    const lexerGen = new CodeGenerator(g.implicitLexer!, generator, options);

    // C++ renders most of the listener and visitor code in the declaration (header) files.
    const variants = generator.needsDeclarationFile ? [false, true] : [false];
    const files: Array<[string, () => string]> = [];
    for (const declaration of variants) {
        const suffix = declaration ? "Declaration" : "";
        files.push(
            [`parser${suffix}`, () => { return gen.generateParser(options, declaration); }],
            [`lexer${suffix}`, () => { return lexerGen.generateLexer(options, declaration); }],
            [`listener${suffix}`, () => { return gen.generateListener(options, declaration); }],
            [`baseListener${suffix}`, () => { return gen.generateBaseListener(options, declaration); }],
            [`visitor${suffix}`, () => { return gen.generateVisitor(options, declaration); }],
            [`baseVisitor${suffix}`, () => { return gen.generateBaseVisitor(options, declaration); }],
        );
    }

    for (const [kind, render] of files) {
        const key = `${generator.language}.${kind}`;
        try {
            result[key] = render().split("\n").length;
        } catch (e) {
            result[key] = String(e);
        }
    }
}

console.log(JSON.stringify(result));
