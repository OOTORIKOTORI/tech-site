<template>
  <main class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="page-title text-3xl font-semibold mb-6">Blog</h1>
    <p class="mb-4">
      <NuxtLink to="/blog/" class="sr-only">Blog</NuxtLink>
    </p>

    <div v-if="error" class="text-red-600">Failed to load posts: {{ error.statusMessage || error.message }}</div>

    <template v-else>
      <p v-if="items.length === 0" class="text-gray-500">No posts yet</p>

      <ul v-else role="list" data-testid="blog-list" class="space-y-6">
        <li v-for="p in items" :key="p.id || p.path" role="listitem">
          <NuxtLink class="text-xl font-medium underline" :to="p.path">{{ p.title || p.path }}</NuxtLink>
          <p v-if="p.description" class="text-gray-600">{{ p.description }}</p>
          <p class="text-gray-400 text-sm">{{ formatDateIso(p.date || p.updated) }}</p>
        </li>
      </ul>
    </template>
  </main>
</template>
<script setup lang="ts">
import { useFetch } from '#imports'
import { formatDateIso } from '@/utils/date'
import { isVisiblePost } from '@/utils/isVisiblePost'
type BlogV2Item = {
  _id?: string
  _path?: string
  id?: string
  path?: string
  title?: string
  description?: string
  date?: string
  updated?: string
  tags?: string[]
  draft?: boolean | string
  published?: boolean | string
}
type BlogV2ListLegacy = { count?: number; items?: BlogV2Item[]; debug?: Record<string, unknown> }
type BlogV2ListNew = { source?: string; blog?: BlogV2Item[]; docs?: any[]; errors?: any[] }
const { data, error } = await useFetch<BlogV2ListLegacy & BlogV2ListNew>('/api/blogv2/list', { server: true })

const raw: BlogV2Item[] = ((data as any)?.value?.items ?? (data as any)?.value?.blog ?? []) as any
let items: BlogV2Item[] = (Array.isArray(raw) ? raw : [])
// 除外: _pathが/_dirで終わるもの、/_始まりの内部用
items = items.filter(i => {
  const p = i.path || i._path || ''
  if (p.endsWith('/_dir')) return false
  if (/\/_/.test(p.split('/').pop() || '')) return false
  return isVisiblePost(i)
})
// path/_pathの二重表示をpathに統一
const seen = new Set<string>()
items = items
  .map(i => ({ ...i, path: i.path || i._path, id: i.id || i._id }))
  .filter(i => {
    if (!i.path || seen.has(i.path)) return false
    seen.add(i.path)
    return true
  })
  .sort(
    (a, b) =>
      new Date((b?.date as any) ?? (b?.updated as any) ?? 0).getTime() -
      new Date((a?.date as any) ?? (a?.updated as any) ?? 0).getTime()
  )

if (import.meta.dev) {
  // dev時のみ件数debug
  console.debug('blog/index count', items.length)
}
</script>
