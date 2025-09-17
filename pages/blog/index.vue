<template>
  <div class="container mx-auto max-w-4xl py-10 px-4 space-y-8">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold">Blog</h1>
      <p class="text-gray-600 text-sm">開発ノウハウやツール設計の考察メモ。</p>
    </header>
    <ContentList path="/blog" v-slot="{ list }">
      <div class="grid gap-6">
        <article v-for="doc in list" :key="doc._path" class="rounded border p-4 bg-white shadow-sm hover:shadow transition">
          <NuxtLink :to="doc._path" class="block group">
            <h2 class="font-semibold text-lg group-hover:text-blue-600">{{ doc.title }}</h2>
            <p class="text-[11px] text-gray-500 mt-0.5">{{ formatDate(doc.date) }}</p>
            <p class="text-sm text-gray-700 mt-2 line-clamp-3">{{ doc.description }}</p>
            <span class="inline-block mt-3 text-xs text-blue-600 group-hover:underline">続きを読む →</span>
          </NuxtLink>
        </article>
      </div>
    </ContentList>
  </div>
</template>
<script setup lang="ts">
function pad(n: number) { return n < 10 ? '0' + n : '' + n }
function formatDate(d?: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
</script>
