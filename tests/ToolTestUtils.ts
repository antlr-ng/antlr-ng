/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

import { expect } from "vitest";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

import {
    ATN, ATNDeserializer, ATNSerializer, CharStream, CommonTokenStream, escapeWhitespace, Lexer, LexerATNSimulator,
    ParseTree, PredictionMode, Token, type Parser
} from "antlr4ng";
import { ST } from "stringtemplate4ts";

import { LexerATNFactory } from "../src/automata/LexerATNFactory.js";
import { ParserATNFactory } from "../src/automata/ParserATNFactory.js";
import type { Constructor } from "../src/misc/Utils.js";
import { SemanticPipeline } from "../src/semantics/SemanticPipeline.js";
import { ToolListener } from "../src/tool/ToolListener.js";
import { Tool, type Grammar, type LexerGrammar } from "../src/tool/index.js";
import type { InterpreterTreeTextProvider } from "./InterpreterTreeTextProvider.js";
import { ErrorQueue } from "./support/ErrorQueue.js";
import { Constants } from "../src/Constants.js";

export type MethodKeys<T extends Parser> = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

export interface IRunOptions {
    grammarFileName: string;
    grammarStr: string;
    parserName: string | null;
    lexerName: string | null;
    grammarName: string;
    useListener: boolean;
    useVisitor: boolean;
    startRuleName: string | null;
    input: string;
    profile: boolean;
    showDiagnosticErrors: boolean;
    traceATN: boolean;
    showDFA: boolean;
    superClass?: string;
    predictionMode: PredictionMode;
    buildParseTree: boolean;
}

export interface ICapturedOutput {
    output: string;
    error: string;
}

interface IGeneratedFile {
    name: string;
    isParser: boolean;
}

export class ToolTestUtils {
    public static async execLexer(grammarFileName: string, grammarStr: string, lexerName: string, input: string,
        workingDir: string): Promise<ErrorQueue> {
        const runOptions = this.createOptionsForToolTests(grammarFileName, grammarStr, null, lexerName, false, false,
            null, input, false, false);

        return await ToolTestUtils.execRecognizer(runOptions, workingDir);
    }

    public static async execParser(grammarFileName: string, grammarStr: string, parserName: string, lexerName: string,
        startRuleName: string, input: string, profile: boolean, showDiagnosticErrors: boolean,
        workingDir: string): Promise<ErrorQueue> {
        const runOptions = this.createOptionsForToolTests(grammarFileName, grammarStr, parserName, lexerName,
            false, false, startRuleName, input, profile, showDiagnosticErrors);

        return await ToolTestUtils.execRecognizer(runOptions, workingDir);
    }

    public static createOptionsForToolTests(grammarFileName: string, grammarStr: string, parserName: string | null,
        lexerName: string | null, useListener: boolean, useVisitor: boolean, startRuleName: string | null,
        input: string, profile: boolean, showDiagnosticErrors: boolean): IRunOptions {
        const isCombinedGrammar = lexerName != null && parserName != null;
        let grammarName;
        if (isCombinedGrammar) {
            grammarName = lexerName.endsWith("Lexer")
                ? lexerName.substring(0, lexerName.length - "Lexer".length)
                : lexerName;
        } else {
            if (parserName != null) {
                grammarName = parserName;
            } else {
                grammarName = lexerName!;
            }
        }

        return {
            grammarFileName,
            grammarStr,
            parserName,
            lexerName,
            grammarName,
            useListener,
            useVisitor,
            startRuleName,
            input,
            profile,
            showDiagnosticErrors,
            traceATN: false,
            showDFA: false,
            predictionMode: PredictionMode.LL,
            buildParseTree: true
        };
    }

