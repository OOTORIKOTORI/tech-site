<template>
  <sup :id="`ref-${id}`" class="align-top text-[0.75em]">
    <a :href="`#fn-${id}`" class="underline underline-offset-2 hover:opacity-80">[{{ label || id }}]</a>
  </sup>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{ id: string | number; label?: string }>()
</script>

<style scoped>
sup a {
  text-decoration-thickness: 1px;
}
</style>
