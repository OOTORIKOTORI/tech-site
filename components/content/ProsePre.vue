<template>
  <div class="relative group">
    <button type="button"
      class="absolute right-2 top-2 z-10 rounded-md bg-white/80 dark:bg-zinc-800/80 px-2 py-1 text-xs text-gray-700 dark:text-zinc-200 shadow hover:bg-white dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
      :aria-label="copied ? 'Copied' : 'Copy code'" @click="copyCode">
      {{ copied ? 'Copied' : 'Copy' }}
    </button>
    <pre class="!pr-12">
      <slot />
    </pre>
    <transition name="fade">
      <div v-if="toast" class="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
        {{ toast }}
      </div>
    </transition>
  </div>
</template>
<script setup lang="ts">
import { ref, getCurrentInstance } from 'vue'
const copied = ref(false)
const toast = ref<string | null>(null)

async function copyCode() {
  try {
    const root = (getCurrentInstance()?.proxy?.$el as HTMLElement | null) || null
    const code = root?.querySelector('code')?.textContent || ''
    await navigator.clipboard.writeText(code)
    copied.value = true
    toast.value = 'Copied!'
  } catch (_) {
    copied.value = false
    toast.value = 'Copy failed'
  } finally {
    setTimeout(() => (toast.value = null), 1200)
    setTimeout(() => (copied.value = false), 1500)
  }
}
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
