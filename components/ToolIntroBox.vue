<script setup lang="ts">
defineProps<{
  audience?: string
  value?: string
  how?: string
  safety?: string
}>()
</script>

<template>
  <div class="rounded-lg bg-gray-50 p-4 mb-4 border border-gray-200 space-y-2">
    <div v-if="audience" class="text-xs text-gray-500">対象: {{ audience }}</div>
    <div v-if="value" class="font-semibold">{{ value }}</div>
    <div v-if="how" class="text-sm text-gray-700">{{ how }}</div>
    <div v-if="safety" class="text-xs text-amber-700 font-medium mt-2" v-html="safety" />
  </div>
</template>
