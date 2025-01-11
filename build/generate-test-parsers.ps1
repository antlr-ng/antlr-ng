Write-Host "`e[1m`e[34mGenerating test parsers...`e[0m`n`n"

& antlr4ng -Dlanguage=TypeScript -no-visitor -no-listener -Xexact-output-dir -o ./tests/generated ./tests/grammars/*.g4

Write-Host "done`n"
exit 0
