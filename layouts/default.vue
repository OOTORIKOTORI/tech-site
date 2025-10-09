<template>
  <div>
    <AppHeader />
    <main id="main" class="min-h-[70vh] mx-auto max-w-6xl px-4 py-6">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">

// Nuxt auto-import resolves components
import { useHead, useAsyncData } from '#imports'
import { computed } from 'vue'
// queryContent は Nuxt auto-import 依存（明示 import 不可）
import { useRoute } from 'vue-router'

// 既存Organization JSON-LDは維持
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Migaki Explorer',
  url: 'https://migakiexplorer.jp/',
  sameAs: []
}

// 記事ページ用BlogPosting JSON-LD
const route = useRoute()

const isBlog = computed(() => route.path.startsWith('/blog/') && !route.path.startsWith('/blog/_'))
const { data: page } = useAsyncData('blogJsonLd', async () => {
  if (!isBlog.value) return null
  // eslint-disable-next-line no-undef
  const qc = typeof queryContent === 'function' ? queryContent : undefined
  if (!qc) return null
  const res = await (qc as (path: string) => { findOne: () => Promise<unknown> })(route.path).findOne()
  return res || null
})
const blogPost = computed(() => {
  if (!isBlog.value || !page.value) return null
  const p = page.value as Record<string, unknown> | null | undefined
  if (!p || typeof p !== 'object' || !('title' in p)) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: typeof p.title === 'string' ? p.title : undefined,
    description: typeof p.description === 'string' ? p.description : undefined,
    image: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : undefined),
    datePublished: p.date ?? p.datePublished,
    dateModified: p.updatedAt ?? p.dateModified ?? p.date,
    author: p.author ? { '@type': 'Person', name: p.author } : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://migakiexplorer.jp${route.path}` },
    publisher: { '@type': 'Organization', name: 'Migaki Explorer', url: 'https://migakiexplorer.jp/' }
  }
})

useHead(() => {
  const scripts = [
    { type: 'application/ld+json', innerHTML: JSON.stringify(orgJsonLd) }
  ]
  if (blogPost.value) {
    scripts.push({ type: 'application/ld+json', innerHTML: JSON.stringify(blogPost.value) })
  }
  return { script: scripts }
})
</script>
