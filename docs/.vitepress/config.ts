/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import fs from "fs";

import { type LanguageRegistration, type ThemeRegistrationAny } from "shiki";

import { defineConfig } from "vitepress";

import typedocSidebar from "../api/typedoc-sidebar.json";

const antlrGrammar = JSON.parse(fs.readFileSync("docs/.vitepress/antlr/antlr.json", "utf8")) as LanguageRegistration;
const darkTheme = JSON.parse(
    fs.readFileSync("docs/.vitepress/antlr/complete_dark.json", "utf8")) as ThemeRegistrationAny;

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "antlr-ng Parser Generator",
    description: "The homepage of the antlr-ng project",
    head: [
        ["link", { rel: "icon", type: "image/svg+xml", href: "/web-logo.svg" }]
    ],
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        "logo": "/images/antlr-ng-logo3.svg",
        nav: [
            { text: "Home", link: "/" },
            { text: "Documentation", link: "/introduction" },
            { text: "Library API", link: "/api/" }
        ],

        search: {
            provider: "local"
        },
        sidebar: [
            {
                text: "Documentation",
                items: [
                    { text: "Introduction", link: "/introduction" },
                    { text: "Getting Started", link: "/getting-started" },
                    { text: "Other Useful Tools", link: "/repl" },
                    {
                        text: "Grammar Basics",
                        link: "/grammars",
                        items: [
                            { text: "Grammar Syntax", link: "/grammar-syntax" },
                            { text: "Options", link: "/options" },
                            { text: "Parser Rules", link: "/parser-rules" },
                            { text: "Lexer Rules", link: "/lexer-rules" },
                            { text: "Wildcard", link: "/wildcard" },
                            { text: "Unicode", link: "/unicode" },
                        ]
                    },
                    { text: "Actions", link: "/actions" },
                    { text: "Interpreters", link: "/interpreters" },
                    { text: "Left Recursion", link: "/left-recursion" },
                    { text: "Listeners and Visitors", link: "/listeners" },
                    { text: "Parsing Binary Content", link: "/parsing-binary-files" },
                    { text: "Predicates", link: "/predicates" },
                    { text: "Tree Matching", link: "/tree-matching" },
                    { text: "Customizing Code Generation", link: "/customizing-code-generation" },
                    { text: "Building", link: "/building-antlr-ng" },
                    { text: "Testing", link: "/testing-antlr-ng" },
                ]
            },
            {
                text: "Library API",
                items: typedocSidebar
            }
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/antlr-ng/antlr-ng" }
        ]
    },
    markdown: {
        theme: darkTheme,
        shikiSetup: async (shiki) => {
            await shiki.loadLanguage(antlrGrammar);
        }
    }
});
