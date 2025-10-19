<template>
  <abbr :title="explain" class="underline decoration-dotted cursor-help">
    <slot />
  </abbr>
</template>

<script setup lang="ts">
defineProps<{ explain: string }>()
</script>
