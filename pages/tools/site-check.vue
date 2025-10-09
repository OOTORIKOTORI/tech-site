<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFetch } from '#app'
const origin = ref('')
const result = ref<any | null>(null)
const err = ref<string | null>(null)
const checking = ref(false)
const robotsSitemaps = computed(() => (result.value?.robots?.sitemapsInRobots ?? []).join(', '))

const doCheck = async () => {
  err.value = null
  result.value = null
  checking.value = true
  try {
    const { data, error } = await useFetch('/api/sitecheck', {
      query: { origin: origin.value },
      lazy: true
    })
    if (error.value) throw error.value
    result.value = data.value
  } catch (e: any) {
    err.value = e?.statusMessage || e?.message || 'Error'
  } finally {
    checking.value = false
  }

  onMounted(() => {
    try {
      origin.value = window.location.origin
    } catch {
      /* noop: window が無い環境(SSR等)では初期化スキップ */
    }
  })
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-6 space-y-6">
    <h1 class="text-2xl font-bold">サイトマップ / robots チェッカー</h1>
    <form @submit.prevent="doCheck" class="space-y-3">
      <label class="block">
        <span class="block text-sm mb-1">Origin</span>
        <input v-model="origin" type="url" required placeholder="https://migakiexplorer.jp"
          class="w-full rounded-md border px-3 py-2" />
      </label>
      <button :disabled="checking" class="rounded-xl px-4 py-2 bg-blue-600 text-white">
        {{ checking ? 'Checking…' : 'Check' }}
      </button>
    </form>
    <p v-if="err" class="text-red-600">{{ err }}</p>
    <section v-if="result" class="space-y-6">
      <div>
        <h2 class="font-semibold mb-2">robots.txt</h2>
        <p class="text-sm text-gray-600">
          {{ result.robots.url }} — status {{ result.robots.status }}
          <span v-if="result.robots.location"> (→ {{ result.robots.location }})</span>
        </p>
        <ul class="list-disc pl-5 text-sm">
          <li>User-agent: * セクション検出: {{ result.robots.hasUserAgentAll ? 'Yes' : 'No' }}</li>
          <li>Disallow: /（全ブロック）: {{ result.robots.disallowAll ? 'Yes' : 'No' }}</li>
          <li>許可全部 (空Disallow): {{ result.robots.allowAll ? 'Yes' : 'No' }}</li>
          <li>Sitemap 行: <span v-if="result.robots.sitemapsInRobots?.length">{{ robotsSitemaps }}</span><span
              v-else>なし</span></li>
        </ul>
        <details class="mt-2">
          <summary class="cursor-pointer text-sm underline">raw</summary>
          <pre class="whitespace-pre-wrap text-xs mt-2">{{ result.robots.raw }}</pre>
        </details>
      </div>
      <div>
        <h2 class="font-semibold mb-2">sitemap.xml</h2>
        <p class="text-sm text-gray-600">
          {{ result.sitemap.url }} — status {{ result.sitemap.status }}
          <span v-if="result.sitemap.location"> (→ {{ result.sitemap.location }})</span>
        </p>
        <ul class="list-disc pl-5 text-sm">
          <li>URL件数: {{ result.sitemap.count }}</li>
          <li>検出ホスト: <span v-if="result.sitemap.hosts?.length">{{ result.sitemap.hosts.join(', ') }}</span><span
              v-else>なし</span></li>
          <li>ホスト一致（{{ origin }}）:
            <strong
              :class="result.sitemap.hostOk ? 'text-green-600' : (result.sitemap.hostOk === false ? 'text-amber-600' : 'text-gray-500')">
              {{ result.sitemap.hostOk === null ? 'N/A' : (result.sitemap.hostOk ? 'OK' : 'Mismatch') }}
            </strong>
          </li>
        </ul>
        <details class="mt-2">
          <summary class="cursor-pointer text-sm underline">sample & raw</summary>
          <pre class="whitespace-pre-wrap text-xs mt-2">Sample:
{{ (result.sitemap.sample || []).join('\n') }}

Raw:
{{ result.sitemap.raw }}</pre>
        </details>
      </div>
    </section>
  </main>
</template>
