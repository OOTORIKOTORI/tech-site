<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useHead, useSeoMeta, computed } from '#imports'
import { useDefaultTitle, useDefaultDescription, useCanonicalUrl, absoluteUrl, useOgDefaultPath } from '@/utils/siteMeta'
import { resolveSiteUrl } from '@/utils/siteUrl'

const canonical = useCanonicalUrl()

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonical.value },
    { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml', title: 'Kotorilab Blog' }
  ]
}))

const siteOrigin = resolveSiteUrl()
const ogDefaultPath = useOgDefaultPath()
const ogImage = computed(() => absoluteUrl(ogDefaultPath, siteOrigin))
useSeoMeta({
  title: useDefaultTitle(),
  description: useDefaultDescription(),
  ogSiteName: useDefaultTitle(),
  ogType: 'website',
  ogTitle: useDefaultTitle(),
  ogDescription: useDefaultDescription(),
  ogUrl: () => canonical.value,
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
})
</script>