    public static testErrors(pairs: string[], ignoreWarnings = false): void {
        for (let i = 0; i < pairs.length; i += 2) {
            const grammarStr = pairs[i];
            const expected = pairs[i + 1];

            const lines = grammarStr.split("\n");
            const fileName = ToolTestUtils.getFilenameFromFirstLineOfGrammar(lines[0]);

            const tempTestDir = mkdtempSync(join(tmpdir(), "AntlrTestErrors-"));
            try {
                const queue = this.antlrOnString(tempTestDir, null, fileName, grammarStr, false);

                let actual = "";
                if (ignoreWarnings) {
                    const errors = [];
                    for (const error of queue.errors) {
                        const msgST = queue.errorManager.getMessageTemplate(error)!;
                        errors.push(msgST.render());
                    }

                    if (errors.length > 0) {
                        actual = errors.join("\n") + "\n";
                    }
                } else {
                    actual = queue.toString(true);
                }

                actual = actual.replace(tempTestDir + "/", "");

                expect(actual).toBe(expected);
            } finally {
                rmSync(tempTestDir, { recursive: true });
            }
        }
    }

    public static async setupRecognizers(runOptions: IRunOptions, workDir: string): Promise<[Lexer, Parser]> {
        await this.setupRuntime(workDir);

        // Assuming a combined grammar here. Write the grammar file and run the code generation.
        writeFileSync(join(workDir, runOptions.grammarFileName), runOptions.grammarStr);
        const queue = this.antlrOnFile(workDir, "TypeScript", runOptions.grammarFileName, false);
        expect(queue.errors.length).toBe(0);

        const lexerConstructor = await this.importClass<Lexer>(join(workDir, runOptions.lexerName + ".js"),
            runOptions.lexerName!);
        const parserConstructor = await this.importClass<Parser>(join(workDir, runOptions.parserName + ".js"),
            runOptions.parserName!);

        const lexer = new lexerConstructor(CharStream.fromString(runOptions.input));
        const tokens = new CommonTokenStream(lexer);
        const parser = new parserConstructor(tokens);
        parser.removeErrorListeners();

        return [lexer, parser];
    }

    public static getFilenameFromFirstLineOfGrammar(line: string): string {
        let fileName = "A" + Constants.GrammarExtension;
        const grIndex = line.lastIndexOf("grammar");
        const semi = line.lastIndexOf(";");
        if (grIndex >= 0 && semi >= 0) {
            const space = line.indexOf(" ", grIndex);
            fileName = line.substring(space + 1, semi) + Constants.GrammarExtension;
        }

        if (fileName.length === Constants.GrammarExtension.length) {
            fileName = "A" + Constants.GrammarExtension;
        }

        return fileName;
    }

    public static realElements(elements: Array<string | null>): Array<string | null> {
        return elements.slice(Token.MIN_USER_TOKEN_TYPE);
    }

    public static createATN(g: Grammar, useSerializer: boolean): ATN {
        ToolTestUtils.semanticProcess(g);
        expect(g.tool.getNumErrors()).toBe(0);

        const f = g.isLexer() ? new LexerATNFactory(g as LexerGrammar) : new ParserATNFactory(g);

        g.atn = f.createATN();
        expect(g.tool.getNumErrors()).toBe(0);

        const atn = g.atn;
        if (useSerializer) {
            // sets some flags in ATN
            const serialized = ATNSerializer.getSerialized(atn);

            return new ATNDeserializer().deserialize(serialized);
        }

        return atn;
    }

    /** Write a grammar to tmpdir and run antlr */
    public static antlrOnString(workdir: string, targetName: string | null,
        grammarFileName: string, grammarStr: string, defaultListener: boolean, ...extraOptions: string[]): ErrorQueue {

        writeFileSync(join(workdir, grammarFileName), grammarStr);

        return this.antlrOnFile(workdir, targetName, grammarFileName, defaultListener, ...extraOptions);
    }

