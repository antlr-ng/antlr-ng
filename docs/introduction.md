<div id="logoBox">
    <img src="/images/antlr-ng-logo2.svg" class="logo"></img>
    <h1>Introducing <span class="antlrng">antlr-ng</span>:<br />
    the Next Generation Parser Generator of ANTLR</h1>
</div>


<span class="antlrng">antlr-ng</span> is the next evolution step of the old ANTLR4 Java tool for language recognition, designed as a TypeScript npm package. It's based on ANTLR version 4.13.2 and serves as a parser generator, allowing developers to create parsers for various programming languages and custom grammars. This powerful library offers several key features and improvements over its predecessor, making it an attractive option for developers working on language processing tasks.

## Key Features and Improvements

<span class="antlrng">antlr-ng</span> builds upon the foundation of ANTLR4 while introducing several enhancements:

1. **TypeScript Implementation**: The entire codebase has been transformed from Java to TypeScript, providing better integration with modern web and Node.js projects.
2. **Multi-language Support**: <span class="antlrng">antlr-ng</span> can generate parser and lexer classes for multiple target languages, including TypeScript/JavaScript, Java, C++, C#, Go, Python3, Dart, Swift, and PHP.
3. **Dynamic Configuration**: One of the planned features is to allow dynamically loading generators for target languages. This opens the door for many new features like customization of the generation process, private target generators, complex file generation, etc.

> **Note:** This documentation is a work in progress and will be updated as the project evolves. Some pages are rendered from markdown files, which have been copied from the ANTLR4 documentation and adapted for <span class="antlrng">antlr-ng</span>.

## Usage and Integration

For a detailed description of how to use <span class="antlrng">antlr-ng</span> see the [Getting Started Page](/getting-started).

## Compatibility and Migration

The <span class="antlrng">antlr-ng</span> tool aims to be a drop-in replacement for ANTLR4, with full compatibility for existing grammars and generated parsers. Developers can migrate their projects to <span class="antlrng">antlr-ng</span> with minimal effort, leveraging the enhanced features and performance benefits of the new tool.

## Future Developments

The <span class="antlrng">antlr-ng</span> project is actively evolving, with several planned improvements:

1. **Browser Compatibility**: Future versions aim to support running <span class="antlrng">antlr-ng</span> directly in web browsers, expanding its versatility.
2. **Dynamic Loading of Generators**: Since TypeScript is a scripting language it is easy to load additional scripts at runtime, allowing tool users (not only target developers) to customize the generation process.
3. **Better Import Handling**: Allows users to control grammar import at the rule level.
4. **Separation of Tool and Targets**: <span class="antlrng">antlr-ng</span> finally separates itself from the target generators, in a way which makes target support development completely independent.

## Advantages of Using <span class="antlrng">antlr-ng</span>

1. **Modern TypeScript Ecosystem**: With its focus on TypeScript and ESM, <span class="antlrng">antlr-ng</span> integrates seamlessly with modern development practices and paradigms.
2. **Productivity**: The <span class="antlrng">antlr-ng</span> tool significantly enhances developer productivity by simplifying the process of creating and maintaining parsers for evolving languages or formats.
3. **Flexibility**: The multi-language support allows developers to generate parsers for various target languages from a single grammar definition.
4. **Automatic Parse Tree Generation**: <span class="antlrng">antlr-ng</span> automatically generates parse trees, saving developers from manually augmenting grammars with tree construction operations.
5. **Listener and Visitor Pattern Support**: The tool generates parse-tree walkers implementing both listener and visitor patterns, providing flexibility in how developers interact with the parsed structure.

## Considerations and Limitations

While <span class="antlrng">antlr-ng</span> offers numerous advantages, developers should consider the following:

1. **Learning Curve**: For those unfamiliar with ANTLR, there may be a learning curve in understanding grammar definition and parser generation concepts.
2. **Ongoing Development**: As the tool is still evolving, developers should be prepared for potential changes and updates in future versions.
3. **Specific Use Cases**: While powerful, <span class="antlrng">antlr-ng</span> may be overkill for simple parsing tasks. Developers should evaluate whether a full parser generator is necessary for their specific use case.

In conclusion, <span class="antlrng">antlr-ng</span> represents a significant advancement in the field of parser generation, particularly for TypeScript and JavaScript developers. Its combination of performance, flexibility, and modern language support makes it a valuable tool for projects involving complex language processing tasks. As the project continues to evolve, it promises to become an even more integral part of the language recognition toolkit for developers across various programming languages and environments.

## License

Like its predecessor, <span class="antlrng">antlr-ng</span> is licensed under the BSD 3-Clause License. For more information see the [BSD 3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
