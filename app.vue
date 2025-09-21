<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useHead, useSeoMeta, computed, useServerHead } from '#imports'
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

// JSON-LD: Organization (SSR-safe with fallback)
type HeadInput = Parameters<typeof useHead>[0]
const setHead: (input: HeadInput) => void =
  (typeof useServerHead === 'function' ? useServerHead : useHead)

const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KOTORI Lab',
  url: 'https://kotorilab.jp',
  logo: '/og-default.png'
}
setHead(() => ({
  script: [
    { type: 'application/ld+json', children: JSON.stringify(org) }
  ]
}))
</script>
