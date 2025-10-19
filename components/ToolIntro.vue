<template>
  <section class="mb-6">
    <div class="surface p-4">
      <h1 class="text-2xl font-bold">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-muted-foreground">{{ description }}</p>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <div v-if="usage" class="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
          <div class="text-sm font-semibold">使い方</div>
          <p class="text-sm whitespace-pre-line">{{ usage }}</p>
        </div>
        <div v-if="time || audience" class="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
          <div class="text-sm font-semibold">目安</div>
          <p class="text-sm">
            <span v-if="time">所要: {{ time }}</span>
            <span v-if="time && audience"> / </span>
            <span v-if="audience">対象: {{ audience }}</span>
          </p>
        </div>
      </div>
      <details v-if="exampleInput || exampleOutput" class="mt-3">
        <summary class="cursor-pointer text-sm underline">入出力例</summary>
        <div class="mt-2 grid gap-3 sm:grid-cols-2">
          <pre v-if="exampleInput"
            class="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs overflow-x-auto"><code>{{ exampleInput }}</code></pre>
          <pre v-if="exampleOutput"
            class="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs overflow-x-auto"><code>{{ exampleOutput }}</code></pre>
        </div>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  usage?: string
  time?: string
  audience?: string
  exampleInput?: string
  exampleOutput?: string
}>()
</script>
