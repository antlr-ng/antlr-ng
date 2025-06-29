# Grammars

Grammars are the fundamental element to describe a language. They are written in a special language called <span className="antlrng">antlr-ng</span> grammar syntax. This section gives an overview of the different parts of a grammar and how they are used in the parser generation process.

The following topics are covered in this section:

- **Grammar Syntax:** a graphical approach to the <span className="antlrng">antlr-ng</span> grammar structure.
- **Options:** How to customize the generation process.
- **Parser Rules:** A closer look at parser rules (non-terminals).
- **Lexer Rules:** How are tokens (terminals) defined?
- **Wildcard:** About matching any input. Greedy or not greedy is the question.
- **Unicode:** How to define tokens with any Unicode character?

There are 3 types of grammars in <span className="antlrng">antlr-ng</span>:

- **Parser grammar:** Only contains parser rule defintions. Options and actions apply only to the generated parser. Parser rules can reference other parser rules and lexer rules.
- **Lexer grammar:** Only contains lexer rule definitions. Just like for parser grammars any given option applies only to the generated lexer. It is not allowed to reference parser rules in lexer rules.
- **Combined:** A combination of parser and lexer rules in a single file. Options that can have a different meaning/value in parser and lexer apply only to the parser (e.g. the super class), while others (e.g. the language) are used for both types. Named actions (e.g. `@header`) must be scoped to identify where to use them (e.g. `@parser::header`. Otherwise they are used for the parser.

Given the special conditions and mentioned restrictions, it is recommended to use non-combined grammars whenever possible. This makes the grammar easier to understand and maintain. Combined grammars are more like beginner grammars to ease learning <span className="antlrng">antlr-ng</span>.
