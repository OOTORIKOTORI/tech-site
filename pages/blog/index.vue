<template>
  <main class="container" style="max-width: 48rem; margin: 0 auto; padding: 2rem 1rem;">
    <header>
      <h1 style="font-size: 1.5rem; font-weight: 700;">Blog</h1>
      <p style="color:#555; font-size: .9rem;">開発ノウハウやツール設計の考察メモ。</p>
    </header>
    <section aria-live="polite" style="margin-top: 1.5rem;">
      <template v-if="posts && posts.length">
        <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem;">
          <li v-for="p in posts" :key="p._path"
            style="border:1px solid #e5e7eb; border-radius:.5rem; padding:1rem; background:#fff;">
            <article :aria-labelledby="'post-' + p.slug">
              <h2 :id="'post-' + p.slug" style="margin:0; font-size: 1.125rem;">
                <NuxtLink :to="p._path" :aria-label="`${p.title ?? 'Post'} の詳細へ`"
                  style="text-decoration: none; color: inherit;">
                  {{ p.title }}
                </NuxtLink>
              </h2>
              <p style="margin:.25rem 0 0; color:#6b7280; font-size:.75rem;">{{ formatDate(p.date) }}</p>
              <p v-if="p.description" style="margin:.5rem 0 0; color:#374151; font-size:.9rem;">{{ p.description }}</p>
            </article>
          </li>
        </ul>
      </template>
      <p v-else role="status" style="color:#555;">No posts yet</p>
    </section>
  </main>
</template>
<script setup lang="ts">
import { useAsyncData, useSeoMeta, useHead } from '#imports'
import { fetchPosts, formatDate, type PostListItem } from '~/composables/usePosts'

const { data } = await useAsyncData('blog-list', () => fetchPosts())
const posts = (data.value ?? []) as PostListItem[]

useHead({ link: [{ rel: 'canonical', href: 'https://kotorilab.jp/blog' }] })
useSeoMeta({
  title: 'Blog | Kotorilab',
  description: 'KOTORI Lab のブログ一覧。開発の気づきや設計メモを短くまとめています。',
  ogTitle: 'Blog | Kotorilab',
  ogUrl: 'https://kotorilab.jp/blog',
})
</script>
