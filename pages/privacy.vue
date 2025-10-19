<script setup lang="ts">
import { useSeoMeta, useHead } from '#imports'
import { useCanonicalUrl } from '@/utils/siteMeta'

const title = 'Privacy Policy'
const description = '本サイトのプライバシーポリシーの雛形です。'
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
      <h1 class="page-title">Privacy Policy</h1>

      <p>
        本サイトでは、アクセス解析や広告配信(将来的な運用を含む)に関連して、Cookie
        等の技術を利用して一定の情報を取得する場合があります。取得した情報はサイトの品質改善、セキュリティの確保、コンテンツの最適化のために用いられ、法令および各サービスのポリシーに従って適切に取り扱います。具体的な項目・保存期間・第三者提供の有無などの詳細は、後日、本ページに追記します。
      </p>

      <p>本サイトは、利用者の個人情報を適切に取り扱います。収集目的・範囲・保存期間は必要最小限とし、法令に従います。</p>
      <h2>目的</h2>
      <p>提供するサービスの運営・改善のために利用します。</p>
      <h2>取得情報</h2>
      <p>アクセスログ、Cookie 等の技術情報を取得する場合があります。</p>
      <h2>利用目的</h2>
      <p>品質向上、セキュリティ確保、統計的分析のために用います。</p>
      <h2>問い合わせ先</h2>
      <p>お問い合わせ: <a href="/contact" class="text-blue-600 hover:underline">ootorikotori981@gmail.com</a></p>
      <p>最終更新日: <time :datetime="updatedAt">{{ updatedAt }}</time></p>
    </article>
  </main>
</template>
