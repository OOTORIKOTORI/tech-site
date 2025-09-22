<template>
  <main class="container" style="max-width: 48rem; margin: 0 auto; padding: 2rem 1rem;">
    <p>
      <NuxtLink to="/blog">← Back to Blog</NuxtLink>
    </p>
    <article v-if="doc">
      <header>
        <h1 style="margin:0 0 .25rem 0;">{{ doc.title }}</h1>
        <p style="color:#6b7280; font-size:.8rem;">{{ formatDate(doc.date) }}</p>
      </header>
      <ContentRenderer :value="doc" />
    </article>
  </main>
</template>
<script setup lang="ts">
import { useRoute, useAsyncData, createError, useHead, useSeoMeta, useServerHead, useRuntimeConfig } from '#imports'

interface BlogDoc {
  _path: string
  title?: string
  description?: string
  date?: string
  updated?: string
  image?: string | { src?: string } | Array<string | { src?: string }>
  canonical?: string
  // eslint-disable-next-line @typescript-eslint/ban-types
  body?: object
}

interface QueryChain<T> {
  where(cond: Record<string, unknown>): QueryChain<T>
  findOne(): Promise<T | null>
}
type QueryContentFn = (path?: string) => QueryChain<BlogDoc>

const route = useRoute()
const slugParam = route.params?.slug
const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : ''

const qc = (globalThis as unknown as { queryContent?: QueryContentFn }).queryContent

const { data } = await useAsyncData('blog-doc-' + slug, async () => {
  if (!qc || !slug) return null
  return await qc('/blog').where({ _path: `/blog/${slug}` }).findOne()
})

let doc: BlogDoc | null = null
const v: unknown = (data as unknown as { value: unknown }).value
if (v && typeof (v as { then?: unknown }).then === 'function') {
  doc = (await (v as Promise<BlogDoc | null>)) ?? null
} else if (typeof v === 'function') {
  const res = (v as () => Promise<BlogDoc | null> | BlogDoc | null)()
  doc = (await Promise.resolve(res)) ?? null
} else {
  doc = (v as BlogDoc | null) ?? null
}
if (!doc) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

function pad(n: number): string { return n < 10 ? '0' + n : String(n) }
function formatDate(d?: string): string {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

useHead({
  link: doc.canonical ? [{ rel: 'canonical', href: doc.canonical }] : [],
})

const title = doc.title ?? 'Blog Post | Kotorilab'
const description = doc.description ?? 'Kotorilab blog post'
const canonical = doc.canonical

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: canonical,
})

// JSON-LD: BlogPosting (SSR)
type PublicConfig = { siteOrigin?: string; siteUrl?: string; siteName?: string }
const { public: pub } = useRuntimeConfig() as { public: PublicConfig }
const siteOrigin: string = String(pub?.siteOrigin || pub?.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
const routePath = route.path || doc._path || '/'

function toAbsoluteImageUrl(img: unknown): string | undefined {
  if (!img) return undefined
  const origin = siteOrigin.replace(/\/$/, '')
  const push = (p?: string) => {
    if (!p) return undefined
    try {
      new URL(p)
      return p
    } catch {
      return `${origin}${p.startsWith('/') ? '' : '/'}${p}`
    }
  }
  if (typeof img === 'string') return push(img)
  if (Array.isArray(img)) {
    for (const it of img) {
      const v = typeof it === 'string' ? it : (it && typeof it === 'object' ? (it as { src?: string }).src : undefined)
      const abs = push(v)
      if (abs) return abs
    }
    return undefined
  }
  if (typeof img === 'object' && img) return push((img as { src?: string }).src)
  return undefined
}

const setHead = (typeof useServerHead === 'function' ? useServerHead : useHead)

const imageAbs = toAbsoluteImageUrl(doc.image)
const postLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: doc.title || '',
  description: doc.description || '',
  datePublished: doc.date || '',
  dateModified: doc.updated || doc.date || '',
  author: { '@type': 'Person', name: String(pub?.siteName || '磨きエクスプローラー') },
  mainEntityOfPage: { '@type': 'WebPage', '@id': siteOrigin + routePath },
  publisher: {
    '@type': 'Organization',
    name: 'Migaki Explorer',
    url: siteOrigin,
    logo: {
      '@type': 'ImageObject',
      url: siteOrigin + '/logo.png',
      width: 512,
      height: 512
    }
  },
  ...(imageAbs ? { image: [imageAbs] } : {}),
}
setHead(() => ({
  script: [
    { type: 'application/ld+json', children: JSON.stringify(postLd) }
  ]
}))
</script>
