/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { AltAST } from "./AltAST.js";
import { BlockAST } from "./BlockAST.js";
import { GrammarAST } from "./GrammarAST.js";
import { GrammarRootAST } from "./GrammarRootAST.js";
import { NotAST } from "./NotAST.js";
import { OptionalBlockAST } from "./OptionalBlockAST.js";
import { PlusBlockAST } from "./PlusBlockAST.js";
import { PredAST } from "./PredAST.js";
import { RangeAST } from "./RangeAST.js";
import { RuleAST } from "./RuleAST.js";
import { RuleRefAST } from "./RuleRefAST.js";
import { SetAST } from "./SetAST.js";
import { StarBlockAST } from "./StarBlockAST.js";
import { TerminalAST } from "./TerminalAST.js";

/**
 * A simple visitor, based upon the classic double dispatch method, for walking GrammarAST trees resulting from
 * parsing ANTLR grammars. There is also the GrammarTreeVisitor.g tree grammar that looks for subtree patterns and
 * fires off high-level events as opposed to "found node" events like this visitor does. Also, like all visitors, the
 * users of this interface are required to implement the node visitation of the children. The GrammarTreeVisitor
 * mechanism fires events and the user is not required to do any walking code.
 * ```
 *     GrammarAST t = ...;
 *     GrammarASTVisitor v = new ...;
 *     t.visit(v);
 * ```
 */
export interface IGrammarASTVisitor<T> {
    /**
     * This is the generic visitor method that will be invoked for any other kind of AST node not covered by the
     * other visit methods.
     */
    visit(node: GrammarAST): T;

    visit(node: GrammarRootAST): T;
    visit(node: RuleAST): T;

    visit(node: BlockAST): T;
    visit(node: OptionalBlockAST): T;
    visit(node: PlusBlockAST): T;
    visit(node: StarBlockAST): T;

    visit(node: AltAST): T;

    visit(node: NotAST): T;
    visit(node: PredAST): T;
    visit(node: RangeAST): T;
    visit(node: SetAST): T;
    visit(node: RuleRefAST): T;
    visit(node: TerminalAST): T;
}
