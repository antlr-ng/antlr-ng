# Lexer Rules

A lexer grammar is composed of lexer rules, optionally broken into multiple modes. Lexical modes allow us to split a single lexer grammar into multiple sublexers. The lexer can only return tokens matched by rules from the current mode.

## Lexer Rule Structure

Lexer rules specify token definitions and more or less follow the syntax of parser rules except that lexer rules cannot have arguments, return values, or local variables. Lexer rule names must begin with an uppercase letter, which distinguishes them from parser rule names:

```antlr
/** Optional document comment */
TokenName : alternative1 | ... | alternativeN ;
```

Lexer rules generate a single numeric value known as token, when they match. This value is sent to the parser when it needs the next token to continue parsing input. Lexers (aka tokenizers or scanners) convert a string into individual elements (lexemes), which are also interesting for other tasks like syntax highlighting.

<div class="note">
<b>Note:</b> Always the rule that matches the longest part is used to return a token. If more than one rule matches the same amount of input, the first one in the grammar "wins".
</div>

Not all lexer rules return a token, however. You can augment a rule with the `fragment` keyword which marks them as lexer internal:

```antlr
fragment
HelperTokenRule : alternative1 | ... | alternativeN ;
```

For example, `DIGIT` is a pretty common fragment rule:

```antlr
INT : DIGIT+ ; // references the DIGIT helper rule
fragment DIGIT : [0-9] ; // not a token by itself
```

Fragment lexer rules cannot be used in parsers.

### Keywords versus Identifiers

A very common problem is that a language has identifiers as well as keywords. Keywords are special identifiers, but from a lexer standpoint both match the same input. This is why it is very important how to specify keywords. They must be defined before any "catch all" identifier rule or your keywords will never be recognized. You can generalize and say: whenever you have a rule which is a special case of a more general rule, place it before that general form in the grammar, to make it work.

## Lexical Modes

Modes allow you to group lexical rules by context, such as inside and outside of XML tags. It’s like having multiple sublexers, one for each context. The lexer can only return tokens matched by entering a rule in the current mode. Lexers start out in the so-called default mode. All rules are considered to be within the default mode unless you specify a mode command. Modes are not allowed within combined grammars, just lexer grammars. See the description of grammar types in the [Grammars section](/grammars).

```antlr
rules in default mode
...
mode MODE1;
rules in MODE1
...
mode MODEN;
rules in MODEN
...
```

## Lexer Rule Elements

Lexer rules are more complex than parser rules. They allow more fine grained control over the matching process, while disallowing most of the target specific parts like local variables, parameters or return values, which parser rules support. Lexer rules are not transformed to functions/methods when generating the target files, but instead are executed in a simple state machine, but still use the same prediction engine like a parser does. Here are the supported lexer rule elements:

- A lexer rule reference, e.g. `Value: A B C;`. Remember that lexer rule names have to start with a capital letter.
- String literals, e.g. `'array'`, often used to define keywords.
- Character ranges, e.g. `'a'..'z'`.
- A wild card, the dot `.`, see the [Wildcard section](/wildcard) for more details.
- Action code and predicates, e.g. `{this.x = 1;}` or `{this.version > 1}?`, which fulfil the same task like in parser rule, namely to simply execute target code (actions) or to execute target code and return a boolean value (predicates). You should avoid using target code, however, as it makes your lexer much slower and your grammar target language dependent.
- A character set, e.g. `[abc]`, very similar like in regular expressions.
- A tilde to denote a do-not-match, e.g. `~[abc]` to define a match of any character, except a, b or c. You can use a tilde also for lexer rule references, like `~Number˙ to match everything but a number.

Parser rules operates on token values returned from a lexer, while lexer rules use characters (more precisely: code points) to match input. They frequently need to specify character sets (a collection of code points), very much like regular expressions, where character sets are denoted by a pair of square brackets. Don’t confuse character sets with arguments to parser rules. There's an alternative to lexer charsets: using single character code points separated by the alt char (`|`), for example

```antlr
OptionValue: 'a' | 'b' | 'c';
```

which is however much more verbose than the character set equivalent:

```antlr
OptionValue: [abc];
```

There's no need to quote the individual characters between brackets.

## Unicode

In addition to writing simple letters (quoted or in square brackets), you can use ranges like `[a-zA-Z0-9]` and Unicode escapes. Read the [Unicode section](/unicode) for an in-depth description how to match the full Unciode range.

## Cardinality

Just as with parser rules, lexer rules allow subrules in parentheses and EBNF operators: `?`, `*`, `+`, which describe the number of occurences (their cardinality). A common use of `+` is `[0-9]+` to match integers. Lexer subrules can also use the nongreedy `?` suffix on those EBNF operators.

## Recursive Lexer Rules

<span class="antlr-ng">antlr-ng</span> lexer rules can be recursive, unlike most lexical grammar tools. This comes in really handy when you want to match nested tokens like nested action blocks: `{...{...}...}`.

```antlr
lexer grammar Recur;

ACTION : '{' ( ACTION | ~[{}] )* '}' ;

