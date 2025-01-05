/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { CommonToken } from "antlr4ng";

import { ANTLRv4Parser } from "../generated/ANTLRv4Parser.js";

import { Constants } from "../Constants.js";
import { Character } from "../support/Character.js";
import { ActionAST } from "../tool/ast/ActionAST.js";
import { AttributeDict } from "../tool/AttributeDict.js";
import { ErrorType } from "../tool/ErrorType.js";
import { Grammar } from "../tool/Grammar.js";
import { IAttribute } from "../tool/IAttribute.js";

/**
 * Parse args, return values, locals
 * <p>
 * rule[arg1, arg2, ..., argN] returns [ret1, ..., retN]
 * <p>
 * text is target language dependent.  Java/C#/C/C++ would
 * use "int i" but ruby/python would use "i". Languages with
 * postfix types like Go, Swift use "x : T" notation or "T x".
 */
export class ScopeParser {
    /**
     * Given an arg or retval scope definition list like
     * ```
     * Map<String, String>, int[] j3, char *foo32[3]
     * ```
     * or
     * ```
     * int i=3, j=a[34]+20
     * ```
     * convert to an attribute scope.
     */
    public static parseTypedArgList(action: ActionAST | null, s: string, g: Grammar): AttributeDict {
        return this.parse(action, s, ",", g);
    }

    private static parse(action: ActionAST | null, s: string, separator: string, g: Grammar): AttributeDict {
        const dict = new AttributeDict();
        const decls = this.splitDecls(s, separator);
        for (const decl of decls) {
            if (decl[0].trim().length > 0) {
                const a = this.parseAttributeDef(action, decl, g);
                dict.add(a!);
            }
        }

        return dict;
    }

    /**
     * For decls like "String foo" or "char *foo32[]" compute the ID
     * and type declarations.  Also handle "int x=3" and 'T t = new T("foo")'
     * but if the separator is ',' you cannot use ',' in the init value
     * unless you escape use "\," escape.
     */
    private static parseAttributeDef(action: ActionAST | null, decl: [string | null, number],
        g: Grammar): IAttribute | null {
        if (decl[0] === null) {
            return null;
        }

        const attr: IAttribute = { name: "" };
        let rightEdgeOfDeclarator = decl[0].length - 1;
        const equalsIndex = decl[0].indexOf("=");
        if (equalsIndex > 0) {
            // everything after the '=' is the init value
            attr.initValue = decl[0].substring(equalsIndex + 1, decl[0].length).trim();
            rightEdgeOfDeclarator = equalsIndex - 1;
        }

        const declarator = decl[0].substring(0, rightEdgeOfDeclarator + 1);
        let p: [number, number];
        let text = decl[0];
        text = text.replaceAll("::", "");
        if (text.includes(":")) {
            // declarator has type appearing after the name like "x:T"
            p = ScopeParser.parsePostfixDecl(attr, declarator, action, g);
        } else {
            // declarator has type appearing before the name like "T x"
            p = ScopeParser.parsePrefixDecl(attr, declarator, action, g);
        }

        const [idStart, idStop] = p;
        attr.decl = decl[0];

        if (action !== null) {
            const actionText = action.getText();
            const lines = new Array<number>(actionText.length);
            const charPositionInLines = new Array<number>(actionText.length);
            for (let i = 0, line = 0, col = 0; i < actionText.length; i++, col++) {
                lines[i] = line;
                charPositionInLines[i] = col;
                if (actionText[i] === "\n") {
                    line++;
                    col = -1;
                }
            }

            const charIndexes = new Array<number>(actionText.length);
            for (let i = 0, j = 0; i < actionText.length; i++, j++) {
                charIndexes[j] = i;
                // skip comments
                if (i < actionText.length - 1 && actionText[i] === "/" && actionText[i + 1] === "/") {
                    while (i < actionText.length && actionText[i] !== "\n") {
                        i++;
                    }
                }
            }

            const declOffset = charIndexes[decl[1]];
            const declLine = lines[declOffset + idStart];

            const line = action.token!.line + declLine;
            let charPositionInLine = charPositionInLines[declOffset + idStart];
            if (declLine === 0) {
                /* offset for the start position of the ARG_ACTION token, plus 1
                 * since the ARG_ACTION text had the leading '[' stripped before
                 * reaching the scope parser.
                 */
                charPositionInLine += action.token!.column + 1;
            }

            const offset = (action.token as CommonToken).start;
            attr.token = CommonToken.fromSource([null, action.token!.inputStream], ANTLRv4Parser.ID,
                Constants.DEFAULT_TOKEN_CHANNEL, offset + declOffset + idStart + 1, offset + declOffset + idStop);
            attr.token.line = line;
            attr.token.column = charPositionInLine;
        }

        return attr;
    }

    private static parsePrefixDecl(attr: IAttribute, decl: string, a: ActionAST | null, g: Grammar): [number, number] {
        // walk backwards looking for start of an ID
        let inID = false;
        let start = -1;
        for (let i = decl.length - 1; i >= 0; i--) {
            const ch = decl.codePointAt(i)!;

            // if we haven't found the end yet, keep going
            if (!inID && Character.isLetterOrDigit(ch)) {
                inID = true;
            } else {
                if (inID && !(Character.isLetterOrDigit(ch) || ch === 0x5F)) { // '_'
                    start = i + 1;
                    break;
                }
            }

        }

        if (start < 0 && inID) {
            start = 0;
        }

        if (start < 0) {
            g.tool.errorManager.grammarError(ErrorType.CANNOT_FIND_ATTRIBUTE_NAME_IN_DECL, g.fileName, a?.token ?? null,
                decl);
        }

        // walk forward looking for end of an ID
        let stop = -1;
        for (let i = start; i < decl.length; i++) {
            const ch = decl.codePointAt(i)!;
            // if we haven't found the end yet, keep going
            if (!(Character.isLetterOrDigit(ch) || ch === 0x5F)) { // '_'
                stop = i;
                break;
            }

            if (i === decl.length - 1) {
                stop = i + 1;
            }
        }

        // the name is the last ID
        attr.name = decl.substring(start, stop);

        // the type is the decl minus the ID (could be empty)
        attr.type = decl.substring(0, start);
        if (stop <= decl.length - 1) {
            attr.type += decl.substring(stop, decl.length);
        }

        attr.type = attr.type.trim();
        if (attr.type.length === 0) {
            attr.type = undefined;
        }

        return [start, stop];
    }

