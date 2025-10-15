<template>
  <section class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-semibold text-gray-900 mb-6">Tools</h1>

    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Available tools">
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/cron-jst" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">Cron JST</h2>
        </NuxtLink>
        <p class="text-sm text-gray-600 mt-1">サーバ運用や定時実行の確認に。crontab の式を <b>JST/UTC</b> で即座に検証、次回実行がひと目でわかる。</p>
      </li>
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/jwt-decode" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">JWT Decode</h2>
        </NuxtLink>
        <p class="text-sm text-gray-600 mt-1">認証トークンの中身を<b>ローカルで</b>確認。ペイロードを安全に可視化（秘密鍵は不要）。</p>
      </li>
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/og-check" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">OGプレビュー確認</h2>
        </NuxtLink>
        <p class="text-sm text-gray-600 mt-1">共有時の<b>画像/タイトル</b>の状態と、最終URL・HTTPステータスを一発チェック。</p>
      </li>
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/site-check" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">サイトマップ / robots チェッカー</h2>
        </NuxtLink>
        <p class="text-sm text-gray-600 mt-1">/sitemap.xml と /robots.txt をまとめて確認。<b>掲載可否と到達性</b>を素早く点検。</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
useHead({ title: 'Tools' })
</script>
