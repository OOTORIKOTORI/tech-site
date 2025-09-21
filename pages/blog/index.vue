<template>
  <main class="container" style="max-width: 48rem; margin: 0 auto; padding: 2rem 1rem;">
    <header>
      <h1 style="font-size: 1.5rem; font-weight: 700;">Blog</h1>
      <p style="color:#555; font-size: .9rem;">開発ノウハウやツール設計の考察メモ。</p>
    </header>
    <section aria-live="polite" style="margin-top: 1.5rem;">
      <template v-if="posts && posts.length">
        <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem;">
          <li v-for="p in posts" :key="p._path"
            style="border:1px solid #e5e7eb; border-radius:.5rem; padding:1rem; background:#fff;">
            <article>
              <h2 style="margin:0; font-size: 1.125rem;">
                <NuxtLink :to="p._path" style="text-decoration: none; color: inherit;">{{ p.title }}</NuxtLink>
              </h2>
              <p style="margin:.25rem 0 0; color:#6b7280; font-size:.75rem;"
                :aria-label="'Published on ' + formatDate(p.date)">
{{ formatDate(p.date) }}
</p>
              <p v-if="p.description" style="margin:.5rem 0 0; color:#374151; font-size:.9rem;">{{ p.description }}</p>
            </article>
          </li>
        </ul>
      </template>
      <p v-else role="status" style="color:#555;">No posts yet</p>
    </section>
  </main>
</template>
<script setup lang="ts">
import { useAsyncData, useSeoMeta, useHead } from '#imports'

interface BlogListItem {
  _path: string
  title?: string
  description?: string
  date?: string
}

interface QueryChain<T> {
  where(cond: Record<string, unknown>): QueryChain<T>
  sort(sorter: Record<string, 1 | -1>): QueryChain<T>
  only(keys: string[]): QueryChain<T>
  find(): Promise<T[]>
}

type QueryContentFn = (path?: string) => QueryChain<BlogListItem>

const qc = (globalThis as unknown as { queryContent?: QueryContentFn }).queryContent

const { data } = await useAsyncData('blog-list', async () => {
  if (!qc) return [] as BlogListItem[]
  const list = await qc('/blog')
    .sort({ date: -1 })
    .only(['_path', 'title', 'description', 'date'])
    .find()
  return Array.isArray(list) ? list : ([] as BlogListItem[])
})

const posts = data.value ?? ([] as BlogListItem[])

function pad(n: number): string { return n < 10 ? '0' + n : String(n) }
function formatDate(d?: string): string {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

useHead({
  link: [{ rel: 'canonical', href: 'https://kotorilab.jp/blog' }],
})
useSeoMeta({
  title: 'Blog | Kotorilab',
  ogTitle: 'Blog | Kotorilab',
  ogUrl: 'https://kotorilab.jp/blog',
})
</script>
