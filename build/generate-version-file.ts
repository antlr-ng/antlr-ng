/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/** Used to generate the srd/version.ts file from package.json. */

import { readFileSync, writeFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string; };

const content = `// Auto-generated - DO NOT EDIT
export const antlrVersion = '${packageJson.version}';
`;

writeFileSync("./src/version.ts", content);
console.log("Version file generated successfully.\n");
