<template>
  <main class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-3xl font-semibold mb-6">Blog</h1>

    <div v-if="error" class="text-red-600">Failed to load posts: {{ error.statusMessage || error.message }}</div>

    <template v-else>
      <p v-if="items.length === 0" class="text-gray-500">No posts yet</p>

      <ul v-else role="list" class="space-y-6">
        <li v-for="p in items" :key="p._id || p._path" role="listitem">
          <NuxtLink class="text-xl font-medium underline" :to="p._path">{{ p.title || p._path }}</NuxtLink>
          <p v-if="p.description" class="text-gray-600">{{ p.description }}</p>
          <p class="text-gray-400 text-sm">{{ formatDateIso(p.date || p.updated) }}</p>
        </li>
      </ul>

      <!-- デバッグは“常時表示” -->
      <section class="mt-10 text-sm text-gray-600 space-y-2">
        <div><b>fallback:</b> {{ data?.debug?.fallback }}</div>
        <div>
          <b>allCount:</b> {{ data?.debug?.allCount }} / <b>blogOnlyCount:</b> {{
            data?.debug?.blogOnlyCount }}
        </div>
        <div><b>samplePaths:</b> <code>{{ data?.debug?.samplePaths }}</code></div>
        <div>
          <a class="underline" href="/__nuxt_content/blog/sql_dump.txt"
            target="_blank">/__nuxt_content/blog/sql_dump.txt</a>
          &nbsp;/&nbsp;
          <a class="underline" href="/__nuxt_content/docs/sql_dump.txt"
            target="_blank">/__nuxt_content/docs/sql_dump.txt</a>
        </div>
      </section>
    </template>
  </main>
</template>
<script setup lang="ts">
import { useFetch } from '#imports'
import { formatDateIso } from '@/utils/date'
type BlogV2Item = {
  _id?: string
  _path?: string
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

const truthy = (v: any) => v === true || v === 'true'
const falsy = (v: any) => v === false || v === 'false'
const visible = (it: any) => !truthy(it?.draft) && !falsy(it?.published)

const raw: BlogV2Item[] = ((data as any)?.value?.items ?? (data as any)?.value?.blog ?? []) as any
const items: BlogV2Item[] = (Array.isArray(raw) ? raw : [])
  .filter(visible)
  .sort(
    (a, b) =>
      new Date((b?.date as any) ?? (b?.updated as any) ?? 0).getTime() -
      new Date((a?.date as any) ?? (a?.updated as any) ?? 0).getTime()
  )
</script>
