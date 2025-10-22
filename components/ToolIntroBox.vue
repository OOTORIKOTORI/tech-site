<script setup lang="ts">
defineProps<{
  audience?: string
  value?: string
  how?: string
  safety?: string
}>()
</script>

<template>
  <div class="surface p-4 mb-4 space-y-2">
    <div v-if="audience" class="text-xs muted">対象: {{ audience }}</div>
    <div v-if="value" class="font-semibold">{{ value }}</div>
    <div v-if="how" class="text-sm">{{ how }}</div>
    <div v-if="safety" class="text-xs text-amber-700 font-medium mt-2" v-html="safety" />
    <!-- default slot for optional custom content (e.g., links to guides) -->
    <div v-if="$slots.default">
      <slot />
    </div>
  </div>
</template>
