<script setup lang="ts">
/* global queryContent */
import { useRoute, useSeoMeta, useHead, useRuntimeConfig, computed, showError } from '#imports'
import AdSlot from '@/components/AdSlot.vue'

type TocLink = { id?: string; text?: string; depth?: number }
type BlogDoc = {
  _path?: string
  path?: string
  title?: string
  description?: string
  date?: string | null
  updated?: string | null
  tags?: string[]
  robots?: string
  ogImage?: string | null
  canonical?: string | null
  body?: unknown
  bodyText?: string
  toc?: { links?: TocLink[] }
}

function assertDocHasBody(d: BlogDoc | null): asserts d is BlogDoc {
  if (!d || !d.body) {
    showError({ statusCode: 404, statusMessage: 'Post not found' })
  }
}

// Route and slug normalization (strict single-path)
const route = useRoute()
const raw = (route.params as Record<string, unknown>).slug
const slug = Array.isArray(raw)
  ? raw.map(s => decodeURIComponent(String(s))).join('/')
  : raw != null
    ? decodeURIComponent(String(raw))
    : ''
const path = '/blog/' + slug

// Strict fetch by _path
// @ts-expect-error: グローバルqueryContentは実行時に必ず存在する
const doc = await queryContent<BlogDoc>().where({ _path: path }).findOne()

// 404 if not found or no body (narrow type)
assertDocHasBody(doc)

// SEO + Canonical
const cfg = useRuntimeConfig()
const pagePath = doc._path ?? doc.path ?? path
const canonical =
  (doc.canonical ?? undefined) ||
  (String(cfg.public?.siteOrigin || '') + pagePath)

useSeoMeta({
  title: doc.title,
  // @ts-expect-error: canonical is accepted by useSeoMeta in runtime
  canonical,
  // Test requirement: ogUrl uses absolute siteOrigin + path
  ogUrl: String(cfg.public?.siteOrigin || '') + pagePath,
  ogTitle: doc.title,
  ogDescription: doc.description,
  ogImage: doc.ogImage || (String(cfg.public?.siteOrigin || '') + '/og-default.png'),
  twitterCard: 'summary_large_image'
})

// robots meta for control
if (path === '/blog/_control') {
  useHead({ meta: [{ name: 'robots', content: 'noindex,follow' }] })
}

// BlogPosting JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      // @ts-expect-error: children is a stringified JSON
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: doc.title || (pagePath || 'Untitled'),
        description: doc.description || undefined,
        datePublished: doc.date || undefined,
        dateModified: doc.updated || doc.date || undefined,
        author: {
          '@type': 'Person',
          name: (cfg.public as Record<string, unknown>)?.['authorName'] || (cfg.public as Record<string, unknown>)?.['siteName']
        },
        image: doc.ogImage ? [doc.ogImage] : undefined,
        keywords: Array.isArray(doc.tags) ? doc.tags.join(', ') : undefined,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': String(cfg.public?.siteOrigin || '') + pagePath
        },
        publisher: {
          '@type': 'Organization',
          name: 'Migaki Explorer',
          logo: {
            '@type': 'ImageObject',
            url: String(cfg.public?.siteOrigin || '') + '/logo.png',
            width: 512,
            height: 512
          }
        }
      })
    }
  ]
})

// 読了目安（1分=約400文字）
const minutes = computed(() =>
  Math.max(1, Math.round(((doc?.bodyText?.length ?? 0) / 400)))
)

// 前後記事ナビ（安全なダミー: 既存UI維持・外部依存なし）
type NavItem = { path: string; date: string | null }
const prevNext = computed<{ prev: NavItem | null; next: NavItem | null }>(() => ({ prev: null, next: null }))
const hasPrevNext = computed<boolean>(() => !!(prevNext.value.prev || prevNext.value.next))

// 関連記事（安全なダミー）
const related = computed<Array<{ path: string; title?: string; tags?: string[] }>>(() => [])
</script>

<template>
  <main class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- ToC -->
      <aside v-if="doc?.toc?.links?.length" class="lg:col-span-3 sticky top-24 self-start text-sm">
        <p class="mb-2 font-medium opacity-80">目次</p>
        <nav>
          <ul>
            <li v-for="(l, i) in (doc.toc.links || [])" :key="i"
              :class="['my-1', l.depth ? `ml-${(l.depth - 1) * 2}` : '']">
              <a class="hover:underline" :href="l.id ? ('#' + l.id) : undefined">{{ l.text }}</a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 本文 -->
      <div class="lg:col-span-9">
        <article v-if="doc?.body"
          class="prose prose-slate max-w-none opacity-100 prose-a:underline-offset-2 hover:prose-a:underline prose-a:font-medium prose-ul:ml-6 prose-ol:ml-6 prose-li:my-1">
          <h1 class="flex items-baseline gap-3">
            <span>
              {{ typeof doc.title === 'string' ? doc.title : (typeof doc.path === 'string' ? doc.path : 'Untitled') }}
            </span>
            <small class="text-sm opacity-70">（約 {{ minutes }} 分）</small>
          </h1>
          <!-- テンプレ1行規則: 本文は ContentRenderer の1行で描画（v-if 付き） -->
          <ContentRenderer v-if="doc?.body" :value="doc" />
        </article>

        <div v-else class="max-w-prose mx-auto text-center py-16">
          <p class="text-lg">記事が見つかりませんでした。</p>
          <p class="mt-4">
            <NuxtLink to="/blog/" class="underline">記事一覧へ戻る</NuxtLink>
          </p>
        </div>

        <!-- 記事下の広告プレースホルダ（noindexの制御ページは除外） -->
        <section v-if="doc?.body && doc?.path !== '/blog/_control'" aria-label="ad-placeholder" class="mt-8">
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
    </div>
  </main>
</template>
