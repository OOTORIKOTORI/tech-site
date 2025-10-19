<template>
  <button
    class="inline-flex items-center gap-2 rounded-lg px-3 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    type="button" :aria-pressed="mode === 'dark'" aria-label="テーマ切り替え" @click="toggle">
    <span v-if="mode === 'dark'">🌙</span>
    <span v-else>☀️</span>
    <span class="text-sm">{{ modeLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, useColorMode } from '#imports'
const colorMode = useColorMode()

const mode = computed(() => colorMode.value) // 'light' | 'dark' | 'system'
const modeLabel = computed(() => (mode.value === 'dark' ? 'Dark' : mode.value === 'light' ? 'Light' : 'System'))
function toggle() {
  colorMode.preference = mode.value === 'light' ? 'dark' : mode.value === 'dark' ? 'system' : 'light'
}
</script>
