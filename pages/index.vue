<template>
  <main class="mx-auto max-w-5xl px-6 py-12 space-y-10">
    <!-- Hero -->
    <section class="space-y-4">
      <h1 data-testid="home-hero-heading" class="text-3xl md:text-4xl font-bold">
        毎日の実務を、少し速く・確実に。
      </h1>
      <p class="text-gray-600">
        ブラウザだけで使えるミニツールと、1〜3分で読めるチェックリスト。
      </p>
      <div class="flex flex-wrap gap-3 pt-2">
        <NuxtLink to="/tools"
          class="rounded-lg px-4 py-2 ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2">
          ツールを探す
        </NuxtLink>
        <NuxtLink to="/blog"
          class="rounded-lg px-4 py-2 ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2">
          最新記事を見る
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Tools -->
    <section v-if="featured.length" class="space-y-4">
      <h2 class="text-xl font-semibold">注目のツール</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="item in featured" :key="item.href" :to="item.href"
          class="block rounded-2xl p-4 ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2">
          <div class="font-medium">{{ item.title }}</div>
          <p class="text-sm text-gray-600 mt-1">{{ item.desc }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- Ad placeholder: top page single slot -->
    <section aria-label="ad-placeholder" style="margin-top: 2rem;">
      <AdSlot height="280px" label="広告（仮）" />
    </section>
  </main>
</template>

<script setup lang="ts">

import AdSlot from '@/components/AdSlot.vue'
import { definePageMeta } from '#imports'
definePageMeta({ title: 'Migaki Explorer' })

const featured = [
  { title: 'Cron JST', href: '/tools/cron-jst', desc: 'crontab式をJST/UTCで検証し、次回実行を即確認' },
  { title: 'JWT Decode', href: '/tools/jwt-decode', desc: 'JWTのペイロードをローカルで可視化（秘密鍵不要）' },
  { title: 'OGプレビュー確認', href: '/tools/og-check', desc: '共有時の画像/タイトルと最終URL・ステータスを確認' },
  // { title: 'サイトマップ/robots', href: '/tools/sitemap-robots', desc: 'sitemap.xml と robots.txt の到達性・掲載可否を点検' },
].filter(Boolean)
</script>

<style scoped>
.btn-primary {
  display: inline-block;
  padding: .5rem .9rem;
  border-radius: .5rem;
  background: #2563eb;
  color: #fff;
  text-decoration: none;
}

.btn-primary:focus,
.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  display: inline-block;
  padding: .5rem .9rem;
  border-radius: .5rem;
  background: #111827;
  color: #fff;
  text-decoration: none;
}

.btn-secondary:focus,
.btn-secondary:hover {
  background: #0b1220;
}
</style>
