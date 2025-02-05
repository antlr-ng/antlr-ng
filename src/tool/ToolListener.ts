/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { ANTLRMessage } from "./ANTLRMessage.js";
import type { ErrorManager } from "./ErrorManager.js";

// TODO: This listener takes an error manager, but is added to that as listener.
export class ToolListener implements ToolListener {
    public constructor(public errorManager: ErrorManager) { }

    public info(msg: string): void {
        if (this.errorManager.formatWantsSingleLineMessage()) {
            msg = msg.replaceAll("\n", " ");
        }

        console.log(msg);
    }

    public error(msg: ANTLRMessage): void {
        const msgST = this.errorManager.getMessageTemplate(msg);
        if (msgST) {
            let outputMsg = msgST.render();
            if (this.errorManager.formatWantsSingleLineMessage()) {
                outputMsg = outputMsg.replaceAll("\n", " ");
            }

            console.log(outputMsg);
        }
    }

    public warning(msg: ANTLRMessage): void {
        const msgST = this.errorManager.getMessageTemplate(msg);
        if (msgST) {
            let outputMsg = msgST.render();
            if (this.errorManager.formatWantsSingleLineMessage()) {
                outputMsg = outputMsg.replaceAll("\n", " ");
            }

            console.log(outputMsg);
        }
    }
}
