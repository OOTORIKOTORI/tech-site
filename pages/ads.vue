<script setup lang="ts">
import { useSeoMeta, useHead } from '#imports'
import { useCanonicalUrl } from '@/utils/siteMeta'

const title = '広告について（Ads Policy）'
const description = 'Migaki Explorer の広告配信・Cookie利用・オプトアウト等に関するポリシーです。'
const canonical = useCanonicalUrl()

useHead(() => ({
  link: [{ rel: 'canonical', href: canonical.value }]
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
      <h1>広告について（Ads Policy）</h1>

      <h2>第三者配信の広告について</h2>
      <p>Migaki Explorer では、第三者配信による広告サービスを利用する場合があります。これらの広告配信業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、Cookie（クッキー）や広告識別子などの技術を使用することがあります。</p>

      <h2>Cookie と広告識別子の利用</h2>
      <p>当サイトおよび第三者配信業者は、ユーザーの過去のアクセス情報に基づいて広告を配信する場合があります。この際、Cookie や類似の技術が使用され、個人を特定できない範囲で情報を収集することがあります。</p>

      <h2>オプトアウト（広告カスタマイズの無効化）</h2>
      <p>Google広告のカスタマイズを無効にするには、<a href="https://adssettings.google.com/" class="text-blue-600 hover:underline focus-ring" rel="noopener noreferrer" target="_blank" aria-label="Google広告設定ページ（外部リンク）">Google広告設定</a>をご利用ください。</p>
      <p>その他の第三者配信業者については、各社のプライバシーポリシーをご確認ください。</p>

      <h2>個人情報の取り扱い</h2>
      <p>広告配信に関連する個人情報の取り扱いについては、<NuxtLink to="/privacy" class="text-blue-600 hover:underline focus-ring">プライバシーポリシー</NuxtLink>をご確認ください。サイト利用規約については<NuxtLink to="/terms" class="text-blue-600 hover:underline focus-ring">利用規約</NuxtLink>をご覧ください。</p>

      <h2>広告掲載基準</h2>
      <p>当サイトでは、コンテンツとの親和性を重視し、ユーザー体験を損なわない範囲で広告を掲載します。不適切な広告についてのご指摘がありましたら、お気軽にご連絡ください。</p>

      <h2>お問い合わせ</h2>
      <p>広告に関するご質問・ご意見は、<NuxtLink to="/contact" class="text-blue-600 hover:underline focus-ring">お問い合わせページ</NuxtLink>よりお寄せください。</p>

      <p class="text-sm text-gray-600 mt-8">最終更新日: <time :datetime="updatedAt">{{ new Date(updatedAt).toLocaleDateString('ja-JP') }}</time></p>
    </article>
  </main>
</template>
