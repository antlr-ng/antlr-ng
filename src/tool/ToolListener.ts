/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Issue } from "./Issue.js";
import type { ErrorManager } from "./ErrorManager.js";

export class ToolListener {
    public constructor(public errorManager: ErrorManager) { }

    public info(msg: string): void {
        if (this.errorManager.formatWantsSingleLineMessage()) {
            msg = msg.replaceAll("\n", " ");
        }

        console.log(msg);
    }

    public error(msg: Issue): void {
        console.error(this.formatMessage(msg));
    }

    public warning(msg: Issue): void {
        console.warn(this.formatMessage(msg));
    }

    private formatMessage(msg: Issue): string {
        let text = msg.toString();
        if (this.errorManager.formatWantsSingleLineMessage()) {
            text = text.replaceAll("\n", " ");
        }

        return text;
    }
}
