<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useHead, useSeoMeta, computed, useServerHead, useRuntimeConfig, useRoute } from '#imports'
import { useDefaultTitle, useDefaultDescription, absoluteUrl, useOgDefaultPath } from '@/utils/siteMeta'
import { useSiteBrand } from '@/composables/useSiteBrand'

const route = useRoute()
type PublicConfig = { siteOrigin?: string; siteUrl?: string; siteName?: string }
const { public: pub } = useRuntimeConfig() as { public: PublicConfig }
const siteOrigin: string = String(pub?.siteOrigin || pub?.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
const siteName: string = String(pub?.siteName || useDefaultTitle())

const ogDefaultPath = useOgDefaultPath()
const { brand } = useSiteBrand()
const displayShort = brand?.short || 'Migaki Explorer'
const ogImage = computed(() => absoluteUrl(ogDefaultPath, siteOrigin))
useSeoMeta({
  title: useDefaultTitle(),
  description: useDefaultDescription(),
  ogSiteName: displayShort,
  ogType: 'website',
  ogTitle: useDefaultTitle(),
  ogDescription: useDefaultDescription(),
  ogUrl: () => `${siteOrigin}${route.fullPath}`,
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
})

// JSON-LD: WebSite and Organization (SSR-safe with fallback)
const setHead = (typeof useServerHead === 'function' ? useServerHead : useHead)

const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: displayShort,
  alternateName: ['Migaki Explorer', 'みがきエクスプローラー'],
  url: siteOrigin,
  logo: `${siteOrigin}/logo.png`
}
const webSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  alternateName: ['Migaki Explorer', 'みがきエクスプローラー'],
  url: siteOrigin,
}
setHead(() => ({
  script: [
    { type: 'application/ld+json', children: JSON.stringify(org) },
    { type: 'application/ld+json', children: JSON.stringify(webSite) }
  ]
}))

// Canonical, RSS link, and site_name meta
useHead(() => ({
  titleTemplate: (title?: string) => (title ? `${title} | ${displayShort}` : String(displayShort)),
  meta: [
    { property: 'og:site_name', content: String(displayShort) },
  ],
  link: [
    { rel: 'canonical', href: `${siteOrigin}${route.fullPath}` },
    { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml', title: `${String(siteName)} Blog` }
  ]
}))
</script>
