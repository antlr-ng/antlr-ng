<p align="center">
<img src="https://raw.githubusercontent.com/mike-lischke/website-antlr-ng/main/src/assets/images/antlr-ng-logo3.svg" title="ANTLR Next Generation" alt="antlr-ng the parser generator" height="200"/><br/>
<label style="font-size: 90%">Part of the Next Generation ANTLR Project</label>
</p>
<hr />

# antlr-ng Release Notes

## Unreleased

- Added the Go target generator (`GoTargetGenerator`), which replaces the StringTemplate based Go target. It
  produces the same code as the ANTLR4 Go target, formatted for `gofmt`, and marks generated files with the
  `// Code generated ... DO NOT EDIT.` line.
- Added the PHP target generator (`PHPTargetGenerator`), which replaces the StringTemplate based PHP target.
- Added the Swift target generator (`SwiftTargetGenerator`), which replaces the StringTemplate based Swift target.
- Added the Python 3 target generator (`Python3TargetGenerator`), which replaces the StringTemplate based Python3 target.
- Added the Java target generator (`JavaTargetGenerator`), which replaces the StringTemplate based Java target.
  Its `renderSerializedATN` converts the serialized ATN to (segmented) string literals, so the Java specific
  `SerializedJavaATN` model and the `forJava` special casing in the code generator were removed.
- Added the Dart target generator (`DartTargetGenerator`), which replaces the StringTemplate based Dart target.
- Removed StringTemplate completely: the `stringtemplate4ts` dependency, the `templates/` folder (it only held the
  unused JavaScript template group) and the `copy-templates` step. The CLIs no longer copy templates into the virtual
  file system. `JavaScript` is no longer a target language: JavaScript projects use the TypeScript target and
  transpile its output.
- `Issue` now exposes where an issue was found: `fileName`, `line`, `column`, and for issues at a token also
  `endLine` and `endColumn` (exclusive; columns count code points). `message` returns the issue text without
  severity, code and location, and `error` returns the causing exception. This lets tools such as language servers
  show an issue at its exact range instead of parsing the rendered string. `ErrorManager.syntaxError` takes the
  offending token as a new optional last parameter.
