/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */




import { S } from "jree";
import { CommonToken } from "../../CommonToken";




/**
 * A {@link Token} object representing a token of a particular type; e.g.,
 * {@code <ID>}. These tokens are created for {@link TagChunk} chunks where the
 * tag corresponds to a lexer rule or token type.
 */
export class TokenTagToken extends CommonToken {
	/**
	 * This is the backing field for {@link #getTokenName}.
	 */

	private readonly tokenName:  java.lang.String | null;
	/**
	 * This is the backing field for {@link #getLabel}.
	 */

	private readonly label:  java.lang.String | null;

	/**
	 * Constructs a new instance of {@link TokenTagToken} for an unlabeled tag
	 * with the specified token name and type.
	 *
	 * @param tokenName The token name.
	 * @param type The token type.
	 */
	/* eslint-disable constructor-super, @typescript-eslint/no-unsafe-call */
public constructor(tokenName: java.lang.String| null, type: number);

	/**
	 * Constructs a new instance of {@link TokenTagToken} with the specified
	 * token name, type, and label.
	 *
	 * @param tokenName The token name.
	 * @param type The token type.
	 * @param label The label associated with the token tag, or {@code null} if
	 * the token tag is unlabeled.
	 */
	public constructor(tokenName: java.lang.String| null, type: number, label: java.lang.String| null);
/* @ts-expect-error, because of the super() call in the closure. */
public constructor(tokenName: java.lang.String | null, type: number, label?: java.lang.String | null) {
const $this = (tokenName: java.lang.String | null, type: number, label?: java.lang.String | null): void => {
if (label === undefined) {
		$this(tokenName, type, null);
	}
 else  {

/* @ts-expect-error, because of the super() call in the closure. */
		super(type);
		this.tokenName = tokenName;
		this.label = label;
	}
};

$this(tokenName, type, label);

}
/* eslint-enable constructor-super, @typescript-eslint/no-unsafe-call */

	/**
	 * Gets the token name.
	 * @returns The token name.
	 */

	public readonly getTokenName = ():  java.lang.String | null => {
		return this.tokenName;
	}

	/**
	 * Gets the label associated with the rule tag.
	 *
	 * @returns The name of the label associated with the rule tag, or
	 * {@code null} if this is an unlabeled rule tag.
	 */

	public readonly getLabel = ():  java.lang.String | null => {
		return this.label;
	}

	/**
	 *
	 * <p>The implementation for {@link TokenTagToken} returns the token tag
	 * formatted with {@code <} and {@code >} delimiters.</p>
	 */
	public getText = ():  java.lang.String | null => {
		if (this.label !== null) {
			return S`<` + this.label + S`:` + this.tokenName + S`>`;
		}

		return S`<` + this.tokenName + S`>`;
	}

	/**
	 *
	 * <p>The implementation for {@link TokenTagToken} returns a string of the form
	 * {@code tokenName:type}.</p>
	 */
	public toString = ():  java.lang.String | null => {
		return this.tokenName + S`:` + this.type;
	}
}
