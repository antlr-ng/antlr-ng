# Options

There are a number of options that you can specify at the grammar and rule element level (there are currently no rule options.) These change how <span className="antlrng">antlr-ng</span> generates code from your grammar. The general syntax is:

```antlr
options { name1 = value1; ... nameN = valueN; };
```

where a value can be an identifier, a qualified identifier (for example, a.b.c), a string, and an integer.

## Grammar Options

All grammars can use the following options. In combined grammars, all options except language pertain only to the generated parser. Options may be set either within the grammar file using the options syntax (described above) or when invoking <span className="antlrng">antlr-ng</span> on the command line, using the `-D` option (see the <a href="/getting-started">Getting Started Page</a>.) The following examples demonstrate both mechanisms; note that `-D` overrides options within the grammar.

### `superClass`

Set the superclass of the generated parser or lexer. For combined grammars, it sets the superclass of the parser.

```antlr
grammar Hi;
a : 'hi' ;

// Run generation: antlr-ng -DsuperClass=XX Hi.g4
// which produces this:
class HiParser extends XX {`
```

### `language`

Generate code in the indicated language, if <span className="antlrng">antlr-ng</span> is able to do so. Otherwise, you will see an error message like this:

```bash
$ antlr-ng -Dlanguage=C MyGrammar.g4
error(31):  antlr-ng cannot generate C code as of version 1.0
```

### `tokenVocab`

ANTLR assigns token type numbers to the tokens as it encounters them in a file. To use different token type values, such as with a separate lexer, use this option to have <span className="antlrng">antlr-ng</span> pull in the `tokens` file. <span className="antlrng">antlr-ng</span> generates a `tokens` file from each grammar.

```antlr
lexer grammar SomeLexer;
ID : [a-z]+;

parser grammar R;
options {tokenVocab = SomeLexer;}
tokens {A, B, C} // normally, these would be token types 1, 2, 3
a : ID ;

// Lexer tokens:
ID=1

// Parser tokens:
A=2
B=3
C=4
ID=1
```

### `TokenLabelType`

ANTLR normally uses type `Token` when it generates variables referencing tokens. If you have passed a `TokenFactory` to your parser and lexer so that they create custom tokens, you should set this option to your specific type. This ensures that the context objects know your type for fields and method return values.

```antlr
grammar T2;
options {TokenLabelType = MyToken;}
a: x=ID ;

// TokenLabelType is used for x in T2Parser.
public MyToken x;
```

### `contextSuperClass`

Specify the super class of parse tree internal nodes. Default is `ParserRuleContext`. Should derive from ultimately `ParserRuleContext` at minimum. You can use `contextSuperClass=RuleContextWithAltNum` for convenience. It adds a backing field for `altNumber`, the alt matched for the associated rule node.

### `caseInsensitive`

<span className="antlrng">antlr-ng</span> supports case-insensitive lexers using a grammar option. For example, the parser from the following grammar:

```antlr
lexer grammar L;
options {caseInsensitive = true; }
ENGLISH_TOKEN:   [a-z]+;
GERMAN_TOKEN:    [äéöüß]+;
FRENCH_TOKEN:    [àâæ-ëîïôœùûüÿ]+;
CROATIAN_TOKEN:  [ćčđšž]+;
ITALIAN_TOKEN:   [àèéìòù]+;
SPANISH_TOKEN:   [áéíñóúü¡¿]+;
GREEK_TOKEN:     [α-ω]+;
RUSSIAN_TOKEN:   [а-я]+;
WS:              [ ]+ -> skip;
```

matches words such as the following:

`abcXYZ äéöüßÄÉÖÜß àâæçÙÛÜŸ ćčđĐŠŽ àèéÌÒÙ áéÚÜ¡¿ αβγΧΨΩ абвЭЮЯ`

ANTLR considers only one-length chars in all cases. For instance, german lower `ß` is not treated as upper `ss` and vice versa.

The mechanism works by automatically transforming grammar references to characters to there upper/lower case equivalent; e.g., `a` to `[aA]`. This means that you do not need to convert your input characters to uppercase&ndash;token text will be as it appears in the input stream.

## Rule Options

### caseInsensitive

The tool support `caseInsensitive` lexer rule option that is described in <a href="/lexer-rules">Lexer Rules Page</a>.

## Rule Element Options

Token options have the form `&lt;name=value&gt;`. The only token option is `assoc`, and it accepts values `left` and `right`. Here’s a sample grammar with a left-recursive expression rule that specifies a token option on the `^` exponent operator token:

```antlr
grammar ExprLR;

expr: expr '^'<assoc=right> expr
    | expr '*' expr // match subexpressions joined with '*' operator
    | expr '+' expr // match subexpressions joined with '+' operator
    | INT // matches simple integer atom
    ;

INT : '0'..'9'+ ;
WS : [ \\n]+ -> skip ;
```

Semantic predicates also accept an option. The only valid option is the `fail` option, which takes either a string literal in double-quotes or an action that evaluates to a string. The string literal or string result from the action should be the message to emit upon predicate failure.

```antlr
ints[int max]
locals [int i = 1]
    : INT ( ',' {$i++;} {$i & lt;=$max}? <fail={"exceeded max " + $max}> INT )*
    ;
```

The action can execute a function as well as compute a string when a predicate fails:

```antlr
{...}?<fail={doSomethingAndReturnAString()}>
```
