<template>
  <main class="container" style="max-width: 56rem; margin: 0 auto; padding: 2.5rem 1rem;">
    <section aria-labelledby="hero-title" style="text-align: left;">
      <h1 id="hero-title" style="font-size: 2rem; font-weight: 800; margin: 0;">{{ display }}</h1>
      <p style="margin:.5rem 0 1.25rem 0; color:#4b5563; font-size:1rem;">{{ tagline }}</p>
      <div style="display:flex; gap:.75rem; flex-wrap: wrap;">
        <NuxtLink to="/tools/cron-jst" aria-label="Open Cron Tool" class="btn-primary">Open Cron Tool</NuxtLink>
        <NuxtLink to="/blog" aria-label="Open Blog" class="btn-secondary">Open Blog</NuxtLink>
      </div>
    </section>

    <section v-if="posts.length" aria-labelledby="latest-title" style="margin-top: 2rem;">
      <h2 id="latest-title" style="font-size:1.25rem; font-weight:700; margin:0 0 .75rem 0;">Latest posts</h2>
      <ul style="list-style:none; padding:0; margin:0; display:grid; gap:.75rem;">
        <li v-for="p in posts" :key="p._path"
          style="border:1px solid #e5e7eb; border-radius:.5rem; padding:1rem; background:#fff;">
          <article>
            <h3 style="margin:0; font-size:1.05rem;">
              <NuxtLink :to="p._path" style="text-decoration:none; color:inherit;">{{ p.title }}</NuxtLink>
            </h3>
            <p style="margin:.25rem 0 0; color:#6b7280; font-size:.8rem;">{{ formatDate(p.date) }}</p>
            <p v-if="p.description" style="margin:.5rem 0 0; color:#374151; font-size:.95rem;">{{ p.description }}</p>
          </article>
        </li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useAsyncData, useSeoMeta, useHead } from '#imports'
import { useSiteBrand } from '@/composables/useSiteBrand'
import { siteUrl } from '@/utils/siteUrl'

interface PostItem {
  _path: string
  title?: string
  description?: string
  date?: string
}

interface QueryChain<T> {
  sort(sorter: Record<string, 1 | -1>): QueryChain<T>
  only(keys: string[]): QueryChain<T>
  limit(n: number): QueryChain<T>
  find(): Promise<T[]>
}
type QueryContentFn = (path?: string) => QueryChain<PostItem>

const qc = (globalThis as unknown as { queryContent?: QueryContentFn }).queryContent

const { data } = await useAsyncData('home-latest-posts', async () => {
  if (!qc) return [] as PostItem[]
  const list = await qc('/blog')
    .sort({ date: -1 })
    .only(['_path', 'title', 'description', 'date'])
    .limit(3)
    .find()
  return Array.isArray(list) ? list : ([] as PostItem[])
})

const posts = data.value ?? ([] as PostItem[])
const { display, tagline } = useSiteBrand()

function pad(n: number): string { return n < 10 ? '0' + n : String(n) }
function formatDate(d?: string): string {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

useHead({ link: [{ rel: 'canonical', href: siteUrl('/') }] })
useSeoMeta({
  title: `${display} — Tech Tools & Notes`,
  ogTitle: `${display} — Tech Tools & Notes`,
  ogUrl: siteUrl('/'),
})
</script>

<style scoped>
.btn-primary {
  display: inline-block;
  padding: .5rem .9rem;
  border-radius: .5rem;
  background: #2563eb;
  color: #fff;
  text-decoration: none;
}

.btn-primary:focus,
.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  display: inline-block;
  padding: .5rem .9rem;
  border-radius: .5rem;
  background: #111827;
  color: #fff;
  text-decoration: none;
}

.btn-secondary:focus,
.btn-secondary:hover {
  background: #0b1220;
}
</style>
