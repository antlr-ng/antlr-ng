/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import * as esbuild from "esbuild";

const build = async () => {
    try {
        await Promise.all([
            esbuild.build({
                entryPoints: ["src/**/*.ts"],
                bundle: false,
                outdir: "dist/src",
                format: "esm",
                target: "es2022",
                platform: "node",
                keepNames: true,
                packages: "external",
            }),
            esbuild.build({
                entryPoints: ["cli/**/*.ts"],
                bundle: false,
                outdir: "dist/cli",
                format: "esm",
                platform: "node",
                target: "es2022",
            }),
        ]);

        console.log("Build completed successfully");
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }
};

await build();
