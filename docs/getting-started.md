# Getting Started

The <span className="antlrng">antlr-ng</span> node package can be used in two ways: as a command line tool or as a library in your TypeScript/JavaScript project. It needs [Node.js](https://www.nodejs.org) being installed on your box. Any version 20.x or later can be used and any platform which runs Node.js also can run <span className="antlrng">antlr-ng</span>.

## Using the Tool On the Command Line

This is probably the most common use case, especially when switching from ANTLR4
to <span className="antlrng">antlr-ng</span>. First install the tool globally via NPM:

```bash
npm i -g antlr-ng</code></pre>
```

If you don't have NPM installed, you can download Node.js from https://www.nodejs.org which includes NPM. This is all you need to run the tool.

The installation command puts the package in the global NPM cache and creates a link to it in a folder which is in your system PATH. Hence you can directly execute it:

```bash
> antlr-ng -h
Usage: program [options] <grammar...>

Arguments:
  grammar                                A list of grammar files.

Options:
  -o, --output-directory <path>          specify output directory where all output is generated
  --lib <path>                           specify location of grammars, tokens files
  --atn [boolean]                        Generate rule augmented transition network diagrams. (default: false)
  -e, --encoding <string>                Specify grammar file encoding; e.g., ucs-2. (default: "utf-8")
  --message-format [string]              Specify output style for messages in antlr, gnu, vs2005. (choices: "antlr", "gnu", "vs2005", default: "antlr")
  --long-messages [boolean].             Show exception details when available for errors and warnings. (default: false)
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

Now you can start using the tool to generate parsers and lexers for your grammars, for example:

```bash
antlr-ng -Dlanguage=Java -l -v -o output MyGrammar.g4
```

Pretty much the same as with ANTLR4, with only very few differences in the options. For example there are no separate options that disable a feature like `-no-visitor`. Instead use `-v false` to disable the listener generation (or just don't specify
`-v` at all).

> [!NOTE]
Avoid placing options that accept optional boolean values directly before grammar file names. For example, the `-l` option can take an optional boolean. If you omit the boolean value and write `-l MyGrammar.g4`, the tool may interpret `MyGrammar.g4` as the boolean value for `-l`, leading to unexpected behavior. To prevent this, either order your parameters so that options with values (such as output paths) appear immediately before the grammar file names, or use `--` to clearly separate options from positional arguments.

Another pretty common use case is to generate parsers and lexer as part of a TypeScript project. You can still use the global installation of <span className="antlrng">antlr-ng</span> for that, but you can also install it locally in your project:

```bash
npm i --save-dev antlr-ng
```

## Using the Tool Code in Your TypeScript Project

For specialized handling it is useful to run the tool directly. You can load a grammar and process it, to get its ATN or just do a syntax check. Other options are running unit tests or generate files in memory. The tool pipeline is running on a virtual filesystem (memfs) which allows to work independent of Node.js. This fs must be setup to contain all files needed for processing and will receive generated files. This allows to run <span className="antlrng">antlr-ng</span> in a browser environment as well. This is the setup used for the <span className="antlrng">antlr-ng</span> playground on this website.

A typcial approach looks like shown below. We setup a new virtual filesystem. A grammar object is created from a grammar string and processed.

```typescript

import * as nodeFs from "fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { memfs } from "memfs";
import { useFileSystem, Tool } from "antlr-ng";

// Prepare a fresh virtual file system.
const { fs } = memfs();

// Tell the tool to use this file system.
useFileSystem(fs);

// Provide the templates in the virtual file system.
fs.mkdirSync("/templates", { recursive: true });
// ... read the files and store them in the virtual fs ...

// A helper function to exectute the paser interpreter using grammar objects.
const testInterp = (lg: LexerGrammar, g: Grammar, startRule: string, input: string,
    expectedParseTree: string): ParseTree => {
    const lexEngine = lg.createLexerInterpreter(CharStream.fromString(input));
    const tokens = new CommonTokenStream(lexEngine);
    const parser = g.createParserInterpreter(tokens);
    const t = parser.parse(g.rules.get(startRule)!.index);

    expect(t.toStringTree(parser), expectedParseTree);

    return t;
};

const lg = new LexerGrammar(
    "lexer grammar L;\\n" +
    "A : 'a' ;\\n");
lg.tool.process(lg, {} as IToolParameters, false);

const g = new Grammar(
    "parser grammar T;\\n" +
    "s :  ;",
    lg);
g.tool.process(g, {} as IToolParameters, false);

testInterp(lg, g, "s", "", "s");
testInterp(lg, g, "s", "a", "s");
```

This example (apart from the memfs setup) is taken from the <a href="https://github.com/antlr-ng/antlr-ng/blob/main/tests/TestParserInterpreter.spec.ts#L27" target="_blank">TestParserInterpreter.spec.ts</a> file which is part of the unit test suite.
