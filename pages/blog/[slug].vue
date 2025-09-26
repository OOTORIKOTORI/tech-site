<script setup lang="ts">
import { useRoute, useRuntimeConfig, useAsyncData, useSeoMeta, useHead } from '#imports'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()

// Resolve queryContent at runtime: prefer test stub on global, otherwise lazy-import @nuxt/content
// Prefer sync path under tests; fallback to runtime dynamic import in real build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any
let data: any
if (typeof g.queryContent === 'function') {
  ({ data } = await useAsyncData(`blog:${route.path}`, () => g.queryContent(route.path).findOne()))
} else {
  // Hide import from bundler to avoid rollup resolving '#content' at build time
  // eslint-disable-next-line no-new-func
  const dynImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>
  const mod = await dynImport('#content')
  const qc = mod.queryContent
    ; ({ data } = await useAsyncData(`blog:${route.path}`, () => qc(route.path).findOne()))
}
const page = data.value as any
const doc = data as any

const siteOrigin: string = String(runtimeConfig.public?.siteOrigin || '')
const url = new URL(route.path || '/', siteOrigin).toString()
const canonical = doc.value?.canonical ?? url

const title = doc.value?.title ?? ''
const description = doc.value?.description ?? ''

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: canonical,
  canonical,
} as any)

const blogLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description: description || undefined,
  datePublished: page?.date,
  dateModified: page?.updated || page?.date,
  mainEntityOfPage: canonical,
  url: canonical,
  publisher: {
    '@type': 'Organization',
    name: 'Migaki Explorer',
    logo: {
      '@type': 'ImageObject',
      url: `${siteOrigin}/logo.png`,
      width: 512,
      height: 512,
    },
  },
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(blogLd),
    } as any,
  ],
})
</script>
<template>
  <!-- ルートの _path と frontmatter に完全追従 -->
  <ContentDoc :surround="false" />
</template>
