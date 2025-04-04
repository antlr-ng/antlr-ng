[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/antlr-ng/antlr-ng/nodejs.yml?branch=main&style=for-the-badge&color=green&logo=github)](https://github.com/mike-lischke/antlr-ng/actions/workflows/nodejs.yml)
![License](https://img.shields.io/github/license/mike-lischke/antlr-ng?style=for-the-badge&color=lightgreen)
[![Weekly Downloads](https://img.shields.io/npm/dw/antlr-ng?style=for-the-badge&color=blue)](https://www.npmjs.com/package/antlr-ng)
[![npm version](https://img.shields.io/npm/v/antlr-ng?style=for-the-badge&color=yellow)](https://www.npmjs.com/package/antlr-ng)

<p align="center">
<img src="https://raw.githubusercontent.com/mike-lischke/website-antlr-ng/main/src/assets/images/antlr-ng-logo3.svg" title="ANTLR Next Generation" alt="antlr-ng the parser generator" height="200"/><br/>
<label style="font-size: 90%">Part of the Next Generation ANTLR Project</label>
</p>
<hr />

# antlr-ng - Next Generation ANTLR

**Another Tool for Language Recognition**

A tool/package that takes a defined language (provided in a grammar file) and generates  parser and lexer classes in one of the supported target languages. These classes can be used in your project to parse input that should match the language written in that grammar file. Supported target languages are:

- TypeScript
- Java
- C++ (language identifier: Cpp)
- C# (language identifier: CSharp)
- Go
- Python3
- Dart
- Swift
- JavaScript
- PHP

This project started as a TypeScript port of the old ANTLR4 tool 4.13.2 (originally written in Java) and includes the entire feature set of the the Java version and is constantly enhanced.

## Status

The tool is production-ready and generates almost exactly the same output like the old ANTLR4 jar (with some minor differences, because of the use of Unicode 16, instead of 11 in ANTLR4). All (relevant) original unit tests have been ported and run successfully. Additionally, the tool was tested with all grammars in the [grammars-v4](https://github.com/antlr/grammars-v4) repository.

See also the [Version 2 feature planning](https://github.com/mike-lischke/antlr-ng/issues/11) for what's coming up.

The tool currently runs only in a Node.js environment, but it is planned to make it run in browsers later.

## Getting Started

There are different ways how to use the antlr-ng tool. All scenarios need Node.js being installed on your box. The [antlr-ng website](https://www.antlr-ng.org) explains everything you need to run the antlr-ng tool (see Documentation -> Getting Started).

## Release Notes

See [release-notes.md](./release-notes.md).

# What is the ANTLR Next Generation Project?

## History

ANTLR (ANother Tool for Language Recognition) emerged from the Purdue Compiler Construction Tool Set [PCCTS](https://www.antlr2.org/history.html), originating in 1988 when Terence Parr, working under Professor Hank Dietz at Purdue University, began developing a parser generator. Initially called YUCC and released in February 1990, the tool evolved through critical milestones: version 1.00 introduced LL(1) parsing in 1992, version 2.2.0 added grammar inheritance, and subsequent versions expanded language support and parsing capabilities.

Key contributors like Sam Harwell, who co-authored ANTLR 4, and Eric Vergnaud, who developed Python and JavaScript targets, helped transform ANTLR into a robust parser generator (see [Q&A with T. Parr on ANTLR](https://dzone.com/articles/qa-with-terence-parr-on-antlr)). Under Parr's continued leadership, ANTLR has become a widely-used tool for language recognition, supporting multiple programming languages and platforms. The project reached significant maturity with ANTLR 4's Adaptive LL(*) parsing algorithm, representing a sophisticated approach to parsing complex languages.

## Future

ANTLR4, the latest major release of the tool, has reached a high level of maturity and development has essentially stopped. At the time of writing, there are over 800 issue reports and nearly 150 pull requests. Most of the reported issues or PRs have nothing to do with the tool itself, but were created for problems in one of the target runtimes included in the ANTLR4 repository. This shows how important it is to make a cut and separate the ANTLR tool from it's runtimes. This is one of the main goals of the **ANTLR Next Generation Project**.

This project is conceived as a biotope of various parts, rooted in a new ANTLR tool (in this repository) and accompanied by various things made specifically for it (such as IDE plugins, debuggers, command line tools, documents and blogs), as well as individual target runtimes that are no longer part of the ANTLR repository. These are maintained by their owners, who know the language the target is for by heart and are responsible for release and maintenance.

By simplifying the code base, such as removing very old parts of the code, tidying everything up and laying the groundwork for new development, it is hoped that antlr-ng will grow and open doors for future improvements and all those great ideas that the community brought to ANTLR4 but never had a chance to get in.
