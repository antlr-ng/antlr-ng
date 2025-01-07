[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/mike-lischke/ANTLRng/nodejs.yml?style=for-the-badge&logo=github)](https://github.com/mike-lischke/antlr-ng/actions/workflows/nodejs.yml)[![Weekly Downloads](https://img.shields.io/npm/dw/antlr-ng?style=for-the-badge&color=blue)](https://www.npmjs.com/package/antlr-ng)
[![npm version](https://img.shields.io/npm/v/antlr-ng?style=for-the-badge&color=yellow)](https://www.npmjs.com/package/antlr-ng)

<img src="https://raw.githubusercontent.com/mike-lischke/mike-lischke/master/images/ANTLRng2.svg" title="ANTLR Next Generation" alt="ANTLRng" width="96" height="96"/><label style="font-size: 70%">Part of the Next Generation ANTLR Project</label>


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

This project started as a TypeScript port of the old ANTLR4 tool (originally written in Java) and includes the entire feature set of the the Java version and is constantly enhanced.

## Status

Even though the tool is already pretty solid and generates exactly the same output like the old ANTLR4 jar, it is still not considered production ready. All (relevant) original unit tests have been ported and run successfully. Additionally, the tool was tested with all grammars in the [grammars-v4](https://github.com/mike-lischke/grammars-v4) repository.

See the [milestone 3](https://github.com/mike-lischke/ANTLRng/issues/10) for the current status and the plan.

The tool currently runs only in a Node.js environment, but it is planned to make it run in browsers later.

## Getting Started

The first thing needed is a grammar, which defines the language you want to parse. Don't confuse that with the target language, which is the programming language for which you want to generate the parser and lexer files.

Here's a super simple grammar:

```antlr
grammar HelloWorld;

greeting: hello world EOF;

hello: 'hello';
world: 'world';

WS: [ \n\t]+ -> skip;

```

This defines a set of rules that comprise a very simple language (one that can parse the input `hello world` only, but with any number of whitespaces around each word).

Save this text as `HelloWorld.g4` file (in your project folder, where you have installed the antlr-ng node package), which you can use now to let antlr-ng generate a parser and lexer for. Open a terminal in the project root and execute:

```bash
npx antlr-ng -Dlanguage=TypeScript -o generated/ HelloWorld.g4
```

> The tool `npx` should be installed along with your NPM binary.
 
This will create a number of files you can ignore for now, except `HelloWorldLexer.ts` and `HelloWorldParser.ts`, which are the two classes for parsing input. We got TypeScript output because `TypeScript` was defined as target language. By using `-Dlanguage=Python3` it will instead generate .py files.

> Language identifiers are case-sensitive! You have to use exactly the same string as given in the list in the first paragraph. Watch out for the special identifiers for C++ and C#!

You now can import the generated classes and write a full parser application. This is however target language dependent. For TypeScript it looks like this:

```typescript
import { CharStream, CommonTokenStream }  from 'antlr4ng';
import HelloWorldLexer from './generated/HelloWorldLexer';
import HelloWorldParser from './generated/HelloWorldParser';

const text = "hello \n \t world\n"
const input = CharStream.fromString(text);
const lexer = new HelloWorldLexer(input);
const tokens = new CommonTokenStream(lexer);
const parser = new HelloWorldParser(tokens);
const tree = parser.greeting();
```

Note the use of the `greeting()` method, which was auto generated from the `greeting` parser rule.

More information about target specific topics will follow as this project evolves. You can also use the docs from the old ANTLR4 tool, but keep in mind that there might be differences (especially how to invoke the tool).

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
