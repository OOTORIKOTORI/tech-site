<template>
  <article class="prose dark:prose-invert max-w-none">
    <!-- タイトル -->
    <header class="mb-6">
      <h1 class="!mb-2">{{ doc.title }}</h1>

      <!-- メタ行 -->
      <p class="text-sm muted not-prose">
        <time :datetime="publishedDate">{{ formatDate(publishedDate) }}</time>
        <span v-if="updatedDate && updatedDate !== publishedDate">（更新: {{ formatDate(updatedDate) }}）</span>
        <span v-if="audienceLabel">・対象: {{ audienceLabel }}</span>
        <span v-if="doc.tags?.length">・タグ: {{ doc.tags.join(', ') }}</span>
      </p>

      <!-- 誰向け/得られること -->
      <div class="mt-3 grid gap-2 text-sm not-prose">
        <p v-if="doc.for">この記事は <strong>{{ doc.for }}</strong> 向けです。</p>
        <p v-if="doc.benefits">読むと <strong>{{ doc.benefits }}</strong> が分かります。</p>
      </div>

      <!-- ヒーロー画像（任意） -->
      <img v-if="doc.hero" :src="absolute(doc.hero)" :alt="doc.title" class="rounded-xl mt-4" />
    </header>

    <!-- 目次（自動） -->
    <BlogToc :toc="doc.body?.toc || doc.toc" />

    <!-- 本文（正準1行） -->
    <ContentRenderer v-if="doc?.body" :value="doc" />

    <!-- シリーズ導線 -->
    <SeriesNav :doc="doc" />

    <!-- 更新履歴（frontmatter: updates[]） -->
    <section v-if="doc.updates?.length" class="mt-10 not-prose">
      <h2 class="text-base font-semibold mb-2">更新履歴</h2>
      <ul class="list-disc pl-6 space-y-1 text-sm">
        <li v-for="u in doc.updates" :key="u.date">
          <time :datetime="u.date">{{ formatDate(u.date) }}</time> — {{ u.note }}
        </li>
      </ul>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, useHead, useRuntimeConfig } from '#imports'

const props = defineProps<{ doc: any }>()
const config = useRuntimeConfig()
const origin = config.public?.siteOrigin || 'https://migakiexplorer.jp'
const absolute = (p?: string) => !p ? '' : (p.startsWith('http') ? p : origin + p)
const audienceLabel = computed(() => Array.isArray(props.doc?.audience) ? props.doc.audience.join(' / ') : props.doc?.audience)
const fmt = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' })
const formatDate = (d?: string) => d ? fmt.format(new Date(d)) : ''

// 互換性: date/publishedAt, updated/updatedAt を両方サポート
const publishedDate = computed(() => props.doc?.publishedAt || props.doc?.date)
const updatedDate = computed(() => props.doc?.updatedAt || props.doc?.updated)

// head（最小）
useHead(() => {
  const title = props.doc?.title || 'Blog'
  const desc = props.doc?.description || ''
  const img = absolute(props.doc?.ogImage || props.doc?.hero || '/og-default.png')
  const url = absolute(props.doc?._path || props.doc?.path || '/')
  return {
    title,
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: title },
      { property: 'og:description', content: desc },
      { property: 'og:image', content: img },
      { property: 'og:url', content: url },
      { name: 'twitter:card', content: 'summary_large_image' }
    ]
  }
})
</script>