    /** Run ANTLR on stuff in workdir and error queue back. */
    public static antlrOnFile(workdir: string, targetName: string | null, grammarFileName: string,
        defaultListener: boolean, ...extraOptions: string[]): ErrorQueue {
        const options: string[] = [...extraOptions];

        if (targetName !== null) {
            options.push("-Dlanguage=" + targetName);
        }

        if (!options.includes("-o")) {
            options.push("-o");
            options.push(workdir);
        }

        if (!options.includes("--lib")) {
            options.push("--lib");
            options.push(workdir);
        }

        if (!options.includes("--encoding")) {
            options.push("--encoding");
            options.push("utf-8");
        }

        options.push(join(workdir, grammarFileName));

        const antlr = new Tool(options);

        const queue = new ErrorQueue(antlr.errorManager);
        antlr.errorManager.addListener(queue);
        if (defaultListener) {
            antlr.errorManager.addListener(new ToolListener(antlr.errorManager));
        }

        antlr.processGrammarsOnCommandLine();

        return queue;
    }

    public static semanticProcess(g: Grammar): void {
        if (!g.ast.hasErrors) {
            const antlr = new Tool();
            const sem = new SemanticPipeline(g);
            sem.process();
            for (const imp of g.getImportedGrammars()) {
                antlr.processNonCombinedGrammar(imp, false);
            }
        }
    }

    public static getTokenTypesViaATN(text: string, lexerATN: LexerATNSimulator): number[] {
        const input = CharStream.fromString(text);
        const tokenTypes: number[] = [];
        let ttype: number;

        do {
            ttype = lexerATN.match(input, Lexer.DEFAULT_MODE);
            tokenTypes.push(ttype);
        } while (ttype !== Token.EOF);

        return tokenTypes;
    }

    /**
     * Runs the given callback in a context where console.log and process.stdout.write is captured
     * and returns the output.
     *
     * @param func The callback to execute.
     *
     * @returns The output of console.log, while running the callback.
     */
    public static async captureTerminalOutput(func: () => Promise<void>): Promise<ICapturedOutput> {
        const log = console.log;
        const error = console.error;
        const write = void process.stdout.write;

        const result: ICapturedOutput = {
            output: "",
            error: ""
        };

        console.log = (message: string): void => {
            result.output += message + "\n";
        };

        console.error = (message: string): void => {
            result.error += message + "\n";
        };

        process.stdout.write = (chunk): boolean => {
            result.output += chunk.toString();

            return true;
        };

        try {
            await func();
        } finally {
            console.log = log;
            console.error = error;

            // @ts-expect-error, need to restore the original function.
            process.stdout.write = write;
        }

        return result;
    }

    /**
     * Print out a whole tree in LISP form. Arg nodeTextProvider is used on the
     * node payloads to get the text for the nodes.
     */
    public static toStringTree(t: ParseTree | null, nodeTextProvider: InterpreterTreeTextProvider): string {
        if (t === null) {
            return "null";
        }
        let s = escapeWhitespace(nodeTextProvider.getText(t), false);
        if (t.getChildCount() === 0) {
            return s;
        }

        const buf: string[] = [];
        buf.push("(");
        s = escapeWhitespace(nodeTextProvider.getText(t), false);
        buf.push(s);
        buf.push(" ");
        for (let i = 0; i < t.getChildCount(); i++) {
            if (i > 0) {
                buf.push(" ");
            }
            buf.push(this.toStringTree(t.getChild(i), nodeTextProvider));
        }
        buf.push(")");

        return buf.join("");
    }

    public static callParserMethod<T extends Parser, K extends MethodKeys<T>>(obj: T, methodName: string): unknown {
        const method = obj[methodName as K];
        if (typeof method === "function") {
            return method.call(obj);
        } else {
            throw new Error(`Method ${String(methodName)} is not a function`);
        }
    };

