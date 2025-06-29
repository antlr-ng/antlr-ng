# REPL (read-evaluate-print-loop)

After installing <span class="antlrng">antlr-ng</span> (see [Getting Started](/getting-started)) you will get another 2 command line tools for quick evaluation of grammars: **TestRig** (**grun**) and **Interpreter**. They both serve specific needs for interactive grammar development, in text based environments.

## TestRig (aka grun)

The TestRig command (aliased with grun, which stands for "grammar run") takes a generated parser and executes it with a given input. Since this tool runs in Node.js, the target language for the generated grammar must be `TypeScript` or `JavaScript`.

Just like the <span class="antlrng">antlr-ng</span> tool also TestRig/grun is available globally.

```bash
> testrig -h
Usage: testrig [options] <grammar> <startRuleName> [inputFiles...]

Arguments:
  grammar        The path of the grammar with no extension
  startRuleName  Name of the start rule
  inputFiles     Input files

Options:
  --tree         Print out the parse tree (default: false)
  --tokens       Print out the tokens for each input symbol (default: false)
  --trace        Print out tracing information (rule enter/exit etc.). (default: false)
  --diagnostics  Print out diagnostic information (default: false)
  --sll          Use SLL prediction mode (instead of LL) (default: false)
  -h, --help     display help for command

```

Use `grun` instead of `testrig` if you like. Both commands are equal. Before you can use **TestRig** you have to generate your parser/lexer files. Let's take this grammar:

```antlr
grammar expr;

start: multiply | divide | add | subtract;

expression: '(' expression ')' | number;

multiply: expression '*' expression;
divide: expression '/' expression;
add: expression '+' expression;
subtract: expression '-' expression;

number: NUMBER;

NUMBER: [0-9]+;
WS: [ \t\r\n]+ -> skip;
```

saved in a file called `expr.g4`. For more details about the grammar syntax check the grammar [railroad diagrams](/grammar-syntax) and the grammar description for [parser](/parser-rules) and [lexers](/lexer-rules).
Now run:

```bash
antlr-ng -Dlanguage=TypeScript expr.g4
```

Create an input file with a single line in it `1 + 2 * 3` (save as input.txt). Then run the test rig using:

```bash
testrig expr start --tokens --trace --diagnostics --tree input.txt
```

in the folder where all files are located. This will run the generated parser/lexer and prints information according to the given flags:

```bash
[@0,0:0='1',<7>,1:0]
[@1,2:2='+',<5>,1:2]
[@2,4:4='2',<7>,1:4]
[@3,6:6='*',<3>,1:6]
[@4,8:8='3',<7>,1:8]
[@5,9:8='<EOF>',<-1>,1:9]
enter   start, LT(1)=1
enter   add, LT(1)=1
enter   expression, LT(1)=1
enter   number, LT(1)=1
consume [@0,0:0='1',<7>,1:0] rule number
exit    number, LT(1)=+
exit    expression, LT(1)=+
consume [@1,2:2='+',<5>,1:2] rule add
enter   expression, LT(1)=2
enter   number, LT(1)=2
consume [@2,4:4='2',<7>,1:4] rule number
exit    number, LT(1)=*
exit    expression, LT(1)=*
exit    add, LT(1)=*
exit    start, LT(1)=*
(start (add (expression (number 1)) + (expression (number 2))))
```

that is: a token list, a trace, no diagnostics (since there were no errors) and a parse tree in LISP format.

## Interpreter

The other tool in the collection is the interpreter, which doesn't even need to generate any target files. Instead it directly runs the grammar in interpreter mode, which is almost the same as the normal mode (same prediction etc.) but without any action or predicate code.

```bash
> interpreter -h
Usage: interpreter [options] <startRuleName> <input-filename> [grammar...]

Arguments:
  startRuleName           Name of the parser start rule
  input-filename          Input file
  grammar                 Lexer/Parser/Combined grammar files

Options:
  --tree                  Print out the parse tree (default: false)
  --tokens                Print out the tokens for each input symbol (default: false)
  --trace                 Print out tracing information (rule enter/exit etc.). (default: false)
  --encoding [string]     The input file encoding (default: utf-8) (choices: "ascii", "utf8", "utf-8", "utf16le", "utf-16le", "ucs2", "ucs-2",
                          "base64", "base64url", "latin1", "binary", "hex", default: "utf-8")
  --profile filename.csv  Profile the parser and generate profiling information.
  -h, --help              display help for command
```

Parameters are very similar compared to the TestRig, with some extras. Let's run the same grammar again:

```bash
> interpreter start --tokens --trace input.txt expr.g4
[@0,0:0='1',<NUMBER>,1:0]
[@1,2:2='+',<'+'>,1:2]
[@2,4:4='2',<NUMBER>,1:4]
[@3,6:6='*',<'*'>,1:6]
[@4,8:8='3',<NUMBER>,1:8]
[@5,9:8='<EOF>',<EOF>,1:9]
enter   start, LT(1)=1
enter   add, LT(1)=1
enter   expression, LT(1)=1
enter   number, LT(1)=1
consume [@0,0:0='1',<7>,1:0] rule number
exit    number, LT(1)=+
exit    expression, LT(1)=+
consume [@1,2:2='+',<5>,1:2] rule add
enter   expression, LT(1)=2
enter   number, LT(1)=2
consume [@2,4:4='2',<7>,1:4] rule number
exit    number, LT(1)=*
exit    expression, LT(1)=*
exit    add, LT(1)=*
exit    start, LT(1)=*
```

You can also define which encoding to use for the input file, if it doesn't use UTF-8. The grammar always has to use UTF-8 (without BOM). The interpreter can also generate a csv file for you with profile information, when using the `--profile` option.
