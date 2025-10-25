<script setup lang="ts">
import { createError, useRoute, useFetch, useSeoMeta, useHead, useRuntimeConfig, computed } from '#imports'
import AdSlot from '@/components/AdSlot.vue'
import Article from '@/components/blog/Article.vue'
// Optional fallback for tests: queryContent when API stub is unavailable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryContent: any = (globalThis as any).queryContent

// No definePageMeta (test env compatibility)

// Route and slug normalization
const route = useRoute()
const raw = (route.params as any)?.slug
const parts = Array.isArray(raw)
  ? raw.map((s: unknown) => decodeURIComponent(String(s)))
  : raw !== undefined
    ? [decodeURIComponent(String(raw))]
    : []
const exactPath = parts.length > 0 ? ('/blog/' + parts.join('/')) : '/blog'

// Minimal type for page consumption
type BlogDoc = {
  id?: string
  path?: string
  title?: string
  description?: string
  date?: string | null
  updated?: string | null
  tags?: string[]
  robots?: string
  ogImage?: string | null
  audience?: string | null
  body?: unknown
  bodyText?: string
  toc?: { links?: Array<{ id?: string; text?: string; depth?: number }> }
}

// Fetch strictly via API with SSR-safe resolver (no relative ofetch)
const { data: doc, error } = await useFetch<BlogDoc>('/api/blogv2/doc', { query: { path: exactPath } })
if (error?.value) {
  throw createError({ statusCode: (error.value as any)?.statusCode ?? 404, statusMessage: 'Post not found' })
}
// Fallback for test env: try @nuxt/content when API is not stubbed
if (!doc.value && typeof queryContent === 'function') {
  try {
    // フォールバック取得は「一法のみ」（findOne(exactPath)）に統一
    const alt = await queryContent(exactPath)?.findOne?.()
    if (alt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).value = alt as any
    }
  } catch {
    // ignore: fallback query for tests only
  }
}
if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

// SEO + Canonical
const cfg = useRuntimeConfig()
const pagePath: string = String((doc.value as any)?.path ?? (doc.value as any)?._path ?? '')
const canonical =
  ((doc.value as any)?.canonical as string | undefined) ||
  String(cfg.public?.siteOrigin || '') + pagePath
useSeoMeta({
  title: (doc.value as any)?.title as any,
  // @ts-expect-error nuxt types may not include canonical/ogUrl
  canonical,
  // Test requirement: ogUrl uses absolute siteOrigin + path
  ogUrl: String(cfg.public?.siteOrigin || '') + pagePath,
  // OG/Twitter
  ogTitle: (doc.value as any)?.title as any,
  ogDescription: (doc.value as any)?.description as any,
  ogImage: ((doc.value as any)?.ogImage as any) || (String(cfg.public?.siteOrigin || '') + '/og-default.png'),
  twitterCard: 'summary_large_image',
})

// robots meta from frontmatter (control-only)
// Policy: non-primer defaults to noindex unless explicitly overridden via frontmatter
{
  const t = ((doc.value as any)?.type || '').toLowerCase()
  const robots = (doc.value as any)?.robots as string | undefined
  const explicit = typeof robots === 'string' && robots.trim().length > 0
  const shouldNoindex = !explicit && t !== 'primer'
  const content = explicit ? robots : shouldNoindex ? 'noindex,follow' : undefined
  if (content) {
    useHead({ meta: [{ name: 'robots', content }] })
  }
}

// BlogPosting JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      // @ts-expect-error tests expect `children` to contain JSON string
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: (doc.value as any)?.title || (pagePath || 'Untitled'),
        description: (doc.value as any)?.description,
        datePublished: (doc.value as any)?.date,
        dateModified: (doc.value as any)?.updated || (doc.value as any)?.date,
        author: {
          '@type': 'Person',
          name: (cfg.public as any)?.authorName || (cfg.public as any)?.siteName,
        },
        image: (doc.value as any)?.ogImage ? [(doc.value as any)?.ogImage] : undefined,
        keywords: Array.isArray((doc.value as any)?.tags)
          ? ((doc.value as any)?.tags as string[]).join(', ')
          : undefined,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': String(cfg.public?.siteOrigin || '') + pagePath,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Migaki Explorer',
          logo: {
            '@type': 'ImageObject',
            url: String(cfg.public?.siteOrigin || '') + '/logo.png',
            width: 512,
            height: 512,
          },
        },
      }),
    },
  ],
})

