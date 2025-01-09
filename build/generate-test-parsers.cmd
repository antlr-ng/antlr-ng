echo >/dev/null # >nul & GOTO WINDOWS

echo "\x1b[1m\x1b[34mGenerating test parsers...\x1b[0m\n\n"

antlr4ng -Dlanguage=TypeScript -no-visitor -no-listener -Xexact-output-dir -o ./tests/generated ./tests/grammars/*.g4

echo "done\n\n"

exit 0

:WINDOWS

echo Generating test parsers...

antlr4ng -Dlanguage=TypeScript -no-visitor -no-listener -Xexact-output-dir -o tests\generated tests\grammars\*.g4

echo done
