/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { cp } from "node:fs/promises";

/**
 * This script is to be used after the build process to copy the templates/ folder to the dist folder.
 */

await cp("templates", "dist/templates", { force: true, recursive: true });
