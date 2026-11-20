/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { CharStream, CommonTokenStream } from "antlr4ng";

import { ANTLRv4Parser } from "./generated/ANTLRv4Parser.js";

import { ClassFactory } from "./ClassFactory.js";
import { Constants } from "./Constants.js";
import { UndefChecker } from "./UndefChecker.js";
import { AnalysisPipeline } from "./analysis/AnalysisPipeline.js";
import { IATNFactory } from "./automata/IATNFactory.js";
import { LexerATNFactory } from "./automata/LexerATNFactory.js";
import { ParserATNFactory } from "./automata/ParserATNFactory.js";
import { CodeGenPipeline } from "./codegen/CodeGenPipeline.js";
import { CodeGenerator } from "./codegen/CodeGenerator.js";
import type { ITargetGenerator } from "./codegen/ITargetGenerator.js";
import { noTargetLanguage, supportsLanguage } from "./codegen/TargetLanguage.js";
import type { IToolConfiguration } from "./config/config.js";
import { CharSupport } from "./misc/CharSupport.js";
import { Graph } from "./misc/Graph.js";
import { ToolANTLRLexer } from "./parse/ToolANTLRLexer.js";
import { ToolANTLRParser } from "./parse/ToolANTLRParser.js";
import { SemanticPipeline } from "./semantics/SemanticPipeline.js";
import { GrammarType } from "./support/GrammarType.js";
import { LogManager } from "./support/LogManager.js";
import { ParseTreeToASTConverter } from "./support/ParseTreeToASTConverter.js";
import { basename, dirname, resolvePath } from "./support/fs-helpers.js";
import { fileSystem } from "./tool-parameters.js";
import { BuildDependencyGenerator } from "./tool/BuildDependencyGenerator.js";
import { ErrorManager } from "./tool/ErrorManager.js";
import type { Grammar } from "./tool/Grammar.js";
import { GrammarTransformPipeline } from "./tool/GrammarTransformPipeline.js";
import { IssueCode } from "./tool/Issues.js";
import type { LexerGrammar } from "./tool/LexerGrammar.js";
import { GrammarAST } from "./tool/ast/GrammarAST.js";
import { GrammarRootAST } from "./tool/ast/GrammarRootAST.js";
import type { RuleAST } from "./tool/ast/RuleAST.js";
import type { IGrammar, ITool } from "./types.js";

/** The target generators whose `setUp` method was called already. */
const initializedGenerators = new WeakSet<ITargetGenerator>();

/** The main class in antlr-ng, which is used to do full grammar processing and output generation. */
export class Tool implements ITool {
    public readonly errorManager = new ErrorManager();

    public toolConfiguration: IToolConfiguration;

    private readonly logMgr = new LogManager();
    /** Imported grammars, keyed by their normalized file path. */
    private readonly importedGrammars = new Map<string, Grammar>();

    /**
     * Initiates a full generation process with the given parameters.
     *
     * @param parameters Details about the generation process (source + target files, options, etc.).
     *
     * @returns true if the run was successful, false otherwise.
     */
    public generate(parameters: IToolConfiguration): boolean {
        try {
            this.toolConfiguration = parameters;

            // Reset and (re)configure the error manager.
            this.errorManager.configure(this.toolConfiguration.messageFormatOptions);

            if (this.toolConfiguration.grammarFiles.length === 0) {
                this.errorManager.toolError(IssueCode.NoGrammarsFound);

                return false;
            }

            // The file list names the generated files, which only a generator knows. Grammars with the language
            // None can be processed without a generator, so that is checked per grammar.
            if (this.toolConfiguration.generators.length === 0
                && this.toolConfiguration.generationOptions.generateDependencies) {
                this.errorManager.toolError(IssueCode.NoTargetGenerators);

                return false;
            }

            this.setUpGenerators();
            this.processGrammarsOnCommandLine();
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            this.logInfo({ component: "tool", msg: error.stack ?? error.message });
            this.errorManager.toolError(IssueCode.InternalError, error, error.message, "");

            return false;
        } finally {
            if (this.toolConfiguration.log) {
                try {
                    const logName = this.logMgr.save();
                    console.log("wrote " + logName);
                } catch (ioe) {
                    this.errorManager.toolError(IssueCode.InternalError, ioe as Error);
                }
            }
        }

        return this.errorManager.errors === 0;
    }

