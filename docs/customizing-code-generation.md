# Writing a Target Generator

<span className="antlrng">antlr-ng</span> 2.0 generates code with target generators: TypeScript classes, one per target language, which turn a processed grammar into source code. They replace the StringTemplate files of ANTLR4. You choose the generators in the [configuration file](/tool-options), so you can adjust one of the default generators or write a generator for a new language without changing <span className="antlrng">antlr-ng</span> itself.

> [!NOTE]
> The default target generators will be published as a separate package. `antlr-ng-generators` is the proposed name; it is not published yet.

## How Code Generation Works

For each grammar and each configured generator, <span className="antlrng">antlr-ng</span>:

1. Calls the generator's `setUp()` method once before the first grammar.
2. Analyzes the grammar and builds an output model: a tree of objects that describe the code to generate, independent of the target language. There is an object for the parser file (`ParserFile`), for each rule (`RuleFunction`), for each decision (e.g. `LL1AltBlock`), for each token match (`MatchToken`) and so on. The classes are in the `OutputModelObjects` namespace.
3. Calls the generator's top-level render methods (`renderParserFile`, `renderLexerFile`, `renderListenerFile` etc.) with the root objects of the model. Each one returns the content of a file as a string, which the tool writes to the output directory. The file names come from `getRecognizerFileName`, `getListenerFileName` etc. and the `codeFileExtension` of the generator.

The render methods for the nested model objects return `Lines`, an array of strings, which the caller indents and joins. `GeneratorBase` dispatches from a model object to its render method by the object's class. For example, a `MatchToken` object is rendered by `renderMatchToken`.

## Adjusting an Existing Generator

To change parts of the generated code, extend the generator and override the methods for those parts. This example puts a license comment at the top of each generated file:

```typescript
// LicensedTypeScriptGenerator.ts
import { type Lines, OutputModelObjects } from "antlr-ng";
import { TypeScriptTargetGenerator } from "antlr-ng-generators";

export class LicensedTypeScriptGenerator extends TypeScriptTargetGenerator {
    protected override renderFileHeader(file: OutputModelObjects.OutputFile): Lines {
        return [
            "/* Copyright (c) Example Corp. Licensed under the MIT License. */",
            ...super.renderFileHeader(file),
        ];
    }
}
```

Then use it in the configuration file instead of the original generator:

```typescript
import { defineConfig } from "antlr-ng";
import { LicensedTypeScriptGenerator } from "./LicensedTypeScriptGenerator.js";

export default defineConfig({
    grammarFiles: ["Expr.g4"],
    generators: [new LicensedTypeScriptGenerator()],
});
```

Most render methods for model objects (e.g. `renderMatchToken`) are declared as arrow function properties, not as methods. A subclass can replace them, but cannot call the original version with `super`:

```typescript
protected override renderMatchToken = (t: OutputModelObjects.MatchToken): Lines => {
    // Complete replacement of the original rendering.
};
```

The generator reads the lookup table of render functions in `setUp()`, after the constructor ran, so replaced functions are used.

## Writing a New Generator

A generator for a new language extends `GeneratorBase` from the `antlr-ng` package. `GeneratorBase` implements the parts which are the same for most languages: the dispatch from model objects to render methods, the rendering of action code, string literal conversion, file names and some helpers like `renderList`. It leaves the language-specific parts abstract:

- **Identity:** `id` (a unique ID like `"generator.mycompany.kotlin"`), `version`, `language` (a readable name), `languageSpecifiers` (names that identify the language, e.g. `["kotlin", "kt"]`) and `codeFileExtension` (e.g. `".kt"`).
- **Reserved words:** `reservedWords`, the identifiers of the target language. Grammar symbols with these names are escaped (by default with a `_` suffix, see `escapeWord`).
- **Files:** `renderParserFile`, `renderLexerFile`, `renderListenerFile`, `renderBaseListenerFile`, `renderVisitorFile` and `renderBaseVisitorFile`. They get the model object, a flag whether the declaration file (e.g. a C++ header) is requested, and the generation options from the configuration.
- **Model objects:** one render function per kind of model object, e.g. `renderInvokeRule`, `renderLL1AltBlock` or `renderTokenDecl`.
- **Left recursion:** the `renderRecRule...` functions, which return the code that <span className="antlrng">antlr-ng</span> inserts when it rewrites left-recursive rules.
- **Tests:** `renderTestFile`, which renders a small program that parses an input with the generated parser. The <span className="antlrng">antlr-ng</span> test suite uses it to run grammars with a target.

Properties with default values describe the capabilities of the target language and can be overridden: `wantsBaseListener` and `wantsBaseVisitor`, `needsDeclarationFile` and `declarationFileExtension`, `supportsOverloadedMethods`, `isATNSerializedAsInts`, `inlineTestSetWordSize`, `lexerRuleContext` and `ruleContextNameSuffix`. Their descriptions are in the `ITargetGenerator` interface.

The generated code runs on a runtime library for the target language, which provides the base classes of the generated lexers and parsers and runs the ATN. A new target needs such a runtime as well. Its API decides what the generated code looks like.

The easiest way to start is to copy the default generator for the language which is closest to yours, and change it step by step. Pass `true` to the `GeneratorBase` constructor (`super(true)`) to get start and end markers for many parts in the generated code, which shows which render function produced a piece of code.

A generator can take settings for its target as constructor parameters, since it is created in the configuration file.

## Generator API

The `antlr-ng` package exports the API for generators:

| Export | Purpose |
| --- | --- |
| `ITargetGenerator` | The interface the tool uses. Describes all members. |
| `GeneratorBase` | The base class for generators. |
| `OutputModelObjects` | The classes of the output model. |
| `Lines`, `CodePoint`, `NamedActions` | Types used in the render functions. |
| `IGenerationOptions` | The generation options from the configuration. |
| `Rule`, `GrammarASTWithOptions`, `OptionalBlockAST`, `Character` | Grammar and helper classes used by some render functions. |
| `antlrVersion` | The version of <span className="antlrng">antlr-ng</span>, e.g. for a file header. |
