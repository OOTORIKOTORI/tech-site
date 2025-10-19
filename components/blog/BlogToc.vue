<template>
  <nav v-if="links?.length" aria-label="目次" class="surface p-4 mb-6">
    <h2 class="text-sm font-semibold mb-2">目次</h2>
    <ul class="space-y-1">
      <li v-for="l in links" :key="l.id" :class="l.depth > 2 ? 'ml-4' : ''">
        <NuxtLink :to="'#' + l.id" class="hover:underline">{{ l.text }}</NuxtLink>
        <ul v-if="l.children?.length" class="ml-4 mt-1 space-y-1">
          <li v-for="c in l.children" :key="c.id">
            <NuxtLink :to="'#' + c.id" class="hover:underline">{{ c.text }}</NuxtLink>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from '#imports'

const props = defineProps<{ toc?: any }>()
const links = computed(() => props.toc?.links || props.toc || [])
</script>
