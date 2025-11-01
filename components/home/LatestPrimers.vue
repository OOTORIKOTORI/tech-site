<script setup lang="ts">
import { computed, ref, onMounted, watchEffect } from 'vue'
import { getToolById } from '@/utils/tool-metadata'
// SSR/CSR両対応のAPIフェッチ（@nuxt/contentを直接叩かず安定させる）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useFetchAny: any = (globalThis as any).useFetch

type BlogItem = {
  path: string
  title?: string
  description?: string
  date?: string | null
  visibility?: string
  tool?: string
}

defineProps<{ hasItems?: boolean }>()
const emit = defineEmits<{
  (e: 'update:hasItems', v: boolean): void
}>()

const list = ref<BlogItem[]>([])

onMounted(async () => {
  try {
    // Nuxt 環境では #imports の useFetch が提供されるが、テストでは globalThis.useFetch を利用
    const fn: any = typeof useFetchAny === 'function' ? useFetchAny : undefined
    if (!fn) return
    const res = await fn('/api/blogv2/list', { server: false })
    const v = (res as any)?.data?.value
    const blog = Array.isArray(v?.blog) ? (v.blog as any[]) : []
    list.value = blog
      .map((i: any) => ({
        path: String(i?.path || ''),
        title: i?.title,
        description: i?.description,
        date: i?.date ?? null,
        visibility: i?.visibility,
        tool: i?.tool,
      }))
      .filter((x) => x.path)
  } catch {
    // ignore: フェッチ失敗時は空表示
  }
})

const primers = computed(() =>
  (list.value || [])
    .filter((i) => (i.visibility || '').toLowerCase() === 'primer')
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 3)
)

const has = computed(() => primers.value.length > 0)

// 子→親: 件数が1件以上なら案内文を隠せるよう通知
watchEffect(() => {
  emit('update:hasItems', has.value)
})
</script>

<template>
  <section v-if="has" aria-labelledby="latest-primers" class="space-y-3">
    <h2 id="latest-primers" class="text-xl font-semibold">最新のPrimer</h2>
    <ul class="grid gap-4 md:grid-cols-3">
      <li v-for="p in primers" :key="p.path" class="surface p-4 rounded">
        <NuxtLink :to="p.path" class="block font-medium hover:underline">{{ p.title }}</NuxtLink>
        <p v-if="p.description" class="text-sm mt-1 line-clamp-2 opacity-80">{{ p.description }}</p>
        <div v-if="p.tool" class="mt-2">
          <NuxtLink v-if="getToolById(p.tool as any)" :to="getToolById(p.tool as any)?.path || '#'"
            class="text-xs text-blue-700 hover:underline">
            該当ツールを見る →
          </NuxtLink>
        </div>
      </li>
    </ul>
  </section>
</template>

<!-- no scoped styles: use global .surface utility -->