    /**
     * To process a grammar, we load all of its imported grammars into subordinate grammar objects. Then we merge the
     * imported rules into the root grammar. If a root grammar is a combined grammar, we have to extract the implicit
     * lexer. Once all this is done, we process the lexer first, if present, and then the parser grammar
     *
     * Processing changes the grammar (e.g. left-recursive rules are rewritten with code of the target generator), so
     * a grammar object can only be processed for one target generator. Without a generator the ATN is still built,
     * which is all that interpreters and grammars with the language `None` need.
     *
     * @param g The grammar to process.
     * @param configuration Details about the generation process (source + target files, options, etc.).
     * @param genCode Whether to generate code or not.
     * @param targetGenerator The generator to process the grammar for. Default: the first configured generator which
     *                        supports the grammar's language, or the first configured generator.
     */
    public process(g: Grammar, configuration: IToolConfiguration, genCode: boolean,
        targetGenerator: ITargetGenerator | undefined = Tool.findGenerator(configuration.generators, g)): void {
        this.toolConfiguration = configuration;

        // Reset and (re)configure the error manager.
        this.errorManager.configure(configuration.messageFormatOptions);
        this.setUpGenerators(targetGenerator);

        // Only grammars with the language None can be generated without a target generator.
        if (genCode && !targetGenerator && !g.isCodeGenerationDisabled()) {
            this.errorManager.toolError(IssueCode.NoTargetGenerators);

            return;
        }

        g.loadImportedGrammars();

        const transform = new GrammarTransformPipeline(g, this);
        transform.process();

        let lexerAST: GrammarRootAST | undefined;
        if (g.ast.grammarType === GrammarType.Combined) {
            // Alters g.ast.
            lexerAST = transform.extractImplicitLexer(g);
            if (lexerAST) {
                lexerAST.toolConfiguration = this.toolConfiguration;
                const lexerGrammar = ClassFactory.createLexerGrammar(this, lexerAST);
                lexerGrammar.fileName = g.fileName;
                lexerGrammar.originalGrammar = g;
                g.implicitLexer = lexerGrammar;
                lexerGrammar.implicitLexerOwner = g;
                this.processNonCombinedGrammar(lexerGrammar, genCode, targetGenerator);
            }
        }

        if (g.implicitLexer) {
            g.importVocab(g.implicitLexer);
        }

        this.processNonCombinedGrammar(g, genCode, targetGenerator);
    }

    /**
     * Processes a lexer or parser grammar: semantic checks, ATN construction, analysis and (optionally) code
     * generation.
     *
     * @param g The grammar to process.
     * @param genCode Whether to write the output files or not.
     * @param targetGenerator The generator to process the grammar for. Without one, no target code can be generated,
     *                        but the ATN is built and the metadata of a grammar with the language `None` is written.
     */
    public processNonCombinedGrammar(g: Grammar, genCode: boolean, targetGenerator?: ITargetGenerator): void {
        const ruleFail = this.checkForRuleIssues(g);
        if (ruleFail) {
            return;
        }

        const prevErrors = this.errorManager.errors;

        // Make sure grammar is semantically correct (fill in grammar object).
        const sem = new SemanticPipeline(g);
        sem.process(targetGenerator, this.toolConfiguration.generationOptions);

        if (this.errorManager.errors > prevErrors) {
            return;
        }

        // Build atn from AST.
        let factory: IATNFactory;
        if (g.isLexer()) {
            factory = new LexerATNFactory(g as LexerGrammar, targetGenerator);
        } else {
            factory = new ParserATNFactory(g);
        }

        g.atn = factory.createATN();

        if (genCode && !targetGenerator && !g.isCodeGenerationDisabled()) {
            this.errorManager.toolError(IssueCode.NoTargetGenerators);

            return;
        }

        let codeGenerator;
        if (genCode) {
            codeGenerator = new CodeGenerator(g, targetGenerator, this.toolConfiguration.generationOptions);
        }

        if (codeGenerator && this.toolConfiguration.generationOptions.atn) {
            codeGenerator.generateATNDotFiles(g);
        }

        if (genCode && g.tool.getNumErrors() === 0
            && (this.toolConfiguration.generationOptions.generateInterpreterData
                || g.isCodeGenerationDisabled())) {
            codeGenerator?.generateInterpreterData(g);
        }

        // Perform grammar analysis on ATN: build decision DFAs.
        const anal = new AnalysisPipeline(g);
        anal.process();

        if (g.tool.getNumErrors() > prevErrors) {
            return;
        }

        // Generate code.
        if (genCode && codeGenerator) {
            const gen = new CodeGenPipeline(g, codeGenerator, this.toolConfiguration.generationOptions);
            gen.process();
        }
    }

