<script setup lang="ts">
import { createError, definePageMeta, useRoute, useFetch } from '#imports'

// Page meta: one-time, no await
definePageMeta({ layout: 'default' })

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
type BlogDoc = { id?: string; path?: string; title?: string; body?: unknown }

// Fetch strictly via API with SSR-safe resolver (no relative ofetch)
const { data: doc, error } = await useFetch<BlogDoc>('/api/blogv2/doc', { query: { path: exactPath } })
if (error.value) {
  throw createError({ statusCode: (error.value as any)?.statusCode ?? 404, statusMessage: 'Post not found' })
}
if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

// Dev log: visibility + body presence
import.meta.dev &&
  console.debug('[blog/slug]', {
    routePath: (route as any).fullPath || undefined,
    exactPath,
    hasDoc: !!doc.value,
    hasBody: !!(doc.value as any)?.body,
  })
</script>

<template>
  <main class="container mx-auto px-4 py-6">
    <!-- ...既存のブログ記事表示UI... -->
    <article v-if="doc && doc.body">
      <h1>{{ typeof doc.title === 'string' ? doc.title : (typeof doc.path === 'string' ? doc.path : 'Untitled') }}
      </h1>
      <ContentRenderer :value="doc" />
    </article>
  </main>
</template>
