# Output with ANSI escape codes for bold and blue text
Write-Host "`e[1m`e[34mGenerating tool parsers...`e[0m`n`n"

& antlr4ng -Dlanguage=TypeScript -no-visitor -no-listener -Xexact-output-dir -o ./src/generated src/grammars/ActionSplitter.g4
& antlr4ng -Dlanguage=TypeScript -no-visitor -no-listener -Xexact-output-dir -o ./src/generated src\grammars\ANTLRv4Lexer.g4 src\grammars\ANTLRv4Parser.g4

Write-Host "done`n`n"
exit 0
