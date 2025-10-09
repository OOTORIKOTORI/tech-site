<template>
  <section class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-semibold text-gray-900 mb-6">Tools</h1>

    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Available tools">
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/cron-jst" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">Cron JST</h2>
          <p class="text-gray-600">crontab を JST で試しやすく。</p>
        </NuxtLink>
      </li>
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/jwt-decode" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">JWT Decode</h2>
          <p class="text-gray-600">JWT をブラウザで安全にデコード。</p>
        </NuxtLink>
      </li>
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/og-check" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">OGプレビュー確認</h2>
          <p class="text-gray-600">リダイレクト連鎖と最終URL/ステータスを確認</p>
        </NuxtLink>
      </li>
      <li class="border rounded-lg p-4 bg-white">
        <NuxtLink to="/tools/site-check" class="group block focus-ring">
          <h2 class="text-lg font-medium text-blue-600 group-hover:underline">サイトマップ / robots チェッカー</h2>
          <p class="text-gray-600">robots.txt と sitemap.xml のステータス/要約を確認</p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
useHead({ title: 'Tools' })
</script>