    private static async execRecognizer(runOptions: IRunOptions, workDir: string): Promise<ErrorQueue> {
        await this.setupRuntime(workDir);

        writeFileSync(join(workDir, runOptions.grammarFileName), runOptions.grammarStr);

        const queue = this.antlrOnFile(workDir, "TypeScript", runOptions.grammarFileName, false);

        //const generatedFiles = this.getGeneratedFiles(runOptions);

        this.writeTestFile(workDir, runOptions);

        writeFileSync(join(workDir, "input"), runOptions.input);

        const testName = join(workDir, "Test.js");

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { main } = await import(testName);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        main(runOptions.input);

        return queue;
    }

    private static getGeneratedFiles(runOptions: IRunOptions): IGeneratedFile[] {
        const files: IGeneratedFile[] = [];
        const extensionWithDot = ".java";

        const isCombinedGrammarOrGo = runOptions.lexerName != null && runOptions.parserName != null;
        if (runOptions.lexerName != null) {
            files.push({
                name: runOptions.grammarName + (isCombinedGrammarOrGo ? "Lexer" : "") + extensionWithDot,
                isParser: false
            });
        }

        if (runOptions.parserName != null) {
            files.push({
                name: runOptions.grammarName + (isCombinedGrammarOrGo ? "Parser" : "") + extensionWithDot,
                isParser: true
            });

            if (runOptions.useListener) {
                files.push({
                    name: runOptions.grammarName + "Listener" + extensionWithDot,
                    isParser: true
                });

                const baseListenerSuffix = "BaseListener";
                files.push({
                    name: runOptions.grammarName + baseListenerSuffix + extensionWithDot,
                    isParser: true
                });
            }

            if (runOptions.useVisitor) {
                files.push({
                    name: runOptions.grammarName + "Visitor" + extensionWithDot,
                    isParser: true
                });

                files.push({
                    name: runOptions.grammarName + "BaseVisitor" + extensionWithDot,
                    isParser: true
                });
            }
        }

        return files;
    }

    /** Generates the TypeScript test file to run the generated parser + lexer files. */
    private static writeTestFile(workDir: string, runOptions: IRunOptions): void {
        const sourcePath = fileURLToPath(new URL("helpers/Test.ts.stg", import.meta.url));
        const text = readFileSync(sourcePath, "utf8");
        const outputFileST = new ST(text);
        outputFileST.add("grammarName", runOptions.grammarName);
        outputFileST.add("lexerName", runOptions.lexerName);
        outputFileST.add("parserName", runOptions.parserName);
        outputFileST.add("parserStartRuleName", runOptions.startRuleName);
        outputFileST.add("showDiagnosticErrors", runOptions.showDiagnosticErrors);
        outputFileST.add("traceATN", runOptions.traceATN);
        outputFileST.add("profile", runOptions.profile);
        outputFileST.add("showDFA", runOptions.showDFA);
        outputFileST.add("useListener", runOptions.useListener);
        outputFileST.add("useVisitor", runOptions.useVisitor);

        const mode = runOptions.predictionMode === PredictionMode.LL ? "LL" :
            runOptions.predictionMode === PredictionMode.SLL ? "SLL" : "LL_EXACT_AMBIG_DETECTION";
        outputFileST.add("predictionMode", mode);
        outputFileST.add("buildParseTree", runOptions.buildParseTree);

        writeFileSync(join(workDir, "Test.ts"), outputFileST.render());
    }

    private static async importClass<T>(fileName: string, className: string): Promise<Constructor<T>> {
        const module = await import(fileName) as Record<string, Constructor<T>>;

        return module[className];
    }

    private static async setupRuntime(workDir: string): Promise<void> {
        // Symbolic link to antlr4ts in the node_modules directory.
        const antlr4ngTarget = join(workDir, "node_modules/antlr4ng");

        if (!existsSync(antlr4ngTarget)) {
            const antlr4tsSource = fileURLToPath(new URL("../node_modules/antlr4ng/", import.meta.url));
            await mkdir(join(workDir, "node_modules"), { recursive: true });
            symlinkSync(antlr4tsSource, antlr4ngTarget, "dir");
        }

    }
}
