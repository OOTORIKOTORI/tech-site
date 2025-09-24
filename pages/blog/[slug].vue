<script setup lang="ts">
// @ts-expect-error: Virtual module provided by Nuxt at runtime
import { ContentDoc } from '#components'
import { useRoute, useRuntimeConfig, useAsyncData, useSeoMeta, useHead } from '#imports'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()

// Nuxt tests expose queryContent via globalThis; use it directly here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qc: any = (globalThis as any).queryContent
const { data } = await useAsyncData(`blog:${route.path}`, () => qc(route.path).findOne())
const page = data.value as any

const siteOrigin: string = String(runtimeConfig.public?.siteOrigin || '')
const url = new URL(route.path || '/', siteOrigin).toString()
const canonical: string = (page?.canonical && String(page.canonical)) || url

const title: string = page?.title || ''
const description: string = page?.description || ''

useSeoMeta(
  {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    canonical,
  } as any,
)

const schema = {
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
      children: JSON.stringify(schema),
    } as any,
  ],
})
</script>
<template>
  <!-- ルートの _path と frontmatter に完全追従 -->
  <ContentDoc :surround="false" />
</template>
