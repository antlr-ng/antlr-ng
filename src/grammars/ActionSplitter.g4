/*
 * Copyright (c) The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

lexer grammar ActionSplitter;

// $antlr-format alignTrailingComments on, columnLimit 150, maxEmptyLinesToKeep 1, reflowComments off, useTab off
// $antlr-format allowShortRulesOnASingleLine on, alignSemicolons none, minEmptyLines 0

@header {/* eslint-disable */

import type { ActionSplitterListener } from "../parse/ActionSplitterListener.js";

const attrValueExpr = /[^=][^;]*/;
const id = /[a-zA-Z_][a-zA-Z0-9_]*/;
const setNonLocalAttr = new RegExp(`\\$(?<x>${id.source})::(?<y>${id.source})(\\s)?=(\\s)?(?<expr>${attrValueExpr.source});`);
const nonLocalAttr = new RegExp(`\\$(?<x>${id.source})::(?<y>${id.source})`);
const qualifiedAttr = new RegExp(`\\$(?<x>${id.source}).(?<y>${id.source})`);
const setAttr = new RegExp(`\\$(?<x>${id.source})(?<s1>\\s)?=(?<s2>\\s)?(?<expr>${attrValueExpr.source});`);
const attr = new RegExp(`\\$(?<x>${id.source})`);
}

@members {/** Force filtering (and return tokens). Sends token values to the delegate. */
public getActionTokens(delegate: ActionSplitterListener, refToken?: Token): Token[] {
    const tokens = this.getAllTokens();
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        switch (t.type) {
            case ActionSplitter.COMMENT:
            case ActionSplitter.LINE_COMMENT:
            case ActionSplitter.TEXT: {
                // Replace $ with $.
                const text = t.text!.replaceAll("\\$", "$");
                delegate.text(text);

                break;
            }

            case ActionSplitter.SET_NONLOCAL_ATTR: {
                const text = t.text!;

                // Parse the text and extract the named groups from the match result.
                const match = text.match(setNonLocalAttr);
                if (match === null) {
                    throw new Error(`Mismatched input '${text}'`);
                }

                const { x, y, expr } = match.groups!;

                const [xToken, yToken] = this.createTokens(t, x.length + 2, refToken); // +2 for "::"
                xToken.text = x;
                yToken!.text = y;

                delegate.setNonLocalAttr(text, xToken, yToken!, expr);

                break;
            }

            case ActionSplitter.NONLOCAL_ATTR: {
                const text = t.text!;

                const match = text.match(nonLocalAttr);
                if (match === null) {
                    throw new Error(`Mismatched input '${text}'`);
                }

                const { x, y } = match.groups!;

                const [xToken, yToken] = this.createTokens(t, x.length + 2, refToken);
                xToken.text = x;
                yToken!.text = y;

                delegate.nonLocalAttr(text, xToken, yToken!);

                break;
            }

            case ActionSplitter.QUALIFIED_ATTR: {
                let text = t.text!;

                const match = text.match(qualifiedAttr);
                if (match === null) {
                    throw new Error(`Mismatched input '${text}'`);
                }

                const { x, y } = match.groups!;

                const [xToken, yToken] = this.createTokens(t, x.length + 1, refToken);
                xToken.text = x;
                yToken!.text = y;

                // In the ANTLR3 version of the grammar, QUALIFIED_ATTR was not matched if followed by a '('.
                // We have to simulate this behavior here.
                if (i + 1 < tokens.length && tokens[i + 1].text?.startsWith("(")) {
                    // Pretend we matched ATTR instead of QUALIFIED_ATTR, with the first part of the qualified name.
                    delegate.attr("$" + x, xToken);

                    // Pretend we matched TEXT instead of QUALIFIED_ATTR, with the rest of the qualified name.
                    text = "." + y + tokens[++i].text!;
                    delegate.text(text);

                    break;
                }

                delegate.qualifiedAttr(text, xToken, yToken!);

                break;
            }

            case ActionSplitter.SET_ATTR: {
                const text = t.text!;

                const match = text.match(setAttr);
                if (match === null) {
                    throw new Error(`Mismatched input '${text}'`);
                }

                const { x, s1 = "", s2 = "", expr } = match.groups!;

                // +2 for the second '$' and the '='.
                const [xToken, yToken] = this.createTokens(t, x.length + s1.length + s2.length + 2, refToken);
                xToken.text = x;
                yToken!.text = expr;

                delegate.setAttr(text, xToken, yToken!);

                break;
            }

            case ActionSplitter.ATTR: {
                const text = t.text!;

                const match = text.match(attr);
                if (match === null) {
                    throw new Error(`Mismatched input '${text}'`);
                }

                const { x } = match.groups!;
                const [xToken] = this.createTokens(t, undefined, refToken);

                xToken.text = x;
                delegate.attr(text, xToken);

                break;
            }

            default:
        }
    }

    // TODO: need to remove the EOF token from the list of tokens?
    return tokens;
}

private createTokens(sourceToken: Token, offset?: number, refToken?: Token): [Token, Token | undefined] {
    let line = 1;
    let column = 1; // 1 for the leading $
    if (refToken) {
        // If this token starts on the first line, take the ref token's column into account.
        if (sourceToken.line === 1) {
            column = refToken.column;
        }
        line = refToken.line;
    }

    column += sourceToken.column;
    line += sourceToken.line - 1;

    const xToken = antlr.CommonToken.fromToken(sourceToken);
    xToken.line = line;
    xToken.column = column;

    let yToken: Token | undefined;
    if (offset !== undefined) {
        yToken = antlr.CommonToken.fromToken(sourceToken);
        yToken.line = line;
        yToken.column = column + offset;
    }

    return [xToken, yToken];
}}

// ignore comments right away

COMMENT:      '/*' .*? '*/';
LINE_COMMENT: '//' ~('\n' | '\r')* '\r'? '\n';

SET_NONLOCAL_ATTR: '$' ID '::' ID WS? '=' ATTR_VALUE_EXPR ';';

NONLOCAL_ATTR: '$' ID '::' ID;

QUALIFIED_ATTR: '$' ID '.' ID;

SET_ATTR: '$' ID WS? '=' ATTR_VALUE_EXPR ';';

ATTR: '$' ID;

// Anything else is just random text

TEXT: (~'$' | '\\$' | '$' ~[a-zA-Z_])+;

fragment ID: ('a' ..'z' | 'A' ..'Z' | '_') ('a' ..'z' | 'A' ..'Z' | '0' ..'9' | '_')*;

/** Don't allow an = as first char to prevent $x == 3; kind of stuff. */

fragment ATTR_VALUE_EXPR: ~'=' (~';')*;

fragment WS: (' ' | '\t' | '\n' | '\r')+;
