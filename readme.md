[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/mike-lischke/ANTLRng/nodejs.yml?style=for-the-badge&logo=github)](https://github.com/mike-lischke/antlr-ng/actions/workflows/nodejs.yml)[![Weekly Downloads](https://img.shields.io/npm/dw/antlr-ng?style=for-the-badge&color=blue)](https://www.npmjs.com/package/antlr-ng)
[![npm version](https://img.shields.io/npm/v/antlr-ng?style=for-the-badge&color=yellow)](https://www.npmjs.com/package/antlr-ng)

<p align="center">
<img src="https://raw.githubusercontent.com/mike-lischke/mike-lischke/master/images/antlr-ng.svg" title="ANTLR Next Generation" alt="antlr-ng the parser generator" height="200"/><br/>
<label style="font-size: 120%">Part of the Next Generation ANTLR Project</label>
</p>


# antlr-ng - Next Generation ANTLR

**Another Tool for Language Recognition**

A tool/package that takes a defined language (provided in a grammar file) and generates  parser and lexer classes in one of the supported target languages. These classes can be used in your project to parse input specified by the grammar file. Supported target languages are:

- TypeScript/JavaScript
- Java
- C++ (language identifier: Cpp)
- C# (language identifier: CSharp)
- Go
- Python3
- Dart
- Swift
- PHP

This project started as a TypeScript port of the old ANTLR4 tool 4.13.2 (originally written in Java) and includes the entire feature set of the the Java version and is constantly enhanced.

## Status

Even though the tool is already pretty solid and generates exactly the same output like the old ANTLR4 jar, it is still not considered production ready. All (relevant) original unit tests have been ported and run successfully. Additionally, the tool was tested with all grammars in the [grammars-v4](https://github.com/mike-lischke/grammars-v4) repository.

See the [milestone 3](https://github.com/mike-lischke/ANTLRng/issues/10) for the current status and the plan.

The tool currently runs only in a Node.js environment, but it is planned to make it run in browsers later.

## Getting Started

There are different ways how to use the antlr-ng tool. All scenarios need Node.js being installed on your box. If you haven't done that yet get it from https://www.nodejs.org. Any version 20.x or later can be used and any platform which runs Node.js also can run antlr-ng.

Use cases:

1. As a replacement for ANTLR4's Java jar. This scenario requires no knowledge of TypeScript or JavaScript. Just replace your call to java by a call to antlr-ng (with some minimal parameter changes).
2. As a tool in the build setup of your TypeScript/JavaScript project.
3. Directly in your code. Instantiate the tool class and do everything in memory instead of the file system.

### Case 1: Use antlr-ng as ANTLR4 jar replacement

Install the antlr-ng tool as a global command on your box by running:

```bash
npm i -g antlr-ng
```

This puts it in the global NPM cache and creates a link to it in a folder which is in your system PATH. Hence you can directly execute it:

```bash
> antlr-ng -h
Usage: program [options] <grammar...>

Arguments:
  grammar                                A list of grammar files.

Options:
  -o, --output-directory <path>          specify output directory where all output is generated
  -lib, --lib-directory <path>           specify location of grammars, tokens files
  --atn [boolean]                        Generate rule augmented transition network diagrams. (default: false)
  -e, --encoding <string>                Specify grammar file encoding; e.g., ucs-2. (default: "utf-8")
  -mf, --message-format [string]         Specify output style for messages in antlr, gnu, vs2005. (choices: "antlr", "gnu", "vs2005", default: "antlr")
  -lm, --long-messages [boolean]         Show exception details when available for errors and warnings. (default: false)
  -l, --generate-listener [boolean]      Generate parse tree listener. (default: true)
  -v, --generate-visitor [boolean]       Generate parse tree visitor. (default: false)
  -p, --package <name>                   Specify a package/namespace for the generated code.
  -d, --generate-dependencies [boolean]  Generate file dependencies. (default: false)
  -D, --define <key=value...>            Set/override a grammar-level option.
  -w, --warnings-are-errors [boolean]    Treat warnings as errors. (default: false)
  -f, --force-atn [boolean]              Use the ATN simulator for all predictions. (default: false)
  --log [boolean]                        Dump lots of logging info to antlrng-timestamp.log. (default: false)
  --exact-output-dir [boolean]           All output goes into -o dir regardless of paths/package (default: false)
  -V, --version                          output the version number
  -h, --help                             display help for command
```

The parameter list should look very familiar, except that it defines a short hand version and a long version of each parameter. This is why you have to update your parameter list when replacing ANTLR4 by antlr-ng. A typical invocation looks like this:

```bash
antlr-ng -Dlanguage=CSharp --exact-output-dir -o ./tests/generated ./tests/grammars/Java.g4
```

### Case 2: Using antlr-ng as package in your project

In this scenario you install the tool as another dev dependecy. In your project folder run:

```bash
npm i --save-dev antlr-ng
```

You can then create an NPM script in your package.json to handle your grammar(s):

```json
    "scripts": {
        "generate-parser": "antlr-ng -Dlanguage=TypeScript --exact-output-dir -o ./src/generated ./src/grammars/MyGrammar.g4",
    ...
    },
```

Using the generated parser in your project is subject to the target language of it. For TypeScript and JavaScript you need antlr4ng as target runtime. Read its readme file for [an example](https://github.com/mike-lischke/antlr4ng?tab=readme-ov-file#usage) how to use the generated parser. 

Just note: antlr4ng-cli has **not** been updated to use antlr-ng yet. This will be done as soon as we have a production ready release of the tool. In fact antlr4ng-cli will be replaced by antlr-ng in the future.

### Case 3: Using antlr-ng in your code

This scenario allows you to run the generation process in memory. All unit tests in the package use this approach. Details of that will be laid out in a separate document later.

# What is the ANTLR Next Generation Project?

## History

ANTLR (ANother Tool for Language Recognition) emerged from the Purdue Compiler Construction Tool Set [PCCTS](https://www.antlr2.org/history.html), originating in 1988 when Terence Parr, working under Professor Hank Dietz at Purdue University, began developing a parser generator. Initially called YUCC and released in February 1990, the tool evolved through critical milestones: version 1.00 introduced LL(1) parsing in 1992, version 2.2.0 added grammar inheritance, and subsequent versions expanded language support and parsing capabilities.

Key contributors like Sam Harwell, who co-authored ANTLR 4, and Eric Vergnaud, who developed Python and JavaScript targets, helped transform ANTLR into a robust parser generator (see [Q&A with T. Parr on ANTLR](https://dzone.com/articles/qa-with-terence-parr-on-antlr)). Under Parr's continued leadership, ANTLR has become a widely-used tool for language recognition, supporting multiple programming languages and platforms. The project reached significant maturity with ANTLR 4's Adaptive LL(*) parsing algorithm, representing a sophisticated approach to parsing complex language grammars.

## Future

ANTLR4, the latest major release of the tool, has reached a high level of maturity and development has essentially stopped. At the time of writing, there are over 800 issue reports and nearly 150 pull requests. Most of the reported issues or PRs have nothing to do with the tool itself, but were created for problems in one of the target runtimes included in the ANTLR4 repository. This shows how important it is to make a cut and separate the ANTLR tool from it's runtimes. This is one of the main goals of the **ANTLR Next Generation Project**.

This project is conceived as a biotope of various parts, rooted in a new ANTLR tool (in this repository) and accompanied by various tools made specifically for it (such as IDE plugins, debuggers, command line tools, documents and blogs), as well as individual target runtimes that are no longer part of the ANTLR repository. These are maintained by their owners, who know the language the target is for by heart and are responsible for release and maintenance.

By simplifying the code base, such as removing very old parts of the code, tidying everything up and laying the groundwork for new development, it is hoped that antlr-ng will grow and open doors for future improvements and all those great ideas that the community brought to ANTLR4 but never had a chance to get in.

# Advanced Topics

The sections below are meant for developers working on antlr-ng or are interested in the internals of this project.

## Design Goals

- Make the tool work in browsers too, which requires an abstraction of file system access used in the tool.
- Strict separation of the tool and its runtimes, which simplifies the maintenance and releases of the tool a lot.
- Runtimes are completely handled by their owners, using a plugin system as used by many other tools, and are no longer part of the tool.
- The new tool is supposed to run in web browsers, as well as in Node.js environments. No further dependency is required, beyond that (especially no Java).
- The ANTLR language and the tool are developed further, to make it more powerful and easier to use (see next chapter).
- Remove dependency on ANTLR3.
- Replace the rather generic string template system by a type safe template engine, which provides inline code hints, to simplify writing target language mappers.

## Feature Ideas

A loose collection of thoughts.

### Grammars

- Rework the import feature. Allow paths for the imports and allow to override imported rules. Make diamond imports working properly.
- Allow specifying a config file for tool runs, instead only individual command line parameters.
- Allow generating files for multiple grammars in their own target folders (good for mass production like needed in the runtime tests).
- Allow specifying user defined prefixes/postfixes for generated methods (from parser/lexer rules) or allow a complete own pattern.

### Target Specific Ideas

This is a tricky field and not easy to re-design. The original decision to allow target (language) specific code in a grammar made (and makes) sharing/reusing grammars very difficult. Below are some ideas:

- Find a better solution for target specific code, e.g. by extending the ANTLR language with target specific named action blocks.
- Even better: disallow any target specific code:
    - Simple (unnamed) actions can be implemented in a base class as alt enter and exit listener methods (requires to use label alts).
    - For predicates introduce a small and simple expression syntax, which uses mappings defined in the language template. This is not as flexible as the current solution, but sometimes less is more.
    - No longer support rule parameters, init values and return values. They are rarely used and create a too tight connection to the generated code. Additionally, they prevent further development of the code generator (maybe at some point it is no longer meaningful to generate plain methods?).
        - Requires a different solution for left-recursion removal which uses precedence values as rule parameters.
- Allow target authors to define new named actions, to avoid situations like for the current C++ target, with its ugly action names.
    - Even better: avoid named actions altogether, but they are very useful for including copyrights, headers and class specific code. This is probably the most difficult feature to re-design. Possible solutions are:
        - Support a very simple macro syntax in the grammar to allow replacing text blocks which are read from an external file (which then can contain target specific code etc.). This would also lower duplication (like the same copyright in different generated files).

Maybe we can take all this a step further by defining "language packs", a single file or a collection of files for a specific target language, which is automatically picked up by the ANTLRng tool to generate target specific code.

### New Stuff

- Provide a language server framework, which allows creating a language server for any ANTLR grammar. This could specifically provide required highlighter information for VS Code (syntactic and semantic highlighers).

### Learn From Others

What can we learn from other parser generators? For example [tree-sitter](https://tree-sitter.github.io/tree-sitter/) has a concept of editing a parse tree, which internally will re-parse only the changed part (which is as close to incremental parsing as you can get). It also uses WebAssembly packages as loadable modules that fully handle a language. There's nothing like the ANTLR runtime in this concept. Debugging the parser could be tricky with that approach, however.
