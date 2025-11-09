# C# Target Generator Implementation Guide

## Status: In Progress

The C# target generator implementation is a substantial software engineering task requiring ~2000-2500 lines of carefully structured TypeScript code.

## Reference Files

- **Template**: `templates/codegen/CSharp/CSharp.stg` (1077 lines, 80+ templates)
- **Old Target**: `src/codegen/target/CSharpTarget.ts` (C#-specific logic - to be deprecated)
- **Reference Generators**:
  - `CppTargetGenerator.ts` (2691 lines) - Most similar structure
  - `TypeScriptTargetGenerator.ts` (1887 lines) - Cleaner, simpler

## Generated Output Reference

Reference MySQL grammar output generated with old generator:
```
~/antlr-ng-test-generation/mysql/C#/old/
- MySQLLexer.cs (397KB)
- MySQLParser.cs (2.9MB)
- MySQLParserListener.cs (412KB)
- MySQLParserBaseListener.cs (540KB)
- MySQLParserVisitor.cs (244KB)
- MySQLParserBaseVisitor.cs (445KB)
```

## C#-Specific Requirements

### Language Properties
- **File Extension**: `.cs`
- **Reserved Words**: 48 keywords (see `CSharpTarget.ts`)
- **Character Escaping**: `\x` format for hex values
- **Word Escaping**: `@` prefix for reserved words
- **ATN Serialization**: As integers (`isATNSerializedAsInts = true`)
- **Word Size**: 64-bit for inline test sets
- **No Header Files**: Unlike C++, C# uses single `.cs` files

### Code Structure
- **Namespace**: Optional wrapping with `namespace X {}`
- **Using Statements**: `using System.*`, `using Antlr4.Runtime.*`
- **Indentation**: Tabs (not spaces!)
- **Attributes**: `[NotNull]`, `[System.CodeDom.Compiler.GeneratedCode("ANTLR", "version")]`
- **XML Comments**: `<summary>`, `<param>`, `<return>`, `<para>`

### Name Transformations
- **Token Types**: `EOF` → `Eof`, others pass through
- **Channels**: `HIDDEN` → `Hidden`, `DEFAULT_TOKEN_CHANNEL` → `DefaultTokenChannel`
- **Modes**: `DEFAULT_MODE` → `DefaultMode`
- **Contexts**: Rule name + `Context` suffix

## Implementation Approach

### Option 1: Adapt CppTargetGenerator (Recommended)
1. Copy `CppTargetGenerator.ts` as base
2. Remove all header file logic (C# doesn't need separate .h files)
3. Replace C++ includes with C# using statements
4. Update all render methods for C# syntax
5. Change indentation from spaces to tabs where needed
6. Update name transformations (token types, channels, modes)
7. Test incrementally with simple grammars

### Option 2: Build from TypeScriptTargetGenerator
1. Copy `TypeScriptTargetGenerator.ts` as base
2. Add base listener/visitor support (TypeScript doesn't need them)
3. Update syntax for C# (types, generics, etc.)
4. Change return types and null handling
5. Add C#-specific attributes and comments
6. Update all render methods

### Option 3: Template-Driven Implementation
1. Map each template in `CSharp.stg` to a render method
2. Implement template logic in TypeScript
3. Use `CppTargetGenerator` patterns as reference
4. Test each method against template output

## Core Methods to Implement

### File Renderers (6 methods)
- `renderParserFile()` - Main parser class
- `renderLexerFile()` - Main lexer class  
- `renderListenerFile()` - Listener interface
- `renderBaseListenerFile()` - Base listener class
- `renderVisitorFile()` - Visitor interface
- `renderBaseVisitorFile()` - Base visitor class

### Structure Renderers
- `renderParser()` - Parser class body
- `renderLexer()` - Lexer class body
- `renderParserHeader()` - If needed for forward declarations
- `renderLexerHeader()` - If needed
- `renderFileHeader()` - Copyright, warnings, pragmas

### Rule/Function Renderers  
- `renderRuleFunction()` - Regular parser rules
- `renderLeftRecursiveRuleFunction()` - Left-recursive rules
- `renderRuleSempredFunction()` - Semantic predicates
- `renderRuleActionFunction()` - Rule actions

### Context/Struct Renderers
- `renderStructDecl()` - Rule context classes
- `renderAltLabelStructDecl()` - Labeled alternative contexts
- `renderListenerDispatchMethod()` - Listener dispatch
- `renderVisitorDispatchMethod()` - Visitor dispatch

### Declaration Renderers (~15 methods)
- `renderContextRuleGetterDecl()`
- `renderContextRuleListGetterDecl()`
- `renderContextTokenGetterDecl()`
- `renderContextTokenListGetterDecl()`
- `renderTokenDecl()`, `renderTokenTypeDecl()`, `renderTokenListDecl()`
- `renderRuleContextDecl()`, `renderRuleContextListDecl()`
- `renderAttributeDecl()`
- And more...

### Operation Renderers (~20 methods)
- `renderCodeBlockForOuterMostAlt()`
- `renderMatchToken()`, `renderMatchSet()`, `renderMatchNotSet()`
- `renderWildcard()`, `renderInvokeRule()`
- `renderAltBlock()`, `renderOptionalBlock()`, `renderStarBlock()`, `renderPlusBlock()`
- `renderLL1AltBlock()`, `renderLL1OptionalBlock()`, etc.
- `renderTestSetInline()`, `renderSemPred()`
- `renderThrowNoViableAlt()`

### Lexer Commands (~7 methods)
- `renderLexerSkipCommand()`
- `renderLexerMoreCommand()`
- `renderLexerPopModeCommand()`
- `renderLexerTypeCommand()`
- `renderLexerChannelCommand()`
- `renderLexerModeCommand()`
- `renderLexerPushModeCommand()`

### Property Reference Renderers (~15 methods)
- `renderTokenPropertyRef*()` - Text, Type, Line, Pos, Channel, Index, Int
- `renderRulePropertyRef*()` - Start, Stop, Text, Ctx, Parser
- `renderThisRulePropertyRef*()`  
- `renderNonLocalAttrRef()`, `renderSetNonLocalAttr()`

### Action/Chunk Renderers  
- `renderAction()`, `renderActionText()`, `renderActionTemplate()`
- `renderArgRef()`, `renderLocalRef()`, `renderRetValueRef()`
- `renderSetAttr()`, `renderLabelRef()`, `renderListLabelRef()`
- And many more...

### Utility Methods
- `renderSerializedATN()` - ATN data arrays
- `renderVocabulary()` - Literal and symbolic names
- `getTargetCharValueEscape()` - Character escaping
- `escapeChar()`, `escapeWord()`
- `formatLines()`, `indent()`, `wrap()

## Testing Strategy

1. **Unit Testing**: Test individual render methods
2. **Simple Grammar**: Start with minimal grammar
3. **Incremental**: Add complexity gradually
4. **Comparison**: Compare output with old generator letter-by-letter
5. **Whitespace**: Pay special attention to tabs vs spaces
6. **Edge Cases**: Empty rules, complex nesting, predicates, actions

## Current Status

- [x] Research and analysis complete
- [x] C#-specific requirements documented
- [x] Reference output generated
- [x] Implementation guide created
- [ ] Generator implementation (0% complete)
- [ ] Testing framework setup
- [ ] Output comparison and validation
- [ ] Documentation and examples

## Next Steps

1. Choose implementation approach (recommend Option 1)
2. Set up development environment with rapid testing
3. Implement core file renderers first
4. Add structure and rule renderers
5. Implement all abstract methods
6. Test with simple grammars
7. Progress to MySQL grammar
8. Fine-tune whitespace and formatting
9. Validate against all test cases

## Estimated Effort

- **Core Implementation**: 16-24 hours
- **Testing & Refinement**: 8-16 hours  
- **Total**: 24-40 hours of focused development

---

*Note: This is a production-quality code generator that must exactly match the output of the StringTemplate4-based system. The complexity comes from the need to handle all ANTLR grammar constructs correctly and match exact formatting including whitespace.*
