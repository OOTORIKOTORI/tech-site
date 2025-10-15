<script setup lang="ts">
const props = defineProps<{
  audience: string
  value: string
  how: string
  safety?: string
}>()
</script>

<template>
  <aside class="mb-6 rounded-2xl border border-gray-200 p-4 bg-white">
    <ul class="list-disc pl-5 space-y-1 text-[15px]">
      <li><strong>これは誰向け？</strong> {{ props.audience }}</li>
      <li><strong>これでできること</strong> {{ props.value }}</li>
      <li><strong>使い方（30秒）</strong> {{ props.how }}</li>
      <li v-if="props.safety"><strong>安全性</strong> {{ props.safety }}</li>
    </ul>
  </aside>
</template>
