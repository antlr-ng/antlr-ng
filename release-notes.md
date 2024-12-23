<img src="https://raw.githubusercontent.com/mike-lischke/mike-lischke/master/images/ANTLRng2.svg" title="ANTLR Next Generation" alt="ANTLRng" width="96" height="96"/><label style="font-size: 70%">Part of the Next Generation ANTLR Project</label>

# ANTLRng Release Notes

## 0.3.0

All tool tests have been ported to TypeScript and are now running fine. The tool is now fully functional and can be used to generate parsers and lexers in TypeScript. However, the tests don't cover all features yet (listeners, visitors etc.), so there might still be some issues.

## 0.2.0

- Big reorganization of the project. Everything of the TS runtime has been moved to an own project.
- The tool files all build fine now.
- Had to add ports for certain ANTLR3 classes for now.
- Tool unit tests are not fixed yet.


## 0.1.0

- Initial commit.
- TypeScript files generated from Java.
- At this point the project contained both, the ANTLR4 tool and the ANTLR4 TS runtime.