    /**
     * Important enough to avoid multiple definitions that we do very early, right after AST construction. Also check
     * for undefined rules in parser/lexer to avoid exceptions later. Return true if we find multiple definitions of
     * the same rule or a reference to an undefined rule or parser rule ref in lexer rule.
     *
     * @param g The grammar to check.
     *
     * @returns true if there are issues with the rules.
     */
    public checkForRuleIssues(g: Grammar): boolean {
        // check for redefined rules
        const rulesNode = g.ast.getFirstChildWithType(ANTLRv4Parser.RULES) as GrammarAST;
        const rules: GrammarAST[] = [...rulesNode.getAllChildrenWithType(ANTLRv4Parser.RULE)];
        for (const mode of g.ast.getAllChildrenWithType(ANTLRv4Parser.MODE)) {
            rules.push(...mode.getAllChildrenWithType(ANTLRv4Parser.RULE));
        }

        let redefinition = false;
        const ruleToAST = new Map<string, RuleAST>();
        for (const r of rules) {
            const ruleAST = r as RuleAST;
            const id = ruleAST.children[0] as GrammarAST;
            const ruleName = id.getText();
            const prev = ruleToAST.get(ruleName);
            if (prev) {
                const prevChild = prev.children[0] as GrammarAST;
                this.errorManager.grammarError(IssueCode.RuleRedefinition, g.fileName, id.token!, ruleName,
                    prevChild.token!.line);
                redefinition = true;
                continue;
            }
            ruleToAST.set(ruleName, ruleAST);
        }

        const chk = new UndefChecker(g.isLexer(), ruleToAST, this.errorManager);
        chk.visitGrammar(g.ast);

        return redefinition || chk.badRef;
    }

    public sortGrammarByTokenVocab(fileNames: string[]): GrammarRootAST[] {
        const g = new Graph();
        const roots = new Array<GrammarRootAST>();
        for (const fileName of fileNames) {
            let root: GrammarRootAST | undefined;
            try {
                root = this.parseGrammar(fileName);
            } catch {
                // Already reported by parseGrammar.
                continue;
            }

            if (!root) {
                continue;
            }

            roots.push(root);
            root.fileName = fileName;
            const grammarName = root.getGrammarName()!;

            const tokenVocabNode = Tool.findOptionValueAST(root, "tokenVocab");

            // Make grammars depend on any tokenVocab options.
            if (tokenVocabNode) {
                let vocabName = tokenVocabNode.getText();

                // Strip quote characters if any.
                const len = vocabName.length;
                const firstChar = vocabName.charAt(0);
                const lastChar = vocabName.charAt(len - 1);
                if (len >= 2 && firstChar === "'" && lastChar === "'") {
                    vocabName = vocabName.substring(1, len - 1);
                }

                // If the name contains a path delimited by forward slashes, use only the part after the last slash
                // as the name
                const lastSlash = vocabName.lastIndexOf("/");
                if (lastSlash >= 0) {
                    vocabName = vocabName.substring(lastSlash + 1);
                }
                g.addEdge(grammarName, vocabName);
            }

            // Add cycle to graph so we always process a grammar if no error even if no dependency.
            g.addEdge(grammarName, grammarName);
        }

        const sortedGrammarNames = g.sort();

        const sortedRoots = new Array<GrammarRootAST>();
        for (const grammarName of sortedGrammarNames) {
            for (const root of roots) {
                if (root.getGrammarName() === grammarName) {
                    sortedRoots.push(root);
                    break;
                }
            }
        }

        return sortedRoots;
    };

