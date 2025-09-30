<script setup lang="ts">
import { useRoute, useAsyncData, createError, useSeoMeta, useHead } from '#imports'

// Nuxt 4 + @nuxt/content v2: queryContent is global, not auto-imported
const queryContent = (globalThis as any).queryContent

/** safe normalize: keep "/" as is, handle undefined */
const normalize = (p: unknown) => {
  const s = typeof p === 'string' ? p : ''
  if (!s) return '/'
  return s !== '/' && s.endsWith('/') ? s.slice(0, -1) : s
}

const route = useRoute()

/** derive path safely (fallback to params for tests/SSR) */
const pagePath = (() => {
  const p = (route as any)?.path as string | undefined
  if (p && p.length) return normalize(p)
  const raw = route.params?.slug as string | string[] | undefined
  const segs = Array.isArray(raw) ? raw : raw ? [raw] : []
  return normalize('/blog' + (segs.length ? '/' + segs.join('/') : ''))
})()

/** helper: first match without relying on .findOne() typing */
const fetchOne = async (path: string) => {
  const rows = await (queryContent().where({ _path: path }).limit(1).find() as Promise<any[]>)
  return rows[0] || null
}

const { data: doc } = await useAsyncData(`post:${pagePath}`, async () => {
  const exact = await fetchOne(pagePath)
  if (exact) return exact
  return await fetchOne(pagePath + '/')
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

/** SEO */
const title =
  (doc.value as any).title ||
  (doc.value as any).head?.title ||
  (doc.value as any)._path

const canonical =
  (doc.value as any).canonical ||
  (import.meta.client ? window.location.origin + pagePath : undefined)

/** keep canonical in object to satisfy tests; cast to any to avoid TS noise */
useSeoMeta({ title, ogTitle: title, ...(canonical ? { canonical } : {}) } as any)

/** canonical link + JSON-LD */
useHead({
  link: canonical ? [{ rel: 'canonical', href: canonical }] : [],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: String(title || ''),
        datePublished: (doc.value as any).date || (doc.value as any).publishedAt,
        dateModified:
          (doc.value as any).updated ||
          (doc.value as any).updatedAt ||
          (doc.value as any).date,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        publisher: {
          '@type': 'Organization',
          name: 'Migaki Explorer',
          logo: {
            '@type': 'ImageObject',
            url: 'https://migakiexplorer.jp/logo.png',
            width: 512,
            height: 512
          }
        }
      }),
      tagPriority: 'critical'
    }
  ]
})
</script>

<template>
  <main class="container mx-auto px-4 py-6">
    <ContentRenderer :value="doc!" />
  </main>
</template>
