/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { Character } from "./support/Character.js";
import { ErrorManager } from "./tool/ErrorManager.js";
import { ErrorType } from "./tool/ErrorType.js";
import type { ActionAST } from "./tool/ast/ActionAST.js";
import type { GrammarAST } from "./tool/ast/GrammarAST.js";
import type { RuleAST } from "./tool/ast/RuleAST.js";
import type { TerminalAST } from "./tool/ast/TerminalAST.js";
import { GrammarTreeVisitor } from "./tree/walkers/GrammarTreeVisitor.js";

export class UndefChecker extends GrammarTreeVisitor {
    public badRef = false;

    public constructor(private isLexer: boolean, private ruleToAST: Map<string, RuleAST>,
        errorManager: ErrorManager) {
        super(errorManager);
    }

    public override tokenRef(ref: TerminalAST): void {
        if (ref.getText() === "EOF") {
            // this is a special predefined reference
            return;
        }

        if (this.isLexer) {
            this.ruleRef(ref, null);
        }
    }

    public override ruleRef(ref: GrammarAST, arg: ActionAST | null): void {
        const ruleAST: RuleAST | undefined = this.ruleToAST.get(ref.getText());
        const fileName = ref.token?.inputStream?.getSourceName() ?? "<unknown>";

        if (Character.isUpperCase(this.currentRuleName!.codePointAt(0)!) &&
            Character.isLowerCase(ref.getText().codePointAt(0)!)) {
            this.badRef = true;
            this.errorManager.grammarError(ErrorType.PARSER_RULE_REF_IN_LEXER_RULE,
                fileName, ref.token!, ref.getText(), this.currentRuleName);
        } else if (!ruleAST) {
            this.badRef = true;
            this.errorManager.grammarError(ErrorType.UNDEFINED_RULE_REF, fileName, ref.token!, ref.getText());
        }
    }

}