    private static parsePostfixDecl(attr: IAttribute, decl: string, a: ActionAST | null, g: Grammar): [number, number] {
        let start = -1;
        let stop = -1;
        const colon = decl.indexOf(":");
        const namePartEnd = colon === -1 ? decl.length : colon;

        // look for start of name
        for (let i = 0; i < namePartEnd; ++i) {
            const ch = decl.codePointAt(i)!;
            if (Character.isLetterOrDigit(ch) || ch === 0x5F) { // '_'
                start = i;
                break;
            }
        }

        if (start === -1) {
            start = 0;
            g.tool.errorManager.grammarError(ErrorType.CANNOT_FIND_ATTRIBUTE_NAME_IN_DECL, g.fileName, a?.token ?? null,
                decl);
        }

        // look for stop of name
        for (let i = start; i < namePartEnd; ++i) {
            const ch = decl.codePointAt(i)!;
            if (!(Character.isLetterOrDigit(ch) || ch === 0x5F)) { // '_'
                stop = i;
                break;
            }

            if (i === namePartEnd - 1) {
                stop = namePartEnd;
            }
        }

        if (stop === -1) {
            stop = start;
        }

        // extract name from decl
        attr.name = decl.substring(start, stop);

        // extract type from decl (could be empty)
        if (colon === -1) {
            attr.type = "";
        } else {
            attr.type = decl.substring(colon + 1, decl.length);
        }
        attr.type = attr.type.trim();

        if (attr.type.length === 0) {
            attr.type = undefined;
        }

        return [start, stop];
    }

    /**
     * Given an argument list like
     * ```
     * x, (*a).foo(21,33), 3.2+1, '\n',
     * "a,oo\nick", {bl, "abc"eck}, ["cat\n,", x, 43]
     * ```
     * convert to a list of attributes.  Allow nested square brackets etc...
     * Set separatorChar to ';' or ',' or whatever you want.
     */
    private static splitDecls(s: string, separatorChar: string): Array<[string, number]> {
        const args = new Array<[string, number]>();
        ScopeParser.splitArgumentList(s, 0, -1, separatorChar.codePointAt(0)!, args);

        return args;
    }

    private static splitArgumentList(actionText: string | null, start: number, targetChar: number,
        separatorChar: number, args: Array<[string, number]>): number {
        if (actionText === null) {
            return -1;
        }

        actionText = actionText.replaceAll(/\/\/[^\n]*/g, "");
        const n = actionText.length;

        let p = start;
        let last = p;
        while (p < n && actionText.codePointAt(p)! !== targetChar) {
            const c = actionText.codePointAt(p)!;
            switch (c) {
                case 0x27: { // single quote
                    p++;
                    while (p < n && actionText.codePointAt(p) !== 0x27) {
                        if (actionText.codePointAt(p) === 0x5C && (p + 1) < n &&
                            actionText.codePointAt(p + 1) === 0x27) {
                            p++; // skip escaped quote
                        }
                        p++;
                    }
                    p++;
                    break;
                }

                case 0x22: { // double quote
                    p++;
                    while (p < n && actionText.codePointAt(p) !== 0x22) {
                        if (actionText.codePointAt(p) === 0x5C && (p + 1) < n &&
                            actionText.codePointAt(p + 1) === 0x22) {
                            p++; // skip escaped quote
                        }
                        p++;
                    }
                    p++;
                    break;
                }

                case 0x28: { // '('
                    p = ScopeParser.splitArgumentList(actionText, p + 1, 0x23, separatorChar, args);
                    break;
                }

                case 0x7B: { // '{'
                    p = ScopeParser.splitArgumentList(actionText, p + 1, 0x7D, separatorChar, args);
                    break;
                }

                case 0x3C: { // '<'
                    if (actionText.indexOf(">", p + 1) >= p) {
                        // do we see a matching '>' ahead?  if so, hope it's a generic
                        // and not less followed by expr with greater than
                        p = ScopeParser.splitArgumentList(actionText, p + 1, 0x3E, separatorChar, args);
                    } else {
                        p++; // treat as normal char
                    }
                    break;
                }

                case 0x5B: { // '['
                    p = ScopeParser.splitArgumentList(actionText, p + 1, 0x5D, separatorChar, args);
                    break;
                }

                default: {
                    if (c === separatorChar && targetChar === -1) {
                        const arg = actionText.substring(last, p);
                        let index = last;
                        while (index < p && Character.isWhitespace(actionText.codePointAt(index)!)) {
                            index++;
                        }

                        args.push([arg.trim(), index]);
                        last = p + 1;
                    }
                    p++;
                    break;
                }

            }
        }
        if (targetChar === -1) {
            const arg = actionText.substring(last, p).trim();
            let index = last;
            while (index < p && Character.isWhitespace(actionText.codePointAt(index)!)) {
                index++;
            }

            if (arg.length > 0) {
                args.push([arg.trim(), index]);
            }
        }
        p++;

        return p;
    }

}
