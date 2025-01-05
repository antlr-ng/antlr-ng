/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ListenerFile } from "./ListenerFile.js";
import { OutputModelFactory } from "../OutputModelFactory.js";

export class BaseListenerFile extends ListenerFile {
    public constructor(factory: OutputModelFactory, fileName: string) {
        super(factory, fileName);
    }
}
