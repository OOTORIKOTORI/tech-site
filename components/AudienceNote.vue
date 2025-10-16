<script setup lang="ts">
const props = defineProps<{ who: string; note?: string }>()
</script>

<template>
  <section class="rounded border bg-gray-50 text-gray-700 text-sm px-3 py-2 mt-2" aria-label="対象読者">
    <span class="font-semibold">対象:</span>
    <span class="ml-1">{{ props.who }}</span>
    <span v-if="props.note" class="ml-1 opacity-80">（{{ props.note }}）</span>
  </section>
</template>
