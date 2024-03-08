/*
 * Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */


/* eslint-disable jsdoc/require-returns, jsdoc/require-param */


import { Grammar } from "./Grammar.js";
import { Tool } from "../Tool.js";
import { CodeGenerator } from "../codegen/CodeGenerator.js";



/** Given a grammar file, show the dependencies on .tokens etc...
 *  Using ST, emit a simple "make compatible" list of dependencies.
 *  For example, combined grammar T.g (no token import) generates:
 *
 *  	TParser.java : T.g
 *  	T.tokens : T.g
 *  	TLexer.java : T.g
 *
 *  If we are using the listener pattern (-listener on the command line)
 *  then we add:
 *
 *      TListener.java : T.g
 *      TBaseListener.java : T.g
 *
 *  If we are using the visitor pattern (-visitor on the command line)
 *  then we add:
 *
 *      TVisitor.java : T.g
 *      TBaseVisitor.java : T.g
 *
 *  If "-lib libdir" is used on command-line with -depend and option
 *  tokenVocab=A in grammar, then include the path like this:
 *
 * 		T.g: libdir/A.tokens
 *
 *  Pay attention to -o as well:
 *
 * 		outputdir/TParser.java : T.g
 *
 *  So this output shows what the grammar depends on *and* what it generates.
 *
 *  Operate on one grammar file at a time.  If given a list of .g on the
 *  command-line with -depend, just emit the dependencies.  The grammars
 *  may depend on each other, but the order doesn't matter.  Build tools,
 *  reading in this output, will know how to organize it.
 *
 *  This code was obvious until I removed redundant "./" on front of files
 *  and had to escape spaces in filenames :(
 *
 *  I literally copied from v3 so might be slightly inconsistent with the
 *  v4 code base.
 */
export  class BuildDependencyGenerator {
    protected  tool:  Tool;
    protected  g:  Grammar;
    protected  generator:  CodeGenerator;
    protected  templates:  STGroup;

    public  constructor(tool: Tool, g: Grammar) {
        this.tool = tool;
		this.g = g;
		this.generator = CodeGenerator.create(g);
    }

    /** From T.g return a list of File objects that
     *  name files ANTLR will emit from T.g.
     */
    public  getGeneratedFileList():  Array<File> {
        let  files = new  Array<File>();

        // add generated recognizer; e.g., TParser.java
        if (this.generator.getTarget().needsHeader()) {
          files.add(this.getOutputFile(this.generator.getRecognizerFileName(true)));
        }
        files.add(this.getOutputFile(this.generator.getRecognizerFileName(false)));
        // add output vocab file; e.g., T.tokens. This is always generated to
        // the base output directory, which will be just . if there is no -o option
        //
		files.add(this.getOutputFile(this.generator.getVocabFileName()));
        // are we generating a .h file?
        let  headerExtST = null;
        let  extST = this.generator.getTemplates().getInstanceOf("codeFileExtension");
        if (this.generator.getTemplates().isDefined("headerFile")) {
            headerExtST = this.generator.getTemplates().getInstanceOf("headerFileExtension");
            let  suffix = Grammar.getGrammarTypeToFileNameSuffix(this.g.getType());
            let  fileName = this.g.name + suffix + headerExtST.render();
            files.add(this.getOutputFile(fileName));
        }
        if ( this.g.isCombined() ) {
            // add autogenerated lexer; e.g., TLexer.java TLexer.h TLexer.tokens

            let  suffix = Grammar.getGrammarTypeToFileNameSuffix(ANTLRParser.LEXER);
            let  lexer = this.g.name + suffix + extST.render();
            files.add(this.getOutputFile(lexer));
            let  lexerTokens = this.g.name + suffix + CodeGenerator.VOCAB_FILE_EXTENSION;
            files.add(this.getOutputFile(lexerTokens));

            // TLexer.h
            if (headerExtST !== null) {
                let  header = this.g.name + suffix + headerExtST.render();
                files.add(this.getOutputFile(header));
            }
        }

        if ( this.g.tool.gen_listener ) {
          // add generated listener; e.g., TListener.java
          if (this.generator.getTarget().needsHeader()) {
            files.add(this.getOutputFile(this.generator.getListenerFileName(true)));
          }
          files.add(this.getOutputFile(this.generator.getListenerFileName(false)));

          // add generated base listener; e.g., TBaseListener.java
          if (this.generator.getTarget().needsHeader()) {
            files.add(this.getOutputFile(this.generator.getBaseListenerFileName(true)));
          }
          files.add(this.getOutputFile(this.generator.getBaseListenerFileName(false)));
        }

        if ( this.g.tool.gen_visitor ) {
          // add generated visitor; e.g., TVisitor.java
          if (this.generator.getTarget().needsHeader()) {
            files.add(this.getOutputFile(this.generator.getVisitorFileName(true)));
          }
          files.add(this.getOutputFile(this.generator.getVisitorFileName(false)));

          // add generated base visitor; e.g., TBaseVisitor.java
          if (this.generator.getTarget().needsHeader()) {
            files.add(this.getOutputFile(this.generator.getBaseVisitorFileName(true)));
          }
          files.add(this.getOutputFile(this.generator.getBaseVisitorFileName(false)));
        }


		// handle generated files for imported grammars
		let  imports = this.g.getAllImportedGrammars();
		if ( imports!==null ) {
			for (let g of imports) {
//				File outputDir = tool.getOutputDirectory(g.fileName);
//				String fname = groomQualifiedFileName(outputDir.toString(), g.getRecognizerName() + extST.render());
//				files.add(new File(outputDir, fname));
				files.add(this.getOutputFile(g.fileName));
			}
		}

		if (files.isEmpty()) {
			return null;
		}
		return files;
	}

