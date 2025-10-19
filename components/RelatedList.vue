<script setup lang="ts">
// NOTE: queryContent は #imports から直接 import 禁止（ci:guard）。グローバルまたは動的 import を使用。
import { useAsyncData } from '#imports'

const props = withDefaults(defineProps<{
  tags: string[]
  limit?: number
  excludeSlug?: string
}>(), {
  limit: 3,
  excludeSlug: ''
})

const { data: related } = await useAsyncData(
  `related-${props.tags.join('-')}-${props.excludeSlug}`,
  async () => {
    // eslint-disable-next-line no-undef
    let qc: any = typeof queryContent === 'function' ? queryContent : undefined
    if (!qc) {
      // eslint-disable-next-line no-new-func
      const dynImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>
      const mod = await dynImport('#content')
      qc = mod.queryContent
    }
    if (typeof qc !== 'function') return []

    let query = qc('/blog')
      .where({ tags: { $containsAny: props.tags } })
      .limit(props.limit)

    if (props.excludeSlug) {
      query = query.where({ _path: { $ne: `/blog/${props.excludeSlug}` } })
    }

    return await query.find() as any[]
  }
)
</script>

<template>
  <section v-if="related && related.length > 0" class="mt-8 border-t pt-6">
    <h2 class="text-xl font-semibold mb-4">関連記事</h2>
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="item in related" :key="item._path" class="surface p-4 hover:shadow-md transition">
        <NuxtLink :to="item._path" class="group block focus-ring">
          <h3 class="text-base font-medium text-blue-600 group-hover:underline">{{ item.title }}</h3>
          <p v-if="item.description" class="text-sm muted mt-1">{{ item.description }}</p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
