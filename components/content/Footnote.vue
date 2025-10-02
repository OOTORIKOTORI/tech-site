<template>
  <li :id="`fn-${id}`">
    <span v-if="href">
      <a :href="href" target="_blank" rel="noopener noreferrer" class="underline">{{ label || href }}</a>
      <span class="text-[0.95em]"> </span>
    </span>
    <span v-else-if="label">
      <span class="font-medium">{{ label }}</span>
      <span class="text-[0.95em]"> </span>
    </span>
    <span>
      <slot />
    </span>
    <a :href="`#ref-${id}`" class="ml-2 text-[0.9em]">↩</a>
  </li>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{ id: string | number; href?: string; label?: string }>()
</script>

<style scoped>
li a {
  text-decoration-thickness: 1px;
}
</style>
