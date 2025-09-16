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
      <NuxtLink v-if="route.query.tag" to="/blog" class="ml-2 text-xs text-gray-600 underline">すべて表示</NuxtLink>
    </div>
    <ContentList path="/blog" v-slot="{ list }">
      <ul class="space-y-6">
        <li v-for="article in filteredList(list)" :key="article._path" class="border-b pb-4">
          <NuxtLink :to="article._path" class="text-xl font-semibold hover:underline">{{ article.title }}</NuxtLink>
          <div class="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
            <span>{{ article.date }}</span>
            <template v-if="article.tags">
              <TagChip v-for="tag in article.tags" :key="tag" :tag="tag" />
            </template>
          </div>
          <div class="mt-2 text-sm text-gray-700 line-clamp-2">{{ article.description }}</div>
        </li>
      </ul>
    </ContentList>
  </div>
</template>

<script setup lang="ts">
import { ContentList } from '#components'
import TagChip from '~/components/TagChip.vue'
import { useRoute } from '#imports'
import { computed } from 'vue'

const route = useRoute()

// タグ一覧を全記事から抽出
const allTags = computed(() => {
  // ContentListのlistはスロットでしか取れないので、タグ絞り込みはfilteredListで都度計算
  // ここではダミーで空配列返す（実際はfilteredListで全記事から抽出）
  return []
})

function filteredList(list: any[]) {
  // date descで並べ替え
  let sorted = [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  // tagクエリで絞り込み
  const tag = route.query.tag
  if (tag) {
    sorted = sorted.filter(a => Array.isArray(a.tags) && a.tags.includes(tag))
  }
  // タグ一覧も更新
  allTags.value = Array.from(new Set(list.flatMap(a => a.tags || [])))
  return sorted
}
</script>
