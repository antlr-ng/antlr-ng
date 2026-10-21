import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        includeSource: ["src/**/*.{js,ts}"],
        logHeapUsage: true,
        isolate: false,
        environment: "node",
        pool: "threads",
        reporters: [["default", { summary: false }]],
        slowTestThreshold: 5000,
        sequence: {
            concurrent: true,
        },
        testTimeout: 10000,
        setupFiles: ["./tests/setup.ts"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: ["src/generated/**", "src/version.ts"],
            reporter: ["text-summary", "html", "json-summary", "lcov"],
            reportsDirectory: "coverage",
        },
    }
});
