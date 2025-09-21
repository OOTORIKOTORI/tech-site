<script setup lang="ts">
import { useSeoMeta, useHead } from '#imports'
import { useCanonicalUrl } from '@/utils/siteMeta'

const title = 'Ads Policy'
const description = '広告に関する表示の雛形です。'
const canonical = useCanonicalUrl()

useHead(() => ({ link: [{ rel: 'canonical', href: canonical.value }] }))
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: () => canonical.value,
})

const updatedAt = new Date().toISOString()
</script>

<template>
  <main>
    <article class="prose max-w-3xl mx-auto p-6">
      <h1>広告に関する表示</h1>
      <h2>クッキー等の利用</h2>
      <p>広告配信・アクセス解析のために Cookie 等の技術を用いる場合があります。</p>
      <h2>アフィリエイト</h2>
      <p>アフィリエイトプログラムを利用する場合があります（有無はダミー）。</p>
      <p>最終更新日: <time :datetime="updatedAt">{{ updatedAt }}</time></p>
    </article>
  </main>

</template>
