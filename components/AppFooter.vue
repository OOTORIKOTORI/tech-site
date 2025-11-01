<template>
  <footer aria-label="Footer" class="border-t">
    <div class="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>© {{ display }}</span>
        <span class="text-gray-400">|</span>
        <nav class="flex items-center gap-3" aria-label="Legal">
          <NuxtLink to="/blog/archive" class="hover:underline focus-ring">Archive</NuxtLink>
          <span class="text-gray-400">/</span>
          <NuxtLink to="/privacy" class="hover:underline focus-ring">プライバシー</NuxtLink>
          <span class="text-gray-400">/</span>
          <NuxtLink to="/terms" class="hover:underline focus-ring">利用規約</NuxtLink>
          <span class="text-gray-400">/</span>
          <NuxtLink to="/ads" class="hover:underline focus-ring">広告</NuxtLink>
          <span class="text-gray-400">/</span>
          <a href="/feed.xml" class="hover:underline focus-ring">RSS</a>
        </nav>
        <span v-if="appVersion" class="ml-auto text-gray-400" aria-label="App version">v{{ appVersion }}</span>
      </div>
      <p class="mt-2 text-xs text-gray-400">
        本サイトは a11y≥90 / Best Practices≥0.70 の品質基準を維持して運用しています。
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from '#imports'
import { useSiteBrand } from '@/composables/useSiteBrand'

const appVersion = (() => {
  try {
    const fn: any = (globalThis as any).useRuntimeConfig || (useRuntimeConfig as any)
    if (typeof fn === 'function') {
      const { public: pub } = fn()
      return (pub as any)?.appVersion as string | undefined
    }
  } catch {
    /* no-op */
  }
  return undefined
})()

const { display } = useSiteBrand()
</script>
