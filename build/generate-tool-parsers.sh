echo "\x1b[1m\x1b[34mGenerating tool parsers...\x1b[0m\n\n"

npx antlr-ng -Dlanguage=TypeScript --exact-output-dir -o ./src/generated ./src/grammars/ActionSplitter.g4
npx antlr-ng -Dlanguage=TypeScript --exact-output-dir -o ./src/generated ./src/grammars/ANTLRv4Lexer.g4 ./src/grammars/ANTLRv4Parser.g4

echo "done\n\n"

exit 0
