<template>
  <section v-if="items && items.length" class="mt-6">
    <h2 class="text-base font-semibold opacity-80">入門（Primer）を読む</h2>
    <ul role="list" class="mt-3 grid gap-3">
      <li v-for="p in items" :key="p.path">
        <NuxtLink :to="p.path" class="block hover:underline">
          <span class="font-medium">{{ p.title }}</span>
          <span v-if="p.description" class="ml-2 text-xs opacity-70">{{ p.description }}</span>
          <span class="ml-2 text-blue-700 text-xs">入門を読む →</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// 型だけ参照できればOK：存在しない環境も許容
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useFetch as nuxtUseFetch } from '#imports'

const props = defineProps<{ toolId: string; limit?: number }>()

interface BlogItem {
  path: string
  title?: string
  description?: string
  tags?: string[]
  type?: string
  tool?: string
  visibility?: string
  robots?: string
}

// 初期は空配列＝即時描画（Suspenseなし）
const rawList = ref<BlogItem[]>([])

onMounted(async () => {
  // 1) 本番：#imports の useFetch、2) テスト：globalThis.useFetch、3) 無ければ何もしない
  let uf: any = typeof nuxtUseFetch === 'function' ? nuxtUseFetch : undefined
  if (!uf && typeof (globalThis as any).useFetch === 'function') {
    uf = (globalThis as any).useFetch
  }
  if (typeof uf !== 'function') return

  try {
    const res = await uf('/api/blogv2/list', { server: false })
    const v = (res as any)?.data?.value ?? {}
    const arr = (v.blog ?? v.items ?? []) as any[]
    rawList.value = Array.isArray(arr)
      ? arr
        .map((i: any) => ({
          path: i?._path || i?.path,
          title: i?.title,
          description: i?.description,
          tags: i?.tags,
          type: i?.type,
          tool: i?.tool,
          visibility: i?.visibility,
          robots: i?.robots,
        }))
        .filter((i) => !!i.path)
      : []
  } catch {
    // フェッチ失敗は黙殺（UIは空のまま）
  }
})

const items = computed(() => {
  const raw = (rawList.value || []) as BlogItem[]
  return raw
    .filter((i) => i && i.path)
    // visibility === 'primer' かつ tool が一致
    .filter((i) => {
      const vis = (i.visibility || '').toLowerCase()
      return vis === 'primer' && i.tool === props.toolId
    })
    .slice(0, props.limit ?? 3)
})
</script>
