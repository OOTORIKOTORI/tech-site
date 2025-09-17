<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useHead, useRoute, useRuntimeConfig, useRequestURL, computed } from '#imports'
const route = useRoute()
const config = useRuntimeConfig()
const base = (config.public.siteUrl || '').replace(/\/$/, '')
// SSR 時 useRequestURL で origin が取れればそちら優先
const reqUrl = useRequestURL()
const origin = reqUrl?.origin && reqUrl.origin !== 'null' ? reqUrl.origin : base
const canonical = computed(() => origin + route.fullPath)
useHead(() => ({
  link: [
    { rel: 'canonical', href: canonical.value }
  ]
}))
</script>