- Fixed the rendering of `$token.channel` references in actions, which was not handled by the generator base class.
- Fixed generation with a target generator that was created in a config file: the tool never called the
  generator's `setUp` method, so code generation failed with an internal error (`Cannot read properties of
  undefined (reading 'get')`). The tool now sets up each generator once before using it.
- Fixed loading a config file with `-c`/`--config` when it is given as a relative or a Windows path, and running the
  CLI with the default `lib` folder (`.`).
- Fixed importing the `antlr-ng` package as a library: interface re-exports failed at runtime (`does not provide an
  export named 'IToolParameters'`). `isolatedModules` is now enabled, so the type check catches this.
- Fixed token and rule property references (`$label.text`, `$label.start`, ...) for labels which are keywords in the
  target language in the TypeScript, C++, C# and Swift generators. The label is declared with its escaped name, but
  the references used the raw name. Also fixed `$label.ctx` in TypeScript (unbalanced parenthesis) and `$label.int`
  in C# (`..Text`).
- Fixed the token set test for sets containing EOF in the TypeScript, Go, C++ and C# generators. The negative bitset
  offset was dropped, so EOF was rejected by the generated parser.
- Errors during code generation are now reported as internal errors instead of making the tool fail without a message,
  and a configuration without target generators is rejected with a clear error. The CLI runner now also writes the
  `--log` file to disk.
- Fixed Bug #100: the tool hung on a rule reference with a bare element option (e.g. `r <true>`), because the tree
  walkers did not skip option nodes of type ID. Such options also made left-recursive rules fail with error 92.
- Fixed Bug #98: a label on the wildcard (`x=.`, `x+=.`) was rejected with error 58, because the label check allowed `*`
  instead of `.`. A list label on the wildcard now also generates an implicit token label, like on a token reference.
- Fixed Bug #121: the TypeScript, C++ and C# generators failed with "Maximum call stack size exceeded" for very large
  parsers (more than about 125k lines), and the ATN optimizer had the same problem for very large ATNs. The Dart, Go,
  PHP, Python 3 and Swift generators had the same problem in the serialized ATN and in the lexer action and predicate
  functions. `GeneratorBase` now has a protected `append()` helper for appending large line lists. A custom generator which declares its own
  private `append` member has to rename or remove it.
- Fixed the `interpreter` CLI, which failed for every grammar with "The ATN must be created before creating a lexer
  interpreter", because it configured no target generator and the tool only builds the ATN per generator. Its
  `--profile` option now takes the name of the CSV file. Before, profiling was always on and wrote `filename.csv`, and
  `--profile x.csv` treated `x.csv` as a grammar file. The profile's time column is now in milliseconds, as labeled.
- Fixed Bug #70: the TestRig (`grun`) could not load the generated lexer and parser on Windows.
- Fixed `generateDependencies`, which failed for every grammar with "internal error: Invalid URL": the file names were
  built with `new URL()` from plain paths. The generated file list now names the files the code generation writes:
  base listeners and visitors only with `generateBaseListener`/`generateBaseVisitor`, no listener or visitor for
  lexer grammars, declaration files only with `generateDeclarationFile`, and interpreter data files with
  `generateInterpreterData`. Imported grammars are only listed as dependencies. The dependency line has the make
  format `T.g4: A.tokens`, and spaces in the output directory are escaped. The CLI no longer fails after listing the
  dependencies because of the missing output directory.

## 1.0.10

- Fixed Bug #63: Newest ANTLRv4*.g4/LexerAdaptor.ts doesn't work for a couple of grammars
- Fixed Bug #61 Visitor file and Listener file generations do not get packageName passed to them
- Set up automatic API documentation (typedoc), which is used on the antlr-ng home page

## 1.0.9

Removed the need for a top-level await, which gets in the way when transpiling the code to CJS (e.g. in VS Code extensions).

## 1.0.8

Now certain error reporting/handling types are exported, to help consumers of the tool class to handle issues reported from the tool.

## 1.0.7

- Fixed a wrong match in NESTED_ACTION in the antlr-ng lexer.

## 1.0.6

- Fixed semantic predicate handling in left recursive rules (which showed a flaw in the antlr-ng lexer).
- Fixed cloning GrammarAST nodes with options.

## 1.0.5

- Upgraded antlr4ng dependency to fix a bug, for which also a test was added.
- Fixed TestRig execution.

## 1.0.4

Fixed some ANTLR grammar errors. The official ANTLRv4 grammar does not fully reflect the grammar used in ANTLRv4 (which is an ANTLRv3 grammar).

## 1.0.2 - 1.0.3

Upgraded dependencies that included the old antlr4ng-cli package.

## 1.0.1

The test rig and the interpreter tools work now after installation of antlr-ng. Additionally the alias `grun` was added for the test rig.

## 1.0.0

This is the first production-ready release of antlr-ng. All reported problems until now have been solved and tool shows a solid preformance, producing result just like the ANTLR4 4.13.2 release, from which it was derived.

- Added more Unicode data files to allow using additional Unicode characters in lexer charsets (EastAsianWidth, GraphemeBreakProperty, SentenceBreakProperty).
- Removed LexBasic.g4 grammar, which was thought as a sharable grammar, but was never used but by ANTLRv4Lexer.g4. This changed certain error messages, which now print the token text instead of a token name (e.g. ';' instead of SEMI).

## 0.7.0

- All remaining ANTLR3 types have been removed or migrated.
- The tool source is now fully cleaned up, including the comments. Removed thousands of lines of code (many from generated tree walkers and others by simplifying the overcomplicated class structure).
- Made TestRig (grun) and Interpreter tools working.
- Changed all embedded target templates: don't use the underscore char in template names.
- Upgraded 3rd party libs, which required to adjust the supported parameter syntax for the tool (only one letter short parameter, so `-lib` became `--lib`)
- Error types (now named issue types, because they include info + warning in addition to errors) converted to a simpler structure. There's now a real enum for each type and a map with the details for them. Renamed the enum/constants to camelCase for better readability. Also moved other related structures (severity) to the new implementation.
- Converted many all-uppercase identifiers and methods to PascalCase/camelCase.
- Fixed all reported bugs.

## 0.6.0

Fixed two problems in the token vocab parser (key/value parsing and import location).

The tool is now bootstrapping itself, that is, the parsers needed for the tool and its tests are now generated by the previous version of itself. No Java needed anymore!

## 0.5.2

Improved action escape handling. A simple search and replace doesn't work well.

## 0.5.1

Token vocab import handling was fixed and the lib dir parameter finally included in the import path search.

## 0.5.0

First public release, for public testing. Still some way to go.

## 0.4.0

The tool went through intensive testing by Ken Domino, who sent it through the entire grammar-v4 repository. Fixed quite a few bugs that came out of that.

## 0.3.0

All tool tests have been ported to TypeScript and are now running fine. The tool is now fully functional and can be used to generate parsers and lexers in TypeScript. However, the tests don't cover all features yet (listeners, visitors etc.), so there might still be some issues.

## 0.2.0

- Big reorganization of the project. Everything of the TS runtime has been moved to an own project.
- The tool files all build fine now.
- Had to add ports for certain ANTLR3 classes for now.
- Tool unit tests are not fixed yet.


## 0.1.0

- Initial commit.
- TypeScript files generated from Java.
- At this point the project contained both, the ANTLR4 tool and the ANTLR4 TS runtime.
