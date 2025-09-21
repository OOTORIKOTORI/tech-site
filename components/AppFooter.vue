<template>
  <footer aria-label="Site footer" class="border-t">
    <div class="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>© KOTORI Lab</span>
        <span class="text-gray-400">|</span>
        <nav class="flex items-center gap-3" aria-label="Legal links">
          <NuxtLink to="/privacy" class="hover:underline">Privacy</NuxtLink>
          <span class="text-gray-400">/</span>
          <NuxtLink to="/terms" class="hover:underline">Terms</NuxtLink>
          <span class="text-gray-400">/</span>
          <NuxtLink to="/ads" class="hover:underline">Ads</NuxtLink>
        </nav>
        <span v-if="appVersion" class="ml-auto text-gray-400" aria-label="App version">v{{ appVersion }}</span>
      </div>
    </div>
  </footer>

</template>

<script setup lang="ts">
import { useRuntimeConfig } from '#imports'

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
</script>
