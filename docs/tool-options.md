# Tool Configuration

Starting with version 2.0, <span className="antlrng">antlr-ng</span> is configured with a configuration file. The file lists the grammars to process, the target generators that produce the code and the options for both. Command line options are still accepted, but they are deprecated (see [below](#command-line-options)).

## The Configuration File

A configuration file is a JavaScript or TypeScript module whose default export is the configuration. The `defineConfig` function fills in default values for everything you don't specify:

```typescript
// antlr-ng.config.ts
import { defineConfig } from "antlr-ng";
import { TypeScriptTargetGenerator } from "antlr-ng-generators";

export default defineConfig({
    grammarFiles: ["src/grammars/ExprLexer.g4", "src/grammars/ExprParser.g4"],
    generationOptions: {
        outputDirectory: "src/generated",
        generateVisitor: true,
    },
    generators: [new TypeScriptTargetGenerator()],
});
```

> [!NOTE]
> The default target generators will be published as a separate package. `antlr-ng-generators` is the proposed name; it is not published yet.

Pass the file with `-c` (or `--config`):

```bash
npx antlr-ng -c antlr-ng.config.ts
```

The configuration file is loaded with `import()`, so it must be an ES module:

- Use `.mjs` or `.mts` as the file extension, or put `"type": "module"` in the `package.json` next to it. Otherwise a `.js` or `.ts` file is loaded as CommonJS. A TypeScript config loaded as CommonJS gets its own copy of the <span className="antlrng">antlr-ng</span> classes, and code generation fails with an error like `internal error: Unhandled source op type: CodeBlockForOuterMostAlt`.
- A TypeScript configuration file needs a Node.js version that can load TypeScript, or a loader like [tsx](https://tsx.is) (`node --import tsx node_modules/antlr-ng/dist/cli/runner.js -c antlr-ng.config.ts`). Otherwise use a JavaScript file.

A configuration file cannot be combined with other command line options or with grammar files on the command line. Everything goes into the file.

Relative paths in the configuration are resolved against the current working directory, not against the location of the configuration file.

## Configuration Reference

The configuration has this structure. All fields are optional for `defineConfig`. The defaults are given in parentheses.

```typescript
interface IToolConfiguration {
    grammarFiles: string[];
    generators: ITargetGenerator[];
    generationOptions: IGenerationOptions;
    messageFormatOptions: IToolMessageOptions;
    forceAtn: boolean;
    log: boolean;
    lib: string;
}
```

### `grammarFiles` (`[]`)

The grammar files to process. Only list files that belong together, e.g. a lexer and a parser grammar. <span className="antlrng">antlr-ng</span> sorts them so that a grammar is processed after the grammar whose tokens it imports with the `tokenVocab` option. The tool reports an error if the list is empty.

### `generators` (`[]`)

The target generators that produce the code. Each grammar is processed once for each generator, so a single run can produce, for example, a TypeScript and a Java parser. All generators write to the same output directory. Files which are the same for all targets (`.tokens`, `.interp`) are written once per generator, with the same content.

The tool reports an error if no generator is configured. This is also true for the `language = None` grammar option (see [below](#generating-no-code)), because the generator determines how the grammar is analyzed.

See [Writing a Target Generator](/customizing-code-generation) for how to adjust a generator or write your own.

### `generationOptions`

| Option | Default | Description |
| --- | --- | --- |
| `outputDirectory` | `"."` | The folder for all generated files. Generated files go directly into this folder, regardless of the folder of the grammar or the `package` option. Without it, they go into the current working directory, not next to the grammar. |
| `generateListener` | `false` | Generate a parse tree listener. Note the different default: ANTLR4 generated a listener by default. |
| `generateVisitor` | `false` | Generate a parse tree visitor. |
| `generateBaseListener` | `false` | Also generate a base listener class with empty methods (e.g. `TBaseListener.java`). Only used together with `generateListener`. Targets whose listeners have optional methods, like TypeScript, don't need it. |
| `generateBaseVisitor` | `false` | Also generate a base visitor class. Only used together with `generateVisitor`. |
| `generateDeclarationFile` | `false` | Generate declaration files for targets which use them, e.g. C++ header files. |
| `generateInterpreterData` | `false` | Generate interpreter data files (`.interp`). See [Interpreters](/interpreters). |
| `package` | `""` | A package or namespace for the generated code. How it is used depends on the target. For example, the Java generator writes a `package` statement, the C# generator a namespace. Some targets ignore it. |
| `atn` | `false` | Write a DOT graph file for the ATN of each rule (`<grammar>.<rule>.dot`). |
| `generateDependencies` | `false` | Instead of generating code, print the files each grammar reads and writes, one per line. Build tools can use this to find out when to regenerate. |

### `messageFormatOptions`

These options control how errors and warnings are printed.

| Option | Default | Description |
| --- | --- | --- |
| `warningsAreErrors` | `false` | Treat warnings as errors, so that the tool fails when a grammar has warnings. |
| `messageFormat` | `"<severity>(<issueCode>): <location> <message>"` | The format of a message. The placeholders in angle brackets are replaced with the values of the issue. |
| `locationFormat` | `"<file>:<line>:<column>:"` | The format of the `<location>` placeholder. |
| `singleLine` | `true` | Print each message on a single line. |
| `longMessages` | `false` | Currently not used. |

For example, to get messages in the format many editors understand:

```typescript
messageFormatOptions: {
    messageFormat: "<location> <severity>: <message> [<issueCode>]",
    locationFormat: "<file>(<line>,<column>):",
},
```

### `forceAtn` (`false`)

<span className="antlrng">antlr-ng</span> normally generates simple `switch` statements for decisions where one token of lookahead is enough. With this option all decisions use the adaptive LL(*) prediction instead. This is mostly useful for testing the prediction.

### `log` (`false`)

Write a log file with internal processing details to the current working directory (`antlr-ng-<timestamp>.log`). For example, it shows how left-recursive rules are rewritten.

### `lib` (`"."`, deprecated)

A folder to search for imported grammars and `.tokens` files. This will be removed once grammar imports can take paths.

## Generating No Code

The grammar option `language` no longer selects the target language; the configured generators do that. The only value that still has an effect is `None`: with `options { language = None; }` in a grammar, <span className="antlrng">antlr-ng</span> processes it and writes the interpreter data and token files, but no code.

## Command Line Options

The command line options from version 1 are still accepted when no configuration file is given, but they are deprecated. Since there is no option to select a target generator, a run without a configuration file currently stops with this error:

```
fatal(110): no target generators configured; use a config file which lists at least one generator
```

Here is how the old options map to the configuration:

| Command line option | Configuration |
| --- | --- |
| `<grammar...>` | `grammarFiles` |
| `-o`, `--output-directory` | `generationOptions.outputDirectory` |
| `-l`, `--generate-listener` | `generationOptions.generateListener` |
| `-v`, `--generate-visitor` | `generationOptions.generateVisitor` |
| `-p`, `--package` | `generationOptions.package` |
| `--atn` | `generationOptions.atn` |
| `-d`, `--generate-dependencies` | `generationOptions.generateDependencies` |
| `-w`, `--warnings-are-errors` | `messageFormatOptions.warningsAreErrors` |
| `--long-messages` | `messageFormatOptions.longMessages` |
| `-f`, `--force-atn` | `forceAtn` |
| `--log` | `log` |
| `--lib` | `lib` |
| `-Dlanguage=<target>` | `generators` |
| `-D<option>=<value>` | No replacement. Set grammar options in the grammar. |
| `-e`, `--encoding` | No replacement. Grammar files are read as UTF-8. |
| `--exact-output-dir` | No replacement. Output always goes directly into the output directory. |