// Dev log: visibility + body presence
if (import.meta.dev) {
  console.debug('[blog/slug]', {
    routePath: (route as any).fullPath || undefined,
    exactPath,
    hasDoc: !!doc.value,
    hasBody: !!(doc.value as any)?.body,
  })
}

// 前後記事ナビ: 一覧取得し date 降順で現在の前後を特定
type BlogItem = { path: string; date: string | null }
let blogList: BlogItem[] = []
try {
  const r = await useFetch<{ blog: BlogItem[] }>('/api/blogv2/list')
  blogList = r.data.value?.blog || []
} catch {
  // テスト環境などで API スタブが無い場合は空配列でフォールバック
  blogList = []
}
const prevNext = computed(() => {
  const items = blogList.slice().sort((a, b) => {
    const ax = a.date ? new Date(a.date).getTime() : 0
    const bx = b.date ? new Date(b.date).getTime() : 0
    return bx - ax
  })
  const idx = items.findIndex(x => x.path === pagePath)
  return {
    prev: idx > 0 ? items[idx - 1] : null,
    next: idx >= 0 && idx < items.length - 1 ? items[idx + 1] : null,
  }
})

// 安全な表示判定（テスト環境で未スタブでも落ちない）
const hasPrevNext = computed(() => {
  const v = (prevNext as any).value as { prev: BlogItem | null; next: BlogItem | null } | undefined
  return !!(v && (v.prev || v.next))
})

// Related posts by tag overlap (score = number of shared tags), then date desc
const currentTags = computed(() => new Set(((doc.value as any)?.tags) || []))
// 可視性ガード: /blog/_archive 除外・draft/published・本文必須
function visible(doc: any) {
  const isTrue = (v: any) => v === true || v === 'true'
  const isFalse = (v: any) => v === false || v === 'false'
  if (!doc?.path || !doc?.title) return false
  if (/^\/blog\/_archive(\/|$)/.test(doc.path)) return false
  if (isTrue(doc.draft)) return false
  if (isFalse(doc.published)) return false
  if (!doc.body) return false
  return true
}
const related = computed(() => {
  const list = (blogList as any[]) || []
  if (!list.length) return []
  const tags = currentTags.value
  return list
    .filter((p: any) => p.path !== pagePath)
    .filter(visible)
    .map((p: any) => ({ ...p, score: ((p.tags || []) as string[]).filter((t: string) => tags.has(t)).length }))
    .filter((p: any) => p.score > 0)
    .sort((a: any, b: any) => b.score - a.score || (new Date(b.date).getTime() - new Date(a.date).getTime()))
    .slice(0, 3)
})
</script>

<template>
  <main class="container mx-auto px-4 py-6">
    <div v-if="doc?.body">
      <!-- 本文（Articleコンポーネントで描画） -->
      <Article :doc="doc" />

      <!-- 記事下の広告プレースホルダ（noindexの制御ページは除外） -->
      <section v-if="doc?.path !== '/blog/_control'" aria-label="ad-placeholder" class="mt-8">
        <AdSlot height="280px" label="広告（仮）" />
      </section>

      <!-- 前後記事ナビ -->
      <nav v-if="hasPrevNext" class="mt-10 flex justify-between text-sm opacity-80 hover:opacity-100">
        <span>
          <NuxtLink v-if="prevNext?.prev" :to="prevNext?.prev?.path">← 前の記事</NuxtLink>
        </span>
        <span>
          <NuxtLink v-if="prevNext?.next" :to="prevNext?.next?.path">次の記事 →</NuxtLink>
        </span>
      </nav>

      <!-- 関連記事 -->
      <section v-if="related && related.length" aria-labelledby="related-heading" class="mt-12 border-t pt-6">
        <h2 id="related-heading" class="text-base font-semibold opacity-80">関連記事</h2>
        <ul role="list" class="mt-4 grid gap-3">
          <li v-for="p in related" :key="p.path">
            <NuxtLink :to="p.path" class="block hover:underline">
              <span class="font-medium">{{ p.title }}</span>
              <span v-if="p.tags?.length" class="ml-2 text-xs opacity-70">#{{ p.tags.slice(0, 3).join(' #') }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <div v-else class="max-w-prose mx-auto text-center py-16">
      <p class="text-lg">記事が見つかりませんでした。</p>
      <p class="mt-4">
        <NuxtLink to="/blog/" class="underline">記事一覧へ戻る</NuxtLink>
      </p>
    </div>
  </main>
</template>
