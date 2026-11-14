import { defineConfig } from "../src/config/config.js";
import { TypeScriptTargetGenerator } from "../src/default-target-generators/TypeScriptTargetGenerator.js";

export default defineConfig({
    grammarFiles: ["./src/grammars/ANTLRv4Lexer.g4", "./src/grammars/ANTLRv4Parser.g4"],
    generationOptions: {
        outputDirectory: "./tests/generated",
    },
    generators: [new TypeScriptTargetGenerator()],
});
