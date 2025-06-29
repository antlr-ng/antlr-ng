<script setup lang="ts">
import "../diagram-light.css";
import "../diagram-dark.css";

import { onMounted, ref } from 'vue';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, });
const content = ref('');
const loading = ref(false);

const defaultDiagram = '/diagrams/parser-rule-diagram.md';

async function loadMarkdown(file: string) {
    loading.value = true;
    const res = await fetch(file);
    const text = await res.text();
    content.value = md.render(text);
    loading.value = false;
}

onMounted(() => {
    loadMarkdown(defaultDiagram);
});

</script>

<template>
    <div>
        <button @click="loadMarkdown('/diagrams/parser-rule-diagram.md')">Parser Rules</button>
        <button @click="loadMarkdown('/diagrams/lexer-symbol-diagram.md')">Lexer Symbols</button>
        <div v-if="loading">Lade Diagramm...</div>
        <div v-else v-html="content"></div>
    </div>
</template>
