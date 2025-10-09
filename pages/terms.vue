<script setup lang="ts">
import { useSeoMeta, useHead } from '#imports'
import { useCanonicalUrl } from '@/utils/siteMeta'

const title = 'Terms of Service'
const description = '本サイトの利用規約の雛形です。'
const canonical = useCanonicalUrl()

useHead(() => ({
  link: [{ rel: 'canonical', href: canonical.value }],
  meta: [{ name: 'robots', content: 'noindex,follow' }]
}))
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
      <h1>利用規約</h1>
      <h2>免責</h2>
      <p>コンテンツおよびツールは現状有姿（AS IS）で提供します。利用に伴う結果は自己責任でお願いします。</p>
      <h2>禁止事項</h2>
      <ul>
        <li>法令・公序良俗に反する行為</li>
        <li>第三者の権利を侵害する行為</li>
      </ul>
      <h2>準拠法・裁判管轄</h2>
      <p>お問い合わせ: <a href="/contact" class="text-blue-600 hover:underline">ootorikotori981@gmail.com</a></p>
      <p>最終更新日: <time :datetime="updatedAt">{{ updatedAt }}</time></p>
    </article>
  </main>
</template>
