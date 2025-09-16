<template>
  <div class="container mx-auto max-w-3xl py-8 px-4">
    <article v-if="doc">
      <h1 class="text-2xl font-bold mb-2">{{ doc.title }}</h1>
      <div class="text-xs text-gray-500 mb-4">
        {{ doc.date }}<span v-if="doc.tags"> ｜ {{ doc.tags.join(', ') }}</span>
      </div>
      <div v-if="toc?.links?.length" class="mb-6">
        <h2 class="text-sm font-semibold mb-1">目次</h2>
        <ul class="text-xs list-disc pl-5">
          <li v-for="link in toc.links" :key="link.id">
            <a :href="`#${link.id}`" class="hover:underline">{{ link.text }}</a>
          </li>
        </ul>
      </div>
      <ContentRenderer :value="doc" />
      <nav class="flex justify-between mt-8 text-sm">
        <NuxtLink v-if="prev" :to="prev._path">← {{ prev.title }}</NuxtLink>
        <NuxtLink v-if="next" :to="next._path">{{ next.title }} →</NuxtLink>
      </nav>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useHead, createError, useAsyncData } from '#imports'
import { ContentRenderer } from '#components'
// queryContent 取得: 型エラー回避のため any, 実行時は Nuxt が提供
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryContent: any = (globalThis as any).queryContent
if (!queryContent) {
  // ビルド時 (typecheck) は参照されるが実行されないため安全
}
// 簡易 Post 型
type Post = {
  title: string
  description?: string
  date?: string
  author?: string
  tags?: string[]
  _path?: string
}

const SITE_URL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://tech-site-docs.com').replace(/\/$/, '')
const route = useRoute()

const { data: doc } = await useAsyncData<Post | null>(`post-${route.params.slug}`, () =>
  queryContent('/blog').where({ _path: `/blog/${route.params.slug}` }).findOne()
)

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

// prev/next を取得 (日付順)
const { data: siblings } = await useAsyncData<Post[]>(`post-siblings`, () =>
  queryContent('/blog').sort({ date: -1 }).find()
)
const list: Post[] = siblings.value || []
const index = list.findIndex(p => p._path === doc.value?._path)
const prev = index > 0 ? list[index - 1] : null
const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null

// TOC 生成（簡易）: doc.body.toc があれば利用
// 型安全を緩めに扱う（content v3 の構造依存）
const toc: any = (doc.value as any)?.body?.toc

useHead({
  title: doc.value.title,
  meta: [
    { name: 'description', content: doc.value.description || '' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: doc.value.title,
        datePublished: doc.value.date,
        author: doc.value.author || 'Tech Site',
        description: doc.value.description,
        url: SITE_URL + (doc.value._path || ''),
        image: SITE_URL + '/favicon.ico'
      })
    }
  ]
})
</script>