WS : [ \r\t\n]+ -> skip ;
```

## Conflicting String Literals

Be careful that you don’t specify the same string literal on the right-hand side of multiple lexer rules (see also the keywords vs identifiers section above, which is related). Such literals are ambiguous and could theoretically match multiple token types (but in reality the first token will always be used, see the note at the top of the file). The same is true for rules across modes. For example, the following lexer grammar defines two tokens with the same character sequence:

```antlr
lexer grammar L;
AND : '&' ;
mode STR;
MASK : '&' ;
```

A parser grammar cannot reference literal '&', but it can reference the name of the tokens:

```antlr
parser grammar P;
options { tokenVocab=L; }
a : '&' // results in a tool error: no such token
    AND // no problem
    MASK // no problem
  ;
```

Here’s a build and test sequence:

```bash
$ antlr-ng L.g4 # yields L.tokens file needed by tokenVocab option in P.g4
$ antlr-ng P.g4
error(126): P.g4:3:4: cannot create implicit token for string literal '&' in non-combined grammar
```

## Lexer Rule Actions

An <span class="antlr-ng">antlr-ng</span> lexer creates a token object after matching a lexical rule. Each request for a token starts in `Lexer.nextToken()`, which calls `emit` once it has identified a token. `emit` collects information from the current state of the lexer to build the token. It accesses fields `type`, `text`, `channel`, `tokenStartCharIndex`, `tokenStartLine`, and `column`. You can set the state of these with the various setter methods such as `setType`. For example, the following rule turns `enum` into an identifier if `enumIsKeyword` is false.

```antlr
ENUM : 'enum' {if (!enumIsKeyword) setType(Identifier);} ;
```

There can be at most a single action for a lexical rule, regardless of how many alternatives there are in that rule.

## Lexer Commands

To avoid tying a grammar to a particular target language, <span class="antlr-ng">antlr-ng</span> supports lexer commands. Unlike arbitrary embedded actions, these commands follow specific syntax and are limited to a few common commands. Lexer commands appear at the end of the outermost alternative of a lexer rule definition. Like arbitrary actions, there can only be one per token rule. A lexer command consists of the `->` operator followed by one or more command names that can optionally take parameters:

```antlr
TokenName : «alternative» -> command-name
TokenName : «alternative» -> command-name («identifier or integer»)
```

An alternative can have more than one command separated by commas. Here are the valid command names:

* `skip`
* `more`
* `popMode`
* `mode(x)`
* `pushMode(x)`
* `type(x)`
* `channel(x)`

Here are some examples:

### Command `skip`

A 'skip' command tells the lexer to get another token and throw out the current text.

```antlr
ID : [a-zA-Z]+ ; // match identifiers
INT : [0-9]+ ; // match integers
NEWLINE:'\r'? '\n' ; // return newlines to parser (is end-statement signal)
WS : [ \t]+ -> skip ; // toss out whitespace
```

### Commands `mode()`, `pushMode()`, `popMode`, and `more`

The mode commands alter the mode stack and hence the mode of the lexer. The 'more' command forces the lexer to get another token but without throwing out the current text. The token type will be that of the "final" rule matched (i.e., the one without a more or skip command).

```antlr
// Default "mode": Everything OUTSIDE of a tag
COMMENT : '<!--' .*? '-->' ;
CDATA   : '<![CDATA[' .*? ']]>' ;
OPEN : '<' -> pushMode(INSIDE), channel(HIDDEN) ;
 ...
XMLDeclOpen : '<?xml' S -> pushMode(INSIDE) ;
SPECIAL_OPEN: '<?' Name -> more, pushMode(PROC_INSTR) ;
// ----------------- Everything INSIDE of a tag ---------------------
mode INSIDE;
CLOSE        : '>' -> popMode ;
SPECIAL_CLOSE: '?>' -> popMode ; // close <?xml...?>
SLASH_CLOSE  : '/>' -> popMode ;
```

Also check out:

```antlr
lexer grammar Strings;
LQUOTE : '"' -> more, mode(STR) ;
WS : [ \r\t\n]+ -> skip ;
mode STR;
STRING : '"' -> mode(DEFAULT_MODE) ; // token we want parser to see
TEXT : . -> more ; // collect more text for string
```

Popping the bottom layer of a mode stack will result in an exception. Switching modes with `mode` changes the current stack top.  More than one `more` is the same as just one and the position does not matter.

### Command `type()`

The `type()` command changes the token type that is returned from the lexer that contains it.

```antlr
lexer grammar SetType;
tokens { STRING }
DOUBLE : '"' .*? '"'   -> type(STRING) ;
SINGLE : '\'' .*? '\'' -> type(STRING) ;
WS     : [ \r\t\n]+    -> skip ;
```

For multiple 'type()' commands, only the rightmost has an effect.

### Command `channel()`

```antlr
BLOCK_COMMENT
	: '/*' .*? '*/' -> channel(HIDDEN)
	;
LINE_COMMENT
	: '//' ~[\r\n]* -> channel(HIDDEN)
	;
...
// ----------
// Whitespace
//
// Characters and character constructs that are of no import
// to the parser and are used to make the grammar easier to read
// for humans.
//
WS : [ \t\r\n\f]+ -> channel(HIDDEN) ;
```

As of 4.5, you can also define channel names like enumerations with the following construct above the lexer rules:

```antlr
channels { WSCHANNEL, MYHIDDEN }
```

## Lexer Rule Options

### caseInsensitive

Defines if the current lexer rule is case-insensitive.
The argument can be `true` or `false`.
The option rewrites `caseInsensitive` grammar option value if it's defined.

```antlr
options { caseInsensitive=true; }
STRING options { caseInsensitive=false; } : 'N'? '\'' (~'\'' | '\'\'')* '\''; // lower n is not allowed
```
