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
import { useHead } from '#imports'

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Migaki Explorer',
  url: 'https://migakiexplorer.jp/',
  sameAs: []
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(orgJsonLd)
    }
  ]
})
</script>
