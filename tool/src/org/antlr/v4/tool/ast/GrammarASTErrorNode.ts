/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */


/* eslint-disable jsdoc/require-returns, jsdoc/require-param */


import { GrammarAST } from "./GrammarAST.js";



/** A node representing erroneous token range in token stream */
export  class GrammarASTErrorNode extends GrammarAST {
    protected  delegate: CommonErrorNode;
    public  constructor(input: TokenStream, start: Token, stop: Token,
                               e: org.antlr.runtime.RecognitionException)
    {
        this.delegate = new  CommonErrorNode(input,start,stop,e);
    }

    @Override
public  isNil():  boolean { return this.delegate.isNil(); }

    @Override
public  getType():  number { return this.delegate.getType(); }

    @Override
public  getText():  string { return this.delegate.getText(); }
    @Override
public  toString():  string { return this.delegate.toString(); }
}
