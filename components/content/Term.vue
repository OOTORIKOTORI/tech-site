<template>
  <abbr :title="title"
    class="underline decoration-dotted cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-sm">
    {{ labelToShow }}
  </abbr>
</template>

<script setup lang="ts">
import { useAppConfig } from '#imports'
import { computed } from 'vue'

const props = defineProps<{ k: string; label?: string }>()

const app = useAppConfig()

const title = computed(() => {
  // safe access: app.glossary may be undefined
  const g: Record<string, string> | undefined = (app as any).glossary
  return g && props.k in g ? g[props.k] : undefined
})

const labelToShow = computed(() => props.label || props.k)
</script>

<style scoped>
abbr[title] {
  text-decoration-skip-ink: none;
  -webkit-text-decoration-skip-ink: none;
}
</style>
