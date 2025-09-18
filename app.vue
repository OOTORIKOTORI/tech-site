<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useHead, useSeoMeta, computed } from '#imports'
import { defaultTitle, defaultDescription, useCanonicalUrl, absoluteUrl, ogDefaultPath } from '@/utils/siteMeta'

const canonical = useCanonicalUrl()

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonical.value }
  ]
}))

const ogImage = computed(() => absoluteUrl(ogDefaultPath))
useSeoMeta({
  title: defaultTitle,
  description: defaultDescription,
  ogSiteName: defaultTitle,
  ogType: 'website',
  ogTitle: defaultTitle,
  ogDescription: defaultDescription,
  ogUrl: () => canonical.value,
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
})
</script>
