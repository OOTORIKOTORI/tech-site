<script setup lang="ts">
import { useSeoMeta, useHead } from '#imports'
import { useCanonicalUrl } from '@/utils/siteMeta'

const title = 'Privacy Policy'
const description = '本サイトのプライバシーポリシーの雛形です。'
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
      <h1>Privacy Policy</h1>
      <p>本サイトは、利用者の個人情報を適切に取り扱います。収集目的・範囲・保存期間は必要最小限とし、法令に従います。</p>
      <h2>目的</h2>
      <p>提供するサービスの運営・改善のために利用します。</p>
      <h2>取得情報</h2>
      <p>アクセスログ、Cookie 等の技術情報を取得する場合があります。</p>
      <h2>利用目的</h2>
      <p>品質向上、セキュリティ確保、統計的分析のために用います。</p>
      <h2>問い合わせ先</h2>
      <p>お問い合わせ: example@example.com（ダミー）</p>
      <p>最終更新日: <time :datetime="updatedAt">{{ updatedAt }}</time></p>
    </article>
  </main>
</template>
