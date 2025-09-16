<template>
  <div class="container mx-auto max-w-3xl py-8 px-4">
    <ContentDoc v-slot="{ doc, prev, next, toc }">
      <article>
        <h1 class="text-2xl font-bold mb-2">{{ doc.title }}</h1>
        <div class="text-xs text-gray-500 mb-4">{{ doc.date }}<span v-if="doc.tags"> ｜ {{ doc.tags.join(', ') }}</span>
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
        <div class="flex justify-between mt-8 text-sm">
          <NuxtLink v-if="prev" :to="prev._path">← {{ prev.title }}</NuxtLink>
          <NuxtLink v-if="next" :to="next._path">{{ next.title }} →</NuxtLink>
        </div>
      </article>
    </ContentDoc>
  </div>
</template>

<script setup lang="ts">
import { ContentDoc, ContentRenderer } from '#components'
import { useRoute, useHead } from '#imports'
import { computed } from 'vue'

const SITE_URL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://tech-site-docs.com').replace(/\/$/, '')
const route = useRoute()
const doc = computed(() => route.meta?.doc)

// JSON-LD Article
useHead(() => {
  if (!doc.value) return {}
  return {
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
  }
})
</script>