    /**
     * Given the raw AST of a grammar, create a grammar object associated with the AST. Once we have the grammar object,
     * ensure that all nodes in tree referred to this grammar. Later, we will use it for error handling and generally
     * knowing from where a rule comes from.
     *
     * @param grammarAST The raw AST of the grammar.
     *
     * @returns The grammar object.
     */
    public createGrammar(grammarAST: GrammarRootAST): IGrammar {
        let g: IGrammar;

        // Using a class factory here to avoid circular dependencies.
        if (grammarAST.grammarType === GrammarType.Lexer) {
            g = ClassFactory.createLexerGrammar(this, grammarAST);
        } else {
            g = ClassFactory.createGrammar(this, grammarAST);
        }

        // Ensure each node has pointer to surrounding grammar.
        GrammarTransformPipeline.setGrammarPtr(g, grammarAST);

        return g;
    }

    public parseGrammar(fileName: string): GrammarRootAST | undefined {
        try {
            const content = fileSystem.readFileSync(fileName, { encoding: "utf-8" });
            const input = CharStream.fromString(content as string);
            input.name = basename(fileName);

            return this.parse(input);
        } catch (ioe) {
            this.errorManager.toolError(IssueCode.CannotOpenFile, ioe as Error, fileName);
            throw ioe;
        }
    }

    /**
     * Convenience method to load and process an ANTLR grammar. Useful when creating interpreters. If you need to
     * access to the lexer grammar created while processing a combined grammar, use getImplicitLexer() on returned
     * grammar.
     *
     * @param fileName The name of the grammar file to load.
     *
     * @returns The grammar object.
     */
    public loadGrammar(fileName: string): Grammar {
        const grammarAST = this.parseGrammar(fileName)!;
        const g = this.createGrammar(grammarAST);
        g.fileName = fileName;

        return g;
    }

    /**
     * Finds and loads a grammar imported by name or by path.
     *
     * @param g The importing grammar.
     * @param importNode The node of the import: the grammar name or the string literal with the path.
     *
     * @returns The imported grammar or null if it could not be found or loaded.
     */
    public loadImportedGrammar(g: Grammar, importNode: GrammarAST): Grammar | null {
        const fileName = this.findImportedGrammarFile(g, importNode);

        return fileName ? this.loadImportedGrammarFile(g, importNode, fileName) : null;
    }

    /**
     * Determines the file of an imported grammar and reports an error if there is none.
     *
     * A name (`import A;`) is searched for in the current directory, the directory of the importing grammar and the
     * lib directory, with all grammar file extensions. A string literal (`import '../shared/A.g4';`) is the path of
     * the file, relative to the importing grammar (or absolute). It is not searched for.
     *
     * @param g The importing grammar.
     * @param importNode The node of the import: the grammar name or the string literal with the path.
     *
     * @returns The canonical path of the grammar file (see {@link getCanonicalPath}), or undefined if it doesn't exist.
     */
    public findImportedGrammarFile(g: Grammar, importNode: GrammarAST): string | undefined {
        if (importNode.getType() === ANTLRv4Parser.STRING_LITERAL) {
            const path = CharSupport.getStringFromGrammarStringLiteral(importNode.getText(), g, importNode.token);
            if (path === null) {
                return undefined; // Invalid escape sequences were already reported.
            }

            const fileName = path === "" ? "" : resolvePath(dirname(g.fileName), path);
            if (fileName === "" || !fileSystem.existsSync(fileName)) {
                this.errorManager.grammarError(IssueCode.CannotFindImportedGrammar, g.fileName, importNode.token!,
                    path === "" ? importNode.getText() : fileName);

                return undefined;
            }

            return this.getCanonicalPath(fileName);
        }

        const name = importNode.getText();
        for (const extension of Constants.AllGrammarExtensions) {
            const candidate = this.getImportedGrammarFile(g, name + extension);
            if (candidate) {
                return this.getCanonicalPath(candidate);
            }
        }

        this.errorManager.grammarError(IssueCode.CannotFindImportedGrammar, g.fileName, importNode.token!, name);

        return undefined;
    }

