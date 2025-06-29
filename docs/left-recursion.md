# Left-recursive rules

The most natural expression of some common language constructs is left recursive. For example C declarators and arithmetic expressions. Unfortunately, left recursive specifications of arithmetic expressions are typically ambiguous but much easier to write out than the multiple levels required in a typical top-down grammar. Here is a sample <span class="antlr-ng">antlr-ng</span> grammar with a left recursive expression rule:

```antlr
stat: 
    expr '=' expr ';' // e.g., x=y; or x=f(x);
    | expr ';'          // e.g., f(x); or f(g(x));
;

expr: 
    expr '*' expr
    | expr '+' expr
    | expr '(' expr ')' // f(x)
    | id
;
```

In straight context free grammars, such a rule is ambiguous because `1+2*3` can interpret either operator as occurring first, but <span class="antlr-ng">antlr-ng</span> rewrites that to be non-left recursive and unambiguous using semantic predicates:

```antlr
expr[int pr] : 
    id ({4 >= $pr}? '*' expr[5]
    | {3 >= $pr}? '+' expr[4]
    | {2 >= $pr}? '(' expr[0] ')'
    )*
;
```

The predicates resolve ambiguities by comparing the precedence of the current operator against the precedence of the previous operator. An expansion of expr[pr] can match only those subexpressions whose precedence meets or exceeds pr.

## Formal rules

The formal <span class="antlr-ng">antlr-ng</span> left-recursion elimination rules are laid out in the <a href="https://www.antlr-ng.org/allstar-techreport.pdf" target="_blank">ALL(*) tech report</a>:

* Binary expressions are expressions which contain a recursive invocation of the rule as the first and last element of the alternative.
* Suffix expressions contain a recursive invocation of the rule as the first element of the alternative, but not as the last element.
* Prefix expressions contain a recursive invocation of the rule as the last element of the alternative, but not as the first element.

There is no such thing as a "ternary" expression--they are just binary expressions in disguise.

The right associativity specifiers used to be on the individual tokens but it's done on alternative basis anyway so the option is now on the individual alternative; e.g.,

```antlr
e: e '*' e
    | e '+' e
    | <assoc=right> e '?' e ':' e
    | <assoc=right> e '=' e
    | INT
;
```

If your grammar uses a right-associative ternary operator, you will need to update your grammar to include `<assoc=right>` on the alternative operator. To smooth the transition, `<assoc=right>` is still allowed on token references but it is ignored.
