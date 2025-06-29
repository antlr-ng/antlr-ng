# Parse Tree Listeners

By default, <span class="antlrng">antlr-ng</span>-generated parsers build a data structure called a parse tree or syntax tree that records how the parser recognized the structure of the input sentence and component phrases.

<img src=/process.png>

The interior nodes of the parse tree are phrase names that group and identify their children. The root node is the most abstract phrase name, in this case `stat` (short for statement). The leaves of a parse tree are always the input tokens. Parse trees sit between a language recognizer and an interpreter or translator implementation. They are extremely effective data structures because they contain all of the input and complete knowledge of how the parser grouped the symbols into phrases. Better yet, they are easy to understand and the parser generates them automatically (unless you turn them off with `parser.setBuildParseTree(false)` or `parser.buildParseTree = false`, depending on the target language.

Because we specify phrase structure with a set of rules, parse tree subtree roots correspond to grammar rule names. <span class="antlrng">antlr-ng</span> has a `ParseTreeWalker` class that knows how to walk these parse trees and trigger events in listener implementation objects that you can create. The <span class="antlrng">antlr-ng</span> tool generates listener interfaces for you also, unless you turn that off with a commandline option. You can also have it generate visitors. For example from a Java.g4 grammar (and Java as target language), <span class="antlrng">antlr-ng</span> generates:

```java
public interface JavaListener extends ParseTreeListener<Token> {
  void enterClassDeclaration(JavaParser.ClassDeclarationContext ctx);
  void exitClassDeclaration(JavaParser.ClassDeclarationContext ctx);
  void enterMethodDeclaration(JavaParser.MethodDeclarationContext ctx);
 ...
}
```

where there is an enter and exit method for each rule in the parser grammar. <span class="antlrng">antlr-ng</span> also generates a base listener with empty implementations of all listener interface methods, in this case called `JavaBaseListener`. You can build your listener by subclassing this base and overriding the methods of interest.

Assuming you've created a listener object called `MyListener`, here is how to call the Java parser and walk the parse tree:

```typescript
const lexer = new JavaLexer(input);
const tokens = new CommonTokenStream(lexer);
const parser = new JavaParser(tokens);
const tree = parser.compilationUnit(); // parse a compilationUnit

const extractor = new MyListener(parser);
ParseTreeWalker.DEFAULT.walk(extractor, tree); // initiate walk of tree with listener in use of default walker
```

Listeners and visitors are great because they keep application-specific code out of grammars, making grammars easier to read and preventing them from getting entangled with a particular application.

The biggest difference between the listener and visitor mechanisms is that listener methods are called independently by an <span class="antlrng">antlr-ng</span>-provided walker object, whereas visitor methods must walk their children with explicit visit calls. Forgetting to invoke visitor methods on a node’s children, means those subtrees don’t get visited.

## Listening during the parse

We can also use listeners to execute code during the parse instead of waiting for a tree walker walks the resulting parse tree. Let's say we have the following simple expression grammar.

```antlr
grammar CalcNoLR;

s : expr EOF ;

expr:	add ((MUL | DIV) add)* ;

add :   atom ((ADD | SUB) atom)* ;

atom : INT ;

INT : [0-9]+;
MUL : '*';
DIV : '/';
ADD : '+';
SUB : '-';
WS : [ \t]+ -> channel(HIDDEN);
```

We can create a listener that executes during the parse by implementing the listener interface as before:


```typescript
class CountListener extends CalcNoLRBaseListener {
    public nums = 0;
    public execExitS = false;

    public override exitS(ctx: CalcNoLRParser.SContext): void {
        this.execExitS = true;
    }

    public override exitAtom(ctx: CalcNoLRParser.AtomContext): void {
        thi.snums++;
    }
}
```

And then passing it to `addParseListener()`:

```typescript
const input = "2 + 8 / 2";
const lexer = new CalcNoLRLexer(new CharStream.fromString(input));
const parser = new CalcNoLRParser(new CommonTokenStream(lexer));
const counter = new CountListener();
parser.addParseListener(counter);

// Check that the purses valid first
const context = parser.s();
const parseTreeS = context.toStringTree(parser);
assertEquals("(s (expr (add (atom 2) + (atom 8)) / (add (atom 2))) <EOF>)", parseTreeS);
assertEquals(3, counter.nums);
assertEquals(true, counter.execExitS);
```

One should not do very complicated work during the parse because the parser is throwing exception to handle syntax errors. If you're complicated code throws different kind of exception it will screw up the parsing and things will go nuts. If you want to catch and properly handle exceptions in your listener code during the parse, you should override this method from `Parser`:

```typescript
protected boolean listenerExceptionOccurred = false;

/**
 * Notify any parse listeners of an exit rule event.
 *
 * @see #addParseListener
 */
protected override triggerExitRuleEvent(): void {
    if (this.listenerExceptionOccurred) {
        return;
    }

    try {
        // Reverse order walk of listeners.
        for (let i = this.parseListeners.length - 1; i >= 0; i--) {
            const listener = this.parseListeners[i]);
            this.context.exitRule(listener);
            listener.exitEveryRule(this.context);
        }
    } catch (e) {
        // If an exception is thrown in the user's listener code, we need to bail out
        // completely out of the parser, without executing anymore user code. We
        // must also stop the parse otherwise other listener actions will attempt to execute
        // almost certainly with invalid results. So, record the fact an exception occurred
        this.listenerExceptionOccurred = true;
        throw e;
    }
}
```

Now, if you throw an exception inside one of the listener methods:

```typescript
// Now throw an exception in the listener
class ErrorListener extends CalcNoLRBaseListener {
    public execExitS = false;
    public execExitAtom = false;
    
    public override exitS(ctx: CalcNoLRParser.SContext): void {
        this.execExitS = true;
    }

    public override exitAtom(ctx: CalcNoLRParser.AtomContext): void {
        this.execExitAtom = true;
        throw new Error("bail out");
    }
}
```

then the exception will properly cause the parser to bailout and the exception will not be thrown out.
