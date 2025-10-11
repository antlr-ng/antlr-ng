# ANTLR-ng Default Target Generators

This directory contains the default target generators for ANTLR-ng. These generators are responsible for generating code in various programming languages from ANTLR grammar files.

## Overview

Target generators implement the `ITargetGenerator` interface and extend `GeneratorBase`. They process output model objects (from the `src/codegen/model` directory) and generate language-specific code.

## Available Generators

### TypeScriptTargetGenerator.ts
The TypeScript target generator produces TypeScript code from ANTLR grammars. It generates:
- Parser files (.ts)
- Lexer files (.ts)
- Listener interfaces (.ts)
- Visitor interfaces (.ts)

TypeScript features:
- Uses ES6+ syntax
- Supports optional methods in interfaces (no base listener/visitor needed)
- Generates type-safe code with proper TypeScript types

### CppTargetGenerator.ts
The C++ target generator produces C++ code from ANTLR grammars. It generates:
- Parser header and implementation files (.h, .cpp)
- Lexer header and implementation files (.h, .cpp)
- Listener interface and base class (.h)
- Visitor interface and base class (.h)

C++ features:
- Generates both header (.h) and implementation (.cpp) files
- Uses smart pointers (`std::shared_ptr`) for memory management
- Supports namespaces
- Generates base listener and visitor classes
- Compatible with ANTLR4 C++ runtime

## Template Files

The generators work in conjunction with StringTemplate4 files located in `templates/codegen/`:
- `Cpp/Cpp.stg` - Main C++ templates
- `Cpp/Files.stg` - C++ file structure templates

These templates define the structure of generated files and work with the data provided by the target generators.

## Creating a New Target Generator

To create a new target generator:

1. Create a new file in this directory (e.g., `JavaTargetGenerator.ts`)
2. Implement the `ITargetGenerator` interface
3. Extend `GeneratorBase` for common functionality
4. Implement all required methods:
   - `renderParserFile(file, declaration)`
   - `renderLexerFile(file, declaration)`
   - `renderListenerFile(file, declaration)`
   - `renderBaseListenerFile(file, declaration)` (if needed)
   - `renderVisitorFile(file, declaration)`
   - `renderBaseVisitorFile(file, declaration)` (if needed)
   - `renderTestFile(...)` for test harness generation
   - Various helper methods for code generation

5. Define language-specific properties:
   - `codeFileExtension` (e.g., ".java", ".cpp")
   - `declarationFileExtension` (e.g., ".h" for C++)
   - `reservedWords` set
   - Other language-specific settings

See `TargetGenerator.ts.template` for a template to get started.

## Key Concepts

### Output Model Objects
The generators process output model objects (OMOs) which represent semantic elements of the grammar:
- `ParserFile`, `LexerFile` - Top-level file structures
- `RuleFunction` - Parser rules
- `StructDecl` - Rule context classes
- `SrcOp` - Various source operations (match, invoke, etc.)

### Source Operations
The `srcOpMap` in each generator maps output model object types to render methods. This allows clean separation of concerns and easy addition of new operations.

### Code Generation Flow
1. ANTLR-ng parses the grammar file
2. The output model controller creates output model objects
3. The target generator walks the model and renders code
4. The rendered code is written to output files

## Notes

### TypeScript Limitations
Due to TypeScript's readonly property semantics, some properties like `wantsBaseListener`, `wantsBaseVisitor`, and `supportsOverloadedMethods` cannot be overridden with different values when they're defined as readonly in the base class. These are handled by the template system instead or documented as limitations.

### Template System Integration
While the generators in this directory produce code programmatically, they work alongside the StringTemplate4-based system for compatibility with existing ANTLR tooling and to leverage template-based code generation for certain aspects.
