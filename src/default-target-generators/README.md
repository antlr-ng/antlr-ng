# antlr-ng Default Target Generators

This directory contains the default target generators for antlr-ng. These generators were created from the old string template scripts in ANTLR4 and are made to reproducde exactly the same output like the old ST4 based generation. They are here in this repo only for a short period of time and will be published as own NPM package later.

## Overview

Target generators implement the `ITargetGenerator` interface and extend `GeneratorBase`. They process output model objects (from the `src/codegen/model` directory) and generate language-specific code.

## Available Generators

### TypeScriptTargetGenerator

The TypeScript target generator produces TypeScript code from ANTLR4 grammars. It generates:

- Parser files (.ts)
- Lexer files (.ts)
- Listener interfaces (.ts)
- Visitor interfaces (.ts)

TypeScript features:

- Uses ES6+ syntax
- Supports optional methods in interfaces (no base listener/visitor needed)
- Generates type-safe code with proper TypeScript types

> Note: The TypeScript target generator has already been optimized for TypeScript best practices and does not strictly follow the old ANTLR4 ST4 templates.
 
The generated code is compatible with the current antlr4ng TypeScript runtime.

### CppTargetGenerator

The C++ target generator produces C++ code from ANTLR4 grammars. It generates:

- Parser header and implementation files (.h, .cpp)
- Lexer header and implementation files (.h, .cpp)
- (Base)Listener interface and base class (.h)
- (Base)Visitor interface and base class (.h)

The generated code is compatible with the current C++ ANTLR4 runtime.

### CsharpTargetGenerator

The C# target generator produces C# code from ANTLR4 grammars. It generates:

- Parser files (.cs)
- Lexer files (.cs)
- (Base)Listener interface and base class (.cs)
- (Base)Visitor interface and base class (.cs)

The generated code is compatible with the current C# ANTLR4 runtime.

## Template Files

The generators are TypeScript implementations based on the StringTemplate4 files located in `templates/codegen/`. Once all languages are done these templates will be removed.

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

## Key Concepts

### Output Model Objects

The generators process output model objects (OMOs) which represent semantic elements of the grammar:

- `ParserFile`, `LexerFile` - Top-level file structures
- `RuleFunction` - Parser rules
- `StructDecl` - Rule context classes
- `SrcOp` - Various source operations (match, invoke, etc.)

The structure of the generators closely follows the old ANTLR4 ST4 templates for easier migration. A naming scheme is used to map OMO types (and hence string template names) to render method names. For example, the `ParserFile` OMO is rendered by the `renderParserFile` method.

### Source Operations

The `srcOpMap` in each generator maps output model object types to render methods. This allows clean separation of concerns and easy addition of new operations.

### Code Generation Flow

1. antlr-ng parses the grammar file(s) and creates a parse tree.
2. The parse tree is converted to an AST and processed to create output model objects. There are several phases involved in this process (grammar import, semantic phase, left recursion removal etc.).
3. The generated output model is passed to the code generator, which in turn invokes the target generator(s).
4. A target generator walks the model and renders code.
5. The rendered code is written to output files.

## Notes
