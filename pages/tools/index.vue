<script setup lang="ts">
import { useHead } from '#imports'
import type { ToolCategory } from '~/types/blog'
import { TOOL_CATEGORIES, getToolsByCategory } from '~/utils/tool-metadata'

const toolsByCategory = getToolsByCategory()
const categoryKeys = Object.keys(TOOL_CATEGORIES) as ToolCategory[]

useHead({
  title: 'Tools | Migaki Explorer',
  meta: [
    {
      name: 'description',
      content:
        'ブラウザだけで使える便利ツール集。時間、認証、Web/SEO、DevOps、形式変換、AI/LLMの各カテゴリから選べます。',
    },
  ],
})
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-semibold text-foreground mb-2">Tools</h1>
      <p class="text-muted">
        ブラウザだけで使える便利ツール集。カテゴリ別に整理されています。
      </p>
    </div>

    <!-- Category Sections -->
    <div v-for="categoryKey in categoryKeys" :key="categoryKey" class="mb-12">
      <div :id="categoryKey" class="scroll-mt-20">
        <h2 class="text-2xl font-semibold text-foreground mb-2">
          {{ TOOL_CATEGORIES[categoryKey].name }}
        </h2>
        <p class="text-sm text-muted mb-4">
          {{ TOOL_CATEGORIES[categoryKey].description }}
        </p>

        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4" :aria-label="`${TOOL_CATEGORIES[categoryKey].name}のツール一覧`">
          <li v-for="tool in toolsByCategory[categoryKey]" :key="tool.id" class="surface p-4">
            <NuxtLink :to="tool.path" class="group block focus-ring">
              <div v-if="tool.isNew" class="text-sm text-gray-500 dark:text-gray-400">
                新規
              </div>
              <h3 class="text-lg font-medium text-blue-600 group-hover:underline">
                {{ tool.title }}
              </h3>
            </NuxtLink>
            <p class="text-sm muted mt-1" v-html="tool.description"></p>
            <div v-if="tool.audience || tool.timeEstimate || tool.inputOutput" class="flex gap-4 text-xs muted mt-2">
              <span v-if="tool.audience" :aria-label="`対象読者: ${tool.audience}`">{{
                tool.audience
                }}</span>
              <span v-else aria-label="対象読者">—</span>
              <span v-if="tool.timeEstimate" :aria-label="`所要時間: ${tool.timeEstimate}`">{{
                tool.timeEstimate
                }}</span>
              <span v-else aria-label="所要時間">—</span>
              <span v-if="tool.inputOutput" :aria-label="`入出力例: ${tool.inputOutput}`">{{ tool.inputOutput }}</span>
              <span v-else aria-label="入出力例">—</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
