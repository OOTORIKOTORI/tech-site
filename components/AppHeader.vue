<template>
  <!-- Skip link should be the very first focusable element -->
  <a href="#main"
    class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white dark:focus:bg-zinc-900 focus:text-blue-700 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 rounded">
    本文へスキップ
  </a>

  <header class="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <nav aria-label="Primary" class="mx-auto max-w-6xl px-4">
      <ul class="flex items-center gap-6 py-3 text-gray-700 dark:text-zinc-300">
        <li>
          <NuxtLink to="/" :aria-current="isHome ? 'page' : undefined" class="text-blue-600 hover:underline focus-ring">
            Home
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/tools" :aria-current="isTools ? 'page' : undefined"
            class="text-blue-600 hover:underline focus-ring">
            Tools
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/blog" :aria-current="isBlog ? 'page' : undefined"
            class="text-blue-600 hover:underline focus-ring">
            Blog
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

const route = useRoute()
const isHome = computed(() => route.path === '/')
const isTools = computed(() => route.path === '/tools' || route.path.startsWith('/tools/'))
const isBlog = computed(() => route.path === '/blog' || route.path.startsWith('/blog/'))
</script>
