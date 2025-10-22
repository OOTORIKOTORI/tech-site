<template>
  <main class="mx-auto max-w-5xl px-6 py-12 space-y-10">
    <!-- Hero -->
    <section class="space-y-4">
      <h1 data-testid="home-hero-heading" class="page-title text-3xl md:text-4xl font-bold">
        毎日の実務を、少し速く・確実に。
      </h1>
      <p class="text-gray-600">
        ブラウザだけで使えるミニツールと、1〜3分で読めるチェックリスト。
      </p>
      <div class="flex flex-wrap gap-3 pt-2">
        <NuxtLink to="/tools"
          class="rounded-lg px-4 py-2 ring-1 ring-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 focus:outline-none focus-visible:ring-2">
          ツールを探す
        </NuxtLink>
        <NuxtLink to="/blog"
          class="rounded-lg px-4 py-2 ring-1 ring-gray-200 dark:ring-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 focus:outline-none focus-visible:ring-2">
          最新記事を見る
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Tools -->
    <section v-if="featured.length" class="space-y-4">
      <h2 class="text-xl font-semibold">注目のツール</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="item in featured" :key="item.href" :to="item.href"
          class="block rounded-2xl p-4 ring-1 ring-gray-200 dark:ring-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 focus:outline-none focus-visible:ring-2">
          <div class="font-medium">{{ item.title }}</div>
          <p class="text-sm text-gray-600 mt-1">{{ item.desc }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- ツール一覧（ダイジェスト） -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">ツール一覧</h2>
        <NuxtLink to="/tools" class="text-sm text-blue-600 hover:underline focus-ring">すべて見る</NuxtLink>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink v-for="t in toolDigest" :key="t.href" :to="t.href"
          class="block rounded-2xl p-4 ring-1 ring-gray-200 dark:ring-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 focus:outline-none focus-visible:ring-2">
          <div class="font-medium">{{ t.title }}</div>
          <p class="text-sm text-gray-600 mt-1">{{ t.desc }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- 最新記事（/blog の新着） -->
    <section aria-labelledby="home-learning" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 id="home-learning" class="text-xl font-semibold">最新記事</h2>
        <NuxtLink to="/blog" class="text-sm text-blue-600 hover:underline focus-ring">すべて見る</NuxtLink>
      </div>
      <div v-if="pending" class="mt-3 text-sm text-muted-foreground">読み込み中…</div>
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink v-for="card in displayCards" :key="card.href" :to="card.href"
          class="block rounded-2xl p-4 ring-1 ring-gray-200 dark:ring-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 focus:outline-none focus-visible:ring-2">
          <div class="font-medium">{{ card.title }}</div>
          <p v-if="card.description" class="text-sm text-gray-600 mt-1">{{ card.description }}</p>
          <p v-if="hasLatestPosts && card.audience" class="mt-1 text-xs opacity-70">for: {{ card.audience }}</p>
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
import { definePageMeta, useAsyncData } from '#imports'
import { computed } from 'vue'
import { fetchPosts } from '@/composables/usePosts'
definePageMeta({ title: 'Migaki Explorer' })

const featured = [
  { title: 'Cron JST', href: '/tools/cron-jst', desc: 'crontab式をJST/UTCで検証し、次回実行を即確認' },
  { title: 'JWT Decode', href: '/tools/jwt-decode', desc: 'JWTのペイロードをローカルで可視化（秘密鍵不要）' },
  { title: 'OGプレビュー確認', href: '/tools/og-check', desc: '共有時の画像/タイトルと最終URL・ステータスを確認' },
  // { title: 'サイトマップ/robots', href: '/tools/sitemap-robots', desc: 'sitemap.xml と robots.txt の到達性・掲載可否を点検' },
].filter(Boolean)

// ツールのダイジェスト（上位4件）
const toolDigest = [
  { title: 'Cron JST', href: '/tools/cron-jst', desc: 'crontab式をJST/UTCで検証' },
  { title: 'JWT Decode', href: '/tools/jwt-decode', desc: 'JWTのペイロードをローカルで可視化' },
  { title: 'OGプレビュー確認', href: '/tools/og-check', desc: '共有時の画像/タイトルと最終URLを確認' },
  { title: 'Top Log Analyzer', href: '/tools/top-analyzer', desc: 'topログを解析してCPU/Load/Memを可視化' },
]

// ブログ最新 4 件（audience 必須 / draft != true / published != false）
type HomePost = {
  _path: string
  title?: string
  description?: string
  date?: string
  audience?: string
  draft?: boolean
  published?: boolean
}
type DisplayCard = { href: string; title: string; description?: string; audience?: string }

const fallbackCards: DisplayCard[] = [
  {
    href: '/blog',
    title: 'ブログトップで更新情報を確認',
    description: '公開準備中の記事は順次追加されます。まずはブログ一覧をご覧ください。',
  },
  {
    href: '/tools',
    title: '人気ツールをチェック',
    description: '新着記事が揃うまで、実務支援ツールで作業を効率化できます。',
  },
]

const { data: latestPosts, pending } = await useAsyncData<HomePost[]>('home-latest-posts', async () => {
  // Fetch more than needed, then filter/slice for robustness
  const posts = await fetchPosts({ limit: 12 })
  const filtered = posts
    .filter(p => !!p?.audience && p?.draft !== true && p?.published !== false)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 4)
  return filtered
})

const hasLatestPosts = computed(() => Array.isArray(latestPosts.value) && latestPosts.value.length > 0)

const displayCards = computed<DisplayCard[]>(() => {
  if (hasLatestPosts.value) {
    const posts = Array.isArray(latestPosts.value) ? latestPosts.value : []
    return posts.map(post => ({
      href: post._path,
      title: post.title ?? 'タイトル準備中',
      description: post.description,
      audience: post.audience,
    }))
  }
  return fallbackCards
})
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
