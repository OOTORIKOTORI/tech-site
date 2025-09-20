<template>
  <div class="container mx-auto max-w-4xl py-10 px-4">
    <NuxtLink to="/blog" class="text-sm text-blue-600 hover:underline">← 一覧へ戻る</NuxtLink>
    <div class="mt-6 lg:grid lg:grid-cols-[1fr_220px] lg:gap-10">
      <article v-if="doc" class="prose prose-sm sm:prose base lg:prose-lg max-w-none">
        <header>
          <h1 class="mb-2">{{ (doc as any).title }}</h1>
          <p class="text-gray-500 text-xs">{{ formatDate((doc as any).date) }}</p>
          <p v-if="(doc as any).description" class="mt-2 text-gray-600 text-sm">{{ (doc as any).description }}</p>
          <hr class="my-6" />
        </header>
        <ContentRenderer :value="doc" />
        <footer class="mt-12 pt-6 border-t text-xs text-gray-500">
          <p>Published: {{ formatDate((doc as any).date) }}</p>
        </footer>
        <nav class="mt-12 flex flex-col gap-3">
          <NuxtLink v-if="prev" :to="prev._path" class="text-sm group">
            <span class="block text-gray-400 text-xs">前の記事</span>
            <span class="group-hover:underline">{{ prev.title }}</span>
          </NuxtLink>
          <NuxtLink v-if="next" :to="next._path" class="text-sm group">
            <span class="block text-gray-400 text-xs">次の記事</span>
            <span class="group-hover:underline">{{ next.title }}</span>
          </NuxtLink>
        </nav>
      </article>
      <aside class="mt-10 lg:mt-0">
        <div v-if="toc.length" class="sticky top-24 border rounded p-4 bg-white shadow-sm">
          <p class="font-semibold text-sm mb-2">目次</p>
          <ul class="space-y-1 text-xs">
            <li v-for="h in toc" :key="h.id" :class="'ml-' + (h.depth - 2) * 4">
              <a :href="'#' + h.id" class="hover:underline">{{ h.text }}</a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRoute, useAsyncData, createError, useHead, useSeoMeta, computed } from '#imports'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryContent: any = (globalThis as any).queryContent
const route = useRoute()

function pad(n: number) { return n < 10 ? '0' + n : '' + n }
function formatDate(d?: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

const slug = route.params.slug as string

const { data: doc } = await useAsyncData('blog-doc-' + slug, () =>
  queryContent('/blog').where({ _path: '/blog/' + slug }).findOne()
)

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const { data: surrounding } = await useAsyncData('blog-surround-' + slug, () => {
  const path = (doc.value as any)?._path
  return path
    ? queryContent('/blog')
      .sort({ date: -1 })
      .only(['title', '_path', 'date'])
      .findSurround(path)
    : Promise.resolve([])
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prev = computed(() => (surrounding.value as any)?.[0])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const next = computed(() => (surrounding.value as any)?.[1])

const toc = computed(() => {
  if (!doc.value || !(doc.value as any).body?.children) return [] as Array<{ id: string; depth: number; text: string }>
  const list: Array<{ id: string; depth: number; text: string }> = []
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.tag && /^h[2-3]$/.test(n.tag) && n.props?.id) {
        const textNode = (n.children || []).find((c: any) => typeof c.value === 'string')
        list.push({ id: n.props.id, depth: Number(n.tag[1]), text: textNode?.value || '' })
      }
      if (Array.isArray(n.children)) walk(n.children)
    }
  }
  walk((doc.value as any).body.children)
  return list
})

useHead(() => ({
  title: (doc.value as any)?.title,
  meta: [
    (doc.value as any)?.description ? { name: 'description', content: (doc.value as any).description } : {},
    (doc.value as any)?.description ? { property: 'og:description', content: (doc.value as any).description } : {},
    (doc.value as any)?.title ? { property: 'og:title', content: (doc.value as any).title } : {},
  ].filter(Boolean) as any,
  link: (
    (doc.value as any)?.canonical
      ? [{ rel: 'canonical', href: (doc.value as any).canonical }]
      : []
  ) as any,
}))
const canonicalUrl = computed(() => (doc.value as any)?.canonical as string | undefined)
useSeoMeta({
  title: computed(() => (doc.value as any)?.title as string | undefined).value,
  description: computed(() => (doc.value as any)?.description as string | undefined).value,
  ogTitle: computed(() => (doc.value as any)?.title as string | undefined).value,
  ogDescription: computed(() => (doc.value as any)?.description as string | undefined).value,
  ogUrl: canonicalUrl.value,
})
</script>