	public  getOutputFile(fileName: string):  File {
		let  outputDir = this.tool.getOutputDirectory(this.g.fileName);
		if ( outputDir.toString().equals(".") ) {
			// pay attention to -o then
			outputDir = this.tool.getOutputDirectory(fileName);
		}
		if ( outputDir.toString().equals(".") ) {
			return new  File(fileName);
		}
		if (outputDir.getName().equals(".")) {
			let  fname = outputDir.toString();
			let  dot = fname.lastIndexOf('.');
			outputDir = new  File(outputDir.toString().substring(0,dot));
		}

		if (outputDir.getName().indexOf(' ') >= 0) { // has spaces?
			let  escSpaces = outputDir.toString().replace(" ", "\\ ");
			outputDir = new  File(escSpaces);
		}
		return new  File(outputDir, fileName);
	}

    /**
     * Return a list of File objects that name files ANTLR will read
     * to process T.g; This can be .tokens files if the grammar uses the tokenVocab option
     * as well as any imported grammar files.
     */
    public  getDependenciesFileList():  Array<File> {
        // Find all the things other than imported grammars
        let  files = this.getNonImportDependenciesFileList();

        // Handle imported grammars
        let  imports = this.g.getAllImportedGrammars();
        if ( imports!==null ) {
			for (let g of imports) {
				let  libdir = this.tool.libDirectory;
				let  fileName = this.groomQualifiedFileName(libdir, g.fileName);
				files.add(new  File(fileName));
			}
		}

        if (files.isEmpty()) {
            return null;
        }
        return files;
    }

    /**
     * Return a list of File objects that name files ANTLR will read
     * to process T.g; This can only be .tokens files and only
     * if they use the tokenVocab option.
     *
     * @return List of dependencies other than imported grammars
     */
    public  getNonImportDependenciesFileList():  Array<File> {
        let  files = new  Array<File>();

        // handle token vocabulary loads
        let  tokenVocab = this.g.getOptionString("tokenVocab");
        if (tokenVocab !== null) {
			let  fileName =
				tokenVocab + CodeGenerator.VOCAB_FILE_EXTENSION;
			let  vocabFile: File;
			if ( this.tool.libDirectory.equals(".") ) {
				vocabFile = new  File(fileName);
			}
			else {
				vocabFile = new  File(this.tool.libDirectory, fileName);
			}
			files.add(vocabFile);
		}

        return files;
    }

    public  getDependencies():  ST {
        this.loadDependencyTemplates();
        let  dependenciesST = this.templates.getInstanceOf("dependencies");
        dependenciesST.add("in", this.getDependenciesFileList());
        dependenciesST.add("out", this.getGeneratedFileList());
        dependenciesST.add("grammarFileName", this.g.fileName);
        return dependenciesST;
    }

    public  loadDependencyTemplates():  void {
        if (this.templates !== null) {
 return;
}

        let  fileName = "org/antlr/v4/tool/templates/depend.stg";
        this.templates = new  STGroupFile(fileName, "UTF-8");
    }

    public  getGenerator():  CodeGenerator {
        return this.generator;
    }

    public  groomQualifiedFileName(outputDir: string, fileName: string):  string {
        if (outputDir.equals(".")) {
            return fileName;
        }
		else {
 if (outputDir.indexOf(' ') >= 0) { // has spaces?
            let  escSpaces = outputDir.replace(" ", "\\ ");
            return escSpaces + File.separator + fileName;
        }
		else {
            return outputDir + File.separator + fileName;
        }
}

    }
}