    /**
     * Determines the path that identifies a file: the same file always gets the same path, whether it was found by
     * name (possibly relative to the current directory), by a relative or by an absolute path, or through a symbolic
     * link. Grammar files are cached and checked for import cycles by this path.
     *
     * @param fileName The path of a file.
     *
     * @returns The absolute path of the file without symbolic links, or the normalized path if the file doesn't exist.
     */
    public getCanonicalPath(fileName: string): string {
        try {
            return fileSystem.realpathSync(fileName, { encoding: "utf8" }) as string;
        } catch {
            return resolvePath(".", fileName);
        }
    }

    /**
     * Loads an imported grammar file. Grammars are cached by their path, so a file that is imported more than once
     * (also by name and by path) is loaded only once, and two files that declare the same grammar name don't replace
     * each other.
     *
     * @param g The importing grammar.
     * @param importNode The node of the import.
     * @param fileName The canonical path of the grammar file, as returned by {@link findImportedGrammarFile}.
     *
     * @returns The imported grammar or null if it could not be parsed.
     */
    public loadImportedGrammarFile(g: Grammar, importNode: GrammarAST, fileName: string): Grammar | null {
        let imported = this.importedGrammars.get(fileName);
        if (!imported) {
            g.tool.logInfo({ component: "grammar", msg: `load ${fileName} from ${g.fileName}` });

            const content = fileSystem.readFileSync(fileName, { encoding: "utf-8" });
            const input = CharStream.fromString(content as string);
            input.name = basename(fileName);

            const result = this.parse(input);
            if (!result) {
                return null;
            }

            imported = this.createGrammar(result);
            imported.fileName = fileName;
            this.importedGrammars.set(fileName, imported);
        }

        return imported;
    }

    public parseGrammarFromString(grammar: string): GrammarRootAST | undefined {
        return this.parse(CharStream.fromString(grammar));
    }

    public parse(input: CharStream): GrammarRootAST | undefined {
        const lexer = new ToolANTLRLexer(input, this);
        const tokens = new CommonTokenStream(lexer);
        const p = new ToolANTLRParser(tokens, this);
        const grammarSpec = p.grammarSpec();

        if (p.numberOfSyntaxErrors > 0) {
            return undefined;
        }

        const result = ParseTreeToASTConverter.convertGrammarSpecToAST(grammarSpec, tokens);
        result.toolConfiguration = this.toolConfiguration;

        return result;
    }

    public getImportedGrammarFile(g: Grammar, fileName: string): string | undefined {
        let candidate = fileName;
        if (!fileSystem.existsSync(candidate)) {
            // Check the parent dir of input directory..
            const parentDir = dirname(g.fileName);
            candidate = parentDir + "/" + fileName;

            // Try in lib dir.
            if (!fileSystem.existsSync(candidate)) {
                const libDirectory = this.toolConfiguration.lib;
                if (libDirectory) {
                    candidate = libDirectory + "/" + fileName;
                    if (!fileSystem.existsSync(candidate)) {
                        return undefined;
                    }

                    return candidate;
                }
            }
        }

        return candidate;
    }

    public logInfo(info: { component?: string, msg: string; }): void {
        this.logMgr.log(info);
    }

    public getNumErrors(): number {
        return this.errorManager.errors;
    }

    public exit(e: number): void {
        process.exit(e);
    }

    public panic(): void {
        throw new Error("ANTLR panic");
    }

    /**
     * Manually get option node from tree.
     *
     * @param root The root of the grammar tree.
     * @param option The name of the option to find.
     *
     * @returns The option node or null if not found.
     */
    private static findOptionValueAST(root: GrammarRootAST, option: string): GrammarAST | null {
        const options = root.getFirstChildWithType(ANTLRv4Parser.OPTIONS) as GrammarAST | null;
        if (options !== null && options.children.length > 0) {
            for (const o of options.children) {
                const c = o as GrammarAST;
                if (c.getType() === ANTLRv4Parser.ASSIGN && c.children[0].getText() === option) {
                    return c.children[1] as GrammarAST;
                }
            }
        }

        return null;
    }

