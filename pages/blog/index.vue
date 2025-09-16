<template>
  <div class="container mx-auto max-w-3xl py-8 px-4">
    <h1 class="text-2xl font-bold mb-6">Tech Blog</h1>
    <div class="mb-4">
      <NuxtLink to="/tools/cron-jst" class="text-blue-700 underline hover:text-blue-900">Cron JSTツールはこちら</NuxtLink>
    </div>
    <div class="mb-4">
      <span class="text-sm">タグで絞り込み：</span>
      <NuxtLink v-for="t in allTags" :key="t" :to="`/blog?tag=${encodeURIComponent(t)}`" class="mr-2">
        <TagChip :tag="t" />
      </NuxtLink>
      <NuxtLink v-if="tag" to="/blog" class="ml-2 text-xs text-gray-600 underline">すべて表示</NuxtLink>
    </div>
    <ul class="space-y-6">
      <li v-for="article in filtered" :key="article._path" class="border-b pb-4">
        <NuxtLink :to="article._path" class="text-xl font-semibold hover:underline">{{ article.title }}</NuxtLink>
        <div class="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
          <span>{{ article.date }}</span>
          <template v-if="article.tags">
            <TagChip v-for="tg in article.tags" :key="tg" :tag="tg" />
          </template>
        </div>
        <div class="mt-2 text-sm text-gray-700 line-clamp-2">{{ article.description }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import TagChip from '~/components/TagChip.vue'
import { useRoute, useAsyncData } from '#imports'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryContent: any = (globalThis as any).queryContent

type Post = {
  title: string
  description?: string
  date?: string
  author?: string
  tags?: string[]
  _path?: string
}

const route = useRoute()
const tag = ref<string | undefined>(route.query.tag as string | undefined)

const { data: posts } = await useAsyncData<Post[]>('posts', () =>
  queryContent('/blog').sort({ date: -1 }).find()
)

const filtered = computed(() => {
  const list = posts.value || []
  return tag.value ? list.filter(p => (p.tags || []).includes(tag.value!)) : list
})

const allTags = computed(() => Array.from(new Set((posts.value || []).flatMap(p => p.tags || []))))
</script>
