<template>
  <component :is="link ? 'NuxtLink' : 'abbr'" :to="linkHref" :title="title"
    class="underline decoration-dotted cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-sm">
    {{ labelToShow }}
  </component>
</template>

<script setup lang="ts">
import { useAppConfig } from '#imports'
import { computed, inject } from 'vue'

const props = defineProps<{ k: string; label?: string; link?: boolean }>()

const app = useAppConfig()

// local glossary provided from page (frontmatter)
const local = inject<Record<string, string> | undefined>('localGlossary', {})

const title = computed(() => {
  const key = props.k
  // resolution order: local -> app config global -> undefined
  if (local && key in (local as Record<string, string>)) return (local as Record<string, string>)[key]
  const g: Record<string, string> | undefined = (app as any).glossary
  if (g && key in g) return g[key]
  return undefined
})

const labelToShow = computed(() => props.label || props.k)

const link = computed(() => !!props.link)
const linkHref = computed(() => (link.value ? `/terms#${encodeURIComponent(props.k)}` : undefined))
</script>

<style scoped>
abbr[title],
a[title] {
  text-decoration-skip-ink: none;
  -webkit-text-decoration-skip-ink: none;
}
</style>
