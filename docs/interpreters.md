# Parser and Lexer Interpreters

For small parsing tasks it is sometimes convenient to use <span class="antlr-ng">antlr-ng</span> in interpreted mode, rather than generating a parser in a particular target, compiling it and running it as part of your application. Interpreters are particularly useful for REPL applications (see also [Other Useful Tools](/repl).

Interpreters are part of the runtimes and hence can be used even in your favourite programming language. However, grammar classes are not, so a different approach is required there. Both are explained below.

In TypeScript you can fully use lexer and parser `Grammar` objects and then create interpreters. Once we have a `ParserInterpreter`, we can use it to parse starting in any rule we like, given a rule index (which the grammar + the parser can provide).

## Action Code

Since interpreters don't use generated parsers + lexers they cannot execute any action code (including predicates). That means the interpreter runs as if there were no predicates at all. If your grammar requires action code in order to parse correctly you will not be able to test it using this approach.

## TypeScript Interpreter Setup

```typescript
import { LexerGrammar, Grammar } from "antlr-ng";
import { CharStream, CommonTokenStream } from "antlr4ng";

const lg = new LexerGrammar(
    "lexer grammar L;\n" +
    "A : 'a' ;\n" +
    "B : 'b' ;\n" +
    "C : 'c' ;\n");

const g = new Grammar(
    "parser grammar T;\n" +
    "s : (A|B)* C ;\n",
    lg);

const lexEngine = lg.createLexerInterpreter(CharStream.fromString(input));
const tokens = new CommonTokenStream(lexEngine);
const parser = g.createParserInterpreter(tokens);
const t = parser.parse(g.rules.get(startRule).index);
```

## Non-TypeScript Target Interpreter Setup

The <span class="antlr-ng">antlr-ng</span> runtimes do not contain any grammar parsing classes. Hence we cannot use `LexerGrammar` and `Grammar` to parse grammars for the interpreter. Instead we directly instantiate `LexerInterpreter` and `ParserInterpreter` objects. They require some data (namely symbol information and the ATNs) which only the <span class="antlr-ng">antlr-ng</span> tool can give us. However, on each generation run <span class="antlr-ng">antlr-ng</span> not only produces your parser + lexer files but also interpreter data files (*.interp) which contain all you need to feed the interpreters.

A support class (`InterpreterDataReader`) is used to load the data for your convenience, which makes this very easy to use. Btw. even the TypeScript target can go this route instead of using the non-runtime classes `Grammar` and `LexerGrammar`. Sometimes it might not be feasible to use the `antlr-ng` package for whatever reason.

Here's how the setup looks like (C++ example):

```cpp
/**
 * sourceFileName - name of the file with content to parse
 * lexerName - the name of your lexer (arbitrary, that's what is used in error messages)
 * parserName - ditto for the parser
 * lexerDataFileName - the lexer interpeter data file name (e.g. `<path>/ExprLexer.interp`)
 * parserDataFileName - ditto for the parser (e.g. `<path>/Expr.interp`)
 * startRule - the name of the rule to start parsing at
 */
void parse(std::string const& sourceFileName,
  std::string const& lexerName, std::string const& parserName,
  std::string const& lexerDataFileName, std::string const& parserDataFileName,
  std::string const& startRule) {

    InterpreterData lexerData = InterpreterDataReader::parseFile(lexerDataFileName);
    InterpreterData parserData = InterpreterDataReader::parseFile(parserDataFileName);

    ANTLRFileStream input(sourceFileName);
    LexerInterpreter lexEngine(lexerName, lexerData.vocabulary, lexerData.ruleNames,
      lexerData.channels, lexerData.modes, lexerData.atn, &input);
    CommonTokenStream tokens(&lexEngine);

    /* Remove comment to print the tokens.
    tokens.fill();
    std::cout << "INPUT:" << std::endl;
    for (auto token : tokens.getTokens()) {
      std::cout << token->toString() << std::endl;
    }
    */

    ParserInterpreter parser(parserName, parserData.vocabulary, parserData.ruleNames,
      parserData.atn, &tokens);
    tree::ParseTree *tree = parser.parse(parser.getRuleIndex(startRule));

    std::cout << "parse tree: " << tree->toStringTree(&parser) << std::endl;
}
```