    /**
     * Finds the generator for a grammar, if none is given explicitly.
     *
     * @param generators The configured target generators.
     * @param g The grammar to generate.
     *
     * @returns The first generator which supports the language of the grammar, or the first generator if none does
     *          (or the grammar has no language).
     */
    private static findGenerator(generators: ITargetGenerator[], g: Grammar): ITargetGenerator | undefined {
        const language = g.getOptionString("language");
        if (language === undefined) {
            return generators.at(0);
        }

        return generators.find((generator) => {
            return supportsLanguage(generator, language);
        }) ?? generators.at(0);
    }

    private processGrammarsOnCommandLine(): void {
        // Processing changes the grammars, so each generator gets its own copy of them. Without a generator the
        // grammars are processed once, which only works for grammars with the language None.
        const generators = this.toolConfiguration.generators;
        const runs = generators.length > 0 ? generators : [undefined];

        for (const [run, targetGenerator] of runs.entries()) {
            // Errors (e.g. syntax errors) would only be reported again for the next generator.
            if (this.errorManager.errors > 0) {
                break;
            }

            const sortedGrammars = this.sortGrammarByTokenVocab(this.toolConfiguration.grammarFiles);
            for (const t of sortedGrammars) {
                if (!this.isGeneratedWith(t, targetGenerator, run === 0)) {
                    continue;
                }

                const g = this.createGrammar(t);
                g.fileName = t.fileName;

                if (this.toolConfiguration.generationOptions.generateDependencies) {
                    g.loadImportedGrammars();
                    const dep = new BuildDependencyGenerator(this, g, this.toolConfiguration.generationOptions,
                        targetGenerator!, this.toolConfiguration.lib);
                    console.log(dep.getDependencies());
                } else if (this.errorManager.errors === 0) {
                    this.process(g, this.toolConfiguration, true, targetGenerator);
                }
            }
        }
    };

    /**
     * Determines whether a grammar is processed with a target generator. The `language` option of the grammar selects
     * the generators: without the option all configured generators are used, otherwise only those which support the
     * language. A grammar with the language `None` is processed once, because it only gets the metadata files, which
     * are the same for all generators.
     *
     * @param root The grammar to check.
     * @param targetGenerator The generator of the current run, or undefined if no generator is configured.
     * @param firstRun True for the first generator. Errors are reported only once, in the first run.
     *
     * @returns True if the grammar is processed with the generator.
     */
    private isGeneratedWith(root: GrammarRootAST, targetGenerator: ITargetGenerator | undefined,
        firstRun: boolean): boolean {
        const language = root.getOptionString("language");

        // Without a generator, processing reports the missing generator for all grammars that need one.
        if (language === undefined || !targetGenerator) {
            return true;
        }

        if (language === noTargetLanguage) {
            return firstRun;
        }

        if (supportsLanguage(targetGenerator, language)) {
            return true;
        }

        const generators = this.toolConfiguration.generators;
        if (firstRun && !generators.some((generator) => { return supportsLanguage(generator, language); })) {
            const configured = generators.map((generator) => { return generator.language; }).join(", ");
            this.errorManager.grammarError(IssueCode.CannotCreateTargetGenerator, root.fileName,
                root.getOptionAST("language")?.token ?? null, language, configured);
        }

        return false;
    }

    /**
     * Initializes the configured target generators that have not been initialized yet. A generator must be set up
     * once before its first use, because its render lookup maps are created there.
     *
     * @param extra A generator to initialize too, which need not be in the configuration.
     */
    private setUpGenerators(extra?: ITargetGenerator): void {
        const generators = extra ? [...this.toolConfiguration.generators, extra] : this.toolConfiguration.generators;
        for (const generator of generators) {
            if (!initializedGenerators.has(generator)) {
                generator.setUp();
                initializedGenerators.add(generator);
            }
        }
    }

    static {
        ClassFactory.createTool = () => {
            return new Tool();
        };
    }
}
