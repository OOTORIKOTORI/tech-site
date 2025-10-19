<template>
  <nav v-if="series && ordered?.length" aria-label="シリーズナビ" class="mt-10 border-t pt-6">
    <h2 class="text-sm font-semibold mb-3">同シリーズ</h2>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <NuxtLink v-if="prev" :to="(prev as any)._path" class="underline hover:no-underline">
        &laquo; {{ label(prev) }}
      </NuxtLink>
      <NuxtLink v-if="seriesIndexPath" :to="seriesIndexPath" class="text-sm opacity-80 underline hover:no-underline">
        シリーズ目次
      </NuxtLink>
      <NuxtLink v-if="next" :to="(next as any)._path" class="underline hover:no-underline">
        {{ label(next) }} &raquo;
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, useAsyncData } from '#imports'

const props = defineProps<{ doc: any }>()
const series = computed(() => props.doc?.series || null)

const { data } = await useAsyncData(
  () => (async () => {
    if (!series.value) return []
    // 型: import 部分だけ any に落とし、関数自体は既存のグローバル型に合わせる
    const qc = (await import('#content') as any).queryContent as any
    return qc('/blog')
      .where({ series: series.value })
      .only(['_path', 'title', 'part', 'publishedAt'])
      .find()
  })()
)
const ordered = computed(() => {
  const arr = (data.value || []).slice()
  // part があれば part 優先、なければ日付
  arr.sort((a: any, b: any) => (a.part ?? 999) - (b.part ?? 999) || (a.publishedAt || '').localeCompare(b.publishedAt || ''))
  return arr
})
const idx = computed(() => ordered.value.findIndex((x: any) => x._path === props.doc?._path))
const prev = computed(() => idx.value > 0 ? ordered.value[idx.value - 1] : null)
const next = computed(() => idx.value >= 0 && idx.value < ordered.value.length - 1 ? ordered.value[idx.value + 1] : null)
const seriesIndexPath = computed(() => series.value ? `/blog/series/${encodeURIComponent(series.value)}` : null)
const label = (x: any) => typeof x.part === 'number' ? `#${x.part} ${x.title}` : x.title
</script>
