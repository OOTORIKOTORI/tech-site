<template>
  <main id="main" class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="page-title text-3xl font-semibold mb-6">Archive</h1>
    <p class="mb-4 text-sm text-gray-600">Primers 以外の投稿一覧</p>

    <div v-if="error" class="text-red-600">Failed to load posts: {{ error.statusMessage || error.message }}</div>

    <template v-else>
      <p v-if="items.length === 0" class="text-gray-500">No posts</p>

      <ul v-else role="list" data-testid="archive-list" class="space-y-6">
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
import { useFetch, useHead } from '#imports'
import { formatDateIso } from '@/utils/date'

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
  type?: string
  tool?: string
  visibility?: string
  robots?: string
}

type BlogV2ListLegacy = { count?: number; items?: BlogV2Item[]; debug?: Record<string, unknown> }

type BlogV2ListNew = { source?: string; blog?: BlogV2Item[]; docs?: any[]; errors?: any[] }

useHead({
  title: 'Archive',
  meta: [{ name: 'robots', content: 'noindex,follow' }],
})

const { data, error } = await useFetch<BlogV2ListLegacy & BlogV2ListNew>('/api/blogv2/list', { server: true })

const raw: BlogV2Item[] = ((data as any)?.value?.items ?? (data as any)?.value?.blog ?? []) as any
let items: BlogV2Item[] = (Array.isArray(raw) ? raw : [])

if (items.length === 0) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qc: any = (globalThis as any).queryContent
    if (typeof qc === 'function') {
      const list = (await qc('/blog')?.find?.()) || []
      items = Array.isArray(list)
        ? list.map((i: any) => ({
          id: i?._id || i?.id,
          path: i?._path || i?.path,
          title: i?.title,
          description: i?.description,
          date: i?.date,
          updated: i?.updated,
          tags: i?.tags,
          type: i?.type,
          tool: i?.tool,
          visibility: i?.visibility,
          robots: i?.robots,
        }))
        : []
    }
  } catch {
    /* ignore */
  }
}

const seen = new Set<string>()
items = items
  .map(i => ({ ...i, path: i.path || i._path, id: i.id || i._id }))
  .filter(i => {
    if (!i.path || seen.has(i.path)) return false
    seen.add(i.path)
    return true
  })
  // Archive のみ表示（visibility === 'archive'）
  .filter(i => {
    const v = (i.visibility || '').toLowerCase()
    return v === 'archive'
  })
  .sort(
    (a, b) =>
      new Date((b?.date as any) ?? (b?.updated as any) ?? 0).getTime() -
      new Date((a?.date as any) ?? (a?.updated as any) ?? 0).getTime()
  )
</script>
