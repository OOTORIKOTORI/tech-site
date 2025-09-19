<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useHead, useSeoMeta, computed } from '#imports'
import { defaultTitle, defaultDescription, useCanonicalUrl, absoluteUrl, ogDefaultPath } from '@/utils/siteMeta'
import { resolveSiteUrl } from '@/utils/siteUrl'

const canonical = useCanonicalUrl()

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonical.value }
  ]
}))

const siteOrigin = resolveSiteUrl()
const ogImage = computed(() => absoluteUrl(ogDefaultPath, siteOrigin))
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
