<template>
  <!-- replaced outer <main> with <div> to avoid duplicate main with layout -->
  <div class="container" style="max-width: 48rem; margin: 0 auto; padding: 2rem 1rem;">
    <header>
      <h1 style="font-size: 1.5rem; font-weight: 700;">Blog</h1>
      <p style="color:#555; font-size: .9rem;">開発ノウハウやツール設計の考察メモ。</p>
    </header>
    <section aria-live="polite" style="margin-top: 1.5rem;">
      <template v-if="posts && posts.length">
        <ul role="list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style="list-style: none; padding: 0; margin: 0;">
          <li v-for="post in posts" :key="post._path" role="listitem">
            <NuxtLink :to="post._path" :aria-label="`${post.title ?? 'Post'} の詳細を見る`" class="block h-full focus-ring">
              <article :aria-labelledby="'post-' + post.slug"
                class="h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition-shadow">
                <header>
                  <h2 :id="'post-' + post.slug" class="m-0 text-lg font-semibold">{{ post.title }}</h2>
                  <p class="mt-1 text-xs text-gray-500">{{ formatDateIso(post.date) }}</p>
                </header>
                <p v-if="post.description" class="mt-2 text-sm text-gray-700">{{ post.description }}</p>
              </article>
            </NuxtLink>
          </li>
        </ul>
      </template>
      <p v-else role="status" style="color:#555;">No posts yet</p>
    </section>
  </div>
</template>
<script setup lang="ts">
import { useAsyncData, useSeoMeta, useHead } from '#imports'
import { formatDateIso } from '@/utils/date'
import { useBreadcrumbJsonLd } from '@/composables/useBreadcrumbJsonLd'
import { siteUrl } from '@/utils/siteUrl'
import { fetchPosts, type PostListItem } from '~/composables/usePosts'
const { data } = await useAsyncData('blog-list', () => fetchPosts())
const posts = (data.value ?? []) as PostListItem[]

useHead({ link: [{ rel: 'canonical', href: siteUrl('/blog') }] })
useSeoMeta({
  title: 'Blog',
  description: '開発ノウハウやツール設計の考察メモ。',
  ogTitle: 'Blog',
  ogUrl: siteUrl('/blog'),
})

useBreadcrumbJsonLd([
  { name: 'Home', url: siteUrl('/') },
  { name: 'Blog', url: siteUrl('/blog') },
])
</script>
