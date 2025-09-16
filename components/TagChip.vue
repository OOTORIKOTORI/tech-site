<template>
  <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1 mb-1">{{ tag }}</span>
</template>
<script setup lang="ts">
const props = defineProps<{ tag: string }>()
</script>
