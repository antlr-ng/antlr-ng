# GitHub Copilot Instructions for antlr-ng

## Project Overview

antlr-ng (ANTLR Next Generation) is a TypeScript-based parser generator that translates grammar files into parser and lexer classes for multiple target languages. It's a production-ready port and enhancement of ANTLR4, supporting 10 target languages: TypeScript, Java, C++, C#, Go, Python3, Dart, Swift, JavaScript, and PHP.

**Key characteristics:**
- Production-ready tool generating parsers from ANTLR grammar files
- Supports Unicode 16 for improved internationalization
- Runs in Node.js environment with plans for browser support
- Generates parsers, lexers, listeners, and visitors for multiple programming languages

## Architecture

The codebase is organized into several key directories:

- **src/tool/**: Core tool functionality, grammar processing, error handling
- **src/parse/**: Grammar parsing and AST building
- **src/semantics/**: Semantic analysis and validation
- **src/codegen/**: Code generation engine and target-specific generators
  - **src/codegen/model/**: Output model classes for code generation
  - **src/codegen/target/**: Language-specific target implementations (Java, TypeScript, Python3, etc.)
- **src/automata/**: ATN (Augmented Transition Network) construction and analysis
- **src/analysis/**: Grammar analysis and optimization
- **src/misc/**: Utility classes and helpers
- **src/support/**: Support functions and interfaces
- **src/tree/**: Parse tree representations and walkers
- **tests/**: Test suite using Vitest
- **templates/**: Code generation templates for target languages

## Code Style and Standards

### TypeScript Configuration

- **Target**: ES2022 with Node16 module resolution
- **Module system**: ESM (ES Modules) - always use `.js` extensions in imports
- **Strict mode**: Enabled with strict null checks, no implicit any, no implicit this
- **Declaration files**: Generated during build (emitDeclarationOnly: true)

### ESLint Rules (Key Requirements)

1. **Line length**: Maximum 120 characters
2. **Quotes**: Use double quotes, allow template literals and escaped quotes
3. **Indentation**: 4 spaces
4. **Semicolons**: Always required
5. **Brace style**: 1tbs (one true brace style), no single-line blocks
6. **Curly braces**: Required for all control statements
7. **Arrow functions**: Always use block body with explicit return
8. **Naming conventions**:
   - Classes, enums, type aliases, interfaces: PascalCase
   - Variables, functions, methods: camelCase
   - Enum members: PascalCase
   - Properties: camelCase or UPPER_CASE for constants
9. **Empty lines**: Always add blank line before return statements
10. **Member ordering**: Static fields → instance fields → constructor → public methods → private methods
11. **Explicit accessibility**: Always specify public/protected/private modifiers

### Code Patterns to Follow

```typescript
// ✅ Correct: Arrow function with block body
const transform = (value: string): string => {
    return value.toUpperCase();
};

// ❌ Wrong: Arrow function without block body
const transform = (value: string): string => value.toUpperCase();

// ✅ Correct: Proper spacing and blank line before return
public processGrammar(grammar: Grammar): void {
    const symbols = this.extractSymbols(grammar);
    this.validateSymbols(symbols);

    return;
}

// ✅ Correct: Import with .js extension
import { Grammar } from "./Grammar.js";

// ❌ Wrong: Import without .js extension
import { Grammar } from "./Grammar";
```

## Testing Guidelines

### Test Framework: Vitest

- Test files use `.spec.ts` extension
- Tests located in `tests/` directory
- Test timeout: 10 seconds (configurable via testTimeout)
- Use concurrent test execution when possible
- Test file pattern: `TestXxx.spec.ts` where Xxx describes the feature

### Running Tests

```bash
npm test                          # Run all tests
npm run generate-test-parsers    # Generate test grammar parsers
```

### Test Structure

```typescript
import { describe, it, expect } from "vitest";

describe("FeatureName", () => {
    it("should handle basic case", () => {
        // Arrange
        const input = "test";

        // Act
        const result = processInput(input);

        // Assert
        expect(result).toBe("expected");
    });
});
```

## Build and Development Workflow

### Build Process

```bash
npm run build                    # Full build pipeline
npm run generate-version-file    # Generate version.ts
npm run generate-antlr-parser    # Generate ANTLR grammar parsers
npm run esbuild                  # Bundle with esbuild
tsc -p tsconfig.json            # TypeScript compilation (declarations only)
```

### Development Commands

```bash
npm run TestRig                  # Run TestRig tool
npm run interpreter              # Run interpreter
npm run generate-parser          # Generate parser from grammar
npm run generate-docs            # Generate API documentation with TypeDoc
```

### Code Generation

When working with grammars:
1. Place grammar files in appropriate location (src/grammars/ for tool, tests/grammars/ for tests)
2. Use `antlr-ng -Dlanguage=TypeScript --exact-output-dir` to generate parsers
3. Generated files go into `src/generated/` or `tests/generated/`
4. Never manually edit generated files

## Common Tasks and Patterns

### Working with Grammars

- Grammar AST nodes are in `src/tool/ast/`
- Use `GrammarAST` for grammar tree manipulation
- Follow visitor pattern for tree traversal

### Error Handling

- Issue codes defined in `src/tool/Issues.ts`
- Use `ANTLRMessage` class for creating error messages
- Error formatting supports verbose mode for detailed stack traces
- Message templates use StringTemplate4 syntax

### Code Generation for Target Languages

- Each target language has its own class in `src/codegen/target/`
- Extend `Target` base class for new language support
- Use template files from `templates/` directory
- Follow existing patterns in `JavaTarget`, `TypeScriptTarget`, etc.

### ATN (Augmented Transition Network) Operations

- ATN represents the state machine for grammar recognition
- Work with ATN classes in `src/automata/`
- Use `ATNSerializer` for serialization/deserialization
- ATN states, transitions, and edges follow specific patterns

## Common Pitfalls to Avoid

1. **Module imports**: Always use `.js` extension, not `.ts`
2. **Arrow functions**: Must have block body with explicit return
3. **Generated files**: Don't edit files in `src/generated/` or `tests/generated/`
4. **Null checks**: TypeScript strict null checks are enabled - handle undefined/null explicitly
5. **Line length**: Keep lines under 120 characters
6. **Comments**: Only add JSDoc comments for public APIs unless necessary for clarity

## Performance Considerations

- Grammar processing can be memory-intensive for large grammars
- Use lazy initialization where appropriate
- Cache frequently accessed data structures
- Be mindful of deep recursion in tree traversal

## Documentation

- Use JSDoc for all public APIs
- Include `@param` for parameters with descriptions
- Include `@returns` for return values with descriptions
- Document thrown exceptions with `@throws`
- Keep documentation concise but complete

## Target Language Support

Currently supported target languages:
- Cpp (C++)
- CSharp (C#)
- Dart
- Go
- JavaScript
- Java
- PHP
- Python3
- Swift
- TypeScript

When adding or modifying target language support:
- Update `targetLanguages` array in `src/codegen/CodeGenerator.ts`
- Ensure templates exist in `templates/codegen/Target/` directory
- Test with representative grammars from grammars-v4 repository

## Unicode Support

- Uses Unicode 16 (vs. Unicode 11 in ANTLR4)
- Unicode data generation via `build/generate-unicode-data.ts`
- Properties from `unicode-properties` package

## Version and Release

- Version defined in `package.json`
- Release notes in `release-notes.md`
- Version file auto-generated during build: `src/version.ts`

## Additional Resources

- Main documentation: https://www.antlr-ng.org
- Grammars repository: https://github.com/antlr/grammars-v4
- Original ANTLR4: https://github.com/antlr/antlr4
