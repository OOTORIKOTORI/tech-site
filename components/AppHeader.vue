<template>
  <!-- Skip link should be the very first focusable element -->
  <a
    href="#main"
    class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white dark:focus:bg-zinc-900 focus:text-blue-700 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 rounded"
  >
    本文へスキップ
  </a>

  <header class="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <nav aria-label="Primary" class="mx-auto max-w-6xl px-4">
      <ul class="flex items-center gap-6 py-3 text-gray-700 dark:text-zinc-300">
        <li>
          <NuxtLink
            to="/"
            :aria-current="isHome ? 'page' : undefined"
            class="text-blue-600 hover:underline focus-ring"
          >
            Home
          </NuxtLink>
        </li>
        <li class="relative group">
          <NuxtLink
            to="/tools"
            :aria-current="isTools ? 'page' : undefined"
            class="text-blue-600 hover:underline focus-ring inline-flex items-center gap-1"
          >
            Tools
            <span class="text-xs">▼</span>
          </NuxtLink>
          <!-- Dropdown menu -->
          <ul
            class="absolute left-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
          >
            <li v-for="cat in toolCategories" :key="cat.id">
              <a
                :href="`/tools#${cat.id}`"
                class="block px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 focus-ring"
              >
                {{ cat.name }}
              </a>
            </li>
          </ul>
        </li>
        <li>
          <NuxtLink
            to="/blog"
            :aria-current="isPrimers ? 'page' : undefined"
            class="text-blue-600 hover:underline focus-ring"
          >
            Primers
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/blog/archive"
            :aria-current="isArchive ? 'page' : undefined"
            class="text-sm text-gray-500 hover:underline focus-ring"
          >
            Archive
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/contact" class="text-blue-600 hover:underline focus-ring">
            Contact
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about" class="text-blue-600 hover:underline focus-ring">
            About
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, useRoute } from '#imports'
import type { ToolCategory } from '~/types/blog'
import { TOOL_CATEGORIES } from '~/utils/tool-metadata'

const route = useRoute()
const isHome = computed(() => route.path === '/')
const isTools = computed(() => route.path === '/tools' || route.path.startsWith('/tools/'))
const isPrimers = computed(() => route.path === '/blog')
const isArchive = computed(() => route.path === '/blog/archive')

const toolCategories = (Object.keys(TOOL_CATEGORIES) as ToolCategory[]).map(
  (key) => TOOL_CATEGORIES[key]
)
</script>
