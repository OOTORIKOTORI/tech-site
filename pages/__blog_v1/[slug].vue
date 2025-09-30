<template>
  <main class="mx-auto max-w-3xl px-4 py-10">
    <div v-if="error" class="text-red-600">Failed to load: {{ error.statusMessage || (error as any).message }}</div>
    <article v-else-if="doc">
      <h1 class="text-3xl font-semibold mb-4">{{ (doc as any).title || (doc as any)._path }}</h1>
      <p v-if="(doc as any).description" class="text-gray-500 mb-6">{{ (doc as any).description }}</p>
      <ContentRenderer :value="doc" />
    </article>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useFetch, useSeoMeta, useHead, useRuntimeConfig, definePageMeta } from '#imports'
definePageMeta({ name: 'blog-slug-v2-param' })
const route = useRoute()
const path = computed(() => route.path)
const { data: doc, error } = await useFetch<any>('/api/blogv2/doc', { query: { path }, server: true })

// Minimal SEO + JSON-LD (same as catch-all)
const cfg = useRuntimeConfig() as any
const siteOrigin: string = cfg?.public?.siteOrigin || ''
const canonical = computed(() => (doc.value as any)?.canonical || (siteOrigin + (doc.value as any)?._path || ''))
const title = computed(() => (doc.value as any)?.title || (doc.value as any)?._path || 'Blog')
const description = computed(() => (doc.value as any)?.description || '')

useSeoMeta({
  title: title.value,
  description: description.value,
  ogTitle: title.value,
  ogDescription: description.value,
  ogUrl: canonical.value,
})

useHead(() => {
  const d: any = doc.value || {}
  if (!d || !d._path) return {}
  const name = 'Migaki Explorer'
  const logoUrl = siteOrigin ? `${siteOrigin}/logo.png` : '/logo.png'
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: d.title || d._path,
    datePublished: d.date || undefined,
    dateModified: d.updated || d.date || undefined,
    url: d.canonical || (siteOrigin ? siteOrigin + d._path : d._path),
    publisher: {
      '@type': 'Organization',
      name,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 512,
        height: 512,
      },
    },
  }
  return {
    script: [
      { type: 'application/ld+json', children: JSON.stringify(jsonld) },
    ],
  }
})
</script>
<!-- Archived v1 page kept for reference only (not routed). -->
