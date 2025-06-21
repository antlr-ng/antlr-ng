/*
 * Copyright (c) Mike Lischke. All rights reserved.
 * Licensed under the BSD 3-clause License. See License.txt in the project root for license information.
 */

import { defineConfig } from "vitepress";

import typedocSidebar from "../api/typedoc-sidebar.json";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "antlr-ng Parser Generator",
    description: "The homepage of the antlr-ng project",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Examples", link: "/markdown-examples" },
            { text: "API", link: "/api/" }
        ],

        sidebar: [
            {
                text: "Examples",
                items: [
                    { text: "Markdown Examples", link: "/markdown-examples" },
                    { text: "Runtime API Examples", link: "/api-examples" }
                ]
            },
            {
                text: "API",
                items: typedocSidebar
            }
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/vuejs/vitepress" }
        ]
    }
});
